/**
 * Explicit simulator telemetry assumptions (`L2600`) and canonical `POSITIVE / NEGATIVE / BOUNDARY`
 * verification fixtures (`L2604`) for all 8 ARQPIXEL laboratories (`symbol-ownership-architecture`).
 */
import type { C4Container, C4Model } from '../../../c4-studio.js';
import type { AggregateDesignInput, DddContextMapRelation } from '../../../ddd-workshop.js';
import { MIN_ADR_FIELD_LENGTH } from './labs.constants.js';

export type LabStudioTelemetrySpec = {
  readonly studioId: string;
  readonly modelBadge: string;
  readonly modelFormulaSummary: string;
  readonly assumptions: readonly [string, string, string];
  readonly outOfScopeNotice: string;
  readonly flowNodes: readonly [string, string, string, string];
  readonly flowEdges: readonly [string, string, string];
};

export const LAB_TELEMETRY_SPECS: Readonly<Record<string, LabStudioTelemetrySpec>> = Object.freeze({
  dependencias: {
    studioId: 'dependencias',
    modelBadge: 'GRAFO DIRIGIDO + MÉTRICAS DE MARTIN',
    modelFormulaSummary: 'Evalúa dirección concéntrica, ciclos DFS e Inestabilidad I = Ce / (Ca + Ce).',
    assumptions: [
      'Dominio puro exige Ce = 0 hacia capas técnicas externas',
      'Cada arista representa acoplamiento estático de compilación/import',
      'Detección determinista de ciclos dirigidos entre 4 capas base',
    ],
    outOfScopeNotice:
      'No inspecciona reflexión dinámica en runtime ni latencia IPC; audita topología estructural.',
    flowNodes: ['Presentación', 'Aplicación', 'Puerto', 'Dominio Puro'],
    flowEdges: ['DTO HTTP', 'Caso de Uso', 'Inversión DIP'],
  },
  c4: {
    studioId: 'c4',
    modelBadge: 'MODELO SEMÁNTICO C1 / C2 / C3',
    modelFormulaSummary: 'Valida topología acíclica, fronteras de confianza y contratos explícitos.',
    assumptions: [
      'Límite didáctico de 1 a 12 elementos y hasta 24 relaciones por vista',
      'Todo acceso a Base de Datos debe pasar por API/Caso de Uso propietario',
      'Exportaciones JSON, Mermaid, SVG y PNG 100 % estáticas sin scripts activos',
    ],
    outOfScopeNotice:
      'No descubre topología desde tráfico cloud real; valida coherencia semántica del diseño declarado.',
    flowNodes: ['Actor / Web', 'API / BFF', 'Dominio C3', 'Almacén / PSP'],
    flowEdges: ['HTTPS/JSON', 'Comando puro', 'SQL / REST'],
  },
  ddd: {
    studioId: 'ddd',
    modelBadge: 'FRONTERAS DDD + TRANSACCIÓN ACID VS EVENTUAL',
    modelFormulaSummary: 'Comprueba lenguaje ubicuo polisémico, patrones de Context Map y raíz de Agregado.',
    assumptions: [
      'Un Agregado define una única frontera transaccional ACID inmediata',
      'Sistemas externos legados requieren Anti-Corruption Layer (ACL)',
      'Efectos entre contextos distintos se coordinan mediante Domain Events / Outbox',
    ],
    outOfScopeNotice:
      'La granularidad óptima final requiere medir contención real de bloqueos en base de datos (REQUIRES_REVIEW).',
    flowNodes: ['Contexto Ventas', 'Outbox / Evento', 'ACL Traductor', 'Inventario / PSP'],
    flowEdges: ['ACID + versión', 'OrdenCreada v1', 'Modelo aislado'],
  },
  patterns: {
    studioId: 'patterns',
    modelBadge: 'MATRIZ DE VARIABILIDAD VS SOBREDISEÑO',
    modelFormulaSummary: 'Pondera número de variantes reales y frecuencia de cambio frente a coste accidental.',
    assumptions: [
      '1 sola variante estable penaliza factorías/buses dinámicos por YAGNI',
      '3+ variantes con cambio frecuente favorecen Strategy + Puerto estable',
      'Índice de complejidad estructural acotado en escala relativa 0–100',
    ],
    outOfScopeNotice:
      'Los pesos son orientativos para discusión técnica; la familiaridad del equipo puede alterar el umbral.',
    flowNodes: ['Requisito Cambio', 'Frecuencia', 'Puerto Strategy', 'Coste Cognitivo'],
    flowEdges: ['Variantes N', 'Cadencia', 'Trade-off'],
  },
  api: {
    studioId: 'api',
    modelBadge: 'OPENAPI 3.1 + CONSUMER-DRIVEN CONTRACTS',
    modelFormulaSummary: 'Contrasta cambios de esquema HTTP v1→v2 frente a expectativas de 3 consumidores.',
    assumptions: [
      'Renombrar campos, cambiar tipos o exigir campos nuevos en request rompe clientes actuales',
      'Campos opcionales aditivos siguen estrategia Expand-Contract compatible',
      'Verifica estatus HTTP, propiedades requeridas y tipos primitivos declarados',
    ],
    outOfScopeNotice:
      'No ejecuta fuzzing TLS ni pruebas de carga HTTP reales; audita compatibilidad estructural de contratos.',
    flowNodes: ['Spec v1 / v2', 'Checkout Web', 'App Móvil', 'Gate CDC CI'],
    flowEdges: ['Diff campos', 'Expectativas', 'PASS / FAIL'],
  },
  distributed: {
    studioId: 'distributed',
    modelBadge: 'SIMULADOR AT-LEAST-ONCE + OUTBOX + SAGA',
    modelFormulaSummary: 'Calcula entregas duplicadas sobre 1.000 envíos y traza fallos cruzados en 5 almacenes.',
    assumptions: [
      'Entrega at-least-once implica probabilidad explícita de reentrega por timeout de ACK',
      'Transactional Outbox une escritura de negocio y evento en una sola TX local',
      'Consumidor idempotente exige clave única event_id persistida atómicamente',
    ],
    outOfScopeNotice:
      'Modelo discreto determinista; no emula particiones TCP de kernel ni relojes físicos desincronizados.',
    flowNodes: ['TX + Outbox', 'Relay Broker', 'Inbox Dedup', 'Saga / DLQ'],
    flowEdges: ['Commit único', 'Reintento red', 'Idempotencia'],
  },
  adr: {
    studioId: 'adr',
    modelBadge: 'MATRIZ MULTICRITERIO + ESTRUCTURA ADR',
    modelFormulaSummary: 'Valida presencia de contexto cuantitativo, decisión concreta y trade-offs explícitos.',
    assumptions: [
      `Cada bloque estructural requiere al menos ${MIN_ADR_FIELD_LENGTH} caracteres con sustancia`,
      'Toda decisión arquitectónica sacrifica al menos una propiedad (coste, latencia o simplicidad)',
      'El veredicto cualitativo conserva siempre marcador REQUIRES_REVIEW',
    ],
    outOfScopeNotice:
      'La longitud o estructura jamás certifican que la decisión sea correcta para negocio sin revisión humana.',
    flowNodes: ['Restricciones', 'Matriz 1–5', 'Decisión ADR', 'REQUIRES_REVIEW'],
    flowEdges: ['SLO / Equipo', 'Comparativa', 'Juicio experto'],
  },
  incident: {
    studioId: 'incident',
    modelBadge: 'BURN RATE SLO + COLAS M/M/c + RESILIENCIA',
    modelFormulaSummary: 'Calcula consumo de Error Budget, cascada de timeouts/retries y techo req/s.',
    assumptions: [
      'Burn Rate = tasa_error_observada / (1 - SLO); > 1.0x agota el presupuesto antes de cerrar ventana',
      'Peor caso síncrono = (1 + reintentos) × timeout_dependencia frente al SLA del llamador',
      'Estimación FinOps orientativa basada en réplicas, vCPU y pool de conexiones SQL',
    ],
    outOfScopeNotice:
      'Las tarifas USD/mes y colas P95/P99 son aproximaciones analíticas; validar siempre con load testing real.',
    flowNodes: ['Tráfico Pico', 'Timeout + Jitter', 'Circuit Breaker', 'SLO Burn Rate'],
    flowEdges: ['req/s + caché', 'Acota cascada', 'Error Budget'],
  },
});

