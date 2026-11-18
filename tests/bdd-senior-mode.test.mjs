import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sanitizeProgress } from '../dist/engine.js';
import { evaluateSeniorReflection, lessonSeniorScenario } from '../dist/lesson-senior.js';
import { devsecopsPolicy, evaluateDevSecOps, SECURITY_CONTROLS } from '../dist/senior-devsecops.js';
import { codeReviewPolicy } from '../dist/senior-reviews.js';
import { simulatePaymentReplay, simulatePeakCapacity } from '../dist/senior-simulations.js';
import {
  ARCH_COMPONENTS,
  emptySeniorDraft,
  evaluateSeniorSuite,
  missionPolicy,
  seniorDossierMarkdown,
  validateSeniorGraph,
} from '../dist/senior-suite.js';
import { evaluateThreat, threatExercise } from '../dist/senior-threats.js';
import { buildCurriculumMapModel } from '../dist/features/curriculum/learning-path-map.js';
import { mergeValidatedCurriculum } from '../dist/features/curriculum/schemas/curriculum.schema.js';

const rawModules = JSON.parse(readFileSync('data/modules.json', 'utf8'));
const rawDeep = JSON.parse(readFileSync('data/deep-dives.json', 'utf8'));
const missions = JSON.parse(readFileSync('data/senior.json', 'utf8'));
const paths = JSON.parse(readFileSync('data/paths.json', 'utf8'));
const modules = mergeValidatedCurriculum(rawModules, rawDeep);
const moduleIds = modules.map((m) => m.id);
const missionIds = missions.map((s) => s.id);

