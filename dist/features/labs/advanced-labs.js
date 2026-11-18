import { detectGraphProblems } from '../../engine.js';
/**
 * Pure multi-scenario engines and Markdown/Mermaid exporters for
 * LAB-A (Dependencies), LAB-D (Patterns), LAB-E (API Contract v1/v2),
 * LAB-F (Distributed Outbox/Idempotency/DLQ/Saga), LAB-G (ADR Matrix),
 * LAB-H (SLO Burn Rate & Coordinated Resilience), and Lab Catalog filtering (`ARQ-015`).
 */
function normalizeText(raw) {
    return raw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}
export function filterLabStudios(studios, filter) {
    const norm_q = normalizeText(filter.query);
    return studios.filter((lab) => {
        if (filter.difficulty !== 'ALL' && lab.difficulty !== filter.difficulty)
            return false;
        if (filter.tag !== 'ALL' && lab.tag !== filter.tag)
            return false;
        if (!norm_q)
            return true;
        const blob = normalizeText(`${lab.id} ${lab.title} ${lab.subtitle} ${lab.tag} ${lab.difficulty} ${lab.topics.join(' ')}`);
        return blob.includes(norm_q);
    });
}
/* ============================================================================
 * LAB-A · Dependency Graph Presets, Ca / Ce / Instability Metrics & Mermaid
 * ============================================================================ */
