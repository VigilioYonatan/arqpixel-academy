import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { evaluateMission, scenarioFromSeed } from '../dist/engine.js';
import { MODULE_CANONICAL_REFERENCES } from '../dist/features/curriculum/constants/curriculum.constants.js';
import { renderLessonClassroomHtml } from '../dist/features/curriculum/lesson-classroom.js';
import {
  learningPathsCatalogSchema,
  mergeValidatedCurriculum,
} from '../dist/features/curriculum/schemas/curriculum.schema.js';
import { renderMinigamesCatalogHtml } from '../dist/features/minigames/three-arcade-stage.js';
import {
  renderAboutPageHtml,
  renderProfileOverviewHtml,
  renderSettingsPageHtml,
} from '../dist/features/profile/profile-views.js';
import { defaultUserSettings } from '../dist/features/profile/schemas/settings.schema.js';
import { CAPSTONE_PROJECTS } from '../dist/features/projects/constants/projects.constants.js';
import { evaluateProjectSubmission } from '../dist/features/projects/projects-workspace.js';
import { emptyProjectSubmission } from '../dist/features/projects/schemas/projects.schema.js';
import { renderResourcesHubHtml } from '../dist/features/resources/resources-hub.js';
import { missionsCatalogSchema } from '../dist/features/senior/schemas/senior.schema.js';
import { renderSeniorReasonedSolutionGuideHtml } from '../dist/features/senior/senior-ux-views.js';
import { parseAndMigrateBackup } from '../dist/features/shared/backup-migrator.js';
import {
  renderHomeEditorialShowcaseHtml,
  renderPixelNavIconSvg,
} from '../dist/features/shared/ui/visual-clarity.js';
import { evaluateSeniorReflection } from '../dist/lesson-senior.js';
import {
  SENIOR_PLAYBOOKS,
  emptySeniorDraft,
  evaluateSeniorSuite,
  missionPolicy,
} from '../dist/senior-suite.js';
import { auditCurriculumAndSeniorDod } from '../scripts/check-dod-manifest.mjs';

