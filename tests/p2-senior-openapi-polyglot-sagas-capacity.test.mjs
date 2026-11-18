import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  evaluateDimensionalCapacityAndStress,
  renderDimensionalCapacitySvgHtml,
  STRESS_WAVE_SCENARIOS,
} from '../dist/features/labs/capacity-stress-engine.js';
import {
  CROSS_FAULT_SCENARIOS,
  renderCrossFaultStateSvgHtml,
  simulateCrossFaultSaga,
} from '../dist/features/labs/cross-fault-saga-engine.js';
import {
  CONSUMER_DRIVEN_PACTS,
  renderOpenApiCdcDiagramSvgHtml,
  verifyOpenApiConsumerContracts,
} from '../dist/features/labs/openapi-cdc-engine.js';
import {
  computeMinigameHudMetrics,
  MINIGAME_3D_WORLDS,
  renderMinigameHudHtml,
} from '../dist/features/minigames/three-arcade-stage.js';
import {
  evaluateChainedIncidentProgression,
  renderChainedIncidentTimelineSvgHtml,
  SENIOR_TRADEOFF_STANCES,
} from '../dist/features/senior/senior-evolution-engine.js';
import {
  renderLessonExecutiveDigestHtml,
  renderSeniorVisualFlowSvgHtml,
} from '../dist/features/shared/ui/visual-clarity.js';
import { verifyPolyglotArchitecture } from '../scripts/check-polyglot-architecture.mjs';
import { buildSbom } from '../scripts/generate-sbom.mjs';

const missions = JSON.parse(readFileSync('data/senior.json', 'utf8'));
const modules = JSON.parse(readFileSync('data/modules.json', 'utf8'));

test('P2 L1251 (BDD): incidentes encadenados T0→T1→T2 acumulan Error Budget/MTTR y evalúan trade-off dinámico en las 18 misiones', () => {
  assert.equal(SENIOR_TRADEOFF_STANCES.length, 3);

  for (const m of missions) {
    // Contained path with Observability + Rollback + Phase 2 PASS
    const contained = evaluateChainedIncidentProgression({
      missionId: m.id,
      seed: 2,
      selectedStance:
        m.id === 'S09' || m.id === 'S04' || m.id === 'S06' || m.id === 'S12' || m.id === 'S15' || m.id === 'S16'
          ? 'prioritize_consistency'
          : m.id === 'S01' || m.id === 'S02' || m.id === 'S17'
            ? 'prioritize_cost_control'
            : 'prioritize_availability',
      selectedComponents: ['Observabilidad', 'Plan de rollback', 'Idempotencia'],
      incidentChoiceCorrect: true,
      phase2Status: 'PASS',
    });
    assert.equal(contained.stanceFitForMission, 'OPTIMAL_FIT');
    assert.equal(contained.cumulativeVerdict, 'CONTAINED');
    assert.ok(contained.finalErrorBudgetPct >= 55);
    assert.ok(
      contained.stages[0].cumulativeMttrMinutes < contained.stages[1].cumulativeMttrMinutes &&
        contained.stages[1].cumulativeMttrMinutes < contained.stages[2].cumulativeMttrMinutes,
    );

    const svg = renderChainedIncidentTimelineSvgHtml(contained);
    assert.match(svg, /<svg/);
    assert.match(svg, /Error Budget:/);
  }

  // Misaligned stance + blind response + Phase 2 FAIL exhausts Error Budget on S09
  const collapsed = evaluateChainedIncidentProgression({
    missionId: 'S09',
    seed: 1,
    selectedStance: 'prioritize_cost_control',
    selectedComponents: [],
    incidentChoiceCorrect: false,
    phase2Status: 'FAIL',
  });
  assert.equal(collapsed.stanceFitForMission, 'MISALIGNED');
  assert.equal(collapsed.finalErrorBudgetPct, 0);
  assert.equal(collapsed.cumulativeVerdict, 'BUDGET_EXHAUSTED');
});

