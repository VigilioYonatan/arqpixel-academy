import { lessonSeniorScenario } from '../../lesson-senior.js';
import { renderArquiBotCinemaHtml } from '../cinema/arquibot-player.js';
import { buildModuleCinemaDeck } from '../cinema/arquibot-storyboards.js';
import type { AudioManifestCatalogSchema } from '../cinema/schemas/cinema.schema.js';
import { LESSON_XP_REWARD } from '../shared/constants/app.constants.js';
import {
  type AssetManifestItemSchema,
  renderArquiBotSprite,
} from '../shared/schemas/assets-manifest.schema.js';
import {
  deriveLessonHints,
  renderHintDrawerHtml,
  renderSolutionRevealHtml,
} from '../shared/ui/interactive-components.js';
import {
  formatSafeArchitecturalProseHtml,
  renderLessonExecutiveDigestHtml,
  resolveModuleContentReadiness,
} from '../shared/ui/visual-clarity.js';
import {
  CURRICULUM_LEVELS,
  CURRICULUM_PREREQUISITES,
  MODULE_CANONICAL_REFERENCES,
} from './constants/curriculum.constants.js';
import { getLessonEnrichment, renderLessonEnrichmentSectionHtml } from './lesson-visuals.js';
import { renderLessonWorkbenchHtml } from './lesson-workbench.js';
import type { ModuleSchema } from './schemas/curriculum.schema.js';

export type ClassroomRenderOptions = {
  readonly currentModule: ModuleSchema;
  readonly allModules: readonly ModuleSchema[];
  readonly completedModuleIds: readonly string[];
  readonly selectedAnswer: number | undefined;
  readonly savedNote: string;
  readonly seniorModeActive: boolean;
  readonly sidebarExpanded: boolean;
  readonly sidebarQuery: string;
  readonly routePrefix: 'aprender' | 'modulo';
  readonly hintsRevealed?: number;
  readonly workbenchChoices?: readonly number[];
  readonly workbenchEvaluated?: boolean;
  readonly manifestLookup?: ReadonlyMap<string, AssetManifestItemSchema>;
  readonly audioManifest?: AudioManifestCatalogSchema;
};

function esc(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch),
  );
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function buildClassroomModuleHref(
  module_id: string,
  route_prefix: 'aprender' | 'modulo',
  senior_mode_active: boolean,
): string {
  if (route_prefix === 'aprender') {
    return `#/aprender/${module_id}${senior_mode_active ? '?senior=1' : ''}`;
  }
  return `#/modulo/${module_id}`;
}

export function filterClassroomSidebarModules(
  all_modules: readonly ModuleSchema[],
  query: string,
): ModuleSchema[] {
  const normalized = normalizeText(query);
  if (!normalized) return [...all_modules];
  return all_modules.filter((mod) =>
    normalizeText(`${mod.id} ${mod.title} ${mod.level} ${mod.concept}`).includes(normalized),
  );
}

export function renderSeniorLessonInlineHtml(mod: ModuleSchema): string {
  const challenge = lessonSeniorScenario(mod);
  if (!challenge) {
    return '';
  }
  const scenario = challenge.scenario;
  return `<div class="senior-inline" data-senior-contextual="supported" data-senior-seed="${challenge.seed}">
    <strong>♛ Microdesafío Senior contextual · ${esc(mod.id)}</strong>
    <p><b>Variante reproducible ${challenge.seed}.</b> Diseña para ${esc(scenario.traffic)}, SLO ${esc(scenario.availability)}, equipo de ${esc(scenario.team)} y presupuesto ${esc(scenario.budget)}. Incidente considerado: ${esc(scenario.failure)}.</p>
    <p><b>Tu tarea:</b> ${esc(challenge.task)}</p>
    <p><b>Cómo validarlo:</b> ${esc(challenge.verification)}</p>
    <p class="muted">Redacta tu respuesta en el cuaderno del módulo y pulsa «Comprobar reflexión Senior». La revisión es estructural y no sustituye juicio humano.</p>
  </div>`;
}

