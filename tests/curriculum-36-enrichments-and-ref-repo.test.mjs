import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

import { mergeValidatedCurriculum } from '../dist/features/curriculum/schemas/curriculum.schema.js';
import { VALIDATED_LESSON_ENRICHMENTS } from '../dist/features/curriculum/constants/lesson-enrichments.constants.js';
import {
  getLessonEnrichment,
  renderLessonArchitectureSvg,
  renderLessonMermaidSource,
} from '../dist/features/curriculum/lesson-visuals.js';
import { renderLessonClassroomHtml } from '../dist/features/curriculum/lesson-classroom.js';
import {
  exportReferenceNestjsGuideMarkdown,
  renderProjectsCatalogHtml,
} from '../dist/features/projects/projects-workspace.js';

import { createOrdersReferenceModule } from '../examples/nexoshop-reference-nestjs/dist/modules/orders/orders.module.js';

const rawModules = JSON.parse(readFileSync('data/modules.json', 'utf8'));
const rawDeep = JSON.parse(readFileSync('data/deep-dives.json', 'utf8'));
const modules = mergeValidatedCurriculum(rawModules, rawDeep);

test('ARQ-018: las 36 lecciones (B01–A12) poseen diagrama SVG/Mermaid único, snippets ✅/❌, contraejemplo y enlace a laboratorio', () => {
  assert.equal(modules.length, 36);
  assert.equal(VALIDATED_LESSON_ENRICHMENTS.length, 36);

  const seenTitles = new Set();
  const seenGoodSnippets = new Set();

  for (const mod of modules) {
    const enrichment = getLessonEnrichment(mod.id);
    assert.ok(enrichment, `Falta enriquecimiento visual/código en módulo ${mod.id}`);
    assert.equal(seenTitles.has(enrichment.diagramTitle), false, `Título duplicado en ${mod.id}`);
    assert.equal(seenGoodSnippets.has(enrichment.goodCodeTs), false, `Snippet ✅ duplicado en ${mod.id}`);
    seenTitles.add(enrichment.diagramTitle);
    seenGoodSnippets.add(enrichment.goodCodeTs);

    const svg = renderLessonArchitectureSvg(enrichment);
    assert.match(svg, /<svg/);
    assert.match(svg, /role="img"/);
    assert.match(svg, /<title>/);
    assert.doesNotMatch(svg, /<script>/);

    const mmd = renderLessonMermaidSource(enrichment);
    assert.ok(mmd.startsWith('flowchart LR\n'));

    const classroomHtml = renderLessonClassroomHtml({
      currentModule: mod,
      allModules: modules,
      completedModuleIds: [],
      selectedAnswer: undefined,
      savedNote: '',
      seniorModeActive: false,
      sidebarExpanded: false,
      sidebarQuery: '',
      routePrefix: 'aprender',
    });

    assert.match(classroomHtml, /DISEÑO DEFENDIBLE/);
    assert.match(classroomHtml, /ANTI-PATRÓN FRECUENTE/);
    assert.match(classroomHtml, /Contraejemplo/);
    assert.ok(
      classroomHtml.includes(`href="#/laboratorio/${enrichment.labId}"`),
      `${mod.id} debe enlazar a #/laboratorio/${enrichment.labId}`,
    );
  }
});

test('ARQ-019: examples/nexoshop-reference-nestjs es ejecutable offline y está conectado a #/proyectos y misiones S04, S06 y S09', async () => {
  assert.equal(existsSync('examples/nexoshop-reference-nestjs/README.md'), true);
  assert.equal(existsSync('examples/nexoshop-reference-nestjs/package.json'), true);
  assert.equal(existsSync('examples/nexoshop-reference-nestjs/contracts'), false);

  // Execute real flow from compiled reference module
  const { controller, repository } = createOrdersReferenceModule();
  repository.seedStock('tenant-arq', 'SKU-BOOK-DDD', 4, 1);

  const response = await controller.placeOrder({
    principal: { actor_id: 'architect-1', tenant_id: 'tenant-arq' },
    idempotency_key: 'idem-ref-check-01',
    raw_body: {
      customer_id: 'reader-01',
      lines: [{ sku: 'SKU-BOOK-DDD', quantity: 2, unit_price_decimal: '75.50' }],
    },
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.data.total_decimal, '151.00');
  assert.equal(repository.getStockSnapshot('tenant-arq', 'SKU-BOOK-DDD')?.available_qty, 2);
  assert.equal(repository.getPendingOutboxEvents().length, 1);

  // Check UI links in #/proyectos and Senior Suite / app bundle
  const projectsHtml = renderProjectsCatalogHtml({}, []);
  assert.match(projectsHtml, /examples\/nexoshop-reference-nestjs\//);
  assert.match(projectsHtml, /#\/taller-senior\/S04/);
  assert.match(projectsHtml, /#\/taller-senior\/S06/);
  assert.match(projectsHtml, /#\/taller-senior\/S09/);

  const guideMd = exportReferenceNestjsGuideMarkdown();
  assert.match(guideMd, /npm test/);
  assert.match(guideMd, /S04/);
  assert.match(guideMd, /S06/);
  assert.match(guideMd, /S09/);

  const seniorSuiteBundle = readFileSync('dist/senior-suite.js', 'utf8');
  assert.match(seniorSuiteBundle, /nexoshop|NexoShop/);
});
