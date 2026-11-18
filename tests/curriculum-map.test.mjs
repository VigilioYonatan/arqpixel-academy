import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildCurriculumMapModel,
  filterCurriculumMapNodes,
  nextMapFocusIndex,
  renderCurriculumMapHtml,
  renderCurriculumMapSvg,
  validateCurriculumMapDag,
} from '../dist/features/curriculum/learning-path-map.js';
import { mergeValidatedCurriculum } from '../dist/features/curriculum/schemas/curriculum.schema.js';

const rawModules = JSON.parse(readFileSync('data/modules.json', 'utf8'));
const rawDeep = JSON.parse(readFileSync('data/deep-dives.json', 'utf8'));
const missions = JSON.parse(readFileSync('data/senior.json', 'utf8'));
const paths = JSON.parse(readFileSync('data/paths.json', 'utf8'));
const modules = mergeValidatedCurriculum(rawModules, rawDeep);
const allIds = [...modules.map((m) => m.id), ...missions.map((s) => s.id)];

test('ARQ-005: el grafo curricular real de 54 nodos es un DAG acíclico completo y coherente', () => {
  assert.equal(allIds.length, 54);
  const dag = validateCurriculumMapDag(allIds);
  assert.equal(dag.valid, true, `Errores DAG: ${dag.errors.join(', ')}`);
  assert.equal(dag.depths.B01, 0, 'B01 debe ser nodo raíz de profundidad 0');
  assert.ok(dag.depths.S18 >= 4, 'S18 capstone debe situarse al final de la cadena curricular');
});

test('ARQ-005: validateCurriculumMapDag detecta ciclos, autociclos, duplicados y referencias inexistentes', () => {
  const cyclic = validateCurriculumMapDag(['A', 'B'], { A: ['B'], B: ['A'] });
  assert.equal(cyclic.valid, false);
  assert.ok(cyclic.errors.some((e) => e.includes('Ciclo')));

  const selfLoop = validateCurriculumMapDag(['A'], { A: ['A'] });
  assert.equal(selfLoop.valid, false);
  assert.ok(selfLoop.errors.some((e) => e.includes('Autociclo')));

  const unknownRef = validateCurriculumMapDag(['A'], { A: ['NO_EXISTE'] });
  assert.equal(unknownRef.valid, false);

  const dupRef = validateCurriculumMapDag(['A', 'B'], { A: [], B: ['A', 'A'] });
  assert.equal(dupRef.valid, false);
});

test('ARQ-005: progresión de estados en #/mapa desbloquea nodos dependientes al aprobar prerrequisitos', () => {
  const initialModel = buildCurriculumMapModel(modules, missions, paths, [], []);
  assert.equal(initialModel.nodes.length, 54);
  assert.equal(initialModel.summary.recommendedNodeId, 'B01');
  assert.equal(initialModel.nodes.find((n) => n.id === 'B01')?.status, 'ready');
  assert.equal(initialModel.nodes.find((n) => n.id === 'B02')?.status, 'pending_prereq');

  const afterB01 = buildCurriculumMapModel(modules, missions, paths, ['B01'], []);
  assert.equal(afterB01.nodes.find((n) => n.id === 'B01')?.status, 'completed');
  assert.equal(afterB01.nodes.find((n) => n.id === 'B02')?.status, 'ready');
  assert.equal(afterB01.summary.recommendedNodeId, 'B02');

  const afterS12Prereq = buildCurriculumMapModel(modules, missions, paths, ['A08'], []);
  assert.equal(afterS12Prereq.nodes.find((n) => n.id === 'S12')?.status, 'ready');
});

test('ARQ-005: filtros de etapa, estado, especialización y búsqueda insensible a tildes', () => {
  const model = buildCurriculumMapModel(modules, missions, paths, ['B01', 'B02'], ['S01']);

  const onlySenior = filterCurriculumMapNodes(model, {
    stage: 'Senior',
    status: 'ALL',
    pathId: 'ALL',
    query: '',
  });
  assert.equal(onlySenior.length, 18);

  const onlyCompleted = filterCurriculumMapNodes(model, {
    stage: 'ALL',
    status: 'COMPLETED',
    pathId: 'ALL',
    query: '',
  });
  assert.deepEqual(
    onlyCompleted.map((n) => n.id),
    ['B01', 'B02', 'S01'],
  );

  const pathR03 = filterCurriculumMapNodes(model, {
    stage: 'ALL',
    status: 'ALL',
    pathId: 'R03',
    query: '',
  });
  assert.equal(pathR03.length, 5);

  const accentInsensitive = filterCurriculumMapNodes(model, {
    stage: 'ALL',
    status: 'ALL',
    pathId: 'ALL',
    query: 'diseno de agregados',
  });
  assert.ok(accentInsensitive.some((n) => n.id === 'S06'));
});

test('ARQ-005: navegación por teclado nextMapFocusIndex y HTML/SVG accesible libre de XSS', () => {
  assert.equal(nextMapFocusIndex(0, 'ArrowRight', 10, 2), 1);
  assert.equal(nextMapFocusIndex(0, 'ArrowLeft', 10, 2), 0);
  assert.equal(nextMapFocusIndex(1, 'ArrowDown', 10, 2), 3);
  assert.equal(nextMapFocusIndex(3, 'ArrowUp', 10, 2), 1);
  assert.equal(nextMapFocusIndex(4, 'Home', 10, 2), 0);
  assert.equal(nextMapFocusIndex(4, 'End', 10, 2), 9);

  const model = buildCurriculumMapModel(modules, missions, paths, ['B01'], []);
  const html = renderCurriculumMapHtml(
    model,
    model.nodes,
    { stage: 'ALL', status: 'ALL', pathId: 'ALL', query: '<script>alert(1)</script>' },
    'S09',
    paths,
  );
  assert.equal(html.includes('<script>'), false, 'La consulta debe escaparse contra XSS');
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(html.includes('role="img"'));
  assert.ok(html.includes('aria-live="polite"'));
  assert.ok(html.includes('Tabla accesible completa de prerrequisitos y dependencias (54 elementos)'));

  const svg = renderCurriculumMapSvg(model.nodes, 'S09');
  assert.ok(svg.includes('<title>Mapa curricular de 54 nodos de ARQPIXEL</title>'));
  assert.ok(svg.includes('S09'));

  // Regression check: filtering to Senior while B01 was selected focuses first visible Senior node (S01), and empty filter shows empty state
  const seniorOnly = filterCurriculumMapNodes(model, { stage: 'Senior', status: 'ALL', pathId: 'ALL', query: '' });
  const seniorHtml = renderCurriculumMapHtml(
    model,
    seniorOnly,
    { stage: 'Senior', status: 'ALL', pathId: 'ALL', query: '' },
    'B01',
    paths,
  );
  assert.ok(seniorHtml.includes('Detalle del nodo S01'));

  const emptyHtml = renderCurriculumMapHtml(
    model,
    [],
    { stage: 'ALL', status: 'ALL', pathId: 'ALL', query: 'inexistente-xyz' },
    'B01',
    paths,
  );
  assert.ok(emptyHtml.includes('Sin nodos coincidentes'));
});
