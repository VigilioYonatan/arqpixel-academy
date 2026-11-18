import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  C4_CONTEXTUAL_SCENARIOS,
  C4_LEVEL_PRESETS,
  evaluateC4ContextualScenario,
} from '../dist/c4-studio.js';
import { LESSON_WORKBENCH_BY_ID } from '../dist/features/curriculum/constants/lesson-workbench.constants.js';
import { renderLessonClassroomHtml } from '../dist/features/curriculum/lesson-classroom.js';
import {
  evaluateLessonWorkbench,
  getLessonWorkbench,
  renderLessonWorkbenchHtml,
} from '../dist/features/curriculum/lesson-workbench.js';
import { mergeValidatedCurriculum } from '../dist/features/curriculum/schemas/curriculum.schema.js';
import { LAB_STUDIOS } from '../dist/features/labs/constants/labs.constants.js';
import { CAPSTONE_PROJECTS } from '../dist/features/projects/constants/projects.constants.js';
import { PATTERN_CARDS } from '../dist/features/resources/constants/resources.constants.js';
import {
  renderBreadcrumbsNavHtml,
  renderNotFoundPageHtml,
  resolveBreadcrumbsTrail,
} from '../dist/features/shared/ui/navigation-and-404.js';
import { verifyToolchainAndLockfile } from '../scripts/check-toolchain-lockfile.mjs';

const rawModules = JSON.parse(readFileSync('data/modules.json', 'utf8'));
const rawDeep = JSON.parse(readFileSync('data/deep-dives.json', 'utf8'));
const missions = JSON.parse(readFileSync('data/senior.json', 'utf8'));
const paths = JSON.parse(readFileSync('data/paths.json', 'utf8'));
const miniGames = JSON.parse(readFileSync('data/mini-games.json', 'utf8'));
const modules = mergeValidatedCurriculum(rawModules, rawDeep);

const breadcrumbCtx = {
  moduleTitleById: new Map(modules.map((m) => [m.id, m.title])),
  moduleLevelById: new Map(modules.map((m) => [m.id, m.level])),
  pathTitleById: new Map(paths.map((p) => [p.id, p.title])),
  missionTitleById: new Map(missions.map((m) => [m.id, m.title])),
  projectTitleById: new Map(CAPSTONE_PROJECTS.map((p) => [p.id, p.title])),
  patternNameById: new Map(PATTERN_CARDS.map((p) => [p.id, p.name])),
  labTitleById: new Map(LAB_STUDIOS.map((l) => [l.id, l.title])),
  miniGameTitleById: new Map(miniGames.map((g) => [g.id, g.title])),
};

test('P1 L1240: ADR-0001 formaliza arquitectura modular DOM nativo + Hero CTA «Explorar la ruta» y nota contextual', () => {
  const adr0001 = readFileSync(
    'docs/adr/0001-arquitectura-frontend-modular-dom-estatico-offline.md',
    'utf8',
  );
  assert.match(adr0001, /Aprobado/);
  assert.match(adr0001, /Preact/);
  assert.match(adr0001, /Vite/);
  assert.match(adr0001, /DOM/);

  const appBundle = readFileSync('dist/app.js', 'utf8');
  assert.match(appBundle, /href="#\/mapa">Explorar la ruta/);
  assert.match(appBundle, /hero-arch-note/);
  assert.match(appBundle, /nunca como regla universal/);
});

