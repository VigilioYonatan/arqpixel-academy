/**
 * Enforces versioned bundle, CSS, asset, CLS dimension, lazy-vendor isolation, and forbidden-polyfill budgets on `dist/`.
 * Aligned with `web-mfe-quality`, `ADR-0001` & `ADR-0006`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

export const BUNDLE_BUDGETS = Object.freeze({
  maxTotalJsRawBytes: 1_020_000,
  maxTotalJsGzipBytes: 325_000,
  maxSingleJsRawBytes: 152_000,
  maxLazyVendorJsRawBytes: 2_300_000,
  maxLazyVendorJsGzipBytes: 560_000,
  maxCssRawBytes: 112_000,
  maxCssGzipBytes: 24_500,
  maxSingleSpritePngBytes: 120_000,
  maxSingleAudioMp3Bytes: 600_000,
});

const FORBIDDEN_BROWSER_MARKERS = ['node:fs', 'node:child_process', '@nestjs/', 'nestjs-zod'];

function walkFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

export function evaluateBundleBudget(distRoot = 'dist') {
  const issues = [];
  if (!existsSync(distRoot)) {
    return {
      ok: false,
      issues: [`dist directory not found: ${distRoot}`],
      metrics: null,
    };
  }

  const allFiles = walkFiles(distRoot);
  const jsFiles = allFiles.filter((f) => f.endsWith('.js'));
  const cssFile = join(distRoot, 'styles.css');

  let totalJsRaw = 0;
  let totalJsGzip = 0;
  let lazyVendorRaw = 0;
  let lazyVendorGzip = 0;
  let appJsModuleCount = 0;
  let largestJs = { file: '', bytes: 0 };

  for (const file of jsFiles) {
    const buf = readFileSync(file);
    const rel = relative(distRoot, file).replace(/\\/g, '/');
    const text = buf.toString('utf8');

    for (const forbidden of FORBIDDEN_BROWSER_MARKERS) {
      if (text.includes(forbidden)) {
        issues.push(`Forbidden server/Node marker "${forbidden}" leaked into browser bundle ${rel}`);
      }
    }

    if (rel.startsWith('vendor/')) {
      lazyVendorRaw += buf.length;
      lazyVendorGzip += gzipSync(buf).length;
      continue;
    }

    appJsModuleCount++;
    totalJsRaw += buf.length;
    totalJsGzip += gzipSync(buf).length;
    if (buf.length > largestJs.bytes) {
      largestJs = { file: rel, bytes: buf.length };
    }
    if (buf.length > BUNDLE_BUDGETS.maxSingleJsRawBytes) {
      issues.push(
        `JS chunk exceeds single-file budget (${rel}: ${buf.length} B > ${BUNDLE_BUDGETS.maxSingleJsRawBytes} B)`,
      );
    }
    if (rel === 'app.js' && /import\s+[^('"]*from\s+['"]\.\/vendor\/three\//.test(text)) {
      issues.push('dist/app.js must NOT eagerly import vendor/three; load lazily on #/minijuego/:id');
    }
  }

  if (totalJsRaw > BUNDLE_BUDGETS.maxTotalJsRawBytes) {
    issues.push(`Total app JS raw bytes ${totalJsRaw} > ${BUNDLE_BUDGETS.maxTotalJsRawBytes}`);
  }
  if (totalJsGzip > BUNDLE_BUDGETS.maxTotalJsGzipBytes) {
    issues.push(`Total app JS gzip bytes ${totalJsGzip} > ${BUNDLE_BUDGETS.maxTotalJsGzipBytes}`);
  }
  if (lazyVendorRaw > BUNDLE_BUDGETS.maxLazyVendorJsRawBytes) {
    issues.push(`Lazy vendor JS raw bytes ${lazyVendorRaw} > ${BUNDLE_BUDGETS.maxLazyVendorJsRawBytes}`);
  }
  if (lazyVendorGzip > BUNDLE_BUDGETS.maxLazyVendorJsGzipBytes) {
    issues.push(`Lazy vendor JS gzip bytes ${lazyVendorGzip} > ${BUNDLE_BUDGETS.maxLazyVendorJsGzipBytes}`);
  }

  const cssBuf = existsSync(cssFile) ? readFileSync(cssFile) : Buffer.alloc(0);
  const cssRaw = cssBuf.length;
  const cssGzip = gzipSync(cssBuf).length;
  if (cssRaw === 0 || cssRaw > BUNDLE_BUDGETS.maxCssRawBytes) {
    issues.push(`CSS raw bytes ${cssRaw} out of bounds (1..${BUNDLE_BUDGETS.maxCssRawBytes})`);
  }
  if (cssGzip > BUNDLE_BUDGETS.maxCssGzipBytes) {
    issues.push(`CSS gzip bytes ${cssGzip} > ${BUNDLE_BUDGETS.maxCssGzipBytes}`);
  }

  const spriteDir = join(distRoot, 'assets', 'arquibot');
  let spriteCount = 0;
  if (existsSync(spriteDir)) {
    for (const f of readdirSync(spriteDir).filter((x) => x.endsWith('.png'))) {
      spriteCount++;
      const sz = readFileSync(join(spriteDir, f)).length;
      if (sz > BUNDLE_BUDGETS.maxSingleSpritePngBytes) {
        issues.push(`Sprite ${f} (${sz} B) exceeds ${BUNDLE_BUDGETS.maxSingleSpritePngBytes} B`);
      }
    }
  }

  const audioDir = join(distRoot, 'audio');
  let audioCount = 0;
  if (existsSync(audioDir)) {
    for (const f of readdirSync(audioDir).filter((x) => x.endsWith('.mp3'))) {
      audioCount++;
      const sz = readFileSync(join(audioDir, f)).length;
      if (sz === 0 || sz > BUNDLE_BUDGETS.maxSingleAudioMp3Bytes) {
        issues.push(`Audio MP3 ${f} (${sz} B) out of bounds (1..${BUNDLE_BUDGETS.maxSingleAudioMp3Bytes} B)`);
      }
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    metrics: {
      jsModuleCount: appJsModuleCount,
      totalJsRawBytes: totalJsRaw,
      totalJsGzipBytes: totalJsGzip,
      lazyVendorRawBytes: lazyVendorRaw,
      lazyVendorGzipBytes: lazyVendorGzip,
      largestJsChunk: largestJs,
      cssRawBytes: cssRaw,
      cssGzipBytes: cssGzip,
      arquibotSpritesChecked: spriteCount,
      studioAudioTracksChecked: audioCount,
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = evaluateBundleBudget('dist');
  if (!result.ok) {
    console.error(`BUNDLE BUDGET FAIL:\n${result.issues.join('\n')}`);
    process.exitCode = 1;
  } else {
    const m = result.metrics;
    console.log(
      `BUNDLE BUDGET PASS: ${m.jsModuleCount} app JS modules (${(m.totalJsRawBytes / 1024).toFixed(1)} KB raw / ${(m.totalJsGzipBytes / 1024).toFixed(1)} KB gzip), lazy vendor ${(m.lazyVendorRawBytes / 1024).toFixed(1)} KB raw, CSS ${(m.cssRawBytes / 1024).toFixed(1)} KB raw, ${m.arquibotSpritesChecked} sprites within budget.`,
    );
  }
}
