import {
  type LessonEnrichmentItemSchema,
  lessonEnrichmentsCatalogSchema,
} from '../schemas/lesson-enrichment.schema.js';

const RAW_LESSON_ENRICHMENTS: readonly LessonEnrichmentItemSchema[] = [
  {
    moduleId: 'B01',
    diagramTitle: 'Fronteras arquitectónicas frente a detalles locales',
    nodes: [
      { id: 'web', label: 'Web NexoShop', role: 'Presentación' },
      { id: 'orders', label: 'Módulo Pedidos', role: 'Reglas de Negocio' },
      { id: 'psp', label: 'Puerto Pagos', role: 'Frontera Externa' },
    ],
    edges: [
      { from: 'web', to: 'orders', label: 'Comando tipado' },
      { from: 'orders', to: 'psp', label: 'Contrato estable' },
    ],
    goodTitle: 'Decisión estructural explícita con contrato',
    goodCodeTs: `// Protege la evolución: cambiar de pasarela no exige tocar órdenes.
export interface PaymentGatewayPort {
  authorizeCharge(order_id: string, total_decimal: string): Promise<{ approved: boolean }>;
}`,
    badTitle: 'Acoplar UI, negocio y proveedor en una sola función',
    badCodeTs: `// Fuga estructural: un cambio del SDK externo rompe el checkout web.
export async function clickBuyButton(dom_input: string) {
  return fetch('https://vendor-v1.local/pay?raw=' + dom_input);
}`,
    counterexample:
      'Tratar el color de un botón o el orden de imports locales como «decisión de arquitectura» paraliza al equipo en debates irrelevantes sin reducir riesgo estructural.',
    labId: 'adr',
    practicalExercise:
      'Abre Architecture Decision Studio y redacta un ADR diferenciando una decisión estructural costosa de revertir (frontera Pagos/Pedidos) de una preferencia estética.',
  },
  {
    moduleId: 'B02',
    diagramTitle: 'Traducción de deseo ambiguo a escenario de calidad (SLO)',
    nodes: [
      { id: 'stimulus', label: 'Pico 800 req/s', role: 'Estímulo' },
      { id: 'checkout', label: 'API Checkout', role: 'Artefacto' },
      { id: 'measure', label: 'p95 < 350 ms', role: 'Medida Verificable' },
    ],
    edges: [
      { from: 'stimulus', to: 'checkout', label: 'Carga concurrente' },
      { from: 'checkout', to: 'measure', label: 'Histograma SLI' },
    ],
    goodTitle: 'Escenario cuantitativo y refutable en pruebas',
    goodCodeTs: `// Umbral auditable en CI y producción; define percentil y condición de carga.
export const CHECKOUT_LATENCY_SLO = {
  percentile: 'p95',
  max_duration_ms: 350,
  concurrent_users: 500,
} as const;`,
    badTitle: 'Requisito subjetivo imposible de verificar',
    badCodeTs: `// "¿Qué es rápido?" — Sin percentil ni carga no existe criterio de aceptación.
export const REQUIREMENT = 'El sistema debe responder rápido siempre';`,
    counterexample:
      'Exigir 99,999 % de disponibilidad para un panel interno administrativo usado dos veces por semana multiplica el coste cloud por 10× sin valor de negocio.',
    labId: 'incident',
    practicalExercise:
      'Calcula en Incident & Reliability Lab el presupuesto mensual en minutos de un SLO de 99,9 % frente a 99,5 % y observa cuándo dispara alerta de Burn Rate.',
  },
  {
    moduleId: 'B03',
    diagramTitle: 'Alta cohesión por motivo de cambio y bajo acoplamiento',
    nodes: [
      { id: 'catalog', label: 'Catálogo', role: 'Búsqueda y precios' },
      { id: 'sales', label: 'Pedidos', role: 'Cierre de compra' },
      { id: 'billing', label: 'Facturación', role: 'Tributos y emisión' },
    ],
    edges: [
      { from: 'catalog', to: 'sales', label: 'SKU + precio vigente' },
      { from: 'sales', to: 'billing', label: 'Orden confirmada' },
    ],
    goodTitle: 'Módulos cohesivos comunicados por datos mínimos',
    goodCodeTs: `// Facturación solo recibe los datos fiscales cerrados, no todo el carrito UI.
export type InvoiceRequest = {
  readonly order_id: string;
  readonly tax_id: string;
  readonly total_amount: string;
};`,
    badTitle: 'Clase «Dios» que mezcla SQL, plantillas HTML y tributos',
    badCodeTs: `// Tres motivos de cambio distintos chocan en el mismo archivo.
export class EcommerceGodManager {
  renderHtmlAndSaveSqlAndSendTaxPdf(payload: Record<string, unknown>) { return payload; }
}`,
    counterexample:
      'Partir un módulo cohesivo en 15 micro-carpetas de una línea obliga a saltar por 15 archivos para entender una sola regla («perdigonada de cambios»).',
    labId: 'dependencias',
    practicalExercise:
      'Construye en Dependency Graph Builder las relaciones entre capas verificando que no aparezcan dependencias circulares.',
  },
  {
    moduleId: 'B04',
    diagramTitle: 'Jerarquía de zoom C4: Contexto (C1) → Contenedores (C2)',
    nodes: [
      { id: 'buyer', label: 'Comprador', role: 'C1 Persona' },
      { id: 'spa', label: 'SPA Web', role: 'C2 Frontend' },
      { id: 'api', label: 'API Pedidos', role: 'C2 Backend' },
      { id: 'db', label: 'PostgreSQL', role: 'C2 Datos' },
    ],
    edges: [
      { from: 'buyer', to: 'spa', label: 'Navega HTTPS' },
      { from: 'spa', to: 'api', label: 'JSON REST' },
      { from: 'api', to: 'db', label: 'SQL Transaccional' },
    ],
    goodTitle: 'Un nivel de abstracción coherente por diagrama',
    goodCodeTs: `// C2 describe unidades desplegables y el protocolo real entre ellas.
export const C2_EDGE = {
  from: 'web-nexoshop',
  to: 'orders-api',
  contract: 'POST /v1/orders (HTTPS JSON + Idempotency-Key)',
} as const;`,
    badTitle: 'Mezclar actores externos con índices B-Tree y clases privadas',
    badCodeTs: `// Diagrama ilegible: junta un actor C1 con un método privado C4 y una flecha "usa".
export const CONFUSING_EDGE = { from: 'ClienteHumano', to: 'idx_orders_btree', label: 'usa' };`,
    counterexample:
      'Mantener diagramas C4 de nivel Código (C4) hechos a mano se vuelve obsoleto en el siguiente commit; ese detalle ya lo expresa el propio código fuente.',
    labId: 'c4',
    practicalExercise:
      'En C4 Studio alterna entre C1, C2 y C3, añade una arista ambigua «usa» y corrígela tras observar la alerta semántica.',
  },
  {
    moduleId: 'B05',
    diagramTitle: 'Anatomía cliente-servidor con validación en frontera',
    nodes: [
      { id: 'browser', label: 'Navegador', role: 'Entorno no confiable' },
      { id: 'edge', label: 'TLS / API HTTP', role: 'Borde de validación' },
      { id: 'store', label: 'Persistencia', role: 'Estado autoritativo' },
    ],
    edges: [
      { from: 'browser', to: 'edge', label: 'HTTPS + credenciales' },
      { from: 'edge', to: 'store', label: 'Consulta parametrizada' },
    ],
    goodTitle: 'El servidor recalcula precios y autoriza cada petición',
    goodCodeTs: `// El cliente envía solo SKU y cantidad; el precio autoritativo vive en servidor.
export function calculateAuthoritativeTotal(unit_price_cents: number, qty: number): number {
  if (!Number.isInteger(qty) || qty < 1 || qty > 50) throw new Error('Cantidad inválida');
  return unit_price_cents * qty;
}`,
    badTitle: 'Confiar en el importe total enviado desde el navegador',
    badCodeTs: `// Vulnerabilidad grave: un usuario modifica req.body.total = 1 desde DevTools.
export function trustClientTotal(client_body: { total: number }): number {
  return client_body.total;
}`,
    counterexample:
      'Repetir 6 llamadas HTTP en cascada desde el navegador para armar una sola vista móvil en red 3G dispara la latencia por round-trips acumulados.',
    labId: 'api',
    practicalExercise:
      'En API Contract Lab audita qué ocurre cuando un cliente móvil reintenta un POST tras un corte de red o envía campos manipulados.',
  },
  {
    moduleId: 'B06',
    diagramTitle: 'Arquitectura en capas con dominio libre de infraestructura',
    nodes: [
      { id: 'pres', label: 'Presentación', role: 'Controladores HTTP' },
      { id: 'app', label: 'Aplicación', role: 'Orquestación Caso Uso' },
      { id: 'dom', label: 'Dominio', role: 'Reglas e Invariantes' },
      { id: 'infra', label: 'Infraestructura', role: 'SQL / Adaptadores' },
    ],
    edges: [
      { from: 'pres', to: 'app', label: 'DTO validado' },
      { from: 'app', to: 'dom', label: 'Ejecuta regla' },
      { from: 'infra', to: 'dom', label: 'Implementa puerto' },
    ],
    goodTitle: 'El dominio expresa invariantes sin conocer SQL ni HTTP',
    goodCodeTs: `export function assertCancelableOrder(status: 'PENDING' | 'SHIPPED'): void {
  // Invariante pura: un pedido ya despachado exige flujo de devolución, no cancelación.
  if (status === 'SHIPPED') throw new Error('No se puede cancelar tras despacho');
}`,
    badTitle: 'Capas pasamanos donde el controlador ejecuta reglas SQL',
    badCodeTs: `// El controlador decide reglas de negocio acoplado a sintaxis de tabla.
export const sqlInController = "UPDATE orders SET status='CANCELED' WHERE shipped_at IS NULL";`,
    counterexample:
      'En un micro-script interno de solo lectura de 80 líneas, crear cuatro capas con interfaces vacías añade burocracia sin proteger ninguna invariante.',
    labId: 'dependencias',
    practicalExercise:
      'Compara en Dependency Graph Builder el preset «Capas clásicas» frente a «Clean Architecture» revisando la métrica Ce del Dominio.',
  },
  {
    moduleId: 'B07',
    diagramTitle: 'Separación MVC sin controladores obesos (Fat Controllers)',
    nodes: [
      { id: 'view', label: 'Vista / UI', role: 'Render declarativo' },
      { id: 'ctrl', label: 'Controlador', role: 'Traducción HTTP' },
      { id: 'model', label: 'Modelo Dominio', role: 'Estado y reglas' },
    ],
    edges: [
      { from: 'view', to: 'ctrl', label: 'Acción de usuario' },
      { from: 'ctrl', to: 'model', label: 'Delega comando' },
    ],
    goodTitle: 'Controlador delgado que traduce entrada y delega',
    goodCodeTs: `export async function cancelBookingController(booking_id: string, svc: { cancel(id: string): Promise<void> }) {
  await svc.cancel(booking_id);
  return { status: 200, message: 'Reserva cancelada' };
}`,
    badTitle: 'Reglas de penalización horaria incrustadas en la vista/controlador',
    badCodeTs: `// Imposible reutilizar la regla desde un job programado o CLI administrativo.
export function buttonTemplate(hours_left: number): string {
  return hours_left < 24 ? 'Penalidad S/50 calculada en HTML' : 'Gratis';
}`,
    counterexample:
      'Mover el 100 % del código del controlador a un único `BookingHelper` estático de 3.000 líneas solo traslada el desorden de lugar.',
    labId: 'dependencias',
    practicalExercise:
      'Añade una dependencia inválida Presentación ← Dominio en Dependency Graph Builder y verifica por qué rompe la reutilización.',
  },
  {
    moduleId: 'B08',
    diagramTitle: 'Composición de comportamientos frente a herencia rígida',
    nodes: [
      { id: 'checkout', label: 'CheckoutService', role: 'Orquestador' },
      { id: 'pricing', label: 'PricingPolicy', role: 'Contrato compuesto' },
      { id: 'shipping', label: 'ShippingEstimator', role: 'Contrato compuesto' },
    ],
    edges: [
      { from: 'checkout', to: 'pricing', label: 'Delega cálculo' },
      { from: 'checkout', to: 'shipping', label: 'Delega tarifa' },
    ],
    goodTitle: 'Composición explícita de políticas pequeñas',
    goodCodeTs: `export type ShippingRule = (weight_grams: number) => number;
export function totalWithShipping(subtotal_cents: number, weight_grams: number, rule: ShippingRule): number {
  return subtotal_cents + rule(weight_grams);
}`,
    badTitle: 'Árbol de herencia explosivo por combinación de rasgos',
    badCodeTs: `// Cada nueva combinación (VIP + Express + Internacional) duplica subclases.
export class VipExpressInternationalHolidayOrder extends Object {}`,
    counterexample:
      'Encapsular campos primitivos con getters/setters vacíos que permiten dejar la entidad en estado inconsistente no es orientación a objetos: es un registro anémico.',
    labId: 'patterns',
    practicalExercise:
      'Evalúa en Pattern & Refactoring Clinic cuándo sustituir condicionales o herencia rígida por composición con Strategy.',
  },
  {
    moduleId: 'B09',
    diagramTitle: 'Métricas de estabilidad modular: Aferente (Ca) vs Eferente (Ce)',
    nodes: [
      { id: 'edge-mod', label: 'Checkout HTTP', role: 'Inestable (I ≈ 1)' },
      { id: 'app-mod', label: 'Casos Pedido', role: 'Intermedio' },
      { id: 'core-mod', label: 'Núcleo Moneda', role: 'Estable (I = 0)' },
    ],
    edges: [
      { from: 'edge-mod', to: 'app-mod', label: 'Depende hacia adentro' },
      { from: 'app-mod', to: 'core-mod', label: 'Usa Value Object' },
    ],
    goodTitle: 'Los módulos difíciles de cambiar no dependen de módulos volátiles',
    goodCodeTs: `// Núcleo estable (Ce = 0): cero imports externos; seguro para múltiples consumidores.
export function addExactCents(a_cents: number, b_cents: number): number {
  if (!Number.isSafeInteger(a_cents) || !Number.isSafeInteger(b_cents)) throw new Error('No entero');
  return a_cents + b_cents;
}`,
    badTitle: 'Módulo central importando detalles volátiles de campañas UI',
    badCodeTs: `// Si cambia el banner promocional del mes, obliga a recompilar y probar contabilidad.
export function ledgerEntry(banner_color_hex: string, cents: number) {
  return { banner_color_hex, cents };
}`,
    counterexample:
      'Intentar que absolutamente todos los módulos tengan inestabilidad `I = 0` es matemáticamente imposible si existen relaciones en el sistema: los bordes deben poder cambiar rápido.',
    labId: 'dependencias',
    practicalExercise:
      'Observa la tabla en vivo de Ca, Ce e Inestabilidad I en Dependency Graph Builder al cargar los 4 presets.',
  },
  {
    moduleId: 'B10',
    diagramTitle: 'SOLID pragmático: inversión de dependencias en la frontera',
    nodes: [
      { id: 'usecase', label: 'ConfirmOrder', role: 'Política de alto nivel' },
      { id: 'port', label: 'NotifierPort', role: 'Abstracción del dominio' },
      { id: 'smtp', label: 'SmtpAdapter', role: 'Detalle reemplazable' },
    ],
    edges: [
      { from: 'usecase', to: 'port', label: 'Usa contrato propio' },
      { from: 'smtp', to: 'port', label: 'Implementa contrato' },
    ],
    goodTitle: 'Abstracción creada solo donde existe frontera de I/O o variación',
    goodCodeTs: `export interface OrderNotifierPort {
  notifyConfirmed(order_id: string): Promise<void>;
}`,
    badTitle: 'Crear `ISumService` para envolver una suma determinista pura',
    badCodeTs: `// Indirección inútil: no hay I/O, ni segundo proveedor, ni motivo de cambio independiente.
export interface IAdditionHelper { addTwoNumbers(a: number, b: number): number; }`,
    counterexample:
      'Aplicar OCP especulativo creando interfaces `I*` para cada clase interna duplica archivos y dificulta navegar el código sin ganar testabilidad.',
    labId: 'patterns',
    practicalExercise:
      'Usa el Simulador de Variabilidad vs Sobrediseño en Pattern Clinic con «1 sola variante anual» y comprueba la alerta YAGNI.',
  },
  {
    moduleId: 'B11',
    diagramTitle: 'Patrón como solución contextual vs antipatrón por moda',
    nodes: [
      { id: 'force', label: 'Fuerzas / Problema', role: '3 pasarelas incompatibles' },
      { id: 'pattern', label: 'Adapter + Puerto', role: 'Solución acotada' },
      { id: 'cost', label: 'Trade-off', role: '1 capa extra de mapeo' },
    ],
    edges: [
      { from: 'force', to: 'pattern', label: 'Justifica adopción' },
      { from: 'pattern', to: 'cost', label: 'Asume coste explícito' },
    ],
    goodTitle: 'Adoptar un patrón únicamente tras nombrar la fuerza que resuelve',
    goodCodeTs: `// Traduce el estado propietario del proveedor al lenguaje cerrado de NexoShop.
export function mapVendorCodeToStatus(code: '00' | '51'): 'AUTHORIZED' | 'DECLINED' {
  return code === '00' ? 'AUTHORIZED' : 'DECLINED';
}`,
    badTitle: 'Singleton mutable global ocultando estado compartido entre tests',
    badCodeTs: `// Acopla pruebas en paralelo y filtra datos entre peticiones concurrentes.
export const GLOBAL_MUTABLE_CART: { items: string[] } = { items: [] };`,
    counterexample:
      'Introducir un Event Bus interno asíncrono cuando una llamada directa de función dentro del mismo módulo bastaba complica el rastreo de errores sin beneficio.',
    labId: 'patterns',
    practicalExercise:
      'Resuelve los 4 casos clínicos de Pattern & Refactoring Clinic contrastando beneficio y coste operativo.',
  },
  {
    moduleId: 'B12',
    diagramTitle: 'Integrador Básico: App de Reservas sin solapamiento',
    nodes: [
      { id: 'ui-res', label: 'Web Agenda', role: 'Captura solicitud' },
      { id: 'uc-res', label: 'ReserveSlotUseCase', role: 'Coordina transacción' },
      { id: 'dom-res', label: 'TimeSlotRule', role: 'Impide solapamiento' },
      { id: 'db-res', label: 'PostgreSQL Slots', role: 'Constraint único' },
    ],
    edges: [
      { from: 'ui-res', to: 'uc-res', label: 'POST /bookings' },
      { from: 'uc-res', to: 'dom-res', label: 'Verifica rango' },
      { from: 'uc-res', to: 'db-res', label: 'Guarda atómicamente' },
    ],
    goodTitle: 'Regla pura de solapamiento + respaldo transaccional en BD',
    goodCodeTs: `export function slotsOverlap(start_a: number, end_a: number, start_b: number, end_b: number): boolean {
  return start_a < end_b && start_b < end_a;
}`,
    badTitle: 'Validar disponibilidad solo deshabilitando botones en el navegador',
    badCodeTs: `// Dos pacientes pulsando al mismo segundo reservan el mismo consultorio.
export const uiOnlyCheck = 'if (!button.disabled) submitWithoutServerCheck()';`,
    counterexample:
      'Documentar un diagrama C4 impecable pero omitir el constraint único en base de datos permite doble reserva bajo concurrencia real.',
    labId: 'c4',
    practicalExercise:
      'Modela en C4 Studio los contenedores de la App de Reservas y exporta su archivo Mermaid para adjuntarlo en `#/proyectos/INT-BASICO`.',
  },
  {
    moduleId: 'I01',
    diagramTitle: 'Segregación de interfaces (ISP) y sustitución segura (LSP)',
    nodes: [
      { id: 'reader', label: 'Consulta Catálogo', role: 'Consumidor lectura' },
      { id: 'read-port', label: 'CatalogReaderPort', role: 'Interfaz segregada' },
      { id: 'write-port', label: 'CatalogWriterPort', role: 'Interfaz mutación' },
    ],
    edges: [
      { from: 'reader', to: 'read-port', label: 'Depende solo de lectura' },
      { from: 'write-port', to: 'read-port', label: 'Separado por rol' },
    ],
    goodTitle: 'Contratos pequeños enfocados en el consumidor (ISP)',
    goodCodeTs: `export interface OrderReadPort {
  findById(order_id: string): Promise<{ id: string; status: string } | null>;
}`,
    badTitle: 'Interfaz gigante que obliga a lanzar `NotImplemented` (viola LSP/ISP)',
    badCodeTs: `export class ReadOnlyReplicaRepo {
  deleteAllOrders(): Promise<void> { throw new Error('Not supported in replica!'); }
}`,
    counterexample:
      'Fragmentar una interfaz cohesiva de 2 métodos en 2 interfaces de 1 método cuando siempre se inyectan juntas solo añade ruido.',
    labId: 'dependencias',
    practicalExercise:
      'Revisa en Dependency Graph Builder cómo las interfaces segregadas en el Dominio mantienen desacoplada la Infraestructura.',
  },
  {
    moduleId: 'I02',
    diagramTitle: 'Patrones Creacionales: construcción válida de agregados complejos',
    nodes: [
      { id: 'dto-in', label: 'Input Crudo', role: 'Frontera externa' },
      { id: 'factory', label: 'OrderFactory', role: 'Valida invariantes' },
      { id: 'entity', label: 'Orden Válida', role: 'Nunca nace corrupta' },
    ],
    edges: [
      { from: 'dto-in', to: 'factory', label: 'Datos candidatos' },
      { from: 'factory', to: 'entity', label: 'Instancia íntegra' },
    ],
    goodTitle: 'Fábrica de dominio que impide estados iniciales inválidos',
    goodCodeTs: `export function createVerifiedCoupon(code: string, discount_pct: number) {
  if (discount_pct <= 0 || discount_pct > 80) throw new Error('Porcentaje fuera de política');
  return Object.freeze({ code: code.trim().toUpperCase(), discount_pct });
}`,
    badTitle: 'Constructor telescópico o entidad vacía llenada con setters sueltos',
    badCodeTs: `// Entre new Order() y setTotal() el objeto circula en estado inválido sin líneas.
export const halfBakedOrder = { id: '', total: -50, lines: null };`,
    counterexample:
      'Construir un Builder fluido de 90 líneas para un DTO plano de 3 propiedades obligatorias que TypeScript ya valida en literal de objeto.',
    labId: 'patterns',
    practicalExercise:
      'Analiza en Pattern Clinic cuándo una función factoría simple supera a una jerarquía Abstract Factory.',
  },
  {
    moduleId: 'I03',
    diagramTitle: 'Patrones Estructurales: Adapter y Decorator sobre puertos limpios',
    nodes: [
      { id: 'uc', label: 'PayOrderUseCase', role: 'Caso de uso' },
      { id: 'dec', label: 'TelemetryDecorator', role: 'Mide latencia/éxito' },
      { id: 'adap', label: 'StripeLikeAdapter', role: 'Traduce HTTP externo' },
    ],
    edges: [
      { from: 'uc', to: 'dec', label: 'Invoca PaymentPort' },
      { from: 'dec', to: 'adap', label: 'Delega y mide SLI' },
    ],
    goodTitle: 'Decorator añade telemetría sin ensuciar la regla de cobro',
    goodCodeTs: `export async function withTiming<T>(metric_name: string, work: () => Promise<T>): Promise<T> {
  const started_ms = Date.now();
  try { return await work(); } finally { void (Date.now() - started_ms + metric_name.length); }
}`,
    badTitle: 'Filtrar tipos propietarios del SDK externo a todo el dominio',
    badCodeTs: `// Si el SDK renombra 'charge_token_v1', hay que editar 30 servicios internos.
export type LeakedDomainOrder = { vendor_raw_headers: Record<string, string> };`,
    counterexample:
      'Apilar 7 Decorators anidados ocultando reintentos y mutaciones de estado vuelve casi imposible depurar una traza en producción.',
    labId: 'patterns',
    practicalExercise:
      'En Pattern Clinic evalúa la integración de múltiples pasarelas con contratos incompatibles usando Adapter.',
  },
  {
    moduleId: 'I04',
    diagramTitle: 'Patrones de Comportamiento: máquina de estados explícita (State + Strategy)',
    nodes: [
      { id: 'pending', label: 'PENDING', role: 'Admite pago/cancelar' },
      { id: 'paid', label: 'PAID', role: 'Admite despacho' },
      { id: 'shipped', label: 'SHIPPED', role: 'Solo devolución' },
    ],
    edges: [
      { from: 'pending', to: 'paid', label: 'authorizePayment()' },
      { from: 'paid', to: 'shipped', label: 'dispatchShipment()' },
    ],
    goodTitle: 'Transiciones cerradas con precondiciones verificables',
    goodCodeTs: `const ALLOWED_NEXT: Readonly<Record<string, readonly string[]>> = {
  PENDING: ['PAID', 'CANCELED'],
  PAID: ['SHIPPED', 'REFUNDED'],
  SHIPPED: ['DELIVERED'],
};
export function canTransitionOrder(from: string, to: string): boolean {
  return (ALLOWED_NEXT[from] ?? []).includes(to);
}`,
    badTitle: 'Flags booleanos sueltos que permiten combinaciones imposibles',
    badCodeTs: `// ¿Cancelado y pagado y enviado a la vez? Los booleanos sueltos no protegen invariantes.
export type BrokenOrderFlags = { isPaid: true; isCanceled: true; isDraft: true };`,
    counterexample:
      'Instanciar una clase `State` separada por cada valor cuando solo existen 2 estados sin comportamiento polimórfico.',
    labId: 'ddd',
    practicalExercise:
      'En DDD Workshop diseña las invariantes de transición de `OrdenCompra` asegurando que pagada sea inmutable en sus líneas.',
  },
  {
    moduleId: 'I05',
    diagramTitle: 'Repository por Aggregate Root y atomicidad transaccional',
    nodes: [
      { id: 'service', label: 'PlaceOrderService', role: 'Caso de uso' },
      { id: 'repo', label: 'OrderRepositoryPort', role: 'Colección de agregados' },
      { id: 'tx', label: 'Transacción SQL', role: 'Orden + Líneas + Outbox' },
    ],
    edges: [
      { from: 'service', to: 'repo', label: 'save(orderAggregate)' },
      { from: 'repo', to: 'tx', label: 'COMMIT o ROLLBACK único' },
    ],
    goodTitle: 'Un repositorio por Aggregate Root con proyección explícita',
    goodCodeTs: `export interface OrderRepositoryPort {
  findByIdForTenant(order_id: string, tenant_id: string): Promise<{ id: string; total: string } | null>;
  saveWithOutbox(order: { id: string; tenant_id: string; total: string }): Promise<void>;
}`,
    badTitle: 'Un repositorio genérico por cada tabla hija rompiendo invariantes',
    badCodeTs: `// Insertar líneas sin pasar por la raíz salta el recálculo del total y el límite de 50 ítems.
export interface RawOrderLineTableRepo { insertOrphanLine(raw: unknown): Promise<void>; }`,
    counterexample:
      'Usar el repositorio de escritura completo con hidratación profunda de agregados solo para pintar una tabla paginada de resumen.',
    labId: 'ddd',
    practicalExercise:
      'Prueba en DDD Workshop qué entidades internas pertenecen a la misma transacción ACID del agregado y cuáles salen por evento.',
  },
  {
    moduleId: 'I06',
    diagramTitle: 'Clean Architecture: la regla de dependencia concéntrica',
    nodes: [
      { id: 'http', label: 'HTTP Controller', role: 'Capa externa' },
      { id: 'uc-clean', label: 'ApproveOrderUseCase', role: 'Aplicación' },
      { id: 'ent-clean', label: 'Order Rules', role: 'Dominio (Ce = 0)' },
    ],
    edges: [
      { from: 'http', to: 'uc-clean', label: 'Ejecuta caso de uso' },
      { from: 'uc-clean', to: 'ent-clean', label: 'Aplica política' },
    ],
    goodTitle: 'Caso de uso con verbo semántico del negocio, sin tipos HTTP',
    goodCodeTs: `// No importa Request/Response ni códigos HTTP; retorna resultado de dominio tipado.
export async function approveHighValueOrder(order_id: string, risk_score: number) {
  if (risk_score > 80) return { outcome: 'MANUAL_REVIEW_REQUIRED' as const, order_id };
  return { outcome: 'APPROVED' as const, order_id };
}`,
    badTitle: 'Entidad o caso de uso retornando excepciones y headers de framework HTTP',
    badCodeTs: `// Acopla el núcleo a transporte web; impide invocar el caso de uso desde un worker SQS.
export function domainRuleCoupledToHttp() {
  return { httpStatusCode: 422, setCookieHeader: 'session=xyz' };
}`,
    counterexample:
      'Duplicar 4 modelos idénticos con mappers manuales en endpoints de lectura simple donde un `pick()` seguro bastaba.',
    labId: 'dependencias',
    practicalExercise:
      'Carga el preset «Clean Architecture» en Dependency Graph Builder, verifica `Ce = 0` en Dominio y exporta el grafo Mermaid.',
  },
  {
    moduleId: 'I07',
    diagramTitle: 'Arquitectura Hexagonal: Puertos Primarios, Secundarios y Test Doubles',
    nodes: [
      { id: 'drv', label: 'HTTP / Worker CLI', role: 'Adaptador Primario' },
      { id: 'hex', label: 'Aplicación + Dominio', role: 'Hexágono' },
      { id: 'out-port', label: 'InventoryPort', role: 'Puerto Secundario' },
      { id: 'fake', label: 'PgAdapter / InMemory', role: 'Adaptadores intercambiables' },
    ],
    edges: [
      { from: 'drv', to: 'hex', label: 'Invoca caso de uso' },
      { from: 'hex', to: 'out-port', label: 'Declara necesidad' },
      { from: 'fake', to: 'out-port', label: 'Satisface contrato' },
    ],
    goodTitle: 'Pruebas ultrarrápidas con adaptador en memoria fiel al contrato',
    goodCodeTs: `export class InMemoryStockAdapter {
  private readonly stock_by_sku = new Map<string, number>([['SKU-1', 5]]);
  reserveOne(sku: string): boolean {
    const current = this.stock_by_sku.get(sku) ?? 0;
    if (current < 1) return false;
    this.stock_by_sku.set(sku, current - 1);
    return true;
  }
}`,
    badTitle: 'Mockear métodos privados internos en vez de probar el puerto público',
    badCodeTs: `// Test frágil: se rompe al renombrar un helper privado aunque el comportamiento sea idéntico.
export const brittleTest = 'spyOn(service as unknown, "_privateHelperStep2")';`,
    counterexample:
      'Confiar únicamente en el adaptador en memoria sin correr pruebas de integración contra PostgreSQL real oculta errores de constraints SQL e índices.',
    labId: 'c4',
    practicalExercise:
      'Carga el nivel C3 (Componentes) en C4 Studio e invierte erróneamente Dominio → Controlador para observar la detección semántica.',
  },
  {
    moduleId: 'I08',
    diagramTitle: 'DDD Estratégico: Core Domain vs Supporting vs Generic Subdomain',
    nodes: [
      { id: 'core-d', label: 'Motor Precios Dinámicos', role: 'Core (Ventaja diferencial)' },
      { id: 'supp-d', label: 'Gestión Devoluciones', role: 'Supporting (A medida simple)' },
      { id: 'gen-d', label: 'Identidad SSO / Correo', role: 'Generic (Comprar/SaaS)' },
    ],
    edges: [
      { from: 'core-d', to: 'supp-d', label: 'Política de reembolso' },
      { from: 'supp-d', to: 'gen-d', label: 'Notifica vía puerto' },
    ],
    goodTitle: 'Lenguaje ubicuo reflejado exactamente en tipos y operaciones',
    goodCodeTs: `// Usa términos exactos de negocio, nunca verbos CRUD ambiguos como "processData()".
export type PolicyEndorsementCommand = {
  readonly policy_number: string;
  readonly effective_date_iso: string;
};`,
    badTitle: 'Invertir meses construyendo un motor propio para un subdominio genérico',
    badCodeTs: `// Reinventar servidor SMTP y criptografía OAuth casera resta foco al Core Domain.
export class HomemadeSmtpAndCryptoEngine {}`,
    counterexample:
      'Aplicar modelado táctico pesado (agregados, eventos, value objects complejos) a un catálogo estático de códigos postales.',
    labId: 'ddd',
    practicalExercise:
      'Inspecciona en DDD Workshop cómo los términos `Producto`, `Cliente`, `Pedido` y `Cobro` cambian de atributos según el subdominio.',
  },
  {
    moduleId: 'I09',
    diagramTitle: 'Bounded Contexts y Anti-Corruption Layer (ACL)',
    nodes: [
      { id: 'legacy-psp', label: 'PSP Externo Legado', role: 'Modelo ajeno inestable' },
      { id: 'acl-box', label: 'PaymentAclTranslator', role: 'Capa Anticorrupción' },
      { id: 'pay-ctx', label: 'Contexto Pagos', role: 'Modelo limpio propio' },
    ],
    edges: [
      { from: 'legacy-psp', to: 'acl-box', label: 'XML/Códigos legados' },
      { from: 'acl-box', to: 'pay-ctx', label: 'SettlementResult limpio' },
    ],
    goodTitle: 'ACL traduce y sanea antes de tocar el dominio propio',
    goodCodeTs: `export function translateLegacyPspResponse(raw_code: string): 'CAPTURED' | 'REJECTED' {
  // Evita que códigos crípticos externos ("ERR_99_X") se esparzan por el dominio.
  return raw_code === '000' ? 'CAPTURED' : 'REJECTED';
}`,
    badTitle: 'Integración por Base de Datos Compartida entre dos contextos',
    badCodeTs: `// Acopla despliegues y permite que Ventas corrompa invariantes internas de Inventario.
export const sharedDbAntiPattern = 'SELECT * FROM inventory_internal_locks JOIN sales_cart';`,
    counterexample:
      'Escribir un ACL complejo entre dos módulos mantenidos por el mismo equipo pequeño con lenguaje ya unificado.',
    labId: 'ddd',
    practicalExercise:
      'En el modelador de Context Map de DDD Workshop añade una relación `Shared Database` o `PSP Externo sin ACL` y verifica el diagnóstico.',
  },
  {
    moduleId: 'I10',
    diagramTitle: 'DDD Táctico: Aggregate Root, Value Objects y Concurrencia Optimista',
    nodes: [
      { id: 'cmd-res', label: 'ReserveUnitsCmd', role: 'Intención' },
      { id: 'agg-stock', label: 'StockItem Root', role: 'Protege stock >= 0 + version' },
      { id: 'dom-evt', label: 'StockReservedEvt', role: 'Efecto hacia otros contextos' },
    ],
    edges: [
      { from: 'cmd-res', to: 'agg-stock', label: ' Valida invariante' },
      { from: 'agg-stock', to: 'dom-evt', label: 'Emite evento inmutable' },
    ],
    goodTitle: 'Dinero como decimal exacto y actualización con versión optimista',
    goodCodeTs: `export function reserveStockAtomically(available: number, version: number, qty: number) {
  if (qty <= 0 || available < qty) throw new Error('Sobreventa bloqueada por invariante');
  // El repositorio exigirá WHERE sku = $1 AND version = $2 para evitar lost-update.
  return { remaining: available - qty, next_version: version + 1 };
}`,
    badTitle: 'Usar `number` IEEE-754 para dinero y agregados gigantes multi-contexto',
    badCodeTs: `// 0.1 + 0.2 === 0.30000000000000004: descuadres contables en liquidación.
export const brokenMoneyCalc = 0.1 + 0.2;`,
    counterexample:
      'Meter todas las reseñas históricas de un producto como array dentro del agregado `Producto` carga miles de filas en memoria en cada compra.',
    labId: 'ddd',
    practicalExercise:
      'Selecciona `StockItem` en DDD Workshop, desmarca concurrencia optimista y comprueba el fallo de sobreventa.',
  },
  {
    moduleId: 'I11',
    diagramTitle: 'Diseño evolutivo de APIs REST: Idempotencia, Paginación y Expand/Contract',
    nodes: [
      { id: 'mob-v1', label: 'App Móvil v1/v2', role: 'Consumidor activo' },
      { id: 'api-gw', label: 'POST /v1/orders', role: 'DTO validado + Idempotency-Key' },
      { id: 'pres-out', label: 'Response Allowlist', role: 'Sin filtrar columnas internas' },
    ],
    edges: [
      { from: 'mob-v1', to: 'api-gw', label: 'Header Idempotency-Key' },
      { from: 'api-gw', to: 'pres-out', label: '201 Created determinista' },
    ],
    goodTitle: 'Proyección explícita allowlist y paginación acotada',
    goodCodeTs: `export type OrderPublicDto = {
  readonly order_id: string;
  readonly status: 'PENDING' | 'PAID';
  readonly total_decimal: string;
};`,
    badTitle: 'Retornar la fila cruda de la base de datos y renombrar campos sin coexistencia',
    badCodeTs: `// Filtra campos internos sensibles y rompe clientes móviles al renombrar id -> uuid.
export function serializeOrmRowDirectly(db_row: Record<string, unknown>) { return db_row; }`,
    counterexample:
      'Crear `/v2`, `/v3`, `/v4` completas por cada campo opcional nuevo en lugar de evolucionar de forma aditiva compatible.',
    labId: 'api',
    practicalExercise:
      'Ejecuta los dos escenarios del comparador `v1 vs v2` en API Contract Lab detectando todos los breaking changes.',
  },
  {
    moduleId: 'I12',
    diagramTitle: 'Integrador Intermedio: Monolito Modular con Fronteras Verificables',
    nodes: [
      { id: 'mod-cat', label: 'Módulo Catálogo', role: 'Esquema propio' },
      { id: 'mod-ord', label: 'Módulo Pedidos', role: 'Agregado + Outbox' },
      { id: 'mod-pay', label: 'Módulo Pagos', role: 'ACL + Idempotencia' },
    ],
    edges: [
      { from: 'mod-cat', to: 'mod-ord', label: 'Puerto público de precios' },
      { from: 'mod-ord', to: 'mod-pay', label: 'Evento interno post-commit' },
    ],
    goodTitle: 'Comunicación solo por fachadas/puertos públicos entre módulos',
    goodCodeTs: `// Pedidos consume el contrato público de Catálogo; jamás importa su tabla Drizzle interna.
export interface CatalogPricingFacade {
  getFrozenPriceDecimal(sku: string): Promise<string | null>;
}`,
    badTitle: 'Imports cruzados hacia carpetas `infrastructure/` de otro módulo',
    badCodeTs: `// Destruye la modularidad: impide extraer Pagos mañana sin reescribir Pedidos.
export const illegalCrossModuleSql = 'JOIN payments_private_ledger ON ...';`,
    counterexample:
      'Saltar directo a 10 microservicios con un equipo de 4 personas antes de dominar fronteras limpias en un monolito modular.',
    labId: 'dependencias',
    practicalExercise:
      'Carga el preset «Modular Monolith degradado» en Dependency Graph Builder, repara sus violaciones y lleva el resultado a `#/proyectos/INT-INTERMEDIO`.',
  },
  {
    moduleId: 'A01',
    diagramTitle: 'System Design: estimación de capacidad, cuellos de botella y holgura',
    nodes: [
      { id: 'peak', label: 'Pico 1.500 req/s', role: 'Tráfico de entrada' },
      { id: 'stateless', label: 'Réplicas API + Pool', role: 'Cómputo horizontal' },
      { id: 'db-cap', label: 'Pool PgBouncer / DB', role: 'Límite de conexiones e IOPS' },
    ],
    edges: [
      { from: 'peak', to: 'stateless', label: 'Balanceo L7' },
      { from: 'stateless', to: 'db-cap', label: 'Conexiones acotadas' },
    ],
    goodTitle: 'Dimensionar con unidades explícitas, factor de pico y margen SLO',
    goodCodeTs: `export function requiredRpmWithHeadroom(peak_rps: number, high_slo: boolean): number {
  const base_rpm = peak_rps * 60;
  // Aplica 30 % de margen operativo cuando el SLO es >= 99,9 %.
  return Math.ceil(base_rpm * (high_slo ? 1.3 : 1.15));
}`,
    badTitle: 'Confundir req/min con req/s o escalar pods agotando `max_connections` SQL',
    badCodeTs: `// 50 réplicas × 20 conexiones = 1.000 conexiones directas que tumban PostgreSQL (límite 200).
export const unpooledConnections = 50 * 20;`,
    counterexample:
      'Aprovisionar desde el día 1 clústeres multi-región para 100.000 req/s cuando el negocio real procesa 20 pedidos por hora.',
    labId: 'incident',
    practicalExercise:
      'Verifica en Incident & Reliability Lab y en el taller Senior `S11` cómo interactúan capacidad, cola y latencia.',
  },
  {
    moduleId: 'A02',
    diagramTitle: 'Monolito Modular vs Microservicios: autonomía frente a impuesto distribuido',
    nodes: [
      { id: 'team-top', label: 'Topología Equipos', role: 'Ley de Conway' },
      { id: 'mod-mono', label: 'Monolito Modular', role: '1 despliegue · TX local' },
      { id: 'micro', label: 'Worker Extraído', role: 'Escalado/ciclo distinto' },
    ],
    edges: [
      { from: 'team-top', to: 'mod-mono', label: 'Fronteras por dominio' },
      { from: 'mod-mono', to: 'micro', label: 'Extrae solo cuello real' },
    ],
    goodTitle: 'Extraer servicios únicamente con dueño, telemetría y motivo medido',
    goodCodeTs: `export type ServiceExtractionGate = {
  readonly has_dedicated_owner_team: boolean;
  readonly independent_scaling_bottleneck_proven: boolean;
  readonly distributed_tracing_ready: boolean;
};`,
    badTitle: 'Monolito distribuido: 12 servicios que deben desplegarse juntos en orden fijo',
    badCodeTs: `// Peor de ambos mundos: latencia de red + fallos parciales + despliegues acoplados.
export const distributedMonolith = ['svc-a', 'svc-b', 'svc-c'].join('->sync-chain->');`,
    counterexample:
      'Mantener un proceso intensivo de conversión de video en vivo dentro del mismo proceso Node.js que atiende el checkout bloquea el event loop.',
    labId: 'adr',
    practicalExercise:
      'Compara en la matriz multicriterio de Architecture Decision Studio «Monolito Modular» frente a «Microservicios desde día 1».',
  },
  {
    moduleId: 'A03',
    diagramTitle: 'Comunicación Síncrona vs Asíncrona: cadena de disponibilidad',
    nodes: [
      { id: 'api-in', label: 'Checkout HTTP', role: 'Respuesta rápida 202/201' },
      { id: 'broker', label: 'Cola Mensajería', role: 'Amortigua picos' },
      { id: 'worker-out', label: 'Worker Factura/Email', role: 'Proceso desacoplado' },
    ],
    edges: [
      { from: 'api-in', to: 'broker', label: 'Publica tras Outbox' },
      { from: 'broker', to: 'worker-out', label: 'Entrega At-Least-Once' },
    ],
    goodTitle: 'Envelope de evento versionado con `event_id` para deduplicación',
    goodCodeTs: `export type EventEnvelope<TPayload> = {
  readonly event_id: string;
  readonly event_type: string;
  readonly schema_version: number;
  readonly occurred_at: string;
  readonly tenant_id: string;
  readonly payload: TPayload;
};`,
    badTitle: 'Cadena síncrona de 5 llamadas HTTP bloqueantes en la ruta crítica de compra',
    badCodeTs: `// 0.99^5 = 95.09 %: cinco servicios al 99 % en serie destruyen un SLO de 99,9 %.
export const availabilityInSeries = 0.99 ** 5;`,
    counterexample:
      'Volver asíncrono el login del usuario cuando la pantalla necesita saber inmediatamente si las credenciales son válidas.',
    labId: 'distributed',
    practicalExercise:
      'Ejecuta en Distributed Systems Simulator el impacto de reintentos con y sin procesador idempotente.',
  },
  {
    moduleId: 'A04',
    diagramTitle: 'CQRS y Event-Driven: separación entre modelo de escritura y proyección',
    nodes: [
      { id: 'cmd-side', label: 'Write Model (Agregado)', role: 'Protege invariantes' },
      { id: 'evt-stream', label: 'Evento OrderPlaced', role: 'Hecho inmutable' },
      { id: 'read-proj', label: 'Read Projection', role: 'Consulta rápida denormalizada' },
    ],
    edges: [
      { from: 'cmd-side', to: 'evt-stream', label: 'Emite post-commit' },
      { from: 'evt-stream', to: 'read-proj', label: 'Proyecta idempotentemente' },
    ],
    goodTitle: 'Proyector idempotente que tolera reentrega de eventos',
    goodCodeTs: `export function applyOrderSummaryProjection(
  current_last_version: number,
  incoming_version: number,
): boolean {
  // Ignora eventos repetidos o anteriores para mantener convergencia determinista.
  return incoming_version > current_last_version;
}`,
    badTitle: 'Aplicar CQRS con Event Sourcing completo en un CRUD simple de categorías',
    badCodeTs: `// Complejidad accidental extrema sin asimetría de carga ni requisito de auditoría de eventos.
export const overkillForSimpleCrud = 'EventStore + Snapshotter + 4 Projectors para tabla de 20 países';`,
    counterexample:
      'Asumir que la proyección de lectura estará actualizada en 0 ms tras el comando provoca bugs de «datos desaparecidos» en la UI.',
    labId: 'distributed',
    practicalExercise:
      'Simula en Distributed Systems Simulator la entrega duplicada del broker y verifica cómo converge el consumidor idempotente.',
  },
  {
    moduleId: 'A05',
    diagramTitle: 'Consistencia eventual: Transactional Outbox + Saga compensatoria',
    nodes: [
      { id: 'db-outbox', label: 'TX: Orden + Outbox', role: 'Commit atómico local' },
      { id: 'relay', label: 'Outbox Relay', role: 'Publica con SKIP LOCKED' },
      { id: 'pay-step', label: 'Pagos (Rechaza)', role: 'Emite PaymentRejected' },
      { id: 'comp-step', label: 'Saga: ReleaseStock', role: 'Compensa Inventario' },
    ],
    edges: [
      { from: 'db-outbox', to: 'relay', label: ' Cero pérdida Dual-Write' },
      { from: 'relay', to: 'pay-step', label: 'Intenta cobro' },
      { from: 'pay-step', to: 'comp-step', label: 'Revierte reserva' },
    ],
    goodTitle: 'Guardar estado de negocio y fila Outbox en la misma transacción SQL',
    goodCodeTs: `// Si el contenedor cae tras el COMMIT, el relé publicará el evento pendiente al reiniciar.
export type OutboxRecord = {
  readonly event_id: string;
  readonly aggregate_id: string;
  readonly published_at: string | null;
};`,
    badTitle: 'Dual-Write: hacer `db.commit()` y después `broker.publish()` sin Outbox',
    badCodeTs: `// Si falla la red en la línea 2, el pedido queda cobrado/creado pero nadie lo despacha jamás.
export async function unsafeDualWrite(saveDb: () => Promise<void>, sendMq: () => Promise<void>) {
  await saveDb();
  await sendMq();
}`,
    counterexample:
      'Usar una Saga distribuida entre 3 servicios cuando los datos pertenecen al mismo Bounded Context y cabían en una sola transacción PostgreSQL.',
    labId: 'distributed',
    practicalExercise:
      'En el Modo 2 de Distributed Systems Simulator desactiva `Transactional Outbox` o `Saga compensatoria` e inyecta los fallos correspondientes.',
  },
  {
    moduleId: 'A06',
    diagramTitle: 'Datos, Índices y Cache-Aside con invalidación segura post-commit',
    nodes: [
      { id: 'app-read', label: 'ProductService', role: 'Consulta cache-aside' },
      { id: 'valkey', label: 'Valkey Cache', role: 'Clave versionada + TTL' },
      { id: 'pg-idx', label: 'PostgreSQL + Índices', role: 'Fuente de verdad' },
    ],
    edges: [
      { from: 'app-read', to: 'valkey', label: '1. Lee clave exacta' },
      { from: 'app-read', to: 'pg-idx', label: '2. Miss/Degrada a DB' },
    ],
    goodTitle: 'Clave de caché versionada por tenant sin PII e invalidada tras commit',
    goodCodeTs: `export function buildProductCacheKey(stage: string, tenant_id: string, product_id: string): string {
  // Nunca incluir PII en la clave; si Valkey cae, el servicio degrada limpiamente a PostgreSQL.
  return \`\${stage}:catalog:v1:tenant:\${tenant_id}:product:\${product_id}\`;
}`,
    badTitle: 'Invalidar caché antes del commit o usar `DEL("products:*")` creyendo que borra patrones',
    badCodeTs: `// En Redis/Valkey DEL no interpreta comodines '*'; la clave obsoleta queda viva hasta expirar.
export const brokenInvalidation = "redis.del('prod:catalog:*')";`,
    counterexample:
      'Añadir una capa de caché distribuido antes de ejecutar `EXPLAIN (ANALYZE, BUFFERS)` y crear el índice compuesto que bajaba la consulta de 900 ms a 4 ms.',
    labId: 'incident',
    practicalExercise:
      'Analiza en Incident & Reliability Lab qué ocurre cuando una dependencia de datos degrada latencia sin límites de pool.',
  },
  {
    moduleId: 'A07',
    diagramTitle: 'Resiliencia coordinada: Timeout + Backoff con Jitter + Circuit Breaker + Bulkhead',
    nodes: [
      { id: 'caller', label: 'API Pedidos (SLA 1.5s)', role: 'Bulkhead aislado' },
      { id: 'breaker', label: 'Circuit Breaker', role: 'Falla rápido si OPEN' },
      { id: 'ext-dep', label: 'PSP Externo', role: 'Timeout 400ms + Jitter' },
    ],
    edges: [
      { from: 'caller', to: 'breaker', label: 'Máx 2 retries acotados' },
      { from: 'breaker', to: 'ext-dep', label: 'Sondea en HALF_OPEN' },
    ],
    goodTitle: 'Backoff exponencial con Full Jitter dentro del presupuesto del llamador',
    goodCodeTs: `export function computeFullJitterDelayMs(attempt: number, base_ms = 100, cap_ms = 1_200): number {
  const ceiling = Math.min(cap_ms, base_ms * 2 ** attempt);
  // Desincroniza clientes evitando que todos golpeen al proveedor en el mismo milisegundo.
  return Math.floor(Math.random() * ceiling);
}`,
    badTitle: 'Reintentos inmediatos infinitos sobre una operación no idempotente',
    badCodeTs: `// Amplifica la caída 10× (Retry Storm) y puede duplicar cargos si no hay Idempotency-Key.
export const retryStormConfig = { timeout_ms: 0, max_retries: Infinity, jitter: false };`,
    counterexample:
      'Configurar 4 reintentos con timeout de 2.000 ms cada uno (8.000 ms peor caso) cuando el API Gateway corta la conexión del usuario a los 3.000 ms.',
    labId: 'incident',
    practicalExercise:
      'Usa el Coordinador de Resiliencia en Incident & Reliability Lab para calibrar SLA, timeout, reintentos, jitter, circuit breaker y bulkhead.',
  },
  {
    moduleId: 'A08',
    diagramTitle: 'Seguridad por Diseño: Trust Boundaries, STRIDE y Autorización por Tenant',
    nodes: [
      { id: 'client-untrusted', label: 'Cliente Externo', role: 'Fuera de confianza' },
      { id: 'auth-guard', label: 'AuthN + Policy Guard', role: 'Privado por defecto' },
      { id: 'tenant-db', label: 'Repositorio Tenant', role: 'WHERE tenant_id = principal' },
    ],
    edges: [
      { from: 'client-untrusted', to: 'auth-guard', label: 'Bearer Token + DTO' },
      { from: 'auth-guard', to: 'tenant-db', label: 'Principal verificado' },
    ],
    goodTitle: 'Aislamiento BOLA/IDOR tomando `tenant_id` del token verificado, nunca del body',
    goodCodeTs: `export function assertTenantOwnership(principal_tenant_id: string, resource_tenant_id: string): void {
  if (principal_tenant_id !== resource_tenant_id) {
    throw new Error('403_FORBIDDEN_CROSS_TENANT_ACCESS');
  }
}`,
    badTitle: 'Confundir autenticación (JWT válido) con autorización sobre el recurso ajeno',
    badCodeTs: `// Cualquier usuario logueado descarga facturas de otra empresa cambiando ?invoiceId=999.
export const idorVulnerability = 'SELECT * FROM invoices WHERE id = req.query.invoiceId';`,
    counterexample:
      'Registrar el body completo con contraseñas, tokens o tarjetas en los logs de auditoría para «mejorar la trazabilidad de seguridad».',
    labId: 'api',
    practicalExercise:
      'En API Contract Lab identifica la filtración de `customerPasswordHash` en el escenario 2 y completa el gate STRIDE de la misión `S12`.',
  },
  {
    moduleId: 'A09',
    diagramTitle: 'Observabilidad orientada al usuario: SLIs, Trazas OTel y Burn Rate',
    nodes: [
      { id: 'sli', label: 'SLI Checkout (Éxito + p95)', role: 'Experiencia real usuario' },
      { id: 'budget', label: 'Error Budget (100% - SLO)', role: '43,2 min al 99,9%' },
      { id: 'burn', label: 'Alerta Multi-Window', role: 'Fast-Burn >= 14,4×' },
    ],
    edges: [
      { from: 'sli', to: 'budget', label: 'Consume margen' },
      { from: 'budget', to: 'burn', label: 'Prioriza estabilidad' },
    ],
    goodTitle: 'Métricas de baja cardinalidad + `trace_id` en logs estructurados',
    goodCodeTs: `// Labels acotados en métricas; los IDs únicos viajan en spans/logs estructurados sin PII.
export type SafeMetricLabels = {
  readonly route_template: '/v1/orders';
  readonly status_class: '2xx' | '4xx' | '5xx';
};`,
    badTitle: 'Medir solo CPU/`/healthz` o meter `user_id` como label en Prometheus',
    badCodeTs: `// Explosión de millones de series temporales que tumba el colector y dispara costos FinOps.
export const cardinalityBomb = { metric: 'http_requests', labels: { user_id: 'cada-uuid-unico' } };`,
    counterexample:
      'Despertar de madrugada al ingeniero de guardia por un pico de CPU de 40 segundos que no afectó ningún SLI de latencia ni tasa de éxito.',
    labId: 'incident',
    practicalExercise:
      'Calcula en Incident & Reliability Lab una tasa de error observada de 1,44 % sobre un SLO de 99,9 % y exporta el Runbook Markdown.',
  },
  {
    moduleId: 'A10',
    diagramTitle: 'Despliegue Progresivo: Artefacto OCI Inmutable, Canary y Rollback',
    nodes: [
      { id: 'ci-sha', label: 'CI + Scan + SBOM', role: 'Imagen OCI inmutable' },
      { id: 'canary', label: 'Canary 10 % Tráfico', role: 'Evalúa SLIs negocio' },
      { id: 'promote', label: '100 % o Rollback <3m', role: 'Decisión automatizable' },
    ],
    edges: [
      { from: 'ci-sha', to: 'canary', label: 'Despliega digest fijo' },
      { from: 'canary', to: 'promote', label: 'Compara p95 y errores' },
    ],
    goodTitle: 'Evaluación automática de salud del Canary antes de promover tráfico',
    goodCodeTs: `export function evaluateCanaryGuardrail(error_rate_pct: number, p95_ms: number): 'PROMOTE' | 'ROLLBACK' {
  if (error_rate_pct > 0.5 || p95_ms > 400) return 'ROLLBACK';
  return 'PROMOTE';
}`,
    badTitle: 'Compilar distinto por entorno y ejecutar `DROP COLUMN` en el mismo release',
    badCodeTs: `// Si el código nuevo falla y haces rollback del binario, los pods estables crashean sin la columna.
export const irreversibleDeploy = 'ALTER TABLE orders DROP COLUMN status_v1; deployNewCode();';`,
    counterexample:
      'Montar un clúster Kubernetes multi-región para un sitio estático o API pequeña que corre con 10× menos complejidad en `compose-vps` o hosting estático.',
    labId: 'incident',
    practicalExercise:
      'Diseña en Incident & Reliability Lab los umbrales que disparan rollback inmediato frente a degradación progresiva.',
  },
  {
    moduleId: 'A11',
    diagramTitle: 'Modernización sin Downtime: Strangler Fig + Migración Expand / Contract',
    nodes: [
      { id: 'router', label: 'Fachada / Router', role: 'Intercepta rutas' },
      { id: 'expand', label: '1. Expand + Backfill', role: 'Esquema compatible dual' },
      { id: 'shadow', label: '2. Shadow Read Verif.', role: 'Compara discrepancias' },
      { id: 'contract', label: '3. Cutover + Contract', role: 'Retira legado seguro' },
    ],
    edges: [
      { from: 'router', to: 'expand', label: 'Mantiene v1 viva' },
      { from: 'expand', to: 'shadow', label: 'Mide paridad 100 %' },
      { from: 'shadow', to: 'contract', label: 'Corta con rollback listo' },
    ],
    goodTitle: 'Backfill por lotes idempotentes con checkpoint reanudable',
    goodCodeTs: `export type BackfillCheckpoint = {
  readonly last_migrated_id: string;
  readonly batch_size: 500;
  readonly mismatch_count: number;
};`,
    badTitle: 'Reescritura Big Bang de 18 meses congelando mejoras y cortando de golpe',
    badCodeTs: `// Concentra todo el riesgo técnico y de negocio en una sola noche sin vuelta atrás.
export const bigBangCutover = 'shutdownLegacyForever(); launchUntestedRewrite();';`,
    counterexample:
      'Dejar la fase Expand abierta durante 3 años con escrituras duales permanentes sin completar jamás el retiro (Contract).',
    labId: 'api',
    practicalExercise:
      'Practica en API Contract Lab cómo evolucionar el contrato `v1` a `v2` de forma aditiva sin romper consumidores activos.',
  },
  {
    moduleId: 'A12',
    diagramTitle: 'Integrador Avanzado: Plataforma End-to-End de Pedidos y Pagos NexoShop',
    nodes: [
      { id: 'edge-nx', label: 'API Gateway / AuthZ', role: 'Tenant + Rate Limit' },
      { id: 'ord-nx', label: 'Pedidos + Outbox', role: 'Agregado + Eventos' },
      { id: 'pay-nx', label: 'Pagos Idempotente', role: 'ACL + Inbox único' },
      { id: 'obs-nx', label: 'OTel + SLO Burn Rate', role: 'Gobierno operativo' },
    ],
    edges: [
      { from: 'edge-nx', to: 'ord-nx', label: 'Comando autenticado' },
      { from: 'ord-nx', to: 'pay-nx', label: 'Evento confiable' },
      { from: 'pay-nx', to: 'obs-nx', label: 'Trazas y SLIs' },
    ],
    goodTitle: 'Trazabilidad completa: frontera clara, invariante protegida y verificación SLO',
    goodCodeTs: `export type EndToEndArchitectureChecklist = {
  readonly domain_free_of_orm_and_http: true;
  readonly idempotency_and_outbox_atomic: true;
  readonly slo_burn_rate_and_rollback_defined: true;
  readonly open_decisions_marked_requires_review: true;
};`,
    badTitle: 'Declarar «arquitectura perfecta» sin documentar costes, fallos ni límites',
    badCodeTs: `// Ninguna arquitectura elimina los trade-offs; ocultarlos garantiza sorpresas en incidentes.
export const silverBulletClaim = 'Zero latency, zero cost, 100% consistency everywhere';`,
    counterexample:
      'Copiar la arquitectura completa de un gigante global para un MVP temprano agota el presupuesto antes de validar el producto.',
    labId: 'distributed',
    practicalExercise:
      'Valida la cadena completa en Distributed Systems Simulator y construye el dossier final en `#/proyectos/INT-AVANZADO`.',
  },
];

export const VALIDATED_LESSON_ENRICHMENTS: readonly LessonEnrichmentItemSchema[] = Object.freeze(
  lessonEnrichmentsCatalogSchema.parse(RAW_LESSON_ENRICHMENTS, 'lesson-enrichments.constants'),
);

export const LESSON_ENRICHMENTS_BY_ID: ReadonlyMap<string, LessonEnrichmentItemSchema> = new Map(
  VALIDATED_LESSON_ENRICHMENTS.map((item) => [item.moduleId, item]),
);
