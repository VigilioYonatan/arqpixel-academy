import { scenarioFromSeed } from './engine.js';
import {
  type MentorReviewSchema,
  type MentorVerdict,
  mentorReviewSchema,
  type SeniorDossierV2Schema,
  seniorDossierV2Schema,
} from './features/senior/schemas/senior-dossier.schema.js';
import {
  buildPhase2MissionPolicy,
  buildValidatedSeniorDossierV2,
  computeCrossDecisionConsequences,
  type DynamicTradeoffStanceId,
  deriveSeniorSuiteProgressiveHints,
  evaluateChainedIncidentProgression,
  evaluatePhase2Evolution,
  formatMentorReviewMarkdown,
  parseExternalMentorReviewJson,
  renderChainedIncidentTimelineSvgHtml,
  SENIOR_TRADEOFF_STANCES,
  sanitizeMentorReview,
} from './features/senior/senior-evolution-engine.js';
import {
  buildCanonicalSeniorGateMatrix,
  computeCriteriaSnapshotFingerprint,
  renderSeedReproducerBarHtml,
  renderSeniorAlternativesComparisonHtml,
  renderSeniorBuilderGraphSvgHtml,
  renderSeniorReasonedSolutionGuideHtml,
  sanitizeSeniorSeed,
} from './features/senior/senior-ux-views.js';
import { renderSeniorVisualFlowSvgHtml } from './features/shared/ui/visual-clarity.js';
import { devsecopsPolicy, evaluateDevSecOps, SECURITY_CONTROLS } from './senior-devsecops.js';
import { IMPACT_MODELS, simulateMissionImpact } from './senior-impact.js';
import { codeReviewPolicy, evaluateCodeReview } from './senior-reviews.js';
import { simulatePaymentReplay, simulatePeakCapacity } from './senior-simulations.js';
import { evaluateThreat, threatExercise } from './senior-threats.js';

/** Senior practice suite v2.0: deterministic chained checks, FinOps/Capacity cross-effects & human review rubric. */

export type MissionInput = {
  id: string;
  title: string;
  brief: string;
  decision: string;
  evidence: string;
};

export type SeniorDraft = {
  diagnosis: number;
  architecture: string[];
  relations: [string, string][];
  decision: string;
  incident: number;
  capacity: number;
  reviewChoice: number;
  impactChoice: number;
  devsecopsControls: string[];
  threatChoice: number;
  phase2Choice?: number;
  mentorReview?: MentorReviewSchema | null;
  updated: string;
};

export const SENIOR_ENGINES = [
  'Diagnóstico de restricciones',
  'Architecture Builder',
  'Decision / ADR',
  'Incident Response',
  'Capacity / Reliability',
  'Contract / Code Review',
] as const;

export const ARCH_COMPONENTS = [
  'API Gateway',
  'Dominio aislado',
  'Base de datos',
  'Idempotencia',
  'Cola de eventos',
  'Observabilidad',
  'Autorización',
  'Plan de rollback',
];

/** Mission-specific engineering constraints: distinct learning goals, not interchangeable quizzes. */
export type SeniorPlaybook = {
  focus: string;
  required: [string, string];
  investigation: string;
  verification: string;
  artifact: string;
  failureMode: string;
};

export const SENIOR_PLAYBOOKS: Record<string, SeniorPlaybook> = {
  S01: {
    focus: 'Modularización incremental de un monolito legado',
    required: ['Dominio aislado', 'Observabilidad'],
    investigation: 'Medir hotspots y dependencias antes de separar módulos',
    verification: 'Pruebas de contrato y despliegue incremental con rollback',
    artifact: 'Mapa de dependencias y estrategia strangler',
    failureMode: 'Migrar todo de una vez sin mapa de dependencias',
  },
  S02: {
    focus: 'SOLID y variabilidad real de reglas',
    required: ['Dominio aislado', 'Plan de rollback'],
    investigation: 'Localizar motivos de cambio y medir impacto sobre pruebas',
    verification: 'Tests de regresión por variante de descuento',
    artifact: 'Diff de refactor y comparación de complejidad',
    failureMode: 'Crear abstracciones sin variabilidad ni cobertura',
  },
  S03: {
    focus: 'Estrategias intercambiables y adaptadores externos',
    required: ['Dominio aislado', 'Observabilidad'],
    investigation: 'Comparar interfaces de proveedores y errores heterogéneos',
    verification: 'Contract tests contra adaptadores y fallback',
    artifact: 'Diagrama de Strategy/Adapter con tests',
    failureMode: 'Incrustar condicionales por proveedor en el dominio',
  },
  S04: {
    focus: 'Reglas del dominio sin dependencia de frameworks',
    required: ['Dominio aislado', 'Base de datos'],
    investigation: 'Detectar imports de ORM y HTTP dentro del dominio',
    verification: 'Test unitario de dominio sin infraestructura',
    artifact: 'Grafo de dependencias antes/después',
    failureMode: 'Hacer depender dominio de controlador o repositorio concreto',
  },
  S05: {
    focus: 'Bounded contexts y acuerdos entre equipos',
    required: ['Dominio aislado', 'API Gateway'],
    investigation: 'Acordar lenguaje ubicuo y propietarios de los datos',
    verification: 'Pruebas de contrato y eventos entre contextos',
    artifact: 'Context map y glosario compartido',
    failureMode: 'Usar una misma entidad mutable en todos los contextos',
  },
  S06: {
    focus: 'Invariantes del agregado de inventario',
    required: ['Dominio aislado', 'Base de datos'],
    investigation: 'Definir qué transición debe ser atómica',
    verification: 'Pruebas concurrentes de sobreventa e invariantes',
    artifact: 'Máquina de estados y escenarios negativos',
    failureMode: 'Actualizar stock sin control de concurrencia',
  },
  S07: {
    focus: 'Compatibilidad de contratos públicos',
    required: ['API Gateway', 'Plan de rollback'],
    investigation: 'Inventariar clientes y campos obligatorios',
    verification: 'Consumer-driven contract tests en versiones coexistentes',
    artifact: 'Diff de contrato y calendario de deprecación',
    failureMode: 'Eliminar campos sin coordinación con consumidores',
  },
  S08: {
    focus: 'Costo de distribución vs independencia de equipos',
    required: ['Dominio aislado', 'Observabilidad'],
    investigation: 'Medir fronteras transaccionales y carga operativa',
    verification: 'Prueba de latencia y failure budget por frontera',
    artifact: 'ADR monolito modular vs microservicios',
    failureMode: 'Separar servicios sin dueños ni telemetría',
  },
  S09: {
    focus: 'Pago idempotente con entrega al menos una vez',
    required: ['Idempotencia', 'Cola de eventos'],
    investigation: 'Reproducir callback duplicado y pedido no confirmado',
    verification: 'Test de reintentos, deduplicación y outbox',
    artifact: 'Secuencia de pago y matriz de idempotencia',
    failureMode: 'Cobrar dos veces ante un reintento',
  },
  S10: {
    focus: 'Consistencia y expectativas del usuario',
    required: ['Base de datos', 'Observabilidad'],
    investigation: 'Medir desfase de lecturas y stock reservado',
    verification: 'Tests de convergencia y experiencia con datos desfasados',
    artifact: 'Timeline de consistencia y políticas de compensación',
    failureMode: 'Prometer consistencia fuerte sin garantizarla',
  },
  S11: {
    focus: 'Capacidad bajo picos y cuellos de botella',
    required: ['Observabilidad', 'Cola de eventos'],
    investigation: 'Distinguir throughput, concurrencia y latencia p95',
    verification: 'Prueba de carga con saturación y límites de cola',
    artifact: 'Hoja de capacidad con supuestos y métricas',
    failureMode: 'Escalar solo CPU y olvidar la base de datos',
  },
  S12: {
    focus: 'Privacidad, autorización y trust boundaries',
    required: ['Autorización', 'Observabilidad'],
    investigation: 'Modelar amenazas y clasificar exposición de PII',
    verification: 'Pruebas de acceso horizontal y registros sin datos sensibles',
    artifact: 'Threat model STRIDE y matriz RBAC/ABAC',
    failureMode: 'Confiar en roles enviados por el frontend',
  },
  S13: {
    focus: 'Resiliencia ante proveedor intermitente',
    required: ['Observabilidad', 'Plan de rollback'],
    investigation: 'Cuantificar timeouts, reintentos y cascadas de fallos',
    verification: 'Fault injection con backoff, jitter y circuit breaker',
    artifact: 'Runbook de degradación y presupuesto de retries',
    failureMode: 'Reintentar sin límites y amplificar la caída',
  },
  S14: {
    focus: 'SLI/SLO y observabilidad orientada a usuarios',
    required: ['Observabilidad', 'API Gateway'],
    investigation: 'Correlacionar trazas de p95, saturación y errores',
    verification: 'Alertas de burn rate y trazas sintéticas',
    artifact: 'Panel SLI + runbook de hipótesis',
    failureMode: 'Medir solo disponibilidad de proceso',
  },
  S15: {
    focus: 'Despliegue progresivo y reversión',
    required: ['Plan de rollback', 'Observabilidad'],
    investigation: 'Detectar cambios incompatibles y contratos antiguos',
    verification: 'Canary con métricas y rollback probado',
    artifact: 'Plan release/rollback por etapas',
    failureMode: 'Modificar esquema destructivamente sin expand/contract',
  },
  S16: {
    focus: 'Migración de datos y APIs sin downtime',
    required: ['Plan de rollback', 'Observabilidad'],
    investigation: 'Diseñar expand/contract, backfill y reconciliación',
    verification: 'Comparación de lecturas y rollback de tráfico',
    artifact: 'Plan de fases con punto de no retorno',
    failureMode: 'Cortar escrituras antiguas antes de sincronizar',
  },
  S17: {
    focus: 'FinOps y presupuestos de confiabilidad',
    required: ['Observabilidad', 'Base de datos'],
    investigation: 'Relacionar costos por transacción con SLO',
    verification: 'Budget alerts, load test y costo marginal',
    artifact: 'Modelo de costos con escenarios y límites',
    failureMode: 'Reducir costo rompiendo SLO o seguridad',
  },
  S18: {
    focus: 'Consejo de arquitectura multi-equipo',
    required: ['Dominio aislado', 'Observabilidad'],
    investigation: 'Priorizar riesgos, trade-offs, decisiones reversibles',
    verification: 'Review interdisciplinario y plan de experimentos',
    artifact: 'Paquete C4 + ADR + plan 90 días',
    failureMode: 'Aprobar una arquitectura sin responsables ni métricas',
  },
};

