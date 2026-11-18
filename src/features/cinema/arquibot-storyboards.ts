/**
 * Declarative Storyboard Engine for ARQPIXEL Interactive Cinema (`arquibot-pixel-cinema`, `ADR-0007`).
 * - Handcrafts the first 5 2-voice Studio HD capsules (`HOME-INTRO`, `SENIOR-OVERVIEW`, `CLASS-B01`, `CLASS-B02`, `SENIOR-S01`)
 *   with 1:1 spoken/subtitle synchronization against `data/audio-manifest.json`.
 * - Deterministically derives 3-scene architectural storyboards for all 36 modules (`B01–A12`) and 18 Senior missions (`S01–S18`)
 *   from existing validated catalogs (`0` LLM calls in runtime).
 */
import { getLessonEnrichment } from '../curriculum/lesson-visuals.js';
import type { ModuleSchema } from '../curriculum/schemas/curriculum.schema.js';
import type { MissionSchema } from '../senior/schemas/senior.schema.js';
import type { SeniorPlaybookSummary } from '../senior/senior-ux-views.js';
import type {
  AudioManifestCatalogSchema,
  CinemaAuraTheme,
  CinemaDeck,
} from './schemas/cinema.schema.js';

function attachStudioAudio(
  deck: CinemaDeck,
  audio_manifest?: AudioManifestCatalogSchema,
): CinemaDeck {
  const meta = audio_manifest?.[deck.id];
  if (!meta) return deck;
  return {
    ...deck,
    audio: meta,
    scenes: deck.scenes.map((sc, idx) => ({
      ...sc,
      speaker: meta.speakers?.[idx] ?? sc.speaker,
    })),
  };
}

function firstLines(code: string, max_lines = 3): readonly string[] {
  return code
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .slice(0, max_lines);
}

/** 1. Video Trailer Principal en `#/inicio` (`HOME-INTRO`, 4 escenas, 2 voces Studio HD) */
export function buildHomeIntroDeck(audio_manifest?: AudioManifestCatalogSchema): CinemaDeck {
  return attachStudioAudio(
    {
      id: 'HOME-INTRO',
      kicker: 'VIDEO INTRO · ESTUDIO HD',
      heading: 'De dibujar cajas a pensar como Arquitecto de Software Senior',
      ctaLabel: 'Explorar Senior Mode',
      ctaHref: '#/senior',
      scenes: [
        {
          chapter: '01 · El Caos',
          title: 'Cuando el monolito acoplado frena cada despliegue',
          durationSec: 8,
          spriteId: 'arquibot-error',
          aura: 'amber',
          speaker: 'host',
          speech:
            '¿Alguna vez viste un sistema que empezó rápido, pero al tercer mes nadie se atreve a tocar una línea sin romper pagos o inventario en producción?',
          visual: {
            kind: 'c4-topology',
            mode: 'incident',
            nodes: [
              { label: 'UI + Controller', sub: 'SQL directo', state: 'hot' },
              { label: 'Pagos & Stock', sub: 'Ciclo circular', state: 'hot' },
              { label: 'BD Compartida', sub: 'Locks y 5xx', state: 'hot' },
            ],
            metricLabel: 'Impacto por cambio en producción',
            metricBefore: '1 módulo',
            metricAfter: '7 regresiones ⚠',
          },
        },
        {
          chapter: '02 · Fronteras',
          title: 'Límites explícitos con C4, DDD y Arquitectura Hexagonal',
          durationSec: 10,
          spriteId: 'arquibot-diagrama',
          aura: 'sky',
          speaker: 'mentor',
          speech:
            'Bienvenido a ARQPIXEL Academy. Aquí no memorizas definiciones sueltas: visualizas límites C4, DDD y arquitectura Hexagonal para diseñar software que evoluciona sin colapsar.',
          visual: {
            kind: 'dependency-rings',
            mode: 'clean',
            outerLayer: 'Adaptadores HTTP · SQL · Broker',
            coreItems: [
              { name: 'Caso de Uso (Aplicación)', rule: 'Orquesta puertos', state: 'port' },
              { name: 'Agregado Pedido (Dominio)', rule: 'Invariantes puras · Ce=0', state: 'ok' },
            ],
            infraTitle: 'PostgreSQLOrderRepository implements OrderPort',
            infraNote: 'Las dependencias apuntan hacia el Dominio; pruebas en milisegundos.',
            badgeLabel: 'INVERSIÓN DE DEPENDENCIAS · CLEAN / HEXAGONAL',
          },
        },
        {
          chapter: '03 · Presión Real',
          title: 'Del diagrama estático a sistemas distribuidos bajo carga',
          durationSec: 8,
          spriteId: 'arquibot-pensando',
          aura: 'emerald',
          speaker: 'host',
          speech:
            '¿Y cómo pasamos del diagrama bonito a defender decisiones reales frente a picos de tráfico, fallos de red y equipos bajo presión?',
          visual: {
            kind: 'event-lanes',
            mode: 'resilient',
            statusBadge: 'OUTBOX + IDEMPOTENCIA · CERO DOBLE COBRO',
            laneA: {
              name: 'TX Local Pedido',
              steps: ['1. INSERT order', '2. INSERT outbox', '3. COMMIT ACID ✓'],
            },
            laneB: {
              name: 'Consumidor Pagos',
              steps: ['1. Lee Idempotency-Key', '2. Deduplica retry', '3. Cobro único ✓'],
            },
          },
        },
        {
          chapter: '04 · Senior Mode',
          title: '8 Laboratorios, 5 Mundos 3D y 18 Misiones Reproducibles',
          durationSec: 11,
          spriteId: 'arquibot-senior',
          aura: 'gold',
          speaker: 'mentor',
          speech:
            'Practicarás en ocho laboratorios locales, cinco mundos 3D y dieciocho misiones de Senior Mode con semillas reproducibles y revisión humana honesta. Pulsa empezar y entrenemos criterio arquitectónico real.',
          visual: {
            kind: 'adr-radar',
            title: 'ARQPIXEL Quality & Pedagogical Honesty Gates',
            lines: [
              { prompt: '◈', text: '36 lecciones B01–A12 + Grafo DAG de 54 nodos', tone: 'cmd' },
              { text: '✓ 8 laboratorios locales (C4 C1–C3, DDD, OpenAPI, Sagas, ADR)', tone: 'ok' },
              { text: '✓ 18 misiones Senior · Semilla FNV-1a inmutable', tone: 'ok' },
              { text: '♛ Juicio abierto marcado honestamente como REQUIRES_REVIEW', tone: 'warn' },
            ],
          },
        },
      ],
    },
    audio_manifest,
  );
}

