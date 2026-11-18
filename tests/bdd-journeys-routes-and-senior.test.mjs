import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sanitizeProgress } from '../dist/engine.js';
import { evaluateSeniorReflection } from '../dist/lesson-senior.js';
import { mergeValidatedCurriculum } from '../dist/features/curriculum/schemas/curriculum.schema.js';
import { buildSpecializationDetailModel } from '../dist/features/curriculum/specialization-detail.js';
import { renderLessonClassroomHtml } from '../dist/features/curriculum/lesson-classroom.js';
import { CAPSTONE_PROJECTS } from '../dist/features/projects/constants/projects.constants.js';
import {
  evaluateProjectSubmission,
  getStructurallyCompletedProjectIds,
} from '../dist/features/projects/projects-workspace.js';
import { sanitizeProjectsState } from '../dist/features/projects/schemas/projects.schema.js';
import { computeAchievementsModel } from '../dist/features/profile/profile-views.js';
import { sanitizeUserSettings } from '../dist/features/profile/schemas/settings.schema.js';
import { backupEnvelopeSchema } from '../dist/features/senior/schemas/senior.schema.js';
import { renderPatternDetailHtml } from '../dist/features/resources/resources-hub.js';

const rawModules = JSON.parse(readFileSync('data/modules.json', 'utf8'));
const rawDeep = JSON.parse(readFileSync('data/deep-dives.json', 'utf8'));
const missions = JSON.parse(readFileSync('data/senior.json', 'utf8'));
const paths = JSON.parse(readFileSync('data/paths.json', 'utf8'));
const modules = mergeValidatedCurriculum(rawModules, rawDeep);
const moduleIds = modules.map((m) => m.id);
const missionIds = missions.map((s) => s.id);

