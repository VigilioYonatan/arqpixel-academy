/**
 * Architectural & GoF pattern sheets, mandatory comparative matrices (§17.4),
 * ADR templates library and expanded glossary owned by the Resources feature (ARQ-009).
 */

export const PATTERN_CATEGORIES = [
  'GoF Creacional',
  'GoF Estructural',
  'GoF Comportamiento',
  'Arquitectónico',
  'Sistemas Distribuidos',
] as const;

export type PatternCategory = (typeof PATTERN_CATEGORIES)[number];

export type PatternCard = {
  readonly id: string;
  readonly name: string;
  readonly category: PatternCategory;
  readonly intent: string;
  readonly problem: string;
  readonly solution: string;
  readonly whenToUse: readonly string[];
  readonly whenNotToUse: readonly string[];
  readonly operationalCost: string;
  readonly goodExampleTs: string;
  readonly badExampleTs: string;
  readonly relatedModules: readonly string[];
  readonly relatedMissions: readonly string[];
};

export type ComparativeSheet = {
  readonly id: string;
  readonly title: string;
  readonly question: string;
  readonly chooseFirstWhen: string;
  readonly chooseSecondWhen: string;
  readonly commonTrap: string;
  readonly verificationSignal: string;
};

export type AdrTemplateEntry = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly markdownTemplate: string;
};

