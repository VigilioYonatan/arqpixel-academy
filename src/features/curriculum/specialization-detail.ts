import type { MissionSchema } from '../senior/schemas/senior.schema.js';
import {
  CURRICULUM_PREREQUISITES,
  SPECIALIZATION_ENRICHMENTS,
} from './constants/curriculum.constants.js';
import type { LearningPathSchema, ModuleSchema } from './schemas/curriculum.schema.js';

export type SpecializationStepStatus = 'completed' | 'ready' | 'pending_prereq';

export type SpecializationModuleStep = {
  readonly stepNumber: number;
  readonly module: ModuleSchema;
  readonly status: SpecializationStepStatus;
  readonly missingPrerequisites: readonly string[];
};

export type SpecializationMissionLink = {
  readonly mission: MissionSchema;
  readonly awarded: boolean;
};

export type SpecializationDetailModel = {
  readonly path: LearningPathSchema;
  readonly targetProfile: string;
  readonly steps: readonly SpecializationModuleStep[];
  readonly completedCount: number;
  readonly totalCount: number;
  readonly progressPercent: number;
  readonly totalReadingMinutes: number;
  readonly nextModuleId: string | null;
  readonly relatedMissions: readonly SpecializationMissionLink[];
  readonly recommendedLabs: ReadonlyArray<readonly [string, string]>;
  readonly capstoneProjectId: string;
  readonly capstoneCompleted: boolean;
};

function esc(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch),
  );
}

export function buildSpecializationDetailModel(
  path_id: string,
  paths: readonly LearningPathSchema[],
  modules: readonly ModuleSchema[],
  missions: readonly MissionSchema[],
  completed_module_ids: readonly string[],
  awarded_mission_ids: readonly string[],
  completed_project_ids: readonly string[] = [],
): SpecializationDetailModel | null {
  const normalized_id = path_id.trim().toUpperCase();
  const path = paths.find((item) => item.id === normalized_id);
  if (!path) return null;

  const done_set = new Set(completed_module_ids);
  const awarded_set = new Set(awarded_mission_ids);
  const project_done_set = new Set(completed_project_ids);
  const module_lookup = new Map(modules.map((m) => [m.id, m]));
  const mission_lookup = new Map(missions.map((s) => [s.id, s]));

  const enrichment = SPECIALIZATION_ENRICHMENTS[path.id] ?? {
    relatedMissions: [],
    recommendedLabs: [['c4', 'C4 Studio']],
    capstoneProjectId: `CAP-${path.id}`,
    targetProfile: path.summary,
  };

  const steps: SpecializationModuleStep[] = [];
  for (const mod_id of path.modules) {
    const mod = module_lookup.get(mod_id);
    if (!mod) continue;
    const prereqs = CURRICULUM_PREREQUISITES[mod.id] ?? [];
    const missing = prereqs.filter((req) => !done_set.has(req));
    const status: SpecializationStepStatus = done_set.has(mod.id)
      ? 'completed'
      : missing.length === 0
        ? 'ready'
        : 'pending_prereq';
    steps.push({
      stepNumber: steps.length + 1,
      module: mod,
      status,
      missingPrerequisites: missing,
    });
  }

  const completed_count = steps.filter((s) => s.status === 'completed').length;
  const total_count = steps.length;
  const progress_percent = total_count > 0 ? Math.round((completed_count / total_count) * 100) : 0;
  const total_minutes = steps.reduce((acc, item) => acc + item.module.readingMinutes, 0);
  const next_step = steps.find((s) => s.status !== 'completed') ?? null;

  const related_missions: SpecializationMissionLink[] = enrichment.relatedMissions
    .map((id) => mission_lookup.get(id))
    .filter((m): m is MissionSchema => Boolean(m))
    .map((mission) => ({
      mission,
      awarded: awarded_set.has(mission.id),
    }));

  return {
    path,
    targetProfile: enrichment.targetProfile,
    steps,
    completedCount: completed_count,
    totalCount: total_count,
    progressPercent: progress_percent,
    totalReadingMinutes: total_minutes,
    nextModuleId: next_step ? next_step.module.id : null,
    relatedMissions: related_missions,
    recommendedLabs: enrichment.recommendedLabs,
    capstoneProjectId: enrichment.capstoneProjectId,
    capstoneCompleted: project_done_set.has(enrichment.capstoneProjectId),
  };
}