export function renderClassroomSidebarHtml(options: ClassroomRenderOptions): string {
  const {
    currentModule,
    allModules,
    completedModuleIds,
    seniorModeActive,
    sidebarExpanded,
    sidebarQuery,
    routePrefix,
  } = options;
  const filtered = filterClassroomSidebarModules(allModules, sidebarQuery);

  return `<div class="aside-panel classroom-index-panel">
    <div class="classroom-index-head">
      <h3>Índice del aula (${completedModuleIds.length}/${allModules.length})</h3>
      <button
        type="button"
        class="btn secondary small"
        id="toggle-classroom-index"
        aria-expanded="${sidebarExpanded ? 'true' : 'false'}"
        aria-controls="classroom-index-body"
      >${sidebarExpanded ? 'Ocultar lista' : 'Ver 36 módulos'}</button>
    </div>
    <div id="classroom-index-body" ${sidebarExpanded ? '' : 'hidden'}>
      <label class="field-label classroom-search-label">Filtrar lección
        <input
          id="classroom-index-query"
          type="search"
          value="${esc(sidebarQuery)}"
          placeholder="Ej. B06, hexagonal, CQRS..."
          maxlength="50"
        />
      </label>
      <nav aria-label="Índice de las 36 lecciones" class="classroom-nav-groups">
        ${CURRICULUM_LEVELS.map((level) => {
          const items = filtered.filter((m) => m.level === level);
          if (items.length === 0) return '';
          return `<div class="classroom-level-block">
            <span class="overline">${esc(level.toUpperCase())}</span>
            <ul class="classroom-module-list">
              ${items
                .map((item) => {
                  const is_current = item.id === currentModule.id;
                  const item_readiness = resolveModuleContentReadiness(item, completedModuleIds);
                  const is_done = item_readiness === 'completed';
                  const status_glyph =
                    item_readiness === 'coming_soon' ? '◌ Próx.' : is_done ? '✓' : '○';
                  const href = buildClassroomModuleHref(item.id, routePrefix, seniorModeActive);
                  return `<li>
                    <a
                      href="${esc(href)}"
                      class="classroom-module-link ${is_current ? 'current' : ''} ${is_done ? 'done' : ''}"
                      ${is_current ? 'aria-current="page"' : ''}
                    >
                      <span><b>${esc(item.id)}</b> · ${esc(item.title)}</span>
                      <small>${status_glyph}</small>
                    </a>
                  </li>`;
                })
                .join('')}
            </ul>
          </div>`;
        }).join('')}
        ${filtered.length === 0 ? '<p class="muted">Ninguna lección coincide con la búsqueda.</p>' : ''}
      </nav>
    </div>
  </div>`;
}