const grade = (value: number): 'PASS' | 'FAIL' => (value ? 'PASS' : 'FAIL');

/** Validate a minimal, connected, directed acyclic component model. */
export function validateSeniorGraph(
  selected: string[],
  edges: [string, string][],
  required: string[],
) {
  if (selected.length < 2 || selected.length > 4) {
    return { valid: false, reason: 'Selecciona entre 2 y 4 componentes prioritarios.' };
  }
  if (!required.every((n) => selected.includes(n))) {
    return { valid: false, reason: 'Faltan componentes esenciales de la misión.' };
  }
  if (edges.length < selected.length - 1) {
    return {
      valid: false,
      reason: 'Conecta los componentes; se necesita al menos una relación por cada nodo adicional.',
    };
  }
  if (
    edges.length > 12 ||
    edges.some(([a, b]) => !selected.includes(a) || !selected.includes(b) || a === b)
  ) {
    return { valid: false, reason: 'Hay relaciones inválidas o desconectadas de la selección.' };
  }
  if (new Set(edges.map((e) => e.join('→'))).size !== edges.length) {
    return { valid: false, reason: 'El modelo contiene relaciones duplicadas.' };
  }
  const adjacency = new Map(selected.map((n) => [n, [] as string[]]));
  const undirected = new Map(selected.map((n) => [n, [] as string[]]));
  for (const [a, b] of edges) {
    adjacency.get(a)!.push(b);
    undirected.get(a)!.push(b);
    undirected.get(b)!.push(a);
  }
  const seen = new Set<string>();
  const walk = (n: string): void => {
    if (seen.has(n)) return;
    seen.add(n);
    for (const next of undirected.get(n)!) walk(next);
  };
  walk(selected[0]);
  if (seen.size !== selected.length) {
    return { valid: false, reason: 'El grafo contiene componentes desconectados.' };
  }
  const visiting = new Set<string>();
  const completed = new Set<string>();
  const cycle = (n: string): boolean => {
    if (visiting.has(n)) return true;
    if (completed.has(n)) return false;
    visiting.add(n);
    for (const next of adjacency.get(n)!) if (cycle(next)) return true;
    visiting.delete(n);
    completed.add(n);
    return false;
  };
  if (selected.some(cycle)) {
    return { valid: false, reason: 'Se detectó un ciclo de relaciones; revisa el sentido del flujo.' };
  }
  return {
    valid: true,
    reason: 'Componentes conectados y sin ciclos; la dirección y sentido de negocio deben revisarse.',
  };
}

export function seniorScenario(id: string, seed: number) {
  const base = scenarioFromSeed(id, seed);
  const variant = (seed + Number(id.replace(/\D/g, ''))) % 3;
  // Spanish group separator: `8.000 req/min` means eight thousand, NOT eight million.
  const match = /^([0-9]{1,3}(?:\.[0-9]{3})*|[0-9]+) req\/min$/.exec(base.traffic);
  if (!match) throw new Error(`Tráfico no reconocido: ${base.traffic}`);
  const load = Number(match[1].replace(/\./g, ''));
  if (!Number.isSafeInteger(load) || load <= 0) throw new Error('Tráfico fuera de rango');
  return {
    ...base,
    variant,
    requirements: [
      `Tráfico: ${base.traffic}`,
      `SLO: ${base.availability}`,
      `Equipo: ${base.team}`,
      `Presupuesto: ${base.budget}`,
      `Riesgo: ${base.failure}`,
    ],
    load,
    uptimeTarget: Number(base.availability.replace('%', '').replace(',', '.').trim()),
    severity: variant === 0 ? 'moderada' : variant === 1 ? 'alta' : 'crítica',
  };
}

export function missionPolicy(m: MissionInput, seed: number) {
  const s = seniorScenario(m.id, seed);
  const playbook = SENIOR_PLAYBOOKS[m.id];
  if (!playbook) throw Error(`Misión Senior sin playbook: ${m.id}`);
  const required = [...playbook.required] as [string, string];
  const diagnosis_options = [
    `Optimizar cambios incrementales: reducir el acoplamiento, verificar ${s.failure} y limitar la carga operativa`,
    `Diseñar para resiliencia y mayor carga: instrumentar ${s.availability}, aislar fallos y validar capacidad`,
    'Eliminar pruebas y controles de seguridad para acelerar el despliegue',
  ];
  const diagnosis_reference = s.load >= 8000 || s.uptimeTarget >= 99.9 ? 1 : 0;
  const incident_options = [
    `Contener el impacto de «${s.failure}», preservar evidencia, medir SLI y preparar rollback`,
    'Reintentar indefinidamente sin circuit breaker ni límite',
    'Eliminar alertas y desplegar cambios no revisados bajo presión',
  ];
  const rotate = <T>(a: T[], n: number) => [...a.slice(n % a.length), ...a.slice(0, n % a.length)];
  const dx = rotate(diagnosis_options, seed % 3);
  const ix = rotate(incident_options, (seed + 1) % 3);
  const phase2 = buildPhase2MissionPolicy(m.id, seed);
  const hints = deriveSeniorSuiteProgressiveHints({
    missionId: m.id,
    focus: playbook.focus,
    investigation: playbook.investigation,
    verification: playbook.verification,
    requiredComponents: required,
  });

  const target_capacity = Math.ceil((s.load * (s.uptimeTarget >= 99.9 ? 1.3 : 1.15)) / 120) * 120;
  const diagnosis_correct = dx.indexOf(diagnosis_options[diagnosis_reference]);
  const incident_correct = ix.indexOf(incident_options[0]);
  const criteria_fp = computeCriteriaSnapshotFingerprint({
    missionId: m.id,
    seed,
    traffic: s.traffic,
    availability: s.availability,
    team: s.team,
    budget: s.budget,
    failure: s.failure,
    requiredComponents: required,
    diagnosisCorrect: diagnosis_correct,
    incidentCorrect: incident_correct,
    targetCapacity: target_capacity,
  });

  return Object.freeze({
    scenario: Object.freeze(s),
    playbook: Object.freeze({ ...playbook, required: Object.freeze([...required]) as readonly [string, string] }),
    required: Object.freeze([...required]) as [string, string],
    diagnosisOptions: Object.freeze(dx) as string[],
    diagnosisCorrect: diagnosis_correct,
    recklessDiagnosisIndex: dx.indexOf(diagnosis_options[2]),
    incidentOptions: Object.freeze(ix) as string[],
    incidentCorrect: incident_correct,
    targetCapacity: target_capacity,
    criteriaFingerprint: criteria_fp,
    phase2,
    hints: Object.freeze([...hints]) as string[],
  });
}

function evaluateGraphCompat(d: SeniorDraft, required: string[]) {
  return validateSeniorGraph(d.architecture, d.relations ?? [], required);
}

export function evaluateSeniorSuite(m: MissionInput, seed: number, d: SeniorDraft) {
  const p = missionPolicy(m, seed);
  const text = d.decision.toLocaleLowerCase('es');
  const review = evaluateCodeReview(m.id, seed, d.reviewChoice ?? -1);
  const graph = evaluateGraphCompat(d, p.required);
  const architecture_ok = graph.valid;
  const references = p.scenario.requirements.filter((x) =>
    text.includes(x.split(': ')[1].toLocaleLowerCase('es')),
  ).length;
  const decision_ok =
    d.decision.trim().length >= 180 &&
    /alternativ|riesgo|trade.off|coste|costo/i.test(text) &&
    /medir|test|verific|slo|monitor|prueba/i.test(text) &&
    references >= 2;
  const capacity_ok =
    Number.isFinite(d.capacity) && d.capacity >= p.targetCapacity && d.capacity <= p.scenario.load * 4;

  const consequences = computeCrossDecisionConsequences({
    missionId: m.id,
    seed,
    loadRpm: p.scenario.load,
    budgetTier: p.scenario.budget,
    diagnosisChoice: d.diagnosis,
    diagnosisCorrect: p.diagnosisCorrect,
    recklessDiagnosisIndex: p.recklessDiagnosisIndex,
    selectedComponents: d.architecture,
    declaredCapacityRpm: d.capacity,
    targetCapacityRpm: p.targetCapacity,
  });

  const phase2_eval = evaluatePhase2Evolution({
    missionId: m.id,
    seed,
    phase2Choice: d.phase2Choice ?? -1,
    selectedComponents: d.architecture,
    diagnosisChoice: d.diagnosis,
    recklessDiagnosisIndex: p.recklessDiagnosisIndex,
  });

  const checks = [
    {
      name: SENIOR_ENGINES[0],
      status: d.diagnosis < 0 ? 'NOT_RUN' : grade(d.diagnosis === p.diagnosisCorrect ? 1 : 0),
      points: d.diagnosis === p.diagnosisCorrect ? 20 : 0,
      detail: 'Seleccionar estrategia según restricciones explícitas',
    },
    {
      name: SENIOR_ENGINES[1],
      status: !d.architecture.length ? 'NOT_RUN' : grade(architecture_ok ? 1 : 0),
      points: architecture_ok ? 20 : 0,
      detail: `${graph.reason} Referencia: ${p.required.join(' + ')}. La dirección y la semántica requieren revisión.`,
    },
    {
      name: SENIOR_ENGINES[2],
      status: !d.decision.trim() ? 'NOT_RUN' : decision_ok ? 'REQUIRES_REVIEW' : 'FAIL',
      points: decision_ok ? 20 : 0,
      detail:
        'Chequeo formal de extensión, alternativas, verificación y contexto; pertinencia técnica por revisar',
    },
    {
      name: SENIOR_ENGINES[3],
      status: d.incident < 0 ? 'NOT_RUN' : grade(d.incident === p.incidentCorrect ? 1 : 0),
      points: d.incident === p.incidentCorrect ? 20 : 0,
      detail: `Contención y rollback antes de acciones de riesgo (${consequences.incidentReadiness === 'BLIND_RESPONSE' ? 'visibilidad degradada sin Observabilidad' : 'señales activas'})`,
    },
    {
      name: SENIOR_ENGINES[4],
      status: d.capacity === 0 ? 'NOT_RUN' : grade(capacity_ok ? 1 : 0),
      points: capacity_ok ? 20 : 0,
      detail: `Capacidad declarada ${d.capacity || 0} req/min; demanda ${p.scenario.load} req/min; objetivo con holgura ${p.targetCapacity} req/min; banda efectiva [${consequences.uncertaintyBandRpm[0]}–${consequences.uncertaintyBandRpm[1]}] req/min (±${consequences.uncertaintyPercent} %)`,
    },
    {
      name: SENIOR_ENGINES[5],
      status: review.status,
      points: review.pass ? 20 : 0,
      detail: review.explanation,
    },
  ] as const;

  const mechanical = checks.filter((x) => x.status !== 'REQUIRES_REVIEW');
  const mechanical_passed = mechanical.every((x) => x.status === 'PASS');
  const canonical_gates = buildCanonicalSeniorGateMatrix({
    baseChecks: checks,
    selectedComponentsCount: d.architecture.length,
    phase2Choice: d.phase2Choice ?? -1,
    phase2RawStatus: phase2_eval.status,
    phase2Feedback: phase2_eval.feedback,
    adrDecisionOk: decision_ok,
  });

  return {
    score: Math.round((checks.reduce((n, x) => n + x.points, 0) / 120) * 100),
    checks,
    canonicalGates: canonical_gates,
    criteriaFingerprint: p.criteriaFingerprint,
    scenario: p.scenario,
    consequences,
    phase2: phase2_eval,
    reviewerQuestions: p.phase2.reviewerQuestions,
    requiresReview: decision_ok,
    mechanicalPassed: mechanical_passed,
    complete: mechanical_passed && decision_ok,
    reviewedCriteria: mechanical.length,
    totalCriteria: checks.length,
    note: 'Puntuación educativa de checks estructurales. La calidad del ADR y el dictamen experto NO se consideran aprobados automáticamente.',
  };
}

