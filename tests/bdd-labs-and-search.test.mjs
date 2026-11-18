import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { analyzeC4Semantics, C4_LEVEL_PRESETS, validateC4 } from '../dist/c4-studio.js';
import {
  evaluateDddAggregateDesign,
  validateDddContextMap,
} from '../dist/ddd-workshop.js';
import { mergeValidatedCurriculum } from '../dist/features/curriculum/schemas/curriculum.schema.js';
import {
  calculateSloBurnRate,
  simulateDistributedEventTimeline,
} from '../dist/features/labs/advanced-labs.js';
import { LAB_STUDIOS } from '../dist/features/labs/constants/labs.constants.js';
import { c4ModelImportSchema } from '../dist/features/senior/schemas/senior.schema.js';
import {
  buildGlobalSearchIndex,
  deriveLessonHints,
  queryGlobalSearch,
  renderHintDrawerHtml,
  renderSolutionRevealHtml,
} from '../dist/features/shared/ui/interactive-components.js';
import {
  emptySeniorDraft,
  evaluateSeniorSuite,
  missionPolicy,
} from '../dist/senior-suite.js';
import { codeReviewPolicy } from '../dist/senior-reviews.js';

const rawModules = JSON.parse(readFileSync('data/modules.json', 'utf8'));
const rawDeep = JSON.parse(readFileSync('data/deep-dives.json', 'utf8'));
const missions = JSON.parse(readFileSync('data/senior.json', 'utf8'));
const paths = JSON.parse(readFileSync('data/paths.json', 'utf8'));
const miniGames = JSON.parse(readFileSync('data/mini-games.json', 'utf8'));
const modules = mergeValidatedCurriculum(rawModules, rawDeep);

test('BDD Escenario 1: Descubrimiento con Ctrl+K (SearchCommand) → Pistas progresivas (HintDrawer) → Comparación de referencia (SolutionReveal)', () => {
  // GIVEN el alumno abre el buscador rápido Ctrl+K buscando "idempotencia"
  const searchIndex = buildGlobalSearchIndex({
    modules,
    missions,
    paths,
    labs: LAB_STUDIOS,
    miniGames,
  });

  // WHEN consulta "idempotencia"
  const hits = queryGlobalSearch(searchIndex, 'idempotencia');
  assert.ok(hits.length >= 2);
  assert.ok(hits.some((h) => h.href === '#/taller-senior/S09' || h.href === '#/laboratorio/distributed'));

  // AND entra a una lección avanzada de sistemas distribuidos y solicita 2 pistas antes de responder
  const targetModule = modules.find((m) => m.id === 'A04') ?? modules[0];
  const hints = deriveLessonHints(targetModule);
  const drawerStep2 = renderHintDrawerHtml({
    idPrefix: 'bdd-hint',
    hints,
    revealedCount: 2,
  });

  // THEN recibe 2 pistas orientadoras sin revelar literalmente la opción correcta
  assert.match(drawerStep2, /Pista 1:/);
  assert.match(drawerStep2, /Pista 2:/);
  assert.doesNotMatch(drawerStep2, /Pista 3:/);
  assert.equal(drawerStep2.includes(targetModule.options[targetModule.correct]), false);

  // WHEN selecciona la respuesta correcta
  const solutionHtml = renderSolutionRevealHtml({
    isCorrect: true,
    chosenLabel: targetModule.options[targetModule.correct],
    referenceLabel: targetModule.options[targetModule.correct],
    explanation: targetModule.explanation,
    verificationMetric: targetModule.metric,
  });

  // THEN se muestra la comparación de referencia y la advertencia contra "bala de plata"
  assert.match(solutionHtml, /data-ui-state="success"/);
  assert.match(solutionHtml, /no existe bala de plata/);
});

