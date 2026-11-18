import type { C4Container, C4Relation } from '../../../c4-studio.js';

export type CaseLabId = 'patterns' | 'api' | 'incident';
export type LabStudioId = 'dependencias' | 'c4' | 'ddd' | 'patterns' | 'api' | 'distributed' | 'adr' | 'incident';

export type LabDifficulty = 'Fundamentos' | 'Intermedio' | 'Avanzado';

export type LabStudioDefinition = {
  readonly id: LabStudioId;
  readonly icon: string;
  readonly title: string;
  readonly subtitle: string;
  readonly tag: string;
  readonly difficulty: LabDifficulty;
  readonly topics: readonly string[];
};

export type FallbackLabPrompt = {
  readonly q: string;
  readonly options: readonly string[];
  readonly correct: number;
  readonly why: string;
};

export const MAX_C4_CONTAINERS = 12;
export const MIN_C4_LABEL_LENGTH = 2;
export const MAX_C4_LABEL_LENGTH = 40;
export const MIN_ADR_FIELD_LENGTH = 35;
export const SIMULATED_OPERATIONS_COUNT = 1_000;

export const LAB_STUDIOS: readonly LabStudioDefinition[] = Object.freeze([
  { id: 'dependencias', icon: '◈', title: 'Dependency Graph Builder', subtitle: 'Explora presets (Capas, Hexagonal, Clean, Modular Monolith), acoplamiento Ca/Ce y exporta Mermaid.', tag: 'DIAGRAMA', difficulty: 'Fundamentos', topics: ['DIP', 'Clean', 'Hexagonal', 'Acoplamiento'] },
  { id: 'c4', icon: '▣', title: 'C4 Studio', subtitle: 'Modela vistas C1 Contexto, C2 Contenedores y C3 Componentes con reglas semánticas e import/export JSON.', tag: 'MODELADO', difficulty: 'Intermedio', topics: ['C4', 'Contenedores', 'Componentes', 'Mermaid'] },
  { id: 'ddd', icon: '⬡', title: 'DDD Workshop', subtitle: 'Modela lenguaje ubicuo polisémico, Context Map (ACL, Eventos) e invariantes de Agregado.', tag: 'DOMINIO', difficulty: 'Intermedio', topics: ['DDD', 'Bounded Context', 'Agregados', 'ACL'] },
  { id: 'patterns', icon: '⌘', title: 'Pattern & Refactoring Clinic', subtitle: 'Evalúa patrones GoF frente a variabilidad real y detecta sobrediseño accidental.', tag: 'DISEÑO', difficulty: 'Fundamentos', topics: ['GoF', 'Strategy', 'Adapter', 'Trade-offs'] },
  { id: 'api', icon: '{ }', title: 'API Contract Lab', subtitle: 'Compara evolución OpenAPI/JSON v1 vs v2 y detecta breaking changes, paginación rota e Idempotency-Key.', tag: 'CONTRATOS', difficulty: 'Intermedio', topics: ['REST', 'OpenAPI', 'Idempotencia', 'Versionado'] },
  { id: 'distributed', icon: '☷', title: 'Distributed Systems Simulator', subtitle: 'Simula paso a paso Outbox, Idempotent Consumer, DLQ y Saga compensatoria bajo fallos de red.', tag: 'SISTEMAS', difficulty: 'Avanzado', topics: ['Outbox', 'Idempotencia', 'DLQ', 'Saga'] },
  { id: 'adr', icon: '✎', title: 'Architecture Decision Studio', subtitle: 'Compara alternativas en matriz multicriterio, redacta tu ADR y exporta evidencia Markdown.', tag: 'DECISIONES', difficulty: 'Intermedio', topics: ['ADR', 'Trade-offs', 'Reversibilidad', 'Gobernanza'] },
  { id: 'incident', icon: '⚡', title: 'Incident & Reliability Lab', subtitle: 'Calcula Error Budget / SLO burn rate y coordina timeout, backoff, jitter, circuit breaker y bulkhead.', tag: 'OPERACIONES', difficulty: 'Avanzado', topics: ['SLO', 'Burn Rate', 'Circuit Breaker', 'Resiliencia'] },
]);

