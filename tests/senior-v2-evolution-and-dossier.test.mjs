import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  emptySeniorDraft,
  evaluateSeniorSuite,
  exportSeniorDossierV2,
  importSeniorDossierV2Json,
  missionPolicy,
  sanitizeSeniorDraft,
  seniorDossierMarkdown,
} from '../dist/senior-suite.js';
import { codeReviewPolicy } from '../dist/senior-reviews.js';
import {
  mentorReviewSchema,
  seniorDossierV2Schema,
} from '../dist/features/senior/schemas/senior-dossier.schema.js';
import { parseExternalMentorReviewJson } from '../dist/features/senior/senior-evolution-engine.js';

const missions = JSON.parse(readFileSync('data/senior.json', 'utf8'));

test('ARQ-016: las 18 misiones Senior conectan Fase 1 (Diagnóstico + Grafo + Capacidad) con FinOps, incertidumbre, visibilidad y Fase 2 encadenada', () => {
  assert.equal(missions.length, 18);

  for (const mission of missions) {
    // Verify Phase 2 option rotation across seeds (never fixed at index 0)
    const positions = new Set([0, 1, 2].map((seed) => missionPolicy(mission, seed).phase2.correctIndex));
    assert.ok(positions.size >= 2, `${mission.id} debe rotar opciones de Fase 2 según seed`);

    for (const seed of [0, 7, 19]) {
      const policy = missionPolicy(mission, seed);
      assert.equal(policy.hints.length, 3);
      for (const h of policy.hints) {
        assert.doesNotMatch(h, /diagnosisCorrect|incidentCorrect|correctIndex/);
      }

      // Case A: Blind & reckless Phase 1 setup -> wide uncertainty, FinOps drift, and Phase 2 chain failure
      const recklessDraft = {
        ...emptySeniorDraft(),
        diagnosis: policy.recklessDiagnosisIndex,
        architecture: ['API Gateway', 'Base de datos', 'Cola de eventos', 'Autorización', 'Idempotencia'],
        capacity: policy.targetCapacity,
        phase2Choice: policy.phase2.correctIndex,
      };
      const recklessEval = evaluateSeniorSuite(mission, seed, recklessDraft);
      assert.equal(recklessEval.consequences.finopsStatus, 'OVER_BUDGET_DRIFT');
      assert.equal(recklessEval.consequences.incidentReadiness, 'BLIND_RESPONSE');
      assert.equal(
        recklessEval.phase2.status,
        'FAIL',
        `${mission.id}: Fase 2 debe fallar si Fase 1 adoptó diagnóstico sin controles`,
      );

      // Case B: Coherent Phase 1 with required support +Observabilidad -> narrower uncertainty & Phase 2 PASS
      const coherentComponents = [
        ...new Set([...policy.required, policy.phase2.requiredPhase1Support, 'Observabilidad']),
      ].slice(0, 4);
      const coherentEdges = coherentComponents
        .slice(1)
        .map((comp, idx) => [coherentComponents[idx], comp]);

      const coherentDraft = {
        ...emptySeniorDraft(),
        diagnosis: policy.diagnosisCorrect,
        architecture: coherentComponents,
        relations: coherentEdges,
        incident: policy.incidentCorrect,
        capacity: policy.targetCapacity,
        reviewChoice: codeReviewPolicy(mission.id, seed).correct,
        phase2Choice: policy.phase2.correctIndex,
        decision:
          `Contexto: tráfico ${policy.scenario.traffic} y disponibilidad ${policy.scenario.availability}. ` +
          'Evaluamos alternativas y trade-offs de coste y riesgo frente a sobrediseño. ' +
          'Verificaremos mediante pruebas automatizadas, métricas SLO y plan de rollback.',
      };
      const coherentEval = evaluateSeniorSuite(mission, seed, coherentDraft);
      assert.equal(coherentEval.phase2.status, 'PASS', `${mission.id} seed=${seed} Fase 2 coherente`);
      assert.equal(coherentEval.phase2.chainCoherentWithPhase1, true);
      assert.ok(
        coherentEval.consequences.uncertaintyPercent < recklessEval.consequences.uncertaintyPercent,
        'Observabilidad y diagnóstico coherente reducen la incertidumbre de capacidad',
      );

      // Case C: Counterexample option in Phase 2 -> FAIL even if Phase 1 is good
      const wrongPhase2Idx = (policy.phase2.correctIndex + 1) % 3;
      const counterexampleEval = evaluateSeniorSuite(mission, seed, {
        ...coherentDraft,
        phase2Choice: wrongPhase2Idx,
      });
      assert.equal(counterexampleEval.phase2.status, 'FAIL');
    }
  }
});

