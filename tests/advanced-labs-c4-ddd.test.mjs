import test from 'node:test';
import assert from 'node:assert/strict';

import {
  analyzeC4Semantics,
  C4_LEVEL_PRESETS,
  C4_LEVELS,
  C4_TYPES,
  c4Mermaid,
  c4Svg,
  renderC4AccessibleSummaryHtml,
  validateC4,
} from '../dist/c4-studio.js';
import {
  DDD_POLYSEMIC_TERMS,
  evaluateDddAggregateDesign,
  evaluateUbiquitousLanguageAssignments,
  exportDddContextMapMermaid,
  exportDddWorkshopMarkdown,
  getPolysemicLensesForTerm,
  INITIAL_DDD_CONTEXT_MAP,
  validateDddContextMap,
} from '../dist/ddd-workshop.js';
import {
  API_CONTRACT_DIFF_SCENARIOS,
  calculateSloBurnRate,
  computeLayerCouplingMetrics,
  DEPENDENCY_PRESETS,
  evaluateApiContractDiffAudit,
  evaluatePatternVariabilityTradeoff,
  evaluateResilienceDefense,
  exportApiContractAuditMarkdown,
  exportDependencyGraphMermaid,
  exportDependencyLabMarkdown,
  exportDistributedTimelineMarkdown,
  exportIncidentRunbookMarkdown,
  filterLabStudios,
  simulateDistributedEventTimeline,
} from '../dist/features/labs/advanced-labs.js';
import { LAB_STUDIOS } from '../dist/features/labs/constants/labs.constants.js';
import { c4ModelImportSchema } from '../dist/features/senior/schemas/senior.schema.js';

test('ARQ-013: C4 Studio soporta niveles C1, C2 y C3, round-trip JSON y exportaciones Mermaid/SVG', () => {
  assert.deepEqual(C4_LEVELS, ['C1', 'C2', 'C3']);
  assert.equal(C4_TYPES.length, 4);

  for (const level of C4_LEVELS) {
    const preset = C4_LEVEL_PRESETS[level];
    assert.equal(validateC4(preset).length, 0, `Preset ${level} debe ser válido`);

    // JSON round-trip via schema
    const serialized = JSON.stringify(preset);
    const reimported = c4ModelImportSchema.parse(JSON.parse(serialized), `${level}.json`);
    assert.equal(reimported.level, level);
    assert.equal(reimported.containers.length, preset.containers.length);
    assert.equal(reimported.relations.length, preset.relations.length);

    const svg = c4Svg(reimported);
    const mmd = c4Mermaid(reimported);
    assert.match(svg, /<svg/);
    assert.match(svg, /NexoShop/);
    assert.ok(mmd.startsWith('flowchart TB\n'));
  }

  // Reject cross-level type mixing (e.g. C2 Database inside C1 Context diagram)
  const mixedInvalid = {
    kind: 'C4-containers-educational',
    system: 'NexoShop',
    level: 'C1',
    containers: [{ id: 'db', label: 'PostgreSQL Interno', type: 'Base de datos' }],
    relations: [],
  };
  assert.ok(validateC4(mixedInvalid).length > 0);
  assert.equal(c4ModelImportSchema.safeParse(mixedInvalid).success, false);
});

test('ARQ-013: validación semántica de C4 detecta Frontend→BD, inversión en C3, ciclos, contratos vagos y nodos aislados', () => {
  const smellyC2 = {
    kind: 'C4-containers-educational',
    system: 'NexoShop',
    level: 'C2',
    containers: [
      { id: 'web', label: 'SPA Web', type: 'Frontend' },
      { id: 'db', label: 'BD Clientes', type: 'Base de datos' },
      { id: 'orphan', label: 'Worker Huérfano', type: 'API' },
    ],
    relations: [
      { from: 'web', to: 'db', label: 'usa' },
      { from: 'db', to: 'web', label: 'Devuelve filas SQL' },
    ],
  };

  assert.equal(validateC4(smellyC2).length, 0, 'Topológicamente es exportable');
  const warnings = analyzeC4Semantics(smellyC2);
  const codes = warnings.map((w) => w.code);
  assert.ok(codes.includes('DIRECT_FRONTEND_TO_DB'));
  assert.ok(codes.includes('AMBIGUOUS_EDGE_CONTRACT'));
  assert.ok(codes.includes('DIRECTED_CYCLE'));
  assert.ok(codes.includes('ISOLATED_ELEMENT'));

  const summaryHtml = renderC4AccessibleSummaryHtml(smellyC2, warnings);
  assert.match(summaryHtml, /Resumen textual accesible/);
  assert.match(summaryHtml, /alerta\(s\) semántica\(s\)/);

  // C3 Domain depending on HTTP Controller / Adapter
  const smellyC3 = {
    kind: 'C4-containers-educational',
    system: 'NexoShop',
    level: 'C3',
    containers: [
      { id: 'dom', label: 'Agregado Pedido', type: 'Dominio / Agregado' },
      { id: 'ctrl', label: 'OrdersController', type: 'Controlador / Adapter' },
    ],
    relations: [{ from: 'dom', to: 'ctrl', label: 'Importa Request HTTP' }],
  };
  const c3Warnings = analyzeC4Semantics(smellyC3);
  assert.ok(c3Warnings.some((w) => w.code === 'DOMAIN_DEPENDENCY_INVERSION'));

  // Clean C2 preset produces zero semantic warnings
  assert.equal(analyzeC4Semantics(C4_LEVEL_PRESETS.C2).length, 0);
});

