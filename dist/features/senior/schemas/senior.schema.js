import { ALL_C4_ELEMENT_TYPES, C4_LEVELS, validateC4 } from '../../../c4-studio.js';
import { BACKUP_APP_ID, BACKUP_SCHEMA_VERSION, EXPECTED_SENIOR_MISSIONS_COUNT, } from '../../shared/constants/app.constants.js';
import { s } from '../../shared/schemas/schema-validator.js';
export const missionIdSchema = s.string({ pattern: /^S(?:0[1-9]|1[0-8])$/ });
export const missionSchema = s.object({
    id: missionIdSchema,
    title: s.string({ trimMin: 8, max: 140 }),
    brief: s.string({ trimMin: 12, max: 1_000 }),
    decision: s.string({ trimMin: 8, max: 600 }),
    evidence: s.string({ trimMin: 8, max: 600 }),
});
export const missionsCatalogSchema = s
    .array(missionSchema, {
    min: EXPECTED_SENIOR_MISSIONS_COUNT,
    max: EXPECTED_SENIOR_MISSIONS_COUNT,
})
    .refine((missions) => new Set(missions.map((item) => item.id)).size === EXPECTED_SENIOR_MISSIONS_COUNT, 'El catálogo Senior debe contener exactamente 18 misiones únicas (S01–S18)');
export const backupEnvelopeSchema = s.object({
    app: s.literal(BACKUP_APP_ID),
    version: s.number({ int: true, min: 1, max: BACKUP_SCHEMA_VERSION }),
    progress: s.plainObject(),
    seniorSuites: s.plainObject().optional(),
    miniGames: s.plainObject().optional(),
    projects: s.plainObject().optional(),
    settings: s.plainObject().optional(),
}, { strict: true });
export const c4ContainerSchema = s.object({
    id: s.string({ trimMin: 1, max: 36, pattern: /^[A-Za-z0-9_-]{1,36}$/ }),
    label: s.string({ trimMin: 2, max: 40 }),
    type: s.enum(ALL_C4_ELEMENT_TYPES),
}, { strict: true });
export const c4RelationSchema = s.object({
    from: s.string({ trimMin: 1, max: 36, pattern: /^[A-Za-z0-9_-]{1,36}$/ }),
    to: s.string({ trimMin: 1, max: 36, pattern: /^[A-Za-z0-9_-]{1,36}$/ }),
    label: s.string({ trimMin: 2, max: 40 }),
}, { strict: true });
export const c4ModelImportSchema = s
    .object({
    kind: s.literal('C4-containers-educational'),
    system: s.literal('NexoShop'),
    level: s.enum(C4_LEVELS).optional(),
    containers: s.array(c4ContainerSchema, { min: 1, max: 12 }),
    relations: s.array(c4RelationSchema, { min: 0, max: 24 }),
}, { strict: true })
    .refine((model) => validateC4(model).length === 0, 'El modelo C4 contiene relaciones duplicadas, huérfanas, autociclos, tipos fuera de su nivel o etiquetas fuera de norma');