export const PATTERN_CARDS: readonly PatternCard[] = Object.freeze([
  {
    id: 'strategy',
    name: 'Strategy (Estrategia Intercambiable)',
    category: 'GoF Comportamiento',
    intent: 'Encapsular una familia de algoritmos o políticas de negocio que varían de forma independiente del caso de uso que las invoca.',
    problem: 'Un servicio acumula condicionales crecientes por campaña, país o método de cálculo, obligando a editar y volver a probar todo el módulo ante cada nueva regla.',
    solution: 'Definir un contrato pequeño orientado al dominio e inyectar la estrategia correspondiente según contexto verificable.',
    whenToUse: [
      'Existen al menos 2–3 variantes reales con ciclos de cambio distintos (ej. motor de descuentos o cálculo de tarifas).',
      'Cada variante requiere pruebas unitarias aisladas con sus propios casos límite.',
    ],
    whenNotToUse: [
      'Hay una única regla estable y solo se especula con un cambio futuro incierto.',
      'La diferencia entre ramas es un mero parámetro de configuración o constante.',
    ],
    operationalCost: 'Bajo en runtime; añade indirección que debe justificarse con variación real.',
    goodExampleTs: `export interface DiscountPolicy {
  calculateDiscount(subtotal_cents: number): number;
}
export class SeasonalDiscountPolicy implements DiscountPolicy {
  calculateDiscount(subtotal_cents: number): number {
    return Math.round(subtotal_cents * 0.15);
  }
}`,
    badExampleTs: `// ❌ Anti-patrón: condicional central acoplado y difícil de aislar en pruebas
export function computeDiscount(kind: string, total: number): number {
  if (kind === 'vip') return total * 0.2;
  if (kind === 'black_friday') return total * 0.3;
  return 0;
}`,
    relatedModules: ['B11', 'I01', 'I04'],
    relatedMissions: ['S02', 'S03'],
  },
  {
    id: 'adapter',
    name: 'Adapter (Traductor de Contratos Externos)',
    category: 'GoF Estructural',
    intent: 'Convertir la interfaz heterogénea de un SDK o proveedor externo al puerto semántico que necesita nuestro dominio.',
    problem: 'Integrar pasarelas de pago o mensajería acoplando sus DTOs, códigos HTTP y excepciones propietarias dentro de los casos de uso.',
    solution: 'Declarar un puerto propio en aplicación/dominio e implementar un adaptador por proveedor que traduzca datos, timeouts y errores.',
    whenToUse: [
      'Se consume un servicio externo, API de terceros o sistema legado cuyo contrato no controlamos.',
      'Queremos sustituir o simular el proveedor en tests de contrato sin tocar casos de uso.',
    ],
    whenNotToUse: [
      'Envolver clases internas propias que ya comparten exactamente el mismo lenguaje ubicuo sin transformación real.',
    ],
    operationalCost: 'Mantenimiento explícito de mapeos y pruebas de contrato por cada versión del tercero.',
    goodExampleTs: `export interface PaymentGatewayPort {
  authorizeCharge(order_id: string, amount_cents: number): Promise<{ approved: boolean }>;
}
export class AcmePayHttpAdapter implements PaymentGatewayPort {
  async authorizeCharge(order_id: string, amount_cents: number) {
    // Traduce payload y errores de AcmePay sin filtrarlos al dominio
    return { approved: amount_cents > 0 && order_id.length > 0 };
  }
}`,
    badExampleTs: `// ❌ Anti-patrón: el caso de uso conoce cabeceras y estados crudos del proveedor externo
export async function checkoutUseCase(acmeSdk: { postRaw: (u: string) => Promise<{ status_txt: string }> }) {
  const res = await acmeSdk.postRaw('/v2/charge_xml');
  return res.status_txt === 'ACME_00_OK';
}`,
    relatedModules: ['I03', 'I07', 'I11'],
    relatedMissions: ['S03', 'S04'],
  },
  {
    id: 'factory-method',
    name: 'Factory / Creación Controlada con Invariantes',
    category: 'GoF Creacional',
    intent: 'Centralizar la construcción válida de objetos complejos o selección de adaptadores garantizando sus invariantes desde el nacimiento.',
    problem: 'Constructores con diez parámetros opcionales permiten instanciar entidades en estados inválidos o dispersan la lógica de ensamblaje.',
    solution: 'Exponer métodos de creación semánticos que validen precondiciones antes de devolver la instancia o puerto.',
    whenToUse: [
      'Construir un agregado exige validar combinaciones de estado iniciales no triviales.',
      'Seleccionar un adaptador concreto depende de configuración validada en el composition root.',
    ],
    whenNotToUse: [
      'Objetos de datos planos o constructores directos sin reglas ni polimorfismo (`AbstractFactoryFactory`).',
    ],
    operationalCost: 'Mínimo si se limita a creación con invariantes reales.',
    goodExampleTs: `export class ReservationSlot {
  private constructor(readonly start_ms: number, readonly end_ms: number) {}
  static createValid(start_ms: number, end_ms: number): ReservationSlot {
    if (end_ms <= start_ms) throw new Error('Intervalo de reserva inválido');
    return new ReservationSlot(start_ms, end_ms);
  }
}`,
    badExampleTs: `// ❌ Anti-patrón: entidad pública mutable que nace sin validar invariantes
export class ReservationSlotBad {
  start_ms = 0;
  end_ms = -100;
}`,
    relatedModules: ['I02', 'I10'],
    relatedMissions: ['S03', 'S06'],
  },
  {
    id: 'decorator',
    name: 'Decorator (Composición Transversal)',
    category: 'GoF Estructural',
    intent: 'Añadir responsabilidades operativas (métricas, caché, timeout, logging redactado) alrededor de un puerto respetando su mismo contrato.',
    problem: 'Mezclar telemetría, reintentos, caché y reglas de negocio dentro de un mismo método rompe SRP y complica las pruebas.',
    solution: 'Envolver la implementación base con un decorador que comparte la interfaz del puerto y delega la operación principal.',
    whenToUse: [
      'Instrumentar latencia, auditoría o caché sobre un repositorio/gateway sin ensuciar el caso de uso.',
    ],
    whenNotToUse: [
      'Cadenas profundas de 6+ decoradores donde el orden de ejecución oculta efectos secundarios o errores.',
    ],
    operationalCost: 'Exige cuidar orden de envoltura (ej. timeout por dentro o por fuera del retry) y trazabilidad.',
    goodExampleTs: `export class TimedOrderReader implements OrderReaderPort {
  constructor(private readonly inner: OrderReaderPort) {}
  async findById(order_id: string) {
    const started_at = performance.now();
    try { return await this.inner.findById(order_id); }
    finally { void (performance.now() - started_at); }
  }
}`,
    badExampleTs: `// ❌ Anti-patrón: herencia explosiva (CachedLoggedRetryingSqlOrderReader)
export class CachedLoggedSqlReader /* extends LoggedSqlReader */ {}`,
    relatedModules: ['I03', 'A07', 'A09'],
    relatedMissions: ['S13', 'S14'],
  },
  {
    id: 'observer',
    name: 'Observer / Eventos de Dominio Desacoplados',
    category: 'GoF Comportamiento',
    intent: 'Notificar hechos relevantes ocurridos en un módulo a consumidores interesados sin acoplar el emisor a cada efecto secundario.',
    problem: 'Confirmar un pedido llama directamente a correo, puntos de fidelidad, analítica y facturación en una sola transacción frágil.',
    solution: 'Emitir un evento inmutable en pasado (`OrderConfirmed`) después de asegurar la persistencia principal.',
    whenToUse: [
      'Múltiples capacidades secundarias reaccionan a un hecho de negocio con distintos acuerdos de nivel de servicio.',
    ],
    whenNotToUse: [
      'Ocultar un flujo secuencial obligatorio donde el emisor necesita respuesta síncrona inmediata para decidir.',
    ],
    operationalCost: 'Requiere trazabilidad por `correlation_id`, idempotencia en suscriptores y outbox si cruza procesos.',
    goodExampleTs: `export type OrderConfirmedEvent = {
  readonly event_id: string;
  readonly order_id: string;
  readonly occurred_at: string;
};`,
    badExampleTs: `// ❌ Anti-patrón: publicar evento externo antes de confirmar el commit de base de datos
export async function confirmOrderUnsafe(publish: () => Promise<void>, commitDb: () => Promise<void>) {
  await publish(); // Si commitDb falla, los consumidores procesan un pedido fantasma
  await commitDb();
}`,
    relatedModules: ['I04', 'I10', 'A04'],
    relatedMissions: ['S05', 'S09'],
  },
  {
    id: 'command',
    name: 'Command / Caso de Uso Explícito',
    category: 'GoF Comportamiento',
    intent: 'Representar una intención de escritura del usuario o sistema como un objeto/acción explícita con validación, auditoría e idempotencia.',
    problem: 'Controladores genéricos `update(id, payload)` ocultan qué regla de negocio ocurre realmente (cancelar, aprobar, reprogramar).',
    solution: 'Modelar comandos con verbos del dominio (`cancelOrder`, `approvePolicy`) separados del transporte HTTP.',
    whenToUse: [
      'Operaciones que mutan estado, exigen autorización específica y deben poder auditarse o encolarse.',
    ],
    whenNotToUse: [
      'Crear un bus reflexivo de comandos con 4 capas de indirección para lecturas o altas CRUD sin invariantes.',
    ],
    operationalCost: 'Bajo cuando se expresa como servicio de aplicación directo; alto si se abusa de mediadores dinámicos.',
    goodExampleTs: `export type CancelOrderCommand = {
  readonly order_id: string;
  readonly reason: string;
  readonly idempotency_key: string;
};`,
    badExampleTs: `// ❌ Anti-patrón: parche genérico que permite saltar estados ilegales
export type GenericPatchDto = { status?: string; approved_by?: string; total?: number };`,
    relatedModules: ['I04', 'I06', 'A04'],
    relatedMissions: ['S04', 'S06'],
  },
  {
    id: 'ports-and-adapters',
    name: 'Arquitectura Hexagonal (Puertos y Adaptadores)',
    category: 'Arquitectónico',
    intent: 'Dirigir todas las dependencias de código hacia la aplicación y el dominio para que HTTP, colas, SQL o SDKs sean detalles intercambiables.',
    problem: 'Las reglas críticas importan decoradores web y modelos ORM, impidiendo probar invariantes sin levantar infraestructura pesada.',
    solution: 'Definir casos de uso como puertos de entrada, interfaces de salida para I/O y adaptadores concretos en infraestructura.',
    whenToUse: [
      'Dominios con reglas valiosas de larga vida, múltiples entradas (HTTP, worker, CLI) o necesidad alta de tests rápidos.',
    ],
    whenNotToUse: [
      'Scripts efímeros o prototipos desechables sin lógica de negocio propia.',
    ],
    operationalCost: 'Requiere disciplina en imports (verificable con test estático) y mapeo explícito en fronteras.',
    goodExampleTs: `// Dominio/Aplicación no importa Express, NestJS ni ORM
export class ApproveOrderService {
  constructor(private readonly orderRepository: OrderRepositoryPort) {}
}`,
    badExampleTs: `// ❌ Anti-patrón: entidad de dominio ejecutando SQL o lanzando excepciones HTTP
export class OrderEntityBad {
  cancel() { throw new Error('HTTP 403 Forbidden from SQL trigger'); }
}`,
    relatedModules: ['I06', 'I07'],
    relatedMissions: ['S01', 'S04'],
  },
  {
    id: 'repository',
    name: 'Repository Port (Por Raíz de Agregado)',
    category: 'Arquitectónico',
    intent: 'Ofrecer a los casos de uso una colección semántica para recuperar y persistir raíces de agregado completas protegiendo su consistencia.',
    problem: 'Consultas SQL dispersas actualizan tablas hijas directamente dejando al agregado en un estado contable inconsistente.',
    solution: 'Un puerto de repositorio por raíz de agregado para escrituras con invariantes, y consultas proyectadas ligeras para listados.',
    whenToUse: [
      'Agregados con invariantes transaccionales que deben cargarse y guardarse de forma atómica (`findByIdForUpdate`, `save`).',
    ],
    whenNotToUse: [
      'Crear un repositorio genérico por cada tabla intermedia o reconstruir agregados pesados solo para pintar una tabla paginada.',
    ],
    operationalCost: 'Moderado; exige diferenciar claramente modelo de escritura y proyecciones de lectura.',
    goodExampleTs: `export interface OrderRepositoryPort {
  findByIdForUpdate(order_id: string): Promise<OrderAggregate | null>;
  save(order: OrderAggregate): Promise<void>;
}`,
    badExampleTs: `// ❌ Anti-patrón: un repositorio por tabla hija rompiendo la raíz del agregado
export interface OrderLineItemTableRepo { updateQuantityRaw(line_id: string, qty: number): Promise<void>; }`,
    relatedModules: ['I05', 'I10'],
    relatedMissions: ['S04', 'S06'],
  },
  {
    id: 'transactional-outbox',
    name: 'Transactional Outbox + Consumidor Idempotente',
    category: 'Sistemas Distribuidos',
    intent: 'Garantizar que un cambio de estado en base de datos y la publicación de su evento de integración ocurran ambos o ninguno, sin 2PC.',
    problem: 'Si el proceso cae justo después del `COMMIT` SQL pero antes de publicar en la cola, el resto de servicios jamás se entera del pedido.',
    solution: 'Insertar el evento en una tabla `outbox` en la misma transacción SQL local y despacharlo asíncronamente hacia consumidores idempotentes.',
    whenToUse: [
      'Pagos, reservas de stock, facturación o cualquier integración asíncrona donde perder o duplicar efectos es inaceptable.',
    ],
    whenNotToUse: [
      'Telemetría no crítica o arquitecturas monolíticas sin consumidores asíncronos reales.',
    ],
    operationalCost: 'Requiere worker de relevo, tabla de deduplicación por `(consumer_id, event_id)`, métricas de lag y limpieza.',
    goodExampleTs: `// En una única transacción SQL local:
// 1) UPDATE orders SET status = 'paid' ...
// 2) INSERT INTO outbox_events (event_id, payload) VALUES (...)`,
    badExampleTs: `// ❌ Anti-patrón: doble escritura sin atomicidad entre SQL y broker
export async function payOrderDualWrite(saveDb: () => Promise<void>, sendBroker: () => Promise<void>) {
  await saveDb();
  await sendBroker(); // Si falla la red aquí, queda inconsistencia silenciosa
}`,
    relatedModules: ['A03', 'A04', 'A05'],
    relatedMissions: ['S09', 'S10'],
  },
  {
    id: 'saga',
    name: 'Saga (Transacciones Locales + Compensación)',
    category: 'Sistemas Distribuidos',
    intent: 'Coordinar un proceso de negocio que abarca varios servicios mediante pasos locales confirmados y acciones compensatorias explícitas si un paso posterior falla.',
    problem: 'Un bloqueo distribuido 2PC entre Pedidos, Pagos e Inventario degrada disponibilidad, acopla despliegues y multiplica latencia.',
    solution: 'Ejecutar reservas/cargos locales con estados intermedios (`PENDING_PAYMENT`) y compensar semánticamente (`releaseStock`, `refundCharge`) ante rechazo.',
    whenToUse: [
      'Flujos multi-servicio de negocio donde no existe una base de datos compartida y los fallos parciales deben revertirse de forma auditable.',
    ],
    whenNotToUse: [
      'Cuando todos los datos pertenecen al mismo dominio y caben en una transacción ACID local dentro de un monolito modular.',
    ],
    operationalCost: 'Alto: estados intermedios visibles en UX, manejo de compensaciones fallidas, DLQ y observabilidad extremo a extremo.',
    goodExampleTs: `export type OrderSagaStep =
  | 'STOCK_RESERVED'
  | 'PAYMENT_AUTHORIZED'
  | 'COMPENSATING_STOCK_RELEASE';`,
    badExampleTs: `// ❌ Anti-patrón: asumir que tres llamadas HTTP seguidas forman una transacción atómica
export async function naiveCheckout(reserve: () => Promise<void>, charge: () => Promise<void>) {
  await reserve();
  await charge(); // Si falla charge(), el stock queda bloqueado para siempre
}`,
    relatedModules: ['A04', 'A05'],
    relatedMissions: ['S08', 'S09'],
  },
  {
    id: 'circuit-breaker',
    name: 'Circuit Breaker + Timeout + Backoff con Jitter',
    category: 'Sistemas Distribuidos',
    intent: 'Cortar rápidamente llamadas hacia una dependencia degradada y controlar los reintentos para impedir tormentas de fallos en cascada.',
    problem: 'Un proveedor lento agota todos los hilos/conexiones propios y los reintentos inmediatos sincronizados multiplican por diez la caída.',
    solution: 'Combinar timeout finito estricto, presupuesto acotado de reintentos con backoff exponencial + jitter aleatorio y disyuntor con estado `HALF_OPEN`.',
    whenToUse: [
      'Toda llamada de red hacia terceros u otros servicios en rutas críticas de usuario.',
    ],
    whenNotToUse: [
      'Activar reintentos automáticos sobre operaciones POST no idempotentes o poner un circuit breaker sin haber fijado antes un timeout.',
    ],
    operationalCost: 'Exige calibrar umbrales, definir respuesta degradada (fallback honesto) y monitorear aperturas del circuito.',
    goodExampleTs: `export function retryDelayWithJitterMs(attempt: number, base_ms = 100): number {
  const exp = Math.min(2_000, base_ms * 2 ** attempt);
  return Math.round(exp * (0.5 + Math.random() * 0.5));
}`,
    badExampleTs: `// ❌ Anti-patrón: bucle infinito de reintentos inmediatos sin timeout
export async function callWithInfiniteRetry(fn: () => Promise<unknown>): Promise<unknown> {
  while (true) { try { return await fn(); } catch { /* retry storm */ } }
}`,
    relatedModules: ['A07', 'A09'],
    relatedMissions: ['S13', 'S14'],
  },
  {
    id: 'strangler-fig',
    name: 'Strangler Fig + Migración Expand / Contract',
    category: 'Arquitectónico',
    intent: 'Reemplazar gradualmente capacidades de un sistema legado en producción redirigiendo rutas/flujos por etapas reversibles sin downtime.',
    problem: 'Una reescritura total ("big bang") congela el producto durante meses y concentra un riesgo catastrófico el día del corte.',
    solution: 'Interponer una fachada/enrutador, migrar una capacidad acotada, ampliar esquema de BD compatiblemente (`expand`), verificar en paralelo y retirar lo antiguo al final (`contract`).',
    whenToUse: [
      'Modernización de monolitos críticos o cambios incompatibles de esquema SQL/contratos API con tráfico activo.',
    ],
    whenNotToUse: [
      'Sistemas internos diminutos con ventana de mantenimiento acordada donde una migración directa en minutos es segura y verificable.',
    ],
    operationalCost: 'Convivencia temporal de dos rutas/esquemas, reconciliación de datos y feature flags con fecha de retiro.',
    goodExampleTs: `// Fase Expand: la tabla/API soporta campo nuevo y antiguo simultáneamente
export type CustomerPayloadCompat = { full_name: string; legacy_name?: string };`,
    badExampleTs: `// ❌ Anti-patrón: DROP COLUMN o renombre destructivo mientras instancias v1 siguen activas
// ALTER TABLE orders DROP COLUMN customer_name;`,
    relatedModules: ['I11', 'A10', 'A11'],
    relatedMissions: ['S01', 'S15', 'S16'],
  },
]);

