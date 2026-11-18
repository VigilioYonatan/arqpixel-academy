import type { LearningPathSchema, ModuleSchema } from '../../curriculum/schemas/curriculum.schema.js';
import type { LabStudioDefinition } from '../../labs/constants/labs.constants.js';
import { CAPSTONE_PROJECTS } from '../../projects/constants/projects.constants.js';
import {
  EXPANDED_GLOSSARY_TERMS,
  MANDATORY_COMPARISONS,
  PATTERN_CARDS,
} from '../../resources/constants/resources.constants.js';
import type { MissionSchema } from '../../senior/schemas/senior.schema.js';
import type { MiniGame } from '../../../mini-games.js';
import { SENIOR_PLAYBOOKS } from '../../../senior-suite.js';
import {
  type AssetManifestItemSchema,
  renderArquiBotSprite,
} from '../schemas/assets-manifest.schema.js';

/** Mandatory 9 interactive states governed by Vigilio UI Design System (`ARQ-011`). */
export const UI_INTERACTIVE_STATES = [
  'idle',
  'hover',
  'focus-visible',
  'disabled',
  'loading',
  'success',
  'error',
  'empty',
  'reduced-motion',
] as const;

export type UiInteractiveState = (typeof UI_INTERACTIVE_STATES)[number];

export type TokenComponentMapping = {
  readonly component: string;
  readonly tokens: readonly string[];
  readonly states: readonly UiInteractiveState[];
  readonly screens: readonly string[];
};

export const TOKEN_COMPONENT_STATE_SCREEN_MAP: readonly TokenComponentMapping[] = Object.freeze([
  {
    component: 'SearchCommand',
    tokens: ['--bg', '--panel', '--panel2', '--line', '--cyan', '--text', '--muted'],
    states: UI_INTERACTIVE_STATES,
    screens: ['Global Shell (Ctrl+K / Header)', '#/inicio', '#/rutas', '#/laboratorios', '#/senior'],
  },
  {
    component: 'SkipLink',
    tokens: ['--cyan', '--bg'],
    states: ['idle', 'focus-visible', 'reduced-motion'],
    screens: ['Global Shell (todas las rutas)'],
  },
  {
    component: 'LiveRegion',
    tokens: ['--mint', '--gold', '--cyan'],
    states: ['idle', 'loading', 'success', 'error'],
    screens: ['Global Shell (#global-live-region)', '#/aprender/:id', '#/laboratorio/:id', '#/taller-senior/:id'],
  },
  {
    component: 'ProgressRing',
    tokens: ['--cyan', '--mint', '--line', '--text'],
    states: ['idle', 'success', 'empty', 'reduced-motion'],
    screens: ['Sidebar', '#/rutas/:id', '#/perfil', '#/logros'],
  },
  {
    component: 'HintDrawer',
    tokens: ['--panel2', '--cyan', '--line', '--text', '--muted'],
    states: ['idle', 'hover', 'focus-visible', 'disabled', 'success', 'reduced-motion'],
    screens: ['#/aprender/:id', '#/modulo/:id', '#/mision/:id'],
  },
  {
    component: 'SolutionReveal',
    tokens: ['--panel2', '--mint', '--gold', '--line', '--text'],
    states: ['idle', 'success', 'error', 'reduced-motion'],
    screens: ['#/aprender/:id', '#/modulo/:id', '#/minijuego/:id'],
  },
  {
    component: 'MobileWorkspaceTabs',
    tokens: ['--panel', '--panel2', '--cyan', '--line', '--text'],
    states: ['idle', 'hover', 'focus-visible', 'reduced-motion'],
    screens: ['#/laboratorio/:id (8 estudios)', '#/taller-senior/:id (18 misiones)'],
  },
  {
    component: 'ActionButton & OptionCard',
    tokens: ['--cyan', '--blue', '--mint', '--gold', '--panel2', '--line'],
    states: UI_INTERACTIVE_STATES,
    screens: ['Todas las pantallas interactivas'],
  },
]);