export type FixtureKind = 'positive' | 'negative' | 'boundary';

export const DEPENDENCY_VERIFICATION_FIXTURES: Readonly<
  Record<
    FixtureKind,
    {
      readonly label: string;
      readonly expectedValid: boolean;
      readonly edges: ReadonlyArray<readonly [string, string]>;
    }
  >
> = Object.freeze({
  positive: {
    label: 'Positivo · Hexagonal limpio (Ce Dominio = 0)',
    expectedValid: true,
    edges: [
      ['Presentación', 'Aplicación'],
      ['Aplicación', 'Dominio'],
      ['Infraestructura', 'Aplicación'],
      ['Infraestructura', 'Dominio'],
    ],
  },
  negative: {
    label: 'Negativo · Dominio→Infraestructura + Ciclo',
    expectedValid: false,
    edges: [
      ['Presentación', 'Aplicación'],
      ['Dominio', 'Infraestructura'],
      ['Aplicación', 'Infraestructura'],
      ['Infraestructura', 'Aplicación'],
    ],
  },
  boundary: {
    label: 'Límite · Capas 100 % aisladas (0 aristas)',
    expectedValid: true,
    edges: [],
  },
});

export const C4_VERIFICATION_FIXTURES: Readonly<
  Record<
    FixtureKind,
    {
      readonly label: string;
      readonly expectedValidSyntax: boolean;
      readonly expectedZeroHighWarnings: boolean;
      readonly model: C4Model;
    }
  >