describe('Feature: §21.4, §21.5, §23 & §25 — Complete DoD Manifest, Reasoned Guide, Settings & Release Gates', () => {
  it('Scenario: Given all 36 modules and 18 Senior missions, When auditCurriculumAndSeniorDod runs, Then 54/54 pass every DoD invariant with 0 unverified items (§23 L2676–L2694, §25 L2731)', () => {
    const report = auditCurriculumAndSeniorDod();
    assert.equal(report.ok, true, `Issues found: ${report.issues.join(' | ')}`);
    assert.equal(report.implementedModulesCount, 36);
    assert.equal(report.implementedMissionsCount, 18);
    assert.equal(report.unverifiedCount, 0);
  });

  it('Scenario: Given every qualitative evaluator across lessons, Senior missions and Capstones, When evaluated, Then open reasoning preserves REQUIRES_REVIEW and never marks AI approval (§21.4 L2613–L2614)', () => {
    const raw_modules = JSON.parse(readFileSync('data/modules.json', 'utf8'));
    const raw_deep = JSON.parse(readFileSync('data/deep-dives.json', 'utf8'));
    const modules = mergeValidatedCurriculum(raw_modules, raw_deep);
    const missions = missionsCatalogSchema.parse(
      JSON.parse(readFileSync('data/senior.json', 'utf8')),
      'senior.json',
    );

    const mod_i01 = modules.find((m) => m.id === 'I01');
    const refl = evaluateSeniorReflection(
      'Aplicamos inversión de dependencias, puertos explícitos, pruebas unitarias aisladas y evaluamos el trade-off de complejidad.',
      mod_i01,
    );
    assert.ok(refl.checks.some((c) => c.status === 'REQUIRES_REVIEW'));

    const s09 = missions.find((m) => m.id === 'S09');
    const scen = scenarioFromSeed('S09', 42);
    const mis_eval = evaluateMission(
      0,
      0,
      `Con ${scen.traffic} y ${scen.availability}, adoptamos Outbox + Idempotencia evaluando alternativas, riesgo y prueba de verificación.`,
      scen,
    );
    assert.ok(mis_eval.checks.some((c) => c.status === 'REQUIRES_REVIEW'));

    const empty_suite = evaluateSeniorSuite(s09, 42, emptySeniorDraft());
    assert.ok(empty_suite.canonicalGates.some((g) => g.status === 'BLOCKED'));

    const pol = missionPolicy(s09, 42);
    const req0 = pol.scenario.requirements[0].split(': ')[1];
    const req1 = pol.scenario.requirements[1].split(': ')[1];
    const suite_eval = evaluateSeniorSuite(s09, 42, {
      ...emptySeniorDraft(),
      decision:
        `Con ${req0} y ${req1}, adoptamos ${pol.required.join(' + ')} evaluando una alternativa descartada por mayor riesgo y coste operativo, ` +
        `y verificaremos con pruebas de integración y SLO.`,
    });
    assert.ok(suite_eval.canonicalGates.some((g) => g.status === 'REQUIRES_REVIEW'));

    const cap_eval = evaluateProjectSubmission(CAPSTONE_PROJECTS[0], emptyProjectSubmission());
    assert.equal(cap_eval.humanReviewRequired, true);
    assert.ok(cap_eval.checks.some((c) => c.status === 'REQUIRES_REVIEW'));

    const combined = JSON.stringify({ refl, mis_eval, suite_eval }).toLowerCase();
    assert.equal(combined.includes('ai_approved'), false);

    const guide = renderSeniorReasonedSolutionGuideHtml({
      missionId: s09.id,
      missionTitle: s09.title,
      missionDecision: s09.decision,
      seed: 42,
      traffic: pol.scenario.traffic,
      availability: pol.scenario.availability,
      team: pol.scenario.team,
      budget: pol.scenario.budget,
      failure: pol.scenario.failure,
      playbook: SENIOR_PLAYBOOKS.S09,
      targetCapacityRpm: pol.targetCapacity,
    });
    assert.ok(guide.includes('data-senior-solution-guide="true"'));
    assert.ok(guide.includes('data-no-ai-approval="true"'));
    assert.ok(guide.includes('REQUIRES_REVIEW'));
  });

  it('Scenario: Given every curriculum module B01–A12, When rendered in the classroom, Then canonical bibliographic references and attributions are displayed (§23 L2682)', () => {
    const raw_modules = JSON.parse(readFileSync('data/modules.json', 'utf8'));
    const raw_deep = JSON.parse(readFileSync('data/deep-dives.json', 'utf8'));
    const modules = mergeValidatedCurriculum(raw_modules, raw_deep);
    assert.equal(Object.keys(MODULE_CANONICAL_REFERENCES).length, 36);

    const html = renderLessonClassroomHtml({
      currentModule: modules[3], // B04 C4 Model
      allModules: modules,
      completedModuleIds: [],
      selectedAnswer: undefined,
      savedNote: '',
      seniorModeActive: false,
      sidebarExpanded: false,
      sidebarQuery: '',
      routePrefix: 'aprender',
    });
    assert.ok(html.includes('data-module-references="true"'));
    assert.ok(html.includes('Simon Brown'));
    assert.equal(/\bstyle\s*=\s*["']/.test(html), false);
  });

  it('Scenario: Given backup payloads across versions, When migrated or validated, Then v1.2 migrates cleanly to v2.0 and unsupported/corrupt schemas reject fail-closed (§21.5 L2619, L2621)', () => {
    const ctx = {
      moduleIds: ['B01', 'B02'],
      missionIds: ['S01', 'S09'],
      miniGameIds: ['tetris', 'solid'],
      existingProjects: {},
      existingSettings: defaultUserSettings('dark'),
    };

    const migrated = parseAndMigrateBackup(
      {
        app: 'ARQPIXEL',
        version: 1,
        progress: {
          done: ['B01'],
          xp: 99999,
          answers: { B01: 0 },
          notes: { B01: 'Nota migrada' },
          missions: {},
          seniorMode: false,
          theme: 'dark',
          lastVisit: '2026-01-01T00:00:00.000Z',
        },
      },
      ctx,
    );
    assert.equal(migrated.detectedEra, 'v1.x-envelope');
    assert.equal(migrated.schemaVersion, 1);
    assert.deepEqual(migrated.progress.done, ['B01']);
    assert.equal(migrated.progress.xp < 99999, true);

    assert.throws(() => parseAndMigrateBackup({ app: 'ARQPIXEL', version: 99, progress: {} }, ctx));
    assert.throws(() => parseAndMigrateBackup({ app: 'OTHER', version: 2, progress: {} }, ctx));
  });

  it('Scenario: Given #/sobre, #/ajustes, #/perfil, #/recursos and #/minijuegos views, When rendered, Then licenses (Three.js MIT + TypeScript Apache-2.0), privacy, terms and dynamic SVG telemetry render with zero inline styles (§25 L2738)', () => {
    const about = renderAboutPageHtml();
    assert.ok(about.includes('data-privacy-policy="true"'));
    assert.ok(about.includes('data-licenses-table="true"'));
    assert.ok(about.includes('data-terms-of-use="true"'));
    assert.ok(about.includes('Three.js'));
    assert.ok(about.includes('0.187.0'));
    assert.ok(about.includes('Apache-2.0'));

    const settings = renderSettingsPageHtml(defaultUserSettings('dark'), [
      { keyGroup: 'arqpixel-progress-v1', itemCount: 1, approxBytes: 512 },
    ]);
    assert.ok(settings.includes('v2.0 (migra v1.2–v2.0)'));

    const profile = renderProfileOverviewHtml({
      xp: 250,
      finishedModulesCount: 2,
      expectedModulesCount: 36,
      missionAttemptsCount: 1,
      achievements: [],
      miniGamesBestTotal: 12,
      completedProjectsCount: 1,
      totalProjectsCount: 11,
    });
    assert.ok(profile.includes('arch-flow-edge'));

    const resources = renderResourcesHubHtml({ query: '', category: 'ALL' });
    assert.ok(resources.includes('FLUJO DE DECISIÓN ARQUITECTÓNICA'));

    const minigames = renderMinigamesCatalogHtml(
      [
        {
          id: 'tetris',
          icon: '▦',
          tag: 'CAPAS',
          title: 'Tetris de Capas',
          subtitle: 'Dependencias concéntricas',
          bestScore: 6,
          starsCount: 3,
        },
      ],
      6,
    );
    assert.ok(minigames.includes('Raycaster [A–D] + Órbita 360°'));

    for (const block of [about, settings, profile, resources, minigames]) {
      assert.equal(/\bstyle\s*=\s*["']/.test(block), false);
    }

    const raw_modules = JSON.parse(readFileSync('data/modules.json', 'utf8'));
    const raw_deep = JSON.parse(readFileSync('data/deep-dives.json', 'utf8'));
    const raw_paths = JSON.parse(readFileSync('data/paths.json', 'utf8'));
    const modules = mergeValidatedCurriculum(raw_modules, raw_deep);
    const paths = learningPathsCatalogSchema.parse(raw_paths, 'paths.json');
    const home_showcase = renderHomeEditorialShowcaseHtml({
      modules,
      paths,
      completedModuleIds: ['B01', 'B02'],
      attemptedMissionsCount: 3,
      expectedModulesCount: 36,
      expectedMissionsCount: 18,
      labsCount: 8,
      xp: 450,
      activeBlueprint: 'modular-monolith',
      nextModule: modules[2],
      seniorArtSpriteHtml: '<img src="./assets/arquibot/arquibot-senior.png" alt="ArquiBot Senior"/>',
      bottomIdeaSpriteHtml: '<img src="./assets/arquibot/arquibot-idea.png" alt="ArquiBot Idea"/>',
    });
    assert.ok(home_showcase.includes('arq-stats-strip'));
    assert.ok(home_showcase.includes('arq-level-cards'));
    assert.ok(home_showcase.includes('home-specs-strip'));
    assert.ok(home_showcase.includes('senior-feature-band'));
    assert.ok(home_showcase.includes('arq-bottom-cta'));
    assert.ok(home_showcase.includes('#/laboratorio/dependencias'));
    assert.equal(/\bstyle\s*=\s*["']/.test(home_showcase), false);
  });

  it('Scenario: Given Pixel Senior UX/UI system across all pages, When inspected, Then Silkscreen is self-hosted locally, 16x16 crispEdges SVG icons render with gold Senior crown, and stepped animations honor reduced-motion', () => {
    assert.equal(existsSync('dist/fonts/silkscreen-latin.woff2'), true);
    assert.equal(existsSync('dist/fonts/dm-sans-latin.woff2'), true);
    assert.equal(existsSync('dist/fonts/space-grotesk-latin.woff2'), true);
    assert.equal(existsSync('dist/fonts/jetbrains-mono-latin.woff2'), true);

    const css = readFileSync('dist/styles.css', 'utf8');
    const html = readFileSync('dist/index.html', 'utf8');
    assert.ok(css.includes("url('./fonts/silkscreen-latin.woff2')"));
    assert.equal(/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(css + html), false);
    assert.ok(css.includes('steps(2,end)'));
    assert.ok(css.includes('steps(4,end)'));
    assert.ok(css.includes('pixelBlink'));
    assert.ok(css.includes('[data-motion="reduced"]'));
    assert.ok(css.includes('[data-motion="reduce"]'));
    assert.ok(css.includes('prefers-reduced-motion:reduce'));

    const nav_ids = [
      'home',
      'map',
      'routes',
      'specs',
      'projects',
      'labs',
      'minigames',
      'senior',
      'library',
      'badges',
      'profile',
      'settings',
      'about',
    ];
    for (const id of nav_ids) {
      const svg = renderPixelNavIconSvg(id, 16);
      assert.ok(svg.includes('viewBox="0 0 16 16"'), `Missing 16x16 viewBox for ${id}`);
      assert.ok(svg.includes('shape-rendering="crispEdges"'), `Missing crispEdges for ${id}`);
      assert.ok(svg.includes('fill="currentColor"'), `Missing currentColor for ${id}`);
    }
    assert.ok(renderPixelNavIconSvg('senior', 16).includes('pixel-crown-gold'));
    assert.equal(renderPixelNavIconSvg('home', 16).includes('pixel-crown-gold'), false);
  });
});
