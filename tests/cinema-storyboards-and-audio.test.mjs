import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';

import {
  buildWebVttDataUri,
  cleanArchitectureSpeechText,
  computeDeckTimeline,
  formatCinemaTime,
  renderArquiBotCinemaHtml,
  renderStageVisualHtml,
} from '../dist/features/cinema/arquibot-player.js';
import {
  buildHomeIntroDeck,
  buildModuleCinemaDeck,
  buildSeniorMissionCinemaDeck,
  buildSeniorOverviewDeck,
} from '../dist/features/cinema/arquibot-storyboards.js';
import { audioManifestCatalogSchema } from '../dist/features/cinema/schemas/cinema.schema.js';
import { mergeValidatedCurriculum } from '../dist/features/curriculum/schemas/curriculum.schema.js';
import { missionsCatalogSchema } from '../dist/features/senior/schemas/senior.schema.js';
import { assetsManifestCatalogSchema } from '../dist/features/shared/schemas/assets-manifest.schema.js';
import { SENIOR_PLAYBOOKS } from '../dist/senior-suite.js';

const rawModules = JSON.parse(readFileSync('data/modules.json', 'utf8'));
const rawDeep = JSON.parse(readFileSync('data/deep-dives.json', 'utf8'));
const rawSenior = JSON.parse(readFileSync('data/senior.json', 'utf8'));
const rawAssets = JSON.parse(readFileSync('data/assets-manifest.json', 'utf8'));
const rawAudioManifest = JSON.parse(readFileSync('data/audio-manifest.json', 'utf8'));

const modules = mergeValidatedCurriculum(rawModules, rawDeep);
const missions = missionsCatalogSchema.parse(rawSenior, 'senior.json');
const assetsLookup = new Map(
  assetsManifestCatalogSchema.parse(rawAssets, 'assets-manifest.json').map((x) => [x.id, x]),
);

function hasValidMp3Signature(buf) {
  if (buf.length < 4096) return false;
  // ID3v2 header ("ID3") or MPEG-1/2 Layer III sync word (0xFF 0xFB / 0xF3 / 0xF2 / 0xFA)
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return true;
  return buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;
}

