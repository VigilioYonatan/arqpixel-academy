import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  emptySeniorDraft,
  evaluateSeniorSuite,
  exportSeniorDossierV2,
  importSeniorDossierV2Json,
  missionPolicy,
} from '../dist/senior-suite.js';
import { codeReviewPolicy } from '../dist/senior-reviews.js';
import { getLessonEnrichment, renderLessonEnrichmentSectionHtml } from '../dist/features/curriculum/lesson-visuals.js';
import { parseAndMigrateBackup } from '../dist/features/shared/backup-migrator.js';
import { createOrdersReferenceModule } from '../examples/nexoshop-reference-nestjs/dist/modules/orders/orders.module.js';

const missions = JSON.parse(readFileSync('data/senior.json', 'utf8'));
const modules = JSON.parse(readFileSync('data/modules.json', 'utf8'));
const miniGames = JSON.parse(readFileSync('data/mini-games.json', 'utf8'));

test('BDD Senior Mode 2.0: Given diseño inicial sin Observabilidad en S14, When ocurre crisis de Burn Rate en Fase 2 y luego se corrige y adjunta revisión experta, Then valida efectos cruzados sin auto-certificar el ADR', () => {
  // GIVEN la misión S14 (Observabilidad y SLO) con seed reproducible 5
  const s14 = missions.find((m) => m.id === 'S14');
  const seed = 5;
  const policy = missionPolicy(s14, seed);

  // WHEN el estudiante omite "Observabilidad" en Fase 1 e intenta superar la Fase 2
  const blindDraft = {
    ...emptySeniorDraft(),
    diagnosis: policy.diagnosisCorrect,
    architecture: ['API Gateway', 'Base de datos'],
    relations: [['API Gateway', 'Base de datos']],
    incident: policy.incidentCorrect,
    capacity: policy.targetCapacity,
    reviewChoice: codeReviewPolicy('S14', seed).correct,
    phase2Choice: policy.phase2.correctIndex,
    decision:
      `Contexto cuantitativo: tráfico esperado ${policy.scenario.traffic}, SLO objetivo ${policy.scenario.availability} y presupuesto ${policy.scenario.budget}. ` +
      'Analizamos alternativas de instrumentación, coste de cardinalidad y riesgo de ceguera operativa. ' +
      'Verificamos con monitor multi-ventana, alertas de burn rate y pruebas sintéticas sobre flujos reales.',
  };
  const blindEval = evaluateSeniorSuite(s14, seed, blindDraft);

  // THEN la telemetría cruzada reporta BLIND_RESPONSE y la Fase 2 falla por incoherencia con Fase 1
  assert.equal(blindEval.consequences.incidentReadiness, 'BLIND_RESPONSE');
  assert.equal(blindEval.phase2.status, 'FAIL');
  assert.equal(blindEval.phase2.chainCoherentWithPhase1, false);

  // WHEN incorpora "Observabilidad" (requerido en S14) y exporta el Dossier v2 con dictamen de comité
  const fixedDraft = {
    ...blindDraft,
    architecture: ['Observabilidad', 'API Gateway'],
    relations: [['API Gateway', 'Observabilidad']],
    mentorReview: {
      reviewerName: 'Lucía Paredes',
      reviewerRole: 'SRE Lead',
      reviewedAt: '2026-11-16T19:40:00.000Z',
      verdict: 'APPROVED_WITH_EVIDENCE',
      criteriaComments: {
        adrQuality: 'Define SLIs centrados en checkout real y no solo CPU.',
        tradeOffRealism: 'Controla cardinalidad de labels en Prometheus.',
        failureModes: 'Contempla congelar despliegues ante Fast-Burn >= 14.4x.',
        verificationRigor: 'Incluye alerta multi-ventana y runbook verificable.',
      },
      overallNotes: 'Aprobado en revisión humana independiente del score mecánico.',
    },
  };

  const fixedEval = evaluateSeniorSuite(s14, seed, fixedDraft);
  assert.equal(fixedEval.consequences.incidentReadiness, 'HIGH_VISIBILITY');
  assert.equal(fixedEval.phase2.status, 'PASS');
  assert.equal(fixedEval.score, 100);
  assert.equal(fixedEval.checks[2].status, 'REQUIRES_REVIEW');

  const dossierV2 = exportSeniorDossierV2(s14, seed, fixedDraft);
  const restored = importSeniorDossierV2Json(JSON.stringify(dossierV2));
  assert.equal(restored.dossier.schemaVersion, 2);
  assert.equal(restored.dossier.humanReview?.verdict, 'APPROVED_WITH_EVIDENCE');
});

test('BDD Continuidad Pedagógica: Given un respaldo histórico v1.2 actualizado a v2.0, When el alumno estudia A05 (Outbox) y prueba el repo de referencia NestJS, Then teoría, diagrama, código ✅/❌ y ejecución coinciden', async () => {
  // GIVEN un respaldo antiguo v1.2 con XP manipulado
  const rawV12 = JSON.parse(readFileSync('tests/fixtures/backups/backup-v1.2.json', 'utf8'));
  const migrated = parseAndMigrateBackup(rawV12, {
    moduleIds: modules.map((m) => m.id),
    missionIds: missions.map((m) => m.id),
    miniGameIds: miniGames.map((g) => g.id),
  });

  // THEN se restaura sin pérdida y recalcula XP honestamente (230 XP en vez de 999999)
  assert.equal(migrated.progress.xp, 230);
  assert.deepEqual(migrated.progress.done, ['B01', 'B02', 'B03']);

  // WHEN abre el módulo A05 (Consistencia y transacciones distribuidas)
  const enrichmentA05 = getLessonEnrichment('A05');
  const htmlA05 = renderLessonEnrichmentSectionHtml(enrichmentA05);
  assert.match(htmlA05, /Transactional Outbox/);
  assert.match(htmlA05, /unsafeDualWrite/);
  assert.match(htmlA05, /#\/laboratorio\/distributed/);

  // AND ejecuta la misma invariante Outbox + Idempotencia en el repo de referencia NexoShop
  const { controller, repository } = createOrdersReferenceModule();
  repository.seedStock('tenant-bdd', 'SKU-SSD', 5, 1);
  const first = await controller.placeOrder({
    principal: { actor_id: 'u-bdd', tenant_id: 'tenant-bdd' },
    idempotency_key: 'bdd-idem-key-99',
    raw_body: {
      customer_id: 'cust-bdd',
      lines: [{ sku: 'SKU-SSD', quantity: 2, unit_price_decimal: '120.00' }],
    },
  });
  const duplicate = await controller.placeOrder({
    principal: { actor_id: 'u-bdd', tenant_id: 'tenant-bdd' },
    idempotency_key: 'bdd-idem-key-99',
    raw_body: {
      customer_id: 'cust-bdd',
      lines: [{ sku: 'SKU-SSD', quantity: 2, unit_price_decimal: '120.00' }],
    },
  });

  // THEN el segundo intento no duplica cobro/stock ni duplica eventos en Outbox
  assert.equal(first.status, 201);
  assert.equal(duplicate.status, 200);
  assert.equal(repository.getStockSnapshot('tenant-bdd', 'SKU-SSD')?.available_qty, 3);
  assert.equal(repository.getPendingOutboxEvents().length, 1);
});
