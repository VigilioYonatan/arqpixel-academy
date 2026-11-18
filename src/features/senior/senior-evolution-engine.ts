import {
  BUDGET_CEILINGS_USD,
  COMPONENT_OPERATIONAL_PROFILES,
  SENIOR_DOSSIER_FORMAT,
  SENIOR_DOSSIER_SCHEMA_VERSION,
  SENIOR_PHASE2_EVOLUTIONS,
} from './constants/senior-evolution.constants.js';
import {
  type MentorReviewSchema,
  mentorReviewSchema,
  type SeniorDossierV2Schema,
  seniorDossierV2Schema,
} from './schemas/senior-dossier.schema.js';

export type CrossDecisionInput = {
  readonly missionId: string;
  readonly seed: number;
  readonly loadRpm: number;
  readonly budgetTier: string;
  readonly diagnosisChoice: number;
  readonly diagnosisCorrect: number;
  readonly recklessDiagnosisIndex: number;
  readonly selectedComponents: readonly string[];
  readonly declaredCapacityRpm: number;
  readonly targetCapacityRpm: number;
};

export type CrossDecisionConsequences = {
  readonly effectiveCapacityRpm: number;
  readonly uncertaintyPercent: number;
  readonly uncertaintyBandRpm: readonly [number, number];
  readonly estimatedMonthlyUsd: number;
  readonly budgetCeilingUsd: number;
  readonly finopsStatus: 'WITHIN_ESTIMATE' | 'OVER_BUDGET_DRIFT';
  readonly availableSignals: readonly string[];
  readonly blindSpots: readonly string[];
  readonly incidentReadiness: 'HIGH_VISIBILITY' | 'PARTIAL_VISIBILITY' | 'BLIND_RESPONSE';
  readonly costDisclaimer: string;
};

/**
 * Deterministically links Phase 1 decisions (Diagnosis + Architecture Builder + Capacity)
 * to effective capacity, uncertainty band, FinOps estimate, and Incident Response telemetry.
 */
