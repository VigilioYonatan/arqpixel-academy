/**
 * §23 L2676–L2694 & §25 L2731: Programmatic Definition-of-Done (DoD) Audit for all 36 curriculum modules
 * (`B01–A12`) and all 18 Senior Mode missions (`S01–S18`).
 * Registers each item as `implemented` in `reports/curriculum-dod-verification.json` ONLY after passing
 * every structural, visual, interactive, multi-seed, and honesty (`REQUIRES_REVIEW`) invariant.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import {
  CURRICULUM_PREREQUISITES,
  MODULE_CANONICAL_REFERENCES,
} from '../dist/features/curriculum/constants/curriculum.constants.js';
import { validateCurriculumMapDag } from '../dist/features/curriculum/learning-path-map.js';
import {
  getLessonEnrichment,
  renderLessonArchitectureSvg,
} from '../dist/features/curriculum/lesson-visuals.js';
import {
  evaluateLessonWorkbench,
  getLessonWorkbench,
} from '../dist/features/curriculum/lesson-workbench.js';
import { mergeValidatedCurriculum } from '../dist/features/curriculum/schemas/curriculum.schema.js';
import { missionsCatalogSchema } from '../dist/features/senior/schemas/senior.schema.js';
import { renderSeniorReasonedSolutionGuideHtml } from '../dist/features/senior/senior-ux-views.js';
import { resolveModuleContentReadiness } from '../dist/features/shared/ui/visual-clarity.js';
import { codeReviewPolicy } from '../dist/senior-reviews.js';
import {
  emptySeniorDraft,
  evaluateSeniorSuite,
  exportSeniorDossierV2,
  missionPolicy,
  seniorDossierMarkdown,
} from '../dist/senior-suite.js';

const REGRESSION_SEEDS = [0, 42, 777];

export function auditCurriculumAndSeniorDod() {
  const raw_modules = JSON.parse(readFileSync('data/modules.json', 'utf8'));
  const raw_deep_dives = JSON.parse(readFileSync('data/deep-dives.json', 'utf8'));
  const raw_missions = JSON.parse(readFileSync('data/senior.json', 'utf8'));

  const modules = mergeValidatedCurriculum(raw_modules, raw_deep_dives);
  const missions = missionsCatalogSchema.parse(raw_missions, 'senior.json');

  const issues = [];
  const all_node_ids = [...modules.map((m) => m.id), ...missions.map((s) => s.id)];
  const dag = validateCurriculumMapDag(all_node_ids, CURRICULUM_PREREQUISITES);
  if (!dag.valid) {
    issues.push(...dag.errors.map((e) => `DAG: ${e}`));
  }

  const verified_modules = [];
  for (const mod of modules) {
    const mod_issues = [];
    const readiness = resolveModuleContentReadiness(mod, []);
    if (readiness !== 'available') {
      mod_issues.push(`readiness=${readiness} (expected available)`);
    }
    if (!Array.isArray(CURRICULUM_PREREQUISITES[mod.id])) {
      mod_issues.push('missing prerequisites entry');
    }
    if (mod.concept.trim().length < 8 || mod.lesson.trim().length < 55) {
      mod_issues.push('insufficient objective or technical explanation');
    }
    if (!mod.comparison || !mod.reason || !mod.metric) {
      mod_issues.push('missing comparison, trade-off reason, or verification metric');
    }

    const enrichment = getLessonEnrichment(mod.id);
    const svg_markup = enrichment ? renderLessonArchitectureSvg(enrichment) : '';
    if (!enrichment || !svg_markup.includes('<svg')) {
      mod_issues.push('missing SVG visual diagram');
    }
    if (
      !enrichment ||
      enrichment.badCodeTs.trim().length < 20 ||
      enrichment.counterexample.trim().length < 20
    ) {
      mod_issues.push('missing counterexample code or antipattern boundary note');
    }

    const wb = getLessonWorkbench(mod.id);
    if (!wb || wb.options.length !== 4 || wb.requiredIndices.length !== 2) {
      mod_issues.push('missing 2/4 practical workbench');
    } else {
      const pass_eval = evaluateLessonWorkbench(mod.id, wb.requiredIndices);
      const wrong_idx = [0, 1, 2, 3].filter((i) => !wb.requiredIndices.includes(i));
      const fail_eval = evaluateLessonWorkbench(mod.id, wrong_idx);
      if (pass_eval.status !== 'PASS' || fail_eval.status !== 'FAIL') {
        mod_issues.push('workbench positive/negative evaluation incoherent');
      }
    }

    const refs = MODULE_CANONICAL_REFERENCES[mod.id] ?? [];
    if (refs.length < 2) {
      mod_issues.push('missing canonical bibliographic references');
    }

    if (mod_issues.length > 0) {
      issues.push(`Module ${mod.id}: ${mod_issues.join('; ')}`);
    } else {
      verified_modules.push({
        id: mod.id,
        level: mod.level,
        status: 'implemented',
        referencesCount: refs.length,
      });
    }
  }

  const verified_missions = [];
  for (const mission of missions) {
    const mis_issues = [];
    if (mission.brief.trim().length < 12 || mission.decision.trim().length < 8) {
      mis_issues.push('insufficient mission brief or central decision');
    }

    // Negative check on empty draft
    const neg = evaluateSeniorSuite(mission, 0, emptySeniorDraft());
    if (neg.complete || neg.score === 100) {
      mis_issues.push('empty draft must not pass Senior evaluation');
    }

    const fingerprints = new Set();
    for (const seed of REGRESSION_SEEDS) {
      const p1 = missionPolicy(mission, seed);
      const p2 = missionPolicy(mission, seed);
      if (p1.criteriaFingerprint !== p2.criteriaFingerprint) {
        mis_issues.push(`non-deterministic fingerprint for seed ${seed}`);
      }
      fingerprints.add(p1.criteriaFingerprint);

      const req_a = p1.scenario.requirements[0]?.split(': ')[1] ?? '';
      const req_b = p1.scenario.requirements[1]?.split(': ')[1] ?? '';
      const review_policy = codeReviewPolicy(mission.id, seed);
      const valid_draft = {
        ...emptySeniorDraft(),
        diagnosis: p1.diagnosisCorrect,
        architecture: [...p1.required],
        relations: [[p1.required[0], p1.required[1]]],
        decision:
          `Decisión para ${mission.id} bajo ${req_a} y objetivo ${req_b}: ` +
          `adoptamos ${p1.required.join(' + ')} tras evaluar una alternativa descartada por mayor riesgo operativo y coste. ` +
          `Verificaremos mediante pruebas automatizadas, monitorización SLO y ${p1.playbook.verification}.`,
        incident: p1.incidentCorrect,
        capacity: p1.targetCapacity,
        reviewChoice: review_policy.correct,
      };
      const pos = evaluateSeniorSuite(mission, seed, valid_draft);
      if (!pos.complete || pos.score !== 100 || pos.checks.length !== 6) {
        mis_issues.push(`positive fixture failed on seed ${seed} (score=${pos.score})`);
      }
      const has_requires_review = pos.canonicalGates.some((g) => g.status === 'REQUIRES_REVIEW');
      const has_fake_ai = JSON.stringify(pos).toLowerCase().includes('aprobado por ia');
      if (!has_requires_review || has_fake_ai) {
        mis_issues.push(`missing REQUIRES_REVIEW or fake AI approval on seed ${seed}`);
      }
    }

    if (fingerprints.size < 2) {
      mis_issues.push('regression seeds did not produce distinct scenario fingerprints');
    }

    const p0 = missionPolicy(mission, 0);
    const md = seniorDossierMarkdown(mission, 0, emptySeniorDraft());
    const dossier = exportSeniorDossierV2(mission, 0, emptySeniorDraft(), null);
    const guide_html = renderSeniorReasonedSolutionGuideHtml({
      missionId: mission.id,
      missionTitle: mission.title,
      missionDecision: mission.decision,
      seed: 0,
      traffic: p0.scenario.traffic,
      availability: p0.scenario.availability,
      team: p0.scenario.team,
      budget: p0.scenario.budget,
      failure: p0.scenario.failure,
      playbook: p0.playbook,
      targetCapacityRpm: p0.targetCapacity,
    });
    if (
      !md.includes('Guía de solución razonada y alternativas defendibles') ||
      dossier.mission.id !== mission.id ||
      !guide_html.includes('data-senior-solution-guide="true"')
    ) {
      mis_issues.push('missing reasoned solution guide or dossier export');
    }

    if (mis_issues.length > 0) {
      issues.push(`Mission ${mission.id}: ${mis_issues.join('; ')}`);
    } else {
      verified_missions.push({
        id: mission.id,
        status: 'implemented',
        regressionSeedsVerified: REGRESSION_SEEDS,
      });
    }
  }

  return {
    ok: issues.length === 0 && verified_modules.length === 36 && verified_missions.length === 18,
    implementedModulesCount: verified_modules.length,
    expectedModulesCount: 36,
    implementedMissionsCount: verified_missions.length,
    expectedMissionsCount: 18,
    unverifiedCount: 54 - (verified_modules.length + verified_missions.length),
    issues,
    modules: verified_modules,
    missions: verified_missions,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = auditCurriculumAndSeniorDod();
  if (!report.ok) {
    console.error(`DOD MANIFEST FAIL:\n - ${report.issues.join('\n - ')}`);
    process.exitCode = 1;
  } else {
    mkdirSync('reports', { recursive: true });
    writeFileSync(
      'reports/curriculum-dod-verification.json',
      `${JSON.stringify(
        {
          schema_version: 1,
          ok: report.ok,
          implementedModulesCount: report.implementedModulesCount,
          implementedMissionsCount: report.implementedMissionsCount,
          unverifiedCount: report.unverifiedCount,
          regressionSeeds: REGRESSION_SEEDS,
          modules: report.modules,
          missions: report.missions,
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
    console.log(
      `DOD MANIFEST PASS: ${report.implementedModulesCount}/36 modules & ${report.implementedMissionsCount}/18 Senior missions verified as implemented`,
    );
  }
}