export const MOBILE_WORKSPACE_TABS = [
  { id: 'all', label: 'Vista completa' },
  { id: 'context', label: 'Contexto' },
  { id: 'work', label: 'Trabajo' },
  { id: 'validation', label: 'Validación' },
] as const;

export type MobileWorkspaceTabId = (typeof MOBILE_WORKSPACE_TABS)[number]['id'];

export type SearchEntryCategory =
  | 'Lección'
  | 'Misión Senior'
  | 'Ruta'
  | 'Proyecto'
  | 'Laboratorio'
  | 'Minijuego'
  | 'Patrón'
  | 'Comparativa'
  | 'Glosario'
  | 'Navegación';

export type SearchIndexItem = {
  readonly id: string;
  readonly title: string;
  readonly category: SearchEntryCategory;
  readonly href: string;
  readonly summary: string;
  readonly keywords: string;
  readonly normalizedBlob: string;
};

export type BuildSearchIndexInput = {
  readonly modules: readonly ModuleSchema[];
  readonly missions: readonly MissionSchema[];
  readonly paths: readonly LearningPathSchema[];
  readonly labs: readonly LabStudioDefinition[];
  readonly miniGames: readonly MiniGame[];
};

function esc(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch),
  );
}

export function normalizeSearchText(raw_text: string): string {
  return raw_text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function makeSearchItem(
  id: string,
  title: string,
  category: SearchEntryCategory,
  href: string,
  summary: string,
  keywords: string,
): SearchIndexItem {
  const normalized_blob = normalizeSearchText(`${id} ${title} ${category} ${summary} ${keywords}`);
  return {
    id,
    title,
    category,
    href,
    summary,
    keywords,
    normalizedBlob: normalized_blob,
  };
}

export function buildGlobalSearchIndex(input: BuildSearchIndexInput): SearchIndexItem[] {
  const items: SearchIndexItem[] = [];

  for (const mod of input.modules) {
    items.push(
      makeSearchItem(
        `MOD-${mod.id}`,
        `${mod.id} · ${mod.title}`,
        'Lección',
        `#/aprender/${mod.id}`,
        mod.concept,
        `${mod.level} ${mod.activity} ${mod.comparison ?? ''} ${mod.lesson.slice(0, 180)}`,
      ),
    );
  }

  for (const mission of input.missions) {
    const playbook = SENIOR_PLAYBOOKS[mission.id];
    const stride_boost = mission.id === 'S12' ? 'stride rbac abac owasp' : '';
    items.push(
      makeSearchItem(
        `SEN-${mission.id}`,
        `${mission.id} · ${mission.title}`,
        'Misión Senior',
        `#/taller-senior/${mission.id}`,
        mission.brief,
        `senior ${stride_boost} ${mission.decision} ${playbook?.focus ?? ''} ${playbook?.investigation ?? ''} ${playbook?.artifact ?? ''}`,
      ),
    );
  }

  for (const path of input.paths) {
    items.push(
      makeSearchItem(
        `PATH-${path.id}`,
        `${path.id} · ${path.title}`,
        'Ruta',
        `#/rutas/${path.id}`,
        path.summary,
        `${path.tag} ${path.capstone} ${path.modules.join(' ')}`,
      ),
    );
  }

  for (const proj of CAPSTONE_PROJECTS) {
    items.push(
      makeSearchItem(
        `PROJ-${proj.id}`,
        `${proj.id} · ${proj.title}`,
        'Proyecto',
        `#/proyectos/${proj.id}`,
        proj.subtitle,
        `capstone integrador adr c4 ${proj.relatedPathId ?? ''} ${proj.badgeTag} ${proj.expectedDomainTerms.join(' ')}`,
      ),
    );
  }

  const lab_concept_boost: Readonly<Record<string, string>> = {
    dependencias: 'acoplamiento aferente eferente clean hexagonal capas ciclos mermaid',
    c4: 'c1 c2 c3 contexto contenedores componentes diagrama json mermaid svg png',
    ddd: 'bounded context aggregates agregado invariantes acl context map lenguaje ubicuo eventos',
    patterns: 'gof strategy adapter facade sobrediseno refactorizacion',
    api: 'openapi rest contratos idempotencia idempotency-key breaking changes versionado v1 v2',
    distributed: 'outbox idempotent consumer dlq saga reintentos consistencia eventual',
    adr: 'architecture decision record trade-offs matriz opciones nygard madr',
    incident: 'slo sli error budget burn rate timeout backoff jitter circuit breaker bulkhead',
  };

  for (const lab of input.labs) {
    items.push(
      makeSearchItem(
        `LAB-${lab.id}`,
        `Lab · ${lab.title}`,
        'Laboratorio',
        `#/laboratorio/${lab.id}`,
        lab.subtitle,
        `${lab.tag} ${lab_concept_boost[lab.id] ?? ''}`,
      ),
    );
  }

  for (const game of input.miniGames) {
    items.push(
      makeSearchItem(
        `GAME-${game.id}`,
        `Minijuego · ${game.title}`,
        'Minijuego',
        `#/minijuego/${game.id}`,
        game.subtitle,
        `${game.tag} entrenamiento estrellas`,
      ),
    );
  }

  for (const pat of PATTERN_CARDS) {
    items.push(
      makeSearchItem(
        `PAT-${pat.id}`,
        `Patrón · ${pat.name}`,
        'Patrón',
        `#/recursos/patrones/${pat.id}`,
        pat.intent,
        `${pat.category} ${pat.problem} ${pat.operationalCost}`,
      ),
    );
  }

  for (const comp of MANDATORY_COMPARISONS) {
    items.push(
      makeSearchItem(
        `CMP-${comp.id}`,
        `Comparativa · ${comp.title}`,
        'Comparativa',
        '#/recursos',
        `${comp.chooseFirstWhen} vs ${comp.chooseSecondWhen}`,
        `${comp.question} ${comp.verificationSignal} cqrs crud saga outbox monolito microservicios hexagonal clean`,
      ),
    );
  }

  for (const [idx, [term, definition]] of EXPANDED_GLOSSARY_TERMS.entries()) {
    items.push(
      makeSearchItem(
        `GLOSS-${idx + 1}`,
        `Glosario · ${term}`,
        'Glosario',
        '#/recursos',
        definition,
        `${term} concepto definicion vocabulario`,
      ),
    );
  }

  items.push(
    makeSearchItem(
      'NAV-MAPA',
      'Mapa curricular interactivo (54 nodos)',
      'Navegación',
      '#/mapa',
      'Grafo DAG de las 36 lecciones y 18 misiones Senior con prerrequisitos.',
      'dag prerrequisitos grafo mapa',
    ),
    makeSearchItem(
      'NAV-ADR',
      'Biblioteca de plantillas ADR',
      'Navegación',
      '#/recursos/adr',
      'Plantillas Vigilio, Nygard y MADR descargables en Markdown.',
      'adr plantillas arquitectura decision',
    ),
    makeSearchItem(
      'NAV-LOGROS',
      'Colección de 18 Insignias y Logros',
      'Navegación',
      '#/logros',
      'Progreso verificable en rutas R01–R08, Senior Mode y proyectos.',
      'insignias medallas logros badges',
    ),
    makeSearchItem(
      'NAV-AJUSTES',
      'Ajustes de accesibilidad, alto contraste y almacenamiento',
      'Navegación',
      '#/ajustes',
      'Tema claro/oscuro/alto contraste, escala de fuente, movimiento reducido y respaldos.',
      'accesibilidad wcag contraste reduced motion localstorage backup',
    ),
  );

  return items;
}

export function queryGlobalSearch(
  index: readonly SearchIndexItem[],
  raw_query: string,
  limit = 12,
): SearchIndexItem[] {
  const normalized_query = normalizeSearchText(raw_query);
  if (!normalized_query) {
    return index.slice(0, Math.min(limit, 8));
  }

  const tokens = normalized_query.split(/\s+/).filter(Boolean);
  const scored: Array<{ item: SearchIndexItem; score: number }> = [];

  for (const item of index) {
    if (!tokens.every((tok) => item.normalizedBlob.includes(tok))) continue;
    const norm_title = normalizeSearchText(item.title);
    const norm_id = normalizeSearchText(item.id);
    let score = 10;
    if (norm_id === normalized_query || norm_title === normalized_query) score += 100;
    else if (norm_title.startsWith(normalized_query)) score += 60;
    else if (norm_title.includes(normalized_query)) score += 35;
    if (item.category === 'Lección' || item.category === 'Misión Senior' || item.category === 'Laboratorio') {
      score += 8;
    }
    scored.push({ item, score });
  }

  scored.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, 'es'));
  return scored.slice(0, limit).map((entry) => entry.item);
}