test('P2 L1252 (BDD): contratos OpenAPI 3.1 y validación ejecutable Consumer-Driven Contracts (CDC)', () => {
  assert.equal(CONSUMER_DRIVEN_PACTS.length, 3);

  const baseline = verifyOpenApiConsumerContracts('v1_baseline');
  assert.equal(baseline.overallStatus, 'PASS');

  const additive = verifyOpenApiConsumerContracts('v2_additive_compatible');
  assert.equal(additive.overallStatus, 'PASS');

  const breaking = verifyOpenApiConsumerContracts('v2_breaking_rename_and_required');
  assert.equal(breaking.overallStatus, 'FAIL');
  assert.equal(
    breaking.outcomes.every((o) => o.status === 'FAIL'),
    true,
  );
  assert.match(renderOpenApiCdcDiagramSvgHtml(breaking), /Gate CDC: FAIL/);

  // Real OpenAPI 3.1 artifact in NestJS reference repo
  const nestOpenApi = JSON.parse(
    readFileSync('examples/nexoshop-reference-nestjs/openapi/orders.openapi.json', 'utf8'),
  );
  assert.equal(nestOpenApi.openapi, '3.1.0');
  assert.ok(nestOpenApi.paths['/v1/orders'].post);
});

test('P2 L1253 (BDD): repositorios poliglotas TypeScript/C#/Java respetan fronteras hexagonales y detectan violaciones inyectadas', () => {
  const realAudit = verifyPolyglotArchitecture();
  assert.equal(realAudit.ok, true, realAudit.violations.join('; '));
  assert.ok(realAudit.checkedCounts['typescript-nestjs'] >= 4);
  assert.ok(realAudit.checkedCounts['csharp-dotnet8'] >= 4);
  assert.ok(realAudit.checkedCounts['java-21'] >= 4);
  assert.equal(realAudit.compilerExecutionHonesty.csharp_dotnet_sdk_build, 'NOT_RUN_NO_DOTNET_SDK_INSTALLED');
  assert.equal(realAudit.compilerExecutionHonesty.java_javac_build, 'NOT_RUN_NO_JDK_INSTALLED');

  // Negative regression test: inject forbidden Infrastructure imports & global contracts/ in temp copy
  const tempExamples = mkdtempSync(join(tmpdir(), 'arq-polyglot-'));
  try {
    cpSync('examples', tempExamples, { recursive: true });
    writeFileSync(
      join(tempExamples, 'nexoshop-reference-csharp/src/Orders/Domain/BadLeak.cs'),
      'using NexoShop.Orders.Infrastructure;\nnamespace NexoShop.Orders.Domain;\npublic class BadLeak {}\n',
      'utf8',
    );
    writeFileSync(
      join(tempExamples, 'nexoshop-reference-java/src/com/nexoshop/orders/domain/BadLeak.java'),
      'package com.nexoshop.orders.domain;\nimport com.nexoshop.orders.infrastructure.JpaOrderRepositoryAdapter;\npublic class BadLeak {}\n',
      'utf8',
    );
    mkdirSync(join(tempExamples, 'nexoshop-reference-nestjs/contracts'), { recursive: true });

    const brokenAudit = verifyPolyglotArchitecture(tempExamples);
    assert.equal(brokenAudit.ok, false);
    assert.ok(brokenAudit.violations.length >= 3);
  } finally {
    rmSync(tempExamples, { recursive: true, force: true });
  }
});

test('P2 L1254 (BDD): consistencia eventual, Sagas y Outbox frente a 4 escenarios de fallos cruzados compuestos', () => {
  assert.equal(CROSS_FAULT_SCENARIOS.length, 4);

  const allProtected = {
    transactionalOutbox: true,
    inboxIdempotency: true,
    versionOrderingGuard: true,
    compensatingSagaAndDlq: true,
  };

  for (const sc of CROSS_FAULT_SCENARIOS) {
    const passRes = simulateCrossFaultSaga(sc.id, allProtected);
    assert.equal(passRes.consistent, true, `Fallo inesperado en ${sc.id}`);
    assert.equal(passRes.invariantStatus, 'PASS');
    assert.match(renderCrossFaultStateSvgHtml(passRes), /<svg/);
  }

  // Negative cross-fault cases
  assert.equal(
    simulateCrossFaultSaga('commit_crash_plus_broker_redelivery', {
      ...allProtected,
      inboxIdempotency: false,
    }).finalState.paymentChargesCount,
    2,
  );
  assert.equal(
    simulateCrossFaultSaga('out_of_order_versioned_events', {
      ...allProtected,
      versionOrderingGuard: false,
    }).consistent,
    false,
  );
  assert.equal(
    simulateCrossFaultSaga('poison_pill_plus_dlq_isolation', {
      ...allProtected,
      compensatingSagaAndDlq: false,
    }).finalState.outboxPending,
    300,
  );
});