test('ARQ-017: Dossier Senior v2 (schemaVersion: 2) y dictamen de mentor/comité mantienen separación estricta frente al score mecánico', () => {
  const s09 = missions.find((m) => m.id === 'S09');
  const seed = 4;
  const p = missionPolicy(s09, seed);

  const baseDraft = {
    ...emptySeniorDraft(),
    diagnosis: p.diagnosisCorrect,
    architecture: [...p.required],
    relations: [[p.required[0], p.required[1]]],
    incident: p.incidentCorrect,
    capacity: p.targetCapacity,
    reviewChoice: codeReviewPolicy('S09', seed).correct,
    phase2Choice: p.phase2.correctIndex,
    decision:
      `Contexto: ${p.scenario.traffic}, SLO ${p.scenario.availability}. ` +
      'Adoptamos Outbox e Idempotencia frente a dual-write directo asumiendo el coste de almacenamiento de claves y riesgo de lag. ' +
      'Verificaremos mediante pruebas de reintentos duplicados y monitorización SLO.',
  };

  // Export without human review attached yet
  const dossierPending = exportSeniorDossierV2(s09, seed, baseDraft, null, '2026-11-16T19:00:00.000Z');
  assert.equal(dossierPending.schemaVersion, 2);
  assert.equal(dossierPending.format, 'ARQPIXEL-SENIOR-DOSSIER-V2');
  assert.equal(dossierPending.humanReview, null);
  assert.equal(dossierPending.mechanicalSummary.openReasoningStatus, 'REQUIRES_REVIEW');
  assert.equal(dossierPending.reviewerGuideQuestions.length, 4);
  assert.equal(seniorDossierV2Schema.safeParse(dossierPending).success, true);

  // Attach external mentor review (even REJECTED_UNSAFE or APPROVED_WITH_EVIDENCE must NEVER change mechanical score)
  const mentorJson = JSON.stringify({
    reviewerName: 'Carlos Méndez',
    reviewerRole: 'Principal Architect Comité',
    reviewedAt: '2026-11-16T19:20:00.000Z',
    verdict: 'REJECTED_UNSAFE',
    criteriaComments: {
      adrQuality: 'Falta detallar tiempo de retención de claves idempotentes en PostgreSQL.',
      tradeOffRealism: 'El presupuesto limitado exige estimar crecimiento mensual de outbox_events.',
      failureModes: 'Falta describir qué ocurre si la DLQ supera 1.000 mensajes.',
      verificationRigor: 'Añadir prueba de corte de red entre transacción local y relé.',
    },
    overallNotes: 'Estructura formal completa, pero debe iterar la política de purga antes de comité.',
  });

  const parsedReview = parseExternalMentorReviewJson(mentorJson);
  const draftWithMentor = sanitizeSeniorDraft({ ...baseDraft, mentorReview: parsedReview });
  assert.ok(draftWithMentor);

  const evalBefore = evaluateSeniorSuite(s09, seed, baseDraft);
  const evalAfter = evaluateSeniorSuite(s09, seed, draftWithMentor);
  assert.equal(evalAfter.score, evalBefore.score, 'El dictamen humano jamás altera ni infla el score mecánico');
  assert.equal(evalAfter.checks[2].status, 'REQUIRES_REVIEW');

  // Round-trip export -> import Dossier v2 JSON
  const dossierWithReview = exportSeniorDossierV2(s09, seed, draftWithMentor);
  const reimported = importSeniorDossierV2Json(JSON.stringify(dossierWithReview));
  assert.equal(reimported.dossier.humanReview?.verdict, 'REJECTED_UNSAFE');
  assert.deepEqual(reimported.restoredDraftPatch.architecture, baseDraft.architecture);
  assert.equal(reimported.restoredDraftPatch.mentorReview?.reviewerName, 'Carlos Méndez');

  const md = seniorDossierMarkdown(s09, seed, draftWithMentor);
  assert.match(md, /Carlos Méndez/);
  assert.match(md, /REJECTED_UNSAFE/);
  assert.match(md, /Guía de preguntas para el Revisor Humano/);

  // Invalid mentor review is rejected
  assert.equal(mentorReviewSchema.safeParse({ reviewerName: 'X' }).success, false);
  assert.equal(sanitizeSeniorDraft({ ...baseDraft, mentorReview: { bad: true } }), null);
});
