import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

import {
  ARQUIBOT_SPRITE_IDS,
  assetsManifestCatalogSchema,
  renderArquiBotSprite,
} from '../dist/features/shared/schemas/assets-manifest.schema.js';
import {
  buildGlobalSearchIndex,
  deriveLessonHints,
  MOBILE_WORKSPACE_TABS,
  nextSearchSelectionIndex,
  queryGlobalSearch,
  renderHintDrawerHtml,
  renderLiveRegionHtml,
  renderMobileWorkspaceTabsHtml,
  renderProgressRingSvg,
  renderSearchCommandModalHtml,
  renderSkipLinkHtml,
  renderSolutionRevealHtml,
  TOKEN_COMPONENT_STATE_SCREEN_MAP,
  UI_INTERACTIVE_STATES,
} from '../dist/features/shared/ui/interactive-components.js';
import { renderLessonClassroomHtml } from '../dist/features/curriculum/lesson-classroom.js';
import { mergeValidatedCurriculum } from '../dist/features/curriculum/schemas/curriculum.schema.js';
import { LAB_STUDIOS } from '../dist/features/labs/constants/labs.constants.js';
import { APP_VERSION_LABEL } from '../dist/features/shared/constants/app.constants.js';

const rawModules = JSON.parse(readFileSync('data/modules.json', 'utf8'));
const rawDeep = JSON.parse(readFileSync('data/deep-dives.json', 'utf8'));
const missions = JSON.parse(readFileSync('data/senior.json', 'utf8'));
const paths = JSON.parse(readFileSync('data/paths.json', 'utf8'));
const miniGames = JSON.parse(readFileSync('data/mini-games.json', 'utf8'));
const rawAssetsManifest = JSON.parse(readFileSync('data/assets-manifest.json', 'utf8'));
const modules = mergeValidatedCurriculum(rawModules, rawDeep);

function inspectPngRgbaCornerAndOpaquePixels(filePath) {
  const buf = readFileSync(filePath);
  assert.equal(buf[0], 0x89);
  assert.equal(buf[1], 0x50);
  assert.equal(buf[2], 0x4e);
  assert.equal(buf[3], 0x47);

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];

  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.subarray(offset + 4, offset + 8).toString('ascii');
    const data = buf.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  const rawScanlines = inflateSync(Buffer.concat(idatChunks));
  const stride = 1 + width * 4;
  assert.equal(rawScanlines.length, height * stride);

  // Filter 0 (None) on first scanline: pixel (0,0) RGBA sits at bytes 1..4
  const filterByte0 = rawScanlines[0];
  assert.equal(filterByte0, 0, `${filePath} usa filtro 0 determinista en primera fila`);
  const cornerAlpha = rawScanlines[4];

  let transparentCount = 0;
  let opaqueCount = 0;
  let purplePixels = 0;

  // Sample scanlines with filter 0
  for (let y = 0; y < height; y += 8) {
    const rowStart = y * stride;
    if (rawScanlines[rowStart] !== 0) continue;
    for (let x = 0; x < width; x += 8) {
      const px = rowStart + 1 + x * 4;
      const r = rawScanlines[px];
      const g = rawScanlines[px + 1];
      const b = rawScanlines[px + 2];
      const a = rawScanlines[px + 3];
      if (a === 0) transparentCount++;
      else if (a === 255) {
        opaqueCount++;
        // Ensure zero TerraBot purple pixels (high R + high B + very low G)
        if (r > 130 && b > 170 && g < 80) purplePixels++;
      }
    }
  }

  return { width, height, bitDepth, colorType, cornerAlpha, transparentCount, opaqueCount, purplePixels };
}

test('ARQ-011: mapa token → componente → 9 estados → pantalla y corrección de bugs UI en app.ts', () => {
  assert.deepEqual(UI_INTERACTIVE_STATES, [
    'idle',
    'hover',
    'focus-visible',
    'disabled',
    'loading',
    'success',
    'error',
    'empty',
    'reduced-motion',
  ]);
  assert.ok(TOKEN_COMPONENT_STATE_SCREEN_MAP.length >= 8);
  for (const entry of TOKEN_COMPONENT_STATE_SCREEN_MAP) {
    assert.ok(entry.tokens.length >= 2);
    assert.ok(entry.screens.length >= 1);
  }

  assert.equal(APP_VERSION_LABEL, 'v1.7+');
  const appBundle = readFileSync('dist/app.js', 'utf8');
  assert.ok(!appBundle.includes('v1.0 · Progreso local'), 'El footer antiguo v1.0 no debe existir');
  assert.ok(!appBundle.includes('Abrir taller de 5 actividades'), 'El botón antiguo de 5 actividades no debe existir');
  assert.ok(appBundle.includes('Abrir taller Senior (6 actividades + bonus) ↗'));

  const css = readFileSync('dist/styles.css', 'utf8');
  for (const selector of [
    '[data-ui-state="idle"]',
    '[data-ui-state="loading"]',
    '[data-ui-state="disabled"]',
    '[data-ui-state="success"]',
    '[data-ui-state="error"]',
    '[data-ui-state="empty"]',
    ':focus-visible',
    'prefers-reduced-motion:reduce',
  ]) {
    assert.ok(css.includes(selector), `Falta soporte CSS para estado: ${selector}`);
  }
});