test('P2 L1255 (BDD): capacidad dimensional (req/s, ms, vCPU, GiB, SQL conn, USD/mes), incertidumbre P50/P95/P99 y sensibilidad reproducible', () => {
  assert.equal(STRESS_WAVE_SCENARIOS.length, 4);

  const balanced = evaluateDimensionalCapacityAndStress({
    seed: 3,
    baselineRps: 200,
    dbMeanLatencyMs: 14,
    replicasCount: 5,
    vcpuPerReplica: 2,
    sqlPoolPerReplica: 30,
    cacheHitPercent: 80,
    retryAmplificationFactor: 1.1,
    stressScenarioId: 'flash_sale_5x',
  });
  const balancedRepeat = evaluateDimensionalCapacityAndStress({
    seed: 3,
    baselineRps: 200,
    dbMeanLatencyMs: 14,
    replicasCount: 5,
    vcpuPerReplica: 2,
    sqlPoolPerReplica: 30,
    cacheHitPercent: 80,
    retryAmplificationFactor: 1.1,
    stressScenarioId: 'flash_sale_5x',
  });
  assert.deepEqual(balanced, balancedRepeat, 'El modelo de stress debe ser 100 % determinista por seed');
  assert.ok(
    balanced.uncertaintyBandRps[0] < balanced.uncertaintyBandRps[1] &&
      balanced.uncertaintyBandRps[1] < balanced.uncertaintyBandRps[2],
  );
  assert.equal(balanced.sensitivityMatrix.length, 3);
  assert.match(renderDimensionalCapacitySvgHtml(balanced), /USD\/mes/);

  const saturated = evaluateDimensionalCapacityAndStress({
    seed: 1,
    baselineRps: 900,
    dbMeanLatencyMs: 60,
    replicasCount: 1,
    vcpuPerReplica: 1,
    sqlPoolPerReplica: 10,
    cacheHitPercent: 20,
    retryAmplificationFactor: 2.5,
    stressScenarioId: 'degraded_psp_retry_storm',
  });
  assert.equal(saturated.status, 'SATURATED');
});

test('ADR-0006: Three.js 0.187.0 vendorizado con licencia MIT + SBOM SHA-256 + 5 mundos 3D + tiras de claridad visual', () => {
  assert.equal(Object.keys(MINIGAME_3D_WORLDS).length, 5);

  const sbom = buildSbom();
  const threeEntry = sbom.components.find((c) => c.name === 'three' && c.version === '0.187.0');
  assert.ok(threeEntry, 'SBOM debe inventariar three@0.187.0');
  assert.equal(threeEntry.licenses[0].license.id, 'MIT');
  const expectedModuleSha = createHash('sha256')
    .update(readFileSync('public/vendor/three/three.module.js'))
    .digest('hex');
  assert.equal(threeEntry.hashes[0].content, expectedModuleSha);

  const hud = computeMinigameHudMetrics({
    gameId: 'tetris',
    step: 2,
    totalSteps: 6,
    correctCount: 2,
    streak: 2,
    lastOutcome: 'hit',
    reducedMotion: false,
  });
  assert.equal(hud.integrityPercent, 100);
  const hudHtml = renderMinigameHudHtml({
    gameId: 'dominio',
    step: 1,
    totalSteps: 6,
    correctCount: 1,
    streak: 1,
    lastOutcome: 'hit',
    reducedMotion: false,
  });
  assert.match(hudHtml, /Archipiélago DDD/);
  assert.doesNotMatch(hudHtml, /\bstyle\s*=/);

  const digestHtml = renderLessonExecutiveDigestHtml(modules[0], true, true, false);
  assert.match(digestHtml, /Mapa rápido de la lección/);
  const flowHtml = renderSeniorVisualFlowSvgHtml('S09', 0);
  assert.match(flowHtml, /REQUIRES_REVIEW/);
});