export function nextSearchSelectionIndex(
  current_index: number,
  key: string,
  total_items: number,
): number {
  if (total_items <= 0) return -1;
  if (key === 'ArrowDown') return (current_index + 1) % total_items;
  if (key === 'ArrowUp') return (current_index - 1 + total_items) % total_items;
  if (key === 'Home') return 0;
  if (key === 'End') return total_items - 1;
  return Math.max(0, Math.min(current_index, total_items - 1));
}

export function renderSkipLinkHtml(): string {
  return '<a class="skip-link" href="#main">Saltar al contenido principal</a>';
}

export function renderLiveRegionHtml(initial_message = ''): string {
  return `<div id="global-live-region" class="sr-only" role="status" aria-live="polite" aria-atomic="true">${esc(initial_message)}</div>`;
}

export function announceToLiveRegion(message: string): void {
  if (typeof document === 'undefined') return;
  const region = document.querySelector('#global-live-region');
  if (region) {
    region.textContent = message;
  }
}

export function renderProgressRingSvg(options: {
  readonly percent: number;
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly label: string;
}): string {
  const clamped = Math.max(0, Math.min(100, Math.round(options.percent)));
  const size = options.size ?? 52;
  const stroke_width = options.strokeWidth ?? 5;
  const radius = (size - stroke_width * 2) / 2;
  const circumference = Number((2 * Math.PI * radius).toFixed(2));
  const dash_offset = Number((circumference - (clamped / 100) * circumference).toFixed(2));
  const state_attr: UiInteractiveState = clamped === 0 ? 'empty' : clamped === 100 ? 'success' : 'idle';

  return `<svg class="progress-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" data-ui-state="${state_attr}" aria-label="${esc(options.label)}: ${clamped}%">
    <title>${esc(options.label)}: ${clamped}%</title>
    <circle class="progress-ring-track" cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke-width="${stroke_width}"/>
    <circle class="progress-ring-fill" cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke-width="${stroke_width}" stroke-dasharray="${circumference}" stroke-dashoffset="${dash_offset}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    <text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle" class="progress-ring-text">${clamped}%</text>
  </svg>`;
}