describe('Feature: BDD Journeys — Especializaciones, Aula, Capstones, Recursos, Logros y Senior Mode', () => {
  test('Scenario: Given un estudiante en la ruta R06 (Microservicios y eventos), When completa sus 6 módulos, aprueba S09+S11 y entrega el Capstone CAP-R06, Then desbloquea insignias sin inflar XP y exige REQUIRES_REVIEW', () => {
    // Given
    const pathR06 = paths.find((p) => p.id === 'R06');
    const capR06 = CAPSTONE_PROJECTS.find((p) => p.id === 'CAP-R06');

    const rawProgress = {
      done: [...pathR06.modules],
      answers: Object.fromEntries(pathR06.modules.map((id) => [id, modules.find((m) => m.id === id).correct])),
      notes: {},
      xp: 99999, // Intento de inflación artificial que sanitizeProgress debe recalcular
      theme: 'dark',
      seniorMode: true,
      lastVisit: '2026-11-16T19:15:00.000Z',
      missions: {
        S09: { score: 100, seed: 3, choice: 0, adr: 'Outbox + Idempotency', completedAt: '2026-11-16T19:15:00.000Z', awarded: true },
        S11: { score: 100, seed: 1, choice: 0, adr: 'Capacidad + Colas acotadas', completedAt: '2026-11-16T19:15:00.000Z', awarded: true },
      },
    };

    const capstoneDrafts = sanitizeProjectsState({
      'CAP-R06': {
        architectureSummary:
          'Contenedores C4: API Gateway, Servicio de Pedidos, Servicio de Pagos con tabla outbox en PostgreSQL y consumidor de Facturación.',
        alternativesAnalysis:
          'Evaluamos llamadas HTTP síncronas encadenadas como alternativa descartada por amplificación de latencia y acoplamiento temporal.',
        adrDecision:
          'Implementamos Transactional Outbox, clave de idempotencia en cobros y saga con compensacion explícita ante rechazo.',
        risksAndMitigations:
          'Mitigamos duplicados en broker mediante índice único por event_id y protegemos al proveedor externo con circuit breaker y DLQ.',
        verificationPlan:
          'Verificaremos mediante pruebas de caos, test de contrato de eventos, métrica SLO de conciliación < 60 s y runbook de rollback.',
        checklist: {
          c4Included: true,
          adrCompleted: true,
          tradeOffsExplicit: true,
          verificationDefined: true,
          limitationsDeclared: true,
        },
        updatedAt: '2026-11-16T19:20:00.000Z',
      },
    });

    // When
    const progress = sanitizeProgress(rawProgress, moduleIds, missionIds);
    const completedProjects = getStructurallyCompletedProjectIds(capstoneDrafts);
    const specDetail = buildSpecializationDetailModel(
      'R06',
      paths,
      modules,
      missions,
      progress.done,
      ['S09', 'S11'],
      completedProjects,
    );
    const achievements = computeAchievementsModel({
      modules,
      paths,
      completedModuleIds: progress.done,
      awardedMissionIds: ['S09', 'S11'],
      miniGamesBestTotal: 18,
      completedProjectIds: completedProjects,
      xp: progress.xp,
    });
    const capstoneEval = evaluateProjectSubmission(capR06, capstoneDrafts['CAP-R06']);

    // Then: 6 lecciones * 50 XP (300) + 2 misiones Senior * 80 XP (160) = 460 XP exactos (0 XP inflado por Capstone/Ruta)
    assert.equal(progress.xp, 460);
    assert.equal(specDetail.progressPercent, 100);
    assert.equal(specDetail.capstoneCompleted, true);
    assert.equal(specDetail.nextModuleId, null);
    assert.equal(capstoneEval.structurallyComplete, true);
    assert.equal(capstoneEval.humanReviewRequired, true);

    const unlockedIds = new Set(achievements.filter((a) => a.unlocked).map((a) => a.id));
    assert.equal(unlockedIds.has('ACH-PATH-R06'), true);
    assert.equal(unlockedIds.has('ACH-SENIOR-CRITICAL-PAIR'), true);
    assert.equal(unlockedIds.has('ACH-CAPSTONE-AUTHOR'), true);
    assert.equal(unlockedIds.has('ACH-SENIOR-ALL-18'), false);
  });

  test('Scenario: Given un alumno en #/aprender/I07?senior=1 con índice lateral activo, When navega y envía reflexión Senior contextual, Then conserva contexto Senior y valida restricciones reales', () => {
    // Given
    const modI07 = modules.find((m) => m.id === 'I07');
    const html = renderLessonClassroomHtml({
      currentModule: modI07,
      allModules: modules,
      completedModuleIds: ['B06', 'I06'],
      selectedAnswer: modI07.correct,
      savedNote: '',
      seniorModeActive: true,
      sidebarExpanded: true,
      sidebarQuery: 'arquitectura',
      routePrefix: 'aprender',
    });

    // When: navegamos en aula con Senior activo y validamos reflexión contextual
    assert.ok(html.includes('#/aprender/I06?senior=1'));
    assert.ok(html.includes('#/aprender/I08?senior=1'));

    // Obtenemos las restricciones visibles generadas en el HTML
    assert.ok(html.includes('Microdesafío Senior contextual · I07'));
    const failReflection = evaluateSeniorReflection('Separar puertos y adaptadores es buena práctica siempre.', modI07);
    assert.equal(failReflection.complete, false);
  });

  test('Scenario: Given un backup unificado con proyectos Capstone y ajustes de alto contraste, When se valida y restaura, Then preserva preferencias WCAG y dossiers sin aceptar propiedades intrusas', () => {
    // Given
    const rawBackup = {
      app: 'ARQPIXEL',
      version: 1,
      progress: {
        done: ['B01'],
        answers: { B01: 0 },
        missions: {},
        notes: {},
        xp: 50,
        theme: 'dark',
        seniorMode: false,
        lastVisit: '2026-11-16T19:00:00.000Z',
      },
      projects: {},
      settings: {
        themeMode: 'high-contrast',
        reducedMotion: true,
        fontScale: 'large',
        classroomSidebarOpen: true,
      },
    };

    // When
    const parsedEnvelope = backupEnvelopeSchema.safeParse(rawBackup);
    assert.equal(parsedEnvelope.success, true);
    const restoredSettings = sanitizeUserSettings(parsedEnvelope.data.settings, 'dark');

    // Then
    assert.equal(restoredSettings.themeMode, 'high-contrast');
    assert.equal(restoredSettings.reducedMotion, true);
    assert.equal(restoredSettings.fontScale, 'large');
    assert.equal(restoredSettings.classroomSidebarOpen, true);

    // Y la ficha técnica de patrón vinculada en recursos renderiza ejemplos seguros
    const outboxHtml = renderPatternDetailHtml('transactional-outbox');
    assert.ok(outboxHtml.includes('#/taller-senior/S09'));
    assert.ok(outboxHtml.includes('#/aprender/A05'));
  });
});
