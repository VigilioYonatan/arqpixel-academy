import type { LearningPathSchema, ModuleSchema } from '../curriculum/schemas/curriculum.schema.js';
import { APP_VERSION_LABEL } from '../shared/constants/app.constants.js';
import {
  type AssetManifestItemSchema,
  renderArquiBotSprite,
} from '../shared/schemas/assets-manifest.schema.js';
import { renderProgressRingSvg } from '../shared/ui/interactive-components.js';
import {
  ACHIEVEMENT_BLUEPRINTS,
  ACHIEVEMENT_CATEGORIES,
  type AchievementCategory,
} from './constants/profile.constants.js';
import type { UserSettingsSchema } from './schemas/settings.schema.js';

export type ComputedAchievement = {
  readonly id: string;
  readonly title: string;
  readonly category: AchievementCategory;
  readonly criteriaText: string;
  readonly currentCount: number;
  readonly targetCount: number;
  readonly unlocked: boolean;
  readonly progressPercent: number;
};

export type AchievementsInput = {
  readonly modules: readonly ModuleSchema[];
  readonly paths: readonly LearningPathSchema[];
  readonly completedModuleIds: readonly string[];
  readonly awardedMissionIds: readonly string[];
  readonly miniGamesBestTotal: number;
  readonly completedProjectIds: readonly string[];
  readonly xp: number;
};

export type StorageEntryStat = {
  readonly keyGroup: string;
  readonly itemCount: number;
  readonly approxBytes: number;
};

function esc(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch),
  );
}

export function computeAchievementsModel(input: AchievementsInput): ComputedAchievement[] {
  const done_set = new Set(input.completedModuleIds);
  const awarded_set = new Set(input.awardedMissionIds);
  const path_lookup = new Map(input.paths.map((p) => [p.id, p]));

  const countByLevel = (level: ModuleSchema['level']): number =>
    input.modules.filter((m) => m.level === level && done_set.has(m.id)).length;

  const countByPath = (path_id: string): { current: number; target: number } => {
    const p = path_lookup.get(path_id);
    if (!p) return { current: 0, target: 1 };
    return {
      current: p.modules.filter((id) => done_set.has(id)).length,
      target: p.modules.length,
    };
  };

  return ACHIEVEMENT_BLUEPRINTS.map((bp) => {
    let current = 0;
    let target = bp.targetCount;

    if (bp.id === 'ACH-FIRST-MODULE') current = Math.min(1, done_set.size);
    else if (bp.id === 'ACH-BASICS-12') current = countByLevel('Básico');
    else if (bp.id === 'ACH-INTERMEDIATE-12') current = countByLevel('Intermedio');
    else if (bp.id === 'ACH-ADVANCED-12') current = countByLevel('Avanzado');
    else if (bp.id === 'ACH-CURRICULUM-36') current = done_set.size;
    else if (bp.id === 'ACH-SENIOR-FIRST') current = Math.min(1, awarded_set.size);
    else if (bp.id === 'ACH-SENIOR-CRITICAL-PAIR') {
      current = (awarded_set.has('S09') ? 1 : 0) + (awarded_set.has('S11') ? 1 : 0);
    } else if (bp.id === 'ACH-SENIOR-ALL-18') current = awarded_set.size;
    else if (bp.id.startsWith('ACH-PATH-')) {
      const path_id = bp.id.replace('ACH-PATH-', '');
      const stats = countByPath(path_id);
      current = stats.current;
      target = stats.target;
    } else if (bp.id === 'ACH-MINIGAMES-30') current = Math.min(30, input.miniGamesBestTotal);
    else if (bp.id === 'ACH-CAPSTONE-AUTHOR') current = Math.min(1, input.completedProjectIds.length);

    const unlocked = current >= target && target > 0;
    const progress_percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

    return {
      id: bp.id,
      title: bp.title,
      category: bp.category,
      criteriaText: bp.criteriaText,
      currentCount: current,
      targetCount: target,
      unlocked,
      progressPercent: progress_percent,
    };
  });
}

