import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mergeValidatedCurriculum } from '../dist/features/curriculum/schemas/curriculum.schema.js';
import {
  buildSpecializationDetailModel,
  renderSpecializationDetailHtml,
} from '../dist/features/curriculum/specialization-detail.js';
import {
  buildClassroomModuleHref,
  filterClassroomSidebarModules,
  renderLessonClassroomHtml,
} from '../dist/features/curriculum/lesson-classroom.js';
import { CAPSTONE_PROJECTS } from '../dist/features/projects/constants/projects.constants.js';
import {
  emptyProjectSubmission,
  sanitizeProjectsState,
} from '../dist/features/projects/schemas/projects.schema.js';
import {
  evaluateProjectSubmission,
  exportProjectJson,
  exportProjectMarkdown,
  renderProjectsCatalogHtml,
  renderProjectWorkspaceHtml,
} from '../dist/features/projects/projects-workspace.js';
import { LAB_STUDIOS } from '../dist/features/labs/constants/labs.constants.js';

const rawModules = JSON.parse(readFileSync('data/modules.json', 'utf8'));
const rawDeep = JSON.parse(readFileSync('data/deep-dives.json', 'utf8'));
const missions = JSON.parse(readFileSync('data/senior.json', 'utf8'));
const paths = JSON.parse(readFileSync('data/paths.json', 'utf8'));
const modules = mergeValidatedCurriculum(rawModules, rawDeep);

test('ARQ-006: las 8 especializaciones construyen vistas individuales válidas en #/rutas/:id y manejan ID inválido', () => {
  for (const p of paths) {
    const detail = buildSpecializationDetailModel(p.id, paths, modules, missions, ['B05', 'B08'], ['S02'], ['CAP-R01']);
    assert.ok(detail !== null, `Falta detalle para ${p.id}`);
    assert.equal(detail.steps.length, p.modules.length);
    assert.ok(detail.totalReadingMinutes >= p.modules.length * 5);
    assert.ok(detail.relatedMissions.length >= 1, `${p.id} debe vincular misiones Senior`);
    assert.ok(detail.recommendedLabs.length >= 1, `${p.id} debe vincular laboratorios`);
    assert.equal(detail.capstoneProjectId, `CAP-${p.id}`);

    const html = renderSpecializationDetailHtml(detail, paths);
    assert.ok(html.includes(p.title));
    assert.ok(html.includes(`#/proyectos/CAP-${p.id}`));
  }

  assert.equal(buildSpecializationDetailModel('R99', paths, modules, missions, [], []), null);
  const notFoundHtml = renderSpecializationDetailHtml(null, paths);
  assert.ok(notFoundHtml.includes('Especialización desconocida'));
});

test('ARQ-007: aula #/aprender/:id soporta ?senior=1, alias #/modulo/:id e índice colapsable accesible de 36 lecciones', () => {
  assert.equal(buildClassroomModuleHref('I06', 'aprender', true), '#/aprender/I06?senior=1');
  assert.equal(buildClassroomModuleHref('I06', 'aprender', false), '#/aprender/I06');
  assert.equal(buildClassroomModuleHref('I06', 'modulo', true), '#/modulo/I06');

  const filtered = filterClassroomSidebarModules(modules, 'hexagonal');
  assert.ok(filtered.some((m) => m.id === 'I07'));

  const modI07 = modules.find((m) => m.id === 'I07');
  const html = renderLessonClassroomHtml({
    currentModule: modI07,
    allModules: modules,
    completedModuleIds: ['B01', 'I06'],
    selectedAnswer: modI07.correct,
    savedNote: 'Nota segura <script>alert(1)</script>',
    seniorModeActive: true,
    sidebarExpanded: true,
    sidebarQuery: '',
    routePrefix: 'aprender',
  });

  assert.equal(html.includes('<script>'), false);
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(html.includes('aria-label="Índice de las 36 lecciones"'));
  assert.ok(html.includes('aria-current="page"'));
  assert.ok(html.includes('id="toggle-classroom-index"'));
  assert.ok(html.includes('id="check-senior-lesson"'));
  assert.ok(html.includes('id="complete-lesson"'));
});

