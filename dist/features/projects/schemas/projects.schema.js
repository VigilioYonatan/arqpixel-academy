import { isSafePlainObject, s } from '../../shared/schemas/schema-validator.js';
import { CAPSTONE_PROJECTS, MAX_PROJECT_SECTION_LENGTH, } from '../constants/projects.constants.js';
export const projectChecklistSchema = s.object({
    c4Included: s.boolean(),
    adrCompleted: s.boolean(),
    tradeOffsExplicit: s.boolean(),
    verificationDefined: s.boolean(),
    limitationsDeclared: s.boolean(),
}, { strict: true });
export const capstoneRubricScoresSchema = s.object({
    contextClarity: s.number({ int: true, min: 1, max: 4 }),
    boundaryIntegrity: s.number({ int: true, min: 1, max: 4 }),
    tradeoffHonesty: s.number({ int: true, min: 1, max: 4 }),
    verificationRigor: s.number({ int: true, min: 1, max: 4 }),
}, { strict: true });
export const capstoneRubricVerdictValues = [
    'APPROVED_WITH_EVIDENCE',
    'ITERATE_DESIGN',
    'REJECTED_UNSAFE',
];
export const capstoneRubricAuditEntrySchema = s.object({
    reviewerName: s.string({ trimMin: 2, max: 120 }),
    reviewerRole: s.string({ trimMin: 2, max: 120 }),
    reviewedAt: s.string({ min: 4, max: 60 }),
    draftFingerprint: s.string({ min: 8, max: 32 }),
    scores: capstoneRubricScoresSchema,
    verdict: s.enum(capstoneRubricVerdictValues),
    auditComment: s.string({ trimMin: 12, max: 1200 }),
}, { strict: true });
export const projectSubmissionSchema = s.object({
    architectureSummary: s.string({ max: MAX_PROJECT_SECTION_LENGTH }),
    alternativesAnalysis: s.string({ max: MAX_PROJECT_SECTION_LENGTH }),
    adrDecision: s.string({ max: MAX_PROJECT_SECTION_LENGTH }),
    risksAndMitigations: s.string({ max: MAX_PROJECT_SECTION_LENGTH }),
    verificationPlan: s.string({ max: MAX_PROJECT_SECTION_LENGTH }),
    checklist: projectChecklistSchema,
    updatedAt: s.string({ min: 4, max: 60 }),
    auditTrail: s.array(capstoneRubricAuditEntrySchema, { max: 20 }).optional(),
}, { strict: true });
const KNOWN_PROJECT_IDS = new Set(CAPSTONE_PROJECTS.map((p) => p.id));
export function emptyProjectSubmission() {
    return {
        architectureSummary: '',
        alternativesAnalysis: '',
        adrDecision: '',
        risksAndMitigations: '',
        verificationPlan: '',
        checklist: {
            c4Included: false,
            adrCompleted: false,
            tradeOffsExplicit: false,
            verificationDefined: false,
            limitationsDeclared: false,
        },
        updatedAt: new Date(0).toISOString(),
    };
}
export function sanitizeProjectsState(raw) {
    if (raw === undefined || raw === null)
        return {};
    if (!isSafePlainObject(raw))
        return null;
    const result = {};
    const entries = Object.entries(raw);
    if (entries.length > 40)
        return null;
    for (const [project_id, value] of entries) {
        if (!KNOWN_PROJECT_IDS.has(project_id))
            continue;
        const parsed = projectSubmissionSchema.safeParse(value, `projects.${project_id}`);
        if (!parsed.success)
            return null;
        result[project_id] = parsed.data;
    }
    return result;
}
