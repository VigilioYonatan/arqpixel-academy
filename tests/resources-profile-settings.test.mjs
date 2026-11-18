import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mergeValidatedCurriculum } from '../dist/features/curriculum/schemas/curriculum.schema.js';
import {
  ADR_TEMPLATES_LIBRARY,
  EXPANDED_GLOSSARY_TERMS,
  MANDATORY_COMPARISONS,
  PATTERN_CARDS,
} from '../dist/features/resources/constants/resources.constants.js';
import {
  filterResourcesHub,
  findPatternById,
  renderAdrLibraryHtml,
  renderPatternDetailHtml,
  renderResourcesHubHtml,
} from '../dist/features/resources/resources-hub.js';
import { ACHIEVEMENT_BLUEPRINTS } from '../dist/features/profile/constants/profile.constants.js';
import {
  defaultUserSettings,
  sanitizeUserSettings,
  userSettingsSchema,
} from '../dist/features/profile/schemas/settings.schema.js';
import {
  computeAchievementsModel,
  exportAchievementsMarkdown,
  renderAboutPageHtml,
  renderAchievementsPageHtml,
  renderSettingsPageHtml,
} from '../dist/features/profile/profile-views.js';
import { backupEnvelopeSchema } from '../dist/features/senior/schemas/senior.schema.js';

const rawModules = JSON.parse(readFileSync('data/modules.json', 'utf8'));
const rawDeep = JSON.parse(readFileSync('data/deep-dives.json', 'utf8'));
const missions = JSON.parse(readFileSync('data/senior.json', 'utf8'));
const paths = JSON.parse(readFileSync('data/paths.json', 'utf8'));
const modules = mergeValidatedCurriculum(rawModules, rawDeep);

test('ARQ-009: catálogo de 12 patrones, las 8 comparativas obligatorias (§17.4), plantillas ADR y glosario ampliado', () => {
  assert.equal(PATTERN_CARDS.length, 12);
  assert.equal(MANDATORY_COMPARISONS.length, 8);
  assert.equal(ADR_TEMPLATES_LIBRARY.length, 3);
  assert.ok(EXPANDED_GLOSSARY_TERMS.length >= 16);

  const validMods = new Set(modules.map((m) => m.id));
  const validMissions = new Set(missions.map((s) => s.id));

  for (const card of PATTERN_CARDS) {
    assert.ok(card.whenToUse.length >= 1 && card.whenNotToUse.length >= 1);
    assert.ok(card.goodExampleTs.length > 30 && card.badExampleTs.length > 30);
    assert.ok(card.relatedModules.every((id) => validMods.has(id)), `Módulo inválido en patrón ${card.id}`);
    assert.ok(card.relatedMissions.every((id) => validMissions.has(id)), `Misión inválida en patrón ${card.id}`);
  }

  const requiredTitles = [
    'Capas vs Clean vs Hexagonal',
    'Monolito modular vs microservicios',
    'REST vs gRPC vs eventos',
    'Repository vs acceso directo',
    'CQRS vs CRUD convencional',
    'Saga vs transacción local',
    'Caché vs DB indexada',
    'DDD táctico vs CRUD simple',
  ];
  for (const expectedTitle of requiredTitles) {
    assert.ok(
      MANDATORY_COMPARISONS.some((c) => c.title === expectedTitle),
      `Falta ficha comparativa obligatoria: ${expectedTitle}`,
    );
  }

  const filtered = filterResourcesHub({ query: 'outbox', category: 'Sistemas Distribuidos' });
  assert.ok(filtered.patterns.some((p) => p.id === 'transactional-outbox'));

  const hubHtml = renderResourcesHubHtml({ query: '<img src=x onerror=alert(1)>', category: 'ALL' });
  assert.equal(hubHtml.includes('<img src=x'), false);

  assert.ok(findPatternById('strategy'));
  assert.equal(findPatternById('no-existe'), undefined);
  assert.ok(renderPatternDetailHtml('strategy').includes('Contraste de código'));
  assert.ok(renderPatternDetailHtml('no-existe').includes('Ficha de patrón inexistente'));
  assert.ok(renderAdrLibraryHtml('madr-tradeoffs').includes('Drivers de Decisión'));
});

test('ARQ-010: cálculo transparente de 18 logros (incluyendo R01–R08), exportación Markdown y páginas Ajustes / Sobre accesibles', () => {
  assert.equal(ACHIEVEMENT_BLUEPRINTS.length, 18);

  const none = computeAchievementsModel({
    modules,
    paths,
    completedModuleIds: [],
    awardedMissionIds: [],
    miniGamesBestTotal: 0,
    completedProjectIds: [],
    xp: 0,
  });
  assert.equal(none.filter((a) => a.unlocked).length, 0);

  const full = computeAchievementsModel({
    modules,
    paths,
    completedModuleIds: modules.map((m) => m.id),
    awardedMissionIds: missions.map((s) => s.id),
    miniGamesBestTotal: 30,
    completedProjectIds: ['CAP-R01'],
    xp: 36 * 50 + 18 * 80,
  });
  assert.equal(full.filter((a) => a.unlocked).length, 18);
  assert.ok(full.some((a) => a.id === 'ACH-PATH-R08' && a.unlocked));

  const md = exportAchievementsMarkdown(full, 3240);
  assert.ok(md.includes('18 / 18'));
  assert.ok(md.includes('no constituye certificación profesional'));

  const achHtml = renderAchievementsPageHtml(full, 3240, 'Senior Mode');
  assert.ok(achHtml.includes('Guardián de Pagos y Capacidad'));

  // Settings schema & backward-compatible backup envelope
  const validSettings = {
    themeMode: 'high-contrast',
    reducedMotion: true,
    fontScale: 'xlarge',
    classroomSidebarOpen: true,
  };
  assert.equal(userSettingsSchema.safeParse(validSettings).success, true);
  assert.equal(userSettingsSchema.safeParse({ ...validSettings, themeMode: 'neon' }).success, false);
  assert.deepEqual(sanitizeUserSettings({ bad: true }, 'light'), defaultUserSettings('light'));

  assert.equal(
    backupEnvelopeSchema.safeParse({
      app: 'ARQPIXEL',
      version: 1,
      progress: { done: [] },
      projects: {},
      settings: validSettings,
    }).success,
    true,
  );

  const settingsHtml = renderSettingsPageHtml(validSettings, [
    { keyGroup: 'Progreso principal', itemCount: 1, approxBytes: 512 },
  ]);
  assert.ok(settingsHtml.includes('Alto contraste reforzado'));
  assert.ok(settingsHtml.includes('clear-only-projects'));

  const aboutHtml = renderAboutPageHtml();
  assert.ok(aboutHtml.includes('REQUIRES_REVIEW'));
  assert.ok(aboutHtml.includes('Apache-2.0'));
});