export function computeCrossDecisionConsequences(
  input: CrossDecisionInput,
): CrossDecisionConsequences {
  const base_infra_usd = Math.round(90 + input.loadRpm * 0.0045);
  let components_usd = 0;
  let composite_multiplier = 1.0;
  let uncertainty_pct = 32;
  const signals: string[] = [];
  const blind_spots: string[] = [];

  for (const comp of input.selectedComponents) {
    const profile = COMPONENT_OPERATIONAL_PROFILES[comp];
    if (!profile) continue;
    components_usd += profile.monthlyCostUsd;
    composite_multiplier *= profile.capacityMultiplier;
    uncertainty_pct -= profile.uncertaintyReductionPct;
    signals.push(`${comp}: ${profile.signalUnlocked}`);
  }

  // Over-selecting > 4 components penalizes operational coordination & FinOps
  if (input.selectedComponents.length > 4) {
    components_usd += (input.selectedComponents.length - 4) * 140;
    composite_multiplier *= 0.9;
  }

  // Reckless diagnosis ("Eliminar pruebas y controles...") triggers hidden remediation tax & wider uncertainty
  if (input.diagnosisChoice === input.recklessDiagnosisIndex) {
    components_usd += 220;
    composite_multiplier *= 0.82;
    uncertainty_pct += 12;
    blind_spots.push(
      'Diagnóstico temerario: omitir pruebas y controles eleva la tasa de fallos en cambio (CFR) y oculta regresiones.',
    );
  } else if (input.diagnosisChoice === input.diagnosisCorrect) {
    composite_multiplier *= 1.05;
    uncertainty_pct -= 3;
  }

  if (!input.selectedComponents.includes('Observabilidad')) {
    blind_spots.push(
      'Sin Observabilidad: respuesta a incidentes a ciegas (solo liveness de proceso; sin trazas p95 ni burn rate).',
    );
  }
  if (!input.selectedComponents.includes('Plan de rollback')) {
    blind_spots.push(
      'Sin Plan de rollback: ante regresión en producción el MTTR se dispara por depender de hotfix manual.',
    );
  }
  if (!input.selectedComponents.includes('Idempotencia') && input.loadRpm >= 8_000) {
    blind_spots.push(
      'Alta carga sin Idempotencia explícita: los reintentos de red amplifican efectos duplicados.',
    );
  }

  const clamped_uncertainty = Math.max(8, Math.min(48, Math.round(uncertainty_pct)));
  const raw_effective =
    input.declaredCapacityRpm > 0
      ? Math.round(input.declaredCapacityRpm * Math.min(1.45, composite_multiplier))
      : 0;
  const min_rpm = Math.max(0, Math.round(raw_effective * (1 - clamped_uncertainty / 100)));
  const max_rpm = Math.round(raw_effective * (1 + clamped_uncertainty / 100));

  const ceiling_usd = BUDGET_CEILINGS_USD[input.budgetTier] ?? 780;
  const total_usd = Math.round(base_infra_usd + components_usd);
  const finops_status =
    total_usd <= ceiling_usd && input.selectedComponents.length <= 4
      ? 'WITHIN_ESTIMATE'
      : 'OVER_BUDGET_DRIFT';

  const readiness: CrossDecisionConsequences['incidentReadiness'] =
    input.selectedComponents.includes('Observabilidad') &&
    (input.selectedComponents.includes('Plan de rollback') ||
      input.selectedComponents.includes('API Gateway') ||
      input.selectedComponents.includes('Cola de eventos'))
      ? 'HIGH_VISIBILITY'
      : input.selectedComponents.includes('Observabilidad')
        ? 'PARTIAL_VISIBILITY'
        : 'BLIND_RESPONSE';

  return {
    effectiveCapacityRpm: raw_effective,
    uncertaintyPercent: clamped_uncertainty,
    uncertaintyBandRpm: [min_rpm, max_rpm],
    estimatedMonthlyUsd: total_usd,
    budgetCeilingUsd: ceiling_usd,
    finopsStatus: finops_status,
    availableSignals: signals,
    blindSpots: blind_spots,
    incidentReadiness: readiness,
    costDisclaimer:
      'Estimación FinOps sintética local para aprendizaje de trade-offs; no equivale a factura cloud reconciliada.',
  };
}

export type Phase2MissionPolicy = {
  readonly missionId: string;
  readonly crisisTitle: string;
  readonly triggerEvent: string;
  readonly options: readonly string[];
  readonly correctIndex: number;
  readonly requiredPhase1Support: string;
  readonly reviewerQuestions: readonly string[];
};

export function buildPhase2MissionPolicy(mission_id: string, seed: number): Phase2MissionPolicy {
  const def = SENIOR_PHASE2_EVOLUTIONS[mission_id];
  if (!def) {
    throw new Error(`Misión Senior sin evolución Fase 2: ${mission_id}`);
  }
  const numeric_id = Number(mission_id.replace(/\D/g, '')) || 1;
  const shift = (seed * 5 + numeric_id * 2) % 3;
  const rotated = [...def.canonicalOptions.slice(shift), ...def.canonicalOptions.slice(0, shift)];

  return {
    missionId: mission_id,
    crisisTitle: def.crisisTitle,
    triggerEvent: def.triggerEvent,
    options: rotated,
    correctIndex: rotated.indexOf(def.canonicalOptions[0]),
    requiredPhase1Support: def.requiredPhase1Support,
    reviewerQuestions: def.reviewerQuestions,
  };
}

export type Phase2EvaluationResult = {
  readonly status: 'NOT_RUN' | 'PASS' | 'FAIL';
  readonly chainCoherentWithPhase1: boolean;
  readonly feedback: string;
};