test('ARQ-014: DDD Workshop modela polisemia, valida Context Map y detecta agregados gigantes o sobreventa', () => {
  // 1. Polysemic terms across Bounded Contexts
  for (const term of DDD_POLYSEMIC_TERMS) {
    const lenses = getPolysemicLensesForTerm(term);
    assert.ok(lenses.length >= 2, `${term} debe mostrar modelos distintos en múltiples contextos`);
  }

  const conceptEval = evaluateUbiquitousLanguageAssignments({
    'concept-orden': 'Ventas',
    'concept-reserva': 'Inventario',
    'concept-cobro': 'Pagos',
    'concept-ficha': 'Catálogo',
    'concept-guia': 'Envíos',
  });
  assert.equal(conceptEval.allCorrect, true);

  // 2. Context Map validation: clean initial vs Shared DB & missing ACL
  assert.equal(validateDddContextMap(INITIAL_DDD_CONTEXT_MAP).valid, true);

  const badContextMap = validateDddContextMap([
    {
      upstream: 'Ventas',
      downstream: 'Inventario',
      pattern: 'Shared Database',
      contractSummary: 'Tablas compartidas',
    },
    {
      upstream: 'PSP Externo Legado',
      downstream: 'Pagos',
      pattern: 'Customer-Supplier',
      contractSummary: 'DTO crudo del proveedor',
    },
  ]);
  assert.equal(badContextMap.valid, false);
  assert.ok(badContextMap.findings.some((f) => f.code === 'SHARED_DATABASE_ANTIPATTERN'));
  assert.ok(badContextMap.findings.some((f) => f.code === 'MISSING_ACL_FOR_LEGACY_PSP'));

  // 3. Aggregate design: clean StockItem vs overselling risk vs Giant Aggregate
  const validStockAgg = evaluateDddAggregateDesign({
    rootId: 'StockItem',
    internalEntities: ['reserva-lote'],
    invariants: ['inv-no-overselling'],
    eventualEvents: ['evt-autorizar-cobro'],
    optimisticConcurrency: true,
  });
  assert.equal(validStockAgg.status, 'PASS');
  assert.match(validStockAgg.requiresHumanReviewNote, /REQUIRES_REVIEW/);

  const oversellingAgg = evaluateDddAggregateDesign({
    rootId: 'StockItem',
    internalEntities: ['reserva-lote'],
    invariants: [],
    eventualEvents: ['evt-autorizar-cobro'],
    optimisticConcurrency: false,
  });
  assert.equal(oversellingAgg.status, 'FAIL');
  assert.ok(oversellingAgg.issues.some((msg) => /sobreventa/i.test(msg)));

  const bloatedAgg = evaluateDddAggregateDesign({
    rootId: 'MegaAgregadoEcommerce',
    internalEntities: ['lineas-pedido', 'catalogo-global-fotos', 'flota-camiones-gps'],
    invariants: ['inv-total-positivo'],
    eventualEvents: [],
    optimisticConcurrency: true,
  });
  assert.equal(bloatedAgg.status, 'FAIL');
  assert.ok(bloatedAgg.issues.length >= 3);

  // 4. Exporters
  const mmd = exportDddContextMapMermaid(INITIAL_DDD_CONTEXT_MAP);
  assert.ok(mmd.startsWith('flowchart LR\n'));
  const md = exportDddWorkshopMarkdown({
    selectedTerm: 'Producto',
    contextMap: INITIAL_DDD_CONTEXT_MAP,
    aggregateDesign: {
      rootId: 'OrdenCompra',
      internalEntities: ['lineas-pedido', 'cupon-aplicado'],
      invariants: ['inv-total-positivo', 'inv-no-mutar-pagada'],
      eventualEvents: ['evt-reservar-stock'],
      optimisticConcurrency: true,
    },
  });
  assert.match(md, /# Dossier DDD Workshop/);
  assert.match(md, /REQUIRES_REVIEW/);
});

test('ARQ-015: filtros de #/laboratorios y motores profundos para LAB-A, LAB-D, LAB-E, LAB-F y LAB-H', () => {
  // Catalog filters
  assert.equal(filterLabStudios(LAB_STUDIOS, { query: '', difficulty: 'ALL', tag: 'ALL' }).length, 8);
  assert.equal(filterLabStudios(LAB_STUDIOS, { query: 'burn rate', difficulty: 'ALL', tag: 'ALL' })[0].id, 'incident');
  assert.ok(filterLabStudios(LAB_STUDIOS, { query: '', difficulty: 'Avanzado', tag: 'ALL' }).length >= 2);

  // LAB-A: Coupling metrics Ca / Ce / Instability + Mermaid
  const cleanPreset = DEPENDENCY_PRESETS.find((p) => p.id === 'clean-architecture');
  const metrics = computeLayerCouplingMetrics(cleanPreset.edges);
  const domainMetric = metrics.find((m) => m.layer === 'Dominio');
  assert.equal(domainMetric.efferentCe, 0);
  assert.equal(domainMetric.instability, 0);
  assert.ok(domainMetric.afferentCa >= 2);
  assert.match(exportDependencyGraphMermaid(cleanPreset.edges), /flowchart TD/);
  assert.match(exportDependencyLabMarkdown(cleanPreset.edges), /Inestabilidad I/);

  // LAB-D: Overengineering vs variability
  const overengineered = evaluatePatternVariabilityTradeoff({
    activeVariants: 1,
    changeFrequency: 'anual',
    selectedApproach: 'plugin-bus-factory',
  });
  assert.equal(overengineered.status, 'WARN');

  const balancedStrategy = evaluatePatternVariabilityTradeoff({
    activeVariants: 3,
    changeFrequency: 'mensual',
    selectedApproach: 'strategy-port',
  });
  assert.equal(balancedStrategy.status, 'PASS');

  // LAB-E: OpenAPI / JSON Contract Evolution v1 vs v2
  const s1 = API_CONTRACT_DIFF_SCENARIOS[0];
  const exactAudit = evaluateApiContractDiffAudit(s1.id, s1.actualIssues);
  assert.equal(exactAudit.status, 'PASS');

  const incompleteAudit = evaluateApiContractDiffAudit(s1.id, ['field-renamed', 'pii-exposed']);
  assert.equal(incompleteAudit.status, 'FAIL');
  assert.ok(incompleteAudit.missed.includes('missing-idempotency-key'));
  assert.ok(incompleteAudit.falsePositives.includes('pii-exposed'));
  assert.match(exportApiContractAuditMarkdown(s1.id, s1.actualIssues), /PASS/);

  // LAB-F: Step-by-step Distributed Timeline (Outbox, Idempotency, DLQ, Saga)
  const allSafeguards = {
    outboxEnabled: true,
    idempotentConsumerEnabled: true,
    dlqEnabled: true,
    compensatingSagaEnabled: true,
  };
  const noSafeguards = {
    outboxEnabled: false,
    idempotentConsumerEnabled: false,
    dlqEnabled: false,
    compensatingSagaEnabled: false,
  };

  for (const fault of [
    'crash-before-publish',
    'duplicate-broker-delivery',
    'poison-message',
    'saga-payment-rejected',
  ]) {
    assert.equal(simulateDistributedEventTimeline(fault, allSafeguards).consistent, true, `${fault} con salvaguardas`);
    assert.equal(simulateDistributedEventTimeline(fault, noSafeguards).consistent, false, `${fault} sin salvaguardas`);
  }
  assert.match(exportDistributedTimelineMarkdown('saga-payment-rejected', allSafeguards), /ReleaseStock/);

  // LAB-H: SLO Error Budget / Burn Rate & Resilience Coordination
  const fastBurn = calculateSloBurnRate({
    sloPercent: 99.9,
    windowDays: 30,
    observedErrorRatePercent: 1.44,
  });
  assert.equal(fastBurn.totalBudgetMinutes, 43.2);
  assert.equal(fastBurn.burnRate, 14.4);
  assert.equal(fastBurn.alertAction, 'PAGE_ONCALL_P1');

  const healthyBudget = calculateSloBurnRate({
    sloPercent: 99.9,
    windowDays: 30,
    observedErrorRatePercent: 0.05,
  });
  assert.equal(healthyBudget.alertAction, 'WITHIN_BUDGET');

  const coordinated = evaluateResilienceDefense({
    callerSlaMs: 1500,
    dependencyTimeoutMs: 400,
    maxRetries: 2,
    jitterEnabled: true,
    circuitBreakerEnabled: true,
    bulkheadEnabled: true,
  });
  assert.equal(coordinated.status, 'PASS');

  const retryStorm = evaluateResilienceDefense({
    callerSlaMs: 1000,
    dependencyTimeoutMs: 600,
    maxRetries: 5,
    jitterEnabled: false,
    circuitBreakerEnabled: false,
    bulkheadEnabled: false,
  });
  assert.equal(retryStorm.status, 'FAIL');
  assert.ok(retryStorm.findings.length >= 4);
  assert.match(
    exportIncidentRunbookMarkdown(
      { sloPercent: 99.9, windowDays: 30, observedErrorRatePercent: 1.44 },
      {
        callerSlaMs: 1500,
        dependencyTimeoutMs: 400,
        maxRetries: 2,
        jitterEnabled: true,
        circuitBreakerEnabled: true,
        bulkheadEnabled: true,
      },
    ),
    /PAGE_ONCALL_P1/,
  );
});