export function exportSeniorDossierV2(
  m: MissionInput,
  seed: number,
  d: SeniorDraft,
  experiment?: Record<string, unknown> | null,
  exported_at?: string,
): SeniorDossierV2Schema {
  const p = missionPolicy(m, seed);
  const eval_res = evaluateSeniorSuite(m, seed, d);
  const graph = evaluateGraphCompat(d, p.required);
  const adr_status = eval_res.checks[2].status as 'NOT_RUN' | 'FAIL' | 'REQUIRES_REVIEW';

  return buildValidatedSeniorDossierV2({
    mission: m,
    seed,
    scenario: p.scenario,
    selectedComponents: d.architecture,
    directedEdges: d.relations ?? [],
    graphValid: graph.valid,
    graphReason: graph.reason,
    adrText: d.decision,
    adrStatus: adr_status,
    declaredCapacityRpm: d.capacity,
    targetCapacityRpm: p.targetCapacity,
    consequences: eval_res.consequences,
    phase2Policy: p.phase2,
    phase2Choice: d.phase2Choice ?? -1,
    phase2Evaluation: eval_res.phase2,
    devsecops: evaluateDevSecOps(m.id, d.devsecopsControls || []),
    threatModel: evaluateThreat(m.id, seed, d.threatChoice ?? -1),
    experimentResult: experiment || { status: 'NOT_RUN' },
    checks: eval_res.checks,
    mechanicalScorePercent: eval_res.score,
    mechanicalPassed: eval_res.mechanicalPassed,
    verificationPlan: p.playbook.verification,
    humanReview: d.mentorReview ?? null,
    exportedAt: exported_at,
  });
}

export function importSeniorDossierV2Json(raw_json: string): {
  readonly dossier: SeniorDossierV2Schema;
  readonly restoredDraftPatch: Pick<
    SeniorDraft,
    'architecture' | 'relations' | 'decision' | 'capacity' | 'phase2Choice' | 'mentorReview'
  >;
} {
  const parsed = seniorDossierV2Schema.parse(JSON.parse(raw_json), 'dossier-v2.json');
  return {
    dossier: parsed,
    restoredDraftPatch: {
      architecture: [...parsed.architectureGraph.selectedComponents],
      relations: parsed.architectureGraph.directedEdges.map(([a, b]) => [a, b] as [string, string]),
      decision: parsed.adr.text,
      capacity: parsed.capacityAndFinops.declaredRpm,
      phase2Choice: parsed.chainedPhase2.selectedOptionIndex,
      mentorReview: parsed.humanReview,
    },
  };
}

export function seniorDossierMarkdown(m: MissionInput, seed: number, d: SeniorDraft): string {
  const policy = missionPolicy(m, seed);
  const result = evaluateSeniorSuite(m, seed, d);
  const clean = (v: string) => v.replace(/\r/g, '').split('\u0000').join('');

  return [
    `# ${m.id} — ${m.title}`,
    '',
    `Variante reproducible: ${seed} · Esquema Dossier v2`,
    'Evaluador: ARQPIXEL Senior v2.0 (modelo educativo determinista, no certificación)',
    '',
    '## Contexto',
    clean(m.brief),
    '',
    `**Foco:** ${policy.playbook.focus}`,
    '',
    '## Restricciones',
    ...policy.scenario.requirements.map((x) => '- ' + x),
    '',
    '## Investigación solicitada',
    policy.playbook.investigation,
    '',
    '## Componentes propuestos',
    ...(d.architecture.length ? d.architecture : ['Sin seleccionar']).map((x) => '- ' + x),
    '',
    '## Relaciones diseñadas',
    ...((d.relations || []).length
      ? (d.relations || []).map(([a, b]) => `- ${a} → ${b}`)
      : ['Sin relaciones']),
    '',
    '## Consecuencias Acumulativas (Capacidad, Incertidumbre y FinOps)',
    `- Capacidad efectiva estimada: ${result.consequences.effectiveCapacityRpm} req/min (banda [${result.consequences.uncertaintyBandRpm[0]}–${result.consequences.uncertaintyBandRpm[1]}] req/min, ±${result.consequences.uncertaintyPercent} %)`,
    `- Estimación FinOps mensual: ~$${result.consequences.estimatedMonthlyUsd} USD/mes frente a techo orientativo $${result.consequences.budgetCeilingUsd} USD/mes (${result.consequences.finopsStatus})`,
    `- Preparación ante incidente: ${result.consequences.incidentReadiness}`,
    `- Aviso FinOps: ${result.consequences.costDisclaimer}`,
    '',
    `## ${policy.phase2.crisisTitle}`,
    policy.phase2.triggerEvent,
    `- Estado Fase 2: ${result.phase2.status} — ${result.phase2.feedback}`,
    '',
    '## ADR del estudiante',
    clean(d.decision || '_Sin redactar_'),
    '',
    '## Revisión de contrato/código',
    codeReviewPolicy(m.id, seed).context,
    '',
    `Respuesta del estudiante: ${d.reviewChoice < 0 ? 'NOT_RUN' : (codeReviewPolicy(m.id, seed).options[d.reviewChoice] ?? 'Selección inválida')}`,
    '',
    '## Experimento de impacto',
    ...(Number.isInteger(d.impactChoice) && d.impactChoice >= 0 && d.impactChoice <= 2
      ? (() => {
          const r = simulateMissionImpact(m.id, seed, d.impactChoice);
          return [
            `Control: ${r.control}`,
            `Métrica sintética: ${r.baseline} → ${r.remaining} ${r.unit}`,
            `Trade-off: ${r.tradeoff}`,
            `Supuesto: ${r.assumptions}`,
          ];
        })()
      : ['NOT_RUN']),
    '',
    '## Bonus DevSecOps',
    JSON.stringify(evaluateDevSecOps(m.id, d.devsecopsControls || []), null, 2),
    '',
    '## Threat Modeling / STRIDE',
    ...(() => {
      const threat = threatExercise(m.id, seed);
      const t_res = evaluateThreat(m.id, seed, d.threatChoice ?? -1);
      return [
        `Activo: ${threat.asset}`,
        `Límite de confianza: ${threat.boundary}`,
        `Amenaza: ${threat.stride} — ${threat.abuse}`,
        `Mitigación elegida: ${d.threatChoice < 0 ? 'NOT_RUN' : (threat.choices[d.threatChoice] ?? 'Inválida')}`,
        `Evaluación: ${t_res.status}; ${t_res.reason}`,
        `Prueba sugerida: ${t_res.proof}`,
      ];
    })(),
    '',
    '## Evaluación mecánica',
    ...result.checks.map((x) => `- ${x.name}: ${x.status} (${x.points}/20) — ${x.detail}`),
    '',
    '## Guía de preguntas para el Revisor Humano',
    ...policy.phase2.reviewerQuestions.map((q, idx) => `${idx + 1}. ${q}`),
    '',
    formatMentorReviewMarkdown(d.mentorReview ?? null),
    '',
    '## Riesgo / antipatrón a evitar',
    policy.playbook.failureMode,
    '',
    '## Plan de validación recomendado',
    policy.playbook.verification,
    '',
    '## Guía de solución razonada y alternativas defendibles',
    `- Estrategia de referencia (${policy.scenario.traffic}, SLO ${policy.scenario.availability}, ${policy.scenario.team}): ${m.decision}`,
    `- Flujo esencial esperado: ${policy.playbook.required[0]} -> ${policy.playbook.required[1]}`,
    `- Cuándo cambiaría la decisión: si el tráfico cae por debajo de 2.000 req/min o el SLO baja de 99,5 %, una variante incremental más simple evita sobrecoste operativo.`,
    '',
    '## Evidencia final esperada',
    policy.playbook.artifact,
    '',
    '## Límites de la evaluación',
    'Los chequeos evalúan condiciones estructurales o una simulación idealizada; requieren revisión humana del ADR, del riesgo y de la calidad de las decisiones.',
    '',
  ].join('\n');
}

