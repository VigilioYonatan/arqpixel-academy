/**
 * P2 L1254: Rich Eventual Consistency, Saga & Outbox compound cross-fault simulator.
 * Models compound real-world failures (crash post-commit + redelivery, PSP timeout + compensation race,
 * out-of-order events v2-before-v1, poison pill + DLQ isolation) across 5 state stores.
 */

export type CrossFaultScenarioId =
  | 'commit_crash_plus_broker_redelivery'
  | 'psp_timeout_plus_compensation_race'
  | 'out_of_order_versioned_events'
  | 'poison_pill_plus_dlq_isolation';

export type CrossFaultSafeguards = {
  readonly transactionalOutbox: boolean;
  readonly inboxIdempotency: boolean;
  readonly versionOrderingGuard: boolean;
  readonly compensatingSagaAndDlq: boolean;
};

export type CrossFaultScenarioMeta = {
  readonly id: CrossFaultScenarioId;
  readonly label: string;
  readonly injectedFaults: readonly [string, string];
};

export const CROSS_FAULT_SCENARIOS: readonly CrossFaultScenarioMeta[] = Object.freeze([
  {
    id: 'commit_crash_plus_broker_redelivery',
    label: 'Fallo cruzado 1 · Caída tras COMMIT SQL + Reentrega duplicada del Broker',
    injectedFaults: [
      'El proceso muere 5 ms después del COMMIT local antes de enviar por red',
      'Al recuperar, el relay publica dos veces el mismo OrderPlaced por ACK perdido',
    ],
  },
  {
    id: 'psp_timeout_plus_compensation_race',
    label: 'Fallo cruzado 2 · Stock reservado + Timeout PSP + Webhook tardío cruzado',
    injectedFaults: [
      'Inventario descuenta 2 unidades, pero el PSP supera el timeout de 1.500 ms',
      'La Saga ejecuta compensación de stock mientras llega un webhook duplicado tardío',
    ],
  },
  {
    id: 'out_of_order_versioned_events',
    label: 'Fallo cruzado 3 · Reordenamiento de partición (llega OrderCancelled v3 antes que OrderPaid v2)',
    injectedFaults: [
      'Dos workers leen de la cola con latencia desigual',
      'El evento antiguo v2 intenta sobrescribir un agregado ya en versión v3',
    ],
  },
  {
    id: 'poison_pill_plus_dlq_isolation',
    label: 'Fallo cruzado 4 · Mensaje corrupto (Poison Pill) + Pico de pedidos sanos detrás',
    injectedFaults: [
      'Un evento malformado provoca excepción determinista en el consumidor',
      '300 pedidos válidos aguardan en la misma cola detrás del mensaje tóxico',
    ],
  },
]);

export type LedgerStateSnapshot = {
  readonly ordersDbState: string;
  readonly outboxPending: number;
  readonly inventoryDeltaUnits: number;
  readonly paymentChargesCount: number;
  readonly dlqIsolatedCount: number;
};

export type CrossFaultSimulationResult = {
  readonly scenario: CrossFaultScenarioMeta;
  readonly consistent: boolean;
  readonly invariantStatus: 'PASS' | 'FAIL';
  readonly finalState: LedgerStateSnapshot;
  readonly anomalies: readonly string[];
  readonly summary: string;
};