/** Exact 8 mandatory comparative sheets from Master Spec §17.4 */
export const MANDATORY_COMPARISONS: readonly ComparativeSheet[] = Object.freeze([
  {
    id: 'capas-clean-hexagonal',
    title: 'Capas vs Clean vs Hexagonal',
    question: '¿Qué regla de dependencias y adaptabilidad necesitamos?',
    chooseFirstWhen: 'Capas clásicas bastan en aplicaciones internas estables con un único motor de datos e invariantes sencillas.',
    chooseSecondWhen: 'Clean / Hexagonal compensan cuando las reglas de negocio son críticas, cambian los adaptadores externos o exigimos tests de dominio ultrarrápidos sin I/O.',
    commonTrap: 'Crear seis carpetas vacías y tres mappers idénticos por cada tabla CRUD pero seguir filtrando modelos ORM al controlador.',
    verificationSignal: 'Comprobar mediante análisis estático que el dominio tiene cero imports de HTTP, framework u ORM.',
  },
  {
    id: 'monolito-vs-microservicios',
    title: 'Monolito modular vs microservicios',
    question: '¿Qué dolor real justifica separación y costo operativo?',
    chooseFirstWhen: 'Monolito modular es el punto de partida recomendado cuando el equipo es pequeño/mediano, el dominio aún evoluciona o se requiere atomicidad ACID simple.',
    chooseSecondWhen: 'Microservicios se justifican cuando múltiples equipos autónomos necesitan ciclos de despliegue, escalado o aislamiento de fallos radicalmente independientes.',
    commonTrap: 'Extraer microservicios compartiendo la misma base de datos o encadenando 5 llamadas HTTP síncronas (monolito distribuido).',
    verificationSignal: 'Capacidad real de desplegar y degradar un servicio sin coordinar releases ni tumbar a los demás.',
  },
  {
    id: 'rest-grpc-eventos',
    title: 'REST vs gRPC vs eventos',
    question: '¿Qué latencia, compatibilidad, acoplamiento y fiabilidad importan?',
    chooseFirstWhen: 'REST/JSON para APIs públicas, navegadores y partners diversos; gRPC/Protobuf para comunicación interna tipada de baja latencia entre servicios controlados.',
    chooseSecondWhen: 'Eventos asíncronos cuando el emisor no debe bloquearse esperando a múltiples consumidores o cuando las disponibilidades temporales difieren.',
    commonTrap: 'Usar colas asíncronas para simular RPC síncrono sin correlación o exponer contratos binarios acoplados directamente a terceros sin pasarela.',
    verificationSignal: 'Latencia p95 bajo carga, pruebas de evolución compatible de esquemas y comportamiento ante caída del receptor.',
  },
  {
    id: 'repository-vs-acceso-directo',
    title: 'Repository vs acceso directo',
    question: '¿Aporta aislamiento útil o es abstracción innecesaria?',
    chooseFirstWhen: 'Repository Port aporta valor en comandos de escritura sobre agregados con invariantes que queremos probar en aislamiento y proteger de detalles SQL.',
    chooseSecondWhen: 'Acceso directo proyectado (query service / read model) es superior para listados, reportes y búsquedas filtradas sin mutación de negocio.',
    commonTrap: 'Construir un `GenericRepository<T>` que imita el ORM a medias u obliga a hidratar 50 entidades solo para contar filas.',
    verificationSignal: 'Los tests del caso de uso corren en milisegundos con un puerto falso y el adaptador SQL pasa su propio test de integración.',
  },
  {
    id: 'cqrs-vs-crud',
    title: 'CQRS vs CRUD convencional',
    question: '¿Existe presión real de modelos de lectura/escritura?',
    chooseFirstWhen: 'CQRS (incluso sobre la misma BD PostgreSQL) brilla cuando las escrituras validan reglas estrictas y las lecturas exigen proyecciones o cachés muy distintas.',
    chooseSecondWhen: 'CRUD convencional con servicios semánticos es más claro, barato y consistente cuando la forma de leer y editar apenas diverge.',
    commonTrap: 'Asumir que CQRS obliga a meter Event Sourcing, dos bases de datos y consistencia eventual en un módulo administrativo simple.',
    verificationSignal: 'Reducción medible de contención/latencia de lectura y manejo explícito del lag cuando la proyección es asíncrona.',
  },
  {
    id: 'saga-vs-transaccion-local',
    title: 'Saga vs transacción local',
    question: '¿Cuál es el límite de consistencia y compensación?',
    chooseFirstWhen: 'Transacción ACID local siempre que las invariantes pertenezcan a un único servicio y motor transaccional.',
    chooseSecondWhen: 'Saga (con Outbox + idempotencia) únicamente cuando el proceso cruza fronteras de servicios/proveedores externos autónomos.',
    commonTrap: 'Partir una operación contable crítica en dos servicios sin diseñar las acciones de compensación, estados pendientes ni reconciliación.',
    verificationSignal: 'Inyección de fallos a mitad del flujo comprobando que ninguna orden queda cobrada sin entrega ni con stock retenido eternamente.',
  },
  {
    id: 'cache-vs-db-indexada',
    title: 'Caché vs DB indexada',
    question: '¿Qué problema real, invalidación y coherencia hay?',
    chooseFirstWhen: 'Optimizar primero consultas e índices SQL compuestos (`EXPLAIN ANALYZE`) resuelve la mayoría de cuellos sin introducir datos obsoletos.',
    chooseSecondWhen: 'Caché (Valkey/Redis/CDN) cuando lecturas repetitivas intensivas o cálculos costosos superan la capacidad económica/física del motor primario.',
    commonTrap: 'Ocultar un N+1 detrás de Redis sin TTL, sin clave por tenant/permiso o invalidando antes del commit transaccional.',
    verificationSignal: 'Hit ratio real, protección frente a stampede, aislamiento por tenant y prueba de invalidación post-commit.',
  },
  {
    id: 'ddd-tactico-vs-crud',
    title: 'DDD táctico vs CRUD simple',
    question: '¿El dominio tiene invariantes complejas que lo justifiquen?',
    chooseFirstWhen: 'Agregados, Value Objects y eventos de dominio cuando hay reglas de negocio ricas, estados prohibidos, dinero, pólizas o contención concurrente.',
    chooseSecondWhen: 'Catálogos maestros, configuraciones o formularios de captura directa sin transiciones complejas.',
    commonTrap: 'Aplicar ceremonia táctica idéntica a todas las tablas del sistema y descuidar el DDD estratégico (límites de contexto y lenguaje ubicuo).',
    verificationSignal: 'Existencia de pruebas unitarias de transiciones prohibidas que fallarían si la lógica viviera dispersa.',
  },
]);

