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
  B07: {
    id: 'CLASS-B07',
    kicker: 'CLASE INTERACTIVA HD · B07',
    heading: 'B07 · MVC y separación de responsabilidades sin Fat Controllers',
    ctaLabel: 'Ir al taller 2/4',
    ctaScrollTarget: 'sec-workbench',
    scenes: [
      {
        chapter: '01 · Fat Controller',
        title: 'Controladores obesos con SQL directo y reglas atrapadas',
        durationSec: 11,
        spriteId: 'arquibot-error',
        aura: 'amber',
        speaker: 'host',
        speech:
          'Adoptamos MVC en NexoShop, pero ahora el controlador de reservas valida cabeceras HTTP, calcula penalizaciones horarias y ejecuta consultas SQL directas. ¿Por qué nos cuesta tanto reutilizar esa lógica?',
        visual: {
          kind: 'c4-topology',
          mode: 'incident',
          nodes: [
            { label: 'BookingController', sub: 'HTTP + Penalidad + SQL', state: 'hot' },
            { label: 'Job Nocturno', sub: 'Duplica cálculo', state: 'hot' },
            { label: 'Consola Admin', sub: 'Regla divergente', state: 'hot' },
          ],
          metricLabel: 'Reutilización fuera de HTTP',
          metricBefore: '1 regla única',
          metricAfter: '3 copias rotas ⚠',
        },
      },
      {
        chapter: '02 · Delegación',
        title: 'MVC organiza la entrega; el Dominio protege las reglas',
        durationSec: 13,
        spriteId: 'arquibot-codigo',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'Porque cayó en el antipatrón del controlador obeso. MVC solo separa la entrega visual y la entrada HTTP, pero las reglas de negocio deben vivir en casos de uso y entidades reutilizables desde web, trabajos programados o línea de comandos.',
        visual: {
          kind: 'arch-code-diff',
          file: 'booking-controller.ts',
          before: [
            'if (hoursLeft < 24) await db.query("UPDATE bookings SET fee = 50 ...")',
          ],
          after: [
            'await cancelBookingUseCase.execute({ bookingId, cancelledAt });',
            'return { status: 200 }; // reutilizable en HTTP, Cron y CLI',
          ],
          callout: 'El controlador traduce transporte; el caso de uso coordina negocio',
        },
      },
      {
        chapter: '03 · Frontera Limpia',
        title: 'Controlador delgado sin clases utilitarias gigantes',
        durationSec: 11,
        spriteId: 'arquibot-exito',
        aura: 'emerald',
        speaker: 'mentor',
        speech:
          'Mantén el controlador delgado: traduce la petición, delega la decisión al dominio y devuelve la respuesta sin mezclar infraestructura ni trasladar todo el desorden a una clase utilitaria gigante.',
        visual: {
          kind: 'adr-radar',
          title: 'Checklist Anti-Fat-Controller · B07',
          lines: [
            { prompt: '✓', text: 'Controller: parsea entrada, invoca caso de uso y formatea HTTP', tone: 'ok' },
            { prompt: '✓', text: 'Dominio: aplica penalizaciones e invariantes de reserva', tone: 'cmd' },
            { prompt: '✕', text: 'Prohibido mover todo a un BookingHelper estático de 3.000 líneas', tone: 'warn' },
          ],
        },
      },
    ],
  },
  B08: {
    id: 'CLASS-B08',
    kicker: 'CLASE INTERACTIVA HD · B08',
    heading: 'B08 · POO para arquitectos: composición e invariantes',
    ctaLabel: 'Ir al taller 2/4',
    ctaScrollTarget: 'sec-workbench',
    scenes: [
      {
        chapter: '01 · Herencia Rígida',
        title: 'Explosión combinatoria de subclases acopladas',
        durationSec: 11,
        spriteId: 'arquibot-error',
        aura: 'amber',
        speaker: 'host',
        speech:
          'Para modelar pedidos VIP, envíos exprés y promociones internacionales creamos una jerarquía de herencia de doce niveles, y cada nueva combinación rompe las subclases vecinas. ¿Qué alternativa tenemos en POO?',
        visual: {
          kind: 'c4-topology',
          mode: 'incident',
          nodes: [
            { label: 'OrderBase', sub: '12 niveles extends', state: 'hot' },
            { label: 'VipExpressIntl', sub: 'Subclase frágil', state: 'hot' },
            { label: 'Nueva Promo', sub: 'Rompe árbol', state: 'hot' },
          ],
          metricLabel: 'Subclases requeridas al combinar rasgos',
          metricBefore: '3 políticas limpias',
          metricAfter: '24 subclases ⚠',
        },
      },
      {
        chapter: '02 · Composición',
        title: 'Políticas pequeñas e intercambiables inyectadas por contrato',
        durationSec: 12,
        spriteId: 'arquibot-codigo',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'Sustituye la herencia profunda por composición e interfaces pequeñas. En lugar de multiplicar subclases rígidas, inyecta políticas intercambiables de precios, impuestos y envío dentro de un servicio coordinador.',
        visual: {
          kind: 'arch-code-diff',
          file: 'checkout-composition.ts',
          before: [
            'class VipExpressInternationalHolidayOrder extends VipExpressOrder {}',
          ],
          after: [
            'type PricingPolicy = (subtotalCents: number) => number;',
            'type ShippingPolicy = (weightGrams: number) => number;',
          ],
          callout: 'Combinas N variantes en tiempo de ejecución sin duplicar clases',
        },
      },
      {
        chapter: '03 · Invariantes',
        title: 'Entidades ricas frente a bolsas de datos anémicas',
        durationSec: 11,
        spriteId: 'arquibot-diagrama',
        aura: 'emerald',
        speaker: 'mentor',
        speech:
          'Además, evita objetos anémicos llenos de setters públicos que permiten estados inválidos. Encapsula las transiciones dentro de métodos del dominio que protejan siempre sus precondiciones.',
        visual: {
          kind: 'dependency-rings',
          mode: 'clean',
          outerLayer: 'API Pública del Agregado Reserva',
          coreItems: [
            { name: 'booking.confirm()', rule: 'Valida cupo y pago previo', state: 'ok' },
            { name: 'booking.cancel(now)', rule: 'Impide cancelar tras check-in', state: 'port' },
          ],
          infraTitle: 'Cero setters arbitrarios (status = ...)',
          infraNote: 'Ningún consumidor externo puede forzar estados inconsistentes.',
          badgeLabel: 'ENCAPSULACIÓN DE INVARIANTES ✓',
        },
      },
    ],
  },
  B09: {
    id: 'CLASS-B09',
    kicker: 'CLASE INTERACTIVA HD · B09',
    heading: 'B09 · Cohesión, acoplamiento y estabilidad modular',
    ctaLabel: 'Ir al taller 2/4',
    ctaScrollTarget: 'sec-workbench',
    scenes: [
      {
        chapter: '01 · Efecto Cadena',
        title: 'Cuando un cambio de banner obliga a redesplegar contabilidad',
        durationSec: 10,
        spriteId: 'arquibot-error',
        aura: 'amber',
        speaker: 'host',
        speech:
          'Nuestro módulo contable importa colores de campañas promocionales de la interfaz, y cada vez que marketing cambia un banner tenemos que volver a probar y desplegar contabilidad. ¿Cómo evitamos ese arrastre?',
        visual: {
          kind: 'dependency-rings',
          mode: 'violation',
          outerLayer: 'Dependencia invertida hacia módulo volátil',
          coreItems: [
            { name: 'Núcleo Contabilidad', rule: 'import PromoBannerHex', state: 'leak' },
            { name: 'Cálculo Tributario', rule: 'Recompila por UI', state: 'leak' },
          ],
          infraTitle: 'Campañas Marketing UI (Cambia diario)',
          infraNote: 'Un módulo crítico depende de uno altamente inestable (I ≈ 1).',
          badgeLabel: 'ACOPLAMIENTO ACCIDENTAL · SDP ROTO ⚠',
        },
      },
      {
        chapter: '02 · Estabilidad',
        title: 'Depender siempre en dirección a mayor estabilidad (I → 0)',
        durationSec: 11,
        spriteId: 'arquibot-diagrama',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'Aplicando el principio de dependencias estables. Los módulos centrales que muchos consumen deben tener acoplamiento saliente mínimo y contratos estables, nunca depender de módulos volátiles de presentación.',
        visual: {
          kind: 'dependency-rings',
          mode: 'clean',
          outerLayer: 'Bordes Volátiles (I ≈ 1) → Núcleo Estable (I = 0)',
          coreItems: [
            { name: 'Núcleo Moneda & Ledger', rule: 'Ca alto · Ce = 0 · I = 0', state: 'ok' },
            { name: 'Casos de Uso Pedido', rule: 'Consume contrato estable', state: 'port' },
          ],
          infraTitle: 'Checkout & Banners UI dependen del Núcleo',
          infraNote: 'Marketing despliega 10 veces al día sin tocar contabilidad.',
          badgeLabel: 'STABLE DEPENDENCIES PRINCIPLE ✓',
        },
      },
      {
        chapter: '03 · Contrato Mínimo',
        title: 'Bordes rápidos, núcleo estable y radio de impacto acotado',
        durationSec: 10,
        spriteId: 'arquibot-exito',
        aura: 'emerald',
        speaker: 'mentor',
        speech:
          'Los bordes visuales cambian rápido y el núcleo monetario cambia lento. Publica únicamente contratos pequeños y explícitos entre módulos para contener el radio de impacto de cada entrega.',
        visual: {
          kind: 'event-lanes',
          mode: 'resilient',
          statusBadge: 'VELOCIDAD DE CAMBIO DIFERENCIADA POR FRONTERA',
          laneA: {
            name: 'Borde UI (Rápido)',
            steps: ['Banners diarios', 'Tests A/B visuales', '0 impacto fiscal'],
          },
          laneB: {
            name: 'Núcleo (Estable)',
            steps: ['Reglas exactas centavos', 'Contrato mínimo', 'Alta cobertura ✓'],
          },
        },
      },
    ],
  },
  B10: {
    id: 'CLASS-B10',
    kicker: 'CLASE INTERACTIVA HD · B10',
    heading: 'B10 · Introducción pragmática a los principios SOLID',
    ctaLabel: 'Ir al taller 2/4',
    ctaScrollTarget: 'sec-workbench',
    scenes: [
      {
        chapter: '01 · Dogma vs Valor',
        title: '¿Una interfaz por cada clase aunque solo sume dos números?',
        durationSec: 10,
        spriteId: 'arquibot-pensando',
        aura: 'amber',
        speaker: 'host',
        speech:
          'Al empezar a aplicar SOLID en el equipo surgió el debate: ¿debemos crear una interfaz por cada clase del proyecto, incluso para funciones internas que solo suman dos importes?',
        visual: {
          kind: 'c4-topology',
          mode: 'incident',
          nodes: [
            { label: 'ISumHelper', sub: '1 implementación', state: 'hot' },
            { label: 'SumHelperImpl', sub: 'Sin I/O ni variación', state: 'hot' },
            { label: 'SumFactory', sub: 'Indirección inútil', state: 'hot' },
          ],
          metricLabel: 'Archivos para una operación pura',
          metricBefore: '1 función clara',
          metricAfter: '4 archivos vacíos ⚠',
        },
      },
      {
        chapter: '02 · SRP y DIP',
        title: 'Separar motivos de cambio e invertir fronteras de I/O',
        durationSec: 12,
        spriteId: 'arquibot-codigo',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'Nunca por dogma. SRP separa actores con distintos motivos de cambio, y DIP invierte dependencias justo en las fronteras de entrada y salida, como repositorios o pasarelas externas, para probar el negocio en aislamiento.',
        visual: {
          kind: 'arch-code-diff',
          file: 'solid-boundaries.ts',
          before: [
            'interface IAdditionHelper { add(a: number, b: number): number } // ruido',
          ],
          after: [
            'function addCents(a: number, b: number): number { return a + b; }',
            'interface PaymentGatewayPort { charge(cmd: ChargeCmd): Promise<Receipt> }',
          ],
          callout: 'Abstrae fronteras externas o ejes reales de variación, no funciones puras',
        },
      },
      {
        chapter: '03 · Criterio YAGNI',
        title: 'SOLID como bisturí frente al cambio, nunca como burocracia',
        durationSec: 10,
        spriteId: 'arquibot-exito',
        aura: 'emerald',
        speaker: 'mentor',
        speech:
          'Crear interfaces vacías donde no existe variación ni infraestructura solo duplica archivos y oscurece la lectura. Usa SOLID como bisturí frente al cambio real, no como burocracia preventiva.',
        visual: {
          kind: 'adr-radar',
          title: 'Brújula Pragmática SOLID · B10',
          lines: [
            { prompt: '✓', text: 'SRP: un módulo responde ante un único actor o razón de cambio', tone: 'ok' },
            { prompt: '✓', text: 'DIP: el caso de uso define el puerto; SMTP/SQL lo implementan', tone: 'cmd' },
            { prompt: '⚠', text: 'YAGNI: sin segundo proveedor ni I/O, prefiere código directo', tone: 'warn' },
          ],
        },
      },
    ],
  },
  B11: {
    id: 'CLASS-B11',
    kicker: 'CLASE INTERACTIVA HD · B11',
    heading: 'B11 · Introducción a patrones: solución contextual vs moda',
    ctaLabel: 'Ir al taller 2/4',
    ctaScrollTarget: 'sec-workbench',
    scenes: [
      {
        chapter: '01 · Patrón por Moda',
        title: 'Cuando un Singleton mutable rompe pruebas y filtra carritos',
        durationSec: 11,
        spriteId: 'arquibot-error',
        aura: 'amber',
        speaker: 'host',
        speech:
          'Un compañero leyó un libro de patrones GoF y metió un Singleton global mutable para el carrito de compras, y ahora las pruebas fallan al azar y se cruzan datos entre usuarios. ¿Qué salió mal?',
        visual: {
          kind: 'c4-topology',
          mode: 'incident',
          nodes: [
            { label: 'GLOBAL_CART', sub: 'Singleton mutable', state: 'hot' },
            { label: 'Petición Ana', sub: 'Pisa estado', state: 'hot' },
            { label: 'Petición Luis', sub: 'Lee carrito ajeno', state: 'hot' },
          ],
          metricLabel: 'Aislamiento entre peticiones y tests',
          metricBefore: '100% determinista',
          metricAfter: 'Fuga cruzada ⚠',
        },
      },
      {
        chapter: '02 · Fuerzas y Coste',
        title: 'Strategy, Adapter y Observer responden a fuerzas distintas',
        durationSec: 13,
        spriteId: 'arquibot-codigo',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'Aplicó un patrón sin diagnosticar las fuerzas del problema. Un patrón nunca es un adorno obligatorio: Strategy intercambia algoritmos, Adapter traduce contratos incompatibles y Observer desacopla notificaciones, siempre pagando una capa extra.',
        visual: {
          kind: 'arch-code-diff',
          file: 'pattern-forces.ts',
          before: [
            'export const GLOBAL_MUTABLE_CART = { items: [] }; // estado global',
          ],
          after: [
            'mapVendorCodeToStatus(code): "AUTHORIZED" | "DECLINED" // Adapter',
            'calculateFee(order, activeFeeStrategy) // Strategy explícita',
          ],
          callout: 'Cada patrón exige justificar el problema real y su coste de indirección',
        },
      },
      {
        chapter: '03 · Regla de Adopción',
        title: 'Nombrar dolor, coste asumido y alternativa simple descartada',
        durationSec: 10,
        spriteId: 'arquibot-exito',
        aura: 'emerald',
        speaker: 'mentor',
        speech:
          'Antes de introducir cualquier patrón nombra qué dolor real resuelve, qué coste operativo añade y qué alternativa directa descartaste. Si una función simple basta, elige siempre la claridad.',
        visual: {
          kind: 'adr-radar',
          title: 'Filtro de Adopción de Patrones · B11',
          lines: [
            { prompt: '01', text: '¿Qué fuerza recurrente existe hoy (variación, SDK ajeno, evento)?', tone: 'ok' },
            { prompt: '02', text: '¿Compensa la capa extra frente a una función pura directa?', tone: 'cmd' },
            { prompt: '03', text: 'Prohibido usar Singleton mutable para estado de sesión/negocio', tone: 'warn' },
          ],
        },
      },
    ],
  },
  B12: {
    id: 'CLASS-B12',
    kicker: 'PROYECTO INTEGRADOR HD · B12',
    heading: 'B12 · Proyecto Básico: App de reservas defendible de extremo a extremo',
    ctaLabel: 'Ir al taller 2/4',
    ctaScrollTarget: 'sec-workbench',
    scenes: [
      {
        chapter: '01 · Doble Reserva',
        title: 'Deshabilitar un botón en UI no impide colisiones concurrentes',
        durationSec: 11,
        spriteId: 'arquibot-error',
        aura: 'amber',
        speaker: 'host',
        speech:
          'Llegamos al proyecto integrador básico: una aplicación de reservas médicas. Si solo deshabilitamos el botón en el navegador, dos pacientes que pulsan al mismo segundo reservan el mismo consultorio. ¿Cómo lo blindamos?',
        visual: {
          kind: 'c4-topology',
          mode: 'incident',
          nodes: [
            { label: 'Paciente A y B', sub: 'Clic simultáneo', state: 'hot' },
            { label: 'Solo check UI', sub: 'Condición carrera', state: 'hot' },
            { label: 'Consultorio 04', sub: 'Doble cita 10:00', state: 'hot' },
          ],
          metricLabel: 'Conflictos de agenda bajo concurrencia',
          metricBefore: '0 solapamientos',
          metricAfter: 'Doble reserva ⚠',
        },
      },
      {
        chapter: '02 · Defensa en Capas',
        title: 'C4 Contenedores + Regla pura en Dominio + Constraint en BD',
        durationSec: 12,
        spriteId: 'arquibot-diagrama',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'Integrando todo lo aprendido en el nivel Básico: modelas contenedores C2 claros, validas la regla pura de solapamiento horario en el Dominio y respaldas la escritura con una restricción atómica en PostgreSQL.',
        visual: {
          kind: 'event-lanes',
          mode: 'resilient',
          statusBadge: 'ARQUITECTURA DE RESERVAS · CIERRE NIVEL BÁSICO (12/12)',
          laneA: {
            name: 'Diseño C2 + Dominio',
            steps: ['Web Agenda → API', 'ReserveSlotUseCase', 'slotsOverlap() puro'],
          },
          laneB: {
            name: 'Garantía Atómica',
            steps: ['TX ACID PostgreSQL', 'Constraint único horario', '0 doble reserva ✓'],
          },
        },
      },
      {
        chapter: '03 · Cierre con ADR',
        title: 'Requisitos medibles, fronteras claras y riesgos explícitos',
        durationSec: 11,
        spriteId: 'arquibot-graduado',
        aura: 'gold',
        speaker: 'mentor',
        speech:
          'Un diseño básico completo cierra con un ADR honesto donde declaras tus requisitos medibles, límites de módulos, riesgos de concurrencia y cómo verificarás que nunca ocurran reservas duplicadas.',
        visual: {
          kind: 'adr-radar',
          title: 'Entregable Integrador Básico · B12',
          lines: [
            { prompt: '✓', text: 'Escenario medible: p95 < 300 ms y 0 colisiones concurrentes', tone: 'ok' },
            { prompt: '✓', text: 'Diagrama C4 (C1/C2) + capas con Dominio libre de SQL', tone: 'cmd' },
            { prompt: '♛', text: 'ADR documentando trade-offs y prueba de concurrencia real', tone: 'warn' },
          ],
        },
      },
    ],
  },
  I01: {
    id: 'CLASS-I01',
    kicker: 'CLASE INTERACTIVA HD · I01',
    heading: 'I01 · SOLID aplicado: ISP, LSP y contratos sin sorpresas',
    ctaLabel: 'Ir al taller 2/4',
    ctaScrollTarget: 'sec-workbench',
    scenes: [
      {
        chapter: '01 · Interfaz Gigante',
        title: 'Réplicas de lectura forzadas a lanzar errores NotImplemented',
        durationSec: 12,
        spriteId: 'arquibot-error',
        aura: 'amber',
        speaker: 'host',
        speech:
          'Abrimos el nivel Intermedio con un fallo real en producción: creamos un único repositorio gigante de pedidos, y cuando la réplica de solo lectura intenta implementarlo lanza errores de método NotImplemented. ¿Qué principio rompimos?',
        visual: {
          kind: 'dependency-rings',
          mode: 'violation',
          outerLayer: 'Contrato obeso que fuerza métodos ilegales',
          coreItems: [
            { name: 'OrderGiantRepo', rule: 'read + save + purgeAll()', state: 'leak' },
            { name: 'ReadOnlyReplica', rule: 'throw NotImplemented!', state: 'leak' },
          ],
          infraTitle: 'Crash en runtime al sustituir implementación',
          infraNote: 'Obligar a implementar métodos no soportados rompe ISP y LSP.',
          badgeLabel: 'VIOLACIÓN ISP + LSP · 500 RUNTIME ⚠',
        },
      },
      {
        chapter: '02 · ISP + LSP',
        title: 'Segregar puertos de lectura y escritura por consumidor',
        durationSec: 12,
        spriteId: 'arquibot-codigo',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'Rompiste ISP y LSP a la vez. Segrega contratos pequeños enfocados en cada consumidor, separando puertos de consulta y puertos de escritura para que cualquier implementación cumpla su promesa sin lanzar sorpresas en ejecución.',
        visual: {
          kind: 'arch-code-diff',
          file: 'ports/order-segregated.ports.ts',
          before: [
            'class ReadOnlyReplica { deleteAll() { throw Error("NotImplemented") } }',
          ],
          after: [
            'interface OrderReadPort { findById(id: string): Promise<OrderView | null> }',
            'interface OrderWritePort { save(order: Order): Promise<void> }',
          ],
          callout: 'Cada consumidor depende únicamente de las operaciones que utiliza',
        },
      },
      {
        chapter: '03 · DIP Real',
        title: 'Contratos del dominio frente a contenedores IoC cosméticos',
        durationSec: 11,
        spriteId: 'arquibot-exito',
        aura: 'violet',
        speaker: 'mentor',
        speech:
          'Recuerda además que invertir dependencias con DIP es diseñar contratos propiedad del dominio, no simplemente registrar veinte clases concretas en un contenedor IoC manteniendo acoplado el ORM.',
        visual: {
          kind: 'adr-radar',
          title: 'Auditoría SOLID Nivel Intermedio · I01',
          lines: [
            { prompt: '✓', text: 'ISP: puertos cohesivos separados por rol (lectura vs comando)', tone: 'ok' },
            { prompt: '✓', text: 'LSP: todo subtipo respeta precondiciones y postcondiciones', tone: 'cmd' },
            { prompt: '⚠', text: 'DIP ≠ IoC mágico: el contrato pertenece al negocio, no al ORM', tone: 'warn' },
          ],
        },
      },
    ],
  },
  I02: {
    id: 'CLASS-I02',
    kicker: 'CLASE INTERACTIVA HD · I02',
    heading: 'I02 · Patrones creacionales: Factory Method y Builder con invariantes',
    ctaLabel: 'Ir al taller 2/4',
    ctaScrollTarget: 'sec-workbench',
    scenes: [
      {
        chapter: '01 · Objeto a Medias',
        title: 'Pedidos con importe negativo creados por setters sueltos',
        durationSec: 12,
        spriteId: 'arquibot-error',
        aura: 'amber',
        speaker: 'host',
        speech:
          'En NexoShop creamos cupones y pedidos con constructores vacíos seguidos de ocho setters opcionales, y a mitad del flujo circulan pedidos con importe negativo y sin líneas. ¿Cómo garantizamos que nazcan válidos?',
        visual: {
          kind: 'c4-topology',
          mode: 'incident',
          nodes: [
            { label: 'new Order()', sub: 'Estado vacío', state: 'hot' },
            { label: '8 setters sueltos', sub: 'total = -50', state: 'hot' },
            { label: 'Facturación', sub: 'Falla tarde', state: 'hot' },
          ],
          metricLabel: 'Entidades corruptas circulando en memoria',
          metricBefore: '0 posibles',
          metricAfter: 'Estados inválidos ⚠',
        },
      },
      {
        chapter: '02 · Factory vs Builder',
        title: 'Fábricas para variantes válidas · Builder para ensamblaje complejo',
        durationSec: 12,
        spriteId: 'arquibot-codigo',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'Encapsulando su nacimiento. Usa una fábrica de dominio o Factory Method cuando debas elegir e inicializar variantes válidas, y aplica Builder cuando ensambles configuraciones complejas paso a paso validando todo al construir.',
        visual: {
          kind: 'arch-code-diff',
          file: 'domain/coupon-factory.ts',
          before: [
            'const halfBaked = { id: "", discountPct: 140 }; // sin invariante',
          ],
          after: [
            'createVerifiedCoupon(code, pct) // exige 0 < pct <= 80 al nacer',
            'ConnectorBuilder.withTls(cert).withTimeout(2000).build()',
          ],
          callout: 'Si la creación retorna éxito, el objeto ya cumple todas sus invariantes',
        },
      },
      {
        chapter: '03 · Sin Excesos',
        title: 'Proporcionalidad: no escribas 100 líneas para 3 campos planos',
        durationSec: 11,
        spriteId: 'arquibot-exito',
        aura: 'emerald',
        speaker: 'mentor',
        speech:
          'Si un objeto solo tiene tres datos obligatorios, un constructor tipado o función factoría pura supera a un Builder ceremonioso de cien líneas. Ninguna entidad del dominio debe existir jamás en estado corrupto.',
        visual: {
          kind: 'event-lanes',
          mode: 'resilient',
          statusBadge: 'GUÍA DE SELECCIÓN CREACIONAL · PROPORCIONALIDAD',
          laneA: {
            name: 'Caso Simple',
            steps: ['3 campos fijos', 'Función factoría pura', 'Inmutable al nacer ✓'],
          },
          laneB: {
            name: 'Caso Complejo',
            steps: ['Familia conectores → Factory', '12 opciones → Builder', 'Valida en build() ✓'],
          },
        },
      },
    ],
  },
  I03: {
    id: 'CLASS-I03',
    kicker: 'CLASE INTERACTIVA HD · I03',
    heading: 'I03 · Patrones estructurales: Adapter, Facade y Decorator',
    ctaLabel: 'Ir al taller 2/4',
    ctaScrollTarget: 'sec-workbench',
    scenes: [
      {
        chapter: '01 · Fuga de SDK',
        title: 'Treinta servicios internos atados a cabeceras de un SDK legado',
        durationSec: 11,
        spriteId: 'arquibot-error',
        aura: 'amber',
        speaker: 'host',
        speech:
          'Integramos un servicio legado de facturación y ahora treinta archivos de NexoShop importan cabeceras y códigos crudos de ese SDK externo. Si el proveedor actualiza su versión, ¿cómo evitamos editar medio sistema?',
        visual: {
          kind: 'c4-topology',
          mode: 'incident',
          nodes: [
            { label: 'SDK Legado v1', sub: 'charge_token_v1', state: 'hot' },
            { label: '30 Servicios', sub: 'Import directo', state: 'hot' },
            { label: 'Upgrade SDK v2', sub: 'Rompe compilación', state: 'hot' },
          ],
          metricLabel: 'Archivos rotos al actualizar SDK externo',
          metricBefore: '1 adaptador',
          metricAfter: '30 servicios ⚠',
        },
      },
      {
        chapter: '02 · Adapter y Facade',
        title: 'Adapter traduce contratos · Facade simplifica · Decorator mide',
        durationSec: 13,
        spriteId: 'arquibot-codigo',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'Aislando fronteras con patrones estructurales. Adapter traduce un contrato externo incompatible al puerto limpio de tu dominio, Facade ofrece una entrada simple sobre un subsistema complejo y Decorator envuelve métricas o tiempos sin tocar la regla central.',
        visual: {
          kind: 'arch-code-diff',
          file: 'billing/legacy-billing.adapter.ts',
          before: [
            'type LeakedOrder = { vendor_raw_headers: Record<string, string> };',
          ],
          after: [
            'class LegacyBillingAdapter implements BillingPort { /* traduce aquí */ }',
            'withTimingDecorator("billing.emit", () => billingPort.emit(invoice))',
          ],
          callout: 'Si el proveedor cambia su SDK, solo editas un archivo adaptador',
        },
      },
      {
        chapter: '03 · Trazabilidad',
        title: 'Envolver responsabilidades sin crear cebollas indescifrables',
        durationSec: 10,
        spriteId: 'arquibot-exito',
        aura: 'violet',
        speaker: 'mentor',
        speech:
          'Úsalos con mesura: evita apilar siete Decorators anidados que oculten reintentos o mutaciones de estado y vuelvan imposible depurar una traza en producción.',
        visual: {
          kind: 'adr-radar',
          title: 'Guía Estructural Senior · I03',
          lines: [
            { prompt: '✓', text: 'Adapter: convierte interfaz ajena al lenguaje del dominio', tone: 'ok' },
            { prompt: '✓', text: 'Facade: punto de entrada limpio frente a subsistema ruidoso', tone: 'cmd' },
            { prompt: '⚠', text: 'Decorator: mantener explícito y sin efectos ocultos de estado', tone: 'warn' },
          ],
        },
      },
    ],
  },
  I04: {
    id: 'CLASS-I04',
    kicker: 'CLASE INTERACTIVA HD · I04',
    heading: 'I04 · Patrones de comportamiento: Strategy, Observer y estados',
    ctaLabel: 'Ir al taller 2/4',
    ctaScrollTarget: 'sec-workbench',
    scenes: [
      {
        chapter: '01 · Flags Rotos',
        title: 'Pedidos marcados como pagados y cancelados simultáneamente',
        durationSec: 11,
        spriteId: 'arquibot-error',
        aura: 'amber',
        speaker: 'host',
        speech:
          'En la tabla de pedidos tenemos tres booleanos sueltos: pagado, cancelado y enviado, y ayer apareció en producción un pedido marcado como pagado y cancelado al mismo tiempo. ¿Cómo cerramos esa brecha?',
        visual: {
          kind: 'c4-topology',
          mode: 'incident',
          nodes: [
            { label: 'isPaid: true', sub: 'Flag suelto', state: 'hot' },
            { label: 'isCanceled: true', sub: 'Contradicción', state: 'hot' },
            { label: 'Reembolso Doble', sub: 'Estado ilegal', state: 'hot' },
          ],
          metricLabel: 'Combinaciones ilegales en booleanos sueltos',
          metricBefore: '4 estados válidos',
          metricAfter: '8 mezclas rotas ⚠',
        },
      },
      {
        chapter: '02 · Estados y Eventos',
        title: 'Máquina de estados cerrada + Strategy + Observer desacoplado',
        durationSec: 13,
        spriteId: 'arquibot-codigo',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'Reemplaza booleanos sueltos por una máquina de estados explícita o patrón State donde cada transición valida sus precondiciones. Combínalo con Strategy para métodos de pago intercambiables y Observer para notificar sin acoplar al emisor.',
        visual: {
          kind: 'arch-code-diff',
          file: 'orders/order-state-machine.ts',
          before: [
            'type BrokenFlags = { isPaid: boolean; isCanceled: boolean };',
          ],
          after: [
            'const ALLOWED = { PENDING: ["PAID", "CANCELED"], PAID: ["SHIPPED"] };',
            'canTransitionOrder(currentStatus, nextStatus) // precondición cerrada',
          ],
          callout: 'PENDING → PAID → SHIPPED impide estados contradictorios de raíz',
        },
      },
      {
        chapter: '03 · Desacoplo Sano',
        title: 'Comando explícito vs notificación de evento pasado',
        durationSec: 11,
        spriteId: 'arquibot-exito',
        aura: 'emerald',
        speaker: 'mentor',
        speech:
          'Distingue siempre comando de evento: Strategy ejecuta el algoritmo elegido hoy, mientras un evento notifica algo que ya ocurrió sin esconder cobros críticos en efectos secundarios invisibles.',
        visual: {
          kind: 'event-lanes',
          mode: 'resilient',
          statusBadge: 'COMPORTAMIENTO PREDECIBLE · INTENCIÓN VS NOTIFICACIÓN',
          laneA: {
            name: 'Strategy + State',
            steps: ['Valida transición', 'Ejecuta política cobro', 'Retorna resultado ✓'],
          },
          laneB: {
            name: 'Observer / Evento',
            steps: ['Publica OrderPaid', 'Envía correo recibo', 'Actualiza analítica'],
          },
        },
      },
    ],
  },
  I05: {
    id: 'CLASS-I05',
    kicker: 'CLASE INTERACTIVA HD · I05',
    heading: 'I05 · Repository, Unit of Work y límites transaccionales',
    ctaLabel: 'Ir al taller 2/4',
    ctaScrollTarget: 'sec-workbench',
    scenes: [
      {
        chapter: '01 · Líneas Huérfanas',
        title: 'Repositorios por tabla hija que burlan las invariantes del pedido',
        durationSec: 11,
        spriteId: 'arquibot-error',
        aura: 'amber',
        speaker: 'host',
        speech:
          'Creamos un repositorio genérico por cada tabla de base de datos, y alguien insertó líneas de pedido directamente saltándose el recálculo del total y el límite máximo de unidades. ¿Por qué falló esa abstracción?',
        visual: {
          kind: 'dependency-rings',
          mode: 'violation',
          outerLayer: 'Escritura directa en tabla hija sin pasar por la raíz',
          coreItems: [
            { name: 'OrderLineTableRepo', rule: 'insertOrphanLine(raw)', state: 'leak' },
            { name: 'Agregado Pedido', rule: 'Total desincronizado', state: 'leak' },
          ],
          infraTitle: 'Invariante rota en persistencia',
          infraNote: 'Un repositorio por tabla convierte el dominio en acceso SQL crudo.',
          badgeLabel: 'BYPASS DE AGGREGATE ROOT ⚠',
        },
      },
      {
        chapter: '02 · Aggregate Root',
        title: 'Un Repository por raíz + Transacción atómica Pedido y Outbox',
        durationSec: 12,
        spriteId: 'arquibot-codigo',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'Porque un Repository se define por Aggregate Root, nunca por tabla hija suelta. El repositorio guarda la raíz completa y Unit of Work coordina una única transacción atómica entre el pedido, sus líneas y el registro Outbox.',
        visual: {
          kind: 'arch-code-diff',
          file: 'orders/order-repository.port.ts',
          before: [
            'orderLineRepo.insertOrphanLine(line); // rompe total e invariante',
          ],
          after: [
            'orderAggregate.addLine(sku, qty, unitPrice); // valida en memoria',
            'await orderRepository.saveWithOutbox(orderAggregate); // TX ACID',
          ],
          callout: 'COMMIT o ROLLBACK único para Raíz + Entidades internas + Outbox',
        },
      },
      {
        chapter: '03 · Lectura Ligera',
        title: 'Agregados completos al escribir · Proyecciones planas al leer',
        durationSec: 10,
        spriteId: 'arquibot-exito',
        aura: 'emerald',
        speaker: 'mentor',
        speech:
          'Reserva la hidratación completa del agregado para comandos que mutan invariantes; para listados y paneles paginados usa proyecciones ligeras de solo lectura.',
        visual: {
          kind: 'event-lanes',
          mode: 'resilient',
          statusBadge: 'SEPARACIÓN DE ACCESO A DATOS · MUTACIÓN VS CONSULTA',
          laneA: {
            name: 'Comando (Write)',
            steps: ['Carga Aggregate Root', 'Protege invariantes', 'TX ACID + Outbox ✓'],
          },
          laneB: {
            name: 'Consulta (Read)',
            steps: ['SELECT columnas fijas', 'Sin hidratar grafo', 'p95 < 25 ms ✓'],
          },
        },
      },
    ],
  },
  I06: {
    id: 'CLASS-I06',
    kicker: 'CLASE INTERACTIVA HD · I06',
    heading: 'I06 · Clean Architecture: dependencias hacia las políticas del negocio',
    ctaLabel: 'Ir al taller 2/4',
    ctaScrollTarget: 'sec-workbench',
    scenes: [
      {
        chapter: '01 · Falsa Limpieza',
        title: 'Carpetas con nombres Clean pero acopladas a códigos HTTP y cookies',
        durationSec: 11,
        spriteId: 'arquibot-error',
        aura: 'amber',
        speaker: 'host',
        speech:
          'Renombramos nuestras carpetas a entidades, casos de uso y adaptadores, pero el caso de uso de aprobación devuelve códigos HTTP cuatrocientos veintidós y cabeceras de sesión. ¿Por qué no podemos reutilizarlo desde una cola?',
        visual: {
          kind: 'dependency-rings',
          mode: 'violation',
          outerLayer: 'Transporte Web filtrado dentro de Aplicación/Dominio',
          coreItems: [
            { name: 'ApproveOrderUseCase', rule: 'return { status: 422 }', state: 'leak' },
            { name: 'OrderPolicy', rule: 'lee Set-Cookie header', state: 'leak' },
          ],
          infraTitle: 'Imposible invocar desde Worker o CLI',
          infraNote: 'Un consumidor de mensajes no tiene cookies ni códigos de estado HTTP.',
          badgeLabel: 'ACOPLAMIENTO A TRANSPORTE WEB ⚠',
        },
      },
      {
        chapter: '02 · Verbos de Negocio',
        title: 'Casos de uso agnósticos de transporte y resultados tipados',
        durationSec: 13,
        spriteId: 'arquibot-codigo',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'Porque renombrar carpetas no invierte dependencias. En Clean Architecture el caso de uso expresa verbos semánticos del negocio y devuelve resultados tipados del dominio, dejando que el controlador web o el consumidor de cola traduzcan su transporte.',
        visual: {
          kind: 'arch-code-diff',
          file: 'application/approve-order.usecase.ts',
          before: [
            'return { httpStatusCode: 422, setCookieHeader: "s=xyz" };',
          ],
          after: [
            'if (riskScore > 80) return { outcome: "MANUAL_REVIEW_REQUIRED" };',
            'return { outcome: "APPROVED", orderId }; // puro y reutilizable',
          ],
          callout: 'HTTP traduce a 200/422; un Worker traduce a ACK/Retry sin tocar negocio',
        },
      },
      {
        chapter: '03 · Cero Burocracia',
        title: 'Dominio con Ce = 0 sin mappers repetitivos innecesarios',
        durationSec: 11,
        spriteId: 'arquibot-exito',
        aura: 'violet',
        speaker: 'mentor',
        speech:
          'Verifica que el dominio tenga cero importaciones hacia infraestructura, pero evita duplicar cuatro mappers manuales idénticos en consultas simples donde una proyección tipada es suficiente.',
        visual: {
          kind: 'adr-radar',
          title: 'Invariantes de Clean Architecture · I06',
          lines: [
            { prompt: '✓', text: 'Dominio + Casos de Uso: 0 imports de HTTP, SQL, colas o SDKs', tone: 'ok' },
            { prompt: '✓', text: 'Nombres orientados al negocio: approveOrder, cancelBooking', tone: 'cmd' },
            { prompt: '⚠', text: 'Evitar ceremonia de 4 DTOs idénticos en lecturas directas', tone: 'warn' },
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
  S03: {
    id: 'SENIOR-S03',
    kicker: 'BRIEFING TÁCTICO HD · S03',
    heading: 'S03 · Selección de patrones GoF: múltiples proveedores externos',
    ctaLabel: 'Resolver los 6 retos',
    ctaScrollTarget: 'senior-suite',
    scenes: [
      {
        chapter: '01 · Incidente',
        title: 'SDKs heterogéneos contaminando los casos de uso de NexoShop',
        durationSec: 12,
        spriteId: 'arquibot-error',
        aura: 'amber',
        speaker: 'host',
        speech:
          'Misión Senior S03: Integración multi-proveedor. NexoShop opera con pasarelas externas de notificaciones y pagos cuyos SDKs devuelven formatos y errores incompatibles, contaminando todos los casos de uso.',
        visual: {
          kind: 'c4-topology',
          mode: 'incident',
          nodes: [
            { label: 'Caso de Uso', sub: 'if (sdkA) else (sdkB)', state: 'hot' },
            { label: 'Proveedor A', sub: 'XML + código 51', state: 'hot' },
            { label: 'Proveedor B', sub: 'JSON + timeout mudo', state: 'hot' },
          ],
          metricLabel: 'Archivos tocados al añadir proveedor C',
          metricBefore: '1 adaptador nuevo',
          metricAfter: '14 casos de uso ⚠',
        },
      },
      {
        chapter: '02 · Strategy + Adapter',
        title: 'Puerto único del dominio, adaptadores aislados y fallback',
        durationSec: 13,
        spriteId: 'arquibot-codigo',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'Aquí brillan Adapter y Strategy combinados con criterio: defines un único puerto del dominio, traduces cada SDK externo en su propio adaptador aislado e instrumentas observabilidad, timeouts y fallback controlado.',
        visual: {
          kind: 'arch-code-diff',
          file: 'notifications/provider-port.ts',
          before: [
            '✕ Condicionales por proveedor y errores crudos filtrados al dominio',
          ],
          after: [
            '✓ NotificationPort → SdkAAdapter | SdkBAdapter (contract tests)',
            '✓ Métricas de latencia/fallo por proveedor + fallback seguro',
          ],
          callout: 'Componentes clave en S03: Dominio aislado + Observabilidad',
        },
      },
      {
        chapter: '03 · Entregable',
        title: 'Contract tests, telemetría por adaptador y ADR justificable',
        durationSec: 12,
        spriteId: 'arquibot-senior',
        aura: 'gold',
        speaker: 'mentor',
        speech:
          'En el taller modela Dominio aislado y Observabilidad, verifica contratos de error y latencia por proveedor y justifica en tu ADR por qué evitaste condicionales dispersos, quedando listo para REQUIRES_REVIEW.',
        visual: {
          kind: 'adr-radar',
          title: 'Evidencia Exigida · Misión S03',
          lines: [
            { prompt: '01', text: 'Grafo Fase 1: Dominio aislado + Observabilidad sin acoplar SDKs', tone: 'ok' },
            { prompt: '02', text: 'Contract Tests: validar mapeo de respuesta, timeout y fallback', tone: 'cmd' },
            { prompt: '03', text: 'ADR: justificar Adapter/Strategy frente a coste extra (REQUIRES_REVIEW)', tone: 'warn' },
          ],
        },
      },
    ],
  },
  S04: {
    id: 'SENIOR-S04',
    kicker: 'BRIEFING TÁCTICO HD · S04',
    heading: 'S04 · Clean vs Hexagonal: desacoplar ORM y HTTP del Dominio',
    ctaLabel: 'Resolver los 6 retos',
    ctaScrollTarget: 'senior-suite',
    scenes: [
      {
        chapter: '01 · Incidente',
        title: 'Express y Prisma incrustados dentro de las entidades del negocio',
        durationSec: 12,
        spriteId: 'arquibot-error',
        aura: 'amber',
        speaker: 'host',
        speech:
          'Misión Senior S04: Clean versus Hexagonal. El núcleo de clientes importa directamente objetos Request de Express e instancia el cliente de Prisma dentro del dominio, haciendo imposible probar reglas sin levantar servidor y base de datos.',
        visual: {
          kind: 'dependency-rings',
          mode: 'violation',
          outerLayer: 'Dominio secuestrado por Framework Web y ORM',
          coreItems: [
            { name: 'domain/customer.ts', rule: 'import { Request } from express', state: 'leak' },
            { name: 'registerCustomer()', rule: 'new PrismaClient().create()', state: 'leak' },
          ],
          infraTitle: 'Tests lentos y frágiles acoplados a red/BD',
          infraNote: 'Actualizar Express o Prisma rompe las reglas centrales del negocio.',
          badgeLabel: 'ACOPLAMIENTO DIRECTO A ORM/HTTP ⚠',
        },
      },
      {
        chapter: '02 · Puertos y Casos',
        title: 'Caso de uso explícito, puerto propio y adaptadores externos',
        durationSec: 12,
        spriteId: 'arquibot-diagrama',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'Limpia la dirección de dependencias: extrae un caso de uso que reciba un comando validado, define un puerto de repositorio en el dominio e implementa Prisma y Express afuera como adaptadores reemplazables.',
        visual: {
          kind: 'dependency-rings',
          mode: 'clean',
          outerLayer: 'Adaptadores Express & Prisma → Núcleo Hexagonal',
          coreItems: [
            { name: 'RegisterCustomerUseCase', rule: 'Depende de CustomerPort', state: 'port' },
            { name: 'Customer Entity', rule: '0 imports de Express/Prisma', state: 'ok' },
          ],
          infraTitle: 'PrismaCustomerRepo implements CustomerPort',
          infraNote: 'Componentes clave en S04: Dominio aislado + Base de datos tras puerto.',
          badgeLabel: 'ARQUITECTURA HEXAGONAL · Ce = 0 ✓',
        },
      },
      {
        chapter: '03 · Entregable',
        title: 'Grafo sin fugas, tests en memoria y ADR bajo revisión humana',
        durationSec: 11,
        spriteId: 'arquibot-senior',
        aura: 'gold',
        speaker: 'mentor',
        speech:
          'En el taller conecta Dominio aislado y Base de datos respetando fronteras limpias, demuestra pruebas unitarias sin infraestructura y documenta tus trade-offs en el ADR bajo revisión humana REQUIRES_REVIEW.',
        visual: {
          kind: 'adr-radar',
          title: 'Evidencia Exigida · Misión S04',
          lines: [
            { prompt: '01', text: 'Grafo Fase 1: Dominio aislado + Base de datos con dirección limpia', tone: 'ok' },
            { prompt: '02', text: 'Code Review: eliminar Express/Prisma del dominio e inyectar puerto', tone: 'cmd' },
            { prompt: '03', text: 'ADR: defender límites Clean/Hexagonal sin sobre-capas (REQUIRES_REVIEW)', tone: 'warn' },
          ],
        },
      },
    ],
  },
  S05: {
    id: 'SENIOR-S05',
    kicker: 'BRIEFING TÁCTICO HD · S05',
    heading: 'S05 · DDD estratégico: Bounded Contexts y propiedad de datos',
    ctaLabel: 'Resolver los 6 retos',
    ctaScrollTarget: 'senior-suite',
    scenes: [
      {
        chapter: '01 · Incidente',
        title: 'Entidad global «Producto» mutada por tres equipos en conflicto',
        durationSec: 12,
        spriteId: 'arquibot-error',
        aura: 'amber',
        speaker: 'host',
        speech:
          'Misión Senior S05: Conflicto en el marketplace. Catálogo, Inventario y Facturación comparten y mutan una misma entidad global llamada Producto, provocando bloqueos entre equipos y cálculos fiscales corruptos.',
        visual: {
          kind: 'c4-topology',
          mode: 'incident',
          nodes: [
            { label: 'shared/Product', sub: '48 columnas mixtas', state: 'hot' },
            { label: 'Catálogo vs Stock', sub: 'Pisan mutaciones', state: 'hot' },
            { label: 'Facturación', sub: 'Impuesto corrupto', state: 'hot' },
          ],
          metricLabel: 'Despliegues bloqueados entre equipos',
          metricBefore: 'Autonomía por dominio',
          metricAfter: ' Coordinación total ⚠',
        },
      },
      {
        chapter: '02 · Context Map + ACL',
        title: 'Lenguaje ubicuo acotado, contratos explícitos y capa anticorrupción',
        durationSec: 13,
        spriteId: 'arquibot-diagrama',
        aura: 'sky',
        speaker: 'mentor',
        speech:
          'La palabra producto significa cosas distintas en cada subdominio. Separa Bounded Contexts con propietario claro, expón contratos explícitos tras API Gateway y protege la integración mediante una Anti-Corruption Layer.',
        visual: {
          kind: 'event-lanes',
          mode: 'resilient',
          statusBadge: 'COMPONENTES CLAVE EN S05: DOMINIO AISLADO + API GATEWAY',
          laneA: {
            name: 'Modelos Propios',
            steps: ['Catálogo: Ficha y SEO', 'Stock: Unidades SKU', 'Billing: Tributo y SKU'],
          },
          laneB: {
            name: 'Integración ACL',
            steps: ['Contratos vía API Gateway', 'Traductor ACL explícito', '0 tablas compartidas ✓'],
          },
        },
      },
      {
        chapter: '03 · Entregable',
        title: 'Context Map verificable, ownership claro y ADR para comité',
        durationSec: 12,
        spriteId: 'arquibot-senior',
        aura: 'gold',
        speaker: 'mentor',
        speech:
          'En el taller modela Dominio aislado y API Gateway sin tablas globales compartidas, valida contratos entre contextos y documenta tu Context Map en el ADR para revisión humana REQUIRES_REVIEW.',
        visual: {
          kind: 'adr-radar',
          title: 'Evidencia Exigida · Misión S05',
          lines: [
            { prompt: '01', text: 'Grafo Fase 1: Dominio aislado + API Gateway con ownership claro', tone: 'ok' },
            { prompt: '02', text: 'Code Review: eliminar entidad mutable compartida y traducir con ACL', tone: 'cmd' },
            { prompt: '03', text: 'ADR: justificar límites de Bounded Contexts (REQUIRES_REVIEW)', tone: 'warn' },
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