export function simulateCrossFaultSaga(
  scenario_id: CrossFaultScenarioId,
  safeguards: CrossFaultSafeguards,
): CrossFaultSimulationResult {
  const scenario =
    CROSS_FAULT_SCENARIOS.find((s) => s.id === scenario_id) ?? CROSS_FAULT_SCENARIOS[0];
  const anomalies: string[] = [];
  let state: LedgerStateSnapshot = {
    ordersDbState: 'CONFIRMED (v2)',
    outboxPending: 0,
    inventoryDeltaUnits: -2,
    paymentChargesCount: 1,
    dlqIsolatedCount: 0,
  };

  if (scenario_id === 'commit_crash_plus_broker_redelivery') {
    if (!safeguards.transactionalOutbox) {
      anomalies.push(
        ' Evento perdido tras caída post-COMMIT: Pedido quedó CREATED en BD pero Inventario/Pagos nunca se enteraron.',
      );
      state = {
        ordersDbState: 'ORPHAN_CREATED',
        outboxPending: 0,
        inventoryDeltaUnits: 0,
        paymentChargesCount: 0,
        dlqIsolatedCount: 0,
      };
    } else if (!safeguards.inboxIdempotency) {
      anomalies.push(
        'Doble efecto por reentrega at-least-once: Outbox recuperó el mensaje, pero el consumidor cobró 2 veces (-4 uds stock).',
      );
      state = {
        ordersDbState: 'CONFIRMED',
        outboxPending: 0,
        inventoryDeltaUnits: -4,
        paymentChargesCount: 2,
        dlqIsolatedCount: 0,
      };
    }
  } else if (scenario_id === 'psp_timeout_plus_compensation_race') {
    if (!safeguards.compensatingSagaAndDlq) {
      anomalies.push(
        'Fuga de stock permanente: falló el cobro pero nunca se ejecutó transacción compensatoria `ReleaseStock`.',
      );
      state = {
        ordersDbState: 'PAYMENT_TIMEOUT',
        outboxPending: 0,
        inventoryDeltaUnits: -2,
        paymentChargesCount: 0,
        dlqIsolatedCount: 0,
      };
    } else if (!safeguards.inboxIdempotency || !safeguards.versionOrderingGuard) {
      anomalies.push(
        'Condición de carrera en compensación: el webhook tardío reabrió una orden ya compensada sin verificar versión/estado.',
      );
      state = {
        ordersDbState: 'ZOMBIE_PAID_NO_STOCK',
        outboxPending: 0,
        inventoryDeltaUnits: 0,
        paymentChargesCount: 1,
        dlqIsolatedCount: 0,
      };
    } else {
      state = {
        ordersDbState: 'COMPENSATED_CLEAN (v3)',
        outboxPending: 0,
        inventoryDeltaUnits: 0,
        paymentChargesCount: 0,
        dlqIsolatedCount: 0,
      };
    }
  } else if (scenario_id === 'out_of_order_versioned_events') {
    if (!safeguards.versionOrderingGuard) {
      anomalies.push(
        'Regresión de estado por evento fuera de orden: `OrderPaid (v2)` sobrescribió `OrderCancelled (v3)` resucitando un pedido cancelado.',
      );
      state = {
        ordersDbState: 'CORRUPTED_RESURRECTED_V2',
        outboxPending: 0,
        inventoryDeltaUnits: -2,
        paymentChargesCount: 1,
        dlqIsolatedCount: 0,
      };
    } else {
      state = {
        ordersDbState: 'CANCELLED_MONOTONIC (v3)',
        outboxPending: 0,
        inventoryDeltaUnits: 0,
        paymentChargesCount: 0,
        dlqIsolatedCount: 0,
      };
    }
  } else {
    // poison_pill_plus_dlq_isolation
    if (!safeguards.compensatingSagaAndDlq) {
      anomalies.push(
        'Bloqueo Head-of-Line: el mensaje corrupto se reintenta infinitamente y congela los 300 pedidos válidos en cola.',
      );
      state = {
        ordersDbState: 'QUEUE_STALLED',
        outboxPending: 300,
        inventoryDeltaUnits: 0,
        paymentChargesCount: 0,
        dlqIsolatedCount: 0,
      };
    } else {
      state = {
        ordersDbState: '300_HEALTHY_PROCESSED',
        outboxPending: 0,
        inventoryDeltaUnits: -2,
        paymentChargesCount: 1,
        dlqIsolatedCount: 1,
      };
    }
  }

  const ok = anomalies.length === 0;
  return {
    scenario,
    consistent: ok,
    invariantStatus: ok ? 'PASS' : 'FAIL',
    finalState: state,
    anomalies,
    summary: ok
      ? '✓ PASS · Consistencia eventual convergente ante fallos cruzados.'
      : `⚠ FAIL · ${anomalies.length} anomalía(s) de consistencia detectada(s).`,
  };
}

const esc = (v: unknown): string =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch),
  );

export function renderCrossFaultStateSvgHtml(res: CrossFaultSimulationResult): string {
  const border = res.consistent ? '#53e2ba' : '#ffb74d';
  const s = res.finalState;
  const boxes: ReadonlyArray<readonly [string, string]> = [
    ['Orders DB', s.ordersDbState],
    ['Outbox Cola', `${s.outboxPending} pend.`],
    ['Stock Δ', `${s.inventoryDeltaUnits} uds`],
    ['Cobros PSP', `${s.paymentChargesCount} cargo(s)`],
    ['DLQ Aislados', `${s.dlqIsolatedCount} msg`],
  ];
  return `<div class="map-svg-wrap my-14" tabindex="0" role="region" aria-label="Estado convergente de los 5 almacenes tras fallo cruzado">
    <svg class="senior-pipeline-svg" viewBox="0 0 750 104" role="img" aria-label="${esc(res.summary)}">
      ${boxes
        .map(([title, val], idx) => {
          const x = 12 + idx * 147;
          return `<g>
            <rect x="${x}" y="12" width="136" height="80" rx="10" fill="#091f34" stroke="${border}" stroke-width="1.8"/>
            <text x="${x + 68}" y="38" text-anchor="middle" fill="#7bdff6" font-size="10.5" font-weight="bold" font-family="sans-serif">${esc(title)}</text>
            <text x="${x + 68}" y="66" text-anchor="middle" fill="#f0f9ff" font-size="10.5" font-weight="bold" font-family="sans-serif">${esc(val.slice(0, 18))}</text>
          </g>`;
        })
        .join('')}
    </svg>
  </div>`;
}