export function renderLessonClassroomHtml(options: ClassroomRenderOptions): string {
  const {
    currentModule: mod,
    allModules,
    completedModuleIds,
    selectedAnswer: answer,
    savedNote,
    seniorModeActive,
    routePrefix,
    hintsRevealed = 0,
    workbenchChoices = [],
    workbenchEvaluated = false,
    manifestLookup,
  } = options;

  const idx = allModules.findIndex((x) => x.id === mod.id);
  const readiness = resolveModuleContentReadiness(mod, completedModuleIds);
  const done = readiness === 'completed';
  const enrichment = getLessonEnrichment(mod.id);
  const previous = idx > 0 ? allModules[idx - 1] : undefined;
  const next = idx >= 0 && idx < allModules.length - 1 ? allModules[idx + 1] : undefined;
  const prereqs = CURRICULUM_PREREQUISITES[mod.id] ?? [];
  const missing_prereqs = prereqs.filter((pid) => !completedModuleIds.includes(pid));
  const lesson_hints = deriveLessonHints(mod);
  const classroom_pose = done
    ? 'arquibot-exito'
    : seniorModeActive
      ? 'arquibot-senior'
      : 'arquibot-libro';

  return `<div class="lesson-layout">
    <div>
      <div class="backline">
        <a href="#/rutas">← Volver a las rutas</a>
        <span><a href="#/mapa">Mapa 54 nodos</a> · ${esc(mod.level)} / ${esc(mod.id)}</span>
      </div>
      <div class="lesson-head">
        <span class="eyebrow">▣ MÓDULO ${esc(mod.id)} · ${esc(mod.level.toUpperCase())}</span>
        <h1>${esc(mod.title)}</h1>
        <p>${formatSafeArchitecturalProseHtml(mod.concept)}</p>
        <div class="meta">
          <span>◷ ${mod.readingMinutes} minutos</span>
          <span>◈ Concepto + caso + reto</span>
          <span>${readiness === 'coming_soon' ? '◌ Próximamente' : done ? '✓ Aprobado' : '◉ Por completar'}</span>
          ${prereqs.length > 0 ? `<span>Prerrequisitos: ${esc(prereqs.join(', '))}</span>` : ''}
          ${
            seniorModeActive
              ? lessonSeniorScenario(mod)
                ? `<span data-senior-contextual-badge="supported">♛ Desafío Senior activo</span>`
                : `<span data-senior-contextual-badge="unsupported">♛ Senior contextual disponible en I01–A12</span>`
              : ''
          }
        </div>
        ${
          readiness === 'coming_soon'
            ? `<div class="feedback bad mt-12" data-module-readiness="coming_soon" role="status">
                <strong>◌ Próximamente · Contenido en preparación</strong>
                <p>Este módulo aún no dispone de contenido ni actividad verificable completos; no puede marcarse como completado hasta su publicación íntegra.</p>
              </div>`
            : ''
        }
        ${
          prereqs.length > 0
            ? `<div class="prereq-readiness-bar mt-12" role="region" aria-label="Estado de prerrequisitos del módulo">
                <strong>${missing_prereqs.length === 0 ? '✓ Prerrequisitos completados:' : '◈ Ruta recomendada previa (acceso libre no bloqueante):'}</strong>
                <div class="spec-modules mt-8">
                  ${prereqs
                    .map((pid) => {
                      const p_done = completedModuleIds.includes(pid);
                      return `<a href="${esc(buildClassroomModuleHref(pid, routePrefix, seniorModeActive))}" class="${p_done ? 'finished' : ''}">${esc(pid)} ${p_done ? '✓' : '↗'}</a>`;
                    })
                    .join('')}
                </div>
              </div>`
            : ''
        }
      </div>

      ${renderLessonExecutiveDigestHtml(
        mod,
        answer !== undefined,
        Boolean(workbenchEvaluated && workbenchChoices.length === 2),
        done,
      )}

      <nav class="section-jump-bar" aria-label="Navegación rápida de secciones de la lección">
        <button type="button" class="jump-pill" data-scroll-target="sec-cinema">▶ Video resumen</button>
        <button type="button" class="jump-pill" data-scroll-target="sec-comprende">01 · Idea clave</button>
        ${enrichment ? '<button type="button" class="jump-pill" data-scroll-target="sec-diagrama">⬡ Diagrama y Código</button>' : ''}
        <button type="button" class="jump-pill" data-scroll-target="sec-workbench">02 · Taller 2/4</button>
        <button type="button" class="jump-pill" data-scroll-target="sec-aplica">03 · Decisión</button>
        <button type="button" class="jump-pill" data-scroll-target="sec-reflexiona">04 · Cuaderno</button>
      </nav>

      <div id="sec-cinema" class="cinema-lesson-slot">
        ${renderArquiBotCinemaHtml(buildModuleCinemaDeck(mod, options.audioManifest), {
          compact: true,
          manifestLookup,
        })}
      </div>

      <article id="sec-comprende" class="lesson-card">
        <span class="overline">01 / COMPRENDE</span>
        <h2>Concepto esencial</h2>
        <p>${formatSafeArchitecturalProseHtml(mod.lesson)}</p>
        <div class="lesson-quote"><b>Aplicación real · NexoShop</b><p>${formatSafeArchitecturalProseHtml(mod.example)}</p></div>
        ${seniorModeActive ? renderSeniorLessonInlineHtml(mod) : ''}
      </article>

      ${enrichment ? renderLessonEnrichmentSectionHtml(enrichment) : ''}

      <div id="sec-workbench">${renderLessonWorkbenchHtml(mod.id, workbenchChoices, workbenchEvaluated)}</div>

      ${
        mod.comparison
          ? `<article class="lesson-card">
              <span class="overline">02 / COMPARA</span>
              <h2>${esc(mod.comparison)}</h2>
              <p>${formatSafeArchitecturalProseHtml(mod.reason ?? '')}</p>
              <div class="lesson-quote"><b>Cómo comprobarlo</b><p>${formatSafeArchitecturalProseHtml(mod.metric ?? '')}</p></div>
              <div class="senior-inline"><strong>◈ Desafío de transferencia</strong><p>${formatSafeArchitecturalProseHtml(mod.transfer ?? '')}</p><p class="muted">Redacta tu solución en el cuaderno de decisiones y describe cómo la verificarías.</p></div>
            </article>`
          : ''
      }

      <article id="sec-aplica" class="lesson-card">
        <span class="overline">03 / APLICA</span>
        <h2>Decisión de arquitectura</h2>
        <p>Selecciona la alternativa más apropiada para el contexto descrito. Se guarda localmente tu resultado.</p>
        ${renderHintDrawerHtml({
          idPrefix: 'lesson-hint',
          hints: lesson_hints,
          revealedCount: hintsRevealed,
          manifestLookup,
        })}
        <div class="question-box">
          <strong>${formatSafeArchitecturalProseHtml(mod.question)}</strong>
          ${mod.options
            .map(
              (opt, i) =>
                `<button class="option ${answer === i ? 'selected' : ''} ${answer !== undefined && i === mod.correct ? 'correct-option' : ''}" data-ui-state="${answer === i ? (answer === mod.correct ? 'success' : 'error') : 'idle'}" data-answer="${i}"><span>${String.fromCharCode(65 + i)}</span>${formatSafeArchitecturalProseHtml(opt)}${answer === i ? ' <b>◉</b>' : ''}</button>`,
            )
            .join('')}
        </div>
        ${
          answer !== undefined
            ? renderSolutionRevealHtml({
                isCorrect: answer === mod.correct,
                chosenLabel: mod.options[answer] ?? '',
                referenceLabel: mod.options[mod.correct] ?? '',
                explanation: mod.explanation,
                verificationMetric: mod.metric,
                manifestLookup,
              })
            : ''
        }
      </article>

      <article id="sec-reflexiona" class="lesson-card">
        <span class="overline">04 / REFLEXIONA</span>
        <h2>Cuaderno de decisiones</h2>
        <p>Explica qué priorizarías, qué riesgo aceptarías y cómo lo verificarías. Estas notas se almacenan solo en tu navegador.</p>
        <textarea class="note-area" id="lesson-notes" aria-label="Cuaderno de decisiones de la lección" rows="5" placeholder="Decisión: ...\nSupuestos: ...\nTrade-off: ...\nCómo validarlo: ...">${esc(savedNote)}</textarea>
        <div id="senior-lesson-report" role="status"></div>
        <div class="inline-actions">
          <button class="btn secondary small" id="save-notes">Guardar reflexión</button>
          ${seniorModeActive && lessonSeniorScenario(mod) ? '<button class="btn secondary small" id="check-senior-lesson">Comprobar reflexión Senior</button>' : ''}
          <button class="btn primary small" id="complete-lesson" ${readiness === 'coming_soon' || answer !== mod.correct ? 'disabled data-ui-state="disabled"' : 'data-ui-state="idle"'}>${readiness === 'coming_soon' ? '◌ Próximamente' : done ? '✓ Lección aprobada' : `Completar módulo +${LESSON_XP_REWARD} XP`}</button>
        </div>
      </article>

      <section class="lesson-card" data-module-references="true" aria-label="Referencias canónicas y atribuciones">
        <span class="overline">05 / REFERENCIAS Y ATRIBUCIONES</span>
        <h2>Fuentes canónicas de profundización</h2>
        <ul>
          ${(MODULE_CANONICAL_REFERENCES[mod.id] ?? ['Martin Fowler — Software Architecture Guide']).map((ref) => `<li>${esc(ref)}</li>`).join('')}
        </ul>
        <small class="muted">Atribución pedagógica: las explicaciones, diagramas SVG y ejemplos NexoShop son síntesis originales de ARQPIXEL Academy elaboradas con fines educativos; las obras y marcas citadas pertenecen a sus respectivos autores.</small>
      </section>

      <div class="lesson-nav">
        ${previous ? `<a href="${esc(buildClassroomModuleHref(previous.id, routePrefix, seniorModeActive))}">← ${esc(previous.title)}</a>` : '<span></span>'}
        ${next ? `<a href="${esc(buildClassroomModuleHref(next.id, routePrefix, seniorModeActive))}">${esc(next.title)} →</a>` : '<a href="#/senior">Ir al Senior Mode →</a>'}
      </div>
    </div>

    <aside class="lesson-aside">
      ${renderClassroomSidebarHtml(options)}
      <div class="aside-panel">
        ${renderArquiBotSprite(classroom_pose, 128, '', manifestLookup)}
        <h3>Consejo de ArquiBot</h3>
        <p>La mejor arquitectura no es la más compleja: es la que resuelve las restricciones actuales y deja opciones para cambiar.</p>
      </div>
      <div class="aside-panel">
        <h3>Tu checklist</h3>
        <p>✓ Leer concepto</p>
        <p>✓ Estudiar caso</p>
        <p>${answer === mod.correct ? '✓' : '○'} Responder correctamente</p>
        <p>${done ? '✓' : '○'} Completar lección</p>
      </div>
    </aside>
  </div>`;
}