export function evaluatePhase2Evolution(params: {
  readonly missionId: string;
  readonly seed: number;
  readonly phase2Choice: number;
  readonly selectedComponents: readonly string[];
  readonly diagnosisChoice: number;
  readonly recklessDiagnosisIndex: number;
}): Phase2EvaluationResult {
  const policy = buildPhase2MissionPolicy(params.missionId, params.seed);
  if (params.phase2Choice < 0 || params.phase2Choice > 2) {
    return {
      status: 'NOT_RUN',
      chainCoherentWithPhase1: false,
      feedback: 'Selecciona una respuesta ante el evento de evolución en Fase 2.',
    };
  }

  const picked_defensible = params.phase2Choice === policy.correctIndex;
  const has_support = params.selectedComponents.includes(policy.requiredPhase1Support);
  const reckless_dx = params.diagnosisChoice === params.recklessDiagnosisIndex;

  if (!picked_defensible) {
    return {
      status: 'FAIL',
      chainCoherentWithPhase1: false,
      feedback: `Contraejemplo fallido: la opción elegida agrava la crisis de Fase 2. Revisa límites transaccionales, compatibilidad hacia atrás y control de fallos.`,
    };
  }

  if (!has_support || reckless_dx) {
    return {
      status: 'FAIL',
      chainCoherentWithPhase1: false,
      feedback: `Incoherencia encadenada Fase 1 → Fase 2: elegiste la táctica correcta en Fase 2, pero tu arquitectura de Fase 1 omitió «${policy.requiredPhase1Support}» o adoptó un diagnóstico sin controles.`,
    };
  }

  return {
    status: 'PASS',
    chainCoherentWithPhase1: true,
    feedback: `✓ Evolución encadenada coherente: tu base de Fase 1 («${policy.requiredPhase1Support}») sostiene la respuesta ante la crisis de Fase 2.`,
  };
}

export function deriveSeniorSuiteProgressiveHints(params: {
  readonly missionId: string;
  readonly focus: string;
  readonly investigation: string;
  readonly verification: string;
  readonly requiredComponents: readonly [string, string];
}): readonly [string, string, string] {
  const phase2 = SENIOR_PHASE2_EVOLUTIONS[params.missionId];
  return [
    `Pista 1 (Foco de negocio y diagnóstico): ${params.focus}. Antes de añadir piezas, ${params.investigation.toLowerCase()}.`,
    `Pista 2 (Fronteras y efectos cruzados): En Architecture Builder prioriza solo de 2 a 4 nodos conectados sin ciclos (considera cómo «${params.requiredComponents[0]}» y «${params.requiredComponents[1]}» habilitan señales de incidente y capacidad).`,
    `Pista 3 (Evidencia ADR y Fase 2): Documenta dos restricciones cuantitativas del enunciado, valida mediante «${params.verification.toLowerCase()}» y anticipa la evolución «${phase2?.crisisTitle ?? 'Fase 2'}».`,
  ];
}