export function emptySeniorDraft(): SeniorDraft {
  return {
    diagnosis: -1,
    architecture: [],
    relations: [],
    decision: '',
    incident: -1,
    capacity: 0,
    reviewChoice: -1,
    impactChoice: -1,
    devsecopsControls: [],
    threatChoice: -1,
    phase2Choice: -1,
    mentorReview: null,
    updated: new Date(0).toISOString(),
  };
}

export function sanitizeSeniorDraft(value: unknown): SeniorDraft | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (
    typeof v.decision !== 'string' ||
    v.decision.length > 18000 ||
    !Array.isArray(v.architecture) ||
    v.architecture.length > ARCH_COMPONENTS.length ||
    v.architecture.some((x) => typeof x !== 'string' || !ARCH_COMPONENTS.includes(x)) ||
    !Number.isInteger(v.diagnosis) ||
    !Number.isInteger(v.incident) ||
    !Number.isFinite(v.capacity) ||
    Number(v.capacity) < 0 ||
    Number(v.capacity) > 10000000 ||
    Number(v.diagnosis) < -1 ||
    Number(v.diagnosis) > 2 ||
    Number(v.incident) < -1 ||
    Number(v.incident) > 2 ||
    !(
      v.relations === undefined ||
      (Array.isArray(v.relations) &&
        v.relations.length <= 12 &&
        v.relations.every(
          (e) =>
            Array.isArray(e) &&
            e.length === 2 &&
            e.every((n: unknown) => typeof n === 'string' && ARCH_COMPONENTS.includes(n)),
        ))
    ) ||
    !(
      v.reviewChoice === undefined ||
      (Number.isInteger(v.reviewChoice) &&
        Number(v.reviewChoice) >= -1 &&
        Number(v.reviewChoice) <= 2)
    ) ||
    !(
      v.impactChoice === undefined ||
      (Number.isInteger(v.impactChoice) &&
        Number(v.impactChoice) >= -1 &&
        Number(v.impactChoice) <= 2)
    ) ||
    !(
      v.devsecopsControls === undefined ||
      (Array.isArray(v.devsecopsControls) &&
        v.devsecopsControls.length <= 4 &&
        v.devsecopsControls.every(
          (x) => typeof x === 'string' && SECURITY_CONTROLS.some((c) => c.id === x),
        ))
    ) ||
    !(
      v.threatChoice === undefined ||
      (Number.isInteger(v.threatChoice) &&
        Number(v.threatChoice) >= -1 &&
        Number(v.threatChoice) <= 2)
    ) ||
    !(
      v.phase2Choice === undefined ||
      (Number.isInteger(v.phase2Choice) &&
        Number(v.phase2Choice) >= -1 &&
        Number(v.phase2Choice) <= 2)
    )
  ) {
    return null;
  }

  let mentor_review: MentorReviewSchema | null = null;
  if (v.mentorReview !== undefined && v.mentorReview !== null) {
    const parsed_mentor = sanitizeMentorReview(v.mentorReview);
    if (!parsed_mentor) return null;
    mentor_review = parsed_mentor;
  }

  return {
    diagnosis: Number(v.diagnosis),
    incident: Number(v.incident),
    decision: v.decision,
    architecture: [...new Set(v.architecture as string[])],
    relations:
      v.relations === undefined
        ? []
        : (v.relations as [string, string][]).map((e) => [...e] as [string, string]),
    capacity: Number(v.capacity),
    reviewChoice: v.reviewChoice === undefined ? -1 : Number(v.reviewChoice),
    impactChoice: v.impactChoice === undefined ? -1 : Number(v.impactChoice),
    devsecopsControls: Array.isArray(v.devsecopsControls)
      ? [...new Set(v.devsecopsControls as string[])]
      : [],
    threatChoice: v.threatChoice === undefined ? -1 : Number(v.threatChoice),
    phase2Choice: v.phase2Choice === undefined ? -1 : Number(v.phase2Choice),
    mentorReview: mentor_review,
    updated:
      typeof v.updated === 'string' && Number.isFinite(Date.parse(v.updated))
        ? v.updated
        : new Date(0).toISOString(),
  };
}

const escapeHTML = (v: unknown): string =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c),
  );

function download(name: string, source: string, mime = 'application/json'): void {
  const a = document.createElement('a');
  const u = URL.createObjectURL(new Blob([source], { type: mime }));
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1_500);
}