export const ADR_TEMPLATES_LIBRARY: readonly AdrTemplateEntry[] = Object.freeze([
  {
    id: 'vigilio-canonical',
    title: 'Plantilla Canónica Vigilio / ARQPIXEL',
    summary: 'Equilibra contexto cuantitativo, decisión concreta, consecuencias operativas, alternativas descartadas y responsables.',
    markdownTemplate: `# ADR-XXXX: [Título corto de la decisión arquitectónica]

## Estado
Propuesto | Aprobado | Reemplazado por ADR-YYYY

## Contexto
- Problema de negocio y técnico:
- Restricciones medibles (tráfico, latencia p95, SLO, presupuesto, equipo):
- Fuerzas en tensión:

## Decisión
Elegimos **[opción seleccionada]** aplicando **[límites / puertos / protocolos concretos]**.

## Consecuencias
- **Positivas:** ...
- **Costes y riesgos aceptados:** ...
- **Cómo lo verificaremos (métricas / tests / rollback):** ...

## Alternativas consideradas
- **Opción A (Elegida):** ...
- **Opción B (Descartada):** motivo técnico/operativo por el que no encaja hoy.
- **Opción C (No hacer nada):** impacto de mantener el estado actual.

## Fecha y Owners
- Fecha: YYYY-MM-DD
- Equipo / Responsables:`,
  },
  {
    id: 'nygard-classic',
    title: 'Plantilla Breve de Michael Nygard',
    summary: 'Ideal para decisiones rápidas de equipo con foco directo en contexto, decisión y consecuencias.',
    markdownTemplate: `# ADR-XXXX: [Decisión]

## Estado
Propuesto

## Contexto
¿Qué fuerzas técnicas, organizativas y de negocio nos obligan a decidir ahora?

## Decisión
¿Qué cambio concreto adoptamos y quién es responsable de sostenerlo?

## Consecuencias
¿Qué se vuelve más fácil, qué se vuelve más difícil y qué deuda asumimos?`,
  },
  {
    id: 'madr-tradeoffs',
    title: 'Plantilla MADR con Drivers y Matriz de Opciones',
    summary: 'Recomendada para comités de arquitectura o misiones Senior (S08, S15, S18) con múltiples criterios contrapuestos.',
    markdownTemplate: `# ADR-XXXX: [Decisión evaluada]

## Drivers de Decisión
1. SLO y disponibilidad requerida:
2. Capacidad cognitiva y tamaño del equipo:
3. Techo de coste cloud / tiempo de entrega:

## Opciones Evaluadas
1. **Opción 1:** Pros / Contras / Riesgo de bloqueo
2. **Opción 2:** Pros / Contras / Riesgo de bloqueo

## Decisión y Plan de Validación
- Opción elegida y umbral numérico que dispararía reevaluar esta decisión en el futuro.`,
  },
]);