export const DEPENDENCY_LAYERS = [
    'Presentación',
    'Aplicación',
    'Dominio',
    'Infraestructura',
];
export const DEPENDENCY_PRESETS = Object.freeze([
    {
        id: 'clean-architecture',
        label: 'Clean Architecture (Regla concéntrica)',
        summary: 'Presentación e Infraestructura apuntan hacia Aplicación/Dominio; el Dominio permanece con Ce = 0 e inestabilidad I = 0.',
        edges: [
            ['Presentación', 'Aplicación'],
            ['Aplicación', 'Dominio'],
            ['Infraestructura', 'Aplicación'],
            ['Infraestructura', 'Dominio'],
        ],
    },
    {
        id: 'hexagonal',
        label: 'Hexagonal / Ports & Adapters',
        summary: 'Adaptadores primarios (Presentación) invocan casos de uso; adaptadores secundarios (Infraestructura) implementan puertos del Dominio.',
        edges: [
            ['Presentación', 'Aplicación'],
            ['Aplicación', 'Dominio'],
            ['Infraestructura', 'Dominio'],
        ],
    },
    {
        id: 'classic-layered',
        label: 'Capas clásicas tradicionales (Riesgo Dominio→Infra)',
        summary: 'En capas clásicas sin inversión (DIP), el Dominio depende de Infraestructura (BD), perdiendo pureza y acoplándose al ORM.',
        edges: [
            ['Presentación', 'Aplicación'],
            ['Aplicación', 'Dominio'],
            ['Dominio', 'Infraestructura'],
        ],
    },
    {
        id: 'modular-monolith-violation',
        label: 'Modular Monolith degradado (Ciclo + Fuga)',
        summary: 'Contiene dependencia prohibida Dominio → Presentación y un ciclo Aplicación ↔ Infraestructura que impide extraer módulos.',
        edges: [
            ['Presentación', 'Aplicación'],
            ['Aplicación', 'Infraestructura'],
            ['Infraestructura', 'Aplicación'],
            ['Dominio', 'Presentación'],
        ],
    },
]);
export function computeLayerCouplingMetrics(edges) {
    return DEPENDENCY_LAYERS.map((layer) => {
        const afferent_ca = edges.filter(([, to]) => to === layer).length;
        const efferent_ce = edges.filter(([from]) => from === layer).length;
        const total = afferent_ca + efferent_ce;
        const instability = total === 0 ? 0 : Number((efferent_ce / total).toFixed(2));
        return {
            layer,
            afferentCa: afferent_ca,
            efferentCe: efferent_ce,
            instability,
        };
    });
}
export function exportDependencyGraphMermaid(edges) {
    const alias = {
        Presentación: 'pres',
        Aplicación: 'app',
        Dominio: 'dom',
        Infraestructura: 'infra',
    };
    const safeId = (name, idx) => alias[name] ?? `n${idx}`;
    const lines = [
        'flowchart TD',
        '  pres["Presentación (UI / HTTP)"]',
        '  app["Aplicación (Casos de Uso)"]',
        '  dom["Dominio (Reglas Puras)"]',
        '  infra["Infraestructura (ORM / Brokers)"]',
        ...edges.map(([from, to], idx) => `  ${safeId(from, idx)} --> ${safeId(to, idx + 100)}`),
    ];
    return `${lines.join('\n')}\n`;
}
export function exportDependencyLabMarkdown(edges) {
    const inspection = detectGraphProblems(edges.map(([a, b]) => [a, b]));
    const metrics = computeLayerCouplingMetrics(edges);
    return [
        '# Informe de Dependencias y Acoplamiento · LAB-A',
        '',
        `- **Estado estructural:** ${inspection.valid ? 'PASS (Sin violaciones)' : 'FAIL (Violaciones o ciclos detectados)'}`,
        `- **Ciclos detectados:** ${inspection.cycle ? 'Sí' : 'No'}`,
        `- **Aristas inválidas:** ${inspection.invalid.length ? inspection.invalid.map((e) => e.join(' → ')).join(', ') : 'Ninguna'}`,
        '',
        '## Métricas de Acoplamiento (Ca, Ce, Inestabilidad I = Ce / (Ca + Ce))',
        ...metrics.map((m) => `- **${m.layer}:** Ca=${m.afferentCa}, Ce=${m.efferentCe}, I=${m.instability.toFixed(2)}`),
        '',
        '```mermaid',
        exportDependencyGraphMermaid(edges).trimEnd(),
        '```',
        '',
    ].join('\n');
}
export function evaluatePatternVariabilityTradeoff(input) {
    if (input.activeVariants === 1 && input.changeFrequency === 'anual') {
        if (input.selectedApproach === 'direct-conditional') {
            return {
                status: 'PASS',
                verdictTitle: '✓ Simplicidad defendible (YAGNI bien aplicado)',
                justification: 'Con 1 sola variante estable y cambios anuales, crear fábricas abstractas o buses dinámicos añade indirección sin retorno.',
                complexityScore: 15,
            };
        }
        return {
            status: 'WARN',
            verdictTitle: '⚠ Sobrediseño prematuro detectado',
            justification: 'Con 1 variante estable y cambios anuales, introducir múltiples capas de abstracción incrementa el coste cognitivo sin proteger ninguna variación real.',
            complexityScore: input.selectedApproach === 'plugin-bus-factory' ? 85 : 55,
        };
    }
    if (input.selectedApproach === 'strategy-port') {
        return {
            status: 'PASS',
            verdictTitle: '✓ Equilibrio óptimo: Strategy + Puerto explícito',
            justification: `Con ${input.activeVariants} variantes y cambios de frecuencia ${input.changeFrequency}, un puerto estable con estrategias aisladas permite pruebas por contrato sin contaminar el caso de uso.`,
            complexityScore: 45,
        };
    }
    if (input.selectedApproach === 'direct-conditional') {
        return {
            status: 'WARN',
            verdictTitle: '⚠ Riesgo de rigidez y violación de OCP',
            justification: `Con ${input.activeVariants} variantes cambiando de forma ${input.changeFrequency}, un bloque if/switch central obliga a modificar y re-probar el caso de uso en cada proveedor nuevo.`,
            complexityScore: 70,
        };
    }
    return {
        status: input.activeVariants >= 6 && input.changeFrequency === 'semanal' ? 'PASS' : 'WARN',
        verdictTitle: input.activeVariants >= 6 && input.changeFrequency === 'semanal'
            ? '✓ Arquitectura extensible justificada por alta escala de variantes'
            : '⚠ Indirección excesiva frente a Strategy + Puerto simple',
        justification: 'Un registro dinámico + Abstract Factory solo compensa cuando múltiples equipos publican variantes cada semana.',
        complexityScore: 88,
    };
}
export const API_BREAKING_ISSUE_LABELS = Object.freeze({
    'field-renamed': 'Campo renombrado o eliminado sin coexistencia (Expand/Contract)',
    'type-changed': 'Cambio incompatible de tipo primitivo (ej. centavos int → objeto/string)',
    'nullable-removed': 'Cambio de propiedad opcional/nullable a obligatoria en request o al revés en response',
    'missing-idempotency-key': 'Operación mutativa de cobro/pedido sin soporte de Idempotency-Key',
    'broken-pagination': 'Eliminación de paginación o cursor estable devolviendo colección sin límite',
    'pii-exposed': 'Exposición accidental de columnas internas o PII (hash/documento/token)',
});
export const API_CONTRACT_DIFF_SCENARIOS = Object.freeze([
    {
        id: 'orders-v1-v2',
        title: 'Escenario 1 · Creación de Pedido (POST /v1/orders → v2)',
        endpoint: 'POST /orders',
        v1Contract: `{
  "headers": { "Idempotency-Key": "uuid-obligatorio" },
  "request": { "customerId": "string", "couponCode": "string | null" },
  "response201": { "orderId": "string", "totalCents": 15900, "status": "PENDING" }
}`,
        v2ProposedContract: `{
  "headers": {},
  "request": { "buyer_uuid": "string", "couponCode": "string (required, non-null)" },
  "response201": { "orderId": "string", "totalCents": { "amount": "159.00", "currency": "PEN" } }
}`,
        actualIssues: [
            'field-renamed',
            'type-changed',
            'nullable-removed',
            'missing-idempotency-key',
        ],
        explanation: 'La propuesta v2 rompe a todos los clientes móviles activos: renombra customerId → buyer_uuid, exige couponCode no nulo, cambia totalCents de entero a objeto y elimina Idempotency-Key exponiendo pedidos duplicados.',
    },
    {
        id: 'catalog-v1-v2',
        title: 'Escenario 2 · Listado de Pedidos de Cliente (GET /v1/orders)',
        endpoint: 'GET /orders',
        v1Contract: `{
  "query": { "cursor": "string?", "limit": "number (max 50)" },
  "response200": {
    "items": [{ "orderId": "string", "totalCents": 9900 }],
    "nextCursor": "string | null"
  }
}`,
        v2ProposedContract: `{
  "query": {},
  "response200": [
    {
      "id": "string",
      "totalCents": 9900,
      "customerPasswordHash": "$2b$12$...",
      "internalRiskNotes": "string"
    }
  ]
}`,
        actualIssues: ['field-renamed', 'broken-pagination', 'pii-exposed'],
        explanation: 'Serializar directamente la entidad ORM rompió el sobre paginado (nextCursor desaparece), renombró orderId → id y filtró customerPasswordHash e información interna sensible.',
    },
]);
export function evaluateApiContractDiffAudit(scenario_id, selected_issues) {
    const scenario = API_CONTRACT_DIFF_SCENARIOS.find((s) => s.id === scenario_id) ?? API_CONTRACT_DIFF_SCENARIOS[0];
    const expected = new Set(scenario.actualIssues);
    const chosen = new Set(selected_issues);
    const hits = scenario.actualIssues.filter((id) => chosen.has(id));
    const missed = scenario.actualIssues.filter((id) => !chosen.has(id));
    const false_positives = [...chosen].filter((id) => !expected.has(id));
    return {
        status: missed.length === 0 && false_positives.length === 0 ? 'PASS' : 'FAIL',
        hits,
        missed,
        falsePositives: false_positives,
        explanation: scenario.explanation,
    };
}
export function exportApiContractAuditMarkdown(scenario_id, selected_issues) {
    const scenario = API_CONTRACT_DIFF_SCENARIOS.find((s) => s.id === scenario_id) ?? API_CONTRACT_DIFF_SCENARIOS[0];
    const result = evaluateApiContractDiffAudit(scenario_id, selected_issues);
    return [
        `# Auditoría de Evolución de Contrato API · ${scenario.title}`,
        '',
        `- **Resultado:** ${result.status}`,
        `- **Breaking changes detectados (${result.hits.length}/${scenario.actualIssues.length}):** ${result.hits.map((h) => API_BREAKING_ISSUE_LABELS[h]).join('; ') || 'Ninguno'}`,
        ...(result.missed.length
            ? [`- **Omitidos:** ${result.missed.map((m) => API_BREAKING_ISSUE_LABELS[m]).join('; ')}`]
            : []),
        ...(result.falsePositives.length
            ? [`- **Falsos positivos:** ${result.falsePositives.map((f) => API_BREAKING_ISSUE_LABELS[f]).join('; ')}`]
            : []),
        '',
        '## Diagnóstico de referencia',
        result.explanation,
        '',
    ].join('\n');
}
export const DISTRIBUTED_FAULT_SCENARIOS = Object.freeze([
    {
        id: 'crash-before-publish',
        label: 'Caída de red justo después del COMMIT en BD de Pedidos',
        description: 'El servicio guarda el pedido en PostgreSQL pero muere antes de enviar el mensaje al broker.',
    },
    {
        id: 'duplicate-broker-delivery',
        label: 'Entrega duplicada At-Least-Once (ACK perdido)',
        description: 'El consumidor de Pagos procesa el mensaje, pero el ACK se pierde y el broker reenvía el mismo evento.',
    },
    {
        id: 'poison-message',
        label: 'Mensaje corrupto / Poison Pill no recuperable',
        description: 'Llega un evento con esquema roto que falla sistemáticamente al deserializar en el consumidor.',
    },
    {
        id: 'saga-payment-rejected',
        label: 'Fallo de negocio en paso 2: Stock reservado pero Pago rechazado',
        description: 'Inventario ya descontó 3 unidades; segundos después la pasarela rechaza la tarjeta por fondos insuficientes.',
    },
]);
export function simulateDistributedEventTimeline(fault, safeguards) {
    const steps = [];
    if (fault === 'crash-before-publish') {
        if (safeguards.outboxEnabled) {
            steps.push({
                timestamp: 'T+00ms',
                actor: 'Pedidos DB',
                detail: 'TX atómica: INSERT orders + INSERT outbox_events en el mismo commit.',
                outcome: 'ok',
            }, {
                timestamp: 'T+15ms',
                actor: 'Proceso API',
                detail: '⚡ Crash del contenedor antes de contactar al broker.',
                outcome: 'warn',
            }, {
                timestamp: 'T+200ms',
                actor: 'Outbox Relay',
                detail: 'Lee evento pendiente en outbox_events, publica OrderPlaced al broker y marca enviado.',
                outcome: 'ok',
            });
            return {
                consistent: true,
                verdict: '✓ Consistencia eventual preservada gracias a Transactional Outbox (0 eventos perdidos).',
                steps,
            };
        }
        steps.push({
            timestamp: 'T+00ms',
            actor: 'Pedidos DB',
            detail: 'COMMIT de orden en base de datos sin tabla Outbox.',
            outcome: 'ok',
        }, {
            timestamp: 'T+12ms',
            actor: 'Proceso API',
            detail: '⚡ Crash antes de ejecutar broker.publish(OrderPlaced).',
            outcome: 'error',
        }, {
            timestamp: 'T+500ms',
            actor: 'Inventario / Pagos',
            detail: 'Jamás reciben el evento; el pedido queda fantasma (Dual-Write perdido).',
            outcome: 'error',
        });
        return {
            consistent: false,
            verdict: '⚠ Divergencia crítica por Dual-Write: activa Transactional Outbox.',
            steps,
        };
    }
    if (fault === 'duplicate-broker-delivery') {
        steps.push({
            timestamp: 'T+00ms',
            actor: 'Broker',
            detail: 'Entrega #1 de OrderPlaced (eventId=evt-901) al consumidor de Pagos.',
            outcome: 'ok',
        }, {
            timestamp: 'T+40ms',
            actor: 'Pagos Consumer',
            detail: 'Ejecuta cargo por S/ 250; timeout de red impide confirmar ACK al broker.',
            outcome: 'warn',
        }, {
            timestamp: 'T+180ms',
            actor: 'Broker',
            detail: 'Reentrega #2 de OrderPlaced (eventId=evt-901) por política At-Least-Once.',
            outcome: 'warn',
        });
        if (safeguards.idempotentConsumerEnabled) {
            steps.push({
                timestamp: 'T+195ms',
                actor: 'Pagos Consumer',
                detail: 'Detecta eventId=evt-901 en tabla inbox_processed; ignora reejecución y envía ACK.',
                outcome: 'ok',
            });
            return {
                consistent: true,
                verdict: '✓ Efecto exactamente-una-vez logrado combinando At-Least-Once + Idempotent Consumer.',
                steps,
            };
        }
        steps.push({
            timestamp: 'T+210ms',
            actor: 'Pagos Consumer',
            detail: 'Vuelve a cobrar S/ 250 al cliente (Doble cobro en producción).',
            outcome: 'error',
        });
        return {
            consistent: false,
            verdict: '⚠ Doble cobro ejecutado: At-Least-Once exige Idempotent Consumer obligatorio.',
            steps,
        };
    }
    if (fault === 'poison-message') {
        steps.push({
            timestamp: 'T+00ms',
            actor: 'Broker',
            detail: 'Entrega mensaje corrupto (payload truncado) en partición de Pedidos.',
            outcome: 'warn',
        }, {
            timestamp: 'T+30ms',
            actor: 'Consumer',
            detail: 'Falla validación de esquema tras 3 reintentos acotados con backoff.',
            outcome: 'warn',
        });
        if (safeguards.dlqEnabled) {
            steps.push({
                timestamp: 'T+120ms',
                actor: 'DLQ Router',
                detail: 'Aísla mensaje en orders.dlq con metadatos de error y desbloquea la cola principal.',
                outcome: 'ok',
            });
            return {
                consistent: true,
                verdict: '✓ Cola saludable: Dead Letter Queue aisló el mensaje venenoso para inspección.',
                steps,
            };
        }
        steps.push({
            timestamp: 'T+300ms',
            actor: 'Consumer',
            detail: 'Bucle infinito de reintentos bloquea todos los mensajes válidos detrás (Head-of-Line blocking).',
            outcome: 'error',
        });
        return {
            consistent: false,
            verdict: '⚠ Cola bloqueada indefinidamente: configura límite de reintentos + Dead Letter Queue (DLQ).',
            steps,
        };
    }
    // saga-payment-rejected
    steps.push({
        timestamp: 'T+00ms',
        actor: 'Inventario',
        detail: 'Paso 1 completado: 3 unidades reservadas localmente para pedido ORD-77.',
        outcome: 'ok',
    }, {
        timestamp: 'T+90ms',
        actor: 'Pagos',
        detail: 'Paso 2 fallido: PSP rechaza el cobro; emite evento PaymentRejected(ORD-77).',
        outcome: 'warn',
    });
    if (safeguards.compensatingSagaEnabled) {
        steps.push({
            timestamp: 'T+140ms',
            actor: 'Saga / Inventario',
            detail: 'Ejecuta transacción compensatoria ReleaseStock(ORD-77): devuelve las 3 unidades al disponible.',
            outcome: 'ok',
        }, {
            timestamp: 'T+180ms',
            actor: 'Ventas',
            detail: 'Marca ORD-77 como CANCELADO_PAGO_RECHAZADO e informa al comprador.',
            outcome: 'ok',
        });
        return {
            consistent: true,
            verdict: '✓ Saga compensatoria exitosa: stock liberado y orden cerrada sin bloqueo eterno.',
            steps,
        };
    }
    steps.push({
        timestamp: 'T+400ms',
        actor: 'Inventario',
        detail: 'Las 3 unidades quedan secuestradas como reservadas para siempre (Stock fantasma).',
        outcome: 'error',
    });
    return {
        consistent: false,
        verdict: '⚠ Fuga de inventario: toda Saga sin transacción compensatoria deja estados huérfanos.',
        steps,
    };
}
export function exportDistributedTimelineMarkdown(fault, safeguards) {
    const scenario = DISTRIBUTED_FAULT_SCENARIOS.find((s) => s.id === fault);
    const sim = simulateDistributedEventTimeline(fault, safeguards);
    return [
        '# Simulación Paso a Paso de Sistemas Distribuidos · LAB-F',
        '',
        `- **Fallo inyectado:** ${scenario?.label ?? fault}`,
        `- **Salvaguardas activas:** Outbox=${safeguards.outboxEnabled}, Idempotencia=${safeguards.idempotentConsumerEnabled}, DLQ=${safeguards.dlqEnabled}, Saga=${safeguards.compensatingSagaEnabled}`,
        `- **Veredicto:** ${sim.verdict}`,
        '',
        '## Timeline determinista',
        ...sim.steps.map((s) => `- \`${s.timestamp}\` **${s.actor}** (${s.outcome.toUpperCase()}): ${s.detail}`),
        '',
    ].join('\n');
}
export const ADR_OPTION_MATRIX = Object.freeze([
    {
        id: 'modular-monolith',
        label: 'Opción A · Monolito Modular con Outbox',
        sloFit: 4,
        costEfficiency: 5,
        teamSimplicity: 5,
        reversibility: 5,
        keyRisk: 'Requiere disciplina estricta de fronteras para impedir acoplamiento en BD.',
    },
    {
        id: 'event-microservices',
        label: 'Opción B · Microservicios Event-Driven desde día 1',
        sloFit: 5,
        costEfficiency: 2,
        teamSimplicity: 2,
        reversibility: 2,
        keyRisk: 'Alta carga operativa (observabilidad distribuida, sagas, despliegue multi-repo).',
    },
    {
        id: 'managed-serverless',
        label: 'Opción C · Funciones Serverless por endpoint',
        sloFit: 3,
        costEfficiency: 4,
        teamSimplicity: 3,
        reversibility: 3,
        keyRisk: 'Cold starts en rutas p99 críticas y acoplamiento al proveedor cloud.',
    },
]);
export function calculateSloBurnRate(input) {
    const clamped_slo = Math.min(99.999, Math.max(90, input.sloPercent));
    const window_days = Math.max(1, Math.min(90, input.windowDays));
    const observed_err = Math.max(0, Math.min(100, input.observedErrorRatePercent));
    const budget_percent = Number((100 - clamped_slo).toFixed(4));
    const total_minutes = window_days * 24 * 60;
    const total_budget_minutes = Number(((total_minutes * budget_percent) / 100).toFixed(2));
    const burn_rate = budget_percent === 0 ? 0 : Number((observed_err / budget_percent).toFixed(2));
    const hours_until_exhaustion = burn_rate <= 0 ? null : Number(((window_days * 24) / burn_rate).toFixed(1));
    let alert_action = 'WITHIN_BUDGET';
    let recommendation = 'Consumo sostenible (< 1×): puedes desplegar nuevas funcionalidades manteniendo telemetría activa.';
    if (burn_rate >= 14.4) {
        alert_action = 'PAGE_ONCALL_P1';
        recommendation =
            'Alerta crítica Fast-Burn (≥ 14.4×, consume ~2% del presupuesto mensual en 1 hora): activar guardia P1, congelar releases riesgosos y ejecutar rollback o degradación.';
    }
    else if (burn_rate > 1) {
        alert_action = 'CREATE_TICKET_P2';
        recommendation =
            'Alerta Slow-Burn (> 1×): el presupuesto se agotará antes de cerrar la ventana. Prioriza mitigación de fiabilidad en el sprint actual.';
    }
    return {
        errorBudgetPercent: budget_percent,
        totalBudgetMinutes: total_budget_minutes,
        burnRate: burn_rate,
        hoursUntilExhaustion: hours_until_exhaustion,
        alertAction: alert_action,
        recommendation,
    };
}
export function evaluateResilienceDefense(config) {
    const findings = [];
    const attempts = 1 + Math.max(0, config.maxRetries);
    const worst_case_latency_ms = config.dependencyTimeoutMs * attempts;
    if (worst_case_latency_ms > config.callerSlaMs) {
        findings.push(`Presupuesto de latencia excedido: ${attempts} intento(s) × ${config.dependencyTimeoutMs} ms = ${worst_case_latency_ms} ms supera el SLA del llamador (${config.callerSlaMs} ms).`);
    }
    if (config.maxRetries > 3) {
        findings.push(`Demasiados reintentos (${config.maxRetries}): amplifica tormentas de tráfico sobre una dependencia degradada.`);
    }
    if (config.maxRetries > 0 && !config.jitterEnabled) {
        findings.push('Reintentos sin backoff + jitter: todos los clientes golpearán a la dependencia en oleadas sincronizadas (Thundering Herd).');
    }
    if (!config.circuitBreakerEnabled) {
        findings.push('Falta Circuit Breaker: seguir invocando un proveedor caído agota hilos y eleva la latencia p99.');
    }
    if (!config.bulkheadEnabled) {
        findings.push('Falta Bulkhead (aislamiento de pools/concurrencia): un proveedor lento puede saturar todo el proceso.');
    }
    return {
        status: findings.length === 0 ? 'PASS' : 'FAIL',
        worstCaseLatencyMs: worst_case_latency_ms,
        findings,
    };
}
export function exportIncidentRunbookMarkdown(slo_input, resilience_input) {
    const slo = calculateSloBurnRate(slo_input);
    const res = evaluateResilienceDefense(resilience_input);
    return [
        '# Runbook de Fiabilidad y Presupuesto de Error · LAB-H',
        '',
        '## 1. Cálculo de SLO y Burn Rate',
        `- **SLO objetivo:** ${slo_input.sloPercent}% (${slo_input.windowDays} días)`,
        `- **Presupuesto de error permitido:** ${slo.totalBudgetMinutes} min (${slo.errorBudgetPercent}%)`,
        `- **Tasa de error observada:** ${slo_input.observedErrorRatePercent}% → **Burn Rate ${slo.burnRate}×**`,
        `- **Tiempo hasta agotar presupuesto:** ${slo.hoursUntilExhaustion !== null ? `${slo.hoursUntilExhaustion} h` : 'No se agota'}`,
        `- **Acción operativa:** \`${slo.alertAction}\` — ${slo.recommendation}`,
        '',
        `## 2. Coordinación de Resiliencia (${res.status})`,
        `- **Latencia peor caso:** ${res.worstCaseLatencyMs} ms frente a SLA ${resilience_input.callerSlaMs} ms`,
        `- **Controles:** Retries=${resilience_input.maxRetries}, Jitter=${resilience_input.jitterEnabled}, CircuitBreaker=${resilience_input.circuitBreakerEnabled}, Bulkhead=${resilience_input.bulkheadEnabled}`,
        ...(res.findings.length ? ['', '### Riesgos detectados', ...res.findings.map((f) => `- ⚠ ${f}`)] : []),
        '',
    ].join('\n');
}