test('P1 L1241 (BDD): las 36 lecciones (B01–A12) incluyen banco práctico multi-criterio (2/4) y barra de prerrequisitos no bloqueante', () => {
  assert.equal(LESSON_WORKBENCH_BY_ID.size, 36);

  for (const mod of modules) {
    const wb = getLessonWorkbench(mod.id);
    assert.ok(wb, `Falta banco práctico para ${mod.id}`);
    assert.equal(wb.options.length, 4, `${mod.id} debe ofrecer 4 opciones`);
    assert.equal(wb.requiredIndices.length, 2, `${mod.id} debe exigir exactamente 2 decisiones`);
    assert.notEqual(wb.requiredIndices[0], wb.requiredIndices[1]);
    assert.ok(wb.explanationPass.length >= 25);
    assert.ok(wb.explanationFail.length >= 25);

    // Scenario 1: Empty selection -> NOT_RUN
    const notRun = evaluateLessonWorkbench(mod.id, []);
    assert.equal(notRun.status, 'NOT_RUN');
    assert.equal(notRun.passed, false);

    // Scenario 2: Single option -> FAIL (incomplete)
    const singleFail = evaluateLessonWorkbench(mod.id, [wb.requiredIndices[0]]);
    assert.equal(singleFail.status, 'FAIL');
    assert.equal(singleFail.passed, false);

    // Scenario 3: Three options -> FAIL (over-selection / contradiction)
    const overFail = evaluateLessonWorkbench(mod.id, [0, 1, 2]);
    assert.equal(overFail.status, 'FAIL');
    assert.equal(overFail.passed, false);

    // Scenario 4: Wrong pair -> FAIL
    const wrongIndex = [0, 1, 2, 3].find((idx) => !wb.requiredIndices.includes(idx));
    const wrongPair = evaluateLessonWorkbench(mod.id, [wb.requiredIndices[0], wrongIndex]);
    assert.equal(wrongPair.status, 'FAIL');
    assert.equal(wrongPair.passed, false);

    // Scenario 5: Exact required pair (in any order + duplicate tolerance) -> PASS
    const passRes = evaluateLessonWorkbench(mod.id, [
      wb.requiredIndices[1],
      wb.requiredIndices[0],
      wb.requiredIndices[1],
    ]);
    assert.equal(passRes.status, 'PASS');
    assert.equal(passRes.passed, true);
  }

  // Classroom integration check on A05 (has prerequisites + runnable reference repo)
  const modA05 = modules.find((m) => m.id === 'A05');
  const htmlA05 = renderLessonClassroomHtml({
    currentModule: modA05,
    allModules: modules,
    completedModuleIds: ['I09'],
    selectedAnswer: undefined,
    savedNote: '',
    seniorModeActive: true,
    sidebarExpanded: false,
    sidebarQuery: '',
    routePrefix: 'aprender',
    workbenchChoices: [0, 1],
    workbenchEvaluated: true,
  });
  assert.match(htmlA05, /prereq-readiness-bar/);
  assert.match(htmlA05, /lesson-workbench-card/);
  assert.match(htmlA05, /NexoShop NestJS/);
  assert.match(htmlA05, /✓ PASS · Combinación arquitectónica coherente/);

  // Standalone workbench render check
  const wbHtml = renderLessonWorkbenchHtml('B01', [1], true);
  assert.match(wbHtml, /Seleccionaste 1 opción/);
});

test('P1 L1242 (BDD): C4 Studio evalúa escenarios contextuales (libre, hexagonal-s04, checkout-outbox-s09 y multitenant-s12)', () => {
  assert.equal(C4_CONTEXTUAL_SCENARIOS.length, 4);

  const c2Model = {
    kind: 'C4-containers-educational',
    system: 'NexoShop',
    level: 'C2',
    containers: C4_LEVEL_PRESETS.C2.containers,
    relations: C4_LEVEL_PRESETS.C2.relations,
  };
  const c3Model = {
    kind: 'C4-containers-educational',
    system: 'NexoShop',
    level: 'C3',
    containers: C4_LEVEL_PRESETS.C3.containers,
    relations: C4_LEVEL_PRESETS.C3.relations,
  };

  // libre on C2 preset -> PASS
  assert.equal(evaluateC4ContextualScenario(c2Model, 'libre').status, 'PASS');

  // checkout-outbox-s09 on C2 preset -> PASS (has API, Base de datos, Cola / Broker connected)
  const s09Pass = evaluateC4ContextualScenario(c2Model, 'checkout-outbox-s09');
  assert.equal(s09Pass.status, 'PASS');

  // hexagonal-s04 fails on C2, passes on C3 preset
  const s04FailOnC2 = evaluateC4ContextualScenario(c2Model, 'hexagonal-s04');
  assert.equal(s04FailOnC2.status, 'FAIL');
  assert.ok(s04FailOnC2.missingChecks.some((m) => m.includes('C3')));

  const s04PassOnC3 = evaluateC4ContextualScenario(c3Model, 'hexagonal-s04');
  assert.equal(s04PassOnC3.status, 'PASS');

  // multitenant-s12 passes on clean C2, fails when Frontend bypasses API straight to DB
  assert.equal(evaluateC4ContextualScenario(c2Model, 'multitenant-s12').status, 'PASS');

  const bypassModel = {
    ...c2Model,
    relations: [
      ...c2Model.relations,
      { from: 'frontend', to: 'bd-pedidos', label: 'SQL directo desde SPA' },
    ],
  };
  const s12Bypass = evaluateC4ContextualScenario(bypassModel, 'multitenant-s12');
  assert.equal(s12Bypass.status, 'FAIL');
  assert.ok(s12Bypass.missingChecks.some((m) => m.includes('conecta directo a')));
});