function redactAnswerSpoiler(text: string, correct_option: string | undefined): string {
  if (!correct_option) return text;
  const trimmed = correct_option.trim();
  if (trimmed.length < 2) return text;
  const escaped_pattern = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(escaped_pattern, 'gi'), 'el enfoque adecuado');
}

export function deriveLessonHints(mod: ModuleSchema): readonly string[] {
  const answer_text = mod.options[mod.correct];
  const first_hint = redactAnswerSpoiler(
    `Principio clave (${mod.level}): analiza qué responsabilidad cambia con mayor frecuencia y quién debería poseer esa regla.`,
    answer_text,
  );
  const second_hint = redactAnswerSpoiler(
    mod.comparison
      ? `Contraste arquitectónico (${mod.comparison}): pregúntate qué alternativa evita acoplar reglas de negocio con detalles accidentales.`
      : 'En el escenario de NexoShop, descarta las opciones que obliguen a los consumidores a depender de operaciones o detalles que no utilizan.',
    answer_text,
  );
  const third_hint = redactAnswerSpoiler(
    mod.metric
      ? `Criterio de verificación: elige la opción cuyo beneficio puedas demostrar midiendo «${mod.metric.slice(0, 120)}».`
      : 'Descarta las opciones que introduzcan estado global oculto, acoplamiento directo a infraestructura o ausencia de límites.',
    answer_text,
  );
  return [first_hint, second_hint, third_hint];
}

