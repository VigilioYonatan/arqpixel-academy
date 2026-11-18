import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const ROOT = process.cwd();

test('BDD P2 L1256 & L1257 — Capstone human rubric audit log, FNV-1a drift detection, and per-check automatic evidence', async () => {
  const { CAPSTONE_PROJECTS } = await import('../dist/features/projects/constants/projects.constants.js');
  const {
    emptyProjectSubmission,
    sanitizeProjectsState,
  } = await import('../dist/features/projects/schemas/projects.schema.js');
  const {
    appendCapstoneAuditReview,
    computeProjectDraftFingerprint,
    evaluateProjectSubmission,
    exportProjectJson,
    exportProjectMarkdown,
    resolveCapstoneAuditStatus,
  } = await import('../dist/features/projects/projects-workspace.js');

  const project = CAPSTONE_PROJECTS.find((p) => p.id === 'CAP-R06');
  assert.ok(project, 'CAP-R06 capstone definition must exist');

  // Given an empty submission
  const empty_sub = emptyProjectSubmission();
  const empty_eval = evaluateProjectSubmission(project, empty_sub);
  assert.equal(empty_eval.structurallyComplete, false);
  assert.equal(empty_eval.humanReviewRequired, true);
  assert.equal(empty_eval.auditVerificationStatus, 'UNREVIEWED');
  assert.match(empty_eval.draftFingerprint, /^fnv1a-[0-9a-f]{8}$/);
  for (const chk of empty_eval.checks) {
    assert.ok(chk.evidenceSnippet.length > 5, `Check ${chk.name} must expose evidenceSnippet`);
    assert.ok(chk.actionableFeedback.length > 10, `Check ${chk.name} must expose actionableFeedback`);
  }

  // When completing all 5 sections with CAP-R06 domain terms + checklist
  const rich_sub = {
    architectureSummary:
      'Contenedores API Checkout, Pedidos con tabla Outbox transaccional en PostgreSQL, Relay asíncrono hacia Broker y Consumidor Inventario idempotente con deduplicación.',
    alternativesAnalysis:
      'Se descarta 2PC distribuido por bloqueo entre servicios y latencia p99; se adopta Saga con compensación explícita y Transactional Outbox asumiendo consistencia eventual.',
    adrDecision:
      'ADR-01: Persistir orden y evento en la misma transacción local SQL (Outbox) y exigir Idempotency-Key en API y tabla processed_events en cada consumidor.',
    risksAndMitigations:
      'Riesgo de mensajes duplicados o desordenados mitigado con clave única event_id, DLQ auditada, backoff exponencial con jitter y alertas de lag.',
    verificationPlan:
      'Tests de integración con fallos inyectados de broker caído y reentrega doble, SLI de lag de outbox < 2s p95 y plan de rollback desactivando feature flag.',
    checklist: {
      c4Included: true,
      adrCompleted: true,
      tradeOffsExplicit: true,
      verificationDefined: true,
      limitationsDeclared: true,
    },
    updatedAt: '2026-11-16T23:00:00.000Z',
  };

  const full_eval = evaluateProjectSubmission(project, rich_sub);
  assert.equal(full_eval.structurallyComplete, true);
  assert.equal(full_eval.passedMechanicalCount, full_eval.totalMechanicalCount);
  assert.ok(full_eval.matchedDomainTerms.length >= 2);
  assert.equal(full_eval.auditVerificationStatus, 'UNREVIEWED');
  // Open reasoning check NEVER ceases to be REQUIRES_REVIEW (ADR-0003)
  const review_gate = full_eval.checks.find((c) => c.status === 'REQUIRES_REVIEW');
  assert.ok(review_gate, 'Human review gate must preserve REQUIRES_REVIEW');

  // When a human reviewer records a 4-dimension rubric verdict
  const reviewed_sub = appendCapstoneAuditReview(
    rich_sub,
    {
      reviewerName: 'Dra. Sofía Morales',
      reviewerRole: 'Comité Principal de Arquitectura',
      verdict: 'APPROVED_WITH_EVIDENCE',
      scores: {
        contextClarity: 4,
        boundaryIntegrity: 4,
        tradeoffHonesty: 3,
        verificationRigor: 4,
      },
      auditComment: 'Excelente delimitación de Outbox, idempotencia y compensación de Saga.',
    },
    '2026-11-16T23:05:00.000Z',
  );

  assert.equal(reviewed_sub.auditTrail?.length, 1);
  assert.equal(resolveCapstoneAuditStatus(reviewed_sub), 'VERIFIED_MATCHING_DRAFT');
  assert.equal(
    reviewed_sub.auditTrail[0].draftFingerprint,
    computeProjectDraftFingerprint(rich_sub),
  );

  // Then editing the draft after human review triggers deterministic drift detection
  const drifted_sub = {
    ...reviewed_sub,
    adrDecision: `${reviewed_sub.adrDecision} Cambio posterior sin re-auditar.`,
  };
  assert.equal(resolveCapstoneAuditStatus(drifted_sub), 'DRAFT_MODIFIED_AFTER_REVIEW');

  // Sanitization & v2 Markdown/JSON exports preserve auditTrail intact
  const sanitized = sanitizeProjectsState({ 'CAP-R06': reviewed_sub });
  assert.equal(sanitized['CAP-R06'].auditTrail?.length, 1);

  const eval_after_review = evaluateProjectSubmission(project, reviewed_sub);
  const md = exportProjectMarkdown(project, reviewed_sub, eval_after_review);
  assert.match(md, /Dra\. Sofía Morales/);
  assert.match(md, /VERIFIED_MATCHING_DRAFT/);
  assert.match(md, /REQUIRES_REVIEW/);

  const json_doc = JSON.parse(exportProjectJson(project, reviewed_sub, eval_after_review));
  assert.equal(json_doc.schemaVersion, 2);
  assert.equal(json_doc.submission.auditTrail.length, 1);
});