/** 2. Briefing Maestro en `#/senior` (`SENIOR-OVERVIEW`, 3 escenas, 2 voces Studio HD) */
export function buildSeniorOverviewDeck(audio_manifest?: AudioManifestCatalogSchema): CinemaDeck {
  return attachStudioAudio(
    {
      id: 'SENIOR-OVERVIEW',
      kicker: 'SENIOR MODE · BRIEFING DE PRODUCCIÓN',
      heading: 'Cómo enfrentar las 18 Misiones de Arquitectura Senior',
      ctaLabel: 'Abrir Taller S01',
      ctaHref: '#/taller-senior/S01',
      scenes: [
        {
          chapter: '01 · Restricciones',
          title: 'Sin recetas universales: tráfico, presupuesto, equipo y SLO',
          durationSec: 10,
          spriteId: 'arquibot-senior',
          aura: 'gold',
          speaker: 'host',
          speech:
            'Entramos a Senior Mode. Aquí ninguna respuesta es una receta mágica: cada decisión está atada a tráfico real, presupuesto, tamaño de equipo y objetivos SLO.',
          visual: {
            kind: 'c4-topology',
            mode: 'incident',
            nodes: [
              { label: 'Tráfico & Pico', sub: 'Semilla FNV-1a', state: 'hot' },
              { label: 'SLO & Coste', sub: 'Trade-off medible', state: 'normal' },
              { label: 'Capacidad Equipo', sub: 'Complejidad real', state: 'ok' },
            ],
            metricLabel: 'Criterio de evaluación Senior',
            metricBefore: 'Moda técnica ✗',
            metricAfter: 'Evidencia + Trade-off ✓',
          },
        },
        {
          chapter: '02 · 6 Retos + Fase 2',
          title: 'Diagnóstico, Architecture Builder y crisis encadenada',
          durationSec: 11,
          spriteId: 'arquibot-debug',
          aura: 'amber',
          speaker: 'mentor',
          speech:
            'En cada una de las dieciocho misiones resolverás seis retos conectados: diagnosticas la restricción dominante, modelas el grafo de componentes sin sobreingeniería y respondes a una crisis encadenada en Fase dos.',
          visual: {
            kind: 'event-lanes',
            mode: 'resilient',
            statusBadge: 'FLUJO SENIOR S01–S18 · DECISIONES CON CONSECUENCIA',
            laneA: {
              name: 'Fase 1 · Diseño',
              steps: ['01 Diagnóstico', '02 Grafo limpio', '03 Capacidad & STRIDE'],
            },
            laneB: {
              name: 'Fase 2 · Crisis',
              steps: ['04 Pico / Fallo red', '05 Mitigación SRE', '06 Dossier v2 MD/JSON'],
            },
          },
        },
        {
          chapter: '03 · Honestidad',
          title: 'Verificación determinista + Revisión humana REQUIRES_REVIEW',
          durationSec: 11,
          spriteId: 'arquibot-libro',
          aura: 'emerald',
          speaker: 'mentor',
          speech:
            'Nuestro motor verifica invariantes deterministas con total transparencia, mientras tu ADR conserva el estado REQUIRES_REVIEW para revisión humana experta, sin falsas aprobaciones automáticas.',
          visual: {
            kind: 'adr-radar',
            title: 'Contrato de 5 Estados Canónicos (ADR-0003)',
            lines: [
              { prompt: '✓', text: 'PASS / FAIL → Ciclos, capacidad, idempotencia y STRIDE', tone: 'ok' },
              { prompt: '⊘', text: 'BLOCKED / NOT_RUN → Dependencias previas sin ejecutar', tone: 'muted' },
              { prompt: '♛', text: 'REQUIRES_REVIEW → ADR abierto auditado por comité humano', tone: 'warn' },
            ],
          },
        },
      ],
    },
    audio_manifest,
  );
}