export function sanitizeMentorReview(raw: unknown): MentorReviewSchema | null {
  if (raw === null || raw === undefined) return null;
  const parsed = mentorReviewSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function parseExternalMentorReviewJson(raw_json: string): MentorReviewSchema {
  const decoded: unknown = JSON.parse(raw_json);
  return mentorReviewSchema.parse(decoded, 'mentor-review.json');
}

export function formatMentorReviewMarkdown(review: MentorReviewSchema | null): string {
  if (!review) {
    return [
      '## Revisión Humana / Comité de Arquitectura (`REQUIRES_REVIEW`)',
      '- **Estado:** Pendiente de revisión por mentor o comité humano.',
      '- **Garantía:** El puntaje mecánico jamás sustituye ni auto-aprueba este dictamen.',
    ].join('\n');
  }

  return [
    '## Revisión Humana / Comité de Arquitectura (Adjunta · Independiente del Score Mecánico)',
    `- **Revisor:** ${review.reviewerName} (${review.reviewerRole})`,
    `- **Fecha:** ${review.reviewedAt}`,
    `- **Dictamen Experto:** \`${review.verdict}\``,
    `- **Calidad del ADR:** ${review.criteriaComments.adrQuality}`,
    `- **Realismo de Trade-offs:** ${review.criteriaComments.tradeOffRealism}`,
    `- **Modos de Fallo y Resiliencia:** ${review.criteriaComments.failureModes}`,
    `- **Rigor de Verificación:** ${review.criteriaComments.verificationRigor}`,
    `- **Notas Globales:** ${review.overallNotes}`,
  ].join('\n');
}

export function buildValidatedSeniorDossierV2(input: {
  readonly mission: {
    readonly id: string;
    readonly title: string;
    readonly brief: string;
    readonly decision: string;
    readonly evidence: string;
  };
  readonly seed: number;
  readonly scenario: {
    readonly traffic: string;
    readonly availability: string;
    readonly team: string;
    readonly budget: string;
    readonly failure: string;
    readonly load: number;
    readonly uptimeTarget: number;
  };
  readonly selectedComponents: readonly string[];
  readonly directedEdges: ReadonlyArray<readonly [string, string]>;
  readonly graphValid: boolean;
  readonly graphReason: string;
  readonly adrText: string;
  readonly adrStatus: 'NOT_RUN' | 'FAIL' | 'REQUIRES_REVIEW';
  readonly declaredCapacityRpm: number;
  readonly targetCapacityRpm: number;
  readonly consequences: CrossDecisionConsequences;
  readonly phase2Policy: Phase2MissionPolicy;
  readonly phase2Choice: number;
  readonly phase2Evaluation: Phase2EvaluationResult;
  readonly devsecops: Record<string, unknown>;
  readonly threatModel: Record<string, unknown>;
  readonly experimentResult: Record<string, unknown>;
  readonly checks: ReadonlyArray<{
    readonly name: string;
    readonly status: 'PASS' | 'FAIL' | 'NOT_RUN' | 'BLOCKED' | 'REQUIRES_REVIEW';
    readonly points: number;
    readonly detail: string;
  }>;
  readonly mechanicalScorePercent: number;
  readonly mechanicalPassed: boolean;
  readonly verificationPlan: string;
  readonly humanReview: MentorReviewSchema | null;
  readonly exportedAt?: string;
}): SeniorDossierV2Schema {
  const payload = {
    schemaVersion: SENIOR_DOSSIER_SCHEMA_VERSION as 2,
    format: SENIOR_DOSSIER_FORMAT as 'ARQPIXEL-SENIOR-DOSSIER-V2',
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    mission: {
      id: input.mission.id,
      title: input.mission.title,
      brief: input.mission.brief,
      decision: input.mission.decision,
      evidence: input.mission.evidence,
    },
    seed: input.seed,
    constraints: {
      traffic: input.scenario.traffic,
      availability: input.scenario.availability,
      team: input.scenario.team,
      budget: input.scenario.budget,
      failure: input.scenario.failure,
      loadRpm: input.scenario.load,
      uptimeTargetPercent: input.scenario.uptimeTarget,
    },
    architectureGraph: {
      selectedComponents: [...input.selectedComponents],
      directedEdges: input.directedEdges.map(([a, b]) => [a, b]),
      structuralValid: input.graphValid,
      structuralReason: input.graphReason,
    },
    adr: {
      text: input.adrText,
      charLength: input.adrText.trim().length,
      status: input.adrStatus,
    },
    capacityAndFinops: {
      declaredRpm: input.declaredCapacityRpm,
      demandRpm: input.scenario.load,
      targetWithHeadroomRpm: input.targetCapacityRpm,
      effectiveCapacityRpm: input.consequences.effectiveCapacityRpm,
      unit: 'req/min' as const,
      uncertaintyPercent: input.consequences.uncertaintyPercent,
      uncertaintyBandRpm: [...input.consequences.uncertaintyBandRpm],
      estimatedMonthlyUsd: input.consequences.estimatedMonthlyUsd,
      budgetCeilingUsd: input.consequences.budgetCeilingUsd,
      finopsStatus: input.consequences.finopsStatus,
      costDisclaimer: input.consequences.costDisclaimer,
    },
    chainedPhase2: {
      crisisTitle: input.phase2Policy.crisisTitle,
      triggerEvent: input.phase2Policy.triggerEvent,
      selectedOptionIndex: input.phase2Choice,
      status: input.phase2Evaluation.status,
      chainCoherentWithPhase1: input.phase2Evaluation.chainCoherentWithPhase1,
      feedback: input.phase2Evaluation.feedback,
    },
    devsecops: input.devsecops,
    threatModel: input.threatModel,
    experiment: input.experimentResult,
    checks: input.checks.map((chk) => ({
      name: chk.name,
      status: chk.status,
      points: chk.points,
      maxPoints: 20,
      detail: chk.detail,
    })),
    mechanicalSummary: {
      scorePercent: input.mechanicalScorePercent,
      mechanicalPassed: input.mechanicalPassed,
      openReasoningStatus:
        input.adrStatus === 'REQUIRES_REVIEW'
          ? ('REQUIRES_REVIEW' as const)
          : ('INCOMPLETE_ADR' as const),
      separationGuarantee:
        'El puntaje mecánico evalúa únicamente invariantes estructurales; la revisión humana permanece auditada por separado y no altera el XP.',
    },
    reviewerGuideQuestions: [...input.phase2Policy.reviewerQuestions],
    humanReview: input.humanReview,
    limits: [
      'Evaluador educativo local determinista',
      'ADR y criterios abiertos requieren revisión humana (ADR-0003)',
      'Modelo de capacidad e incertidumbre idealizado con fines didácticos',
      `Plan de validación esperado: ${input.verificationPlan}`,
    ],
  };

  return seniorDossierV2Schema.parse(payload, 'senior-dossier-v2');
}

export type DynamicTradeoffStanceId =
  | 'prioritize_consistency'
  | 'prioritize_availability'
  | 'prioritize_cost_control';

export type DynamicTradeoffStanceMeta = {
  readonly id: DynamicTradeoffStanceId;
  readonly label: string;
  readonly benefit: string;
  readonly acceptedCost: string;
};

export const SENIOR_TRADEOFF_STANCES: readonly DynamicTradeoffStanceMeta[] = Object.freeze([
  {
    id: 'prioritize_consistency',
    label: 'Priorizar Integridad e Invariantes (Cero corrupción / doble cobro)',
    benefit: 'Protege saldos, stock y órdenes críticas mediante idempotencia y rechazo seguro.',
    acceptedCost: 'Puede degradar temporalmente escrituras no críticas cuando cae una dependencia.',
  },
  {
    id: 'prioritize_availability',
    label: 'Priorizar Disponibilidad con Degradación Elegante (Cola / Caché)',
    benefit: 'Absorbe picos y sostiene lecturas/recepción asíncrona protegiendo el SLO percibido.',
    acceptedCost: 'Exige gestionar consistencia eventual, reconciliación y sobrecoste de buffer.',
  },
  {
    id: 'prioritize_cost_control',
    label: 'Priorizar Techo FinOps Estricto (Rate-Limit / Shedding temprano)',
    benefit: 'Impide desviaciones presupuestarias durante tormentas de tráfico o reintentos.',
    acceptedCost: 'Rechaza tráfico excedente antes (HTTP 429) y consume más presupuesto de error.',
  },
]);

export type ChainedIncidentStageState = {
  readonly stageId: 'T0_DETECCION' | 'T1_CONTENCION' | 'T2_EVOLUCION';
  readonly title: string;
  readonly status: 'STABLE' | 'DEGRADED' | 'CRITICAL_BURN';
  readonly remainingErrorBudgetPct: number;
  readonly cumulativeMttrMinutes: number;
  readonly narrative: string;
};

export type ChainedIncidentProgression = {
  readonly missionId: string;
  readonly seed: number;
  readonly stance: DynamicTradeoffStanceMeta;
  readonly stanceFitForMission: 'OPTIMAL_FIT' | 'ACCEPTABLE_WITH_RISK' | 'MISALIGNED';
  readonly stages: readonly [
    ChainedIncidentStageState,
    ChainedIncidentStageState,
    ChainedIncidentStageState,
  ];
  readonly finalErrorBudgetPct: number;
  readonly totalMttrMinutes: number;
  readonly cumulativeVerdict: 'CONTAINED' | 'PARTIALLY_CONTAINED' | 'BUDGET_EXHAUSTED';
  readonly tradeoffSummary: string;
};

export function evaluateChainedIncidentProgression(params: {
  readonly missionId: string;
  readonly seed: number;
  readonly selectedStance: DynamicTradeoffStanceId;
  readonly selectedComponents: readonly string[];
  readonly incidentChoiceCorrect: boolean;
  readonly phase2Status: 'NOT_RUN' | 'PASS' | 'FAIL';
}): ChainedIncidentProgression {
  const stance =
    SENIOR_TRADEOFF_STANCES.find((s) => s.id === params.selectedStance) ??
    SENIOR_TRADEOFF_STANCES[0];

  const consistency_missions = new Set(['S04', 'S06', 'S09', 'S12', 'S15', 'S16']);
  const cost_missions = new Set(['S01', 'S02', 'S17']);
  const recommended_stance: DynamicTradeoffStanceId = consistency_missions.has(params.missionId)
    ? 'prioritize_consistency'
    : cost_missions.has(params.missionId)
      ? 'prioritize_cost_control'
      : 'prioritize_availability';

  const stance_fit: ChainedIncidentProgression['stanceFitForMission'] =
    stance.id === recommended_stance
      ? 'OPTIMAL_FIT'
      : consistency_missions.has(params.missionId) && stance.id === 'prioritize_cost_control'
        ? 'MISALIGNED'
        : 'ACCEPTABLE_WITH_RISK';

  // Stage T0: Detection depends on Observability
  const has_obs = params.selectedComponents.includes('Observabilidad');
  const t0_mttr = has_obs ? 4 : 19 + (params.seed % 5);
  const t0_budget = has_obs ? 92 : 68;
  const stage_t0: ChainedIncidentStageState = {
    stageId: 'T0_DETECCION',
    title: 'T0 · Detección de Anomalía',
    status: has_obs ? 'STABLE' : 'DEGRADED',
    remainingErrorBudgetPct: t0_budget,
    cumulativeMttrMinutes: t0_mttr,
    narrative: has_obs
      ? 'Alertas SLI/SLO correlacionan el cambio en 4 min.'
      : 'Sin Observabilidad: detección tardía por quejas externas (+19 min).',
  };

  // Stage T1: Containment accumulates on T0 + Phase 1 Incident Response + Rollback/Idempotency
  const has_rollback = params.selectedComponents.includes('Plan de rollback');
  const t1_delta_mttr = params.incidentChoiceCorrect ? (has_rollback ? 8 : 16) : 34;
  const t1_delta_burn =
    (params.incidentChoiceCorrect ? 10 : 38) + (stance_fit === 'MISALIGNED' ? 14 : 0);
  const t1_budget = Math.max(0, t0_budget - t1_delta_burn);
  const t1_mttr = t0_mttr + t1_delta_mttr;
  const stage_t1: ChainedIncidentStageState = {
    stageId: 'T1_CONTENCION',
    title: 'T1 · Contención Operativa',
    status: t1_budget >= 65 ? 'STABLE' : t1_budget >= 30 ? 'DEGRADED' : 'CRITICAL_BURN',
    remainingErrorBudgetPct: t1_budget,
    cumulativeMttrMinutes: t1_mttr,
    narrative: params.incidentChoiceCorrect
      ? `Mitigación primaria aplicada (${stance.label.split('(')[0].trim()}).`
      : 'Respuesta primaria errónea: reintentos o cambios a ciegas amplifican el radio de fallo.',
  };

  // Stage T2: Cumulative evolution into Phase 2 crisis
  const t2_delta_mttr =
    params.phase2Status === 'PASS' ? 9 : params.phase2Status === 'NOT_RUN' ? 22 : 41;
  const t2_delta_burn =
    params.phase2Status === 'PASS'
      ? stance_fit === 'OPTIMAL_FIT'
        ? 6
        : 14
      : params.phase2Status === 'NOT_RUN'
        ? 20
        : 42;
  const t2_budget = Math.max(0, t1_budget - t2_delta_burn);
  const t2_mttr = t1_mttr + t2_delta_mttr;
  const stage_t2: ChainedIncidentStageState = {
    stageId: 'T2_EVOLUCION',
    title: 'T2 · Crisis Encadenada Fase 2',
    status: t2_budget >= 55 ? 'STABLE' : t2_budget >= 20 ? 'DEGRADED' : 'CRITICAL_BURN',
    remainingErrorBudgetPct: t2_budget,
    cumulativeMttrMinutes: t2_mttr,
    narrative:
      params.phase2Status === 'PASS'
        ? 'Transición Fase 1 → Fase 2 absorbida sin agotar el Error Budget.'
        : params.phase2Status === 'NOT_RUN'
          ? 'Pendiente elegir táctica de Fase 2; el deterioro sigue acumulándose.'
          : 'Colapso acumulativo en Fase 2: presupuesto de error agotado o invariante rota.',
  };

  const verdict: ChainedIncidentProgression['cumulativeVerdict'] =
    t2_budget >= 55 && params.incidentChoiceCorrect && params.phase2Status === 'PASS'
      ? 'CONTAINED'
      : t2_budget > 0
        ? 'PARTIALLY_CONTAINED'
        : 'BUDGET_EXHAUSTED';

  return {
    missionId: params.missionId,
    seed: params.seed,
    stance,
    stanceFitForMission: stance_fit,
    stages: [stage_t0, stage_t1, stage_t2],
    finalErrorBudgetPct: t2_budget,
    totalMttrMinutes: t2_mttr,
    cumulativeVerdict: verdict,
    tradeoffSummary:
      stance_fit === 'OPTIMAL_FIT'
        ? `Postura alineada con ${params.missionId}: ${stance.benefit} Coste asumido: ${stance.acceptedCost}`
        : stance_fit === 'MISALIGNED'
          ? `Riesgo de postura en ${params.missionId}: recortar recursos agresivamente compromete invariantes críticas de dominio.`
          : `Postura viable con cautela: ${stance.benefit} Vigila el coste aceptado (${stance.acceptedCost})`,
  };
}

const escXml = (v: unknown): string =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch),
  );