test('BDD §21.2 Mapa y aula (L2592–L2596) + Live Architecture Blueprints: 54-node DAG, safe prose XSS protection, and coming_soon guard', async () => {
  const { mergeValidatedCurriculum, learningPathsCatalogSchema } = await import(
    '../dist/features/curriculum/schemas/curriculum.schema.js'
  );
  const { missionsCatalogSchema } = await import(
    '../dist/features/senior/schemas/senior.schema.js'
  );
  const {
    buildCurriculumMapModel,
    renderCurriculumMapHtml,
    validateCurriculumMapDag,
  } = await import('../dist/features/curriculum/learning-path-map.js');
  const { renderLessonClassroomHtml } = await import(
    '../dist/features/curriculum/lesson-classroom.js'
  );
  const {
    HOME_LIVE_BLUEPRINTS,
    formatSafeArchitecturalProseHtml,
    renderHomeInteractiveBlueprintHtml,
    resolveModuleContentReadiness,
  } = await import('../dist/features/shared/ui/visual-clarity.js');

  const raw_modules = JSON.parse(readFileSync(resolve(ROOT, 'data/modules.json'), 'utf8'));
  const raw_deep = JSON.parse(readFileSync(resolve(ROOT, 'data/deep-dives.json'), 'utf8'));
  const raw_senior = JSON.parse(readFileSync(resolve(ROOT, 'data/senior.json'), 'utf8'));
  const raw_paths = JSON.parse(readFileSync(resolve(ROOT, 'data/paths.json'), 'utf8'));

  const modules = mergeValidatedCurriculum(raw_modules, raw_deep);
  const missions = missionsCatalogSchema.parse(raw_senior, 'senior.json');
  const paths = learningPathsCatalogSchema.parse(raw_paths, 'paths.json');

  // 1. 54 validated nodes & DAG badge
  const all_ids = [...modules.map((m) => m.id), ...missions.map((s) => s.id)];
  assert.equal(all_ids.length, 54);
  const dag = validateCurriculumMapDag(all_ids);
  assert.equal(dag.valid, true);
  assert.deepEqual(dag.errors, []);

  const map_model = buildCurriculumMapModel(modules, missions, paths, ['B01'], []);
  const map_html = renderCurriculumMapHtml(
    map_model,
    map_model.nodes,
    { stage: 'ALL', status: 'ALL', pathId: 'ALL', query: '' },
    'B01',
    paths,
  );
  assert.match(map_html, /data-dag-verified="true"/);
  assert.match(map_html, /54\/54 nodos · 0 ciclos · DAG validado/);
  assert.match(map_html, /class="arch-flow-edge"/);

  // 2. A module without real content is ALWAYS marked coming_soon, NEVER completed (§21.2 L2593 & L2596)
  const stub_module = {
    ...modules[0],
    id: 'B99',
    lesson: 'En construcción',
    question: '',
    options: ['Solo una'],
  };
  assert.equal(
    resolveModuleContentReadiness(stub_module, ['B99']),
    'coming_soon',
    'Stub module must never be marked completed even if its ID appears in completedIds',
  );
  assert.equal(resolveModuleContentReadiness(modules[0], ['B01']), 'completed');
  assert.equal(resolveModuleContentReadiness(modules[0], []), 'available');

  const stub_classroom_html = renderLessonClassroomHtml({
    currentModule: stub_module,
    allModules: [stub_module],
    completedModuleIds: ['B99'],
    selectedAnswer: 0,
    savedNote: '',
    seniorModeActive: false,
    sidebarExpanded: true,
    sidebarQuery: '',
    routePrefix: 'aprender',
  });
  assert.match(stub_classroom_html, /data-module-readiness="coming_soon"/);
  assert.match(stub_classroom_html, /Próximamente/);
  assert.match(stub_classroom_html, /id="complete-lesson" disabled/);

  // 3. Safe architectural prose escapes XSS while rendering inline code pills (§21.2 L2594)
  const formatted = formatSafeArchitecturalProseHtml(
    'Usa `Idempotency-Key` en HTTP y bloquea <script>alert("xss")</script> siempre.',
  );
  assert.ok(!formatted.includes('<script>'), 'Must escape raw script tags');
  assert.ok(formatted.includes('&lt;script&gt;'));
  assert.ok(formatted.includes('<code class="inline-code-pill">Idempotency-Key</code>'));

  // 4. All 4 Live Architecture Blueprints render crisp animated SVG & tabular metrics without inline style=
  assert.equal(HOME_LIVE_BLUEPRINTS.length, 4);
  for (const bp of HOME_LIVE_BLUEPRINTS) {
    const bp_html = renderHomeInteractiveBlueprintHtml(bp.id);
    assert.match(bp_html, /class="arch-flow-edge"/);
    assert.ok(bp_html.includes(bp.latencyP95));
    assert.ok(!/\bstyle\s*=\s*["']/.test(bp_html), 'Zero inline style attributes allowed');
  }
});