export function exportAchievementsMarkdown(
  achievements: readonly ComputedAchievement[],
  xp: number,
): string {
  const unlocked_count = achievements.filter((a) => a.unlocked).length;
  return [
    '# Resumen Local de Logros — ARQPIXEL Academy',
    '',
    `- **XP acumulados (verificados localmente):** ${xp} XP`,
    `- **Insignias desbloqueadas:** ${unlocked_count} / ${achievements.length}`,
    `- **Aviso importante:** Este registro refleja progreso autoevaluado en navegador; no constituye certificación profesional ni acreditación académica.`,
    '',
    '## Detalle por insignia',
    ...achievements.map(
      (item) =>
        `- [${item.unlocked ? 'x' : ' '}] **${item.title}** (${item.currentCount}/${item.targetCount}) — ${item.criteriaText}`,
    ),
    '',
  ].join('\n');
}

export function renderAchievementsPageHtml(
  achievements: readonly ComputedAchievement[],
  xp: number,
  category_filter: string = 'ALL',
): string {
  const unlocked_total = achievements.filter((a) => a.unlocked).length;
  const visible = achievements.filter(
    (a) => category_filter === 'ALL' || a.category === category_filter,
  );

  return `<div class="backline">
    <a href="#/perfil">← Volver a Mi progreso</a>
    <span>INSIGNIAS Y HITOS</span>
  </div>

  <div class="page-title">
    <span class="eyebrow">🏆 COLECCIÓN TRANSPARENTE DE HITOS</span>
    <h1>Logros e insignias de arquitectura</h1>
    <p>Cada insignia responde a una regla verificable y auditable sobre tu avance local. Las insignias celebran tu práctica; no sustituyen experiencia laboral ni evaluación por expertos.</p>
  </div>

  <div class="profile-banner mb-20">
    ${renderArquiBotSprite('arquibot-graduado', 112)}
    <div>
      <span class="eyebrow">PORTAFOLIO AUDITABLE</span>
      <h2>${unlocked_total} de ${achievements.length} insignias verificadas</h2>
      <p>Progreso acumulado: ${xp} XP · Las evidencias abiertas permanecen con revisión humana obligatoria.</p>
    </div>
    ${renderProgressRingSvg({
      percent: Math.round((unlocked_total / Math.max(1, achievements.length)) * 100),
      size: 68,
      label: 'Cobertura de insignias',
    })}
  </div>

  <div class="stats-grid">
    <div class="stat"><span class="stat-ico">🏆</span><b>${unlocked_total}<small>/ ${achievements.length}</small></b><p>Insignias desbloqueadas</p></div>
    <div class="stat"><span class="stat-ico yellow">✦</span><b>${xp}</b><p>XP verificados (idempotentes)</p></div>
    <div class="stat"><span class="stat-ico mint">◈</span><b>${Math.round((unlocked_total / achievements.length) * 100)}%</b><p>Cobertura de hitos</p></div>
    <div class="stat"><span class="stat-ico purple">▣</span><b>100%</b><p>Local-first · Exportable MD/JSON</p></div>
  </div>

  <section class="lesson-card map-filters-card" aria-label="Filtrar y exportar insignias">
    <div class="map-filter-bar filter-bar-flush">
      <label class="field-label min-w-250">Categoría de logro
        <select id="ach-category-filter">
          <option value="ALL" ${category_filter === 'ALL' ? 'selected' : ''}>Todas las categorías (${achievements.length})</option>
          ${ACHIEVEMENT_CATEGORIES.map(
            (cat) => `<option value="${esc(cat)}" ${category_filter === cat ? 'selected' : ''}>${esc(cat)}</option>`,
          ).join('')}
        </select>
      </label>
      <div class="inline-actions m-0">
        <button type="button" class="btn primary small" id="export-achievements-md">Exportar resumen (.md)</button>
        <button type="button" class="btn secondary small" data-print-dossier="true">🖨 Imprimir / PDF</button>
        <a class="btn secondary small" href="#/ajustes">Ajustes y respaldos →</a>
      </div>
    </div>
  </section>

  <div class="specialization-grid">
    ${visible
      .map(
        (ach) => `<article class="lesson-card achievement-detail-card ${ach.unlocked ? 'earned' : ''} m-0">
          <div class="map-node-top">
            <span class="eyebrow">${esc(ach.category)}</span>
            <span class="map-badge">${ach.unlocked ? '🏆 Conseguida' : `◌ ${ach.currentCount}/${ach.targetCount}`}</span>
          </div>
          <h3>${esc(ach.title)}</h3>
          <p>${esc(ach.criteriaText)}</p>
          <progress class="progress arq-progress" max="100" value="${ach.progressPercent}" aria-label="Avance ${esc(ach.title)} ${ach.progressPercent}%"></progress>
        </article>`,
      )
      .join('')}
  </div>`;
}

