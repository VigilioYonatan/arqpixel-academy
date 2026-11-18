import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('Feature: BDD §21.4 Senior Mode (L2608–L2612) — Toggle contextual acotado, 18 misiones con criterios separados, Seed reproducible, Criterios inmutables y 5 estados canónicos', () => {
  it('Scenario L2608: Given el toggle Senior activo, When se renderiza B01..B12 vs I01..A12, Then muestra desafío contextual únicamente en los 24 módulos soportados', async () => {
    const { mergeValidatedCurriculum } = await import(
      '../dist/features/curriculum/schemas/curriculum.schema.js'
    );
    const { renderLessonClassroomHtml } = await import(
      '../dist/features/curriculum/lesson-classroom.js'
    );

    const raw_modules = JSON.parse(readFileSync('data/modules.json', 'utf8'));
    const raw_deep = JSON.parse(readFileSync('data/deep-dives.json', 'utf8'));
    const modules = mergeValidatedCurriculum(raw_modules, raw_deep);

    for (const mod of modules) {
      const html = renderLessonClassroomHtml({
        currentModule: mod,
        allModules: modules,
        completedModuleIds: [],
        selectedAnswer: undefined,
        savedNote: '',
        seniorModeActive: true,
        sidebarExpanded: false,
        sidebarQuery: '',
        routePrefix: 'aprender',
      });
      if (mod.level === 'Básico') {
        assert.equal(html.includes('data-senior-contextual="supported"'), false);
        assert.equal(html.includes('id="check-senior-lesson"'), false);
        assert.match(html, /data-senior-contextual-badge="unsupported"/);
      } else {
        assert.match(html, /data-senior-contextual="supported"/);
        assert.match(html, /id="check-senior-lesson"/);
        assert.match(html, /data-senior-contextual-badge="supported"/);
      }
    }
  });

  it('Scenario L2609: Given el catálogo de 18 misiones Senior, When se renderiza #/senior y se filtra por criticidad o término, Then expone foco, componentes requeridos y entregable distintos por misión', async () => {
    const { SENIOR_PLAYBOOKS } = await import('../dist/senior-suite.js');
    const { filterSeniorMissions, renderSeniorDashboardHtml } = await import(
      '../dist/features/senior/senior-ux-views.js'
    );
    const missions = JSON.parse(readFileSync('data/senior.json', 'utf8'));

    assert.equal(missions.length, 18);
    const focuses = new Set(missions.map((m) => SENIOR_PLAYBOOKS[m.id]?.focus));
    const artifacts = new Set(missions.map((m) => SENIOR_PLAYBOOKS[m.id]?.artifact));
    assert.equal(focuses.size, 18, 'Each of the 18 Senior missions must have a distinct engineering focus');
    assert.equal(artifacts.size, 18, 'Each of the 18 Senior missions must have a distinct artifact');

    const crit_only = filterSeniorMissions(missions, SENIOR_PLAYBOOKS, 'CRITICO', '');
    assert.equal(crit_only.length, 6);
    assert.equal(crit_only[0].mission.id, 'S13');

    const html = renderSeniorDashboardHtml({
      missions,
      playbooks: SENIOR_PLAYBOOKS,
      savedMissions: { S09: { score: 100, seed: 42, awarded: true } },
      tierFilter: 'ALL',
      searchQuery: '',
      heroSpriteHtml: '',
    });
    assert.match(html, /Seed 42 \(100 pt\)/);
    assert.equal(/\bstyle\s*=\s*["']/.test(html), false);
  });

  it('Scenario L2610 & L2611: Given una semilla guardada (ej. 42), When se evalúa antes y después de entregar o adjuntar revisión, Then reproduce la variante exacta y conserva criterios congelados (Object.freeze + fnv1a)', async () => {
    const { emptySeniorDraft, evaluateSeniorSuite, missionPolicy } = await import(
      '../dist/senior-suite.js'
    );
    const { codeReviewPolicy } = await import('../dist/senior-reviews.js');
    const { sanitizeSeniorSeed } = await import('../dist/features/senior/senior-ux-views.js');
    const missions = JSON.parse(readFileSync('data/senior.json', 'utf8'));
    const s09 = missions.find((m) => m.id === 'S09');

    assert.equal(sanitizeSeniorSeed('42'), 42);
    assert.equal(sanitizeSeniorSeed(-99), 0);
    assert.equal(sanitizeSeniorSeed(9_999_999), 1_000_000);

    const policy_before = missionPolicy(s09, 42);
    assert.equal(Object.isFrozen(policy_before), true);
    assert.throws(() => {
      policy_before.targetCapacity = 1;
    }, TypeError);

    const empty_eval = evaluateSeniorSuite(s09, 42, emptySeniorDraft());
    const full_draft = {
      ...emptySeniorDraft(),
      diagnosis: policy_before.diagnosisCorrect,
      architecture: [...policy_before.required],
      relations: [[policy_before.required[0], policy_before.required[1]]],
      decision: `ADR S09 seed 42: con tráfico ${policy_before.scenario.traffic} y SLO ${policy_before.scenario.availability} elegimos Outbox e Idempotencia asumiendo trade-off de consistencia eventual y verificamos con pruebas de contrato y p95.`,
      incident: policy_before.incidentCorrect,
      capacity: policy_before.targetCapacity,
      reviewChoice: codeReviewPolicy('S09', 42).correct,
      mentorReview: {
        reviewerName: 'Arquitecto Jefe',
        reviewerRole: 'Staff Committee',
        reviewedAt: '2026-11-16T23:55:00.000Z',
        verdict: 'APPROVED_WITH_EVIDENCE',
        criteriaComments: {
          adrQuality: 'Restricciones claras y bien trazadas.',
          tradeOffRealism: 'Trade-off realista sobre consistencia.',
          failureModes: 'Idempotencia cubre reintentos.',
          verificationRigor: 'Pruebas de replay adecuadas.',
        },
        overallNotes: 'Aprobado en comité humano sin alterar criterios del motor.',
      },
    };
    const submitted_eval = evaluateSeniorSuite(s09, 42, full_draft);
    const policy_after = missionPolicy(s09, 42);

    assert.equal(empty_eval.criteriaFingerprint, policy_before.criteriaFingerprint);
    assert.equal(submitted_eval.criteriaFingerprint, policy_before.criteriaFingerprint);
    assert.deepEqual(policy_after, policy_before);
  });

  it('Scenario L2612: Given borradores vacíos, bloqueados, fallidos y completos, When se inspeccionan canonicalGates, Then usa exclusivamente PASS/FAIL/NOT_RUN/BLOCKED/REQUIRES_REVIEW y jamás certifica cualitativos por IA', async () => {
    const { emptySeniorDraft, evaluateSeniorSuite, missionPolicy } = await import(
      '../dist/senior-suite.js'
    );
    const { codeReviewPolicy } = await import('../dist/senior-reviews.js');
    const missions = JSON.parse(readFileSync('data/senior.json', 'utf8'));
    const s14 = missions.find((m) => m.id === 'S14');
    const p = missionPolicy(s14, 7);

    const allowed = new Set(['PASS', 'FAIL', 'NOT_RUN', 'BLOCKED', 'REQUIRES_REVIEW']);

    // 1. Attempting Phase 2 with 0 Phase 1 components -> BLOCKED + NOT_RUN
    const blocked_draft = {
      ...emptySeniorDraft(),
      phase2Choice: 0,
      diagnosis: (p.diagnosisCorrect + 1) % 3,
    };
    const blocked_res = evaluateSeniorSuite(s14, 7, blocked_draft);
    for (const g of blocked_res.canonicalGates) {
      assert.ok(allowed.has(g.status), `Unexpected status ${g.status}`);
    }
    const statuses_1 = new Set(blocked_res.canonicalGates.map((g) => g.status));
    assert.ok(statuses_1.has('FAIL'));
    assert.ok(statuses_1.has('NOT_RUN'));
    assert.ok(statuses_1.has('BLOCKED'));

    // 2. Complete mechanical draft -> PASS + REQUIRES_REVIEW (qualitative gate never PASS)
    const complete_draft = {
      ...emptySeniorDraft(),
      diagnosis: p.diagnosisCorrect,
      architecture: [...p.required],
      relations: [[p.required[0], p.required[1]]],
      decision: `ADR S14 seed 7: ante tráfico ${p.scenario.traffic} y objetivo ${p.scenario.availability} instrumentamos SLI/SLO orientados a usuario, trazas p95 y alertas de burn rate asumiendo riesgo y coste de almacenamiento frente a la alternativa de medir solo CPU, y verificamos con pruebas sintéticas y monitor continuo.`,
      incident: p.incidentCorrect,
      capacity: p.targetCapacity,
      reviewChoice: codeReviewPolicy('S14', 7).correct,
      phase2Choice: p.phase2.correctIndex,
    };
    const complete_res = evaluateSeniorSuite(s14, 7, complete_draft);
    const qual_gate = complete_res.canonicalGates.find((g) => g.id === 'qualitative-adr-review');
    assert.equal(qual_gate?.status, 'REQUIRES_REVIEW');
    assert.ok(complete_res.canonicalGates.some((g) => g.status === 'PASS'));
  });
});