export function mountSeniorSuite(
  m: MissionInput,
  seed: number,
  onEvaluate?: (result: ReturnType<typeof evaluateSeniorSuite>, draft: SeniorDraft) => void,
  seedOptions?: {
    readonly savedSeed?: number;
    readonly onSeedChange?: (nextSeed: number) => void;
  },
): void {
  const root = document.querySelector('#senior-suite') as HTMLElement | null;
  if (!root) return;
  const normalized_seed = sanitizeSeniorSeed(seed, 0);
  seed = normalized_seed;
  const p = missionPolicy(m, seed);
  const review = codeReviewPolicy(m.id, seed);
  const threat = threatExercise(m.id, seed);
  const impact = IMPACT_MODELS[m.id];
  const key = `arqpixel-senior-suite-v2-${m.id}-${seed}`;
  const ref_repo_missions = new Set(['S04', 'S06', 'S09']);

  let draft = emptySeniorDraft();
  try {
    const stored = localStorage.getItem(key);
    if (stored) draft = sanitizeSeniorDraft(JSON.parse(stored)) || draft;
  } catch {
    /* ignore */
  }

  const save = (): void => {
    draft.updated = new Date().toISOString();
    try {
      localStorage.setItem(key, JSON.stringify(draft));
    } catch {
      const el = root.querySelector('#suite-feedback');
      if (el) el.textContent = 'No fue posible guardar localmente. Exporta la evidencia.';
    }
  };

  root.innerHTML = `<div class="page-title"><span class="eyebrow crown-color">♛ SENIOR MODE 2.0 · TALLER ENCADENADO</span><h1>${escapeHTML(m.id)} — ${escapeHTML(m.title)}</h1><p>Seis actividades conectadas, consecuencias acumulativas FinOps/Capacidad, cadena de incidente T0→T2, crisis en Fase 2 y rúbrica humana auditable; variante ${seed}. Simulación educativa local, no prueba de producción ni certificación.</p></div>
  ${renderSeedReproducerBarHtml({
    idPrefix: 'suite',
    missionId: m.id,
    activeSeed: seed,
    savedSeed: seedOptions?.savedSeed,
    criteriaFingerprint: p.criteriaFingerprint,
  })}
  ${renderSeniorVisualFlowSvgHtml(m.id, seed)}
  <div class="mobile-workspace-tabs" role="tablist" aria-label="Secciones del taller Senior">
    <button type="button" role="tab" class="ws-tab-btn active" aria-selected="true" data-ws-tab="all">Vista completa</button>
    <button type="button" role="tab" class="ws-tab-btn" aria-selected="false" data-ws-tab="context">Contexto</button>
    <button type="button" role="tab" class="ws-tab-btn" aria-selected="false" data-ws-tab="work">Trabajo</button>
    <button type="button" role="tab" class="ws-tab-btn" aria-selected="false" data-ws-tab="validation">Validación</button>
  </div>
  <div class="workspace-panes-root" data-active-pane="all">
    <section class="suite-scenario" data-workspace-pane="context">
      <h2>Brief y restricciones verificables</h2>
      <p>${escapeHTML(m.brief)} · ${escapeHTML(m.decision)}</p>
      <p><strong>Foco:</strong> ${escapeHTML(p.playbook.focus)}</p>
      <p><strong>Investiga:</strong> ${escapeHTML(p.playbook.investigation)}</p>
      <p><strong>Entregable:</strong> ${escapeHTML(p.playbook.artifact)}</p>
      <div class="suite-chips">${p.scenario.requirements.map((x) => `<span>${escapeHTML(x)}</span>`).join('')}</div>
      ${ref_repo_missions.has(m.id) ? `<p class="mt-12"><a class="btn secondary small" href="#/proyectos">📦 Explorar repositorio ejecutable de referencia NexoShop (NestJS + Drizzle + Outbox) →</a></p>` : ''}
    </section>

    <section class="suite-card suite-experiment" data-workspace-pane="context" id="suite-consequences-card">
      <span class="suite-number">TELEMETRÍA CRUZADA · EFECTOS ENTRE DECISIONES</span>
      <h2>Impacto acumulado de tus elecciones (Capacidad, FinOps y Señales)</h2>
      <div id="suite-consequences-panel" class="suite-sim-results" role="status" aria-live="polite"></div>
    </section>

    <section class="suite-card suite-experiment" data-workspace-pane="context" id="suite-chained-incident-card">
      <span class="suite-number">INCIDENTE ENCADENADO T0 → T1 → T2 · TRADE-OFF DINÁMICO</span>
      <h2>Progresión acumulativa de Error Budget y MTTR</h2>
      <label class="field-label">Postura de trade-off prioritaria para ${escapeHTML(m.id)}
        <select id="suite-tradeoff-stance">
          ${SENIOR_TRADEOFF_STANCES.map((st) => `<option value="${st.id}">${escapeHTML(st.label)}</option>`).join('')}
        </select>
      </label>
      <div id="suite-chained-incident-panel" class="suite-sim-results" role="status" aria-live="polite"></div>
    </section>

    <div class="suite-grid" data-workspace-pane="work">
      <section class="suite-card"><span class="suite-number">01 / 06</span><h2>Diagnóstico</h2><p>¿Qué enfoque justifica una decisión antes de elegir tecnología?</p>${p.diagnosisOptions.map((x, i) => `<label class="suite-option"><input type="radio" name="suite-diagnosis" value="${i}" ${draft.diagnosis === i ? 'checked' : ''}/><span>${escapeHTML(x)}</span></label>`).join('')}</section>
      <section class="suite-card"><span class="suite-number">02 / 06</span><h2>Architecture Builder</h2><p>Selecciona componentes para la arquitectura de ${escapeHTML(m.title)}. Elige entre 2 y 4 componentes prioritarios. Seleccionarlos todos es sobrediseño; justifica los descartados.</p><div class="suite-checks">${ARCH_COMPONENTS.map((x) => `<label><input type="checkbox" data-suite-arch="${escapeHTML(x)}" ${draft.architecture.includes(x) ? 'checked' : ''}/> ${escapeHTML(x)}</label>`).join('')}</div><div class="senior-graph"><h3>Topología visual en vivo y relaciones</h3><p class="muted">Conecta tus nodos para crear un grafo dirigido. Un ciclo o un componente aislado no supera la validación de estructura.</p><div class="map-svg-wrap my-14" id="suite-graph-svg" tabindex="0" role="region" aria-label="Vista visual del grafo Senior"></div><div class="builder-box"><label>Origen <select id="suite-edge-from">${ARCH_COMPONENTS.map((x) => `<option>${escapeHTML(x)}</option>`).join('')}</select></label><label>Destino <select id="suite-edge-to">${ARCH_COMPONENTS.map((x) => `<option>${escapeHTML(x)}</option>`).join('')}</select></label><button class="btn secondary small" id="suite-add-edge" type="button">Añadir relación</button></div><div id="suite-graph" class="suite-graph" aria-label="Relaciones actuales"></div><p id="suite-graph-feedback" class="muted" role="status" aria-live="polite"></p></div></section>
      <section class="suite-card"><span class="suite-number">03 / 06</span><h2>Decision / ADR</h2><p>Incluye decisión, alternativas, riesgos, dos restricciones concretas y cómo validarás el resultado. Mínimo 180 caracteres.</p><p class="muted"><strong>Criterio técnico:</strong> ${escapeHTML(p.playbook.verification)}</p><textarea id="suite-adr" aria-label="Registro de decisión arquitectónica ADR" rows="9" maxlength="18000" class="note-area" placeholder="Contexto / decisión / alternativa / riesgos / métricas / reversión...">${escapeHTML(draft.decision)}</textarea><p class="muted">Se valida estructura automáticamente; calidad arquitectónica requiere revisión humana.</p></section>
      <section class="suite-card"><span class="suite-number">04 / 06</span><h2>Incident Response</h2><p>Incidente: ${escapeHTML(p.scenario.failure)}. ¿Cuál es la primera respuesta defendible?</p><p class="muted">Antipatrón a evitar: ${escapeHTML(p.playbook.failureMode)}</p>${p.incidentOptions.map((x, i) => `<label class="suite-option"><input type="radio" name="suite-incident" value="${i}" ${draft.incident === i ? 'checked' : ''}/><span>${escapeHTML(x)}</span></label>`).join('')}</section>
      <section class="suite-card"><span class="suite-number">05 / 06</span><h2>Capacity / Reliability</h2><p>Demanda del modelo: <strong>${p.scenario.load.toLocaleString('es')} req/min</strong>. Calcula la capacidad que cubra la demanda con holgura y sin sobredimensionar más de 4×.</p><label class="field-label">Capacidad elegida (req/min)<input type="number" id="suite-capacity" min="0" max="10000000" step="1" value="${draft.capacity}"/></label><p class="muted">Usa una holgura simplificada del 30 % cuando el SLO ≥ 99,9 %, o 15 % en los demás casos; verás el valor exacto al evaluar. Supuesto: capacidad lineal, sin colas ni overhead; no es un dimensionamiento de producción.</p></section>
      <section class="suite-card"><span class="suite-number">06 / 06</span><h2>Contract / Code Review</h2><p><strong>${escapeHTML(review.context)}</strong>. Identifica la mejora principal y compruébala con una prueba.</p><pre class="suite-code"><code>${escapeHTML(review.snippet)}</code></pre>${review.options.map((x, i) => `<label class="suite-option"><input type="radio" name="suite-review" value="${i}" ${draft.reviewChoice === i ? 'checked' : ''}/><span>${escapeHTML(x)}</span></label>`).join('')}<p class="muted">El fragmento es intencionalmente defectuoso y educativo: no se ejecuta código del alumno.</p></section>
    </div>

    <section class="suite-card suite-experiment" data-workspace-pane="work" id="phase2-evolution-gate">
      <span class="suite-number">FASE 2 ENCADENADA · EVOLUCIÓN Y CONTRAEJEMPLO</span>
      <h2>${escapeHTML(p.phase2.crisisTitle)}</h2>
      <p>${escapeHTML(p.phase2.triggerEvent)}</p>
      <p class="muted">Tu arquitectura de Fase 1 debe respaldar esta respuesta (requiere soporte explícito como <strong>${escapeHTML(p.phase2.requiredPhase1Support)}</strong>).</p>
      ${p.phase2.options.map((option, i) => `<label class="suite-option"><input type="radio" name="suite-phase2" value="${i}" ${(draft.phase2Choice ?? -1) === i ? 'checked' : ''}/><span>${escapeHTML(option)}</span></label>`).join('')}
      <button type="button" class="btn secondary" id="evaluate-phase2">Evaluar resistencia en Fase 2</button>
      <div id="phase2-report" class="suite-sim-results" role="status" aria-live="polite">Selecciona una respuesta para comprobar cómo resiste tu diseño de Fase 1.</div>
    </section>

    <section class="suite-card suite-experiment" data-workspace-pane="work" id="threat-gate"><span class="suite-number">BONUS · THREAT MODELING / STRIDE</span><h2>Analiza la superficie de ataque</h2><p><strong>Activo:</strong> ${escapeHTML(threat.asset)}<br><strong>Trust boundary:</strong> ${escapeHTML(threat.boundary)}<br><strong>Amenaza ${escapeHTML(threat.stride)}:</strong> ${escapeHTML(threat.abuse)}</p><p>Selecciona la mitigación prioritaria y diseña una prueba: este ejercicio no ejecuta ataques ni certifica seguridad.</p>${threat.choices.map((option, i) => `<label class="suite-option"><input type="radio" name="suite-threat" value="${i}" ${draft.threatChoice === i ? 'checked' : ''}/><span>${escapeHTML(option)}</span></label>`).join('')}<button type="button" class="btn secondary" id="evaluate-threat">Evaluar modelo de amenazas</button><div id="threat-report" class="suite-sim-results" role="status" aria-live="polite">Identifica el riesgo antes de validar controles.</div></section>
    <section class="suite-card suite-experiment" data-workspace-pane="work" id="devsecops-gate"><span class="suite-number">BONUS · DEVSECOPS RELEASE GATE</span><h2>Diseña la seguridad del pipeline</h2><p><strong>${escapeHTML(devsecopsPolicy(m.id).focus)}</strong>. Elige de 2 a 4 controles, prioriza los adecuados a esta misión y analiza el riesgo residual. No modifica las 6 actividades ni acredita una auditoría real.</p><div class="suite-checks">${SECURITY_CONTROLS.map((x) => `<label><input type="checkbox" data-devsecops="${escapeHTML(x.id)}" ${draft.devsecopsControls.includes(x.id) ? 'checked' : ''}/> ${escapeHTML(x.label)}</label>`).join('')}</div><button type="button" class="btn secondary" id="evaluate-devsecops">Evaluar gate DevSecOps</button><div id="devsecops-report" class="suite-sim-results" role="status" aria-live="polite">Selecciona controles y ejecuta la evaluación.</div></section>
    <section class="suite-card suite-experiment" data-workspace-pane="validation" id="impact-experiment"><span class="suite-number">LABORATORIO DE IMPACTO · ${escapeHTML(m.id)}</span><h2>Compara consecuencias de tus decisiones</h2><p>Métrica: <strong>${escapeHTML(impact.metric)}</strong>. Modelo sintético, no benchmark de producción.</p><div class="suite-checks">${impact.controls.map((x, i) => `<label><input type="radio" name="suite-impact" value="${i}" ${draft.impactChoice === i ? 'checked' : ''}/> ${escapeHTML(x)}</label>`).join('')}</div><div class="inline-actions"><button class="btn secondary" id="run-impact-simulation">Simular consecuencias</button></div><div id="impact-result" class="suite-sim-results" role="status" aria-live="polite">Elige un control para ver su efecto y sus costos.</div></section>
    ${m.id === 'S09' ? `<section class="suite-card suite-experiment" data-workspace-pane="validation" id="payment-experiment"><span class="suite-number">BANCO DE PRUEBAS · PAGOS</span><h2>Reintentos, idempotencia y outbox</h2><p>Ejecuta un fixture determinista con reintentos y eventos perdidos. Cambia cada salvaguarda y compara invariantes; no son transacciones reales.</p><div class="suite-controls"><label>Reintentos (%) <input id="payment-retries" type="number" min="0" max="100" step="5" value="25"/></label><label><input id="payment-idempotency" type="checkbox" checked/> Clave idempotente persistida</label><label><input id="payment-outbox" type="checkbox" checked/> Outbox transaccional</label></div><button class="btn secondary" id="run-payment-simulation">Simular 100 pedidos</button><div id="payment-simulation-result" class="suite-sim-results" role="status" aria-live="polite">Todavía no se ejecutó la simulación.</div></section>` : ''}
    ${m.id === 'S11' ? `<section class="suite-card suite-experiment" data-workspace-pane="validation" id="capacity-experiment"><span class="suite-number">BANCO DE PRUEBAS · ESCALABILIDAD</span><h2>Picos de tráfico y saturación</h2><p>Estima la cola acumulada y la carga descartada por minuto usando la demanda real de esta variante.</p><div class="suite-controls"><label>Réplicas <input id="capacity-workers" type="number" min="1" max="10000" value="4"/></label><label>Capacidad por réplica (req/min) <input id="capacity-rpm" type="number" min="1" max="100000" value="2000"/></label><label>Buffer de cola <input id="capacity-queue" type="number" min="0" max="10000000" value="10000"/></label><label>Duración del pico (min) <input id="capacity-duration" type="number" min="1" max="120" value="10"/></label></div><button class="btn secondary" id="run-capacity-simulation">Simular pico</button><div id="capacity-simulation-result" class="suite-sim-results" role="status" aria-live="polite">Todavía no se ejecutó la simulación.</div></section>` : ''}

    <section class="suite-card suite-experiment" data-workspace-pane="validation" id="human-review-gate">
      <span class="suite-number">FLUJO AUDITABLE · REQUIRES_REVIEW → RÚBRICA EXPERTA</span>
      <h2>Guía y dictamen de Revisión Humana (Independiente del Score Mecánico)</h2>
      <p>Preguntas de auditoría para el mentor o comité de arquitectura:</p>
      <ol class="hint-list">
        ${p.phase2.reviewerQuestions.map((q) => `<li>${escapeHTML(q)}</li>`).join('')}
      </ol>
      <details class="mt-14">
        <summary class="mentor-summary">Adjuntar o importar dictamen de mentor / comité (JSON estructurado)</summary>
        <div class="mt-12">
          <div class="specialization-grid">
            <label class="field-label">Nombre del revisor<input id="mentor-name" maxlength="120" value="${escapeHTML(draft.mentorReview?.reviewerName || '')}" placeholder="Ej. Staff Architect Comité"/></label>
            <label class="field-label">Rol / Comité<input id="mentor-role" maxlength="120" value="${escapeHTML(draft.mentorReview?.reviewerRole || '')}" placeholder="Ej. Principal Software Architect"/></label>
          </div>
          <label class="field-label">Dictamen experto
            <select id="mentor-verdict">
              <option value="APPROVED_WITH_EVIDENCE" ${draft.mentorReview?.verdict === 'APPROVED_WITH_EVIDENCE' ? 'selected' : ''}>APPROVED_WITH_EVIDENCE · Diseño defendible con evidencias</option>
              <option value="ITERATE_DESIGN" ${draft.mentorReview?.verdict === 'ITERATE_DESIGN' ? 'selected' : ''}>ITERATE_DESIGN · Requiere iterar supuestos o límites</option>
              <option value="REJECTED_UNSAFE" ${draft.mentorReview?.verdict === 'REJECTED_UNSAFE' ? 'selected' : ''}>REJECTED_UNSAFE · Riesgo inaceptable en producción</option>
            </select>
          </label>
          <div class="specialization-grid">
            <label class="field-label">Comentario sobre ADR<textarea id="mentor-adr" rows="2" class="note-area" placeholder="Mín. 12 caracteres">${escapeHTML(draft.mentorReview?.criteriaComments.adrQuality || '')}</textarea></label>
            <label class="field-label">Realismo de trade-offs<textarea id="mentor-tradeoff" rows="2" class="note-area" placeholder="Mín. 12 caracteres">${escapeHTML(draft.mentorReview?.criteriaComments.tradeOffRealism || '')}</textarea></label>
            <label class="field-label">Modos de fallo y resiliencia<textarea id="mentor-failures" rows="2" class="note-area" placeholder="Mín. 12 caracteres">${escapeHTML(draft.mentorReview?.criteriaComments.failureModes || '')}</textarea></label>
            <label class="field-label">Rigor de verificación<textarea id="mentor-verif" rows="2" class="note-area" placeholder="Mín. 12 caracteres">${escapeHTML(draft.mentorReview?.criteriaComments.verificationRigor || '')}</textarea></label>
          </div>
          <label class="field-label">Conclusión y firma del revisor<textarea id="mentor-notes" rows="2" class="note-area" placeholder="Mín. 15 caracteres">${escapeHTML(draft.mentorReview?.overallNotes || '')}</textarea></label>
          <div class="inline-actions">
            <button type="button" class="btn secondary small" id="save-mentor-review">Adjuntar dictamen humano</button>
            <label class="btn secondary small file-label">Importar dictamen JSON<input type="file" accept="application/json,.json" id="import-mentor-review" class="sr-file-input"/></label>
          </div>
        </div>
      </details>
      <div id="mentor-review-status" class="suite-sim-results" role="status" aria-live="polite"></div>
    </section>

    <section class="suite-card" data-workspace-pane="validation">
      <h2>Evidencias y evaluación (Dossier v2)</h2>
      <div class="inline-actions">
        <button class="btn primary" id="suite-evaluate">Evaluar las 6 actividades</button>
        <button class="btn secondary" id="suite-export">Exportar evidencias JSON</button>
        <label class="btn secondary file-label">Importar Dossier v2 JSON<input type="file" accept="application/json,.json" id="suite-import-dossier" class="sr-file-input"/></label>
        <button class="btn secondary" id="suite-export-md">Exportar dossier Markdown</button>
        <button type="button" class="btn secondary" id="suite-print-pdf" data-print-dossier="true">🖨 Imprimir / PDF</button>
        <button class="btn secondary" id="suite-hint">Mostrar pista</button>
        <a class="btn secondary" href="#/mision/${escapeHTML(m.id)}">ADR tradicional</a>
      </div>
      <p id="suite-hint-text" class="muted" aria-live="polite"></p>
      <div id="suite-feedback" role="status" aria-live="polite"></div>
      <div id="suite-report"></div>
    </section>
  </div>`;

  root.querySelectorAll<HTMLButtonElement>('[data-ws-tab]').forEach((tab_btn) => {
    tab_btn.addEventListener('click', () => {
      const pane = tab_btn.dataset.wsTab || 'all';
      const panes_root = root.querySelector('.workspace-panes-root') as HTMLElement | null;
      if (panes_root?.setAttribute) panes_root.setAttribute('data-active-pane', pane);
      root.querySelectorAll<HTMLButtonElement>('[data-ws-tab]').forEach((other) => {
        const active = other === tab_btn;
        other.classList.toggle('active', active);
        other.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    });
  });

  let experiment: Record<string, unknown> | null = null;

  const paintMentorStatus = (): void => {
    const el = root.querySelector('#mentor-review-status');
    if (!el) return;
    if (!draft.mentorReview) {
      el.innerHTML =
        '<strong>Estado humano: REQUIRES_REVIEW (Pendiente)</strong><p class="muted">Ningún dictamen adjunto todavía. El puntaje automático nunca sustituye la revisión experta.</p>';
      return;
    }
    const rev = draft.mentorReview;
    el.innerHTML = `<strong>Dictamen humano adjunto: ${escapeHTML(rev.verdict)}</strong>
      <p><b>Revisor:</b> ${escapeHTML(rev.reviewerName)} (${escapeHTML(rev.reviewerRole)}) · ${escapeHTML(rev.reviewedAt)}</p>
      <p>${escapeHTML(rev.overallNotes)}</p>
      <small>Auditado por separado: este dictamen no altera ni infla el puntaje mecánico ni el XP.</small>`;
  };

  let activeStance: DynamicTradeoffStanceId = 'prioritize_consistency';

  const paintConsequences = (): void => {
    const el = root.querySelector('#suite-consequences-panel');
    if (!el) return;
    const c = computeCrossDecisionConsequences({
      missionId: m.id,
      seed,
      loadRpm: p.scenario.load,
      budgetTier: p.scenario.budget,
      diagnosisChoice: draft.diagnosis,
      diagnosisCorrect: p.diagnosisCorrect,
      recklessDiagnosisIndex: p.recklessDiagnosisIndex,
      selectedComponents: draft.architecture,
      declaredCapacityRpm: draft.capacity,
      targetCapacityRpm: p.targetCapacity,
    });
    el.innerHTML = `<p><strong>Capacidad efectiva con incertidumbre:</strong> ${c.effectiveCapacityRpm.toLocaleString('es')} req/min (banda [${c.uncertaintyBandRpm[0].toLocaleString('es')} – ${c.uncertaintyBandRpm[1].toLocaleString('es')}] req/min · ±${c.uncertaintyPercent} %)</p>
      <p><strong>Estimación FinOps mensual:</strong> ~$${c.estimatedMonthlyUsd} USD/mes vs techo orientativo $${c.budgetCeilingUsd} USD/mes (${c.finopsStatus === 'WITHIN_ESTIMATE' ? '✓ Dentro de presupuesto estimado' : '⚠ Desviación FinOps / sobrediseño'})</p>
      <p><strong>Visibilidad en Incident Response:</strong> ${c.incidentReadiness} ${c.availableSignals.length ? `· Señales activas: ${escapeHTML(c.availableSignals.join(' | '))}` : ''}</p>
      ${c.blindSpots.map((b) => `<p class="muted">⚠ ${escapeHTML(b)}</p>`).join('')}
      <small>${escapeHTML(c.costDisclaimer)}</small>`;

    const chained_el = root.querySelector('#suite-chained-incident-panel');
    if (chained_el) {
      const p2_eval = evaluatePhase2Evolution({
        missionId: m.id,
        seed,
        phase2Choice: draft.phase2Choice ?? -1,
        selectedComponents: draft.architecture,
        diagnosisChoice: draft.diagnosis,
        recklessDiagnosisIndex: p.recklessDiagnosisIndex,
      });
      const prog = evaluateChainedIncidentProgression({
        missionId: m.id,
        seed,
        selectedStance: activeStance,
        selectedComponents: draft.architecture,
        incidentChoiceCorrect: draft.incident === p.incidentCorrect,
        phase2Status: p2_eval.status,
      });
      chained_el.innerHTML = `<p><strong>Veredicto acumulativo:</strong> ${prog.cumulativeVerdict} · <strong>Error Budget restante:</strong> ${prog.finalErrorBudgetPct}% · <strong>MTTR total:</strong> ${prog.totalMttrMinutes} min</p>
        <p>${escapeHTML(prog.tradeoffSummary)}</p>
        ${renderChainedIncidentTimelineSvgHtml(prog)}`;
    }
  };

  const stance_sel = root.querySelector('#suite-tradeoff-stance') as HTMLSelectElement | null;
  if (stance_sel) {
    stance_sel.onchange = () => {
      activeStance = stance_sel.value as DynamicTradeoffStanceId;
      paintConsequences();
    };
  }

  if (m.id === 'S09') {
    root.querySelector('#run-payment-simulation')?.addEventListener('click', () => {
      const el = root.querySelector('#payment-simulation-result')!;
      try {
        const r = simulatePaymentReplay({
          orders: 100,
          duplicateRate: Number((root.querySelector('#payment-retries') as HTMLInputElement).value),
          idempotency: (root.querySelector('#payment-idempotency') as HTMLInputElement).checked,
          outbox: (root.querySelector('#payment-outbox') as HTMLInputElement).checked,
        });
        experiment = { kind: 'S09-payment-replay', ...r };
        el.innerHTML = `<p><strong>Intentos repetidos:</strong> ${r.repeatAttempts} · <strong>Cobros duplicados:</strong> ${r.duplicateCharges} · <strong>Eventos no publicados:</strong> ${r.lostEvents}</p><p>${r.invariants.oneChargePerOrder ? '✓' : '⚠'} A lo sumo un cargo por pedido · ${r.invariants.oneEventualEventPerOrder ? '✓' : '⚠'} Evento publicado eventualmente</p><small>${escapeHTML(r.assumptions)}</small>`;
      } catch (e) {
        el.textContent = (e as Error).message;
      }
    });
  }

  if (m.id === 'S11') {
    root.querySelector('#run-capacity-simulation')?.addEventListener('click', () => {
      const el = root.querySelector('#capacity-simulation-result')!;
      try {
        const val = (id: string) => Number((root.querySelector(id) as HTMLInputElement).value);
        const r = simulatePeakCapacity({
          incomingRpm: p.scenario.load,
          workers: val('#capacity-workers'),
          rpmPerWorker: val('#capacity-rpm'),
          queueLimit: val('#capacity-queue'),
          minutes: val('#capacity-duration'),
        });
        experiment = { kind: 'S11-peak-capacity', ...r };
        el.innerHTML = `<p><strong>Capacidad:</strong> ${r.processingRpm.toLocaleString('es')} req/min · <strong>Utilización:</strong> ${r.utilization} % · <strong>En cola:</strong> ${r.queued.toLocaleString('es')} · <strong>Descartadas:</strong> ${r.dropped.toLocaleString('es')}</p><p>${r.stable ? '✓ Capacidad suficiente según modelo' : '⚠ Saturación: evalúa backpressure o aumenta capacidad'}</p><small>${escapeHTML(r.assumptions)}</small>`;
      } catch (e) {
        el.textContent = (e as Error).message;
      }
    });
  }

  root.querySelector('#run-impact-simulation')?.addEventListener('click', () => {
    const idx = Number(
      (root.querySelector('input[name="suite-impact"]:checked') as HTMLInputElement | null)?.value ?? -1,
    );
    const el = root.querySelector('#impact-result')!;
    try {
      const x = simulateMissionImpact(m.id, seed, idx);
      draft.impactChoice = idx;
      save();
      el.innerHTML = `<p><b>${escapeHTML(x.control)}</b></p><p>${escapeHTML(x.metric)}: <strong>${x.baseline.toLocaleString('es')} → ${x.remaining.toLocaleString('es')} ${escapeHTML(x.unit)}</strong> (Δ ${x.delta.toLocaleString('es')})</p><p>${escapeHTML(x.tradeoff)}</p><small>${escapeHTML(x.assumptions)}. ${escapeHTML(x.disclaimer)}</small>`;
    } catch (e) {
      el.textContent = (e as Error).message;
    }
  });

  root.querySelector('#evaluate-devsecops')?.addEventListener('click', () => {
    const chosen = Array.from(root.querySelectorAll<HTMLInputElement>('[data-devsecops]:checked')).map(
      (x) => x.dataset.devsecops || '',
    );
    draft.devsecopsControls = chosen;
    save();
    const result = evaluateDevSecOps(m.id, chosen);
    const el = root.querySelector('#devsecops-report');
    if (el) {
      el.textContent = `${result.status} — ${result.reason} Prueba sugerida: ${result.verification}. Antipatrón: ${result.failureMode}. Evaluación educativa, no escaneo real.`;
    }
  });

  root.querySelector('#evaluate-threat')?.addEventListener('click', () => {
    draft.threatChoice = Number(
      (root.querySelector('input[name="suite-threat"]:checked') as HTMLInputElement | null)?.value ?? -1,
    );
    save();
    const result = evaluateThreat(m.id, seed, draft.threatChoice);
    const el = root.querySelector('#threat-report');
    if (el) el.textContent = `${result.status} — ${result.reason} Evidencia requerida: ${result.proof}.`;
  });

  const collect = (): void => {
    draft.threatChoice = Number(
      (root.querySelector('input[name="suite-threat"]:checked') as HTMLInputElement | null)?.value ?? -1,
    );
    draft.phase2Choice = Number(
      (root.querySelector('input[name="suite-phase2"]:checked') as HTMLInputElement | null)?.value ?? -1,
    );
    draft.devsecopsControls = Array.from(
      root.querySelectorAll<HTMLInputElement>('[data-devsecops]:checked'),
    ).map((x) => x.dataset.devsecops || '');
    draft.reviewChoice = Number(
      (root.querySelector('input[name="suite-review"]:checked') as HTMLInputElement | null)?.value ?? -1,
    );
    draft.impactChoice = Number(
      (root.querySelector('input[name="suite-impact"]:checked') as HTMLInputElement | null)?.value ?? -1,
    );
    draft.diagnosis = Number(
      (root.querySelector('input[name="suite-diagnosis"]:checked') as HTMLInputElement | null)?.value ??
        -1,
    );
    draft.incident = Number(
      (root.querySelector('input[name="suite-incident"]:checked') as HTMLInputElement | null)?.value ??
        -1,
    );
    draft.architecture = Array.from(
      root.querySelectorAll<HTMLInputElement>('[data-suite-arch]:checked'),
    ).map((x) => x.dataset.suiteArch || '');
    draft.relations = draft.relations.filter(
      ([a, b]) => draft.architecture.includes(a) && draft.architecture.includes(b),
    );
    draft.decision = (root.querySelector('#suite-adr') as HTMLTextAreaElement).value;
    draft.capacity = Number((root.querySelector('#suite-capacity') as HTMLInputElement).value);
    save();
    paintConsequences();
  };

  root.querySelector('#evaluate-phase2')?.addEventListener('click', () => {
    collect();
    const res = evaluatePhase2Evolution({
      missionId: m.id,
      seed,
      phase2Choice: draft.phase2Choice ?? -1,
      selectedComponents: draft.architecture,
      diagnosisChoice: draft.diagnosis,
      recklessDiagnosisIndex: p.recklessDiagnosisIndex,
    });
    const el = root.querySelector('#phase2-report');
    if (el) el.textContent = `${res.status} — ${res.feedback}`;
  });

  root.querySelector('#save-mentor-review')?.addEventListener('click', () => {
    const status_el = root.querySelector('#mentor-review-status');
    try {
      const candidate = mentorReviewSchema.parse(
        {
          reviewerName: (root.querySelector('#mentor-name') as HTMLInputElement).value.trim(),
          reviewerRole: (root.querySelector('#mentor-role') as HTMLInputElement).value.trim(),
          reviewedAt: new Date().toISOString(),
          verdict: (root.querySelector('#mentor-verdict') as HTMLSelectElement).value as MentorVerdict,
          criteriaComments: {
            adrQuality: (root.querySelector('#mentor-adr') as HTMLTextAreaElement).value.trim(),
            tradeOffRealism: (root.querySelector('#mentor-tradeoff') as HTMLTextAreaElement).value.trim(),
            failureModes: (root.querySelector('#mentor-failures') as HTMLTextAreaElement).value.trim(),
            verificationRigor: (root.querySelector('#mentor-verif') as HTMLTextAreaElement).value.trim(),
          },
          overallNotes: (root.querySelector('#mentor-notes') as HTMLTextAreaElement).value.trim(),
        },
        'mentorReview',
      );
      draft.mentorReview = candidate;
      save();
      paintMentorStatus();
    } catch (err) {
      if (status_el) status_el.textContent = `Revisión incompleta: ${(err as Error).message}`;
    }
  });

  (root.querySelector('#import-mentor-review') as HTMLInputElement | null)?.addEventListener(
    'change',
    async (ev) => {
      const file = (ev.target as HTMLInputElement).files?.[0];
      const status_el = root.querySelector('#mentor-review-status');
      if (!file) return;
      try {
        const parsed_review = parseExternalMentorReviewJson(await file.text());
        draft.mentorReview = parsed_review;
        const setVal = (sel: string, val: string): void => {
          const ctrl = root.querySelector(sel) as
            | HTMLInputElement
            | HTMLTextAreaElement
            | HTMLSelectElement
            | null;
          if (ctrl) ctrl.value = val;
        };
        setVal('#mentor-name', parsed_review.reviewerName);
        setVal('#mentor-role', parsed_review.reviewerRole);
        setVal('#mentor-verdict', parsed_review.verdict);
        setVal('#mentor-adr', parsed_review.criteriaComments.adrQuality);
        setVal('#mentor-tradeoff', parsed_review.criteriaComments.tradeOffRealism);
        setVal('#mentor-failures', parsed_review.criteriaComments.failureModes);
        setVal('#mentor-verif', parsed_review.criteriaComments.verificationRigor);
        setVal('#mentor-notes', parsed_review.overallNotes);
        save();
        paintMentorStatus();
      } catch (err) {
        if (status_el) status_el.textContent = `Error al importar dictamen: ${(err as Error).message}`;
      } finally {
        (ev.target as HTMLInputElement).value = '';
      }
    },
  );

  (root.querySelector('#suite-import-dossier') as HTMLInputElement | null)?.addEventListener(
    'change',
    async (ev) => {
      const file = (ev.target as HTMLInputElement).files?.[0];
      const fb = root.querySelector('#suite-feedback');
      if (!file) return;
      try {
        const imported = importSeniorDossierV2Json(await file.text());
        if (imported.dossier.mission.id !== m.id) {
          throw new Error(`El dossier pertenece a ${imported.dossier.mission.id}, no a ${m.id}`);
        }
        draft = { ...draft, ...imported.restoredDraftPatch };
        save();
        mountSeniorSuite(m, seed, onEvaluate);
        const refreshed_fb = root.querySelector('#suite-feedback');
        if (refreshed_fb) {
          const seed_note =
            imported.dossier.seed === seed
              ? `semilla ${seed}`
              : `importado desde semilla ${imported.dossier.seed} hacia semilla actual ${seed}`;
          refreshed_fb.textContent = `Dossier v2 importado correctamente (${seed_note}).`;
        }
      } catch (err) {
        if (fb) fb.textContent = `No se pudo importar Dossier v2: ${(err as Error).message}`;
      } finally {
        (ev.target as HTMLInputElement).value = '';
      }
    },
  );

  const drawGraph = (): void => {
    const el = root.querySelector('#suite-graph')!;
    el.innerHTML = draft.relations.length
      ? draft.relations
          .map(
            ([a, b], i) =>
              `<div class="suite-edge"><code>${escapeHTML(a)} → ${escapeHTML(b)}</code><button class="btn secondary small" type="button" data-suite-edge-remove="${i}" aria-label="Eliminar relación ${i + 1}">×</button></div>`,
          )
          .join('')
      : '<p class="muted">Sin conexiones. Elige dos componentes y crea una relación.</p>';
    el.querySelectorAll<HTMLButtonElement>('[data-suite-edge-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        draft.relations.splice(Number(btn.dataset.suiteEdgeRemove), 1);
        save();
        drawGraph();
      });
    });
    const checked = Array.from(
      root.querySelectorAll<HTMLInputElement>('[data-suite-arch]:checked'),
    ).map((x) => x.dataset.suiteArch || '');
    const svg_host = root.querySelector('#suite-graph-svg');
    if (svg_host) {
      svg_host.innerHTML = renderSeniorBuilderGraphSvgHtml(checked, draft.relations, p.required);
    }
    const feedback = root.querySelector('#suite-graph-feedback');
    if (feedback) feedback.textContent = validateSeniorGraph(checked, draft.relations, p.required).reason;
  };

  const switchSuiteSeed = (next_raw: unknown): void => {
    const target_seed = sanitizeSeniorSeed(next_raw, seed);
    if (seedOptions?.onSeedChange) {
      seedOptions.onSeedChange(target_seed);
      return;
    }
    mountSeniorSuite(m, target_seed, onEvaluate, seedOptions);
  };
  root.querySelector('#suite-apply-seed')?.addEventListener('click', () => {
    const val = (root.querySelector('#suite-seed-input') as HTMLInputElement | null)?.value;
    switchSuiteSeed(val);
  });
  root.querySelector('#suite-next-seed')?.addEventListener('click', () => {
    switchSuiteSeed(seed + 1);
  });
  root.querySelector('#suite-restore-saved-seed')?.addEventListener('click', () => {
    if (seedOptions?.savedSeed !== undefined) switchSuiteSeed(seedOptions.savedSeed);
  });

  root.querySelector('#suite-add-edge')?.addEventListener('click', () => {
    collect();
    const a = (root.querySelector('#suite-edge-from') as HTMLSelectElement).value;
    const b = (root.querySelector('#suite-edge-to') as HTMLSelectElement).value;
    const feedback = root.querySelector('#suite-graph-feedback')!;
    if (a === b || !draft.architecture.includes(a) || !draft.architecture.includes(b)) {
      feedback.textContent = 'Selecciona dos componentes distintos y marcados en el constructor.';
      return;
    }
    if (draft.relations.some(([x, y]) => x === a && y === b)) {
      feedback.textContent = 'Esa relación ya existe.';
      return;
    }
    if (draft.relations.length >= 12) {
      feedback.textContent = 'Límite de 12 relaciones para este ejercicio.';
      return;
    }
    draft.relations.push([a, b]);
    save();
    drawGraph();
  });

  root.querySelectorAll('[data-suite-arch]').forEach((el) => {
    el.addEventListener('change', () => {
      collect();
      drawGraph();
    });
  });
  drawGraph();
  paintConsequences();
  paintMentorStatus();

  root
    .querySelectorAll('input:not([type="file"]):not([id^="mentor-"]), #suite-adr')
    .forEach((el) => {
      el.addEventListener('change', collect);
    });
  root.querySelector('#suite-adr')?.addEventListener('input', collect);

  root.querySelector('#suite-evaluate')?.addEventListener('click', () => {
    collect();
    const r = evaluateSeniorSuite(m, seed, draft);
    const result = root.querySelector('#suite-report')!;
    onEvaluate?.(r, draft);
    const glyphFor = (st: string): string =>
      st === 'PASS' ? '✓' : st === 'FAIL' ? '○' : st === 'BLOCKED' ? '⊘' : '◇';
    result.innerHTML = `<div class="scorecard"><div class="score-big sr-score"><strong>${r.score}<small>/100</small></strong><span>Indicador preliminar; ${r.reviewedCriteria}/${r.totalCriteria} criterios mecánicos · huella fija <code>${escapeHTML(r.criteriaFingerprint)}</code></span></div>${r.canonicalGates.map((g) => `<p>${glyphFor(g.status)} <strong>${escapeHTML(g.label)}</strong> — <b>${g.status}</b><br/><small>${escapeHTML(g.detail)}</small></p>`).join('')}<p class="muted">${r.complete ? 'Los checks mecánicos pasan; la calidad del ADR permanece pendiente de revisión humana (REQUIRES_REVIEW, jamás aprobada por IA).' : 'Corrige los apartados FAIL / NOT_RUN / BLOCKED y vuelve a evaluar.'}</p></div>${renderSeniorAlternativesComparisonHtml({
      heading: `${m.id} · Diagnóstico (Seed ${seed})`,
      choices: p.diagnosisOptions,
      chosenIndex: draft.diagnosis,
      recommendedIndex: p.diagnosisCorrect,
      justification: `${m.decision} · Restricciones activas: ${p.scenario.traffic}, SLO ${p.scenario.availability}, equipo ${p.scenario.team}.`,
      antipatternWarning: p.playbook.failureMode,
    })}${renderSeniorReasonedSolutionGuideHtml({
      missionId: m.id,
      missionTitle: m.title,
      missionDecision: m.decision,
      seed,
      traffic: p.scenario.traffic,
      availability: p.scenario.availability,
      team: p.scenario.team,
      budget: p.scenario.budget,
      failure: p.scenario.failure,
      playbook: p.playbook,
      targetCapacityRpm: p.targetCapacity,
    })}`;
  });

  root.querySelector('#suite-export')?.addEventListener('click', () => {
    collect();
    const dossier_v2 = exportSeniorDossierV2(m, seed, draft, experiment);
    download(`${m.id}-evidencias-${seed}.json`, JSON.stringify(dossier_v2, null, 2));
  });

  root.querySelector('#suite-export-md')?.addEventListener('click', () => {
    collect();
    const text =
      seniorDossierMarkdown(m, seed, draft) +
      (experiment
        ? '\n## Experimento opcional\n```json\n' + JSON.stringify(experiment, null, 2) + '\n```\n'
        : '\n## Experimento opcional\nNOT_RUN\n');
    download(`${m.id}-dossier-${seed}.md`, text, 'text/markdown;charset=utf-8');
  });

  root.querySelector('#suite-print-pdf')?.addEventListener('click', () => {
    collect();
    save();
    if (typeof window.print === 'function') window.print();
  });

  let hint_idx = 0;
  root.querySelector('#suite-hint')?.addEventListener('click', () => {
    const target = root.querySelector('#suite-hint-text');
    const step = Math.min(hint_idx + 1, p.hints.length);
    if (target) target.textContent = `[${step}/${p.hints.length}] ${p.hints[step - 1]}`;
    hint_idx = step;
  });
}