const CUSTOM_MODULE_DECKS: Readonly<Record<string, Omit<CinemaDeck, 'audio'>>> = {
  B01: {
    id: 'CLASS-B01',
    kicker: 'CLASE INTERACTIVA HD · B01',
    heading: 'B01 · ¿Qué es realmente arquitectura de software?',
    ctaLabel: 'Ir al taller 2/4',
    ctaScrollTarget: 'sec-workbench',
    scenes: [
      {
        chapter: '01 · La Duda',
        title: '¿Decisión arquitectónica o simple cambio local?',
        durationSec: 8,
        spriteId: 'arquibot-pensando',
        aura: 'amber',
        speaker: 'host',
        speech:
          'En nuestro primer módulo surge la duda clásica en NexoShop: ¿qué diferencia una decisión de arquitectura de cualquier cambio cotidiano en el código?',
        visual: {
          kind: 'c4-topology',
          mode: 'incident',
          nodes: [
            { label: 'Color de botón', sub: 'Cambio cosmético', state: 'normal' },
            { label: 'Límites de módulos', sub: 'Alto coste de giro', state: 'hot' },
            { label: 'Contrato de datos', sub: 'Afecta a 4 equipos', state: 'hot' },
          ],
          metricLabel: 'Coste de revertir la decisión en 6 meses',
          metricBefore: '5 minutos (UI)',
          metricAfter: 'Semanas (Fronteras) ⚠',
        },
      },
      {
        chapter: '02 · Fronteras',
        title: 'Separar Frontend, API y Dominio protege la evolución',
        durationSec: 11,
        spriteId: 'arquibot-diagrama',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'Cambiar el color de un botón es local y reversible en minutos. En cambio, definir las fronteras entre Frontend, API y Dominio condiciona cómo despliegas, cómo pruebas y cuánto cuesta evolucionar todo el sistema.',
        visual: {
          kind: 'dependency-rings',
          mode: 'clean',
          outerLayer: 'Frontend Web · Controladores HTTP',
          coreItems: [
            { name: 'API / Aplicación', rule: 'Valida intención y coordina', state: 'port' },
            { name: 'Dominio NexoShop', rule: 'Reglas de pedido y precio', state: 'ok' },
          ],
          infraTitle: 'Persistencia y Pasarela Externa aisladas tras contratos',
          infraNote: 'Cambiar proveedor de cobro no obliga a reescribir reglas de negocio.',
          badgeLabel: 'FRONTERAS EXPLÍCITAS · BAJO ACOPLAMIENTO',
        },
      },
      {
        chapter: '03 · Criterio',
        title: 'Proteger atributos de calidad y documentar trade-offs',
        durationSec: 11,
        spriteId: 'arquibot-idea',
        aura: 'emerald',
        speaker: 'mentor',
        speech:
          'Una buena arquitectura no busca complejidad: protege los atributos de calidad clave y documenta cada trade-off antes de que revertirlo sea costoso. Ahora ponlo a prueba en el taller práctico.',
        visual: {
          kind: 'adr-radar',
          title: 'Checklist de Decisión Arquitectónica · NexoShop',
          lines: [
            { prompt: '01', text: '¿Qué atributo de calidad protege? (latencia, cambio, fallo)', tone: 'cmd' },
            { prompt: '02', text: '✓ ¿Qué módulos quedan desacoplados gracias al límite?', tone: 'ok' },
            { prompt: '03', text: '⚠ ¿Qué trade-off o coste aceptamos conscientemente?', tone: 'warn' },
          ],
        },
      },
    ],
  },
  B02: {
    id: 'CLASS-B02',
    kicker: 'CLASE INTERACTIVA HD · B02',
    heading: 'B02 · De deseos ambiguos a escenarios de calidad medibles',
    ctaLabel: 'Ir al taller 2/4',
    ctaScrollTarget: 'sec-workbench',
    scenes: [
      {
        chapter: '01 · Ambigüedad',
        title: 'Por qué «que sea rápido y seguro» no es verificable',
        durationSec: 8,
        spriteId: 'arquibot-error',
        aura: 'amber',
        speaker: 'host',
        speech:
          'Cuando negocio nos pide que el checkout de NexoShop sea rápido y seguro, ¿por qué no podemos diseñar arquitectura directamente con esa frase?',
        visual: {
          kind: 'c4-topology',
          mode: 'incident',
          nodes: [
            { label: '«Que sea rápido»', sub: 'Sin umbral ni carga', state: 'hot' },
            { label: '«Nunca caiga»', sub: 'Coste infinito', state: 'hot' },
            { label: 'QA en producción', sub: 'Imposible validar', state: 'normal' },
          ],
          metricLabel: 'Verificabilidad del requisito',
          metricBefore: 'Subjetivo ✗',
          metricAfter: 'Escenario SLO ✓',
        },
      },
      {
        chapter: '02 · Escenario SLO',
        title: 'Estímulo, entorno, respuesta y umbral p95 medible',
        durationSec: 12,
        spriteId: 'arquibot-codigo',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'Porque un deseo ambiguo no se puede verificar. Como arquitecto traduces rápido en un escenario medible: el percentil noventa y cinco del checkout debe responder en menos de trescientos cincuenta milisegundos con quinientos usuarios concurrentes.',
        visual: {
          kind: 'arch-code-diff',
          file: 'docs/slo-checkout-nexoshop.yaml',
          before: ['requisito: "El proceso de compra debe ser muy rápido"'],
          after: [
            'estímulo: "500 clientes concurrentes confirmando pago"',
            'métrica_slo: "p95_latency_ms < 350 && error_rate < 0.5%"',
          ],
          callout: 'Un umbral numérico permite pruebas de carga automatizadas en CI',
        },
      },
      {
        chapter: '03 · Impacto',
        title: 'Los atributos de calidad moldean la topología real',
        durationSec: 8,
        spriteId: 'arquibot-exito',
        aura: 'emerald',
        speaker: 'mentor',
        speech:
          'Los requisitos funcionales definen qué hace el producto, pero los atributos de calidad medibles son los que dictan la forma real de tu arquitectura.',
        visual: {
          kind: 'event-lanes',
          mode: 'resilient',
          statusBadge: 'RF (COMPORTAMIENTO) VS RNF (FORMA ARQUITECTÓNICA)',
          laneA: {
            name: 'Funcional (RF)',
            steps: ['Crear pedido', 'Calcular impuestos', 'Emitir recibo'],
          },
          laneB: {
            name: 'Calidad (RNF)',
            steps: ['p95 < 350 ms', 'Disponibilidad 99.9%', 'RPO < 5 min'],
          },
        },
      },
    ],
  },
  B03: {
    id: 'CLASS-B03',
    kicker: 'CLASE INTERACTIVA HD · B03',
    heading: 'B03 · Componentes, módulos y responsabilidades',
    ctaLabel: 'Ir al taller 2/4',
    ctaScrollTarget: 'sec-workbench',
    scenes: [
      {
        chapter: '01 · Clase Dios',
        title: 'Cuando un cambio fiscal rompe el carrito de compras',
        durationSec: 10,
        spriteId: 'arquibot-error',
        aura: 'amber',
        speaker: 'host',
        speech:
          'En NexoShop metimos catálogo, cálculo de impuestos y envío de correos dentro de un mismo gestor de pedidos, y ahora cualquier ajuste fiscal rompe el carrito. ¿Qué falló?',
        visual: {
          kind: 'c4-topology',
          mode: 'incident',
          nodes: [
            { label: 'GodManager', sub: 'UI + SQL + Tributos', state: 'hot' },
            { label: 'Cambio Fiscal', sub: 'Choque de ramas', state: 'hot' },
            { label: 'Carrito Roto', sub: 'Efecto dominó', state: 'hot' },
          ],
          metricLabel: 'Módulos afectados por cambio de regla',
          metricBefore: '1 módulo ideal',
          metricAfter: '6 regresiones ⚠',
        },
      },
      {
        chapter: '02 · Cohesión',
        title: 'Alta cohesión por razón de cambio y contratos mínimos',
        durationSec: 11,
        spriteId: 'arquibot-codigo',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'Falló la cohesión. La alta cohesión agrupa lo que cambia por el mismo motivo de negocio, mientras el bajo acoplamiento comunica Catálogo, Pedidos y Facturación mediante contratos mínimos sin dependencias circulares.',
        visual: {
          kind: 'arch-code-diff',
          file: 'nexoshop-modules.ts',
          before: [
            'class EcommerceGodManager { renderHtmlAndSaveSqlAndSendTaxPdf(raw) }',
          ],
          after: [
            'type InvoiceRequest = { readonly order_id: string; readonly total: string }',
            'billingModule.emitInvoice(invoiceRequest) // contrato explícito',
          ],
          callout: 'Catálogo → Pedidos → Facturación sin ciclos ni tablas compartidas',
        },
      },
      {
        chapter: '03 · Equilibrio',
        title: 'Ni Clase Dios ni perdigonada de microarchivos vacíos',
        durationSec: 10,
        spriteId: 'arquibot-exito',
        aura: 'emerald',
        speaker: 'mentor',
        speech:
          'Tampoco caigas en el extremo opuesto de partir una regla simple en quince microarchivos vacíos. Mide tu diseño preguntando cuántos módulos debes tocar cuando cambia una sola regla de negocio.',
        visual: {
          kind: 'adr-radar',
          title: 'Termómetro de Cohesión y Acoplamiento · B03',
          lines: [
            { prompt: '✓', text: '1 cambio de negocio → 1 módulo cohesivo modificado', tone: 'ok' },
            { prompt: '✕', text: 'Evitar Clase Dios que mezcla HTML, SQL y facturación', tone: 'warn' },
            { prompt: '✕', text: 'Evitar 15 micro-archivos de 3 líneas («shotgun surgery»)', tone: 'muted' },
          ],
        },
      },
    ],
  },
  B04: {
    id: 'CLASS-B04',
    kicker: 'CLASE INTERACTIVA HD · B04',
    heading: 'B04 · Diagramas de arquitectura con el modelo C4',
    ctaLabel: 'Ir al taller 2/4',
    ctaScrollTarget: 'sec-workbench',
    scenes: [
      {
        chapter: '01 · Caos Visual',
        title: 'Actores humanos mezclados con índices B-Tree y flechas mudas',
        durationSec: 10,
        spriteId: 'arquibot-pensando',
        aura: 'amber',
        speaker: 'host',
        speech:
          'Dibujamos un diagrama gigante donde aparece el cliente humano conectado con una flecha que dice usa hacia un índice de PostgreSQL, y ningún equipo entiende nada. ¿Cómo lo ordenamos?',
        visual: {
          kind: 'c4-topology',
          mode: 'incident',
          nodes: [
            { label: 'Cliente Humano', sub: 'Nivel C1 Actor', state: 'normal' },
            { label: 'Flecha "usa"', sub: 'Sin protocolo', state: 'hot' },
            { label: 'idx_orders_btree', sub: 'Nivel C4 tabla', state: 'hot' },
          ],
          metricLabel: 'Tiempo de onboarding con el diagrama',
          metricBefore: '5 min claros',
          metricAfter: '45 min confusos ⚠',
        },
      },
      {
        chapter: '02 · Zoom C4',
        title: 'Contexto (C1) para actores · Contenedores (C2) para despliegue',
        durationSec: 12,
        spriteId: 'arquibot-diagrama',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'El modelo C4 funciona como un mapa con niveles de zoom según la audiencia. En Contexto C1 muestras personas y sistemas externos; al acercarte a Contenedores C2 revelas la web, la API, la base de datos y sus protocolos reales.',
        visual: {
          kind: 'event-lanes',
          mode: 'resilient',
          statusBadge: 'JERARQUÍA DE ZOOM C4 · UNA VISTA POR AUDIENCIA',
          laneA: {
            name: 'C1 · Contexto',
            steps: ['Comprador', 'Sistema NexoShop', 'Pasarela Pagos & Correo'],
          },
          laneB: {
            name: 'C2 · Contenedores',
            steps: ['SPA Web (HTTPS)', 'Orders API (JSON)', 'PostgreSQL (SQL)'],
          },
        },
      },
      {
        chapter: '03 · Contratos',
        title: 'Toda arista declara intención y protocolo verificable',
        durationSec: 10,
        spriteId: 'arquibot-exito',
        aura: 'emerald',
        speaker: 'mentor',
        speech:
          'Prohíbe las flechas mudas que solo dicen usa. Etiqueta siempre la intención y el protocolo concreto, y evita dibujar a mano el nivel de código que cambia en cada entrega.',
        visual: {
          kind: 'arch-code-diff',
          file: 'nexoshop-c2-containers.mmd',
          before: [
            'ClienteHumano -->|"usa"| idx_orders_btree',
          ],
          after: [
            'SpaWeb -->|"POST /v1/orders · HTTPS JSON"| OrdersApi',
            'OrdersApi -->|"TX ACID SQL"| OrdersPostgres',
          ],
          callout: 'Un diagrama C2 nítido alinea negocio, desarrollo y SRE en 5 minutos',
        },
      },
    ],
  },
  B05: {
    id: 'CLASS-B05',
    kicker: 'CLASE INTERACTIVA HD · B05',
    heading: 'B05 · Cliente-servidor, red y autoridad del dominio',
    ctaLabel: 'Ir al taller 2/4',
    ctaScrollTarget: 'sec-workbench',
    scenes: [
      {
        chapter: '01 · Frontera Web',
        title: '¿Podemos confiar en el precio calculado en el navegador?',
        durationSec: 10,
        spriteId: 'arquibot-error',
        aura: 'amber',
        speaker: 'host',
        speech:
          'En una compra web el navegador ya validó el stock y calculó el precio final con descuento. ¿Por qué no guardamos directamente ese total cuando llega el POST a pedidos?',
        visual: {
          kind: 'c4-topology',
          mode: 'incident',
          nodes: [
            { label: 'DevTools Cliente', sub: 'total: 0.01 USD', state: 'hot' },
            { label: 'POST /pedidos', sub: 'Confía sin validar', state: 'hot' },
            { label: 'Persistencia', sub: 'Fraude guardado', state: 'hot' },
          ],
          metricLabel: 'Autoridad sobre invariantes en cliente',
          metricBefore: 'UI amigable',
          metricAfter: '0% confiable ⚠',
        },
      },
      {
        chapter: '02 · Viaje HTTP',
        title: 'DNS, TLS, red inestable y validación autoritativa en servidor',
        durationSec: 12,
        spriteId: 'arquibot-laboratorio',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'Porque el navegador vive en un entorno controlado por terceros. Entre el clic del usuario y la base de datos cruzas DNS, TLS y red móvil inestable; la interfaz mejora la experiencia, pero solo el servidor y el dominio poseen autoridad.',
        visual: {
          kind: 'event-lanes',
          mode: 'resilient',
          statusBadge: 'FLUJO AUTORITATIVO POST /PEDIDOS · ZERO TRUST CLIENT',
          laneA: {
            name: 'Frontera Red',
            steps: ['1. DNS + TLS 1.3', '2. Auth & Rate Limit', '3. Valida Schema DTO'],
          },
          laneB: {
            name: 'Dominio Backend',
            steps: ['4. Lee precio real', '5. Verifica stock', '6. Commit ACID ✓'],
          },
        },
      },
      {
        chapter: '03 · Regla de Oro',
        title: 'El cliente expresa intención; el backend recalcula y protege',
        durationSec: 10,
        spriteId: 'arquibot-codigo',
        aura: 'emerald',
        speaker: 'mentor',
        speech:
          'Recibe únicamente identificadores y cantidades, recalcula importes en el backend y diseña pensando qué ocurre si la conexión se corta justo después de confirmar el pedido.',
        visual: {
          kind: 'arch-code-diff',
          file: 'orders-http-boundary.ts',
          before: [
            'const total = req.body.total; // vulnerable a manipulación',
          ],
          after: [
            'const total = calculateAuthoritativeTotal(dbPriceCents, dto.qty);',
          ],
          callout: 'Valida formato en el borde HTTP e invariantes dentro del Dominio',
        },
      },
    ],
  },
  B06: {
    id: 'CLASS-B06',
    kicker: 'CLASE INTERACTIVA HD · B06',
    heading: 'B06 · Arquitectura en capas e inversión de dependencias',
    ctaLabel: 'Ir al taller 2/4',
    ctaScrollTarget: 'sec-workbench',
    scenes: [
      {
        chapter: '01 · Fuga SQL',
        title: 'Cuatro carpetas con el Dominio atado al ORM y HTTP',
        durationSec: 10,
        spriteId: 'arquibot-error',
        aura: 'amber',
        speaker: 'host',
        speech:
          'Creamos cuatro carpetas llamadas Presentación, Aplicación, Dominio e Infraestructura, pero nuestras entidades de Dominio importan el ORM y leen cabeceras HTTP. ¿Eso sigue siendo arquitectura en capas?',
        visual: {
          kind: 'dependency-rings',
          mode: 'violation',
          outerLayer: 'Acoplamiento hacia afuera (Dominio contaminado)',
          coreItems: [
            { name: 'OrderEntity (Dominio)', rule: 'import PrismaClient', state: 'leak' },
            { name: 'CancelPolicy (Dominio)', rule: 'lee req.headers', state: 'leak' },
          ],
          infraTitle: 'PostgreSQL + Router HTTP',
          infraNote: 'Cualquier cambio de tabla u ORM obliga a reescribir las reglas de negocio.',
          badgeLabel: 'FUGA DE INFRAESTRUCTURA · Ce > 0 ⚠',
        },
      },
      {
        chapter: '02 · Inversión',
        title: 'Las dependencias apuntan hacia adentro (Dominio Ce = 0)',
        durationSec: 12,
        spriteId: 'arquibot-diagrama',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'Solo tienes cuatro carpetas, no fronteras reales. En Clean Architecture y Hexagonal las dependencias apuntan hacia adentro: el Dominio define puertos puros con acoplamiento saliente cero, y la Infraestructura se adapta a ellos.',
        visual: {
          kind: 'dependency-rings',
          mode: 'clean',
          outerLayer: 'Presentación & Infraestructura → Núcleo',
          coreItems: [
            { name: 'CancelOrderUseCase', rule: 'Orquesta OrderPort', state: 'port' },
            { name: 'Order Domain', rule: 'Invariantes puras · Ce = 0', state: 'ok' },
          ],
          infraTitle: 'SqlOrderRepo implements OrderPort',
          infraNote: 'Los detalles externos dependen de las abstracciones del negocio.',
          badgeLabel: 'CLEAN / HEXAGONAL · Ce = 0 ✓',
        },
      },
      {
        chapter: '03 · Pragmatismo',
        title: 'Pruebas en milisegundos sin burocracia innecesaria',
        durationSec: 10,
        spriteId: 'arquibot-exito',
        aura: 'emerald',
        speaker: 'mentor',
        speech:
          'Así ejecutas cientos de pruebas de negocio en milisegundos sin levantar bases de datos. Eso sí: aplica capas donde existan invariantes reales que proteger, no por burocracia en un script trivial.',
        visual: {
          kind: 'adr-radar',
          title: 'Regla de Oro en Arquitectura por Capas · B06',
          lines: [
            { prompt: '✓', text: 'Dominio libre de frameworks/ORM → tests unitarios en < 5 ms', tone: 'ok' },
            { prompt: '✓', text: 'Infraestructura → Dominio mediante inversión de dependencias', tone: 'cmd' },
            { prompt: '⚠', text: 'No crear 4 capas pasamanos vacías en un script de 80 líneas', tone: 'warn' },
          ],
        },
      },
    ],
  },
};