export function renderSpecializationDetailHtml(
  detail: SpecializationDetailModel | null,
  all_paths: readonly LearningPathSchema[],
): string {
  if (!detail) {
    return `<div class="page-title">
      <span class="eyebrow">RUTA NO ENCONTRADA</span>
      <h1>Especialización desconocida</h1>
      <p>El identificador solicitado no corresponde a ninguna de las ocho rutas técnicas registradas (R01–R08).</p>
      <div class="inline-actions">
        <a class="btn primary small" href="#/especializaciones">Ver las 8 especializaciones</a>
        <a class="btn secondary small" href="#/rutas">Ir a rutas por nivel</a>
      </div>
    </div>`;
  }

  const current_idx = all_paths.findIndex((p) => p.id === detail.path.id);
  const prev_path = current_idx > 0 ? all_paths[current_idx - 1] : undefined;
  const next_path = current_idx >= 0 && current_idx < all_paths.length - 1 ? all_paths[current_idx + 1] : undefined;

  return `<div class="backline">
    <a href="#/especializaciones">← Todas las especializaciones</a>
    <span>${esc(detail.path.id)} · ${esc(detail.path.tag)}</span>
  </div>

  <div class="page-title">
    <span class="eyebrow">◈ ESPECIALIZACIÓN TÉCNICA · ${esc(detail.path.id)}</span>
    <h1>${esc(detail.path.title)}</h1>
    <p>${esc(detail.path.summary)}</p>
  </div>

  <div class="stats-grid">
    <div class="stat"><span class="stat-ico">✓</span><b>${detail.completedCount}<small>/ ${detail.totalCount}</small></b><p>Módulos aprobados (${detail.progressPercent}%)</p></div>
    <div class="stat"><span class="stat-ico mint">◷</span><b>${detail.totalReadingMinutes}<small> min</small></b><p>Lectura y práctica estimada</p></div>
    <div class="stat"><span class="stat-ico purple">♛</span><b>${detail.relatedMissions.filter((m) => m.awarded).length}<small>/ ${detail.relatedMissions.length}</small></b><p>Misiones Senior vinculadas</p></div>
    <div class="stat"><span class="stat-ico yellow">▣</span><b>${detail.capstoneCompleted ? '1' : '0'}<small>/ 1</small></b><p>Capstone ${esc(detail.capstoneProjectId)} (${detail.capstoneCompleted ? 'Listo' : 'Pendiente'})</p></div>
  </div>

  <div class="lesson-layout">
    <div>
      <section class="lesson-card">
        <span class="overline">PERFIL Y SECUENCIA RECOMENDADA</span>
        <h2>Hoja de ruta paso a paso</h2>
        <p>${esc(detail.targetProfile)} Completar una lección aquí actualiza el progreso único global sin duplicar XP.</p>
        <progress class="progress arq-progress" max="100" value="${detail.progressPercent}" aria-label="Progreso de ruta ${detail.progressPercent}%"></progress>
        <div class="inline-actions mt-14">
          ${
            detail.nextModuleId
              ? `<a class="btn primary small" href="#/aprender/${esc(detail.nextModuleId)}">▶ Continuar con ${esc(detail.nextModuleId)} ↗</a>`
              : `<a class="btn primary small" href="#/proyectos/${esc(detail.capstoneProjectId)}">▶ Ir al Proyecto Capstone ↗</a>`
          }
          <a class="btn secondary small" href="#/mapa">Ver en el mapa de 54 nodos</a>
        </div>
      </section>

      <section class="track-section" aria-label="Secuencia de módulos de la especialización">
        <div class="spec-steps-list">
          ${detail.steps
            .map((step) => {
              const badge =
                step.status === 'completed'
                  ? '✓ Aprobado'
                  : step.status === 'ready'
                    ? '▶ Listo para cursar'
                    : `◇ Sugerido tras: ${step.missingPrerequisites.join(', ')}`;
              return `<article class="lesson-card spec-step-card ${step.status === 'completed' ? 'complete' : ''}">
                <div class="map-node-top mb-10">
                  <span class="eyebrow">PASO 0${step.stepNumber} · ${esc(step.module.id)} · ${esc(step.module.level)}</span>
                  <span class="map-badge">${esc(badge)}</span>
                </div>
                <h3>${esc(step.module.title)}</h3>
                <p>${esc(step.module.concept)}</p>
                <div class="map-filter-bar">
                  <small class="muted">◷ ${step.module.readingMinutes} min · Práctica: ${esc(step.module.activity)}</small>
                  <a class="btn secondary small" href="#/aprender/${esc(step.module.id)}">${step.status === 'completed' ? 'Repasar lección' : 'Abrir aula →'}</a>
                </div>
              </article>`;
            })
            .join('')}
        </div>
      </section>

      <section class="lesson-card spec-capstone-callout">
        <span class="overline">ENTREGABLE INTEGRADOR · REVISIÓN HUMANA</span>
        <h2>Proyecto Capstone · ${esc(detail.capstoneProjectId)}</h2>
        <p>${esc(detail.path.capstone)}</p>
        <p class="muted">Incluye arquitectura C4/componentes, análisis de alternativas, registro ADR, matriz de riesgos y plan de verificación exportable en Markdown y JSON. No otorga certificación profesional automática.</p>
        <div class="inline-actions">
          <a class="btn primary small" href="#/proyectos/${esc(detail.capstoneProjectId)}">Abrir workspace del proyecto ↗</a>
          <a class="btn secondary small" href="#/proyectos">Todos los proyectos</a>
        </div>
      </section>

      <div class="lesson-nav">
        ${prev_path ? `<a href="#/rutas/${esc(prev_path.id)}">← ${esc(prev_path.id)} · ${esc(prev_path.title)}</a>` : '<span></span>'}
        ${next_path ? `<a href="#/rutas/${esc(next_path.id)}">${esc(next_path.id)} · ${esc(next_path.title)} →</a>` : '<a href="#/proyectos">Ir a Proyectos Capstone →</a>'}
      </div>
    </div>

    <aside class="lesson-aside">
      <div class="aside-panel">
        <h3>Misiones Senior asociadas</h3>
        <p class="muted">Pon a prueba los principios de ${esc(detail.path.title)} bajo restricciones de producción:</p>
        <ul class="map-rel-list">
          ${detail.relatedMissions
            .map(
              ({ mission, awarded }) =>
                `<li><a class="map-rel-chip ${awarded ? 'done' : ''}" href="#/taller-senior/${esc(mission.id)}">${awarded ? '✓' : '♛'} <b>${esc(mission.id)}</b> · ${esc(mission.title)}</a></li>`,
            )
            .join('')}
        </ul>
      </div>
      <div class="aside-panel">
        <h3>Laboratorios vinculados</h3>
        <ul class="map-rel-list">
          ${detail.recommendedLabs
            .map(
              ([lab_id, lab_title]) =>
                `<li><a class="map-rel-chip" href="#/laboratorio/${esc(lab_id)}">⌘ ${esc(lab_title)} ↗</a></li>`,
            )
            .join('')}
        </ul>
      </div>
    </aside>
  </div>`;
}