describe('Feature: BDD Senior Mode — Decisiones de Producción, Invariantes y Evaluación Honesta', () => {
  test('Scenario: Given una misión crítica S09 y semilla reproducible, When el arquitecto completa las 6 actividades con restricciones reales, Then aprueba controles mecánicos pero ADR conserva REQUIRES_REVIEW', () => {
    // Given
    const mission = missions.find((m) => m.id === 'S09');
    const seed = 7;
    const policy = missionPolicy(mission, seed);
    const review = codeReviewPolicy('S09', seed);

    // When
    const draft = {
      ...emptySeniorDraft(),
      diagnosis: policy.diagnosisCorrect,
      architecture: [...policy.required],
      relations: [[policy.required[0], policy.required[1]]],
      incident: policy.incidentCorrect,
      capacity: policy.targetCapacity,
      reviewChoice: review.correct,
      decision:
        `Contexto operativo: tráfico ${policy.scenario.traffic} con objetivo SLO ${policy.scenario.availability}. ` +
        `Elegimos idempotencia persistida más outbox transaccional frente a la alternativa de reintentos sin clave única. ` +
        `Riesgo residual: latencia de reconciliación y almacenamiento de claves. ` +
        `Verificación mediante pruebas de caos, métricas de cargos por pedido y plan de rollback inmediato.`,
    };
    const evaluation = evaluateSeniorSuite(mission, seed, draft);

    // Then
    assert.equal(evaluation.complete, true);
    assert.equal(evaluation.score, 100);
    const adrCheck = evaluation.checks.find((c) => c.name.includes('Decision') || c.name.includes('ADR'));
    assert.ok(adrCheck, 'Debe existir check explícito de Decision / ADR');
    assert.equal(adrCheck.status, 'REQUIRES_REVIEW');
    assert.equal(evaluation.requiresReview, true, 'La calidad técnica abierta nunca se autocertifica');

    const dossier = seniorDossierMarkdown(mission, seed, draft);
    assert.ok(dossier.includes('REQUIRES_REVIEW'));
    assert.ok(dossier.includes(policy.scenario.traffic));
  });

  test('Scenario: Given Architecture Builder en cualquier misión Senior, When el usuario selecciona todos los componentes o crea un ciclo, Then el grafo falla por sobreingeniería o ciclo', () => {
    // Given
    const mission = missions.find((m) => m.id === 'S04');
    const policy = missionPolicy(mission, 2);

    // When: fuerza bruta seleccionando los 8 componentes
    const overEngineered = validateSeniorGraph(
      [...ARCH_COMPONENTS],
      ARCH_COMPONENTS.slice(0, -1).map((c, idx) => [c, ARCH_COMPONENTS[idx + 1]]),
      policy.required,
    );

    // When: grafo con ciclo dirigido A -> B -> A
    const cyclicGraph = validateSeniorGraph(
      [...policy.required],
      [
        [policy.required[0], policy.required[1]],
        [policy.required[1], policy.required[0]],
      ],
      policy.required,
    );

    // Then
    assert.equal(overEngineered.valid, false);
    assert.equal(cyclicGraph.valid, false);
    assert.match(cyclicGraph.reason, /ciclo/i);
  });

  test('Scenario: Given pagos distribuidos en S09 y pico de carga en S11, When ocurren reintentos de red y saturación, Then idempotencia evita doble cobro y capacidad detecta cola acumulada', () => {
    // Given & When (S09)
    const unsafeReplay = simulatePaymentReplay({ orders: 200, duplicateRate: 35, idempotency: false, outbox: false });
    const safeReplay = simulatePaymentReplay({ orders: 200, duplicateRate: 35, idempotency: true, outbox: true });

    // Then (S09)
    assert.ok(unsafeReplay.duplicateCharges > 0, 'Sin idempotencia deben producirse cobros duplicados');
    assert.equal(safeReplay.duplicateCharges, 0, 'Con idempotencia persistida no debe haber cobros duplicados');
    assert.equal(safeReplay.lostEvents, 0, 'Con outbox transaccional no se pierden eventos');
    assert.equal(safeReplay.invariants.oneChargePerOrder, true);
    assert.equal(safeReplay.invariants.oneEventualEventPerOrder, true);

    // Given & When (S11)
    const saturated = simulatePeakCapacity({
      incomingRpm: 60_000,
      workers: 2,
      rpmPerWorker: 15_000,
      queueLimit: 10_000,
      minutes: 2,
    });
    const resilient = simulatePeakCapacity({
      incomingRpm: 60_000,
      workers: 5,
      rpmPerWorker: 15_000,
      queueLimit: 10_000,
      minutes: 2,
    });

    // Then (S11)
    assert.equal(saturated.stable, false);
    assert.ok(saturated.dropped > 0 && saturated.queued > 0);
    assert.equal(resilient.stable, true);
    assert.equal(resilient.dropped, 0);
  });

  test('Scenario: Given gates complementarios DevSecOps y STRIDE en S12, When el alumno marca controles masivos vs los prioritarios, Then se rechaza el checklist indiscriminado y se aprueba la mitigación específica', () => {
    // Given
    const policy = devsecopsPolicy('S12');
    const threat = threatExercise('S12', 4);

    // When
    const bruteForceDevSecOps = evaluateDevSecOps(
      'S12',
      SECURITY_CONTROLS.map((c) => c.id),
    );
    const focusedDevSecOps = evaluateDevSecOps('S12', [...policy.must]);
    const wrongThreat = evaluateThreat('S12', 4, (threat.correct + 1) % threat.choices.length);
    const rightThreat = evaluateThreat('S12', 4, threat.correct);

    // Then
    assert.equal(bruteForceDevSecOps.status, 'FAIL');
    assert.equal(focusedDevSecOps.status, 'PASS');
    assert.equal(wrongThreat.status, 'FAIL');
    assert.equal(rightThreat.status, 'PASS');
  });

  test('Scenario: Given modo Senior contextual en aula, When el estudiante cursa una lección básica B03 vs avanzada A05, Then B03 no simula certificación y A05 exige citar restricciones reales', () => {
    // Given
    const basicMod = modules.find((m) => m.id === 'B03');
    const advancedMod = modules.find((m) => m.id === 'A05');

    // When & Then
    assert.equal(lessonSeniorScenario(basicMod), null);
    const advChallenge = lessonSeniorScenario(advancedMod);
    assert.ok(advChallenge !== null);

    const shallowReflection = evaluateSeniorReflection('Usar microservicios porque está de moda.', advancedMod);
    assert.equal(shallowReflection.complete, false);

    const groundedReflection = evaluateSeniorReflection(
      `Bajo tráfico de ${advChallenge.scenario.traffic} y objetivo ${advChallenge.scenario.availability}, ` +
        `implementamos patrón outbox con consumidor idempotente en lugar de la alternativa de doble escritura directa, ` +
        `asumiendo el riesgo de consistencia eventual y verificando con métricas de desfase y pruebas de fallo.`,
      advancedMod,
    );
    assert.equal(groundedReflection.complete, true);
    assert.ok(groundedReflection.checks.some((c) => c.status === 'REQUIRES_REVIEW'));
  });

  test('Scenario: Given un estudiante que aprueba módulos y misiones Senior, When reintenta o importa progreso, Then el XP es idempotente y el Mapa Curricular actualiza el estado de S18 capstone', () => {
    // Given: los prerrequisitos directos de S18 son A12, S08, S09, S14 y S16
    const rawProgress = {
      done: ['A12', 'A12'],
      answers: { A12: modules.find((m) => m.id === 'A12').correct },
      notes: {},
      xp: 999999,
      theme: 'dark',
      seniorMode: true,
      lastVisit: '2026-11-16T00:00:00.000Z',
      missions: {
        S08: { score: 100, seed: 1, choice: 0, adr: 'ADR S08', completedAt: '2026-11-16T00:00:00.000Z', awarded: true },
        S09: { score: 100, seed: 2, choice: 0, adr: 'ADR S09', completedAt: '2026-11-16T00:00:00.000Z', awarded: true },
        S14: { score: 100, seed: 3, choice: 0, adr: 'ADR S14', completedAt: '2026-11-16T00:00:00.000Z', awarded: true },
        S16: { score: 100, seed: 4, choice: 0, adr: 'ADR S16', completedAt: '2026-11-16T00:00:00.000Z', awarded: true },
      },
    };

    // When
    const sanitized = sanitizeProgress(rawProgress, moduleIds, missionIds);
    const awardedMissions = Object.entries(sanitized.missions)
      .filter(([, rec]) => rec.awarded === true)
      .map(([id]) => id);
    const mapModel = buildCurriculumMapModel(modules, missions, paths, sanitized.done, awardedMissions);

    // Then: 1 lección (50 XP) + 4 misiones Senior premiadas (4 * 80 = 320 XP) = 370 XP exactos
    assert.equal(sanitized.xp, 370);
    assert.deepEqual(sanitized.done, ['A12']);
    assert.equal(mapModel.nodes.find((n) => n.id === 'S18')?.status, 'ready');
  });
});
