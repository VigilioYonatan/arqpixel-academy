import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isSafePlainObject, s } from '../dist/features/shared/schemas/schema-validator.js';
import {
  deepDivesCatalogSchema,
  labCasesCatalogSchema,
  learningPathsCatalogSchema,
  mergeValidatedCurriculum,
  moduleBaseSchema,
  modulesCatalogSchema,
} from '../dist/features/curriculum/schemas/curriculum.schema.js';
import {
  backupEnvelopeSchema,
  c4ModelImportSchema,
  missionsCatalogSchema,
} from '../dist/features/senior/schemas/senior.schema.js';

const rawModules = JSON.parse(readFileSync('data/modules.json', 'utf8'));
const rawDeepDives = JSON.parse(readFileSync('data/deep-dives.json', 'utf8'));
const rawSenior = JSON.parse(readFileSync('data/senior.json', 'utf8'));
const rawPaths = JSON.parse(readFileSync('data/paths.json', 'utf8'));
const rawLabCases = JSON.parse(readFileSync('data/lab-cases.json', 'utf8'));

test('ARQ-004: los catálogos reales de ARQPIXEL superan validación estricta de esquemas en borde', () => {
  assert.equal(modulesCatalogSchema.safeParse(rawModules).success, true);
  assert.equal(deepDivesCatalogSchema.safeParse(rawDeepDives).success, true);
  assert.equal(missionsCatalogSchema.safeParse(rawSenior).success, true);
  assert.equal(learningPathsCatalogSchema.safeParse(rawPaths).success, true);
  assert.equal(labCasesCatalogSchema.safeParse(rawLabCases).success, true);

  const merged = mergeValidatedCurriculum(rawModules, rawDeepDives);
  assert.equal(merged.length, 36);
  assert.ok(merged.every((m) => typeof m.transfer === 'string' && m.transfer.length >= 15));
});

test('ARQ-004: anti-contaminación de prototipos (__proto__, constructor, prototype y clases instanciadas)', () => {
  const poisonedProto = JSON.parse('{"app":"ARQPIXEL","version":1,"progress":{},"__proto__":{"polluted":true}}');
  assert.equal(isSafePlainObject(poisonedProto), false);
  assert.equal(backupEnvelopeSchema.safeParse(poisonedProto).success, false);

  const poisonedConstructor = JSON.parse('{"constructor":{"prototype":{"isAdmin":true}}}');
  assert.equal(isSafePlainObject(poisonedConstructor), false);
  assert.equal(s.plainObject().safeParse(poisonedConstructor).success, false);

  class CustomClass {
    x = 1;
  }
  assert.equal(isSafePlainObject(new CustomClass()), false);
  assert.equal(isSafePlainObject(null), false);
  assert.equal(isSafePlainObject([]), false);
});

test('ARQ-004: moduleBaseSchema rechaza índice correct fuera de rango y nivel incoherente con prefijo ID', () => {
  const validSample = rawModules[0];
  assert.equal(moduleBaseSchema.safeParse(validSample).success, true);

  const badCorrect = { ...validSample, correct: 9 };
  assert.equal(moduleBaseSchema.safeParse(badCorrect).success, false);

  const badLevel = { ...validSample, id: 'B01', level: 'Avanzado' };
  assert.equal(moduleBaseSchema.safeParse(badLevel).success, false);

  const badId = { ...validSample, id: 'Z99' };
  assert.equal(moduleBaseSchema.safeParse(badId).success, false);
});

test('ARQ-004: backupEnvelopeSchema exige app, version exacta y rechaza claves extra maliciosas', () => {
  const validBackup = {
    app: 'ARQPIXEL',
    version: 1,
    progress: { done: ['B01'], xp: 50 },
    seniorSuites: {},
    miniGames: { best: {}, plays: {} },
  };
  assert.equal(backupEnvelopeSchema.safeParse(validBackup).success, true);

  assert.equal(backupEnvelopeSchema.safeParse({ ...validBackup, version: 99 }).success, false);
  assert.equal(backupEnvelopeSchema.safeParse({ ...validBackup, app: 'OTRA_APP' }).success, false);
  assert.equal(backupEnvelopeSchema.safeParse({ ...validBackup, injectedScript: '<script>' }).success, false);
  assert.equal(backupEnvelopeSchema.safeParse({ ...validBackup, progress: [] }).success, false);
});

test('ARQ-004: c4ModelImportSchema acepta modelos C4 válidos y bloquea modelos corruptos o con relaciones inválidas', () => {
  const validC4 = {
    kind: 'C4-containers-educational',
    system: 'NexoShop',
    containers: [
      { id: 'web', label: 'Web NexoShop', type: 'Frontend' },
      { id: 'api', label: 'API Pedidos', type: 'API' },
    ],
    relations: [{ from: 'web', to: 'api', label: 'Consulta HTTPS' }],
  };
  assert.equal(c4ModelImportSchema.safeParse(validC4).success, true);

  const selfLoop = {
    ...validC4,
    relations: [{ from: 'web', to: 'web', label: 'Autociclo inválido' }],
  };
  assert.equal(c4ModelImportSchema.safeParse(selfLoop).success, false);

  const orphanTarget = {
    ...validC4,
    relations: [{ from: 'web', to: 'fantasma', label: 'Destino inexistente' }],
  };
  assert.equal(c4ModelImportSchema.safeParse(orphanTarget).success, false);

  const wrongSystem = { ...validC4, system: 'OtroSistema' };
  assert.equal(c4ModelImportSchema.safeParse(wrongSystem).success, false);
});
