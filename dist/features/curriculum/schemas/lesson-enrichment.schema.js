import { s } from '../../shared/schemas/schema-validator.js';
import { moduleIdSchema } from './curriculum.schema.js';
export const LAB_STUDIO_IDS = [
    'dependencias',
    'c4',
    'ddd',
    'patterns',
    'api',
    'distributed',
    'adr',
    'incident',
];
export const diagramNodeSchema = s.object({
    id: s.string({ trimMin: 2, max: 32, pattern: /^[a-z0-9-]+$/ }),
    label: s.string({ trimMin: 3, max: 36 }),
    role: s.string({ trimMin: 3, max: 36 }),
}, { strict: true });
export const diagramEdgeSchema = s.object({
    from: s.string({ trimMin: 2, max: 32, pattern: /^[a-z0-9-]+$/ }),
    to: s.string({ trimMin: 2, max: 32, pattern: /^[a-z0-9-]+$/ }),
    label: s.string({ trimMin: 3, max: 44 }),
}, { strict: true });
export const lessonEnrichmentItemSchema = s
    .object({
    moduleId: moduleIdSchema,
    diagramTitle: s.string({ trimMin: 8, max: 120 }),
    nodes: s.array(diagramNodeSchema, { min: 3, max: 5 }),
    edges: s.array(diagramEdgeSchema, { min: 2, max: 6 }),
    goodTitle: s.string({ trimMin: 8, max: 110 }),
    goodCodeTs: s.string({ trimMin: 45, max: 1_800 }),
    badTitle: s.string({ trimMin: 8, max: 110 }),
    badCodeTs: s.string({ trimMin: 40, max: 1_800 }),
    counterexample: s.string({ trimMin: 30, max: 500 }),
    labId: s.enum(LAB_STUDIO_IDS),
    practicalExercise: s.string({ trimMin: 35, max: 500 }),
}, { strict: true })
    .refine((entry) => {
    const ids = new Set(entry.nodes.map((n) => n.id));
    if (ids.size !== entry.nodes.length)
        return false;
    return entry.edges.every((e) => ids.has(e.from) && ids.has(e.to) && e.from !== e.to);
}, 'El diagrama del módulo contiene nodos duplicados o aristas hacia IDs inexistentes');
export const lessonEnrichmentsCatalogSchema = s
    .array(lessonEnrichmentItemSchema, { min: 36, max: 36 })
    .refine((items) => new Set(items.map((x) => x.moduleId)).size === 36, 'El catálogo enriquecido debe cubrir exactamente los 36 módulos únicos (B01–A12)');
