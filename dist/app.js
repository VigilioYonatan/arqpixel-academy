import { analyzeC4Semantics, C4_CONTEXTUAL_SCENARIOS, C4_LEVEL_METADATA, C4_LEVEL_PRESETS, C4_LEVEL_TYPES, C4_LEVELS, C4_TYPES, c4Mermaid, c4Svg, downloadC4ModelPng, evaluateC4ContextualScenario, moveC4ContainerOrder, renderC4AccessibleSummaryHtml, resolveC4Level, validateC4, } from './c4-studio.js';
import { evaluateDddAggregateDesign, evaluateUbiquitousLanguageAssignments, exportDddContextMapMermaid, exportDddContextMapSvg, exportDddWorkshopMarkdown, INITIAL_DDD_CONTEXT_MAP, renderDddWorkshopHtml, } from './ddd-workshop.js';
import { evaluateMission, missionChoices, sanitizeProgress, scenarioFromSeed, } from './engine.js';
import { bindCinemaPlayersInDom, disposeActiveCinemaPlayers, renderArquiBotCinemaHtml, } from './features/cinema/arquibot-player.js';
import { buildHomeIntroDeck, buildSeniorMissionCinemaDeck, buildSeniorOverviewDeck, } from './features/cinema/arquibot-storyboards.js';
import { audioManifestCatalogSchema, } from './features/cinema/schemas/cinema.schema.js';
import { buildCurriculumMapModel, filterCurriculumMapNodes, nextMapFocusIndex, renderCurriculumMapHtml, } from './features/curriculum/learning-path-map.js';
import { renderLessonClassroomHtml } from './features/curriculum/lesson-classroom.js';
import { evaluateLessonWorkbench } from './features/curriculum/lesson-workbench.js';
import { labCasesCatalogSchema, learningPathsCatalogSchema, mergeValidatedCurriculum, } from './features/curriculum/schemas/curriculum.schema.js';
import { buildSpecializationDetailModel, renderSpecializationDetailHtml, renderSpecializationsCatalogHtml, } from './features/curriculum/specialization-detail.js';
import { ADR_OPTION_MATRIX, API_BREAKING_ISSUE_LABELS, API_CONTRACT_DIFF_SCENARIOS, calculateSloBurnRate, computeLayerCouplingMetrics, DEPENDENCY_PRESETS, DISTRIBUTED_FAULT_SCENARIOS, evaluateApiContractDiffAudit, evaluatePatternVariabilityTradeoff, evaluateResilienceDefense, exportApiContractAuditMarkdown, exportDependencyGraphMermaid, exportDependencyLabMarkdown, exportDistributedTimelineMarkdown, exportIncidentRunbookMarkdown, filterLabStudios, simulateDistributedEventTimeline, } from './features/labs/advanced-labs.js';
import { FALLBACK_CASE_PROMPTS, INITIAL_C4_CONTAINERS, INITIAL_C4_RELATIONS, INITIAL_DEPENDENCY_EDGES, LAB_STUDIOS, MAX_C4_CONTAINERS, MAX_C4_LABEL_LENGTH, MIN_C4_LABEL_LENGTH, SIMULATED_OPERATIONS_COUNT, } from './features/labs/constants/labs.constants.js';
import { C4_VERIFICATION_FIXTURES, DEPENDENCY_VERIFICATION_FIXTURES, } from './features/labs/constants/lab-fixtures.constants.js';
import { diagnoseAdrDraftFields, diagnoseDependencyFailures, renderDependencyLayerSvgHtml, renderLabTelemetryHeaderHtml, sanitizeAndVerifySvgExport, } from './features/labs/lab-visual-diagnostics.js';
import { bindCrossFaultSagaControls, bindDimensionalCapacityControls, bindOpenApiCdcLabControls, renderCaseLabAdvancedSectionHtml, renderCrossFaultSagaPanelHtml, } from './features/labs/p2-lab-panels.js';
import { disposeActiveThreeStage, mountThreeArcadeStage, renderMinigameHudHtml, renderMinigamesCatalogHtml, } from './features/minigames/three-arcade-stage.js';
import { SETTINGS_STORAGE_KEY, } from './features/profile/constants/profile.constants.js';
import { computeAchievementsModel, exportAchievementsMarkdown, renderAboutPageHtml, renderAchievementsPageHtml, renderProfileOverviewHtml, renderSettingsPageHtml, } from './features/profile/profile-views.js';
import { defaultUserSettings, sanitizeUserSettings, } from './features/profile/schemas/settings.schema.js';
import { CAPSTONE_PROJECTS, PROJECTS_STORAGE_KEY, } from './features/projects/constants/projects.constants.js';
import { appendCapstoneAuditReview, evaluateProjectSubmission, exportProjectJson, exportProjectMarkdown, exportReferenceNestjsGuideMarkdown, getStructurallyCompletedProjectIds, renderProjectsCatalogHtml, renderProjectWorkspaceHtml, } from './features/projects/projects-workspace.js';
import { emptyProjectSubmission, sanitizeProjectsState, } from './features/projects/schemas/projects.schema.js';
import { ADR_TEMPLATES_LIBRARY, PATTERN_CARDS } from './features/resources/constants/resources.constants.js';
import { findPatternById, renderAdrLibraryHtml, renderPatternDetailHtml, renderResourcesHubHtml, } from './features/resources/resources-hub.js';
import { SENIOR_FULL_SCORE, SENIOR_MISSION_DECISIONS, } from './features/senior/constants/senior-decisions.constants.js';
import { c4ModelImportSchema, missionsCatalogSchema, } from './features/senior/schemas/senior.schema.js';
import { applyMigratedBackupToStorage, parseAndMigrateBackup, } from './features/shared/backup-migrator.js';
import { APP_VERSION_LABEL, BACKUP_APP_ID, BACKUP_SCHEMA_VERSION, EXPECTED_MODULES_COUNT, EXPECTED_PATHS_COUNT, EXPECTED_SENIOR_MISSIONS_COUNT, LESSON_XP_REWARD, MAX_BACKUP_FILE_BYTES, PROGRESS_STORAGE_KEY, SENIOR_MISSION_XP_REWARD, TOAST_DURATION_MS, } from './features/shared/constants/app.constants.js';
import { assetsManifestCatalogSchema, renderArquiBotSprite, } from './features/shared/schemas/assets-manifest.schema.js';
import { announceToLiveRegion, buildGlobalSearchIndex, nextSearchSelectionIndex, queryGlobalSearch, renderHintDrawerHtml, renderLiveRegionHtml, renderMobileWorkspaceTabsHtml, renderProgressRingSvg, renderSearchCommandModalHtml, renderSkipLinkHtml, } from './features/shared/ui/interactive-components.js';
import { renderBreadcrumbsNavHtml, renderNotFoundPageHtml, resolveBreadcrumbsTrail, } from './features/shared/ui/navigation-and-404.js';
import { HERO_LAYER_GRAPHIC_HTML, renderHomeEditorialShowcaseHtml, renderPixelNavIconSvg, resolveModuleContentReadiness, } from './features/shared/ui/visual-clarity.js';
import { dismissCorruptBackupSnapshot, inspectAndQuarantineCorruptedStorage, readAdrLabDraft, readLastVisitedRoute, readOnboardingDismissed, recordLastVisitedRoute, renderFirstVisitOnboardingHtml, renderKeyboardShortcutsModalHtml, renderResumeLastActivityBarHtml, renderSystemResilienceBannersHtml, saveAdrLabDraft, setOnboardingDismissed, trapDialogTabFocus, } from './features/shared/ui/resilience-and-onboarding.js';
import { evaluateSeniorReflection } from './lesson-senior.js';
import { emptyMiniProgress, gradeMiniQuestion, MINI_STORAGE_KEY, miniStars, recordMiniRun, sanitizeMiniProgress, validateMiniCatalog, } from './mini-games.js';
import { computeCriteriaSnapshotFingerprint, renderMissionBriefWorkspaceHtml, renderSeniorAlternativesComparisonHtml, renderSeniorDashboardHtml, renderSeniorReasonedSolutionGuideHtml, sanitizeSeniorSeed, } from './features/senior/senior-ux-views.js';
import { clearSeniorSuiteDrafts, exportSeniorSuiteDrafts, mountSeniorSuite, SENIOR_PLAYBOOKS, } from './senior-suite.js';
const STORAGE_KEY = PROGRESS_STORAGE_KEY || 'arqpixel-progress-v1';
const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
const icon = (name) => renderPixelNavIconSvg(name, 16);
const initialProgress = () => ({
    done: [],
    answers: {},
    missions: {},
    notes: {},
    xp: 0,
    theme: 'dark',
    seniorMode: false,
    lastVisit: new Date().toISOString(),
});
function loadProgress() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (!parsed || !Array.isArray(parsed.done))
            return initialProgress();
        return { ...initialProgress(), ...parsed };
    }
    catch {
        return initialProgress();
    }
}
function loadUserSettings(fallback_theme) {
    try {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!raw)
            return defaultUserSettings(fallback_theme);
        return sanitizeUserSettings(JSON.parse(raw), fallback_theme);
    }
    catch {
        return defaultUserSettings(fallback_theme);
    }
}
function saveUserSettings(next_settings) {
    userSettings = next_settings;
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(userSettings));
        storageWriteError = null;
    }
    catch {
        storageWriteError = 'Cuota o acceso a almacenamiento local restringido al guardar ajustes.';
        console.warn('No se pudieron guardar las preferencias de accesibilidad.');
    }
    applyDocumentPreferences();
}
function loadProjectsState() {
    try {
        const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (!raw)
            return {};
        return sanitizeProjectsState(JSON.parse(raw)) ?? {};
    }
    catch {
        return {};
    }
}
function saveProjectsState(next_projects) {
    projectsState = next_projects;
    try {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projectsState));
        storageWriteError = null;
    }
    catch {
        storageWriteError = 'Sin espacio libre en localStorage para guardar el proyecto Capstone.';
        toast('Sin espacio para guardar el proyecto; exporta una copia Markdown o JSON.');
    }
}
let corruptStorageSnapshot = inspectAndQuarantineCorruptedStorage();
let storageWriteError = null;
let isOfflineMode = typeof navigator !== 'undefined' && navigator.onLine === false;
let shortcutsModalOpen = false;
let state = loadProgress();
let userSettings = loadUserSettings(state.theme);
let projectsState = loadProjectsState();
let modules = [];
let missions = [];
let paths = [];
let miniGames = [];
let labCases = { patterns: [], api: [], incident: [] };
let assetsManifestLookup = new Map();
let audioManifest = {};
let globalSearchIndex = [];
let route = '';
let currentSeed = 0;
let lastMissionId = '';
let searchCommandOpen = false;
let searchCommandQuery = '';
let searchCommandActiveIdx = 0;
let mapFilter = {
    stage: 'ALL',
    status: 'ALL',
    pathId: 'ALL',
    query: '',
};
let selectedMapNodeId = 'B01';
let classroomSidebarExpanded = userSettings.classroomSidebarOpen;
let classroomSidebarQuery = '';
const lessonHintsRevealed = {};
const lessonWorkbenchChoices = {};
const lessonWorkbenchEvaluated = {};
const missionHintsRevealed = {};
let projectsKindFilter = 'ALL';
let resourcesFilter = { query: '', category: 'ALL' };
let selectedAdrTemplateId = 'vigilio-canonical';
let achievementsCategoryFilter = 'ALL';
let labsCatalogFilter = {
    query: '',
    difficulty: 'ALL',
    tag: 'ALL',
};
let labWorkspaceTab = 'all';
let edges = INITIAL_DEPENDENCY_EDGES.map(([from, to]) => [from, to]);
let selectedDepPreset = 'hexagonal';
let c4CurrentLevel = 'C2';
let selectedC4ContextScenario = 'libre';
let containers = INITIAL_C4_CONTAINERS.map((item) => ({ ...item }));
let c4Serial = 0;
let c4Relations = INITIAL_C4_RELATIONS.map((rel) => ({ ...rel }));
let dddSelectedTerm = 'Producto';
let dddContextMapLinks = INITIAL_DDD_CONTEXT_MAP.map((r) => ({ ...r }));
const dddConceptChoices = {};
let dddAggregateDraft = {
    rootId: 'OrdenCompra',
    internalEntities: ['lineas-pedido', 'cupon-aplicado'],
    invariants: ['inv-total-positivo', 'inv-no-mutar-pagada'],
    eventualEvents: ['evt-reservar-stock', 'evt-autorizar-cobro', 'evt-despachar-envio'],
    optimisticConcurrency: true,
};
let selectedApiDiffScenarioId = API_CONTRACT_DIFF_SCENARIOS[0].id;
let selectedAdrOptionId = 'modular-monolith';
let activeHomeBlueprint = 'modular-monolith';
let seniorTierFilter = 'ALL';
let seniorSearchQuery = '';
function resolveSystemPrefersLight() {
    return (typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: light)').matches);
}
function resolveEffectiveTheme(mode) {
    if (mode === 'light')
        return 'light';
    if (mode === 'system')
        return resolveSystemPrefersLight() ? 'light' : 'dark';
    return 'dark';
}
function applyDocumentPreferences() {
    const effective_theme = resolveEffectiveTheme(userSettings.themeMode);
    document.documentElement.dataset.theme = effective_theme;
    document.documentElement.dataset.contrast =
        userSettings.themeMode === 'high-contrast' ? 'high' : 'normal';
    document.documentElement.dataset.motion = userSettings.reducedMotion ? 'reduce' : 'normal';
    document.documentElement.dataset.fontScale = userSettings.fontScale;
}
function saveProgress() {
    state.lastVisit = new Date().toISOString();
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        storageWriteError = null;
    }
    catch {
        storageWriteError = 'El navegador rechazó escribir en localStorage (cuota llena o modo restringido).';
        console.warn('El navegador no pudo guardar el progreso local; exporta una copia JSON.');
    }
    updateGlobalHeader();
}
function updateGlobalHeader() {
    applyDocumentPreferences();
    const stat = document.querySelector('#header-xp');
    if (stat)
        stat.textContent = `✦ ${state.xp} XP`;
    const toggle = document.querySelector('#senior-toggle');
    if (toggle)
        toggle.checked = state.seniorMode;
}
function goto(path) {
    location.hash = '#/' + path.replace(/^\//, '');
    window.scrollTo(0, 0);
}
function activeNavClass(name) {
    if (name === 'especializaciones') {
        return route === 'especializaciones' ||
            route.startsWith('especializaciones/') ||
            route.startsWith('rutas/')
            ? 'active'
            : '';
    }
    if (name === 'rutas') {
        return route === 'rutas' || route.startsWith('aprender/') || route.startsWith('modulo/')
            ? 'active'
            : '';
    }
    if (name === 'laboratorios') {
        return route === 'laboratorios' || route.startsWith('laboratorio/') ? 'active' : '';
    }
    if (name === 'minijuegos') {
        return route === 'minijuegos' || route.startsWith('minijuego/') ? 'active' : '';
    }
    if (name === 'senior') {
        return route === 'senior' || route.startsWith('mision/') || route.startsWith('taller-senior/')
            ? 'active'
            : '';
    }
    return route === name || route.startsWith(`${name}/`) ? 'active' : '';
}
function renderSidebarNav() {
    const links = [
        ['', 'Inicio', 'home'],
        ['mapa', 'Mapa curricular', 'map'],
        ['rutas', 'Rutas', 'routes'],
        ['especializaciones', 'Especializaciones', 'specs'],
        ['proyectos', 'Proyectos', 'projects'],
        ['laboratorios', 'Laboratorios', 'labs'],
        ['minijuegos', 'Minijuegos', 'minigames'],
        ['senior', 'Senior Mode', 'senior'],
        ['recursos', 'Recursos', 'library'],
        ['logros', 'Logros', 'badges'],
        ['perfil', 'Mi progreso', 'profile'],
        ['ajustes', 'Ajustes', 'settings'],
        ['sobre', 'Sobre ARQPIXEL', 'about'],
    ];
    const completion_pct = Math.round((state.done.length / EXPECTED_MODULES_COUNT) * 100);
    return `<aside id="primary-sidebar" class="side">
    <a class="brand" href="#/"><span class="brand-mark">⬡</span><span>ARQ<span class="cyan">PIXEL</span><small>SOFTWARE ARCHITECTURE</small></span></a>
    <div class="nav-caption">EXPLORAR</div>
    <nav aria-label="Navegación principal">
      ${links
        .map(([path, label, symbol]) => `<a class="nav-link ${activeNavClass(path || 'inicio')}" href="#/${path}"><span class="nav-symbol">${icon(symbol)}</span>${label}${path === 'senior' ? '<span class="senior-dot" aria-hidden="true"></span>' : ''}</a>`)
        .join('')}
    </nav>
    <div class="side-bottom">
      <div class="bot-side">
        ${renderArquiBotSprite('arquibot-saludo', 64, '', assetsManifestLookup)}
        <div><strong>¡Hola, arquitecto!</strong><p>Diseña sistemas que evolucionan contigo.</p></div>
      </div>
      <div class="side-progress">
        <span>Tu progreso (${state.done.length}/${EXPECTED_MODULES_COUNT})</span>
        ${renderProgressRingSvg({ percent: completion_pct, size: 44, strokeWidth: 4, label: 'Módulos completados' })}
        <progress class="progress arq-progress" max="100" value="${completion_pct}" aria-label="Progreso general ${completion_pct}%"></progress>
      </div>
    </div>
  </aside>`;
}
function closeSearchCommand(restore_focus = true) {
    searchCommandOpen = false;
    const host = document.querySelector('#search-cmd-host');
    if (host)
        host.innerHTML = '';
    if (restore_focus) {
        document.querySelector('#open-search-cmd')?.focus();
    }
}
function mountSearchCommandOverlay(focus_input = false) {
    const host = document.querySelector('#search-cmd-host');
    if (!host)
        return;
    if (!searchCommandOpen) {
        host.innerHTML = '';
        return;
    }
    const results = queryGlobalSearch(globalSearchIndex, searchCommandQuery);
    if (searchCommandActiveIdx >= results.length) {
        searchCommandActiveIdx = Math.max(0, results.length - 1);
    }
    host.innerHTML = renderSearchCommandModalHtml({
        isOpen: true,
        query: searchCommandQuery,
        results,
        activeIndex: searchCommandActiveIdx,
        manifestLookup: assetsManifestLookup,
    });
    const input = document.querySelector('#search-cmd-input');
    const close_btn = document.querySelector('#search-cmd-close');
    const backdrop = document.querySelector('#search-cmd-backdrop');
    const dialog = document.querySelector('#search-cmd-dialog');
    if (close_btn)
        close_btn.onclick = () => closeSearchCommand(true);
    if (backdrop) {
        backdrop.onclick = (event) => {
            if (event.target === backdrop)
                closeSearchCommand(true);
        };
    }
    if (dialog) {
        dialog.onkeydown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeSearchCommand(true);
            }
            else {
                trapDialogTabFocus(event, dialog);
            }
        };
    }
    document.querySelectorAll('[data-search-result-idx]').forEach((anchor) => {
        anchor.addEventListener('click', () => {
            searchCommandOpen = false;
        });
    });
    if (input) {
        if (focus_input) {
            input.focus();
            try {
                const end = input.value.length;
                input.setSelectionRange(end, end);
            }
            catch {
                /* ignore */
            }
        }
        input.oninput = () => {
            searchCommandQuery = input.value;
            searchCommandActiveIdx = 0;
            const updated = queryGlobalSearch(globalSearchIndex, searchCommandQuery);
            announceToLiveRegion(`${updated.length} resultado(s) para ${searchCommandQuery || 'sugerencias'}`);
            mountSearchCommandOverlay(true);
        };
        input.onkeydown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeSearchCommand(true);
                return;
            }
            if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
                event.preventDefault();
                searchCommandActiveIdx = nextSearchSelectionIndex(searchCommandActiveIdx, event.key, results.length);
                mountSearchCommandOverlay(true);
                return;
            }
            if (event.key === 'Enter' && results[searchCommandActiveIdx]) {
                event.preventDefault();
                const chosen = results[searchCommandActiveIdx];
                closeSearchCommand(false);
                location.hash = chosen.href;
            }
        };
    }
}
function openSearchCommand() {
    searchCommandOpen = true;
    searchCommandActiveIdx = 0;
    mountSearchCommandOverlay(true);
    announceToLiveRegion('Buscador rápido abierto. Escribe un concepto, módulo o misión.');
}
function breadcrumbContext() {
    return {
        moduleTitleById: new Map(modules.map((m) => [m.id, m.title])),
        moduleLevelById: new Map(modules.map((m) => [m.id, m.level])),
        pathTitleById: new Map(paths.map((p) => [p.id, p.title])),
        missionTitleById: new Map(missions.map((m) => [m.id, m.title])),
        projectTitleById: new Map(CAPSTONE_PROJECTS.map((p) => [p.id, p.title])),
        patternNameById: new Map(PATTERN_CARDS.map((p) => [p.id, p.name])),
        labTitleById: new Map(LAB_STUDIOS.map((l) => [l.id, l.title])),
        miniGameTitleById: new Map(miniGames.map((g) => [g.id, g.title])),
    };
}
function renderNotFoundView(entity_label) {
    shell(renderNotFoundPageHtml({
        requestedRoute: route,
        entityLabel: entity_label,
        manifestLookup: assetsManifestLookup,
    }), true);
}
function closeShortcutsModal(restore_focus = true) {
    shortcutsModalOpen = false;
    const host = document.querySelector('#shortcuts-modal-host');
    if (host)
        host.innerHTML = '';
    if (restore_focus) {
        document.querySelector('#open-shortcuts-modal')?.focus();
    }
}
function mountShortcutsModal(focus_close = false) {
    const host = document.querySelector('#shortcuts-modal-host');
    if (!host)
        return;
    host.innerHTML = renderKeyboardShortcutsModalHtml(shortcutsModalOpen);
    if (!shortcutsModalOpen)
        return;
    const close_btn = document.querySelector('#shortcuts-modal-close');
    const backdrop = document.querySelector('#shortcuts-modal-backdrop');
    const dialog = document.querySelector('#shortcuts-modal-dialog');
    if (close_btn) {
        close_btn.onclick = () => closeShortcutsModal(true);
        if (focus_close)
            close_btn.focus();
    }
    if (backdrop) {
        backdrop.onclick = (ev) => {
            if (ev.target === backdrop)
                closeShortcutsModal(true);
        };
    }
    if (dialog) {
        dialog.onkeydown = (ev) => {
            if (ev.key === 'Escape') {
                ev.preventDefault();
                closeShortcutsModal(true);
            }
            else {
                trapDialogTabFocus(ev, dialog);
            }
        };
    }
}
function openShortcutsModal() {
    shortcutsModalOpen = true;
    mountShortcutsModal(true);
    announceToLiveRegion('Ventana de atajos de teclado abierta.');
}
function shell(content, is_not_found = false) {
    disposeActiveThreeStage();
    disposeActiveCinemaPlayers();
    const trail = resolveBreadcrumbsTrail(route, breadcrumbContext(), is_not_found);
    const sys_banners_html = renderSystemResilienceBannersHtml({
        isOffline: isOfflineMode,
        storageWriteError,
        corruptSnapshot: corruptStorageSnapshot,
    });
    const effective_theme = resolveEffectiveTheme(userSettings.themeMode);
    $('#app').innerHTML = `${renderSkipLinkHtml()}
  ${renderLiveRegionHtml()}
  <div class="app-shell">
    ${renderSidebarNav()}
    <div class="workspace">
      <header class="topbar">
        <button id="mobile-menu" class="icon-button mobile-only" aria-label="Mostrar menú" aria-expanded="false" aria-controls="primary-sidebar">☰</button>
        ${renderBreadcrumbsNavHtml(trail)}
        <div class="top-actions">
          <button type="button" class="search-trigger-btn" id="open-search-cmd" aria-label="Buscar conceptos, módulos y misiones (Ctrl+K)" data-ui-state="idle">
            <span>⌕ Buscar</span>
            <kbd>Ctrl+K</kbd>
          </button>
          <label class="senior-switch" title="Activa los consejos avanzados en lecciones">
            <input id="senior-toggle" type="checkbox" ${state.seniorMode ? 'checked' : ''}/>
            <span>${renderPixelNavIconSvg('senior', 14)} Senior</span>
          </label>
          <span id="header-xp" class="xp">✦ ${state.xp} XP</span>
          <button type="button" class="icon-button" id="open-shortcuts-modal" aria-label="Ver atajos de teclado (?)" title="Atajos de teclado (?)">?</button>
          <button class="icon-button" id="theme-toggle" aria-label="Cambiar tema">${effective_theme === 'dark' ? '☀' : '☾'}</button>
          <a class="avatar" href="#/perfil" aria-label="Mi progreso">A</a>
        </div>
      </header>
      ${sys_banners_html}
      <main id="main" tabindex="-1">${content}</main>
      <footer class="footer">ARQPIXEL Academy · Aprende a decidir, no solo a dibujar cajas. <span class="footer-links"><a href="#/sobre">Sobre y licencias</a> · <a href="#/ajustes">Ajustes</a> · <button type="button" class="footer-shortcut-btn" data-open-shortcuts="true">Atajos (?)</button> · ${APP_VERSION_LABEL} · Progreso local</span></footer>
    </div>
  </div>
  <div id="search-cmd-host"></div>
  <div id="shortcuts-modal-host"></div>`;
    document.querySelector('.skip-link')?.addEventListener('click', (ev) => {
        ev.preventDefault();
        document.querySelector('#main')?.focus();
    });
    $('#open-search-cmd').onclick = () => openSearchCommand();
    document.querySelector('#open-shortcuts-modal')?.addEventListener('click', () => openShortcutsModal());
    document.querySelector('[data-open-shortcuts]')?.addEventListener('click', () => openShortcutsModal());
    document.querySelector('#not-found-open-search')?.addEventListener('click', () => {
        openSearchCommand();
    });
    document.querySelector('#banner-export-rescue-json')?.addEventListener('click', () => {
        downloadFile('arqpixel-progreso-rescate.json', buildBackupPayloadString(), 'application/json');
    });
    document.querySelector('#banner-dismiss-storage-err')?.addEventListener('click', () => {
        storageWriteError = null;
        render();
    });
    document.querySelector('#banner-download-corrupt-raw')?.addEventListener('click', () => {
        if (corruptStorageSnapshot) {
            downloadFile('arqpixel-cuarentena-cruda.json', JSON.stringify(corruptStorageSnapshot, null, 2), 'application/json');
        }
    });
    document.querySelector('#banner-dismiss-corrupt-raw')?.addEventListener('click', () => {
        dismissCorruptBackupSnapshot();
        corruptStorageSnapshot = null;
        render();
    });
    document.querySelectorAll('[data-print-dossier]').forEach((btn) => {
        if (btn.id === 'suite-print-pdf')
            return;
        btn.addEventListener('click', () => {
            if (typeof window.print === 'function')
                window.print();
        });
    });
    $('#theme-toggle').onclick = () => {
        const next_theme = resolveEffectiveTheme(userSettings.themeMode) === 'dark' ? 'light' : 'dark';
        state.theme = next_theme;
        saveUserSettings({ ...userSettings, themeMode: next_theme });
        saveProgress();
        render();
    };
    $('#senior-toggle').onchange = (event) => {
        const checked = event.target.checked;
        state.seniorMode = checked;
        saveProgress();
        if (!checked && location.hash.includes('senior=1')) {
            location.hash = location.hash
                .replace(/([?&])senior=1(&|$)/, (_match, sep, tail) => (sep === '?' && tail ? '?' : ''))
                .replace(/[?&]$/, '');
            return;
        }
        render();
    };
    $('#mobile-menu').onclick = () => {
        const side = document.querySelector('#primary-sidebar');
        const is_open = side?.classList.toggle('open') ?? false;
        $('#mobile-menu').setAttribute('aria-expanded', is_open ? 'true' : 'false');
    };
    document.querySelector('.workspace')?.addEventListener('click', (ev) => {
        const side = document.querySelector('#primary-sidebar.open');
        if (!side)
            return;
        const target = ev.target;
        if (target?.closest('#mobile-menu'))
            return;
        side.classList.remove('open');
        $('#mobile-menu').setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('[data-go]').forEach((el) => {
        el.onclick = () => goto(el.dataset.go || '');
    });
    updateGlobalHeader();
    bindCinemaPlayersInDom(assetsManifestLookup);
    if (searchCommandOpen)
        mountSearchCommandOverlay(false);
    if (shortcutsModalOpen)
        mountShortcutsModal(false);
}
function getAwardedMissionIds() {
    return Object.entries(state.missions)
        .filter(([, record]) => record.awarded === true)
        .map(([mission_id]) => mission_id);
}
function homePage() {
    const next = modules.find((m) => !state.done.includes(m.id)) || modules[0];
    const is_fresh_visitor = state.done.length === 0 &&
        Object.keys(state.missions).length === 0 &&
        !readOnboardingDismissed();
    const last_visited = readLastVisitedRoute();
    shell(`<section class="hero">
    <div class="hero-glow" aria-hidden="true"></div>
    <div class="hero-copy">
      <div class="hero-pill"><span class="live-dot" aria-hidden="true"></span> TU PRÓXIMO NIVEL ARQUITECTÓNICO COMIENZA AQUÍ ›</div>
      <h1>Piensa como un<br><span class="hero-emphasis">arquitecto</span> <span class="hero-white">de software.</span></h1>
      <p>De <strong>SOLID, patrones GoF y DDD</strong> a <strong>Clean Architecture, Hexagonal y sistemas distribuidos</strong>. Aprende diseñando, simulando y defendiendo trade-offs reales.</p>
      <div class="hero-actions">
        <button class="btn primary hero-btn-lg" data-go="aprender/${next.id}">▶ ${state.done.length ? 'Continuar donde me quedé' : 'Comenzar aventura'} <span>→</span></button>
        <a class="btn hero-btn-ghost hero-btn-lg" href="#/mapa">Explorar la ruta ↗</a>
        <a class="btn hero-btn-senior hero-btn-lg" href="#/senior">♛ Explorar Senior Mode</a>
      </div>
      <div class="hero-proof">
        <div class="avatar-stack" aria-hidden="true"><span>⬡</span><span>◈</span><span>♛</span><span>✦</span></div>
        <span><strong>36 lecciones</strong> · 18 misiones Senior · 8 laboratorios · 5 mundos 3D</span>
      </div>
      <p class="hero-arch-note">◈ Ilustración orientativa: capas, puertos o eventos se eligen según restricciones del sistema, nunca como regla universal.</p>
    </div>
    <div class="hero-art" aria-label="Ecosistema visual de arquitectura sobre ArquiBot">
      <div class="art-ring ring-one" aria-hidden="true"></div>
      <div class="art-ring ring-two" aria-hidden="true"></div>
      <span class="orbit-chip chip-top hero-orbit-a">⬡ SOLID · GoF</span>
      <span class="orbit-chip chip-left hero-orbit-b">◈ DDD · Hexagonal</span>
      <span class="orbit-chip chip-right hero-orbit-c">⚡ Outbox · Sagas · SLO</span>
      <span class="orbit-chip chip-bottom hero-orbit-d">✦ Arena 3D Three.js</span>
      ${HERO_LAYER_GRAPHIC_HTML}
      ${renderArquiBotSprite('arquibot-hero', 240, 'hero-bot', assetsManifestLookup)}
      <div class="mascot-floor" aria-hidden="true"></div>
    </div>
    <div class="hero-side-label" aria-hidden="true">ARQUITECTURA DE SOFTWARE / EDICIÓN 2026</div>
  </section>
  ${renderResumeLastActivityBarHtml(last_visited)}
  ${is_fresh_visitor ? renderFirstVisitOnboardingHtml() : ''}
  <div class="cinema-home-showcase">
    ${renderArquiBotCinemaHtml(buildHomeIntroDeck(audioManifest), {
        manifestLookup: assetsManifestLookup,
    })}
  </div>
  ${renderHomeEditorialShowcaseHtml({
        modules,
        paths,
        completedModuleIds: state.done,
        attemptedMissionsCount: Object.keys(state.missions).length,
        expectedModulesCount: EXPECTED_MODULES_COUNT,
        expectedMissionsCount: EXPECTED_SENIOR_MISSIONS_COUNT,
        labsCount: LAB_STUDIOS.length,
        xp: state.xp,
        activeBlueprint: activeHomeBlueprint,
        nextModule: next,
        seniorArtSpriteHtml: renderArquiBotSprite('arquibot-senior', 220, 'senior-band-bot', assetsManifestLookup),
        bottomIdeaSpriteHtml: renderArquiBotSprite('arquibot-idea', 92, '', assetsManifestLookup),
    })}`);
    document.querySelector('#dismiss-onboarding-card')?.addEventListener('click', () => {
        setOnboardingDismissed();
        homePage();
        announceToLiveRegion('Guía inicial ocultada.');
    });
    document.querySelectorAll('[data-onboarding-pick]').forEach((anchor) => {
        anchor.addEventListener('click', () => {
            setOnboardingDismissed();
        });
    });
    document.querySelectorAll('[data-blueprint-tab]').forEach((btn) => {
        btn.onclick = () => {
            const next_bp = (btn.dataset.blueprintTab || 'modular-monolith');
            activeHomeBlueprint = next_bp;
            homePage();
            document.querySelector(`[data-blueprint-tab="${next_bp}"]`)?.focus();
            announceToLiveRegion(`Topología activa: ${btn.textContent || next_bp}`);
        };
    });
}
function curriculumMapPage(focus_node_id) {
    const model = buildCurriculumMapModel(modules, missions, paths, state.done, getAwardedMissionIds());
    if (!model.nodes.some((n) => n.id === selectedMapNodeId)) {
        selectedMapNodeId = model.summary.recommendedNodeId ?? 'B01';
    }
    const filtered_nodes = filterCurriculumMapNodes(model, mapFilter);
    shell(renderCurriculumMapHtml(model, filtered_nodes, mapFilter, selectedMapNodeId, paths));
    const query_input = document.querySelector('#map-query');
    const stage_select = document.querySelector('#map-stage');
    const status_select = document.querySelector('#map-status');
    const path_select = document.querySelector('#map-path');
    const reset_btn = document.querySelector('#map-reset-filters');
    if (query_input) {
        query_input.oninput = () => {
            const caret = query_input.selectionStart ?? query_input.value.length;
            mapFilter = { ...mapFilter, query: query_input.value };
            curriculumMapPage();
            const refreshed = document.querySelector('#map-query');
            if (refreshed) {
                refreshed.focus();
                try {
                    refreshed.setSelectionRange(caret, caret);
                }
                catch {
                    /* ignore */
                }
            }
        };
    }
    if (stage_select) {
        stage_select.onchange = () => {
            mapFilter = { ...mapFilter, stage: stage_select.value };
            curriculumMapPage();
        };
    }
    if (status_select) {
        status_select.onchange = () => {
            mapFilter = { ...mapFilter, status: status_select.value };
            curriculumMapPage();
        };
    }
    if (path_select) {
        path_select.onchange = () => {
            mapFilter = { ...mapFilter, pathId: path_select.value };
            curriculumMapPage();
        };
    }
    if (reset_btn) {
        reset_btn.onclick = () => {
            mapFilter = { stage: 'ALL', status: 'ALL', pathId: 'ALL', query: '' };
            selectedMapNodeId = model.summary.recommendedNodeId ?? 'B01';
            curriculumMapPage(selectedMapNodeId);
        };
    }
    const node_buttons = Array.from(document.querySelectorAll('[data-map-node]'));
    node_buttons.forEach((btn, index) => {
        btn.onclick = () => {
            const target_id = btn.dataset.mapNode || 'B01';
            selectedMapNodeId = target_id;
            curriculumMapPage(target_id);
        };
        btn.onkeydown = (event) => {
            const next_index = nextMapFocusIndex(index, event.key, node_buttons.length, 2);
            if (next_index !== index && ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
                event.preventDefault();
                const target = node_buttons[next_index];
                if (target?.dataset.mapNode) {
                    selectedMapNodeId = target.dataset.mapNode;
                    curriculumMapPage(selectedMapNodeId);
                }
            }
        };
    });
    document.querySelectorAll('[data-map-select]').forEach((chip) => {
        chip.onclick = () => {
            const target_id = chip.dataset.mapSelect;
            if (!target_id)
                return;
            mapFilter = { stage: 'ALL', status: 'ALL', pathId: 'ALL', query: '' };
            selectedMapNodeId = target_id;
            curriculumMapPage(target_id);
        };
    });
    if (focus_node_id) {
        const to_focus = document.querySelector(`[data-map-node="${focus_node_id}"]`);
        to_focus?.focus();
    }
}
function tracksPage() {
    const groups = ['Básico', 'Intermedio', 'Avanzado'];
    const descriptions = [
        'Comprende los bloques y toma tus primeras decisiones.',
        'Construye sistemas mantenibles con patrones, DDD y límites.',
        'Evalúa sistemas distribuidos, escalabilidad y operación.',
    ];
    const level_dots = {
        Básico: 'basico',
        Intermedio: 'intermedio',
        Avanzado: 'avanzado',
    };
    const level_glyphs = {
        Básico: '⬡',
        Intermedio: '◈',
        Avanzado: '⚡',
    };
    shell(`<div class="page-intro-row">
    <div class="page-title m-0"><span class="eyebrow">◈ CAMINO DEL ARQUITECTO</span><h1>Rutas de <span>aprendizaje</span></h1><p>Domina los fundamentos, diseña dominios y aprende a defender arquitecturas de producción. Cada módulo integra teoría visual, caso real y evaluación interactiva.</p></div>
    <div class="intro-stat-card" aria-label="Progreso en rutas">
      <span>PROGRESO CURRICULAR</span>
      <strong>${state.done.length}<small>/${EXPECTED_MODULES_COUNT}</small></strong>
      <small>lecciones completadas</small>
    </div>
  </div>
  <section class="arq-stats-strip stats-strip" aria-label="Indicadores de rutas de aprendizaje">
    <div class="intro-stat"><strong>${state.done.length}/${EXPECTED_MODULES_COUNT}</strong><small>LECCIONES</small></div>
    <div class="intro-stat"><strong>3</strong><small>NIVELES PROGRESIVOS</small></div>
    <div class="intro-stat"><strong>72</strong><small>DECISIONES 2/4</small></div>
    <div class="intro-stat"><strong>18</strong><small>RETOS SENIOR</small></div>
  </section>
  <div class="inline-actions mb-18">
    <a class="btn secondary small" href="#/mapa">◈ Ver grafo de 54 nodos y prerrequisitos →</a>
    <a class="btn secondary small" href="#/especializaciones">Explorar las 8 especializaciones (R01–R08) →</a>
    <a class="btn secondary small" href="#/proyectos">Proyectos integradores y Capstones →</a>
  </div>
  <div class="track-steps"><span>01 FUNDAMENTOS</span><i></i><span>02 DISEÑO</span><i></i><span>03 SISTEMAS</span><i></i><span>04 SENIOR</span></div>
  ${groups
        .map((group, idx) => `<section class="track-section">
        <div class="track-head">
          <div class="track-index level-icon"><span>0${idx + 1}</span></div>
          <div><h2>${group}</h2><p>${descriptions[idx]}</p></div>
          <span class="track-pill">${modules.filter((m) => m.level === group && state.done.includes(m.id)).length} / 12 completados</span>
        </div>
        <div class="module-grid">
          ${modules
        .filter((m) => m.level === group)
        .map((m) => {
        const readiness = resolveModuleContentReadiness(m, state.done);
        const is_done = readiness === 'completed';
        const dot_cls = level_dots[group];
        const glyph = level_glyphs[group];
        return `<a class="module-tile module-card-edu ${is_done ? 'complete' : ''}" href="#/aprender/${m.id}">
                <div class="module-card-head">
                  <span class="tile-number">${glyph}</span>
                  <span class="module-num">#${m.id}${is_done ? ' · ✓ HECHO' : ''}</span>
                </div>
                <div class="module-level-row">
                  <span class="level-dot ${dot_cls}" aria-hidden="true"></span>
                  <span>${group.toUpperCase()} · ${m.readingMinutes} MIN</span>
                </div>
                <h3>${esc(m.title)}</h3>
                <p>${esc(m.concept)}</p>
                <div class="module-tags">
                  <span class="tag">${readiness === 'coming_soon' ? 'Próximamente' : esc(m.activity)}</span>
                  <span class="tag tag-accent">${m.id}</span>
                </div>
                <div class="module-card-footer">
                  <span>${is_done ? 'Repasar módulo' : 'Empezar módulo'}</span>
                  <span class="tile-arrow" aria-hidden="true">${readiness === 'coming_soon' ? '◌' : is_done ? '✓' : '→'}</span>
                </div>
              </a>`;
    })
        .join('')}
        </div>
      </section>`)
        .join('')}
  <section class="senior-banner"><span>${renderPixelNavIconSvg('senior', 40)}</span><div><h2>Modo Senior desbloqueado desde el inicio</h2><p>18 misiones reales de diseño, incidentes y decisiones; no necesitas esperar a completar toda la ruta.</p></div><button class="btn primary" data-go="senior">Entrar →</button></section>`);
}
function specializationPage() {
    shell(renderSpecializationsCatalogHtml(paths, modules, state.done));
}
function specializationDetailPage(path_id) {
    const detail = buildSpecializationDetailModel(path_id, paths, modules, missions, state.done, getAwardedMissionIds(), getStructurallyCompletedProjectIds(projectsState));
    if (!detail) {
        renderNotFoundView('Especialización');
        return;
    }
    shell(renderSpecializationDetailHtml(detail, paths));
}
function modulePage(module_id, force_senior = false, route_prefix = 'modulo') {
    if (force_senior && !state.seniorMode) {
        state.seniorMode = true;
        saveProgress();
    }
    const normalized_mod_id = module_id.trim().toUpperCase();
    const mod = modules.find((x) => x.id === normalized_mod_id);
    if (!mod) {
        renderNotFoundView('Módulo');
        return;
    }
    const canonical_id = mod.id;
    const done = state.done.includes(canonical_id);
    shell(renderLessonClassroomHtml({
        currentModule: mod,
        allModules: modules,
        completedModuleIds: state.done,
        selectedAnswer: state.answers[canonical_id],
        savedNote: state.notes[canonical_id] || '',
        seniorModeActive: state.seniorMode,
        sidebarExpanded: classroomSidebarExpanded,
        sidebarQuery: classroomSidebarQuery,
        routePrefix: route_prefix,
        hintsRevealed: lessonHintsRevealed[canonical_id] ?? 0,
        workbenchChoices: lessonWorkbenchChoices[canonical_id] ?? [],
        workbenchEvaluated: Boolean(lessonWorkbenchEvaluated[canonical_id]),
        manifestLookup: assetsManifestLookup,
        audioManifest,
    }));
    const toggle_index = document.querySelector('#toggle-classroom-index');
    if (toggle_index) {
        toggle_index.onclick = () => {
            classroomSidebarExpanded = !classroomSidebarExpanded;
            modulePage(canonical_id, false, route_prefix);
            document.querySelector('#toggle-classroom-index')?.focus();
        };
    }
    const index_query = document.querySelector('#classroom-index-query');
    if (index_query) {
        index_query.oninput = () => {
            const caret = index_query.selectionStart ?? index_query.value.length;
            classroomSidebarQuery = index_query.value;
            classroomSidebarExpanded = true;
            modulePage(canonical_id, false, route_prefix);
            const refreshed = document.querySelector('#classroom-index-query');
            if (refreshed) {
                refreshed.focus();
                try {
                    refreshed.setSelectionRange(caret, caret);
                }
                catch {
                    /* ignore */
                }
            }
        };
    }
    const hint_btn = document.querySelector('#lesson-hint-next-btn');
    if (hint_btn) {
        hint_btn.onclick = () => {
            const next_count = Math.min(3, (lessonHintsRevealed[canonical_id] ?? 0) + 1);
            lessonHintsRevealed[canonical_id] = next_count;
            modulePage(canonical_id, false, route_prefix);
            announceToLiveRegion(`Pista ${next_count} de 3 mostrada.`);
            document.querySelector('#lesson-hint-next-btn')?.focus();
        };
    }
    document.querySelectorAll('[data-wb-choice]').forEach((chk) => {
        chk.onchange = () => {
            const selected = Array.from(document.querySelectorAll('[data-wb-choice]:checked')).map((el) => Number(el.dataset.wbChoice));
            lessonWorkbenchChoices[canonical_id] = selected;
            lessonWorkbenchEvaluated[canonical_id] = false;
        };
    });
    const wb_btn = document.querySelector('#eval-lesson-workbench');
    if (wb_btn) {
        wb_btn.onclick = () => {
            const selected = Array.from(document.querySelectorAll('[data-wb-choice]:checked')).map((el) => Number(el.dataset.wbChoice));
            lessonWorkbenchChoices[canonical_id] = selected;
            lessonWorkbenchEvaluated[canonical_id] = true;
            const wb_res = evaluateLessonWorkbench(canonical_id, selected);
            modulePage(canonical_id, false, route_prefix);
            announceToLiveRegion(wb_res.summary);
            document.querySelector('#eval-lesson-workbench')?.focus();
        };
    }
    document.querySelectorAll('[data-answer]').forEach((el) => {
        el.addEventListener('click', () => {
            const chosen_idx = Number(el.dataset.answer);
            state.answers[canonical_id] = chosen_idx;
            saveProgress();
            modulePage(canonical_id, false, route_prefix);
            announceToLiveRegion(chosen_idx === mod.correct
                ? 'Respuesta correcta. Solución de referencia desbloqueada.'
                : 'Respuesta registrada. Revisa la comparación con la solución de referencia.');
        });
    });
    $('#save-notes').onclick = () => {
        state.notes[canonical_id] = $('#lesson-notes').value;
        saveProgress();
        toast('Reflexión guardada en este dispositivo');
    };
    const check_senior = document.querySelector('#check-senior-lesson');
    if (check_senior) {
        check_senior.onclick = () => {
            const text = $('#lesson-notes').value;
            state.notes[canonical_id] = text;
            saveProgress();
            const result = evaluateSeniorReflection(text, mod);
            $('#senior-lesson-report').innerHTML = `<div class="feedback ${result.complete ? 'good' : 'bad'}"><strong>${result.complete ? '✓ Revisión mecánica superada' : '↺ Revisa los criterios estructurales'}</strong>${result.checks.map((c) => `<p><b>${esc(c.status)}</b> · ${esc(c.name)}: ${esc(c.detail)}</p>`).join('')}<p>La calidad del razonamiento requiere revisión humana.</p></div>`;
        };
    }
    document.querySelectorAll('[data-scroll-target]').forEach((btn) => {
        btn.onclick = () => {
            const target_id = btn.dataset.scrollTarget;
            const target_el = target_id ? document.getElementById(target_id) : null;
            target_el?.scrollIntoView({
                behavior: userSettings.reducedMotion ? 'auto' : 'smooth',
                block: 'start',
            });
        };
    });
    $('#complete-lesson').onclick = () => {
        if (resolveModuleContentReadiness(mod, state.done) === 'coming_soon')
            return;
        if (state.answers[canonical_id] === mod.correct && !state.done.includes(canonical_id)) {
            state.done.push(canonical_id);
            state.xp += LESSON_XP_REWARD;
            saveProgress();
        }
        modulePage(canonical_id, false, route_prefix);
        toast(done ? 'Módulo ya aprobado' : `¡Módulo completado! +${LESSON_XP_REWARD} XP`);
    };
}
function projectsCatalogPage() {
    shell(renderProjectsCatalogHtml(projectsState, state.done, projectsKindFilter));
    const filter_el = document.querySelector('#projects-kind-filter');
    if (filter_el) {
        filter_el.onchange = () => {
            projectsKindFilter = filter_el.value;
            projectsCatalogPage();
        };
    }
    const dl_ref = document.querySelector('#download-ref-nestjs-guide');
    if (dl_ref) {
        dl_ref.onclick = () => {
            downloadFile('nexoshop-reference-nestjs-guide.md', exportReferenceNestjsGuideMarkdown(), 'text/markdown');
        };
    }
}
function projectWorkspacePage(project_id) {
    const normalized_id = project_id.trim().toUpperCase();
    const project = CAPSTONE_PROJECTS.find((p) => p.id === normalized_id);
    if (!project) {
        renderNotFoundView('Proyecto');
        return;
    }
    const current_sub = projectsState[normalized_id] ?? emptyProjectSubmission();
    shell(renderProjectWorkspaceHtml(project, current_sub, evaluateProjectSubmission(project, current_sub)));
    const collectDraft = () => ({
        architectureSummary: $('#proj-arch').value,
        alternativesAnalysis: $('#proj-alt').value,
        adrDecision: $('#proj-adr').value,
        risksAndMitigations: $('#proj-risks').value,
        verificationPlan: $('#proj-verif').value,
        checklist: {
            c4Included: $('#proj-chk-c4').checked,
            adrCompleted: $('#proj-chk-adr').checked,
            tradeOffsExplicit: $('#proj-chk-tradeoff').checked,
            verificationDefined: $('#proj-chk-verif').checked,
            limitationsDeclared: $('#proj-chk-limits').checked,
        },
        updatedAt: new Date().toISOString(),
        auditTrail: projectsState[project.id]?.auditTrail,
    });
    const autoPersistProjectDraft = () => {
        const draft = collectDraft();
        saveProjectsState({ ...projectsState, [project.id]: draft });
    };
    document
        .querySelectorAll('#proj-arch, #proj-alt, #proj-adr, #proj-risks, #proj-verif')
        .forEach((el) => {
        el.addEventListener('input', autoPersistProjectDraft);
    });
    document
        .querySelectorAll('#proj-chk-c4, #proj-chk-adr, #proj-chk-tradeoff, #proj-chk-verif, #proj-chk-limits')
        .forEach((el) => {
        el.addEventListener('change', autoPersistProjectDraft);
    });
    $('#proj-save').onclick = () => {
        const draft = collectDraft();
        saveProjectsState({ ...projectsState, [project.id]: draft });
        projectWorkspacePage(project.id);
        toast('Borrador de proyecto guardado localmente');
    };
    $('#proj-evaluate').onclick = () => {
        const draft = collectDraft();
        saveProjectsState({ ...projectsState, [project.id]: draft });
        const evaluation = evaluateProjectSubmission(project, draft);
        projectWorkspacePage(project.id);
        toast(evaluation.structurallyComplete
            ? 'Estructura del dossier completa · Listo para revisión humana'
            : `Faltan controles estructurales (${evaluation.passedMechanicalCount}/${evaluation.totalMechanicalCount})`);
    };
    $('#proj-export-md').onclick = () => {
        const draft = collectDraft();
        saveProjectsState({ ...projectsState, [project.id]: draft });
        const evaluation = evaluateProjectSubmission(project, draft);
        downloadFile(`${project.id}-dossier.md`, exportProjectMarkdown(project, draft, evaluation), 'text/markdown');
    };
    $('#proj-export-json').onclick = () => {
        const draft = collectDraft();
        saveProjectsState({ ...projectsState, [project.id]: draft });
        const evaluation = evaluateProjectSubmission(project, draft);
        downloadFile(`${project.id}-dossier.json`, exportProjectJson(project, draft, evaluation), 'application/json');
    };
    document.querySelector('#proj-save-review')?.addEventListener('click', () => {
        const comment = ($('#proj-rev-comment')?.value ?? '').trim();
        if (comment.length < 12) {
            toast('Añade un comentario auditable de al menos 12 caracteres');
            document.querySelector('#proj-rev-comment')?.focus();
            return;
        }
        const base_draft = collectDraft();
        const updated = appendCapstoneAuditReview(base_draft, {
            reviewerName: ($('#proj-rev-name')?.value ?? '').trim() || 'Revisor Senior',
            reviewerRole: ($('#proj-rev-role')?.value ?? '').trim() || 'Comité de Arquitectura',
            verdict: ($('#proj-rev-verdict')?.value ?? 'APPROVED_WITH_EVIDENCE'),
            scores: {
                contextClarity: Number(($('#proj-score-ctx')?.value ?? '4')),
                boundaryIntegrity: Number(($('#proj-score-bnd')?.value ?? '4')),
                tradeoffHonesty: Number(($('#proj-score-trd')?.value ?? '4')),
                verificationRigor: Number(($('#proj-score-ver')?.value ?? '4')),
            },
            auditComment: comment,
        });
        saveProjectsState({ ...projectsState, [project.id]: updated });
        projectWorkspacePage(project.id);
        announceToLiveRegion('Revisión con rúbrica registrada en la bitácora auditable.');
        toast('Revisión humana vinculada a la huella del borrador');
    });
}
function loadMiniProgress() {
    try {
        const raw = localStorage.getItem(MINI_STORAGE_KEY);
        return raw ? sanitizeMiniProgress(JSON.parse(raw), miniGames.map((x) => x.id)) || emptyMiniProgress() : emptyMiniProgress();
    }
    catch {
        return emptyMiniProgress();
    }
}
function saveMiniProgress(progress_data) {
    try {
        localStorage.setItem(MINI_STORAGE_KEY, JSON.stringify(progress_data));
    }
    catch {
        toast('Sin espacio para guardar minijuegos: exporta tu progreso');
    }
}
function miniGamesPage() {
    const progress_data = loadMiniProgress();
    const total = miniGames.reduce((sum, game) => sum + (progress_data.best[game.id] || 0), 0);
    shell(renderMinigamesCatalogHtml(miniGames.map((game) => ({
        id: game.id,
        icon: game.icon,
        tag: game.tag,
        title: game.title,
        subtitle: game.subtitle,
        bestScore: progress_data.best[game.id] || 0,
        starsCount: miniStars(progress_data.best[game.id] || 0),
    })), total));
}
function miniGamePage(game_id) {
    const normalized_game_id = game_id.trim().toLowerCase();
    const game = miniGames.find((g) => g.id === normalized_game_id);
    if (!game) {
        renderNotFoundView('Minijuego');
        return;
    }
    let step = 0;
    let correct = 0;
    let streak = 0;
    let last_outcome = 'idle';
    let answered = null;
    const paint = () => {
        if (step === game.questions.length) {
            const saved = recordMiniRun(loadMiniProgress(), game, correct);
            saveMiniProgress(saved);
            shell(`<div class="backline"><a href="#/minijuegos">← Volver a minijuegos</a><span>RESULTADO</span></div>
      <section class="lesson-card mini-game-complete">
        ${renderArquiBotSprite(correct >= 5 ? 'arquibot-exito' : 'arquibot-explicando', 96, '', assetsManifestLookup)}
        <span class="eyebrow">${esc(game.tag)}</span>
        <h1>${esc(game.title)} — Resultado</h1>
        <p class="mini-score">${correct}<small> / 6 aciertos</small></p>
        <h2>${'★'.repeat(miniStars(correct))}${'☆'.repeat(3 - miniStars(correct))}</h2>
        <p>Tu mejor resultado guardado es ${saved.best[game.id]}/6. Este indicador mide decisiones frente a casos didácticos, no dominio profesional.</p>
        <div class="inline-actions"><button class="btn primary" id="mini-retry">Repetir seis casos</button><a class="btn secondary" href="#/minijuegos">Otros juegos</a></div>
      </section>`);
            $('#mini-retry').onclick = () => miniGamePage(game.id);
            return;
        }
        const question = game.questions[step];
        const graded = answered !== null ? gradeMiniQuestion(question, answered) : null;
        const hud_state = {
            gameId: game.id,
            step,
            totalSteps: game.questions.length,
            correctCount: correct,
            streak,
            lastOutcome: last_outcome,
            reducedMotion: userSettings.reducedMotion,
        };
        shell(`<div class="backline"><a href="#/minijuegos">← Volver a minijuegos</a><span>${esc(game.tag)}</span></div>
    <div class="page-title"><span class="eyebrow">✦ ARENA ARQUITECTÓNICA 3D</span><h1>${esc(game.title)}</h1><p>${esc(game.subtitle)}</p></div>
    ${renderMinigameHudHtml(hud_state)}
    <section class="lesson-card mini-game">
      <div class="mini-head"><span>Decisión ${step + 1} de ${game.questions.length}${game.id === 'incidente' ? ` · Pasos ${step * 10 + 1}–${(step + 1) * 10}` : ''}</span><strong>${correct} aciertos</strong></div>
      <progress class="progress arq-progress" max="100" value="${Math.round((step / game.questions.length) * 100)}" aria-label="Paso ${step + 1} de ${game.questions.length}"></progress>
      <h2>${esc(question.prompt)}</h2>
      <div class="mini-choice-grid">
        ${question.options
            .map((option, i) => `<button type="button" class="option mini-choice ${graded ? (i === question.correct ? 'mini-right' : i === answered ? 'mini-wrong' : '') : ''}" data-mini-answer="${i}" ${graded ? 'disabled' : ''}><span>${String.fromCharCode(65 + i)}</span>${esc(option)}</button>`)
            .join('')}
      </div>
      ${graded
            ? `<div class="feedback ${graded.correct ? 'good' : 'bad'}" role="status"><strong>${graded.correct ? '✓ Decisión defendible' : '↺ Revisa la decisión'}</strong><p>${esc(question.why)}</p>${graded.correct ? '' : `<p><strong>Referencia:</strong> ${esc(question.options[question.correct])}</p>`}</div><button class="btn primary" id="mini-next">${step === game.questions.length - 1 ? 'Ver resultado' : 'Siguiente caso →'}</button>`
            : `<p class="mini-hint"><span aria-hidden="true">◈</span> Pista: ${esc(question.hint)}</p>`}
    </section>`);
        void mountThreeArcadeStage(hud_state);
        if (graded) {
            $('#mini-next').onclick = () => {
                step++;
                answered = null;
                last_outcome = 'idle';
                paint();
            };
        }
        else {
            document.querySelectorAll('[data-mini-answer]').forEach((el) => {
                el.onclick = () => {
                    answered = Number(el.dataset.miniAnswer);
                    const is_hit = gradeMiniQuestion(question, answered).correct;
                    if (is_hit) {
                        correct++;
                        streak++;
                        last_outcome = 'hit';
                    }
                    else {
                        streak = 0;
                        last_outcome = 'miss';
                    }
                    paint();
                    $('#mini-next')?.focus();
                };
            });
        }
    };
    paint();
}
function labsPage() {
    const filtered_labs = filterLabStudios(LAB_STUDIOS, labsCatalogFilter);
    const all_tags = [...new Set(LAB_STUDIOS.map((l) => l.tag))];
    shell(`<div class="page-intro-row">
    <div class="page-title m-0"><span class="eyebrow">⌘ TALLER PRÁCTICO</span><h1>Laboratorios de <span>arquitectura</span></h1><p>Experimenta con reglas reales y modelos simplificados. Todos los ejercicios se realizan localmente; ningún laboratorio despliega infraestructura.</p></div>
    <div class="intro-stat-card" aria-label="Total de laboratorios">
      <span>ESTUDIOS LOCALES</span>
      <strong>${LAB_STUDIOS.length}<small>/${LAB_STUDIOS.length}</small></strong>
      <small>100 % reproducibles</small>
    </div>
  </div>
  <section class="arq-stats-strip stats-strip" aria-label="Indicadores de laboratorios interactivos">
    <div class="intro-stat"><strong>${LAB_STUDIOS.length}</strong><small>ESTUDIOS ACTIVOS</small></div>
    <div class="intro-stat"><strong>C1–C3</strong><small>C4 + MERMAID + PNG</small></div>
    <div class="intro-stat"><strong>DDD</strong><small>CONTEXT MAP + AGREGADOS</small></div>
    <div class="intro-stat"><strong>0</strong><small>LLAMADAS CLOUD</small></div>
  </section>
  <div class="laboratory-hero"><div><span class="eyebrow">◈ DISEÑAR · VALIDAR · ITERAR</span><h2>Tu escritorio de arquitectura</h2><p>Haz visibles las dependencias, documenta los trade-offs y verifica decisiones con escenarios reproducibles.</p></div>${renderArquiBotSprite('arquibot-laboratorio', 180, 'lab-hero-bot', assetsManifestLookup)}</div>
  <section class="lesson-card map-filters-card mt-20" aria-label="Buscar y filtrar laboratorios">
    <div class="map-filters-grid">
      <label class="field-label">Buscar estudio o concepto
        <input id="labs-search-query" type="search" value="${esc(labsCatalogFilter.query)}" placeholder="Ej. C4, DDD, Outbox, SLO, OpenAPI..." maxlength="60"/>
      </label>
      <label class="field-label">Dificultad
        <select id="labs-difficulty-filter">
          <option value="ALL" ${labsCatalogFilter.difficulty === 'ALL' ? 'selected' : ''}>Todas las dificultades</option>
          <option value="Fundamentos" ${labsCatalogFilter.difficulty === 'Fundamentos' ? 'selected' : ''}>Fundamentos</option>
          <option value="Intermedio" ${labsCatalogFilter.difficulty === 'Intermedio' ? 'selected' : ''}>Intermedio</option>
          <option value="Avanzado" ${labsCatalogFilter.difficulty === 'Avanzado' ? 'selected' : ''}>Avanzado</option>
        </select>
      </label>
      <label class="field-label">Área temática
        <select id="labs-tag-filter">
          <option value="ALL" ${labsCatalogFilter.tag === 'ALL' ? 'selected' : ''}>Todas las áreas</option>
          ${all_tags.map((t) => `<option value="${esc(t)}" ${labsCatalogFilter.tag === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}
        </select>
      </label>
      <div class="flex-end">
        <button type="button" class="btn secondary small" id="labs-reset-filters">Restablecer filtros</button>
      </div>
    </div>
  </section>
  ${filtered_labs.length > 0
        ? `<div class="lab-grid">
          ${filtered_labs
            .map((lab) => `<a class="lab-item" href="#/laboratorio/${lab.id}">
                <div class="map-node-top">
                  <div class="lab-icon mb-0">${lab.icon}</div>
                  <span class="map-badge">${esc(lab.difficulty)}</span>
                </div>
                <span class="mini-tag mt-10">${lab.tag}</span>
                <h3>${lab.title}</h3>
                <p>${lab.subtitle}</p>
                <div class="module-tags mb-10">
                  <span class="tag tag-accent">local/${esc(lab.id)}</span>
                </div>
                <div class="module-card-footer">
                  <span class="tile-link">Abrir laboratorio</span>
                  <span aria-hidden="true">→</span>
                </div>
              </a>`)
            .join('')}
        </div>`
        : `<section class="lesson-card" data-ui-state="empty">${renderArquiBotSprite('arquibot-pensando', 72, '', assetsManifestLookup)}<h3>Ningún laboratorio coincide con el filtro</h3><p class="muted">Restablece los filtros para volver a ver los 8 estudios interactivos.</p></section>`}`);
    const q_input = document.querySelector('#labs-search-query');
    const diff_sel = document.querySelector('#labs-difficulty-filter');
    const tag_sel = document.querySelector('#labs-tag-filter');
    const rst_btn = document.querySelector('#labs-reset-filters');
    if (q_input) {
        q_input.oninput = () => {
            const caret = q_input.selectionStart ?? q_input.value.length;
            labsCatalogFilter = { ...labsCatalogFilter, query: q_input.value };
            labsPage();
            const refreshed = document.querySelector('#labs-search-query');
            if (refreshed) {
                refreshed.focus();
                try {
                    refreshed.setSelectionRange(caret, caret);
                }
                catch {
                    /* ignore */
                }
            }
        };
    }
    if (diff_sel) {
        diff_sel.onchange = () => {
            labsCatalogFilter = {
                ...labsCatalogFilter,
                difficulty: diff_sel.value,
            };
            labsPage();
        };
    }
    if (tag_sel) {
        tag_sel.onchange = () => {
            labsCatalogFilter = { ...labsCatalogFilter, tag: tag_sel.value };
            labsPage();
        };
    }
    if (rst_btn) {
        rst_btn.onclick = () => {
            labsCatalogFilter = { query: '', difficulty: 'ALL', tag: 'ALL' };
            labsPage();
        };
    }
}
function isCaseLabId(value) {
    return value === 'patterns' || value === 'api' || value === 'incident';
}
function resolveLabSpritePose(studio_id) {
    if (studio_id === 'c4')
        return 'arquibot-diagrama';
    if (studio_id === 'ddd' || studio_id === 'api' || studio_id === 'patterns')
        return 'arquibot-codigo';
    if (studio_id === 'incident' || studio_id === 'distributed')
        return 'arquibot-debug';
    if (studio_id === 'adr')
        return 'arquibot-libro';
    return 'arquibot-laboratorio';
}
function bindWorkspaceTabControls(root_selector) {
    const panes_root = document.querySelector(root_selector);
    const tabs = Array.from(document.querySelectorAll('[data-ws-tab]'));
    tabs.forEach((btn, idx) => {
        btn.onclick = () => {
            const target_tab = (btn.dataset.wsTab || 'all');
            labWorkspaceTab = target_tab;
            if (panes_root)
                panes_root.dataset.activePane = target_tab;
            tabs.forEach((other) => {
                const is_active = other === btn;
                other.classList.toggle('active', is_active);
                other.setAttribute('aria-selected', is_active ? 'true' : 'false');
            });
            announceToLiveRegion(`Sección activa: ${btn.textContent?.trim() ?? target_tab}`);
        };
        btn.onkeydown = (event) => {
            if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft')
                return;
            event.preventDefault();
            const next_idx = event.key === 'ArrowRight' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
            tabs[next_idx]?.click();
            tabs[next_idx]?.focus();
        };
    });
}
function studioPage(studio_id) {
    const normalized_studio_id = studio_id.trim().toLowerCase();
    const lab = LAB_STUDIOS.find((item) => item.id === normalized_studio_id);
    if (!lab) {
        renderNotFoundView('Laboratorio');
        return;
    }
    const canonical_studio_id = lab.id;
    labWorkspaceTab = 'all';
    let body = '';
    if (canonical_studio_id === 'dependencias') {
        body = `<div data-workspace-pane="context">
      <p>Regla concéntrica: el <strong>Dominio</strong> no puede depender de Infraestructura ni Presentación (<code>Ce = 0</code>, <code>I = 0</code>). Carga un preset arquitectónico o construye relaciones personalizadas.</p>
      <div class="builder-box">
        <label>Preset de arquitectura
          <select id="dep-preset-select">
            ${DEPENDENCY_PRESETS.map((p) => `<option value="${p.id}" ${p.id === selectedDepPreset ? 'selected' : ''}>${esc(p.label)}</option>`).join('')}
          </select>
        </label>
        <button type="button" class="btn secondary small" id="apply-dep-preset">Cargar preset</button>
      </div>
      <div class="inline-actions mt-10" role="group" aria-label="Fixtures de verificación del grafo">
        <button type="button" class="jump-pill" data-dep-fixture="positive">✓ Fixture Positivo</button>
        <button type="button" class="jump-pill" data-dep-fixture="negative">✕ Fixture Negativo</button>
        <button type="button" class="jump-pill" data-dep-fixture="boundary">◈ Fixture Límite</button>
      </div>
    </div>
    <div data-workspace-pane="work">
      <div class="builder-box">
        <label>Origen <select id="from-node"><option>Presentación</option><option>Aplicación</option><option>Dominio</option><option>Infraestructura</option></select></label>
        <label>Destino <select id="to-node"><option>Aplicación</option><option>Dominio</option><option>Infraestructura</option><option>Presentación</option></select></label>
        <button class="btn primary small" id="add-edge">+ Añadir relación</button>
      </div>
      <div id="graph-area"></div>
    </div>
    <div data-workspace-pane="validation">
      <div id="dep-metrics-panel"></div>
      <div id="lab-result" role="status"></div>
      <div class="inline-actions">
        <button type="button" class="btn secondary small" id="export-dep-svg">Exportar SVG (.svg)</button>
        <button type="button" class="btn secondary small" id="export-dep-mermaid">Exportar Mermaid (.mmd)</button>
        <button type="button" class="btn secondary small" id="export-dep-md">Exportar informe (.md)</button>
      </div>
    </div>`;
    }
    else if (canonical_studio_id === 'c4') {
        const allowed_types = C4_LEVEL_TYPES[c4CurrentLevel];
        body = `<div data-workspace-pane="context">
      <p>Modela NexoShop en tres niveles C4: <strong>Contexto (C1)</strong>, <strong>Contenedores (C2)</strong> y <strong>Componentes (C3)</strong>. Incluye validación topológica y semántica en vivo sin necesidad de drag-and-drop.</p>
      <div class="builder-box">
        <label>Nivel C4
          <select id="c4-level-select">
            ${C4_LEVELS.map((lvl) => `<option value="${lvl}" ${lvl === c4CurrentLevel ? 'selected' : ''}>${esc(C4_LEVEL_METADATA[lvl].title)}</option>`).join('')}
          </select>
        </label>
        <button type="button" class="btn secondary small" id="c4-load-preset">Cargar ejemplo ${c4CurrentLevel}</button>
      </div>
      <div class="inline-actions mt-10" role="group" aria-label="Fixtures de prueba C4">
        <button type="button" class="jump-pill" data-c4-fixture="positive">✓ Fixture Positivo</button>
        <button type="button" class="jump-pill" data-c4-fixture="negative">✕ Fixture Negativo</button>
        <button type="button" class="jump-pill" data-c4-fixture="boundary">◈ Fixture Límite (12 nodos)</button>
      </div>
    </div>
    <div data-workspace-pane="work">
      <div class="builder-box">
        <label>Elemento <input id="c4-label" placeholder="Ej. Servicio de pedidos" maxlength="${MAX_C4_LABEL_LENGTH}"/></label>
        <label>Tipo <select id="c4-type">${allowed_types.map((t) => `<option>${esc(t)}</option>`).join('')}</select></label>
        <button class="btn primary small" id="c4-add">Añadir</button>
      </div>
      <div id="c4-diagram" class="c4-diagram"></div>
      <h3>Relaciones y contratos</h3>
      <p>Indica origen, destino y el contrato/protocolo explícito (ej. HTTPS/JSON, Evento Outbox, SQL). No se ejecuta código del usuario.</p>
      <div class="builder-box">
        <label>Origen<select id="c4-from"></select></label>
        <label>Destino<select id="c4-to"></select></label>
        <label>Contrato o propósito<input id="c4-rel-label" placeholder="Ej. Consulta pedidos HTTPS" maxlength="${MAX_C4_LABEL_LENGTH}"/></label>
        <button class="btn secondary small" id="c4-link">+ Añadir relación</button>
      </div>
      <div id="c4-rel-list" class="edge-list"></div>
    </div>
    <div data-workspace-pane="validation">
      <div id="c4-feedback" role="status"></div>
      <div id="c4-accessible-summary"></div>
      <div class="builder-box">
        <label>Escenario contextual C4
          <select id="c4-context-scenario">
            ${C4_CONTEXTUAL_SCENARIOS.map((sc) => `<option value="${sc.id}" ${sc.id === selectedC4ContextScenario ? 'selected' : ''}>${esc(sc.label)}</option>`).join('')}
          </select>
        </label>
        <button type="button" class="btn secondary small" id="c4-eval-context">Evaluar escenario contextual</button>
      </div>
      <div id="c4-context-report" role="status" aria-live="polite"></div>
      <div class="inline-actions">
        <button class="btn secondary small" id="c4-export">Exportar JSON</button>
        <label class="btn secondary small file-label">Importar JSON<input type="file" accept="application/json,.json" id="c4-import" class="sr-file-input"/></label>
        <button class="btn secondary small" id="c4-mermaid">Exportar Mermaid</button>
        <button class="btn secondary small" id="c4-svg">Exportar SVG</button>
        <button class="btn primary small" id="c4-png">Exportar PNG</button>
      </div>
    </div>`;
    }
    else if (canonical_studio_id === 'ddd') {
        body = `<div id="ddd-workshop-root"></div>`;
    }
    else if (isCaseLabId(canonical_studio_id)) {
        const prompt = FALLBACK_CASE_PROMPTS[canonical_studio_id];
        body = `<div class="question-box"><strong>${prompt.q}</strong>${prompt.options.map((opt, i) => `<button class="option" data-lab-answer="${i}"><span>${String.fromCharCode(65 + i)}</span>${opt}</button>`).join('')}</div><div id="lab-result"></div>`;
    }
    else if (canonical_studio_id === 'distributed') {
        body = `<div data-workspace-pane="context">
      <p>Simulador doble de sistemas distribuidos: (1) Tasa de reintentos y deduplicación en 1.000 entregas y (2) Timeline determinista paso a paso de <strong>Outbox + Idempotent Consumer + DLQ + Saga compensatoria</strong>.</p>
    </div>
    <div data-workspace-pane="work">
      <h3>Modo 1 · Simulación de volumen (1.000 entregas)</h3>
      <div class="sim-config">
        <label>Probabilidad de reintento <input id="retry-rate" type="range" min="0" max="70" value="30"/><output id="retry-value">30%</output></label>
        <label>Estrategia <select id="retry-strategy"><option value="naive">Procesador sin idempotencia</option><option value="dedupe">Deduplicación por operación</option></select></label>
        <button class="btn primary small" id="run-sim">▶ Simular 1000 operaciones</button>
      </div>
      <div id="lab-result" role="status"></div>
      <hr class="section-divider"/>
      <h3>Modo 2 · Inyección de fallos y timeline paso a paso</h3>
      <label class="field-label">Escenario de fallo en producción
        <select id="dist-fault-scenario">
          ${DISTRIBUTED_FAULT_SCENARIOS.map((s) => `<option value="${s.id}">${esc(s.label)}</option>`).join('')}
        </select>
      </label>
      <div class="suite-checks my-14">
        <label><input type="checkbox" id="dist-chk-outbox" checked/> Transactional Outbox</label>
        <label><input type="checkbox" id="dist-chk-idempotency" checked/> Idempotent Consumer (Inbox)</label>
        <label><input type="checkbox" id="dist-chk-dlq" checked/> Dead Letter Queue (DLQ)</label>
        <label><input type="checkbox" id="dist-chk-saga" checked/> Saga compensatoria</label>
      </div>
      <div class="inline-actions">
        <button type="button" class="btn primary small" id="dist-run-timeline">▶ Ejecutar timeline paso a paso</button>
        <button type="button" class="btn secondary small" id="dist-export-md">Exportar timeline (.md)</button>
      </div>
      ${renderCrossFaultSagaPanelHtml()}
    </div>
    <div data-workspace-pane="validation">
      <div id="dist-timeline-output" role="status" class="mt-16"></div>
    </div>`;
    }
    else if (canonical_studio_id === 'adr') {
        body = `<div data-workspace-pane="context">
      <p>Compara primero las alternativas en la matriz multicriterio y luego redacta tu Architecture Decision Record (ADR) para NexoShop.</p>
      <div class="map-table-scroll" tabindex="0" role="region" aria-label="Matriz multicriterio de opciones ADR">
        <table class="map-accessible-table">
          <thead><tr><th>Opción</th><th>SLO (1-5)</th><th>Coste (1-5)</th><th>Carga Equipo (1-5)</th><th>Reversibilidad</th><th>Riesgo clave</th></tr></thead>
          <tbody>
            ${ADR_OPTION_MATRIX.map((opt) => `<tr><td><strong>${esc(opt.label)}</strong></td><td>${opt.sloFit}/5</td><td>${opt.costEfficiency}/5</td><td>${opt.teamSimplicity}/5</td><td>${opt.reversibility}/5</td><td>${esc(opt.keyRisk)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div data-workspace-pane="work">
      <label class="field-label">Alternativa seleccionada en la matriz
        <select id="adr-selected-option">
          ${ADR_OPTION_MATRIX.map((opt) => `<option value="${opt.id}" ${opt.id === selectedAdrOptionId ? 'selected' : ''}>${esc(opt.label)}</option>`).join('')}
        </select>
      </label>
      <label class="field-label">Título<input id="adr-title" value="ADR-001: Estrategia de arquitectura de pedidos"/></label>
      <label class="field-label">Contexto<textarea id="adr-context" rows="3" placeholder="Restricciones, SLO, volumen, equipo..."></textarea></label>
      <label class="field-label">Decisión<textarea id="adr-decision" rows="3" placeholder="Qué elegimos y por qué..."></textarea></label>
      <label class="field-label">Alternativas y consecuencias<textarea id="adr-tradeoff" rows="3" placeholder="Alternativa descartada; coste y riesgo..."></textarea></label>
    </div>
    <div data-workspace-pane="validation">
      <div class="inline-actions"><button class="btn secondary small" id="adr-check">Revisar estructura</button><button class="btn primary small" id="adr-export">Exportar ADR.md</button></div>
      <div id="lab-result" role="status"></div>
    </div>`;
    }
    const lab_pose = resolveLabSpritePose(canonical_studio_id);
    shell(`<div class="backline"><a href="#/laboratorios">← Todos los laboratorios</a><span>${lab.tag} · ${lab.difficulty.toUpperCase()}</span></div>
  <div class="page-title"><span class="eyebrow">⌘ LABORATORIO INTERACTIVO</span><h1>${esc(lab.title)}</h1><p>${esc(lab.subtitle)}</p></div>
  ${renderLabTelemetryHeaderHtml(canonical_studio_id)}
  ${renderMobileWorkspaceTabsHtml(labWorkspaceTab, 'lab-ws-tab')}
  <div class="studio-layout workspace-panes-root" id="lab-panes-root" data-active-pane="${labWorkspaceTab}">
    <section class="studio-card">${body}</section>
    <aside class="studio-side" data-workspace-pane="context">
      <div class="aside-panel">${renderArquiBotSprite(lab_pose, 124, '', assetsManifestLookup)}<h3>Consejo de diseño</h3><p>Justifica una decisión, identifica el riesgo y pregunta qué cambiaría bajo otras restricciones.</p></div>
      <p class="muted">Estos simuladores son educativos y simplificados. Los modelos exportados se pueden revisar fuera de la plataforma.</p>
    </aside>
  </div>`);
    if (canonical_studio_id === 'dependencias')
        initGraphLab();
    if (canonical_studio_id === 'c4')
        initC4Lab();
    if (canonical_studio_id === 'ddd')
        initDddLab();
    if (canonical_studio_id === 'distributed')
        initDistributedSimLab();
    if (canonical_studio_id === 'adr')
        initAdrLab();
    if (isCaseLabId(canonical_studio_id))
        initCaseLab(canonical_studio_id);
    bindWorkspaceTabControls('#lab-panes-root');
}
function initCaseLab(case_lab_id) {
    const cases = labCases[case_lab_id] || [];
    const box = document.querySelector('.studio-card');
    if (!box || cases.length !== 4)
        return;
    box.innerHTML = `<div data-workspace-pane="context"><p>Modo 1: Cuatro casos de producción con una decisión justificada por caso. Modo 2: Simulador interactivo especializado con exportación Markdown.</p></div>
  <div data-workspace-pane="work">
    ${cases
        .map((item, idx) => `<div class="case-question">
          <span class="overline">CASO ${idx + 1} / 4</span>
          <h3>${esc(item.q)}</h3>
          ${item.options.map((opt, j) => `<label class="suite-option"><input type="radio" name="lab-${item.id}" value="${j}"/><span>${esc(opt)}</span></label>`).join('')}
          <div id="case-fb-${item.id}" role="status"></div>
        </div>`)
        .join('')}
  </div>
  <div data-workspace-pane="validation">
    <button class="btn primary" id="evaluate-case-lab">Evaluar los cuatro casos</button>
    <div id="lab-result" role="status"></div>
  </div>
  <div id="case-lab-advanced-host">${renderCaseLabAdvancedSectionHtml(case_lab_id, selectedApiDiffScenarioId)}</div>`;
    document.querySelector('#evaluate-case-lab')?.addEventListener('click', () => {
        let passed = 0;
        for (const item of cases) {
            const choice = document.querySelector(`input[name="lab-${item.id}"]:checked`)?.value;
            const is_correct = choice !== undefined && Number(choice) === item.correct;
            if (is_correct)
                passed++;
            const fb = document.querySelector(`#case-fb-${item.id}`);
            if (fb) {
                fb.innerHTML = `<div class="feedback ${is_correct ? 'good' : 'bad'}"><b>${is_correct ? '✓ Respuesta defendible' : '↺ Revisa el caso'}</b><p>${esc(item.why)}</p></div>`;
            }
        }
        $('#lab-result').innerHTML = `<div class="feedback ${passed === 4 ? 'good' : 'bad'}"><strong>${passed}/4 decisiones correctas</strong><p>Casos educativos de referencia; la interpretación puede cambiar con requisitos adicionales.</p></div>`;
    });
    if (case_lab_id === 'patterns') {
        document.querySelector('#pat-run-eval')?.addEventListener('click', () => {
            const variants = Number($('#pat-variants').value);
            const freq = $('#pat-freq').value;
            const approach = $('#pat-approach').value;
            const res = evaluatePatternVariabilityTradeoff({
                activeVariants: variants,
                changeFrequency: freq,
                selectedApproach: approach,
            });
            $('#pat-sim-result').innerHTML = `<div class="feedback ${res.status === 'PASS' ? 'good' : 'bad'}"><strong>${esc(res.verdictTitle)}</strong><p>${esc(res.justification)} · Coste estructural relativo: <b>${res.complexityScore}/100</b>.</p></div>`;
        });
    }
    if (case_lab_id === 'api') {
        const bindApiAdvancedControls = () => {
            const scen_sel = document.querySelector('#api-diff-scenario');
            if (scen_sel) {
                scen_sel.onchange = () => {
                    selectedApiDiffScenarioId = scen_sel.value;
                    const adv_host = document.querySelector('#case-lab-advanced-host');
                    if (adv_host) {
                        adv_host.innerHTML = renderCaseLabAdvancedSectionHtml('api', selectedApiDiffScenarioId);
                        bindApiAdvancedControls();
                    }
                };
            }
            const readChosenIssues = () => Array.from(document.querySelectorAll('[data-api-issue]:checked')).map((el) => el.dataset.apiIssue);
            document.querySelector('#api-audit-btn')?.addEventListener('click', () => {
                const chosen = readChosenIssues();
                const res = evaluateApiContractDiffAudit(selectedApiDiffScenarioId, chosen);
                $('#api-audit-result').innerHTML = `<div class="feedback ${res.status === 'PASS' ? 'good' : 'bad'}">
          <strong>${res.status === 'PASS' ? '✓ Auditoría exacta de breaking changes' : '↺ Revisa los hallazgos del contrato v2'}</strong>
          <p>${esc(res.explanation)}</p>
          ${res.missed.length ? `<p><b>Omitiste:</b> ${esc(res.missed.map((m) => API_BREAKING_ISSUE_LABELS[m]).join(' · '))}</p>` : ''}
          ${res.falsePositives.length ? `<p><b>No aplican en este diff:</b> ${esc(res.falsePositives.map((f) => API_BREAKING_ISSUE_LABELS[f]).join(' · '))}</p>` : ''}
        </div>`;
            });
            document.querySelector('#api-export-md')?.addEventListener('click', () => {
                downloadFile(`${selectedApiDiffScenarioId}-audit.md`, exportApiContractAuditMarkdown(selectedApiDiffScenarioId, readChosenIssues()), 'text/markdown');
            });
            bindOpenApiCdcLabControls();
        };
        bindApiAdvancedControls();
    }
    if (case_lab_id === 'incident') {
        const readSloInput = () => ({
            sloPercent: Number($('#slo-target').value),
            windowDays: Number($('#slo-window-days').value),
            observedErrorRatePercent: Number($('#slo-observed-err').value),
        });
        const readResInput = () => ({
            callerSlaMs: Number($('#res-sla-ms').value),
            dependencyTimeoutMs: Number($('#res-timeout-ms').value),
            maxRetries: Number($('#res-retries').value),
            jitterEnabled: $('#res-jitter').checked,
            circuitBreakerEnabled: $('#res-cb').checked,
            bulkheadEnabled: $('#res-bulkhead').checked,
        });
        document.querySelector('#slo-calc-btn')?.addEventListener('click', () => {
            const res = calculateSloBurnRate(readSloInput());
            $('#slo-calc-result').innerHTML = `<div class="feedback ${res.alertAction === 'WITHIN_BUDGET' ? 'good' : 'bad'}">
        <strong>Burn Rate: ${res.burnRate}× · Acción: ${esc(res.alertAction)}</strong>
        <p>Presupuesto total en ventana: <b>${res.totalBudgetMinutes} min</b> (${res.errorBudgetPercent}%). ${res.hoursUntilExhaustion !== null ? `Tiempo estimado hasta agotar presupuesto al ritmo actual: <b>${res.hoursUntilExhaustion} h</b>.` : ''}</p>
        <p>${esc(res.recommendation)}</p>
      </div>`;
        });
        document.querySelector('#res-eval-btn')?.addEventListener('click', () => {
            const res = evaluateResilienceDefense(readResInput());
            $('#res-eval-result').innerHTML = `<div class="feedback ${res.status === 'PASS' ? 'good' : 'bad'}">
        <strong>${res.status === 'PASS' ? '✓ Defensas coordinadas dentro del SLA' : '⚠ Descoordinación de resiliencia detectada'}</strong>
        <p>Latencia acumulada peor caso: <b>${res.worstCaseLatencyMs} ms</b>.</p>
        ${res.findings.map((f) => `<p>• ${esc(f)}</p>`).join('')}
      </div>`;
        });
        document.querySelector('#incident-export-md')?.addEventListener('click', () => {
            downloadFile('nexoshop-incident-runbook.md', exportIncidentRunbookMarkdown(readSloInput(), readResInput()), 'text/markdown');
        });
        bindDimensionalCapacityControls();
    }
}
function initGraphLab() {
    const draw = () => {
        const layers = ['Presentación', 'Aplicación', 'Dominio', 'Infraestructura'];
        const icons = ['▣', '⌘', '⬡', '▥'];
        const metrics = computeLayerCouplingMetrics(edges);
        $('#graph-area').innerHTML = `<div class="map-svg-wrap mb-14" tabindex="0" role="region" aria-label="Diagrama SVG en vivo de capas">${renderDependencyLayerSvgHtml(edges)}</div>
    <div class="graph-nodes">${layers.map((name, i) => `<div class="graph-node">${icons[i]}<br><b>${name}</b></div>`).join('')}</div>
    <div class="edge-list">${edges.map(([from, to], i) => `<span>${from} <b>→</b> ${to} <button data-remove-edge="${i}" aria-label="Eliminar relación">×</button></span>`).join('')}</div>
    <button class="btn secondary small" id="check-graph">Verificar dependencias</button>`;
        const metrics_el = document.querySelector('#dep-metrics-panel');
        if (metrics_el) {
            metrics_el.innerHTML = `<div class="map-table-scroll" tabindex="0" role="region" aria-label="Métricas de acoplamiento por capa"><table class="map-accessible-table" aria-label="Métricas de acoplamiento por capa">
        <thead><tr><th>Capa</th><th>Ca (Aferente)</th><th>Ce (Eferente)</th><th>Inestabilidad I</th></tr></thead>
        <tbody>${metrics.map((m) => `<tr><td><strong>${esc(m.layer)}</strong></td><td>${m.afferentCa}</td><td>${m.efferentCe}</td><td>${m.instability.toFixed(2)}</td></tr>`).join('')}</tbody>
      </table></div>`;
        }
        document.querySelectorAll('[data-remove-edge]').forEach((el) => {
            el.onclick = () => {
                edges.splice(Number(el.dataset.removeEdge), 1);
                draw();
            };
        });
        $('#check-graph').onclick = () => {
            const diag = diagnoseDependencyFailures(edges);
            $('#lab-result').innerHTML = `<div class="feedback ${diag.valid ? 'good' : 'bad'}">
        <b>${diag.valid ? '✓ Grafo concéntrico sin violaciones detectadas' : `⚠ ${diag.failures.length} fallo(s) arquitectónico(s) detectado(s)`}</b>
        ${diag.valid
                ? '<p>La dirección de dependencias protege el Dominio (Ce = 0) bajo estas reglas estáticas educativas.</p>'
                : diag.failures
                    .map((f) => `<p>• <strong>${esc(f.edgeLabel)}</strong> [${esc(f.code)}]: ${esc(f.reason)} <em>Corrección:</em> ${esc(f.fixAction)}</p>`)
                    .join('')}
      </div>`;
        };
    };
    document.querySelectorAll('[data-dep-fixture]').forEach((btn) => {
        btn.onclick = () => {
            const kind = (btn.dataset.depFixture || 'positive');
            const fx = DEPENDENCY_VERIFICATION_FIXTURES[kind];
            edges = fx.edges.map(([a, b]) => [a, b]);
            draw();
            $('#check-graph').click();
        };
    });
    $('#apply-dep-preset').onclick = () => {
        selectedDepPreset = $('#dep-preset-select').value;
        const preset = DEPENDENCY_PRESETS.find((p) => p.id === selectedDepPreset);
        if (preset) {
            edges = preset.edges.map(([a, b]) => [a, b]);
            draw();
            $('#lab-result').innerHTML = `<div class="feedback good"><b>Preset cargado: ${esc(preset.label)}</b><p>${esc(preset.summary)}</p></div>`;
        }
    };
    $('#add-edge').onclick = () => {
        const from = $('#from-node').value;
        const to = $('#to-node').value;
        if (from !== to && !edges.some((x) => x[0] === from && x[1] === to)) {
            edges.push([from, to]);
            draw();
        }
    };
    $('#export-dep-svg').onclick = () => downloadFile('nexoshop-dependencias.svg', sanitizeAndVerifySvgExport(renderDependencyLayerSvgHtml(edges)).svg, 'image/svg+xml');
    $('#export-dep-mermaid').onclick = () => downloadFile('nexoshop-dependencias.mmd', exportDependencyGraphMermaid(edges), 'text/plain');
    $('#export-dep-md').onclick = () => downloadFile('nexoshop-dependencias.md', exportDependencyLabMarkdown(edges), 'text/markdown');
    draw();
}
function downloadFile(name, content, mime_type = 'text/plain') {
    const anchor = document.createElement('a');
    const url = URL.createObjectURL(new Blob([content], { type: mime_type }));
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
function c4NodeIcon(type) {
    if (type === 'Frontend' || type === 'Persona / Actor')
        return '▣';
    if (type === 'API' || type === 'Sistema Principal' || type === 'Caso de Uso')
        return '⌘';
    if (type === 'Base de datos' || type === 'Repositorio / Puerto')
        return '▥';
    if (type === 'Dominio / Agregado')
        return '⬡';
    return '☁';
}
function initC4Lab() {
    const currentModel = () => ({
        kind: 'C4-containers-educational',
        system: 'NexoShop',
        level: c4CurrentLevel,
        containers: [...containers],
        relations: [...c4Relations],
    });
    const feedback = (message) => {
        $('#c4-feedback').textContent = message;
    };
    const syncTypeOptions = () => {
        const type_sel = document.querySelector('#c4-type');
        if (!type_sel)
            return;
        const allowed = C4_LEVEL_TYPES[c4CurrentLevel];
        type_sel.innerHTML = allowed.map((t) => `<option>${esc(t)}</option>`).join('');
    };
    const draw = () => {
        $('#c4-diagram').innerHTML = `<div class="c4-person">◉ ${c4CurrentLevel === 'C3' ? 'Frontera API Pedidos' : 'Cliente'}<br><small>${esc(C4_LEVEL_METADATA[c4CurrentLevel].title)}</small></div><div class="c4-arrow">↓</div><div class="c4-nodes">${containers
            .map((item, i) => `<div class="c4-node"><span>${c4NodeIcon(item.type)}</span><strong>${esc(item.label)}</strong><small>${esc(item.type)}</small><div class="c4-node-actions"><button type="button" data-c4-move-up="${i}" aria-label="Mover arriba ${esc(item.label)}" ${i === 0 ? 'disabled' : ''}>↑</button><button type="button" data-c4-move-down="${i}" aria-label="Mover abajo ${esc(item.label)}" ${i === containers.length - 1 ? 'disabled' : ''}>↓</button><button type="button" data-c4-remove="${i}" aria-label="Eliminar elemento ${esc(item.label)}">×</button></div></div>`)
            .join('')}</div>`;
        const choices = containers.map((c) => `<option value="${esc(c.id)}">${esc(c.label)}</option>`).join('');
        $('#c4-from').innerHTML = choices;
        $('#c4-to').innerHTML = choices;
        $('#c4-rel-list').innerHTML = c4Relations
            .map((rel, i) => `<span><b>${esc(containers.find((x) => x.id === rel.from)?.label)}</b> → <b>${esc(containers.find((x) => x.id === rel.to)?.label)}</b>: ${esc(rel.label)} <button data-c4-unlink="${i}" aria-label="Eliminar relación ${i + 1}">×</button></span>`)
            .join('');
        const summary_host = document.querySelector('#c4-accessible-summary');
        if (summary_host) {
            const model = currentModel();
            const warnings = analyzeC4Semantics(model);
            summary_host.innerHTML = renderC4AccessibleSummaryHtml(model, warnings);
        }
        document.querySelectorAll('[data-c4-move-up]').forEach((btn) => {
            btn.onclick = () => {
                containers = moveC4ContainerOrder(containers, Number(btn.dataset.c4MoveUp), 'up');
                draw();
                feedback('Orden actualizado por teclado/botón sin drag-and-drop');
            };
        });
        document.querySelectorAll('[data-c4-move-down]').forEach((btn) => {
            btn.onclick = () => {
                containers = moveC4ContainerOrder(containers, Number(btn.dataset.c4MoveDown), 'down');
                draw();
                feedback('Orden actualizado por teclado/botón sin drag-and-drop');
            };
        });
        document.querySelectorAll('[data-c4-remove]').forEach((el) => {
            el.onclick = () => {
                const removed = containers.splice(Number(el.dataset.c4Remove), 1)[0];
                c4Relations = c4Relations.filter((rel) => rel.from !== removed.id && rel.to !== removed.id);
                draw();
                feedback('Elemento eliminado junto a sus relaciones');
            };
        });
        document.querySelectorAll('[data-c4-unlink]').forEach((el) => {
            el.onclick = () => {
                c4Relations.splice(Number(el.dataset.c4Unlink), 1);
                draw();
                feedback('Relación eliminada');
            };
        });
    };
    const applyPreset = (lvl) => {
        c4CurrentLevel = lvl;
        const preset = C4_LEVEL_PRESETS[lvl];
        containers = preset.containers.map((c) => ({ ...c }));
        c4Relations = preset.relations.map((r) => ({ ...r }));
        const preset_btn = document.querySelector('#c4-load-preset');
        if (preset_btn)
            preset_btn.textContent = `Cargar ejemplo ${lvl}`;
        syncTypeOptions();
        draw();
        feedback(`Vista cambiada a ${C4_LEVEL_METADATA[lvl].title}`);
    };
    const lvl_sel = document.querySelector('#c4-level-select');
    if (lvl_sel) {
        lvl_sel.onchange = () => applyPreset(lvl_sel.value);
    }
    document.querySelector('#c4-load-preset')?.addEventListener('click', () => applyPreset(c4CurrentLevel));
    document.querySelectorAll('[data-c4-fixture]').forEach((btn) => {
        btn.onclick = () => {
            const kind = (btn.dataset.c4Fixture || 'positive');
            const fx = C4_VERIFICATION_FIXTURES[kind];
            c4CurrentLevel = resolveC4Level(fx.model);
            if (lvl_sel)
                lvl_sel.value = c4CurrentLevel;
            syncTypeOptions();
            containers = fx.model.containers.map((c) => ({ ...c }));
            c4Relations = fx.model.relations.map((r) => ({ ...r }));
            draw();
            feedback(`Fixture cargado: ${fx.label}`);
        };
    });
    $('#c4-add').onclick = () => {
        const label = $('#c4-label').value.trim();
        if (label.length < MIN_C4_LABEL_LENGTH || label.length > MAX_C4_LABEL_LENGTH || containers.length >= MAX_C4_CONTAINERS) {
            feedback(`Escribe un nombre de ${MIN_C4_LABEL_LENGTH} a ${MAX_C4_LABEL_LENGTH} caracteres; máximo ${MAX_C4_CONTAINERS} elementos.`);
            return;
        }
        const type = $('#c4-type').value;
        const allowed = C4_LEVEL_TYPES[c4CurrentLevel];
        if (!allowed.includes(type) && !C4_TYPES.includes(type)) {
            feedback('Tipo no permitido en este nivel C4');
            return;
        }
        containers.push({ id: `user-${++c4Serial}`, label, type });
        $('#c4-label').value = '';
        draw();
        feedback('Elemento añadido');
    };
    $('#c4-link').onclick = () => {
        const from = $('#c4-from').value;
        const to = $('#c4-to').value;
        const label = $('#c4-rel-label').value.trim();
        const proposed = { from, to, label };
        const errors = validateC4({ ...currentModel(), relations: [...c4Relations, proposed] });
        if (errors.length) {
            feedback(errors.join(' '));
            return;
        }
        c4Relations.push(proposed);
        $('#c4-rel-label').value = '';
        draw();
        feedback('Relación añadida; revisa las alertas semánticas y el resumen accesible');
    };
    const validModel = () => {
        const model = currentModel();
        const errors = validateC4(model);
        if (errors.length) {
            feedback(errors.join(' '));
            return null;
        }
        return model;
    };
    $('#c4-export').onclick = () => {
        const model = validModel();
        if (model)
            downloadFile(`nexoshop-${c4CurrentLevel.toLowerCase()}.json`, JSON.stringify(model, null, 2), 'application/json');
    };
    $('#c4-import').onchange = async (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        try {
            if (file.size > MAX_BACKUP_FILE_BYTES)
                throw new Error('Archivo C4 demasiado grande');
            const parsed = c4ModelImportSchema.parse(JSON.parse(await file.text()), 'c4.json');
            c4CurrentLevel = resolveC4Level(parsed);
            if (lvl_sel)
                lvl_sel.value = c4CurrentLevel;
            syncTypeOptions();
            containers = parsed.containers.map((c) => ({ ...c }));
            c4Relations = parsed.relations.map((r) => ({ ...r }));
            draw();
            feedback(`Modelo C4 (${c4CurrentLevel}) importado (${containers.length} elementos, ${c4Relations.length} relaciones)`);
        }
        catch (err) {
            feedback(`No se pudo importar C4: ${err.message}`);
        }
        finally {
            event.target.value = '';
        }
    };
    $('#c4-mermaid').onclick = () => {
        const model = validModel();
        if (model)
            downloadFile(`nexoshop-${c4CurrentLevel.toLowerCase()}.mmd`, c4Mermaid(model), 'text/plain');
    };
    $('#c4-svg').onclick = () => {
        const model = validModel();
        if (model) {
            downloadFile(`nexoshop-${c4CurrentLevel.toLowerCase()}.svg`, sanitizeAndVerifySvgExport(c4Svg(model)).svg, 'image/svg+xml');
        }
    };
    $('#c4-png').onclick = () => {
        const model = validModel();
        if (model)
            downloadC4ModelPng(model, feedback);
    };
    const ctx_sel = document.querySelector('#c4-context-scenario');
    if (ctx_sel) {
        ctx_sel.onchange = () => {
            selectedC4ContextScenario = ctx_sel.value;
        };
    }
    const ctx_eval_btn = document.querySelector('#c4-eval-context');
    if (ctx_eval_btn) {
        ctx_eval_btn.onclick = () => {
            const scenario_id = (ctx_sel?.value || selectedC4ContextScenario);
            selectedC4ContextScenario = scenario_id;
            const evaluation = evaluateC4ContextualScenario(currentModel(), scenario_id);
            const report_host = document.querySelector('#c4-context-report');
            if (report_host) {
                report_host.innerHTML = `<div class="feedback ${evaluation.status === 'PASS' ? 'good' : 'bad'}">
          <strong>${esc(evaluation.summary)}</strong>
          ${evaluation.passedChecks.map((p) => `<p>✓ ${esc(p)}</p>`).join('')}
          ${evaluation.missingChecks.map((m) => `<p>⚠ ${esc(m)}</p>`).join('')}
        </div>`;
            }
            announceToLiveRegion(evaluation.summary);
        };
    }
    syncTypeOptions();
    draw();
    feedback('Modelo editable en C1, C2 y C3. Exporta o importa JSON, Mermaid, SVG o PNG.');
}
function initDddLab() {
    const host = document.querySelector('#ddd-workshop-root');
    if (!host)
        return;
    const paintDdd = () => {
        host.innerHTML = renderDddWorkshopHtml({
            selectedTerm: dddSelectedTerm,
            conceptChoices: dddConceptChoices,
            contextMapLinks: dddContextMapLinks,
            aggregateDraft: dddAggregateDraft,
        });
        const syncDddSelectionsFromDom = () => {
            document.querySelectorAll('[data-ddd-concept]').forEach((sel) => {
                dddConceptChoices[sel.dataset.dddConcept || ''] = sel.value;
            });
            dddAggregateDraft = {
                rootId: $('#ddd-agg-root').value,
                internalEntities: Array.from(document.querySelectorAll('[data-ddd-ent]:checked')).map((el) => el.dataset.dddEnt || ''),
                invariants: Array.from(document.querySelectorAll('[data-ddd-inv]:checked')).map((el) => el.dataset.dddInv || ''),
                eventualEvents: Array.from(document.querySelectorAll('[data-ddd-evt]:checked')).map((el) => el.dataset.dddEvt || ''),
                optimisticConcurrency: $('#ddd-agg-optimistic').checked,
            };
            return dddAggregateDraft;
        };
        document.querySelectorAll('[data-ddd-concept]').forEach((sel) => {
            sel.onchange = () => {
                dddConceptChoices[sel.dataset.dddConcept || ''] = sel.value;
            };
        });
        $('#ddd-term-select').onchange = (ev) => {
            syncDddSelectionsFromDom();
            dddSelectedTerm = ev.target.value;
            paintDdd();
        };
        $('#ddd-check').onclick = () => {
            syncDddSelectionsFromDom();
            const res = evaluateUbiquitousLanguageAssignments(dddConceptChoices);
            const wrong = res.details.filter((d) => !d.ok);
            $('#ddd-concepts-result').innerHTML = `<div class="feedback ${res.allCorrect ? 'good' : 'bad'}">
        <b>${res.correctCount}/${res.totalCount} responsabilidades ubicadas en su Bounded Context propietario</b>
        ${res.allCorrect
                ? '<p>Cada contexto protege las reglas que mutan su propio modelo sin invadir tablas vecinas.</p>'
                : wrong
                    .map((w) => `<p>• <strong>${esc(w.conceptLabel)}</strong>: elegiste «${esc(w.chosen || 'Sin asignar')}», pero pertenece a <b>${esc(w.expected)}</b>.</p>`)
                    .join('')}
      </div>`;
        };
        $('#ddd-cm-add').onclick = () => {
            syncDddSelectionsFromDom();
            const upstream = $('#ddd-cm-upstream').value;
            const downstream = $('#ddd-cm-downstream').value;
            const pattern = $('#ddd-cm-pattern').value;
            const summary = $('#ddd-cm-contract').value.trim() || `Integración ${pattern}`;
            dddContextMapLinks.push({ upstream, downstream, pattern, contractSummary: summary });
            paintDdd();
        };
        document.querySelectorAll('[data-ddd-cm-remove]').forEach((btn) => {
            btn.onclick = () => {
                syncDddSelectionsFromDom();
                dddContextMapLinks.splice(Number(btn.dataset.dddCmRemove), 1);
                paintDdd();
            };
        });
        $('#ddd-agg-evaluate').onclick = () => {
            const res = evaluateDddAggregateDesign(syncDddSelectionsFromDom());
            $('#lab-result').innerHTML = `<div class="feedback ${res.status === 'PASS' ? 'good' : 'bad'}">
        <strong>${res.status === 'PASS' ? '✓ Agregado bien delimitado e invariantes protegidas' : '⚠ Problemas de frontera o concurrencia en el Agregado'}</strong>
        ${res.strengths.map((s) => `<p>✓ ${esc(s)}</p>`).join('')}
        ${res.issues.map((i) => `<p>⚠ ${esc(i)}</p>`).join('')}
        <p class="muted">${esc(res.requiresHumanReviewNote)}</p>
      </div>`;
        };
        document.querySelector('#ddd-export-svg')?.addEventListener('click', () => downloadFile('nexoshop-context-map.svg', sanitizeAndVerifySvgExport(exportDddContextMapSvg(dddContextMapLinks)).svg, 'image/svg+xml'));
        $('#ddd-export-mermaid').onclick = () => downloadFile('nexoshop-context-map.mmd', exportDddContextMapMermaid(dddContextMapLinks), 'text/plain');
        $('#ddd-export-md').onclick = () => downloadFile('nexoshop-ddd-workshop.md', exportDddWorkshopMarkdown({
            selectedTerm: dddSelectedTerm,
            contextMap: dddContextMapLinks,
            aggregateDesign: syncDddSelectionsFromDom(),
        }), 'text/markdown');
    };
    paintDdd();
}
function initDistributedSimLab() {
    $('#retry-rate').oninput = () => {
        $('#retry-value').textContent = `${$('#retry-rate').value}%`;
    };
    $('#run-sim').onclick = () => {
        const retry = Number($('#retry-rate').value);
        const dedupe = $('#retry-strategy').value === 'dedupe';
        const duplicates = Math.round((SIMULATED_OPERATIONS_COUNT * retry) / 100);
        $('#lab-result').innerHTML = `<div class="sim-result"><div><b>1.000</b><span>operaciones originales</span></div><div><b>${duplicates}</b><span>entregas repetidas (modelo)</span></div><div><b>${dedupe ? 0 : duplicates}</b><span>efectos duplicados</span></div></div><div class="feedback ${dedupe ? 'good' : 'bad'}"><strong>${dedupe ? '✓ La deduplicación evita efectos repetidos' : '⚠ Riesgo de efectos duplicados'}</strong><p>Modelo determinista de tasa de reintento; no simula red real, concurrencia, ventanas de carrera ni fallas de persistencia. Para producción también requiere unicidad atómica y recuperación tras fallos.</p></div>`;
    };
    const readDistInput = () => ({
        fault: $('#dist-fault-scenario').value,
        safeguards: {
            outboxEnabled: $('#dist-chk-outbox').checked,
            idempotentConsumerEnabled: $('#dist-chk-idempotency').checked,
            dlqEnabled: $('#dist-chk-dlq').checked,
            compensatingSagaEnabled: $('#dist-chk-saga').checked,
        },
    });
    document.querySelector('#dist-run-timeline')?.addEventListener('click', () => {
        const { fault, safeguards } = readDistInput();
        const sim = simulateDistributedEventTimeline(fault, safeguards);
        $('#dist-timeline-output').innerHTML = `<div class="feedback ${sim.consistent ? 'good' : 'bad'}">
      <strong>${esc(sim.verdict)}</strong>
      <ol class="hint-list mt-10">
        ${sim.steps.map((s) => `<li><code>${esc(s.timestamp)}</code> · <b>${esc(s.actor)}</b>: ${esc(s.detail)}</li>`).join('')}
      </ol>
    </div>`;
    });
    document.querySelector('#dist-export-md')?.addEventListener('click', () => {
        const { fault, safeguards } = readDistInput();
        downloadFile(`distributed-${fault}.md`, exportDistributedTimelineMarkdown(fault, safeguards), 'text/markdown');
    });
    bindCrossFaultSagaControls();
}
function initAdrLab() {
    const opt_sel = document.querySelector('#adr-selected-option');
    const title_el = document.querySelector('#adr-title');
    const ctx_el = document.querySelector('#adr-context');
    const dec_el = document.querySelector('#adr-decision');
    const trd_el = document.querySelector('#adr-tradeoff');
    const saved_adr = readAdrLabDraft();
    if (saved_adr) {
        selectedAdrOptionId = saved_adr.optionId;
        if (opt_sel)
            opt_sel.value = saved_adr.optionId;
        if (title_el && saved_adr.title)
            title_el.value = saved_adr.title;
        if (ctx_el && saved_adr.context)
            ctx_el.value = saved_adr.context;
        if (dec_el && saved_adr.decision)
            dec_el.value = saved_adr.decision;
        if (trd_el && saved_adr.tradeoff)
            trd_el.value = saved_adr.tradeoff;
    }
    const persistAdrDraft = () => {
        saveAdrLabDraft({
            optionId: selectedAdrOptionId,
            title: title_el?.value || '',
            context: ctx_el?.value || '',
            decision: dec_el?.value || '',
            tradeoff: trd_el?.value || '',
        });
    };
    if (opt_sel) {
        opt_sel.onchange = () => {
            selectedAdrOptionId = opt_sel.value;
            persistAdrDraft();
        };
    }
    [title_el, ctx_el, dec_el, trd_el].forEach((el) => {
        el?.addEventListener('input', persistAdrDraft);
    });
    const exportText = () => {
        const chosen_opt = ADR_OPTION_MATRIX.find((o) => o.id === selectedAdrOptionId) ?? ADR_OPTION_MATRIX[0];
        return [
            `# ${$('#adr-title').value}`,
            '',
            '## Estado',
            'Propuesto (REQUIRES_REVIEW)',
            '',
            '## Alternativa Priorizada en Matriz',
            `- **Opción:** ${chosen_opt.label}`,
            `- **Ajuste SLO:** ${chosen_opt.sloFit}/5 · **Eficiencia Coste:** ${chosen_opt.costEfficiency}/5 · **Reversibilidad:** ${chosen_opt.reversibility}/5`,
            `- **Riesgo principal:** ${chosen_opt.keyRisk}`,
            '',
            '## Contexto',
            $('#adr-context').value,
            '',
            '## Decisión',
            $('#adr-decision').value,
            '',
            '## Alternativas y consecuencias',
            $('#adr-tradeoff').value,
            '',
        ].join('\n');
    };
    $('#adr-check').onclick = () => {
        const diag = diagnoseAdrDraftFields({
            title: $('#adr-title').value,
            context: $('#adr-context').value,
            decision: $('#adr-decision').value,
            tradeoff: $('#adr-tradeoff').value,
        });
        $('#lab-result').innerHTML = `<div class="feedback ${diag.complete ? 'good' : 'bad'}">
      <b>${diag.complete ? '✓ Estructura mínima del ADR superada (REQUIRES_REVIEW)' : `↺ Faltan ${diag.failures.length} bloque(s) por completar`}</b>
      ${diag.complete
            ? '<p>Validación estructural superada; la pertinencia de supuestos, alternativas y riesgos requiere revisión humana.</p>'
            : diag.failures
                .map((f) => `<p>• <strong>${esc(f.fieldLabel)}</strong> (${f.currentLength}/${f.requiredLength} caracteres): ${esc(f.specificHint)}</p>`)
                .join('')}
    </div>`;
    };
    $('#adr-export').onclick = () => downloadFile('ADR-NexoShop.md', exportText(), 'text/markdown');
}
function seniorDashboardPage() {
    shell(renderSeniorDashboardHtml({
        missions,
        playbooks: SENIOR_PLAYBOOKS,
        savedMissions: state.missions,
        tierFilter: seniorTierFilter,
        searchQuery: seniorSearchQuery,
        heroSpriteHtml: renderArquiBotSprite('arquibot-senior', 148, '', assetsManifestLookup),
        cinemaHtml: renderArquiBotCinemaHtml(buildSeniorOverviewDeck(audioManifest), {
            compact: true,
            manifestLookup: assetsManifestLookup,
        }),
    }));
    document.querySelectorAll('[data-senior-tier]').forEach((btn) => {
        btn.onclick = () => {
            seniorTierFilter = (btn.dataset.seniorTier || 'ALL');
            seniorDashboardPage();
            document.querySelector(`[data-senior-tier="${seniorTierFilter}"]`)?.focus();
        };
    });
    const q_el = document.querySelector('#senior-search-query');
    if (q_el) {
        q_el.oninput = () => {
            const caret = q_el.selectionStart ?? q_el.value.length;
            seniorSearchQuery = q_el.value;
            seniorDashboardPage();
            const refreshed = document.querySelector('#senior-search-query');
            if (refreshed) {
                refreshed.focus();
                try {
                    refreshed.setSelectionRange(caret, caret);
                }
                catch {
                    /* ignore */
                }
            }
        };
    }
}
function missionPage(mission_id, explicit_seed) {
    const normalized_mission_id = mission_id.trim().toUpperCase();
    const mission = missions.find((x) => x.id === normalized_mission_id);
    if (!mission) {
        renderNotFoundView('Misión Senior');
        return;
    }
    const canonical_mission_id = mission.id;
    const idx = missions.findIndex((x) => x.id === canonical_mission_id);
    const saved = state.missions[canonical_mission_id];
    if (explicit_seed !== undefined) {
        currentSeed = sanitizeSeniorSeed(explicit_seed, saved?.seed ?? 0);
        lastMissionId = canonical_mission_id;
    }
    else if (lastMissionId !== canonical_mission_id) {
        currentSeed = saved?.seed ?? 0;
        lastMissionId = canonical_mission_id;
    }
    const scenario = scenarioFromSeed(canonical_mission_id, currentSeed);
    const exercise = missionChoices(canonical_mission_id, currentSeed, [...SENIOR_MISSION_DECISIONS[idx]]);
    const playbook = SENIOR_PLAYBOOKS[canonical_mission_id];
    const criteria_fp = computeCriteriaSnapshotFingerprint({
        missionId: canonical_mission_id,
        seed: currentSeed,
        traffic: scenario.traffic,
        availability: scenario.availability,
        team: scenario.team,
        budget: scenario.budget,
        failure: scenario.failure,
        requiredComponents: playbook?.required ?? ['Dominio aislado', 'Observabilidad'],
        diagnosisCorrect: exercise.correct,
        incidentCorrect: 0,
        targetCapacity: 0,
    });
    const mission_hints = [
        `Analiza el equilibrio entre ${scenario.traffic} y el objetivo ${scenario.availability} con un equipo de ${scenario.team}.`,
        `Decisión central de la misión: ${mission.decision}. Descarta atajos que eliminen telemetría o control de fallos.`,
        `En tu ADR cita al menos dos restricciones explícitas (ej. ${scenario.budget} o «${scenario.failure}») y la evidencia: ${mission.evidence}.`,
    ];
    shell(renderMissionBriefWorkspaceHtml({
        mission,
        totalMissionsCount: EXPECTED_SENIOR_MISSIONS_COUNT,
        activeSeed: currentSeed,
        savedSeed: saved?.seed,
        savedAdr: saved?.adr || '',
        criteriaFingerprint: criteria_fp,
        scenario,
        choices: exercise.options,
        hintDrawerHtml: renderHintDrawerHtml({
            idPrefix: 'mission-hint',
            hints: mission_hints,
            revealedCount: missionHintsRevealed[canonical_mission_id] ?? 0,
            manifestLookup: assetsManifestLookup,
        }),
        sideSpriteHtml: renderArquiBotSprite('arquibot-senior', 124, '', assetsManifestLookup),
        workshopCtaLabel: 'Abrir taller Senior (6 actividades + bonus) ↗',
        cinemaHtml: renderArquiBotCinemaHtml(buildSeniorMissionCinemaDeck(mission, playbook, audioManifest), {
            compact: true,
            manifestLookup: assetsManifestLookup,
        }),
    }));
    const hasUnsavedAdrChanges = () => {
        const current_adr = document.querySelector('#senior-adr')?.value.trim() || '';
        const persisted_adr = (saved?.adr || '').trim();
        return current_adr.length > 0 && current_adr !== persisted_adr;
    };
    const applyMissionSeed = (next_raw) => {
        if (hasUnsavedAdrChanges() &&
            !confirm('Cambiar la semilla descartará el borrador ADR no evaluado. ¿Continuar?')) {
            return;
        }
        currentSeed = sanitizeSeniorSeed(next_raw, currentSeed);
        lastMissionId = canonical_mission_id;
        missionPage(canonical_mission_id, currentSeed);
    };
    document.querySelector('#mission-apply-seed')?.addEventListener('click', () => {
        applyMissionSeed(document.querySelector('#mission-seed-input')?.value);
    });
    document.querySelector('#mission-next-seed')?.addEventListener('click', () => {
        applyMissionSeed(currentSeed + 1);
    });
    document.querySelector('#mission-restore-saved-seed')?.addEventListener('click', () => {
        if (saved)
            applyMissionSeed(saved.seed);
    });
    const m_hint_btn = document.querySelector('#mission-hint-next-btn');
    if (m_hint_btn) {
        m_hint_btn.onclick = () => {
            missionHintsRevealed[canonical_mission_id] = Math.min(3, (missionHintsRevealed[canonical_mission_id] ?? 0) + 1);
            missionPage(canonical_mission_id, currentSeed);
            document.querySelector('#mission-hint-next-btn')?.focus();
        };
    }
    let choice = saved?.seed === currentSeed ? saved.choice : -1;
    if (choice >= 0) {
        document.querySelector(`[data-senior-option="${choice}"]`)?.classList.add('selected');
    }
    document.querySelectorAll('[data-senior-option]').forEach((el) => {
        el.onclick = () => {
            choice = Number(el.dataset.seniorOption);
            document.querySelectorAll('[data-senior-option]').forEach((x) => {
                x.classList.toggle('selected', x === el);
            });
            $('#senior-feedback').innerHTML = `<div class="feedback ${choice === exercise.correct ? 'good' : 'bad'}"><b>${choice === exercise.correct ? '✓ Estrategia educativa recomendada' : '⚠ Esta opción requiere revisar sus riesgos'}</b><p>${esc(mission.decision)}. La recomendación depende de los supuestos: contrasta coste, fiabilidad y capacidad del equipo.</p></div>`;
        };
    });
    $('#refresh-case').onclick = () => {
        if ($('#senior-adr').value.trim() && !confirm('Cambiar el escenario descartará el borrador no guardado. ¿Continuar?')) {
            return;
        }
        applyMissionSeed(currentSeed + 1);
    };
    $('#evaluate-mission').onclick = () => {
        if (choice < 0) {
            toast('Selecciona primero una estrategia');
            return;
        }
        const adr = $('#senior-adr').value.trim();
        const result = evaluateMission(choice, exercise.correct, adr, scenario);
        const score = result.score;
        const checks = result.checks;
        $('#mission-score').innerHTML = `<div class="scorecard"><div class="score-big sr-score"><strong>${score}<small>/${SENIOR_FULL_SCORE}</small></strong><span>evaluación automática limitada · huella <code>${esc(criteria_fp)}</code></span></div>${checks.map((check) => `<p>${check.status === 'PASS' ? '✓' : check.status === 'REQUIRES_REVIEW' ? '◇' : '○'} ${check.name} · ${check.status} · ${check.points}/${check.max}</p>`).join('')}<p class="muted">El puntaje no certifica validez de diseño: las menciones textuales requieren revisión humana (REQUIRES_REVIEW).</p></div>${renderSeniorAlternativesComparisonHtml({
            heading: `${canonical_mission_id} · Seed ${currentSeed}`,
            choices: exercise.options,
            chosenIndex: choice,
            recommendedIndex: exercise.correct,
            justification: `${mission.decision} (${scenario.traffic}, SLO ${scenario.availability}, ${scenario.team}).`,
            antipatternWarning: playbook?.failureMode ?? 'Evitar decisiones sin métricas ni rollback.',
        })}${playbook
            ? renderSeniorReasonedSolutionGuideHtml({
                missionId: canonical_mission_id,
                missionTitle: mission.title,
                missionDecision: mission.decision,
                seed: currentSeed,
                traffic: scenario.traffic,
                availability: scenario.availability,
                team: scenario.team,
                budget: scenario.budget,
                failure: scenario.failure,
                playbook,
            })
            : ''}`;
        const was_awarded = state.missions[canonical_mission_id]?.awarded === true;
        const awarded = was_awarded || score === SENIOR_FULL_SCORE;
        state.missions[canonical_mission_id] = {
            score,
            seed: currentSeed,
            completedAt: new Date().toISOString(),
            choice,
            adr,
            awarded,
        };
        if (!was_awarded && awarded)
            state.xp += SENIOR_MISSION_XP_REWARD;
        saveProgress();
        toast(!was_awarded && awarded ? `Evidencia validada estructuralmente · +${SENIOR_MISSION_XP_REWARD} XP` : 'Evidencia guardada; revisa los controles pendientes');
    };
    $('#export-mission').onclick = () => {
        const adr = $('#senior-adr').value;
        downloadFile(`${canonical_mission_id}-ADR.md`, `# ${mission.id} — ${mission.title}\n\nSeed: ${currentSeed}\n\n## Contexto\n${mission.brief}\n\n## Restricciones\n- Tráfico: ${scenario.traffic}\n- SLO: ${scenario.availability}\n- Equipo: ${scenario.team}\n- Presupuesto: ${scenario.budget}\n- Incidente: ${scenario.failure}\n\n## ADR del estudiante\n${adr}\n\n> Requiere revisión humana para evaluar calidad técnica.\n`, 'text/markdown');
    };
}
function resourcesPage() {
    shell(renderResourcesHubHtml(resourcesFilter));
    const query_input = document.querySelector('#res-query');
    const cat_select = document.querySelector('#res-category');
    const reset_btn = document.querySelector('#res-reset');
    if (query_input) {
        query_input.oninput = () => {
            const caret = query_input.selectionStart ?? query_input.value.length;
            resourcesFilter = { ...resourcesFilter, query: query_input.value };
            resourcesPage();
            const refreshed = document.querySelector('#res-query');
            if (refreshed) {
                refreshed.focus();
                try {
                    refreshed.setSelectionRange(caret, caret);
                }
                catch {
                    /* ignore */
                }
            }
        };
    }
    if (cat_select) {
        cat_select.onchange = () => {
            resourcesFilter = { ...resourcesFilter, category: cat_select.value };
            resourcesPage();
        };
    }
    if (reset_btn) {
        reset_btn.onclick = () => {
            resourcesFilter = { query: '', category: 'ALL' };
            resourcesPage();
        };
    }
}
function patternDetailPage(pattern_id) {
    if (!findPatternById(pattern_id)) {
        renderNotFoundView('Patrón de diseño');
        return;
    }
    shell(renderPatternDetailHtml(pattern_id));
}
function adrLibraryPage() {
    shell(renderAdrLibraryHtml(selectedAdrTemplateId));
    document.querySelectorAll('[data-adr-tpl]').forEach((btn) => {
        btn.onclick = () => {
            selectedAdrTemplateId = btn.dataset.adrTpl || 'vigilio-canonical';
            adrLibraryPage();
        };
    });
    const dl_btn = document.querySelector('#download-adr-template');
    if (dl_btn) {
        dl_btn.onclick = () => {
            const tpl = ADR_TEMPLATES_LIBRARY.find((t) => t.id === selectedAdrTemplateId) ?? ADR_TEMPLATES_LIBRARY[0];
            downloadFile(`${tpl.id}-template.md`, tpl.markdownTemplate, 'text/markdown');
        };
    }
}
function buildBackupPayloadString() {
    return JSON.stringify({
        app: BACKUP_APP_ID,
        version: BACKUP_SCHEMA_VERSION,
        progress: state,
        seniorSuites: exportSeniorSuiteDrafts(missions.map((x) => x.id)),
        miniGames: loadMiniProgress(),
        projects: projectsState,
        settings: userSettings,
    }, null, 2);
}
async function importBackupFromFile(file) {
    if (file.size > MAX_BACKUP_FILE_BYTES)
        throw new Error('Archivo demasiado grande');
    const migrated = parseAndMigrateBackup(JSON.parse(await file.text()), {
        moduleIds: modules.map((x) => x.id),
        missionIds: missions.map((x) => x.id),
        miniGameIds: miniGames.map((x) => x.id),
        existingProjects: projectsState,
        existingSettings: userSettings,
    });
    const applied = applyMigratedBackupToStorage(localStorage, migrated);
    projectsState = migrated.projects ?? projectsState;
    userSettings = migrated.settings;
    classroomSidebarExpanded = userSettings.classroomSidebarOpen;
    state = migrated.progress;
    applyDocumentPreferences();
    saveProgress();
    return applied.restoredSuitesCount;
}
function getMiniGamesBestTotal() {
    const mini = loadMiniProgress();
    return miniGames.reduce((sum, g) => sum + (mini.best[g.id] || 0), 0);
}
function currentAchievements() {
    return computeAchievementsModel({
        modules,
        paths,
        completedModuleIds: state.done,
        awardedMissionIds: getAwardedMissionIds(),
        miniGamesBestTotal: getMiniGamesBestTotal(),
        completedProjectIds: getStructurallyCompletedProjectIds(projectsState),
        xp: state.xp,
    });
}
function achievementsPage() {
    const list = currentAchievements();
    shell(renderAchievementsPageHtml(list, state.xp, achievementsCategoryFilter));
    const filter_el = document.querySelector('#ach-category-filter');
    if (filter_el) {
        filter_el.onchange = () => {
            achievementsCategoryFilter = filter_el.value;
            achievementsPage();
        };
    }
    const export_btn = document.querySelector('#export-achievements-md');
    if (export_btn) {
        export_btn.onclick = () => {
            downloadFile('arqpixel-logros.md', exportAchievementsMarkdown(list, state.xp), 'text/markdown');
        };
    }
}
function collectStorageDiagnostics() {
    const measureKey = (key) => {
        try {
            const val = localStorage.getItem(key);
            return val ? (key.length + val.length) * 2 : 0;
        }
        catch {
            return 0;
        }
    };
    let senior_count = 0;
    let senior_bytes = 0;
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('arqpixel-senior-suite-')) {
                senior_count++;
                senior_bytes += measureKey(k);
            }
        }
    }
    catch {
        /* ignore */
    }
    return [
        { keyGroup: 'Progreso principal (arqpixel-progress-v1)', itemCount: localStorage.getItem(STORAGE_KEY) ? 1 : 0, approxBytes: measureKey(STORAGE_KEY) },
        { keyGroup: 'Talleres Senior por semilla', itemCount: senior_count, approxBytes: senior_bytes },
        { keyGroup: 'Minijuegos (arqpixel-minigames-v1)', itemCount: localStorage.getItem(MINI_STORAGE_KEY) ? 1 : 0, approxBytes: measureKey(MINI_STORAGE_KEY) },
        { keyGroup: 'Proyectos Capstone (arqpixel-projects-v1)', itemCount: localStorage.getItem(PROJECTS_STORAGE_KEY) ? 1 : 0, approxBytes: measureKey(PROJECTS_STORAGE_KEY) },
        { keyGroup: 'Ajustes de accesibilidad (arqpixel-settings-v1)', itemCount: localStorage.getItem(SETTINGS_STORAGE_KEY) ? 1 : 0, approxBytes: measureKey(SETTINGS_STORAGE_KEY) },
    ];
}
function settingsPage() {
    shell(renderSettingsPageHtml(userSettings, collectStorageDiagnostics()));
    const theme_sel = document.querySelector('#set-theme-mode');
    const font_sel = document.querySelector('#set-font-scale');
    const motion_chk = document.querySelector('#set-reduced-motion');
    const sidebar_chk = document.querySelector('#set-classroom-sidebar');
    const fb = document.querySelector('#settings-feedback');
    const persistPrefs = (msg) => {
        const mode = (theme_sel?.value || userSettings.themeMode);
        const scale = (font_sel?.value || userSettings.fontScale);
        const reduced = Boolean(motion_chk?.checked);
        const open_sidebar = Boolean(sidebar_chk?.checked);
        state.theme = resolveEffectiveTheme(mode);
        classroomSidebarExpanded = open_sidebar;
        saveUserSettings({
            themeMode: mode,
            fontScale: scale,
            reducedMotion: reduced,
            classroomSidebarOpen: open_sidebar,
        });
        saveProgress();
        if (fb)
            fb.textContent = msg;
    };
    if (theme_sel)
        theme_sel.onchange = () => { persistPrefs('Modo de color y contraste actualizado.'); settingsPage(); };
    if (font_sel)
        font_sel.onchange = () => persistPrefs('Escala tipográfica actualizada.');
    if (motion_chk)
        motion_chk.onchange = () => persistPrefs('Preferencia de movimiento actualizada.');
    if (sidebar_chk)
        sidebar_chk.onchange = () => persistPrefs('Preferencia del índice del aula actualizada.');
    const exp_btn = document.querySelector('#settings-export-backup');
    if (exp_btn) {
        exp_btn.onclick = () => downloadFile('arqpixel-progreso.json', buildBackupPayloadString(), 'application/json');
    }
    const imp_input = document.querySelector('#settings-import-backup');
    if (imp_input) {
        imp_input.onchange = async (event) => {
            const file = event.target.files?.[0];
            if (!file)
                return;
            try {
                const restored = await importBackupFromFile(file);
                settingsPage();
                toast(`Respaldo restaurado · ${restored} talleres Senior cargados`);
            }
            catch (err) {
                if (fb)
                    fb.textContent = `No se pudo importar: ${err.message}`;
            }
        };
    }
    document.querySelector('#clear-single-senior-btn')?.addEventListener('click', () => {
        const sel = document.querySelector('#clear-single-senior-select');
        const target_mission = sel?.value || 'S01';
        if (confirm(`¿Eliminar únicamente los borradores locales de la misión ${target_mission}? Las otras 17 misiones y tu XP se conservarán.`)) {
            const removed = clearSeniorSuiteDrafts([target_mission]);
            settingsPage();
            toast(`Misión ${target_mission}: ${removed} borrador(es) eliminado(s)`);
        }
    });
    document.querySelector('#clear-only-senior')?.addEventListener('click', () => {
        if (confirm('¿Eliminar únicamente los borradores de talleres Senior? Tu XP y lecciones se conservarán.')) {
            clearSeniorSuiteDrafts(missions.map((x) => x.id));
            settingsPage();
            toast('Borradores Senior eliminados');
        }
    });
    document.querySelector('#clear-only-minigames')?.addEventListener('click', () => {
        if (confirm('¿Reiniciar únicamente las puntuaciones de los cinco minijuegos?')) {
            localStorage.removeItem(MINI_STORAGE_KEY);
            settingsPage();
            toast('Puntuaciones de minijuegos reiniciadas');
        }
    });
    document.querySelector('#clear-only-projects')?.addEventListener('click', () => {
        if (confirm('¿Eliminar únicamente los borradores de Proyectos Capstone?')) {
            localStorage.removeItem(PROJECTS_STORAGE_KEY);
            projectsState = {};
            settingsPage();
            toast('Borradores de proyectos eliminados');
        }
    });
    document.querySelector('#clear-all-arqpixel')?.addEventListener('click', () => {
        if (confirm('¿Eliminar definitivamente todo el progreso y borradores locales de ARQPIXEL?')) {
            clearSeniorSuiteDrafts(missions.map((x) => x.id));
            localStorage.removeItem(MINI_STORAGE_KEY);
            localStorage.removeItem(PROJECTS_STORAGE_KEY);
            localStorage.removeItem(SETTINGS_STORAGE_KEY);
            projectsState = {};
            state = initialProgress();
            userSettings = defaultUserSettings('dark');
            saveProgress();
            settingsPage();
            toast('Datos de ARQPIXEL restablecidos');
        }
    });
}
function aboutPage() {
    shell(renderAboutPageHtml());
}
function profilePage() {
    shell(renderProfileOverviewHtml({
        xp: state.xp,
        finishedModulesCount: state.done.length,
        expectedModulesCount: EXPECTED_MODULES_COUNT,
        missionAttemptsCount: Object.keys(state.missions).length,
        achievements: currentAchievements(),
        miniGamesBestTotal: getMiniGamesBestTotal(),
        completedProjectsCount: getStructurallyCompletedProjectIds(projectsState).length,
        totalProjectsCount: CAPSTONE_PROJECTS.length,
        manifestLookup: assetsManifestLookup,
    }));
    $('#export-progress').onclick = () => downloadFile('arqpixel-progreso.json', buildBackupPayloadString(), 'application/json');
    $('#import-progress').onchange = async (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        try {
            const restored = await importBackupFromFile(file);
            render();
            const msg = `Progreso importado · ${restored} talleres Senior restaurados`;
            const fb = document.querySelector('#profile-feedback');
            if (fb)
                fb.textContent = msg;
            toast(msg);
        }
        catch (err) {
            $('#profile-feedback').textContent = 'No se pudo importar: ' + err.message;
        }
    };
    $('#reset-progress').onclick = () => {
        if (confirm('¿Eliminar definitivamente el progreso local de ARQPIXEL?')) {
            clearSeniorSuiteDrafts(missions.map((x) => x.id));
            localStorage.removeItem(MINI_STORAGE_KEY);
            localStorage.removeItem(PROJECTS_STORAGE_KEY);
            localStorage.removeItem(SETTINGS_STORAGE_KEY);
            projectsState = {};
            state = initialProgress();
            userSettings = defaultUserSettings('dark');
            classroomSidebarExpanded = false;
            saveProgress();
            render();
        }
    };
}
let toastTimeout;
function toast(message) {
    let el = document.querySelector('#toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'toast';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        document.body.append(el);
    }
    el.innerHTML = `<span>${esc(message)}</span><button type="button" class="toast-close-btn" aria-label="Cerrar notificación">×</button>`;
    el.querySelector('.toast-close-btn')?.addEventListener('click', () => {
        clearTimeout(toastTimeout);
        el?.classList.remove('show');
    });
    el.classList.add('show');
    announceToLiveRegion(message);
    clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => el?.classList.remove('show'), TOAST_DURATION_MS);
}
let lastRenderedRoutePath = '';
function render() {
    const raw_hash = (location.hash.replace(/^#\/?/, '') || 'inicio').replace(/\/$/, '');
    const [path_part, query_string = ''] = raw_hash.split('?');
    const next_route = path_part || 'inicio';
    const route_changed = next_route !== lastRenderedRoutePath;
    route = next_route;
    lastRenderedRoutePath = next_route;
    if (route_changed) {
        window.scrollTo(0, 0);
    }
    const [base, second, third] = route.split('/');
    const params = new URLSearchParams(query_string);
    if (base === 'inicio')
        homePage();
    else if (base === 'mapa')
        curriculumMapPage();
    else if (base === 'rutas') {
        if (second)
            specializationDetailPage(second);
        else
            tracksPage();
    }
    else if (base === 'especializaciones') {
        if (second)
            specializationDetailPage(second);
        else
            specializationPage();
    }
    else if (base === 'modulo' || base === 'aprender') {
        modulePage(second || 'B01', params.get('senior') === '1', base === 'aprender' ? 'aprender' : 'modulo');
    }
    else if (base === 'proyectos') {
        if (second)
            projectWorkspacePage(second);
        else
            projectsCatalogPage();
    }
    else if (base === 'laboratorios')
        labsPage();
    else if (base === 'minijuegos')
        miniGamesPage();
    else if (base === 'minijuego')
        miniGamePage(second || 'tetris');
    else if (base === 'laboratorio')
        studioPage(second || 'dependencias');
    else if (base === 'senior')
        seniorDashboardPage();
    else if (base === 'mision') {
        const query_seed = params.has('seed') ? sanitizeSeniorSeed(params.get('seed'), 0) : undefined;
        missionPage(second || 'S01', query_seed);
    }
    else if (base === 'taller-senior') {
        const normalized_suite_id = (second || 'S01').trim().toUpperCase();
        const mission = missions.find((x) => x.id === normalized_suite_id);
        if (mission) {
            const suite_cinema_html = renderArquiBotCinemaHtml(buildSeniorMissionCinemaDeck(mission, SENIOR_PLAYBOOKS[mission.id], audioManifest), {
                compact: true,
                manifestLookup: assetsManifestLookup,
            });
            shell(`<div class="cinema-suite-slot">${suite_cinema_html}</div><div id="senior-suite"></div>`);
            const saved = state.missions[mission.id];
            const active_seed = params.has('seed')
                ? sanitizeSeniorSeed(params.get('seed'), 0)
                : lastMissionId === mission.id
                    ? currentSeed
                    : saved?.seed ?? 0;
            currentSeed = active_seed;
            lastMissionId = mission.id;
            mountSeniorSuite(mission, active_seed, (result, draft) => {
                if (!result.complete)
                    return;
                const previous = state.missions[mission.id];
                const is_new_award = !previous?.awarded;
                state.missions[mission.id] = {
                    score: result.score,
                    seed: active_seed,
                    completedAt: new Date().toISOString(),
                    choice: draft.diagnosis,
                    adr: draft.decision,
                    awarded: true,
                };
                if (is_new_award)
                    state.xp += SENIOR_MISSION_XP_REWARD;
                saveProgress();
                toast(is_new_award ? `Taller Senior registrado · +${SENIOR_MISSION_XP_REWARD} XP` : 'Taller Senior actualizado');
            }, {
                savedSeed: saved?.seed,
                onSeedChange: (next_seed) => {
                    currentSeed = next_seed;
                    lastMissionId = mission.id;
                    location.hash = `#/taller-senior/${mission.id}?seed=${next_seed}`;
                },
            });
        }
        else {
            renderNotFoundView('Taller Senior');
        }
    }
    else if (base === 'recursos') {
        if (second === 'patrones')
            patternDetailPage(third || 'strategy');
        else if (second === 'adr')
            adrLibraryPage();
        else if (!second)
            resourcesPage();
        else
            renderNotFoundView('Recurso');
    }
    else if (base === 'logros')
        achievementsPage();
    else if (base === 'ajustes')
        settingsPage();
    else if (base === 'sobre')
        aboutPage();
    else if (base === 'perfil')
        profilePage();
    else
        renderNotFoundView('Ruta');
    document.querySelectorAll('[data-go]').forEach((el) => {
        el.onclick = () => goto(el.dataset.go || '');
    });
    if (base === 'aprender' || base === 'modulo') {
        const mod = modules.find((m) => m.id === (second || 'B01').toUpperCase());
        if (mod) {
            recordLastVisitedRoute({
                href: `#/aprender/${mod.id}${params.get('senior') === '1' ? '?senior=1' : ''}`,
                category: `Lección ${mod.id}`,
                title: mod.title,
            });
        }
    }
    else if (base === 'taller-senior' || base === 'mision') {
        const m = missions.find((x) => x.id === (second || 'S01').toUpperCase());
        if (m) {
            recordLastVisitedRoute({
                href: `#/${base}/${m.id}?seed=${currentSeed}`,
                category: `Senior ${m.id} (Seed ${currentSeed})`,
                title: m.title,
            });
        }
    }
    else if (base === 'laboratorio') {
        const lab = LAB_STUDIOS.find((l) => l.id === (second || 'dependencias'));
        if (lab) {
            recordLastVisitedRoute({
                href: `#/laboratorio/${lab.id}`,
                category: 'Laboratorio',
                title: lab.title,
            });
        }
    }
    else if (base === 'proyectos' && second) {
        const proj = CAPSTONE_PROJECTS.find((p) => p.id === second.toUpperCase());
        if (proj) {
            recordLastVisitedRoute({
                href: `#/proyectos/${proj.id}`,
                category: `Capstone ${proj.id}`,
                title: proj.title,
            });
        }
    }
    else if (base === 'minijuego' && second) {
        const mg = miniGames.find((g) => g.id === second);
        if (mg) {
            recordLastVisitedRoute({
                href: `#/minijuego/${mg.id}`,
                category: 'Arena 3D',
                title: mg.title,
            });
        }
    }
    document.title = `${route === 'inicio' ? 'Inicio' : route.split('/')[0]} · ARQPIXEL Academy`;
}
async function boot() {
    try {
        applyDocumentPreferences();
        const [mRes, sRes, dRes, lRes, pRes, gRes, aRes, audioRes] = await Promise.all([
            fetch('./data/modules.json'),
            fetch('./data/senior.json'),
            fetch('./data/deep-dives.json'),
            fetch('./data/lab-cases.json'),
            fetch('./data/paths.json'),
            fetch('./data/mini-games.json'),
            fetch('./data/assets-manifest.json'),
            fetch('./data/audio-manifest.json'),
        ]);
        if (!mRes.ok ||
            !sRes.ok ||
            !dRes.ok ||
            !lRes.ok ||
            !pRes.ok ||
            !gRes.ok ||
            !aRes.ok ||
            !audioRes.ok) {
            throw new Error('Faltan catálogos');
        }
        const [rawModules, rawSenior, rawDeep, rawLabs, rawPaths, rawGames, rawAssets, rawAudioManifest,] = await Promise.all([
            mRes.json(),
            sRes.json(),
            dRes.json(),
            lRes.json(),
            pRes.json(),
            gRes.json(),
            aRes.json(),
            audioRes.json(),
        ]);
        modules = mergeValidatedCurriculum(rawModules, rawDeep);
        missions = missionsCatalogSchema.parse(rawSenior, 'senior.json');
        paths = learningPathsCatalogSchema.parse(rawPaths, 'paths.json');
        labCases = labCasesCatalogSchema.parse(rawLabs, 'lab-cases.json');
        miniGames = validateMiniCatalog(rawGames);
        const validated_assets = assetsManifestCatalogSchema.parse(rawAssets, 'assets-manifest.json');
        assetsManifestLookup = new Map(validated_assets.map((item) => [item.id, item]));
        audioManifest = audioManifestCatalogSchema.parse(rawAudioManifest, 'audio-manifest.json');
        globalSearchIndex = buildGlobalSearchIndex({
            modules,
            missions,
            paths,
            labs: LAB_STUDIOS,
            miniGames,
        });
        const sanitized = sanitizeProgress(state, modules.map((x) => x.id), missions.map((x) => x.id));
        state = sanitized || initialProgress();
        if (modules.length !== EXPECTED_MODULES_COUNT ||
            missions.length !== EXPECTED_SENIOR_MISSIONS_COUNT ||
            paths.length !== EXPECTED_PATHS_COUNT) {
            throw new Error('Catálogo incompleto');
        }
        void 'Idempotencia';
        window.addEventListener('online', () => {
            isOfflineMode = false;
            render();
        });
        window.addEventListener('offline', () => {
            isOfflineMode = true;
            render();
        });
        window.addEventListener('keydown', (event) => {
            const in_editable_field = event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement ||
                event.target instanceof HTMLSelectElement ||
                (event.target instanceof HTMLElement && event.target.isContentEditable);
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                if (shortcutsModalOpen)
                    closeShortcutsModal(false);
                if (searchCommandOpen)
                    closeSearchCommand(true);
                else
                    openSearchCommand();
            }
            else if (event.key === '?' && !in_editable_field && !event.ctrlKey && !event.metaKey) {
                event.preventDefault();
                if (searchCommandOpen)
                    closeSearchCommand(false);
                if (shortcutsModalOpen)
                    closeShortcutsModal(true);
                else
                    openShortcutsModal();
            }
            else if (event.key === 'Escape' && shortcutsModalOpen) {
                event.preventDefault();
                closeShortcutsModal(true);
            }
            else if (event.key === 'Escape' && searchCommandOpen) {
                event.preventDefault();
                closeSearchCommand(true);
            }
            else if (event.key === 'Escape' && document.querySelector('#primary-sidebar.open')) {
                event.preventDefault();
                document.querySelector('#primary-sidebar')?.classList.remove('open');
                const menu_btn = document.querySelector('#mobile-menu');
                if (menu_btn) {
                    menu_btn.setAttribute('aria-expanded', 'false');
                    menu_btn.focus();
                }
            }
            else if (route.startsWith('minijuego/') &&
                !searchCommandOpen &&
                !shortcutsModalOpen &&
                ['1', '2', '3', '4'].includes(event.key) &&
                !in_editable_field) {
                const idx = Number(event.key) - 1;
                const btn = document.querySelector(`[data-mini-answer="${idx}"]:not([disabled])`);
                if (btn) {
                    event.preventDefault();
                    btn.click();
                }
            }
        });
        window.addEventListener('hashchange', render);
        render();
    }
    catch (err) {
        $('#app').innerHTML = `<div class="fatal"><h1>No se pudo iniciar ARQPIXEL</h1><p>${esc(err.message)}. Debes ejecutar la aplicación mediante un servidor local (no con file://).</p><code>python3 -m http.server 4173 --directory dist</code></div>`;
    }
}
void boot();