export function renderSettingsPageHtml(
  settings: UserSettingsSchema,
  storage_stats: readonly StorageEntryStat[],
): string {
  const total_bytes = storage_stats.reduce((acc, item) => acc + item.approxBytes, 0);
  const total_kb = (total_bytes / 1024).toFixed(1);

  return `<div class="backline">
    <a href="#/perfil">← Volver a Mi progreso</a>
    <span>PREFERENCIAS Y DATOS LOCALES</span>
  </div>

  <div class="page-title">
    <span class="eyebrow">⚙ CONFIGURACIÓN · ACCESIBILIDAD · PRIVACIDAD</span>
    <h1>Ajustes de ARQPIXEL</h1>
    <p>Personaliza tema visual, contraste, movimiento reducido, tamaño de lectura y gestiona de forma granular los datos almacenados en este navegador.</p>
  </div>

  <section class="live-blueprint-shell mb-20" aria-label="Contrato de persistencia y migración local-first">
    <div class="live-blueprint-topbar">
      <div class="live-status-group">
        <span class="live-status-pill"><i class="live-dot" aria-hidden="true"></i> PERSISTENCIA LOCAL-FIRST VERIFICADA</span>
        <span class="map-badge">Uso actual ~${esc(total_kb)} KB · Cero servidores externos</span>
      </div>
    </div>
    <div class="live-blueprint-body">
      <div class="tabular-metrics-grid">
        <div class="tabular-metric-cell"><span>ESQUEMA BACKUP</span><b>v2.0 (migra v1.2–v2.0)</b></div>
        <div class="tabular-metric-cell"><span>VALIDACIÓN IMPORT</span><b>Fail-closed + Anti-polución</b></div>
        <div class="tabular-metric-cell"><span>PROTECCIÓN RESET</span><b>Confirmación explícita</b></div>
        <div class="tabular-metric-cell"><span>XP IDEMPOTENTE</span><b>Sin inflación al recargar</b></div>
      </div>
    </div>
  </section>

  <div class="lesson-layout">
    <div>
      <section class="lesson-card">
        <span class="overline">01 / VISUALIZACIÓN Y ACCESIBILIDAD (WCAG 2.2)</span>
        <h2>Preferencias de interfaz</h2>

        <div class="map-filters-grid grid-2col mt-12">
          <label class="field-label">Modo de color y contraste
            <select id="set-theme-mode">
              <option value="dark" ${settings.themeMode === 'dark' ? 'selected' : ''}>Oscuro Modern Pixel (predeterminado)</option>
              <option value="light" ${settings.themeMode === 'light' ? 'selected' : ''}>Claro de alto confort</option>
              <option value="high-contrast" ${settings.themeMode === 'high-contrast' ? 'selected' : ''}>Alto contraste reforzado</option>
              <option value="system" ${settings.themeMode === 'system' ? 'selected' : ''}>Automático según el sistema operativo</option>
            </select>
          </label>

          <label class="field-label">Escala tipográfica de lectura
            <select id="set-font-scale">
              <option value="normal" ${settings.fontScale === 'normal' ? 'selected' : ''}>Normal (100 %)</option>
              <option value="large" ${settings.fontScale === 'large' ? 'selected' : ''}>Grande (112,5 %)</option>
              <option value="xlarge" ${settings.fontScale === 'xlarge' ? 'selected' : ''}>Extra grande (125 %)</option>
            </select>
          </label>
        </div>

        <div class="suite-checks mt-16">
          <label><input type="checkbox" id="set-reduced-motion" ${settings.reducedMotion ? 'checked' : ''}/> Reducir transiciones y microanimaciones</label>
          <label><input type="checkbox" id="set-classroom-sidebar" ${settings.classroomSidebarOpen ? 'checked' : ''}/> Desplegar índice de 36 módulos por defecto en el aula</label>
        </div>

        <div id="settings-feedback" role="status" aria-live="polite" class="muted mt-14">Los cambios se aplican al instante en este dispositivo.</div>
      </section>

      <section class="lesson-card">
        <span class="overline">02 / RESPALDO Y PORTABILIDAD</span>
        <h2>Exportar o restaurar copia completa</h2>
        <p>El archivo JSON unificado conserva lecciones, XP verificados, talleres Senior por semilla, minijuegos, proyectos Capstone y preferencias de accesibilidad.</p>
        <div class="inline-actions">
          <button type="button" class="btn primary small" id="settings-export-backup">Exportar respaldo completo (.json)</button>
          <label class="btn secondary small file-label">Importar respaldo (.json)<input type="file" accept="application/json,.json" id="settings-import-backup" class="sr-file-input"/></label>
        </div>
      </section>

      <section class="lesson-card">
        <span class="overline">03 / LIMPIEZA GRANULAR SEGURA</span>
        <h2>Borrar datos por categoría o misión individual</h2>
        <p class="muted">Estas operaciones solo afectan a las claves propias de ARQPIXEL y respetan cualquier otra aplicación alojada en el mismo origen.</p>
        <div class="map-filter-bar filter-bar-flush mb-16">
          <label class="field-label min-w-250">Reiniciar borradores de una sola misión Senior
            <select id="clear-single-senior-select">
              ${Array.from({ length: 18 }, (_, i) => {
                const code = `S${String(i + 1).padStart(2, '0')}`;
                return `<option value="${code}">Misión ${code} (todas sus semillas)</option>`;
              }).join('')}
            </select>
          </label>
          <button type="button" class="btn secondary small" id="clear-single-senior-btn">Limpiar misión elegida</button>
        </div>
        <div class="inline-actions">
          <button type="button" class="btn secondary small" id="clear-only-senior">Limpiar borradores Senior</button>
          <button type="button" class="btn secondary small" id="clear-only-minigames">Limpiar minijuegos</button>
          <button type="button" class="btn secondary small" id="clear-only-projects">Limpiar proyectos Capstone</button>
          <button type="button" class="btn textdanger small" id="clear-all-arqpixel">Restablecer todo ARQPIXEL</button>
        </div>
      </section>
    </div>

    <aside class="lesson-aside">
      <div class="aside-panel">
        <h3>Uso actual de localStorage (~${esc(total_kb)} KB)</h3>
        <ul class="map-rel-list">
          ${storage_stats
            .map(
              (st) =>
                `<li><span class="map-rel-chip chip-static"><b>${esc(st.keyGroup)}</b> · ${st.itemCount} clave(s) · ${st.approxBytes} B</span></li>`,
            )
            .join('')}
        </ul>
      </div>
      <div class="aside-panel">
        <h3>Transparencia y método</h3>
        <p class="muted">Consulta cómo funcionan los evaluadores, la política de privacidad y las licencias del compilador offline.</p>
        <a class="btn secondary small" href="#/sobre">Acerca de ARQPIXEL →</a>
      </div>
    </aside>
  </div>`;
}

