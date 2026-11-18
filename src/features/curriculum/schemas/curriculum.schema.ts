import {
  EXPECTED_MODULES_COUNT,
  EXPECTED_PATHS_COUNT,
} from '../../shared/constants/app.constants.js';
import { type InferSchema, s } from '../../shared/schemas/schema-validator.js';
import { CURRICULUM_LEVELS } from '../constants/curriculum.constants.js';

export const moduleIdSchema = s.string({ pattern: /^[BIA](?:0[1-9]|1[0-2])$/ });
export const pathIdSchema = s.string({ pattern: /^R0[1-8]$/ });

export const moduleBaseSchema = s
  .object({
    id: moduleIdSchema,
    title: s.string({ trimMin: 4, max: 140 }),
    concept: s.string({ trimMin: 8, max: 320 }),
    activity: s.string({ trimMin: 4, max: 200 }),
    level: s.enum(CURRICULUM_LEVELS),
    lesson: s.string({ trimMin: 55, max: 8_000 }),
    example: s.string({ trimMin: 25, max: 4_000 }),
    question: s.string({ trimMin: 10, max: 800 }),
    options: s.array(s.string({ trimMin: 2, max: 400 }), { min: 3, max: 5 }),
    correct: s.number({ int: true, min: 0, max: 4 }),
    explanation: s.string({ trimMin: 12, max: 2_000 }),
    readingMinutes: s.number({ int: true, min: 1, max: 120 }),
  })
  .refine(
    (mod) => mod.correct < mod.options.length && mod.level[0] === mod.id[0],
    'Índice correct fuera de rango o nivel incoherente con prefijo de ID',
  );

export type ModuleBaseSchema = InferSchema<typeof moduleBaseSchema>;

export const deepDiveSchema = s.object({
  id: moduleIdSchema,
  comparison: s.string({ trimMin: 8, max: 300 }),
  reason: s.string({ trimMin: 20, max: 4_000 }),
  metric: s.string({ trimMin: 12, max: 2_000 }),
  transfer: s.string({ trimMin: 15, max: 2_000 }),
});

export type DeepDiveSchema = InferSchema<typeof deepDiveSchema>;

export const moduleSchema = s
  .object({
    id: moduleIdSchema,
    title: s.string({ trimMin: 4, max: 140 }),
    concept: s.string({ trimMin: 8, max: 320 }),
    activity: s.string({ trimMin: 4, max: 200 }),
    level: s.enum(CURRICULUM_LEVELS),
    lesson: s.string({ trimMin: 55, max: 8_000 }),
    example: s.string({ trimMin: 25, max: 4_000 }),
    question: s.string({ trimMin: 10, max: 800 }),
    options: s.array(s.string({ trimMin: 2, max: 400 }), { min: 3, max: 5 }),
    correct: s.number({ int: true, min: 0, max: 4 }),
    explanation: s.string({ trimMin: 12, max: 2_000 }),
    readingMinutes: s.number({ int: true, min: 1, max: 120 }),
    comparison: s.string({ trimMin: 8, max: 300 }).optional(),
    reason: s.string({ trimMin: 20, max: 4_000 }).optional(),
    metric: s.string({ trimMin: 12, max: 2_000 }).optional(),
    transfer: s.string({ trimMin: 15, max: 2_000 }).optional(),
  })
  .refine((mod) => mod.correct < mod.options.length, 'Índice correct fuera de rango');

export type ModuleSchema = InferSchema<typeof moduleSchema>;

export const learningPathSchema = s
  .object({
    id: pathIdSchema,
    title: s.string({ trimMin: 4, max: 140 }),
    tag: s.string({ trimMin: 2, max: 60 }),
    summary: s.string({ trimMin: 15, max: 800 }),
    modules: s.array(moduleIdSchema, { min: 3, max: 36 }),
    capstone: s.string({ trimMin: 15, max: 1_200 }),
  })
  .refine(
    (path) => new Set(path.modules).size === path.modules.length,
    'Una especialización no puede repetir IDs de módulos',
  );

export type LearningPathSchema = InferSchema<typeof learningPathSchema>;

export const labCaseItemSchema = s
  .object({
    id: s.string({ trimMin: 2, max: 40 }),
    q: s.string({ trimMin: 12, max: 800 }),
    options: s.array(s.string({ trimMin: 2, max: 400 }), { min: 2, max: 5 }),
    correct: s.number({ int: true, min: 0, max: 4 }),
    why: s.string({ trimMin: 10, max: 1_000 }),
  })
  .refine((item) => item.correct < item.options.length, 'Caso de laboratorio con correct fuera de rango');

export type LabCaseItemSchema = InferSchema<typeof labCaseItemSchema>;

export const labCasesCatalogSchema = s.object(
  {
    patterns: s.array(labCaseItemSchema, { min: 4, max: 4 }),
    api: s.array(labCaseItemSchema, { min: 4, max: 4 }),
    incident: s.array(labCaseItemSchema, { min: 4, max: 4 }),
  },
  { strict: true },
);

export type LabCasesCatalogSchema = InferSchema<typeof labCasesCatalogSchema>;

export const modulesCatalogSchema = s
  .array(moduleBaseSchema, { min: EXPECTED_MODULES_COUNT, max: EXPECTED_MODULES_COUNT })
  .refine(
    (items) => new Set(items.map((x) => x.id)).size === EXPECTED_MODULES_COUNT,
    'El catálogo de módulos debe contener exactamente 36 IDs únicos',
  );

export const deepDivesCatalogSchema = s
  .array(deepDiveSchema, { min: EXPECTED_MODULES_COUNT, max: EXPECTED_MODULES_COUNT })
  .refine(
    (items) => new Set(items.map((x) => x.id)).size === EXPECTED_MODULES_COUNT,
    'El catálogo deep-dives debe contener exactamente 36 IDs únicos',
  );

export const learningPathsCatalogSchema = s
  .array(learningPathSchema, { min: EXPECTED_PATHS_COUNT, max: EXPECTED_PATHS_COUNT })
  .refine(
    (items) => new Set(items.map((x) => x.id)).size === EXPECTED_PATHS_COUNT,
    'El catálogo de especializaciones debe contener exactamente 8 rutas únicas',
  );

export function mergeValidatedCurriculum(raw_modules: unknown, raw_deep_dives: unknown): ModuleSchema[] {
  const base_modules = modulesCatalogSchema.parse(raw_modules, 'modules.json');
  const deep_dives = deepDivesCatalogSchema.parse(raw_deep_dives, 'deep-dives.json');
  const lookup = new Map(deep_dives.map((item) => [item.id, item]));
  return base_modules.map((mod) => {
    const detail = lookup.get(mod.id);
    if (!detail) {
      throw new Error(`Contenido extendido faltante para el módulo ${mod.id}`);
    }
    return {
      ...mod,
      comparison: detail.comparison,
      reason: detail.reason,
      metric: detail.metric,
      transfer: detail.transfer,
    };
  });
}