export function renderSpecializationsCatalogHtml(
  paths: readonly LearningPathSchema[],
  modules: readonly ModuleSchema[],
  completed_ids: readonly string[],
): string {
  const done_total = completed_ids.length;
  return `<div class="page-title"><span class="eyebrow">◈ OCHO CAMINOS DEL ARQUITECTO</span><h1>Especializaciones técnicas</h1><p>Ocho rutas temáticas que comparten las 36 lecciones; completar un módulo cuenta una sola vez en tu progreso. Cada ruta cuenta con vista detallada paso a paso y un proyecto diseñado para revisión humana.</p></div>
  <section class="arq-stats-strip stats-strip" aria-label="Resumen de especializaciones">
    <div class="intro-stat"><strong>${paths.length}</strong><small>RUTAS TEMÁTICAS</small></div>
    <div class="intro-stat"><strong>${done_total}/${modules.length}</strong><small>MÓDULOS BASE</small></div>
    <div class="intro-stat"><strong>8</strong><small>CAPSTONES R01–R08</small></div>
    <div class="intro-stat"><strong>18</strong><small>RETOS SENIOR</small></div>
  </section>
  <div class="specialization-grid">
    ${paths
      .map((path, idx) => {
        const completed_in_path = path.modules.filter((id) => completed_ids.includes(id)).length;
        return `<section class="specialization-card">
          <div class="level-ghost-num" aria-hidden="true">0${idx + 1}</div>
          <span class="eyebrow">${esc(path.id)} · ${esc(path.tag)}</span>
          <h2>${esc(path.title)}</h2>
          <p>${esc(path.summary)}</p>
          <div class="spec-progress">
            <span>${completed_in_path} / ${path.modules.length} módulos completados</span>
            <progress class="progress arq-progress" max="100" value="${Math.round((completed_in_path / path.modules.length) * 100)}" aria-label="Progreso ${esc(path.id)}"></progress>
          </div>
          <div class="spec-modules">
            ${path.modules
              .map((id) => {
                const mod = modules.find((x) => x.id === id);
                return `<a href="#/aprender/${esc(id)}" title="${esc(mod?.title || id)}" class="${completed_ids.includes(id) ? 'finished' : ''}">${esc(id)} ${completed_ids.includes(id) ? '✓' : ''}</a>`;
              })
              .join('')}
          </div>
          <div class="spec-capstone">
            <strong>Proyecto de cierre</strong>
            <p>${esc(path.capstone)}</p>
            <small>Requiere diseño, evidencia y revisión crítica; no otorga una certificación automática.</small>
          </div>
          <div class="inline-actions mt-14">
            <a class="btn primary small" href="#/rutas/${esc(path.id)}">Abrir ruta ${esc(path.id)} paso a paso →</a>
            <a class="btn secondary small" href="#/proyectos/CAP-${esc(path.id)}">Workspace Capstone →</a>
          </div>
        </section>`;
      })
      .join('')}
  </div>`;
}