test('ADR-0007 / BDD-01: audio-manifest.json valida los 15 videos Studio HD a 2 voces y sincroniza byte a byte public/audio con dist/audio', () => {
  const parsed = audioManifestCatalogSchema.safeParse(rawAudioManifest);
  assert.equal(parsed.success, true, 'data/audio-manifest.json debe cumplir audioManifestCatalogSchema');

  const expectedHdIds = [
    'HOME-INTRO',
    'SENIOR-OVERVIEW',
    'CLASS-B01',
    'CLASS-B02',
    'CLASS-B03',
    'CLASS-B04',
    'CLASS-B05',
    'CLASS-B06',
    'CLASS-B07',
    'CLASS-B08',
    'CLASS-B09',
    'CLASS-B10',
    'SENIOR-S01',
    'SENIOR-S02',
    'SENIOR-S03',
  ];
  assert.equal(Object.keys(parsed.data).length, expectedHdIds.length);
  for (const id of expectedHdIds) {
    const meta = parsed.data[id];
    assert.ok(meta, `Falta pista Studio HD ${id} en data/audio-manifest.json`);
    assert.ok(meta.totalSec >= 20 && meta.totalSec <= 75, `${id} duración fuera de rango: ${meta.totalSec}s`);
    assert.ok(meta.speakers && meta.speakers.length === meta.cues.length);
    assert.ok(meta.speakers.includes('host') && meta.speakers.includes('mentor'), `${id} debe alternar las 2 voces (host + mentor)`);

    const relFile = meta.src.replace(/^\.\//, '');
    const pubPath = `public/${relFile}`;
    const distPath = `dist/${relFile}`;
    assert.equal(existsSync(pubPath), true, `Falta MP3 en ${pubPath}`);
    assert.equal(existsSync(distPath), true, `Falta MP3 en ${distPath}`);

    const pubBuf = readFileSync(pubPath);
    const distBuf = readFileSync(distPath);
    assert.equal(Buffer.compare(pubBuf, distBuf), 0, `Desincronización entre ${pubPath} y ${distPath}`);
    assert.equal(hasValidMp3Signature(distBuf), true, `Firma MP3 inválida en ${distPath}`);
    assert.ok(
      statSync(distPath).size >= 50_000 && statSync(distPath).size <= 600_000,
      `Peso MP3 fuera de presupuesto (50 KB..600 KB) en ${distPath}`,
    );
  }

  // Adversarial boundary rejections
  assert.equal(
    audioManifestCatalogSchema.safeParse({
      'HOME-INTRO': { src: '../secret.mp3', totalSec: 30, cues: [0.5] },
    }).success,
    false,
  );
  assert.equal(
    audioManifestCatalogSchema.safeParse({
      'HOME-INTRO': { src: './audio/home-intro.mp3', totalSec: 30, cues: [12, 8] },
    }).success,
    false,
  );
  assert.equal(
    audioManifestCatalogSchema.safeParse({
      'HOME-INTRO': {
        src: './audio/home-intro.mp3',
        totalSec: 30,
        cues: [0.5, 10],
        speakers: ['host'],
      },
    }).success,
    false,
  );
});

test('ADR-0007 / BDD-02: los 15 storyboards Studio HD coinciden exactamente 1:1 con generate-cinema-audio.py, cues[] y speakers[] y renderizan <track kind="captions">', () => {
  const audioManifest = audioManifestCatalogSchema.parse(rawAudioManifest, 'audio-manifest.json');
  const pyScript = readFileSync('scripts/generate-cinema-audio.py', 'utf8');
  const modIds = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10'];
  const srIds = ['S01', 'S02', 'S03'];

  const hdDecks = [
    buildHomeIntroDeck(audioManifest),
    buildSeniorOverviewDeck(audioManifest),
    ...modIds.map((id) => {
      const m = modules.find((x) => x.id === id);
      assert.ok(m, `Falta módulo ${id}`);
      return buildModuleCinemaDeck(m, audioManifest);
    }),
    ...srIds.map((id) => {
      const s = missions.find((x) => x.id === id);
      assert.ok(s, `Falta misión ${id}`);
      return buildSeniorMissionCinemaDeck(s, SENIOR_PLAYBOOKS[id], audioManifest);
    }),
  ];

  for (const deck of hdDecks) {
    assert.ok(deck.audio, `${deck.id} debe adjuntar metadata de audio Studio HD`);
    assert.equal(
      deck.scenes.length,
      deck.audio.cues.length,
      `${deck.id}: número de escenas (${deck.scenes.length}) !== cues.length (${deck.audio.cues.length})`,
    );
    for (const sc of deck.scenes) {
      assert.equal(
        pyScript.includes(sc.speech),
        true,
        `Deriva voz↔subtítulo en ${deck.id} (${sc.chapter}): el diálogo no coincide exactamente con scripts/generate-cinema-audio.py`,
      );
    }
    const timeline = computeDeckTimeline(deck);
    assert.equal(timeline.total, deck.audio.totalSec);
    assert.equal(timeline.starts[0], 0);

    const vtt = buildWebVttDataUri(deck, timeline);
    assert.match(vtt, /^data:text\/vtt;charset=utf-8,/);
    const decodedVtt = decodeURIComponent(vtt.replace(/^data:text\/vtt;charset=utf-8,/, ''));
    assert.match(decodedVtt, /^WEBVTT/);
    assert.match(decodedVtt, /00:00:00\.000 -->/);

    const html = renderArquiBotCinemaHtml(deck, { manifestLookup: assetsLookup });
    assert.match(html, /<audio class="cinema-audio-el"/);
    assert.match(html, /<track kind="captions"/);
    assert.equal(/\sstyle\s*=/i.test(html), false, `${deck.id} no debe contener atributos inline style=`);
  }
});

test('ADR-0005 & ADR-0007 / BDD-03: las 36 clases (B01–A12) y 18 misiones Senior (S01–S18) generan pizarras deterministas con 0 tokens y 0 estilos inline', () => {
  const audioManifest = audioManifestCatalogSchema.parse(rawAudioManifest, 'audio-manifest.json');

  for (const mod of modules) {
    const deck = buildModuleCinemaDeck(mod, audioManifest);
    assert.equal(deck.scenes.length, 3, `Módulo ${mod.id} debe tener 3 escenas`);
    const html = renderArquiBotCinemaHtml(deck, { compact: true, manifestLookup: assetsLookup });
    assert.equal(/\sstyle\s*=/i.test(html), false, `Inline style prohibido en poster ${mod.id}`);
    assert.match(html, /width="72" height="72"/, `Dimensiones explícitas CLS=0 en ${mod.id}`);
    for (const sc of deck.scenes) {
      for (const prog of [0, 0.5, 1]) {
        const boardHtml = renderStageVisualHtml(sc.visual, prog);
        assert.equal(/\sstyle\s*=/i.test(boardHtml), false, `Inline style prohibido en pizarra ${mod.id}`);
      }
    }
  }

  for (const mission of missions) {
    const deck = buildSeniorMissionCinemaDeck(mission, SENIOR_PLAYBOOKS[mission.id], audioManifest);
    assert.equal(deck.scenes.length, 3, `Misión ${mission.id} debe tener 3 escenas`);
    const html = renderArquiBotCinemaHtml(deck, { compact: true, manifestLookup: assetsLookup });
    assert.equal(/\sstyle\s*=/i.test(html), false, `Inline style prohibido en misión ${mission.id}`);
    for (const sc of deck.scenes) {
      const boardHtml = renderStageVisualHtml(sc.visual, 0.6);
      assert.equal(/\sstyle\s*=/i.test(boardHtml), false, `Inline style prohibido en pizarra ${mission.id}`);
    }
  }
});

test('ADR-0007 / BDD-04: sanitización fonética cleanArchitectureSpeechText y formateo de tiempo mm:ss', () => {
  assert.equal(formatCinemaTime(0), '00:00');
  assert.equal(formatCinemaTime(37.26), '00:37');
  assert.equal(formatCinemaTime(125.9), '02:05');

  const spoken = cleanArchitectureSpeechText(
    'En S03 y B10 validamos MVC, POO, SRP, DIP, SDKs, Strategy, Adapter, fallback, C1, C4, DDD, CQRS, HTTPS, PostgreSQL, rollback, p95, SLO y STRIDE sin REQUIRES_REVIEW falso.',
  );
  assert.doesNotMatch(spoken, /\bC4\b/);
  assert.doesNotMatch(spoken, /\bDDD\b/);
  assert.doesNotMatch(spoken, /\bCQRS\b/);
  assert.doesNotMatch(spoken, /\bHTTPS\b/);
  assert.doesNotMatch(spoken, /\bMVC\b/);
  assert.match(spoken, /ese cero tres/);
  assert.match(spoken, /be diez/);
  assert.match(spoken, /eme uve ce/);
  assert.match(spoken, /programación orientada a objetos/);
  assert.match(spoken, /fólbak/);
  assert.match(spoken, /ce uno/);
  assert.match(spoken, /Póstgres/);
  assert.match(spoken, /rólbak/);
  assert.match(spoken, /percentil noventa y cinco/);
  assert.match(spoken, /revisión humana obligatoria/);
});