export const EXPANDED_GLOSSARY_TERMS: ReadonlyArray<readonly [string, string]> = Object.freeze([
  ['ADR', 'Registro de decisión arquitectónica: contexto, alternativas, elección, consecuencias y criterios de verificación.'],
  ['C4', 'Modelo de vistas jerárquicas (Contexto, Contenedores, Componentes y Código) para comunicar arquitectura según audiencia.'],
  ['Bounded Context', 'Frontera explícita donde un modelo de dominio y su lenguaje ubicuo mantienen significado unívoco y propietario claro.'],
  ['Trade-off', 'Compromiso consciente donde se gana un atributo de calidad aceptando un coste o restricción en otro.'],
  ['Idempotencia', 'Propiedad por la cual repetir una misma operación produce el mismo estado final sin duplicar efectos colaterales.'],
  ['SLO', 'Objetivo cuantitativo de nivel de servicio medido por indicadores SLI (disponibilidad, latencia p95, tasa de éxito).'],
  ['Error Budget', 'Margen permitido de fallos (100 % − SLO) que guía si priorizar velocidad de lanzamientos o estabilidad operativa.'],
  ['Transactional Outbox', 'Tabla persistida en la misma transacción local del negocio para publicar eventos sin perder mensajes ante caídas.'],
  ['Saga', 'Secuencia de transacciones locales coordinadas con acciones compensatorias explícitas para deshacer efectos ante fallos.'],
  ['CQRS', 'Separación conceptual entre operaciones que mutan estado (comandos) y proyecciones optimizadas de consulta (queries).'],
  ['Anti-Corruption Layer (ACL)', 'Capa traductora que impide que conceptos y deudas de un sistema externo contaminen nuestro modelo de dominio.'],
  ['Circuit Breaker', 'Mecanismo que abre el paso hacia una dependencia fallida para fallar rápido y evitar agotamiento en cascada.'],
  ['Backoff con Jitter', 'Espera exponencial con variación aleatoria entre reintentos para desincronizar clientes y evitar tormentas de carga.'],
  ['Expand / Contract', 'Migración evolutiva en fases compatibles (ampliar esquema, migrar lectores/escritores y finalmente retirar lo obsoleto).'],
  ['Consumer-Driven Contract', 'Prueba automatizada donde los consumidores fijan las expectativas mínimas que el proveedor HTTP/eventos no debe romper.'],
  ['STRIDE', 'Clasificación de amenazas: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service y Elevation of Privilege.'],
]);
