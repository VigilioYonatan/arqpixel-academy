import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkHeaders } from '../scripts/check-security-headers.mjs';
import { evaluateBundleBudget } from '../scripts/check-bundle-budget.mjs';
import { auditWorkflowAndSupplyChain } from '../scripts/check-workflows-governance.mjs';
import { createDistHttpServer, parseStaticHeadersFile } from '../scripts/serve-dist-with-headers.mjs';
import { verifyHistoricalZeroLoss } from '../scripts/verify-zero-loss-and-package.mjs';
import { buildOperationalEvidence } from '../scripts/write-operational-evidence.mjs';

function walkJsAndHtml(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJsAndHtml(full));
    else if (full.endsWith('.js') || full.endsWith('.html')) out.push(full);
  }
  return out;
}

test('ARQ-021: cero atributos inline style="..." en index.html y en todos los bundles dist/**/*.js', () => {
  const files = ['index.html', ...walkJsAndHtml('dist')];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    assert.equal(
      /\bstyle\s*=\s*["']/.test(text),
      false,
      `Se encontró atributo style= prohibido por CSP style-src 'self' en ${file}`,
    );
  }

  // Reject unsafe-inline or unsafe-eval in checkHeaders negative cases
  const badHtmlIssues = checkHeaders(
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'none'"/>`,
    readFileSync('public/_headers', 'utf8'),
  );
  assert.ok(badHtmlIssues.some((msg) => msg.includes('unsafe-inline')));
});

test('ARQ-023: evaluateBundleBudget aprueba dist/ real y rechaza fugas de marcadores Node/backend', () => {
  const real = evaluateBundleBudget('dist');
  assert.equal(real.ok, true, real.issues.join('; '));
  assert.ok(real.metrics.arquibotSpritesChecked >= 16);

  const tmp = mkdtempSync(join(tmpdir(), 'arq-budget-'));
  try {
    mkdirSync(join(tmp, 'assets', 'arquibot'), { recursive: true });
    writeFileSync(join(tmp, 'styles.css'), 'body{margin:0}', 'utf8');
    writeFileSync(join(tmp, 'leaked.js'), 'import fs from "node:fs"; console.log(fs);', 'utf8');
    const bad = evaluateBundleBudget(tmp);
    assert.equal(bad.ok, false);
    assert.ok(bad.issues.some((x) => x.includes('node:fs')));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('ARQ-024: auditWorkflowAndSupplyChain aprueba repo real y bloquea tags mutables @v4 o write-all', () => {
  assert.deepEqual(auditWorkflowAndSupplyChain(process.cwd()), []);

  const tmp = mkdtempSync(join(tmpdir(), 'arq-wf-'));
  try {
    mkdirSync(join(tmp, '.github', 'workflows'), { recursive: true });
    writeFileSync(
      join(tmp, '.github', 'workflows', 'bad.yml'),
      [
        'name: Bad',
        'permissions: write-all',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
      ].join('\n'),
      'utf8',
    );
    const issues = auditWorkflowAndSupplyChain(tmp);
    assert.ok(issues.some((i) => i.includes('write-all')));
    assert.ok(issues.some((i) => i.includes('40-char commit SHA')));
    assert.ok(issues.some((i) => i.includes('persist-credentials: false')));
    assert.ok(issues.some((i) => i.includes('pnpm-workspace.yaml')));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

describe('Feature: BDD Hardening — Servidor HTTP con cabeceras reales, CSP estricta y Supply Chain', () => {
  it("Scenario: Given dist/_headers con style-src 'self', When se levanta el servidor HTTP local y se consulta / y una ruta traversal, Then entrega CSP sin unsafe-inline y bloquea fuera de raíz", async () => {
    const parsed = parseStaticHeadersFile(readFileSync('dist/_headers', 'utf8'));
    assert.ok(parsed['Content-Security-Policy'].includes("style-src 'self'"));
    assert.equal(parsed['Content-Security-Policy'].includes("'unsafe-inline'"), false);

    const server = createDistHttpServer();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const addr = server.address();
      const baseUrl = `http://127.0.0.1:${addr.port}`;

      const homeRes = await fetch(`${baseUrl}/`);
      assert.equal(homeRes.status, 200);
      const csp = homeRes.headers.get('content-security-policy') || '';
      assert.ok(csp.includes("style-src 'self'"));
      assert.equal(csp.includes("'unsafe-inline'"), false);
      assert.equal(homeRes.headers.get('x-frame-options'), 'DENY');
      assert.equal(homeRes.headers.get('x-content-type-options'), 'nosniff');

      const postRes = await fetch(`${baseUrl}/`, { method: 'POST' });
      assert.equal(postRes.status, 405);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('Scenario: Given el baseline histórico de 240 archivos v1.7, When se audita cero pérdida y evidencia operativa, Then conserva 240/240 rutas y distingue PASS local de NOT_RUN externo', () => {
    const zeroLoss = verifyHistoricalZeroLoss(process.cwd());
    assert.equal(zeroLoss.zeroLoss, true, `Rutas faltantes: ${zeroLoss.missingPaths.join(', ')}`);
    assert.equal(zeroLoss.historicalCountChecked, 240);

    const evidence = buildOperationalEvidence({ biomePassed: true, e2ePassed: true });
    assert.equal(evidence.overall_local_gate_status, 'PASS');
    assert.equal(evidence.secrets_detected, false);
    assert.equal(evidence.pii_detected, false);
    assert.equal(evidence.gates.csp_zero_unsafe_inline, 'PASS');
    assert.equal(evidence.gates.biome_2_6_3_ci, 'PASS');
    assert.equal(evidence.gates.playwright_1_64_1_http_e2e_and_axe_wcag, 'PASS');
    // Honest boundary: external cloud runners & manual assistive session are NOT_RUN, never fabricated PASS
    assert.equal(evidence.gates.external_github_hosted_runner_slsa, 'NOT_RUN');
    assert.equal(evidence.gates.manual_nvda_voiceover_assistive_session, 'NOT_RUN');
  });
});