const CUSTOM_SENIOR_DECKS: Readonly<Record<string, Omit<CinemaDeck, 'audio'>>> = {
  S01: {
    id: 'SENIOR-S01',
    kicker: 'BRIEFING TÁCTICO HD · S01',
    heading: 'S01 · Auditoría y modularización incremental de monolito legado',
    ctaLabel: 'Resolver los 6 retos',
    ctaScrollTarget: 'senior-suite',
    scenes: [
      {
        chapter: '01 · Incidente',
        title: 'Despliegues frágiles y regresiones cruzadas en ventas',
        durationSec: 11,
        spriteId: 'arquibot-error',
        aura: 'amber',
        speaker: 'host',
        speech:
          'Incidente de producción S01: Auditoría de monolito legado. La aplicación de ventas sufre regresiones cruzadas en cada despliegue y negocio exige seguir entregando valor sin detener la operación.',
        visual: {
          kind: 'c4-topology',
          mode: 'incident',
          nodes: [
            { label: 'Monolito Ventas', sub: 'Tablas globales', state: 'hot' },
            { label: 'Deploy Semanal', sub: '38% rollbacks', state: 'hot' },
            { label: 'Operación Viva', sub: 'Prohibido parar', state: 'normal' },
          ],
          metricLabel: 'Tasa de fallos por cambio (CFR)',
          metricBefore: '38% regresiones ⚠',
          metricAfter: 'Meta < 5% con fronteras',
        },
      },
      {
        chapter: '02 · Estrategia',
        title: 'Observabilidad de hotspots + Aislamiento Strangler Fig',
        durationSec: 11,
        spriteId: 'arquibot-debug',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'Evita la trampa de reescribir todo desde cero. Primero instrumentamos observabilidad para medir puntos calientes y aislamos el dominio crítico con fronteras explícitas y migración incremental Strangler.',
        visual: {
          kind: 'arch-code-diff',
          file: 'nexoshop-legacy → modular-monolith (Strangler)',
          before: [
            '✕ Big-bang rewrite de 9 meses congelando features de negocio',
            '✕ Extraer microservicios a ciegas compartiendo la misma BD',
          ],
          after: [
            '✓ Trazar telemetría y mapa de acoplamiento real (hotspots)',
            '✓ Extraer Dominio aislado tras contratos con feature flags',
          ],
          callout: 'Componentes clave en S01: Dominio aislado + Observabilidad',
        },
      },
      {
        chapter: '03 · Entregable',
        title: 'Grafo limpio, margen de capacidad y ADR con rollback',
        durationSec: 10,
        spriteId: 'arquibot-senior',
        aura: 'gold',
        speaker: 'mentor',
        speech:
          'Tu misión en el taller es modelar un grafo limpio con Dominio aislado y Observabilidad, dimensionar capacidad con margen seguro y defender tu plan de reversión en el ADR.',
        visual: {
          kind: 'adr-radar',
          title: 'Evidencia Exigida · Misión S01',
          lines: [
            { prompt: '01', text: 'Grafo Fase 1: incluir Dominio aislado + Observabilidad sin ciclos', tone: 'ok' },
            { prompt: '02', text: 'Capacidad: cubrir pico RPS con holgura operativa defendible', tone: 'cmd' },
            { prompt: '03', text: 'ADR: justificar trade-offs y rollback (REQUIRES_REVIEW humano)', tone: 'warn' },
          ],
        },
      },
    ],
  },
  S02: {
    id: 'SENIOR-S02',
    kicker: 'BRIEFING TÁCTICO HD · S02',
    heading: 'S02 · SOLID bajo presión: motor de descuentos cambiante',
    ctaLabel: 'Resolver los 6 retos',
    ctaScrollTarget: 'senior-suite',
    scenes: [
      {
        chapter: '01 · Incidente',
        title: 'Campañas semanales que rompen planes existentes en producción',
        durationSec: 11,
        spriteId: 'arquibot-error',
        aura: 'amber',
        speaker: 'host',
        speech:
          'Misión Senior S02: SOLID bajo presión. Comercial lanza campañas nuevas cada semana y cada cambio en la función de descuentos rompe planes antiguos en producción. ¿Congelamos campañas o creamos veinte clases abstractas?',
        visual: {
          kind: 'c4-topology',
          mode: 'incident',
          nodes: [
            { label: 'discount() if/else', sub: '18 ramas mutables', state: 'hot' },
            { label: 'Campaña Semanal', sub: 'Rompe plan Gold', state: 'hot' },
            { label: 'Checkout Vivo', sub: 'Pérdida de margen', state: 'hot' },
          ],
          metricLabel: 'Regresiones en cobros por campaña',
          metricBefore: '4 incidentes/mes ⚠',
          metricAfter: '0 con política aislada ✓',
        },
      },
      {
        chapter: '02 · Estrategia',
        title: 'Aislar la variabilidad real con pruebas y sin sobreingeniería',
        durationSec: 11,
        spriteId: 'arquibot-codigo',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'Ni condicionales frágiles ni sobreingeniería especulativa. Aísla únicamente el eje real de variación detrás de una política de descuento componible, cubierta por pruebas de regresión y protegida con plan de rollback.',
        visual: {
          kind: 'arch-code-diff',
          file: 'pricing/discount-policy.ts',
          before: [
            '✕ Cascada gigante de if/else editada sin red de regresión',
            '✕ 20 fábricas abstractas especulativas sin variabilidad real',
          ],
          after: [
            '✓ Política componible por regla + suite de regresión gold/silver',
            '✓ Activación gradual con Plan de rollback inmediato',
          ],
          callout: 'Componentes clave en S02: Dominio aislado + Plan de rollback',
        },
      },
      {
        chapter: '03 · Entregable',
        title: 'Dominio aislado, Plan de rollback y criterio en el ADR',
        durationSec: 11,
        spriteId: 'arquibot-senior',
        aura: 'gold',
        speaker: 'mentor',
        speech:
          'En el taller conecta Dominio aislado y Plan de rollback sin añadir complejidad innecesaria, valida tus límites de capacidad y justifica en el ADR por qué descartaste abstracciones prematuras, sujeto a REQUIRES_REVIEW.',
        visual: {
          kind: 'adr-radar',
          title: 'Evidencia Exigida · Misión S02',
          lines: [
            { prompt: '01', text: 'Grafo Fase 1: Dominio aislado + Plan de rollback sin ciclos', tone: 'ok' },
            { prompt: '02', text: 'Code Review: parametrizar estrategias con fixtures verificables', tone: 'cmd' },
            { prompt: '03', text: 'ADR: defender SOLID pragmático vs sobreingeniería (REQUIRES_REVIEW)', tone: 'warn' },
          ],
        },
      },
    ],
  },
};