test('P1 L1243 (BDD): breadcrumbs jerárquicos clicables y vista 404 unificada accesible con escape XSS', () => {
  const trailLesson = resolveBreadcrumbsTrail('aprender/a05?senior=1', breadcrumbCtx);
  assert.equal(trailLesson.length, 4);
  assert.equal(trailLesson[0].href, '#/inicio');
  assert.equal(trailLesson[1].href, '#/rutas');
  assert.equal(trailLesson[3].current, true);
  assert.match(trailLesson[3].label, /^A05 · /);

  const navHtml = renderBreadcrumbsNavHtml(trailLesson);
  assert.match(navHtml, /<nav class="breadcrumbs" aria-label="Ruta de navegación">/);
  assert.match(navHtml, /aria-current="page"/);
  assert.match(navHtml, /href="#\/rutas"/);

  // Valid deep routes
  for (const validRoute of [
    'inicio',
    'mapa',
    'rutas/r06',
    'especializaciones/r02',
    'proyectos/cap-r06',
    'laboratorio/c4',
    'minijuego/tetris',
    'mision/s09',
    'taller-senior/s09',
    'recursos/patrones/strategy',
    'recursos/adr',
  ]) {
    const trail = resolveBreadcrumbsTrail(validRoute, breadcrumbCtx);
    assert.ok(
      !trail.at(-1).label.startsWith('404'),
      `Ruta válida ${validRoute} no debe marcar 404`,
    );
  }

  // Invalid routes & invalid entity IDs -> 404 trail
  for (const badRoute of [
    'aprender/Z99',
    'rutas/R99',
    'especializaciones/R99',
    'proyectos/CAP-99',
    'laboratorio/inexistente',
    'minijuego/inexistente',
    'mision/S99',
    'taller-senior/S99',
    'recursos/patrones/inexistente',
    'recursos/subruta-inexistente',
    'pantalla-inventada',
  ]) {
    const trail = resolveBreadcrumbsTrail(badRoute, breadcrumbCtx);
    assert.match(trail.at(-1).label, /^404 · /);
  }

  // Unified 404 HTML escapes XSS and offers recovery actions + Ctrl+K button
  const notFoundHtml = renderNotFoundPageHtml({
    requestedRoute: 'aprender/<img src=x onerror=alert(1)>',
    entityLabel: 'Módulo',
  });
  assert.match(notFoundHtml, /data-ui-state="error"/);
  assert.match(notFoundHtml, /id="not-found-open-search"/);
  assert.doesNotMatch(notFoundHtml, /<img src=x/);
  assert.match(notFoundHtml, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('P1 L1244: verificación determinista de pnpm-lock.yaml, package.json y compatibility.json (positivo y deriva)', () => {
  const realCheck = verifyToolchainAndLockfile(process.cwd());
  assert.equal(realCheck.ok, true, `Falló lockfile real: ${realCheck.errors.join('; ')}`);

  // Negative drift test in isolated temp directory
  const tempDir = mkdtempSync(join(tmpdir(), 'arqpixel-lock-test-'));
  try {
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify({
        packageManager: 'pnpm@12.14.0',
        devDependencies: {
          '@biomejs/biome': '^2.6.3',
          '@playwright/test': '1.64.1',
          '@axe-core/playwright': '4.12.1',
        },
      }),
    );
    writeFileSync(
      join(tempDir, 'compatibility.json'),
      readFileSync('compatibility.json', 'utf8'),
    );
    writeFileSync(join(tempDir, 'pnpm-lock.yaml'), "lockfileVersion: '9.0'\nimporters:\n  .:\n");

    const driftCheck = verifyToolchainAndLockfile(tempDir);
    assert.equal(driftCheck.ok, false);
    assert.ok(driftCheck.errors.length >= 2);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