test('ARQ-008: los 11 proyectos integradores/Capstones validan estructura, exigen REQUIRES_REVIEW y exportan MD/JSON', () => {
  assert.equal(CAPSTONE_PROJECTS.length, 11);
  const validModIds = new Set(modules.map((m) => m.id));
  const validMissionIds = new Set(missions.map((s) => s.id));
  const validLabIds = new Set(LAB_STUDIOS.map((l) => l.id));

  for (const proj of CAPSTONE_PROJECTS) {
    assert.ok(proj.relatedModules.every((id) => validModIds.has(id)), `Módulo inválido en ${proj.id}`);
    assert.ok(proj.relatedMissions.every((id) => validMissionIds.has(id)), `Misión inválida en ${proj.id}`);
    assert.ok(validLabIds.has(proj.recommendedLabId), `Lab inválido en ${proj.id}`);
  }

  const capR06 = CAPSTONE_PROJECTS.find((p) => p.id === 'CAP-R06');
  const emptyEval = evaluateProjectSubmission(capR06, emptyProjectSubmission());
  assert.equal(emptyEval.structurallyComplete, false);
  assert.equal(emptyEval.passedMechanicalCount, 0);
  assert.equal(emptyEval.humanReviewRequired, true);
  assert.ok(emptyEval.checks.some((c) => c.status === 'NOT_RUN'));
  assert.ok(emptyEval.checks.some((c) => c.status === 'REQUIRES_REVIEW'));

  const completeSub = {
    architectureSummary:
      'Definimos contenedores separados para API de Pedidos, Worker de Pagos, base de datos PostgreSQL con tabla outbox y pasarela externa.',
    alternativesAnalysis:
      'Descartamos la alternativa de transacciones distribuidas 2PC frente a Sagas por el alto coste de bloqueo y acoplamiento temporal.',
    adrDecision:
      'Adoptamos Transactional Outbox con clave de idempotencia persistida y saga de compensacion auditable para garantizar cero cobros dobles.',
    risksAndMitigations:
      'Riesgo de saturación del proveedor bancario y mensajes venenosos; mitigamos con timeout, circuit breaker, backoff con jitter y cola DLQ.',
    verificationPlan:
      'Ejecutaremos pruebas de contrato, inyección de fallos en red, monitor de SLO de conciliación < 60 s y plan de rollback por feature flag.',
    checklist: {
      c4Included: true,
      adrCompleted: true,
      tradeOffsExplicit: true,
      verificationDefined: true,
      limitationsDeclared: true,
    },
    updatedAt: '2026-11-16T19:00:00.000Z',
  };

  const fullEval = evaluateProjectSubmission(capR06, completeSub);
  assert.equal(fullEval.structurallyComplete, true);
  assert.equal(fullEval.passedMechanicalCount, 5);
  assert.equal(fullEval.humanReviewRequired, true);

  const md = exportProjectMarkdown(capR06, completeSub, fullEval);
  assert.ok(md.includes('# CAP-R06'));
  assert.ok(md.includes('REQUIRES_REVIEW'));

  const jsonDoc = JSON.parse(exportProjectJson(capR06, completeSub, fullEval));
  assert.equal(jsonDoc.kind, 'capstone-dossier');
  assert.equal(jsonDoc.evaluation.structurallyComplete, true);

  // Sanitization & XSS tests
  const sanitized = sanitizeProjectsState({ 'CAP-R06': completeSub, INVENTADO: completeSub });
  assert.ok(sanitized && sanitized['CAP-R06']);
  assert.equal(sanitized.INVENTADO, undefined);

  const poisoned = JSON.parse('{"__proto__":{"polluted":true}}');
  assert.equal(sanitizeProjectsState(poisoned), null);

  const catalogHtml = renderProjectsCatalogHtml(sanitized, ['A02', 'A05'], 'specialization_capstone');
  assert.ok(catalogHtml.includes('CAP-R06'));
  const wsHtml = renderProjectWorkspaceHtml(capR06, completeSub, fullEval);
  assert.ok(wsHtml.includes('5<small>/5</small>'));
});