/**
 * Builds an interactive `CinemaDeck` for any of the 36 curriculum modules (`B01–A12`).
 * Uses handcrafted 2-voice Studio HD scripts when available and deterministic domain boards otherwise.
 */
export function buildModuleCinemaDeck(
  mod: ModuleSchema,
  audio_manifest?: AudioManifestCatalogSchema,
): CinemaDeck {
  const custom = CUSTOM_MODULE_DECKS[mod.id];
  if (custom) {
    return attachStudioAudio(custom, audio_manifest);
  }

  const enrichment = getLessonEnrichment(mod.id);
  const aura: CinemaAuraTheme =
    mod.level === 'Básico' ? 'emerald' : mod.level === 'Intermedio' ? 'sky' : 'violet';

  const nodes = enrichment
    ? enrichment.nodes.slice(0, 3).map((n, idx) => ({
        label: n.label,
        sub: n.role,
        state: (idx === 1 ? 'ok' : 'normal') as 'normal' | 'ok',
      }))
    : [
        { label: 'Contexto', sub: mod.id, state: 'normal' as const },
        { label: mod.title.slice(0, 22), sub: mod.level, state: 'ok' as const },
        { label: 'Verificación', sub: 'Métrica real', state: 'normal' as const },
      ];

  const deck: CinemaDeck = {
    id: `CLASS-${mod.id}`,
    kicker: `RESUMEN ANIMADO · MÓDULO ${mod.id}`,
    heading: `${mod.id} · ${mod.title}`,
    ctaLabel: 'Ir al taller 2/4',
    ctaScrollTarget: 'sec-workbench',
    scenes: [
      {
        chapter: '01 · Problema',
        title: mod.title,
        durationSec: 9,
        spriteId: 'arquibot-pensando',
        aura,
        speaker: 'host',
        speech: `Módulo ${mod.id}: ${mod.title}. En NexoShop nos enfrentamos a este reto: ${mod.example}`,
        visual: {
          kind: 'c4-topology',
          mode: 'mitigated',
          nodes,
          metricLabel: `Foco ${mod.level}`,
          metricBefore: 'Intuición',
          metricAfter: 'Criterio medible ✓',
        },
      },
      {
        chapter: '02 · Diseño',
        title: enrichment?.diagramTitle ?? 'Estructura y código defendible',
        durationSec: 11,
        spriteId: 'arquibot-codigo',
        aura: 'sky',
        speaker: 'mentor',
        speech: `${mod.lesson} ${mod.reason ?? ''}`.trim(),
        visual: enrichment
          ? {
              kind: 'arch-code-diff',
              file: `${mod.id.toLowerCase()}-nexoshop.ts`,
              before: firstLines(enrichment.badCodeTs, 2),
              after: firstLines(enrichment.goodCodeTs, 2),
              callout: enrichment.goodTitle,
            }
          : {
              kind: 'adr-radar',
              title: `${mod.id} · Principio estructural`,
              lines: [
                { prompt: '◈', text: mod.concept, tone: 'cmd' },
                { prompt: '✓', text: mod.explanation, tone: 'ok' },
              ],
            },
      },
      {
        chapter: '03 · Verificación',
        title: mod.comparison ?? 'Cómo comprobar la decisión',
        durationSec: 9,
        spriteId: 'arquibot-exito',
        aura: 'emerald',
        speaker: 'mentor',
        speech: `Para validarlo en ingeniería real: ${mod.metric ?? mod.explanation}`,
        visual: {
          kind: 'adr-radar',
          title: `Verificación práctica · ${mod.id}`,
          lines: [
            { prompt: '✓', text: mod.metric ?? mod.explanation, tone: 'ok' },
            { prompt: '⚡', text: enrichment?.counterexample ?? `Actividad: ${mod.activity}`, tone: 'warn' },
          ],
        },
      },
    ],
  };

  return attachStudioAudio(deck, audio_manifest);
}