export function renderChainedIncidentTimelineSvgHtml(prog: ChainedIncidentProgression): string {
  return `<div class="map-svg-wrap mt-12" tabindex="0" role="region" aria-label=" Cadena acumulativa de incidente T0 a T2">
    <svg class="senior-pipeline-svg" viewBox="0 0 740 112" role="img" aria-label="Estados encadenados de incidente: Presupuesto final ${prog.finalErrorBudgetPct}%, MTTR acumulado ${prog.totalMttrMinutes} min">
      ${prog.stages
        .map((st, idx) => {
          const x = 14 + idx * 244;
          const stroke =
            st.status === 'STABLE'
              ? '#53e2ba'
              : st.status === 'DEGRADED'
                ? '#ffd77c'
                : '#ff7890';
          return `<g>
            <rect x="${x}" y="12" width="224" height="88" rx="12" fill="#091d31" stroke="${stroke}" stroke-width="2"/>
            <text x="${x + 14}" y="34" fill="${stroke}" font-size="11" font-weight="bold" font-family="sans-serif">${escXml(st.title)}</text>
            <text x="${x + 14}" y="56" fill="#eef9ff" font-size="12" font-weight="bold" font-family="sans-serif">Error Budget: ${st.remainingErrorBudgetPct}% · MTTR: ${st.cumulativeMttrMinutes}m</text>
            <text x="${x + 14}" y="78" fill="#9fc0d6" font-size="9.5" font-family="sans-serif">${escXml(st.narrative.slice(0, 42))}${st.narrative.length > 42 ? '…' : ''}</text>
          </g>`;
        })
        .join('')}
    </svg>
  </div>`;
}