> = Object.freeze({
  positive: {
    label: 'Positivo · C2 limpio con contratos HTTPS/SQL',
    expectedValidSyntax: true,
    expectedZeroHighWarnings: true,
    model: {
      kind: 'C4-containers-educational',
      system: 'NexoShop',
      level: 'C2',
      containers: [
        { id: 'web', label: 'SPA Web NexoShop', type: 'Frontend' },
        { id: 'api', label: 'API Pedidos', type: 'API' },
        { id: 'db', label: 'PostgreSQL Pedidos', type: 'Base de datos' },
      ],
      relations: [
        { from: 'web', to: 'api', label: 'Crea pedido HTTPS/JSON' },
        { from: 'api', to: 'db', label: 'Persiste transacción SQL' },
      ],
    },
  },
  negative: {
    label: 'Negativo · Frontend→BD directo + etiqueta XSS/ambigua',
    expectedValidSyntax: true,
    expectedZeroHighWarnings: false,
    model: {
      kind: 'C4-containers-educational',
      system: 'NexoShop',
      level: 'C2',
      containers: [
        { id: 'web', label: 'Web <script>alert(1)</script>', type: 'Frontend' },
        { id: 'db', label: 'BD Clientes', type: 'Base de datos' },
      ],
      relations: [{ from: 'web', to: 'db', label: 'usa' }],
    },
  },
  boundary: {
    label: 'Límite · Máximo exacto de 12 contenedores C2 conectados',
    expectedValidSyntax: true,
    expectedZeroHighWarnings: true,
    model: {
      kind: 'C4-containers-educational',
      system: 'NexoShop',
      level: 'C2',
      containers: Array.from<unknown, C4Container>({ length: 12 }, (_, idx) => ({
        id: `n-${idx + 1}`,
        label: idx === 0 ? 'Web Portal' : idx === 11 ? 'BD Principal' : `Servicio ${idx}`,
        type: idx === 0 ? 'Frontend' : idx === 11 ? 'Base de datos' : 'API',
      })),
      relations: Array.from({ length: 11 }, (_, idx) => ({
        from: `n-${idx + 1}`,
        to: `n-${idx + 2}`,
        label: `Invoca contrato interno v${idx + 1}`,
      })),
    },
  },
});