/** Backup explicitly includes Senior Suite drafts, unlike local progress in older releases. */
export function exportSeniorSuiteDrafts(mission_ids: string[]): Record<string, SeniorDraft> {
  const out: Record<string, SeniorDraft> = {};
  const valid = new Set(mission_ids);
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) || '';
    const match = /^arqpixel-senior-suite-v2-(S\d{2})-(\d{1,7})$/.exec(key);
    if (!match || !valid.has(match[1]) || Number(match[2]) > 1000000) continue;
    try {
      const value = sanitizeSeniorDraft(JSON.parse(localStorage.getItem(key) || ''));
      if (value) out[`${match[1]}-${match[2]}`] = value;
    } catch {
      /* ignore */
    }
  }
  return out;
}

export function importSeniorSuiteDrafts(value: unknown, mission_ids: string[]): number {
  if (value === undefined) return 0;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw Error('Formato de talleres Senior inválido');
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > 1800) throw Error('Demasiados borradores Senior');
  const allowed = new Set(mission_ids);
  const imported: Array<[string, SeniorDraft]> = [];
  for (const [key, raw] of entries) {
    const match = /^(S\d{2})-(\d{1,7})$/.exec(key);
    if (!match || !allowed.has(match[1]) || Number(match[2]) > 1000000) {
      throw Error('Identificador de taller desconocido');
    }
    const clean = sanitizeSeniorDraft(raw);
    if (!clean) throw Error('Borrador Senior no válido');
    imported.push([`arqpixel-senior-suite-v2-${key}`, clean]);
  }
  for (const [key, d] of imported) localStorage.setItem(key, JSON.stringify(d));
  return imported.length;
}

/** Removes only ARQPIXEL Senior Suite keys; never touches other local data. */
export function clearSeniorSuiteDrafts(mission_ids: string[]): number {
  const valid = new Set(mission_ids);
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) || '';
    const match = /^arqpixel-senior-suite-v2-(S\d{2})-(\d{1,7})$/.exec(key);
    if (match && valid.has(match[1])) keys.push(key);
  }
  keys.forEach((key) => {
    localStorage.removeItem(key);
  });
  return keys.length;
}