export function renderHintDrawerHtml(options: {
  readonly idPrefix: string;
  readonly hints: readonly string[];
  readonly revealedCount: number;
  readonly manifestLookup?: ReadonlyMap<string, AssetManifestItemSchema>;
}): string {
  const total = options.hints.length;
  const count = Math.max(0, Math.min(total, options.revealedCount));
  const visible_hints = options.hints.slice(0, count);
  const all_shown = count >= total;
  const ui_state: UiInteractiveState = all_shown ? 'success' : 'idle';

  return `<div class="hint-drawer" id="${esc(options.idPrefix)}-drawer" data-ui-state="${ui_state}">
    <div class="hint-drawer-header">
      <div class="hint-drawer-brand">
        ${renderArquiBotSprite(count > 0 ? 'arquibot-idea' : 'arquibot-pensando', 44, 'hint-sprite', options.manifestLookup)}
        <div>
          <strong>Pistas progresivas (${count}/${total})</strong>
          <small>Orientan el razonamiento sin revelar la respuesta.</small>
        </div>
      </div>
      <button
        type="button"
        class="btn secondary small"
        id="${esc(options.idPrefix)}-next-btn"
        aria-expanded="${count > 0 ? 'true' : 'false'}"
        aria-controls="${esc(options.idPrefix)}-list"
        ${all_shown ? 'disabled data-ui-state="disabled"' : 'data-ui-state="idle"'}
      >${all_shown ? 'Todas las pistas mostradas' : count === 0 ? 'Pedir pista 1' : `Pedir pista ${count + 1}`}</button>
    </div>
    <div id="${esc(options.idPrefix)}-list" class="hint-drawer-body" ${count === 0 ? 'hidden' : ''}>
      <ol class="hint-list">
        ${visible_hints.map((hint, idx) => `<li><span>Pista ${idx + 1}:</span> ${esc(hint)}</li>`).join('')}
      </ol>
    </div>
  </div>`;
}

export function renderSolutionRevealHtml(options: {
  readonly isCorrect: boolean;
  readonly chosenLabel: string;
  readonly referenceLabel: string;
  readonly explanation: string;
  readonly verificationMetric?: string;
  readonly manifestLookup?: ReadonlyMap<string, AssetManifestItemSchema>;
}): string {
  const ui_state: UiInteractiveState = options.isCorrect ? 'success' : 'error';
  const pose = options.isCorrect ? 'arquibot-exito' : 'arquibot-explicando';

  return `<section class="solution-reveal feedback ${options.isCorrect ? 'good' : 'bad'}" data-ui-state="${ui_state}" role="status" aria-live="polite">
    <div class="solution-reveal-head">
      ${renderArquiBotSprite(pose, 56, 'solution-sprite', options.manifestLookup)}
      <div>
        <strong>${options.isCorrect ? '✓ Respuesta correcta · Solución defendible' : '↺ Sigue practicando · Compara con la solución de referencia'}</strong>
        <p>${esc(options.explanation)}</p>
      </div>
    </div>
    <div class="solution-compare-grid">
      <div class="solution-box">
        <span class="overline">TU ELECCIÓN</span>
        <p>${esc(options.chosenLabel)}</p>
      </div>
      <div class="solution-box reference">
        <span class="overline">OPCIÓN DE REFERENCIA</span>
        <p>${esc(options.referenceLabel)}</p>
      </div>
    </div>
    ${
      options.verificationMetric
        ? `<p class="solution-tradeoff"><b>Cómo verificarlo y su límite:</b> ${esc(options.verificationMetric)} (Toda decisión depende de las restricciones reales del sistema; no existe bala de plata).</p>`
        : '<p class="solution-tradeoff"><b>Nota de criterio:</b> Esta referencia asume las restricciones del enunciado; ante otro presupuesto o SLO el trade-off puede cambiar.</p>'
    }
  </section>`;
}