export function renderProfileOverviewHtml(options: {
  readonly xp: number;
  readonly finishedModulesCount: number;
  readonly expectedModulesCount: number;
  readonly missionAttemptsCount: number;
  readonly achievements: readonly ComputedAchievement[];
  readonly miniGamesBestTotal: number;
  readonly completedProjectsCount: number;
  readonly totalProjectsCount: number;
  readonly manifestLookup?: ReadonlyMap<string, AssetManifestItemSchema>;
}): string {
  const {
    xp,
    finishedModulesCount,
    expectedModulesCount,
    missionAttemptsCount,
    achievements,
    miniGamesBestTotal,
    completedProjectsCount,
    totalProjectsCount,
    manifestLookup,
  } = options;
  const unlocked_count = achievements.filter((a) => a.unlocked).length;
  const summary_badges = achievements.slice(0, 6);
  const pct = Math.round((finishedModulesCount / Math.max(1, expectedModulesCount)) * 100);

  return `<div class="page-title">
    <span class="eyebrow">◉ TU PROGRESO LOCAL · PORTABILIDAD JSON</span>
    <h1>Mi perfil de arquitecto</h1>
    <p>Tu progreso, notas, talleres Senior por semilla y rúbricas se guardan únicamente en este navegador y sobreviven a recargas completas.</p>
  </div>

  <div class="profile-banner">
    ${renderArquiBotSprite('arquibot-graduado', 128, '', manifestLookup)}
    <div>
      <span class="eyebrow">ARQUITECTO EN FORMACIÓN</span>
      <h2>${xp} XP acumulados</h2>
      <p>${finishedModulesCount} módulos aprobados · ${missionAttemptsCount} misiones Senior registradas · ${unlocked_count}/${achievements.length} insignias</p>
      <progress class="progress arq-progress" max="100" value="${pct}" aria-label="Módulos completados ${pct}%"></progress>
    </div>
    ${renderProgressRingSvg({ percent: pct, size: 68, label: 'Módulos completados' })}
  </div>

  <section class="live-blueprint-shell mt-20 mb-20" aria-label="Flujo de persistencia local y respaldo verificable">
    <div class="live-blueprint-body">
      <svg class="senior-pipeline-svg" viewBox="0 0 680 76" role="img" aria-label="Flujo local: Aula y Talleres hacia localStorage, validador de esquema v2.0 y respaldo JSON">
        <rect width="680" height="76" rx="12" fill="#061426"/>
        <line x1="168" y1="38" x2="254" y2="38" class="arch-flow-edge" stroke="#16e1ee" stroke-width="2"/>
        <line x1="416" y1="38" x2="502" y2="38" class="arch-flow-edge" stroke="#53e2ba" stroke-width="2"/>
        <rect x="20" y="16" width="148" height="44" rx="9" fill="#0b2239" stroke="#18e1ee"/>
        <text x="94" y="36" text-anchor="middle" fill="#f3fbff" font-size="11" font-weight="bold" font-family="sans-serif">Aula + Senior + 3D</text>
        <text x="94" y="50" text-anchor="middle" fill="#8fd8f2" font-size="9" font-family="monospace">XP idempotente</text>
        <rect x="254" y="16" width="162" height="44" rx="9" fill="#0d3648" stroke="#53e2ba"/>
        <text x="335" y="36" text-anchor="middle" fill="#f3fbff" font-size="11" font-weight="bold" font-family="sans-serif">localStorage v1/v2</text>
        <text x="335" y="50" text-anchor="middle" fill="#8fd8f2" font-size="9" font-family="monospace">Persiste al recargar</text>
        <rect x="502" y="16" width="158" height="44" rx="9" fill="#0b2239" stroke="#18e1ee"/>
        <text x="581" y="36" text-anchor="middle" fill="#f3fbff" font-size="11" font-weight="bold" font-family="sans-serif">Export / Import JSON</text>
        <text x="581" y="50" text-anchor="middle" fill="#8fd8f2" font-size="9" font-family="monospace">Migración v1.2 → v2.0</text>
      </svg>
    </div>
  </section>

  <div class="section-head">
    <h2>Insignias principales</h2>
    <a class="text-link" href="#/logros">Ver las ${achievements.length} insignias →</a>
  </div>
  <div class="badges">
    ${summary_badges
      .map(
        (ach) => `<div class="badge-card ${ach.unlocked ? 'earned' : ''}">
          <span>${ach.unlocked ? '🏆' : '◇'}</span>
          <b>${esc(ach.title)}</b>
          <small>${ach.unlocked ? 'Conseguida' : `${ach.currentCount}/${ach.targetCount}`}</small>
        </div>`,
      )
      .join('')}
  </div>

  <section class="lesson-card">
    <h2>Minijuegos 3D y Proyectos Capstone</h2>
    <p>${miniGamesBestTotal}/30 decisiones acertadas en mejores intentos · ${completedProjectsCount}/${totalProjectsCount} proyectos Capstone listos para revisión humana. La puntuación de juegos es independiente del XP Senior.</p>
    <div class="inline-actions">
      <a class="btn secondary small" href="#/minijuegos">Ver los cinco minijuegos 3D →</a>
      <a class="btn secondary small" href="#/proyectos">Abrir proyectos Capstone →</a>
      <a class="btn secondary small" href="#/ajustes">Ajustes de accesibilidad →</a>
    </div>
  </section>

  <section class="lesson-card">
    <h2>Exportar / importar avance</h2>
    <p>El archivo JSON incluye respuestas, ADR, notas, talleres Senior, minijuegos, proyectos y preferencias. No lo compartas si contiene información personal o confidencial.</p>
    <div class="inline-actions">
      <button class="btn primary small" id="export-progress">Exportar progreso JSON</button>
      <label class="btn secondary small file-label">Importar progreso JSON<input type="file" accept="application/json,.json" id="import-progress" class="sr-file-input"/></label>
      <button class="btn textdanger small" id="reset-progress">Restablecer</button>
    </div>
    <div id="profile-feedback" role="status"></div>
  </section>`;
}

