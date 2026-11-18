import { s } from '../../shared/schemas/schema-validator.js';
import { SENIOR_DOSSIER_FORMAT, SENIOR_DOSSIER_SCHEMA_VERSION, } from '../constants/senior-evolution.constants.js';
import { missionIdSchema } from './senior.schema.js';
export const MENTOR_VERDICTS = [
    'APPROVED_WITH_EVIDENCE',
    'ITERATE_DESIGN',
    'REJECTED_UNSAFE',
];
export const mentorCriteriaCommentsSchema = s.object({
    adrQuality: s.string({ trimMin: 12, max: 2_000 }),
    tradeOffRealism: s.string({ trimMin: 12, max: 2_000 }),
    failureModes: s.string({ trimMin: 12, max: 2_000 }),
    verificationRigor: s.string({ trimMin: 12, max: 2_000 }),
}, { strict: true });
export const mentorReviewSchema = s.object({
    reviewerName: s.string({ trimMin: 3, max: 120 }),
    reviewerRole: s.string({ trimMin: 3, max: 120 }),
    reviewedAt: s
        .string({ trimMin: 10, max: 64 })
        .refine((val) => Number.isFinite(Date.parse(val)), 'Fecha ISO inválida en revisión experta'),
    verdict: s.enum(MENTOR_VERDICTS),
    criteriaComments: mentorCriteriaCommentsSchema,
    overallNotes: s.string({ trimMin: 15, max: 4_000 }),
}, { strict: true });
export const dossierCheckStatusSchema = s.enum([
    'PASS',
    'FAIL',
    'NOT_RUN',
    'BLOCKED',
    'REQUIRES_REVIEW',
]);
export const dossierCheckItemSchema = s.object({
    name: s.string({ trimMin: 2, max: 120 }),
    status: dossierCheckStatusSchema,
    points: s.number({ int: true, min: 0, max: 100 }),
    maxPoints: s.number({ int: true, min: 0, max: 100 }),
    detail: s.string({ trimMin: 2, max: 800 }),
}, { strict: true });
export const seniorDossierV2Schema = s.object({
    schemaVersion: s.literal(SENIOR_DOSSIER_SCHEMA_VERSION),
    format: s.literal(SENIOR_DOSSIER_FORMAT),
    exportedAt: s
        .string({ trimMin: 10, max: 64 })
        .refine((val) => Number.isFinite(Date.parse(val)), 'exportedAt ISO inválido'),
    mission: s.object({
        id: missionIdSchema,
        title: s.string({ trimMin: 4, max: 180 }),
        brief: s.string({ trimMin: 6, max: 1_200 }),
        decision: s.string({ trimMin: 4, max: 800 }),
        evidence: s.string({ trimMin: 4, max: 800 }),
    }, { strict: true }),
    seed: s.number({ int: true, min: 0, max: 1_000_000 }),
    constraints: s.object({
        traffic: s.string({ trimMin: 3, max: 80 }),
        availability: s.string({ trimMin: 3, max: 40 }),
        team: s.string({ trimMin: 3, max: 80 }),
        budget: s.string({ trimMin: 3, max: 40 }),
        failure: s.string({ trimMin: 5, max: 240 }),
        loadRpm: s.number({ int: true, min: 1, max: 10_000_000 }),
        uptimeTargetPercent: s.number({ min: 90, max: 100 }),
    }, { strict: true }),
    architectureGraph: s.object({
        selectedComponents: s.array(s.string({ trimMin: 2, max: 60 }), { min: 0, max: 8 }),
        directedEdges: s.array(s.array(s.string({ trimMin: 2, max: 60 }), { min: 2, max: 2 }), {
            min: 0,
            max: 12,
        }),
        structuralValid: s.boolean(),
        structuralReason: s.string({ trimMin: 4, max: 400 }),
    }, { strict: true }),
    adr: s.object({
        text: s.string({ min: 0, max: 18_000 }),
        charLength: s.number({ int: true, min: 0, max: 18_000 }),
        status: s.enum(['NOT_RUN', 'FAIL', 'REQUIRES_REVIEW']),
    }, { strict: true }),
    capacityAndFinops: s.object({
        declaredRpm: s.number({ min: 0, max: 10_000_000 }),
        demandRpm: s.number({ int: true, min: 1, max: 10_000_000 }),
        targetWithHeadroomRpm: s.number({ int: true, min: 1, max: 40_000_000 }),
        effectiveCapacityRpm: s.number({ int: true, min: 0, max: 50_000_000 }),
        unit: s.literal('req/min'),
        uncertaintyPercent: s.number({ min: 5, max: 60 }),
        uncertaintyBandRpm: s.array(s.number({ min: 0, max: 60_000_000 }), { min: 2, max: 2 }),
        estimatedMonthlyUsd: s.number({ min: 0, max: 1_000_000 }),
        budgetCeilingUsd: s.number({ min: 1, max: 1_000_000 }),
        finopsStatus: s.enum(['WITHIN_ESTIMATE', 'OVER_BUDGET_DRIFT']),
        costDisclaimer: s.string({ trimMin: 10, max: 300 }),
    }, { strict: true }),
    chainedPhase2: s.object({
        crisisTitle: s.string({ trimMin: 8, max: 240 }),
        triggerEvent: s.string({ trimMin: 10, max: 600 }),
        selectedOptionIndex: s.number({ int: true, min: -1, max: 2 }),
        status: s.enum(['NOT_RUN', 'PASS', 'FAIL']),
        chainCoherentWithPhase1: s.boolean(),
        feedback: s.string({ trimMin: 5, max: 500 }),
    }, { strict: true }),
    devsecops: s.plainObject(),
    threatModel: s.plainObject(),
    experiment: s.plainObject(),
    checks: s.array(dossierCheckItemSchema, { min: 6, max: 10 }),
    mechanicalSummary: s.object({
        scorePercent: s.number({ int: true, min: 0, max: 100 }),
        mechanicalPassed: s.boolean(),
        openReasoningStatus: s.enum(['REQUIRES_REVIEW', 'INCOMPLETE_ADR']),
        separationGuarantee: s.string({ trimMin: 15, max: 300 }),
    }, { strict: true }),
    reviewerGuideQuestions: s.array(s.string({ trimMin: 10, max: 320 }), { min: 4, max: 6 }),
    humanReview: mentorReviewSchema.nullable(),
    limits: s.array(s.string({ trimMin: 5, max: 260 }), { min: 3, max: 10 }),
}, { strict: true });