export const FALLBACK_CASE_PROMPTS: Readonly<Record<CaseLabId, FallbackLabPrompt>> = Object.freeze({
  patterns: {
    q: 'Necesitas integrar tres proveedores de cobro, con contratos HTTP distintos, sin cambiar el caso de uso.',
    options: ['Adapter + puerto de pagos', 'Singleton global de conexión', 'Copiar condicionales en cada controlador'],
    correct: 0,
    why: 'Adapter traduce contratos y el puerto protege los casos de uso.',
  },
  api: {
    q: 'Una app móvil podría repetir POST /pagos tras un timeout. ¿Qué diseño protege mejor?',
    options: ['POST con Idempotency-Key y almacenamiento de resultados', 'Enviar GET para confirmar el cargo', 'Deshabilitar timeouts'],
    correct: 0,
    why: 'Una clave estable y deduplicación persistida evitan repetir el efecto.',
  },
  incident: {
    q: 'Un proveedor externo presenta timeout 40 % de veces y los retries saturan todos tus workers.',
    options: ['Retries ilimitados', 'Timeout finito, jitter, límite de retries y circuit breaker', 'Duplicar el tráfico para confirmar'],
    correct: 1,
    why: 'Las defensas coordinadas reducen amplificación y permiten degradación controlada.',
  },
});

export const INITIAL_DEPENDENCY_EDGES: ReadonlyArray<readonly [string, string]> = Object.freeze([
  ['Presentación', 'Aplicación'],
  ['Aplicación', 'Dominio'],
  ['Infraestructura', 'Dominio'],
]);

export const INITIAL_C4_CONTAINERS: readonly C4Container[] = Object.freeze([
  { id: 'frontend', label: 'Web NexoShop', type: 'Frontend' },
  { id: 'api-pedidos', label: 'API Pedidos', type: 'API' },
  { id: 'bd-pedidos', label: 'BD Pedidos', type: 'Base de datos' },
  { id: 'proveedor-pagos', label: 'Proveedor de pagos', type: 'Servicio externo' },
]);

export const INITIAL_C4_RELATIONS: readonly C4Relation[] = Object.freeze([
  { from: 'frontend', to: 'api-pedidos', label: 'Solicita pedidos' },
  { from: 'api-pedidos', to: 'bd-pedidos', label: 'Persiste pedidos' },
  { from: 'api-pedidos', to: 'proveedor-pagos', label: 'Autoriza cobros' },
]);

export const DDD_BOUNDED_CONTEXTS = ['Ventas', 'Inventario', 'Pagos', 'Catálogo'] as const;

export const DDD_WORKSHOP_CONCEPTS: ReadonlyArray<readonly [string, (typeof DDD_BOUNDED_CONTEXTS)[number]]> = Object.freeze([
  ['Pedido', 'Ventas'],
  ['Stock disponible', 'Inventario'],
  ['Transacción de cobro', 'Pagos'],
  ['Precio publicado', 'Catálogo'],
  ['Reserva de unidades', 'Inventario'],
]);

export const ARCHITECTURE_RESOURCES_SUMMARY: ReadonlyArray<readonly [string, string, string]> = Object.freeze([
  ['SOLID', 'SRP, OCP, LSP, ISP y DIP sirven para controlar cambios y dependencias.', 'B10'],
  ['Patrones GoF', 'Creacionales, estructurales y de comportamiento. Elegir por contexto, no por moda.', 'I02'],
  ['Clean Architecture', 'Dependencias hacia reglas de negocio; infraestructura reemplazable.', 'I06'],
  ['Arquitectura hexagonal', 'Puertos y adaptadores, pruebas de casos de uso sin detalles externos.', 'I07'],
  ['DDD estratégico', 'Lenguaje ubicuo, subdominios y Bounded Contexts.', 'I08'],
  ['DDD táctico', 'Entidades, Value Objects, agregados y eventos de dominio.', 'I10'],
  ['Sistemas distribuidos', 'Entrega al menos una vez, eventual consistency, outbox y sagas.', 'A05'],
  ['Observabilidad', 'SLI/SLO, señales, métricas, logs, trazas y error budgets.', 'A09'],
]);

export const CORE_GLOSSARY_TERMS: ReadonlyArray<readonly [string, string]> = Object.freeze([
  ['ADR', 'Registro de decisión arquitectónica: contexto, elección y consecuencias.'],
  ['C4', 'Conjunto de vistas para comunicar distintos niveles de detalle.'],
  ['Bounded Context', 'Límite del modelo y su lenguaje en un dominio.'],
  ['Trade-off', 'Beneficio que se obtiene aceptando un coste o una limitación.'],
  ['Idempotencia', 'Repetir una operación sin multiplicar su efecto más allá de lo previsto.'],
  ['SLO', 'Objetivo medible del nivel de servicio.'],
]);