export const DDD_VERIFICATION_FIXTURES: Readonly<
  Record<
    FixtureKind,
    {
      readonly label: string;
      readonly contextMap: readonly DddContextMapRelation[];
      readonly aggregate: AggregateDesignInput;
      readonly expectedContextMapValid: boolean;
      readonly expectedAggregateStatus: 'PASS' | 'FAIL';
    }
  >
> = Object.freeze({
  positive: {
    label: 'Positivo · OrdenCompra acotada + ACL + Outbox',
    expectedContextMapValid: true,
    expectedAggregateStatus: 'PASS',
    contextMap: [
      {
        upstream: 'Ventas',
        downstream: 'Inventario',
        pattern: 'Domain Events',
        contractSummary: 'Publica OrdenCreada v1',
      },
      {
        upstream: 'PSP Externo Legado',
        downstream: 'Pagos',
        pattern: 'Anti-Corruption Layer',
        contractSummary: 'Traduce respuesta ISO del PSP',
      },
    ],
    aggregate: {
      rootId: 'OrdenCompra',
      internalEntities: ['lineas-pedido', 'cupon-aplicado'],
      invariants: ['inv-total-positivo', 'inv-no-mutar-pagada'],
      eventualEvents: ['evt-reservar-stock', 'evt-autorizar-cobro'],
      optimisticConcurrency: true,
    },
  },
  negative: {
    label: 'Negativo · MegaAgregado + Shared Database + Sin ACL',
    expectedContextMapValid: false,
    expectedAggregateStatus: 'FAIL',
    contextMap: [
      {
        upstream: 'Ventas',
        downstream: 'Inventario',
        pattern: 'Shared Database',
        contractSummary: 'Tabla compartida orders_stock',
      },
      {
        upstream: 'PSP Externo Legado',
        downstream: 'Pagos',
        pattern: 'Customer-Supplier',
        contractSummary: 'Acopla DTO crudo del PSP',
      },
    ],
    aggregate: {
      rootId: 'MegaAgregadoEcommerce',
      internalEntities: ['catalogo-global-fotos', 'flota-camiones-gps'],
      invariants: [],
      eventualEvents: [],
      optimisticConcurrency: false,
    },
  },
  boundary: {
    label: 'Límite · StockItem mínimo con 1 entidad interna y versión optimista',
    expectedContextMapValid: true,
    expectedAggregateStatus: 'PASS',
    contextMap: [
      {
        upstream: 'Inventario',
        downstream: 'Ventas',
        pattern: 'Domain Events',
        contractSummary: 'Emite StockReservado v1',
      },
    ],
    aggregate: {
      rootId: 'StockItem',
      internalEntities: ['reserva-lote'],
      invariants: ['inv-no-overselling'],
      eventualEvents: ['evt-autorizar-cobro'],
      optimisticConcurrency: true,
    },
  },
});

export const ADR_BOUNDARY_FIXTURES = Object.freeze({
  positive: {
    title: 'ADR-009: Outbox transaccional en módulo de pedidos',
    context: 'NexoShop procesa 8.000 req/min con SLO 99,9 % y equipo de 9 ingenieros.',
    decision: 'Adoptamos tabla Outbox en PostgreSQL con consumidor idempotente por event_id.',
    tradeoff: 'Aceptamos consistencia eventual (< 2 s p95) a cambio de evitar 2PC bloqueante.',
  },
  negative: {
    title: 'ADR corto',
    context: 'Poco texto',
    decision: 'Usar Kafka',
    tradeoff: 'Ninguno',
  },
  boundaryFailJustBelowMin: {
    title: 'ADR límite inferior',
    context: 'A'.repeat(MIN_ADR_FIELD_LENGTH - 1),
    decision: 'B'.repeat(MIN_ADR_FIELD_LENGTH),
    tradeoff: 'C'.repeat(MIN_ADR_FIELD_LENGTH),
  },
  boundaryPassExactMin: {
    title: 'ADR límite exacto',
    context: 'A'.repeat(MIN_ADR_FIELD_LENGTH),
    decision: 'B'.repeat(MIN_ADR_FIELD_LENGTH),
    tradeoff: 'C'.repeat(MIN_ADR_FIELD_LENGTH),
  },
});