/**
 * Builds a tactical `CinemaDeck` briefing for any of the 18 Senior missions (`S01–S18`).
 */
export function buildSeniorMissionCinemaDeck(
  mission: MissionSchema,
  playbook?: SeniorPlaybookSummary,
  audio_manifest?: AudioManifestCatalogSchema,
): CinemaDeck {
  const custom = CUSTOM_SENIOR_DECKS[mission.id];
  if (custom) {
    return attachStudioAudio(custom, audio_manifest);
  }

  const req_pair = playbook?.required ?? ['Dominio aislado', 'Observabilidad'];
  const deck: CinemaDeck = {
    id: `SENIOR-${mission.id}`,
    kicker: `BRIEFING TÁCTICO · ${mission.id}`,
    heading: `${mission.id} · ${mission.title}`,
    ctaLabel: 'Abrir taller 6 retos',
    ctaHref: `#/taller-senior/${mission.id}`,
    scenes: [
      {
        chapter: '01 · Incidente',
        title: mission.title,
        durationSec: 9,
        spriteId: 'arquibot-error',
        aura: 'amber',
        speaker: 'host',
        speech: `Misión Senior ${mission.id}: ${mission.title}. Escenario: ${mission.brief}. Decisión crítica: ${mission.decision}.`,
        visual: {
          kind: 'c4-topology',
          mode: 'incident',
          nodes: [
            { label: mission.id, sub: mission.brief.slice(0, 24), state: 'hot' },
            { label: req_pair[0], sub: 'Componente clave', state: 'ok' },
            { label: req_pair[1], sub: 'Salvaguarda SRE', state: 'ok' },
          ],
          metricLabel: playbook?.failureMode ?? 'Riesgo operativo activo',
          metricBefore: 'Vulnerable ⚠',
          metricAfter: 'Controlado ✓',
        },
      },
      {
        chapter: '02 · Arquitectura',
        title: playbook?.focus ?? mission.decision,
        durationSec: 10,
        spriteId: 'arquibot-senior',
        aura: 'gold',
        speaker: 'mentor',
        speech: `Foco arquitectónico: ${playbook?.focus ?? mission.decision}. Investiga primero: ${playbook?.investigation ?? mission.evidence}.`,
        visual: {
          kind: 'event-lanes',
          mode: 'resilient',
          statusBadge: `ESENCIALES: ${req_pair.join(' + ').toUpperCase()}`,
          laneA: {
            name: 'Investigación',
            steps: [playbook?.investigation ?? 'Medir cuello de botella', `Integrar ${req_pair[0]}`],
          },
          laneB: {
            name: 'Verificación',
            steps: [`Asegurar ${req_pair[1]}`, playbook?.verification ?? 'Validar SLO y rollback'],
          },
        },
      },
      {
        chapter: '03 · Evidencia ADR',
        title: playbook?.artifact ?? 'Entregable verificable',
        durationSec: 9,
        spriteId: 'arquibot-libro',
        aura: 'emerald',
        speaker: 'mentor',
        speech: `Entregable esperado: ${playbook?.artifact ?? mission.evidence}. Recuerda documentar riesgos y plan de verificación para revisión humana.`,
        visual: {
          kind: 'adr-radar',
          title: `Criterios de Aceptación · ${mission.id}`,
          lines: [
            { prompt: '⬡', text: `Esenciales: ${req_pair.join(' + ')}`, tone: 'ok' },
            { prompt: '▤', text: `Artefacto: ${playbook?.artifact ?? mission.evidence}`, tone: 'cmd' },
            { prompt: '♛', text: 'ADR evaluado estructuralmente + REQUIRES_REVIEW humano', tone: 'warn' },
          ],
        },
      },
    ],
  };

  return attachStudioAudio(deck, audio_manifest);
}