test('BDD Escenario 2: Modelado C4 multinivel (C2 → C3), corrección de alerta semántica y round-trip JSON', () => {
  // GIVEN un modelo C2 donde inicialmente alguien conecta el Frontend directo a la Base de Datos
  const flawedModel = {
    kind: 'C4-containers-educational',
    system: 'NexoShop',
    level: 'C2',
    containers: [
      { id: 'spa', label: 'Web NexoShop', type: 'Frontend' },
      { id: 'db', label: 'PostgreSQL Pedidos', type: 'Base de datos' },
    ],
    relations: [{ from: 'spa', to: 'db', label: 'Lee y escribe SQL directo' }],
  };

  // WHEN se analiza semánticamente el modelo
  const initialWarnings = analyzeC4Semantics(flawedModel);

  // THEN alerta acoplamiento directo Frontend → Base de datos
  assert.ok(initialWarnings.some((w) => w.code === 'DIRECT_FRONTEND_TO_DB'));

  // WHEN el arquitecto interpone una API y exporta/reimporta el JSON
  const fixedModel = C4_LEVEL_PRESETS.C2;
  assert.equal(validateC4(fixedModel).length, 0);
  assert.equal(analyzeC4Semantics(fixedModel).length, 0);

  const reimported = c4ModelImportSchema.parse(JSON.parse(JSON.stringify(fixedModel)));
  assert.equal(reimported.level, 'C2');
  assert.equal(analyzeC4Semantics(reimported).length, 0);
});

test('BDD Escenario 3: Del modelado DDD e invariantes a validación distribuida Outbox/SLO y Misión Senior S09/S14', () => {
  // GIVEN el arquitecto diseña las fronteras entre Ventas, Inventario y Pagos
  const contextMapResult = validateDddContextMap([
    {
      upstream: 'Ventas',
      downstream: 'Inventario',
      pattern: 'Domain Events',
      contractSummary: 'OrdenCreada vía Outbox',
    },
    {
      upstream: 'PSP Externo Legado',
      downstream: 'Pagos',
      pattern: 'Anti-Corruption Layer',
      contractSummary: 'Traductor de estados PSP a dominio Pagos',
    },
  ]);
  assert.equal(contextMapResult.valid, true);

  // WHEN protege el agregado StockItem contra sobreventa y verifica la entrega con Outbox + Idempotencia
  const aggEval = evaluateDddAggregateDesign({
    rootId: 'StockItem',
    internalEntities: ['reserva-lote'],
    invariants: ['inv-no-overselling'],
    eventualEvents: ['evt-autorizar-cobro'],
    optimisticConcurrency: true,
  });
  assert.equal(aggEval.status, 'PASS');

  const distTimeline = simulateDistributedEventTimeline('duplicate-broker-delivery', {
    outboxEnabled: true,
    idempotentConsumerEnabled: true,
    dlqEnabled: true,
    compensatingSagaEnabled: true,
  });
  assert.equal(distTimeline.consistent, true);

  // AND calcula el Burn Rate ante un pico de errores y completa la misión Senior S09 manteniendo REQUIRES_REVIEW
  const sloEval = calculateSloBurnRate({
    sloPercent: 99.9,
    windowDays: 30,
    observedErrorRatePercent: 1.5,
  });
  assert.equal(sloEval.alertAction, 'PAGE_ONCALL_P1');

  const s09 = missions.find((m) => m.id === 'S09');
  const policy = missionPolicy(s09, 0);
  const review = codeReviewPolicy('S09', 0);
  const draft = {
    ...emptySeniorDraft(),
    diagnosis: policy.diagnosisCorrect,
    architecture: [...policy.required],
    relations: [[policy.required[0], policy.required[1]]],
    incident: policy.incidentCorrect,
    capacity: policy.targetCapacity,
    reviewChoice: review.correct,
    decision:
      `Contexto: operamos con tráfico ${policy.scenario.traffic} y objetivo SLO ${policy.scenario.availability}. ` +
      'Adoptamos Transactional Outbox e Idempotent Consumer por clave de operación frente a la alternativa descartada de dual-write directo. ' +
      'El trade-off asumido es mayor coste operativo de almacenamiento de claves y relé asíncrono, mitigando el riesgo de doble cobro. ' +
      'Verificaremos con pruebas de reintentos duplicados, monitor de lag y SLO de conciliación.',
  };

  const suiteResult = evaluateSeniorSuite(s09, 0, draft);
  assert.equal(suiteResult.mechanicalPassed, true);
  assert.equal(suiteResult.requiresReview, true);
  assert.equal(
    suiteResult.checks.find((c) => c.name === 'Decision / ADR')?.status,
    'REQUIRES_REVIEW',
    'El razonamiento abierto jamás se auto-certifica sin revisión humana',
  );
});
