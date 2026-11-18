/**
 * Integrative & Capstone Projects constants owned by the Projects feature (ARQ-008).
 * Covers the 3 level integrators (B12, I12, A12) and the 8 specialization capstones (R01-R08).
 */

export const PROJECTS_STORAGE_KEY = 'arqpixel-projects-v1';
export const MIN_PROJECT_SECTION_LENGTH = 50;
export const MAX_PROJECT_SECTION_LENGTH = 6_000;

export const PROJECT_KINDS = ['level_integrator', 'specialization_capstone'] as const;
export type ProjectKind = (typeof PROJECT_KINDS)[number];

export type CapstoneProjectDefinition = {
  readonly id: string;
  readonly kind: ProjectKind;
  readonly badgeTag: string;
  readonly title: string;
  readonly subtitle: string;
  readonly context: string;
  readonly constraints: {
    readonly traffic: string;
    readonly slo: string;
    readonly team: string;
    readonly primaryConstraint: string;
  };
  readonly relatedModules: readonly string[];
  readonly relatedMissions: readonly string[];
  readonly relatedPathId?: string;
  readonly recommendedLabId: string;
  readonly expectedDomainTerms: readonly string[];
};

export const CAPSTONE_PROJECTS: readonly CapstoneProjectDefinition[] = Object.freeze([
  {
    id: 'INT-BASICO',
    kind: 'level_integrator',
    badgeTag: 'INTEGRADOR BÁSICO · B12',
    title: 'App de Reservas con Separación de Responsabilidades',
    subtitle: 'Separa interfaz, casos de uso, reglas de reservas y almacenamiento evitando acoplamiento circular.',
    context: 'Una clínica gestiona turnos desde controladores mezclados con SQL directo, generando reservas solapadas cuando cambia el canal web.',
    constraints: {
      traffic: '1.200 req/min en apertura de agenda',
      slo: '99,5 % disponibilidad horaria',
      team: '3 desarrolladores fullstack',
      primaryConstraint: 'Cero reglas de solapamiento de turnos dentro de vistas o controladores HTTP',
    },
    relatedModules: ['B03', 'B04', 'B06', 'B10', 'B12'],
    relatedMissions: ['S01'],
    recommendedLabId: 'dependencias',
    expectedDomainTerms: ['capa', 'dominio', 'reserva', 'responsabilidad'],
  },
  {
    id: 'INT-INTERMEDIO',
    kind: 'level_integrator',
    badgeTag: 'INTEGRADOR INTERMEDIO · I12',
    title: 'Monolito Modular NexoShop con Puertos y Contextos',
    subtitle: 'Delimita Catálogo, Ventas, Inventario y Pagos dentro de un único despliegue con fronteras verificables.',
    context: 'NexoShop sufre regresiones semanales porque el módulo de Ventas escribe tablas de Inventario y acopla el ORM en las entidades.',
    constraints: {
      traffic: '8.500 req/min pico comercial',
      slo: '99,9 % en confirmación de compra',
      team: '2 células (8 ingenieros)',
      primaryConstraint: 'Despliegue único modular sin microservicios prematuros ni imports cruzados entre dominios',
    },
    relatedModules: ['I06', 'I07', 'I09', 'I10', 'I12'],
    relatedMissions: ['S04', 'S05', 'S06'],
    recommendedLabId: 'ddd',
    expectedDomainTerms: ['contexto', 'puerto', 'invariante', 'modular'],
  },
  {
    id: 'INT-AVANZADO',
    kind: 'level_integrator',
    badgeTag: 'INTEGRADOR AVANZADO · A12',
    title: 'Plataforma Distribuida de Pedidos Resiliente',
    subtitle: 'Coordina pedidos, pagos externos, inventario y observabilidad bajo fallos parciales y picos 10×.',
    context: 'Durante campañas masivas, los timeouts de la pasarela externa disparan reintentos que saturan workers y generan cobros duplicados.',
    constraints: {
      traffic: '45.000 req/min en campaña flash',
      slo: '99,95 % disponibilidad y 0 cobros duplicados',
      team: '4 equipos autónomos + SRE',
      primaryConstraint: 'Entrega al menos una vez con idempotencia persistida, outbox y degradación controlada',
    },
    relatedModules: ['A05', 'A06', 'A07', 'A09', 'A12'],
    relatedMissions: ['S09', 'S11', 'S13', 'S14'],
    recommendedLabId: 'distributed',
    expectedDomainTerms: ['idempotencia', 'outbox', 'slo', 'timeout'],
  },
  {
    id: 'CAP-R01',
    kind: 'specialization_capstone',
    badgeTag: 'CAPSTONE · R01 SOLID Y GOF',
    title: 'Motor de Descuentos Extensible sin Sobreingeniería',
    subtitle: 'Aplica Strategy y composición donde existe variación real de campañas, manteniendo pruebas simples.',
    context: 'Comercial lanza reglas de promoción por temporada, cupón y fidelidad, pero una cadena de condicionales de 900 líneas rompe precios base.',
    constraints: {
      traffic: '6.000 cotizaciones/min',
      slo: '99,9 % exactitud y latencia p95 < 80 ms',
      team: '4 ingenieros backend',
      primaryConstraint: 'Justificar cada abstracción GoF frente a funciones simples y garantizar invariantes de tope de descuento',
    },
    relatedModules: ['B09', 'B10', 'I01', 'I02', 'I03', 'I04'],
    relatedMissions: ['S02', 'S03'],
    relatedPathId: 'R01',
    recommendedLabId: 'patterns',
    expectedDomainTerms: ['strategy', 'solid', 'descuento', 'invariante'],
  },
  {
    id: 'CAP-R02',
    kind: 'specialization_capstone',
    badgeTag: 'CAPSTONE · R02 CLEAN & HEXAGONAL',
    title: 'API de Reservas con Puertos, Adaptadores y Tests Aislados',
    subtitle: 'Aísla casos de uso y entidades de negocio respecto de controladores HTTP, ORM y pasarelas de notificación.',
    context: 'Se requiere migrar el motor de persistencia y exponer tanto REST como procesamiento por lotes sin tocar las reglas de reserva.',
    constraints: {
      traffic: '4.500 req/min sostenidos',
      slo: '99,9 % y suite de dominio ejecutable en < 2 s sin BD',
      team: '5 ingenieros',
      primaryConstraint: 'Cero imports de HTTP u ORM en la capa de dominio y casos de uso probados con adaptadores en memoria y reales',
    },
    relatedModules: ['B06', 'I05', 'I06', 'I07'],
    relatedMissions: ['S01', 'S04'],
    relatedPathId: 'R02',
    recommendedLabId: 'dependencias',
    expectedDomainTerms: ['puerto', 'adaptador', 'dominio', 'contrato'],
  },
  {
    id: 'CAP-R03',
    kind: 'specialization_capstone',
    badgeTag: 'CAPSTONE · R03 DDD INTEGRAL',
    title: 'Marketplace Modular: Context Map, Agregados y Eventos',
    subtitle: 'Modela límites lingüísticos, Anti-Corruption Layers y consistencia transaccional vs eventual.',
    context: 'Tres equipos disputan una única tabla Producto/Pedido gigante con 70 columnas, bloqueando despliegues y causando sobreventa.',
    constraints: {
      traffic: '15.000 req/min con alta contención de stock',
      slo: '99,9 % y cero stock negativo',
      team: '3 equipos por dominio de negocio',
      primaryConstraint: 'Agregados pequeños con control optimista/transaccional local y comunicación entre contextos por eventos',
    },
    relatedModules: ['I08', 'I09', 'I10', 'I12', 'A05'],
    relatedMissions: ['S05', 'S06'],
    relatedPathId: 'R03',
    recommendedLabId: 'ddd',
    expectedDomainTerms: ['context', 'agregado', 'evento', 'invariante'],
  },
  {
    id: 'CAP-R04',
    kind: 'specialization_capstone',
    badgeTag: 'CAPSTONE · R04 APIS Y CONTRATOS',
    title: 'Contrato HTTP Evolutivo de Pedidos con Idempotencia',
    subtitle: 'Diseña versionado compatible hacia atrás, errores estandarizados, seguridad por recurso y consumer tests.',
    context: 'Clientes móviles iOS/Android con versiones de hace 8 meses conviven con partners B2B que reintentan peticiones POST ante cortes móviles.',
    constraints: {
      traffic: '12.000 req/min desde apps móviles y B2B',
      slo: '99,95 % y ventana de deprecación mínima de 6 meses',
      team: 'Equipo de plataforma API + 3 consumidores',
      primaryConstraint: 'Evolución aditiva sin romper clientes antiguos, Idempotency-Key obligatoria en mutaciones y autorización por tenant',
    },
    relatedModules: ['B05', 'I11', 'A08', 'A10'],
    relatedMissions: ['S07', 'S12'],
    relatedPathId: 'R04',
    recommendedLabId: 'api',
    expectedDomainTerms: ['contrato', 'idempotencia', 'version', 'compatibilidad'],
  },
  {
    id: 'CAP-R05',
    kind: 'specialization_capstone',
    badgeTag: 'CAPSTONE · R05 SYSTEM DESIGN',
    title: 'Acortador y Enrutador de URLs a Escala Cuantificada',
    subtitle: 'Dimensiona lectura/escritura asimétrica (100:1), estrategia de caché, particionado, colas de analítica y SLO.',
    context: 'Campañas masivas en redes sociales concentran millones de redirecciones por minuto sobre unos pocos enlaces calientes (hot keys).',
    constraints: {
      traffic: '120.000 lecturas/min y 1.200 escrituras/min',
      slo: '99,95 % disponibilidad y redirección p95 < 45 ms',
      team: '5 ingenieros de plataforma',
      primaryConstraint: 'Prevenir cache stampede, desacoplar analítica de clics del camino crítico de lectura y justificar almacenamiento',
    },
    relatedModules: ['A01', 'A03', 'A05', 'A06', 'A09'],
    relatedMissions: ['S10', 'S11'],
    relatedPathId: 'R05',
    recommendedLabId: 'c4',
    expectedDomainTerms: ['cache', 'capacidad', 'latencia', 'slo'],
  },
  {
    id: 'CAP-R06',
    kind: 'specialization_capstone',
    badgeTag: 'CAPSTONE · R06 MICROSERVICIOS Y EVENTOS',
    title: 'Plataforma de Pagos con Outbox, Sagas, Retries y Runbooks',
    subtitle: 'Garantiza consistencia eventual auditada entre Pedidos, Pagos, Fraude y Facturación sin 2PC bloqueante.',
    context: 'Al separar Pagos y Facturación, se pierden eventos tras caídas de broker y los reintentos agresivos tumban al proveedor bancario.',
    constraints: {
      traffic: '25.000 operaciones/min en quincena',
      slo: '99,95 % en recepción de orden y conciliación < 60 s',
      team: '3 squads de servicios críticos',
      primaryConstraint: 'Transactional Outbox, consumidor idempotente, DLQ operable, circuit breaker y compensación explícita',
    },
    relatedModules: ['A02', 'A03', 'A04', 'A05', 'A07', 'A09'],
    relatedMissions: ['S08', 'S09', 'S13'],
    relatedPathId: 'R06',
    recommendedLabId: 'distributed',
    expectedDomainTerms: ['outbox', 'saga', 'idempotencia', 'compensacion'],
  },
  {
    id: 'CAP-R07',
    kind: 'specialization_capstone',
    badgeTag: 'CAPSTONE · R07 CLOUD Y OPERACIÓN',
    title: 'Servicio Multizona con SLO, Observabilidad, Canary y Rollback',
    subtitle: 'Diseña telemetría accionable, presupuesto de error, migración expand/contract y recuperación sin caída.',
    context: 'Los despliegues en horario laboral provocan errores 500 durante migraciones SQL y el equipo tarda 45 minutos en detectar degradaciones p95.',
    constraints: {
      traffic: '30.000 req/min continuos 24×7',
      slo: '99,95 % mensual y RTO < 5 min ante release defectuoso',
      team: 'Equipo Cloud/SRE + 2 equipos de producto',
      primaryConstraint: 'Alertas por burn rate de SLO, migraciones de base de datos expand/contract y rollback automatizable',
    },
    relatedModules: ['A07', 'A08', 'A09', 'A10', 'A11'],
    relatedMissions: ['S14', 'S15', 'S16'],
    relatedPathId: 'R07',
    recommendedLabId: 'incident',
    expectedDomainTerms: ['slo', 'canary', 'rollback', 'observabilidad'],
  },
  {
    id: 'CAP-R08',
    kind: 'specialization_capstone',
    badgeTag: 'CAPSTONE · R08 ARQUITECTURA SENIOR',
    title: 'Defensa ante Comité: C4, Dossier ADR, FinOps y Plan 90 Días',
    subtitle: 'Integra arquitectura objetivo, riesgos de seguridad STRIDE, presupuesto cloud y hoja de ruta evolutiva por etapas.',
    context: 'Dirección exige duplicar volumen transaccional reduciendo un 20 % el gasto cloud mientras coexisten un core legado y tres equipos con prioridades opuestas.',
    constraints: {
      traffic: '65.000 req/min proyectados a 6 meses',
      slo: '99,95 % en flujos core dentro de techo presupuestal FinOps',
      team: 'Organización de 4 equipos + Seguridad + Finanzas',
      primaryConstraint: 'Plan incremental de 30/60/90 días con métricas de corte, dueños claros y reversión por hito',
    },
    relatedModules: ['A01', 'A02', 'A05', 'A07', 'A08', 'A09', 'A10', 'A11', 'A12'],
    relatedMissions: ['S08', 'S09', 'S15', 'S17', 'S18'],
    relatedPathId: 'R08',
    recommendedLabId: 'adr',
    expectedDomainTerms: ['c4', 'adr', 'riesgo', 'costo'],
  },
]);