export function renderMobileWorkspaceTabsHtml(
  active_tab: MobileWorkspaceTabId,
  id_prefix = 'ws-tab',
): string {
  return `<div class="mobile-workspace-tabs" role="tablist" aria-label="Secciones del espacio de trabajo">
    ${MOBILE_WORKSPACE_TABS.map(
      (tab) => `<button
        type="button"
        role="tab"
        id="${esc(id_prefix)}-${tab.id}"
        class="ws-tab-btn ${active_tab === tab.id ? 'active' : ''}"
        aria-selected="${active_tab === tab.id ? 'true' : 'false'}"
        data-ws-tab="${tab.id}"
        data-ui-state="${active_tab === tab.id ? 'success' : 'idle'}"
      >${esc(tab.label)}</button>`,
    ).join('')}
  </div>`;
}

export function renderSearchCommandModalHtml(options: {
  readonly isOpen: boolean;
  readonly query: string;
  readonly results: readonly SearchIndexItem[];
  readonly activeIndex: number;
  readonly manifestLookup?: ReadonlyMap<string, AssetManifestItemSchema>;
}): string {
  if (!options.isOpen) return '';
  const has_results = options.results.length > 0;

  return `<div class="search-cmd-backdrop" id="search-cmd-backdrop" data-ui-state="${has_results ? 'idle' : 'empty'}">
    <div class="search-cmd-dialog" role="dialog" aria-modal="true" aria-labelledby="search-cmd-title">
      <div class="search-cmd-header">
        <label for="search-cmd-input" id="search-cmd-title" class="search-cmd-label">
          <span>⌕ Buscar en ARQPIXEL</span>
          <small>Conceptos (aggregates, outbox, CQRS, SLO, STRIDE), lecciones, misiones y labs</small>
        </label>
        <button type="button" class="btn secondary small" id="search-cmd-close" aria-label="Cerrar buscador (Escape)">Esc</button>
      </div>
      <input
        id="search-cmd-input"
        type="search"
        class="search-cmd-input"
        value="${esc(options.query)}"
        placeholder="Escribe ej. outbox, idempotencia, S09, hexagonal, SLO, STRIDE..."
        autocomplete="off"
        maxlength="80"
      />
      ${
        has_results
          ? `<ul class="search-cmd-results" role="listbox" aria-label="Resultados de búsqueda">
              ${options.results
                .map((item, idx) => {
                  const is_active = idx === options.activeIndex;
                  return `<li role="option" aria-selected="${is_active ? 'true' : 'false'}">
                    <a href="${esc(item.href)}" class="search-cmd-item ${is_active ? 'active' : ''}" data-search-result-idx="${idx}">
                      <div class="search-cmd-item-top">
                        <strong>${esc(item.title)}</strong>
                        <span class="map-badge">${esc(item.category)}</span>
                      </div>
                      <small>${esc(item.summary)}</small>
                    </a>
                  </li>`;
                })
                .join('')}
            </ul>`
          : `<div class="search-cmd-empty" data-ui-state="empty" role="status">
              ${renderArquiBotSprite('arquibot-pensando', 64, '', options.manifestLookup)}
              <div>
                <strong>Sin coincidencias para «${esc(options.query)}»</strong>
                <p>Prueba con términos como <code>aggregates</code>, <code>outbox</code>, <code>idempotencia</code>, <code>CQRS</code>, <code>SLO</code>, <code>STRIDE</code> o un código como <code>I06</code> / <code>S09</code>.</p>
              </div>
            </div>`
      }
      <div class="search-cmd-footer">
        <span>↑↓ Navegar</span>
        <span>↵ Abrir</span>
        <span>Esc Cerrar</span>
        <span>Ctrl+K Atajo global</span>
      </div>
    </div>
  </div>`;
}