test('ARQ-011: SearchCommand (Ctrl+K) indexa conceptos arquitectónicos, filtra sin tildes y soporta teclado + estado vacío', () => {
  const index = buildGlobalSearchIndex({
    modules,
    missions,
    paths,
    labs: LAB_STUDIOS,
    miniGames,
  });

  // 36 modules + 18 missions + 8 paths + 11 projects + 8 labs + 5 games + 12 patterns + 8 comparisons + 16 glossary + 4 nav = 126
  assert.ok(index.length >= 120, `Índice global esperado >= 120 entradas, recibido: ${index.length}`);

  for (const keyword of ['aggregates', 'outbox', 'idempotencia', 'CQRS', 'SLO', 'STRIDE']) {
    const matches = queryGlobalSearch(index, keyword);
    assert.ok(matches.length >= 1, `SearchCommand debe encontrar resultados para '${keyword}'`);
  }

  // Accent-insensitive lookup
  const noAccent = queryGlobalSearch(index, 'catalogo');
  const withAccent = queryGlobalSearch(index, 'Catálogo');
  assert.ok(noAccent.length >= 1);
  assert.equal(noAccent[0].id, withAccent[0].id);

  // Keyboard selection wrap-around
  assert.equal(nextSearchSelectionIndex(0, 'ArrowDown', 5), 1);
  assert.equal(nextSearchSelectionIndex(4, 'ArrowDown', 5), 0);
  assert.equal(nextSearchSelectionIndex(0, 'ArrowUp', 5), 4);
  assert.equal(nextSearchSelectionIndex(2, 'Home', 5), 0);
  assert.equal(nextSearchSelectionIndex(2, 'End', 5), 4);

  // Empty state & XSS protection
  const emptyResults = queryGlobalSearch(index, 'termino-inexistente-xyz-999');
  assert.equal(emptyResults.length, 0);
  const emptyHtml = renderSearchCommandModalHtml({
    isOpen: true,
    query: '<img src=x onerror=alert(1)>',
    results: emptyResults,
    activeIndex: 0,
  });
  assert.match(emptyHtml, /data-ui-state="empty"/);
  assert.doesNotMatch(emptyHtml, /<img src=x/);
  assert.match(emptyHtml, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('ARQ-011: SkipLink, LiveRegion, ProgressRing, HintDrawer (sin revelar respuesta), SolutionReveal y pestañas móviles', () => {
  assert.match(renderSkipLinkHtml(), /href="#main"/);
  assert.match(renderLiveRegionHtml('Listo'), /aria-live="polite"/);

  const ring0 = renderProgressRingSvg({ percent: -15, label: 'Avance' });
  const ring100 = renderProgressRingSvg({ percent: 120, label: 'Avance' });
  assert.match(ring0, /0%/);
  assert.match(ring0, /data-ui-state="empty"/);
  assert.match(ring100, /100%/);
  assert.match(ring100, /data-ui-state="success"/);

  // HintDrawer never leaks the exact winning option string across all 36 modules
  for (const mod of modules) {
    const hints = deriveLessonHints(mod);
    assert.equal(hints.length, 3);
    const correctOption = mod.options[mod.correct];
    for (const h of hints) {
      assert.equal(
        h.includes(correctOption),
        false,
        `La pista del módulo ${mod.id} no debe filtrar literalmente la respuesta correcta`,
      );
    }
  }

  const drawer0 = renderHintDrawerHtml({ idPrefix: 'test-h', hints: ['P1', 'P2', 'P3'], revealedCount: 0 });
  assert.match(drawer0, /Pedir pista 1/);
  assert.match(drawer0, /hidden/);

  const drawer3 = renderHintDrawerHtml({ idPrefix: 'test-h', hints: ['P1', 'P2', 'P3'], revealedCount: 3 });
  assert.match(drawer3, /Todas las pistas mostradas/);
  assert.match(drawer3, /disabled/);
  assert.match(drawer3, /P1/);
  assert.match(drawer3, /P3/);

  const revealBad = renderSolutionRevealHtml({
    isCorrect: false,
    chosenLabel: 'Acoplar controlador a SQL',
    referenceLabel: 'Separar puerto de repositorio',
    explanation: 'Aísla las reglas del motor de persistencia.',
  });
  assert.match(revealBad, /data-ui-state="error"/);
  assert.match(revealBad, /TU ELECCIÓN/);
  assert.match(revealBad, /OPCIÓN DE REFERENCIA/);

  // Classroom integration includes HintDrawer & SolutionReveal after answering
  const classroomHtml = renderLessonClassroomHtml({
    currentModule: modules[0],
    allModules: modules,
    completedModuleIds: [],
    selectedAnswer: modules[0].correct,
    savedNote: '',
    seniorModeActive: false,
    sidebarExpanded: false,
    sidebarQuery: '',
    routePrefix: 'aprender',
    hintsRevealed: 1,
  });
  assert.match(classroomHtml, /lesson-hint-drawer/);
  assert.match(classroomHtml, /solution-reveal/);

  // Mobile workspace tabs
  assert.equal(MOBILE_WORKSPACE_TABS.length, 4);
  const tabsHtml = renderMobileWorkspaceTabsHtml('context');
  assert.match(tabsHtml, /Contexto/);
  assert.match(tabsHtml, /Trabajo/);
  assert.match(tabsHtml, /Validación/);
  assert.match(readFileSync('dist/senior-suite.js', 'utf8'), /data-workspace-pane="validation"/);
});

test('ARQ-012: los 16 sprites oficiales de ArquiBot son PNG RGBA transparentes reales (>= 512x512, CLS=0, 0 morado TerraBot)', () => {
  const parsed = assetsManifestCatalogSchema.safeParse(rawAssetsManifest);
  assert.equal(parsed.success, true, 'data/assets-manifest.json debe cumplir el contrato estricto');

  // Corrupt manifest must fail
  assert.equal(assetsManifestCatalogSchema.safeParse([]).success, false);
  assert.equal(
    assetsManifestCatalogSchema.safeParse([{ ...rawAssetsManifest[0], __proto__: { x: 1 } }]).success,
    false,
  );

  const byId = new Map(rawAssetsManifest.map((item) => [item.id, item]));
  assert.equal(ARQUIBOT_SPRITE_IDS.length, 16);

  for (const spriteId of ARQUIBOT_SPRITE_IDS) {
    const entry = byId.get(spriteId);
    assert.ok(entry, `Falta ${spriteId} en assets-manifest.json`);
    assert.equal(entry.transparentRgba, true);

    const distPath = `dist/${entry.src.replace(/^\.\//, '')}`;
    assert.equal(existsSync(distPath), true, `No existe en dist: ${distPath}`);

    const pngInfo = inspectPngRgbaCornerAndOpaquePixels(distPath);
    assert.equal(pngInfo.colorType, 6, `${spriteId} debe tener colorType=6 (RGBA)`);
    assert.equal(pngInfo.bitDepth, 8);
    assert.equal(pngInfo.width, entry.width);
    assert.equal(pngInfo.height, entry.height);
    assert.ok(pngInfo.width >= 512 && pngInfo.height >= 512);
    assert.equal(pngInfo.cornerAlpha, 0, `${spriteId} debe tener fondo transparente real en esquina (alpha=0)`);
    assert.ok(pngInfo.transparentCount > 200, `${spriteId} debe tener área exterior transparente real`);
    assert.ok(pngInfo.opaqueCount > 80, `${spriteId} debe contener píxeles opacos reales del robot`);
    assert.equal(pngInfo.purplePixels, 0, `${spriteId} no debe contener elementos morados de TerraBot`);

    const imgTag = renderArquiBotSprite(spriteId, 96, 'extra-cls', byId);
    assert.match(imgTag, /width="96" height="96"/, 'Dimensiones explícitas obligatorias para CLS = 0');
    assert.match(imgTag, /alt="[^"]{10,}"/);
  }
});

test('ARQ-011..015: orden topológico de ENTRY en tests/browser-e2e.py resuelve el 100 % de imports en dist/', () => {
  const pySource = readFileSync('tests/browser-e2e.py', 'utf8');
  const match = /ENTRY\s*=\s*\[([\s\S]*?)\]/.exec(pySource);
  assert.ok(match, 'No se encontró ENTRY en tests/browser-e2e.py');
  const entryList = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.ok(entryList.includes('app.js'));
  assert.ok(entryList.includes('ddd-workshop.js'));
  assert.ok(entryList.includes('features/shared/ui/interactive-components.js'));

  const resolveRel = (base, rel) => {
    const parts = base.split('/').slice(0, -1);
    for (const seg of rel.split('/')) {
      if (!seg || seg === '.') continue;
      if (seg === '..') parts.pop();
      else parts.push(seg);
    }
    return parts.join('/');
  };

  const loaded = new Set();
  for (const modName of entryList) {
    const fullDistPath = `dist/${modName}`;
    assert.equal(existsSync(fullDistPath), true, `Falta módulo compilado en dist: ${fullDistPath}`);
    const jsCode = readFileSync(fullDistPath, 'utf8');
    for (const imp of jsCode.matchAll(/from\s+['"](\.\.?(?:\/[^'"]+\.js))['"]/g)) {
      const resolved = resolveRel(modName, imp[1]);
      assert.equal(
        loaded.has(resolved),
        true,
        `Orden topológico roto en browser-e2e.py: '${modName}' importa '${resolved}' antes de registrarlo`,
      );
    }
    loaded.add(modName);
  }
});
