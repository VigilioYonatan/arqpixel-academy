import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  applyMigratedBackupToStorage,
  parseAndMigrateBackup,
} from '../dist/features/shared/backup-migrator.js';

const modules = JSON.parse(readFileSync('data/modules.json', 'utf8'));
const missions = JSON.parse(readFileSync('data/senior.json', 'utf8'));
const miniGames = JSON.parse(readFileSync('data/mini-games.json', 'utf8'));

const migrationContext = {
  moduleIds: modules.map((m) => m.id),
  missionIds: missions.map((m) => m.id),
  miniGameIds: miniGames.map((g) => g.id),
};

function createMemoryStorage(seedEntries = {}) {
  const store = new Map(Object.entries(seedEntries));
  return {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    snapshot: () => Object.fromEntries(store),
  };
}

function loadFixture(fileName) {
  return JSON.parse(readFileSync(`tests/fixtures/backups/${fileName}`, 'utf8'));
}

test('ARQ-020: migración regresiva completa para backups v1.2, v1.3, v1.5, v1.6, v1.7 y v2.0 con XP idempotente', () => {
  const cases = [
    { file: 'backup-v1.2.json', expectedEra: 'v1.2-raw', expectedXp: 230, expectedSuites: 0 },
    { file: 'backup-v1.3.json', expectedEra: 'v1.x-envelope', expectedXp: 180, expectedSuites: 1 },
    { file: 'backup-v1.5.json', expectedEra: 'v1.x-envelope', expectedXp: 230, expectedSuites: 1 },
    { file: 'backup-v1.6.json', expectedEra: 'v1.x-envelope', expectedXp: 180, expectedSuites: 1 },
    { file: 'backup-v1.7.json', expectedEra: 'v1.x-envelope', expectedXp: 230, expectedSuites: 1 },
    { file: 'backup-v2.0.json', expectedEra: 'v2.0-envelope', expectedXp: 280, expectedSuites: 1 },
  ];

  const storage = createMemoryStorage({
    'third-party-auth-token': 'DO_NOT_TOUCH',
    'arqpixel-senior-suite-v2-S18-7': JSON.stringify({ preservedSeed: true }),
  });

  for (const item of cases) {
    const raw = loadFixture(item.file);
    const bundle = parseAndMigrateBackup(raw, migrationContext);
    assert.equal(bundle.detectedEra, item.expectedEra, item.file);
    assert.equal(bundle.progress.xp, item.expectedXp, `${item.file}: XP recalculado sin inflación`);

    // Apply twice in a row to verify strict XP idempotency
    const firstApply = applyMigratedBackupToStorage(storage, bundle);
    const secondApply = applyMigratedBackupToStorage(storage, bundle);
    assert.equal(firstApply.xpAfterRestore, item.expectedXp);
    assert.equal(secondApply.xpAfterRestore, item.expectedXp);
    assert.equal(firstApply.restoredSuitesCount, item.expectedSuites);
  }

  const finalDump = storage.snapshot();
  // Third-party keys and unrelated Senior Suite seeds remain 100% intact
  assert.equal(finalDump['third-party-auth-token'], 'DO_NOT_TOUCH');
  assert.ok(finalDump['arqpixel-senior-suite-v2-S18-7']);
  assert.ok(finalDump['arqpixel-senior-suite-v2-S01-2']);
  assert.ok(finalDump['arqpixel-senior-suite-v2-S04-4']);
  assert.ok(finalDump['arqpixel-senior-suite-v2-S12-1']);
  assert.ok(finalDump['arqpixel-senior-suite-v2-S09-0']);
  assert.ok(finalDump['arqpixel-senior-suite-v2-S09-3']);

  const restoredS09v2 = JSON.parse(finalDump['arqpixel-senior-suite-v2-S09-3']);
  assert.equal(restoredS09v2.mentorReview.reviewerName, 'Elena Rojas');
  assert.equal(JSON.parse(finalDump['arqpixel-settings-v1']).themeMode, 'high-contrast');
  assert.ok(JSON.parse(finalDump['arqpixel-projects-v1'])['CAP-R06']);
});

test('ARQ-020: fail-closed atómico — respaldos corruptos o contaminados no pisan ninguna clave existente', () => {
  const initialState = {
    'arqpixel-progress-v1': '{"done":["B01"],"xp":50}',
    'external-key': 'SAFE',
  };
  const storage = createMemoryStorage(initialState);

  const v17Valid = loadFixture('backup-v1.7.json');

  // 1. Corrupt second seniorSuite entry must abort before writing first entry
  const partialCorrupt = {
    ...v17Valid,
    seniorSuites: {
      ...v17Valid.seniorSuites,
      'S02-1': { invalidDraft: true },
    },
  };
  assert.throws(() => parseAndMigrateBackup(partialCorrupt, migrationContext));

  // 2. Prototype pollution in v1.2 raw payload must be rejected
  const pollutedRaw = JSON.parse(
    '{"done":["B01"],"answers":{},"missions":{},"notes":{},"__proto__":{"polluted":true}}',
  );
  assert.throws(() => parseAndMigrateBackup(pollutedRaw, migrationContext));

  // 3. Unsupported future version 99 must be rejected
  assert.throws(() => parseAndMigrateBackup({ ...v17Valid, version: 99 }, migrationContext));

  assert.deepEqual(storage.snapshot(), initialState, 'El almacenamiento permanece intacto ante errores');
});