export function renderAboutPageHtml(): string {
  return `<div class="page-title">
    <span class="eyebrow">⬡ SOBRE LA PLATAFORMA · LICENCIAS · PRIVACIDAD · TÉRMINOS</span>
    <h1>Sobre ARQPIXEL Academy (${esc(APP_VERSION_LABEL)})</h1>
    <p>Academia interactiva en español para aprender Arquitectura de Software tomando decisiones bajo restricciones reales, con privacidad total local-first y criterios honestos de evaluación.</p>
  </div>

  <section class="live-blueprint-shell mb-20" aria-label="Telemetría de cadena de suministro, CSP y privacidad">
    <div class="live-blueprint-topbar">
      <div class="live-status-group">
        <span class="live-status-pill"><i class="live-dot" aria-hidden="true"></i> ARQUITECTURA ZERO-BACKEND · CSP ESTRICTA</span>
        <span class="map-badge">0 cookies · 0 telemetría externa · SBOM CycloneDX 1.5</span>
      </div>
    </div>
    <div class="live-blueprint-body">
      <div class="tabular-metrics-grid">
        <div class="tabular-metric-cell"><span>SEGURIDAD CSP</span><b>style-src 'self' (0 inline)</b></div>
        <div class="tabular-metric-cell"><span>RED EXTERNA</span><b>0 llamadas cloud / PII</b></div>
        <div class="tabular-metric-cell"><span>MOTOR 3D</span><b>Three.js 0.187.0 (MIT)</b></div>
        <div class="tabular-metric-cell"><span>COMPILADOR</span><b>TypeScript 5.8.3 (Apache-2.0)</b></div>
      </div>
    </div>
  </section>

  <div class="lesson-layout">
    <div>
      <article class="lesson-card">
        <span class="overline">01 / MÉTODO PEDAGÓGICO</span>
        <h2>Aprender a decidir, no a memorizar siglas</h2>
        <p>Cada bloque sigue el ciclo <strong>Problema → Concepto → Caso NexoShop → Comparación de trade-offs → Práctica → Evidencia → Transferencia</strong>. Nunca presentamos microservicios, DDD o CQRS como obligatorios: una decisión solo es buena en función de sus restricciones de carga, equipo, coste y evolución.</p>
      </article>

      <article class="lesson-card">
        <span class="overline">02 / HONESTIDAD DE EVALUACIÓN (ADR-0003)</span>
        <h2>Qué verificamos automáticamente y qué requiere juicio humano</h2>
        <ul>
          <li><strong>PASS / FAIL deterministas:</strong> grafos acíclicos conexos, ausencia de dependencias prohibidas, cálculos de capacidad y saturación, deduplicación por idempotencia, priorización DevSecOps/STRIDE y estructura mínima de entregables.</li>
          <li><strong>REQUIRES_REVIEW obligatorio:</strong> la calidad argumentativa de un ADR, la pertinencia empresarial de un trade-off y los proyectos Capstone requieren siempre revisión por una persona experta. Ningún check cualitativo se marca «aprobado por IA».</li>
          <li><strong>Simuladores educativos:</strong> los laboratorios modelan comportamientos matemáticos reproducibles en tu navegador; no despliegan infraestructura cloud ni ejecutan código arbitrario.</li>
        </ul>
      </article>

      <article class="lesson-card" data-privacy-policy="true">
        <span class="overline">03 / POLÍTICA DE PRIVACIDAD LOCAL-FIRST (ADR-0004)</span>
        <h2>Tus notas nunca salen de tu dispositivo</h2>
        <p>ARQPIXEL funciona sin cuentas de usuario, sin cookies de rastreo, sin analítica de terceros y sin servidores de backend. Tus datos se almacenan exclusivamente en <code>localStorage</code> bajo claves prefijadas (<code>arqpixel-progress-v1</code>, <code>arqpixel-minigames-v1</code>, <code>arqpixel-projects-v1</code>, <code>arqpixel-settings-v1</code> y <code>arqpixel-senior-suite-v2-*</code>). Puedes exportarlos o eliminarlos en cualquier momento desde <a class="text-link" href="#/ajustes">Ajustes</a>. Revisa cualquier respaldo JSON o Markdown antes de compartirlo públicamente.</p>
      </article>

      <article class="lesson-card" data-licenses-table="true">
        <span class="overline">04 / LICENCIAS DE SOFTWARE Y ACTIVOS (ADR-0001 / ADR-0006)</span>
        <h2>Componentes verificados en SBOM CycloneDX 1.5</h2>
        <div class="map-table-scroll" tabindex="0" role="region" aria-label="Tabla de licencias de componentes incluidos">
          <table class="map-accessible-table">
            <thead><tr><th>Componente</th><th>Versión</th><th>Alcance</th><th>Licencia</th></tr></thead>
            <tbody>
              <tr><td><strong>ARQPIXEL Academy + ArquiBot</strong></td><td>${esc(APP_VERSION_LABEL)}</td><td>Código propio, catálogos y 16 sprites RGBA ArquiBot</td><td>Propiedad educativa del repositorio</td></tr>
              <tr><td><strong>Silkscreen, DM Sans, Space Grotesk &amp; JetBrains Mono</strong></td><td>OFL 2026</td><td>Tipografías auto-alojadas en <code>/fonts/*.woff2</code> (0 CDN externos)</td><td><code>SIL OFL-1.1</code> (<code>public/fonts/OFL-LICENSES.txt</code>)</td></tr>
              <tr><td><strong>Three.js (vendorizado ESM)</strong></td><td>0.187.0</td><td>Escenarios 3D lazy-loaded en <code>#/minijuego/:id</code></td><td><code>MIT</code> (<code>public/vendor/three/LICENSE</code>)</td></tr>
              <tr><td><strong>TypeScript Compiler</strong></td><td>5.8.3</td><td>Compilación offline en <code>tools/typescript/</code></td><td><code>Apache-2.0</code> (<code>tools/typescript/LICENSE.txt</code>)</td></tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="lesson-card" data-terms-of-use="true">
        <span class="overline">05 / TÉRMINOS DE USO EDUCATIVOS</span>
        <h2>Alcance formativo y exención de garantía profesional</h2>
        <p>ARQPIXEL Academy se proporciona con fines estrictamente formativos y de práctica autónoma. Los puntajes mecánicos, insignias, simuladores de capacidad/fallos y plantillas ADR constituyen ayudas de estudio y <strong>no representan certificación profesional acreditada, dictamen de seguridad en producción ni asesoramiento legal o financiero</strong>.</p>
      </article>
    </div>

    <aside class="lesson-aside">
      <div class="aside-panel">
        <img src="./assets/arquibot.png" alt="ArquiBot, guía oficial de ARQPIXEL"/>
        <h3>Accesos rápidos</h3>
        <ul class="map-rel-list">
          <li><a class="map-rel-chip" href="#/mapa">◈ Mapa curricular (54 nodos)</a></li>
          <li><a class="map-rel-chip" href="#/proyectos">▣ Proyectos Capstone (11)</a></li>
          <li><a class="map-rel-chip" href="#/recursos">▤ Patrones, comparativas y ADR</a></li>
          <li><a class="map-rel-chip" href="#/logros">🏆 Insignias verificables</a></li>
          <li><a class="map-rel-chip" href="#/ajustes">⚙ Ajustes y borrado seguro</a></li>
        </ul>
      </div>
    </aside>
  </div>`;
}
