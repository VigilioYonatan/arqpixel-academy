import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';

type BrowserGuardState = {
  readonly pageErrors: string[];
  readonly consoleErrors: string[];
};

async function attachBrowserGuards(page: Page): Promise<BrowserGuardState> {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  await page.addInitScript(() => {
    const win = window as unknown as { __cspViolations?: string[] };
    win.__cspViolations = [];
    window.addEventListener('securitypolicyviolation', (ev) => {
      win.__cspViolations?.push(
        `${ev.violatedDirective} blocked=${ev.blockedURI} sample=${ev.sample || ''}`,
      );
    });
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      // Ignore expected browser 404 resource log only when testing explicit 404 fetches
      if (!msg.text().includes('nonexistent-asset')) {
        consoleErrors.push(msg.text());
      }
    }
  });

  return { pageErrors, consoleErrors };
}

async function assertCleanBrowserTelemetry(page: Page, guards: BrowserGuardState): Promise<void> {
  expect(guards.pageErrors, 'Zero uncaught pageerror exceptions').toEqual([]);
  expect(guards.consoleErrors, 'Zero console.error messages').toEqual([]);
  const cspViolations = await page.evaluate(() => {
    const win = window as unknown as { __cspViolations?: string[] };
    return win.__cspViolations ?? [];
  });
  expect(cspViolations, 'Zero securitypolicyviolation events under style-src self').toEqual([]);
}

test('ARQ-021 & ARQ-022: Servidor HTTP real entrega CSP estricta sin unsafe-inline, headers defensivos y códigos 404/405', async ({
  request,
}) => {
  const res = await request.get('/');
  expect(res.status()).toBe(200);
  const headers = res.headers();
  expect(headers['content-security-policy']).toContain("default-src 'none'");
  expect(headers['content-security-policy']).toContain("script-src 'self'");
  expect(headers['content-security-policy']).toContain("style-src 'self'");
  expect(headers['content-security-policy']).not.toContain("'unsafe-inline'");
  expect(headers['content-security-policy']).not.toContain("'unsafe-eval'");
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('no-referrer');
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['permissions-policy']).toContain('camera=()');

  const notFound = await request.get('/nonexistent-asset-check.js');
  expect(notFound.status()).toBe(404);

  const methodDenied = await request.post('/');
  expect(methodDenied.status()).toBe(405);
});

test('ARQ-022: Recorrido HTTP real por todas las rutas públicas, nuevas vistas, 404 hash, historial atrás/adelante y recarga', async ({
  page,
}) => {
  const guards = await attachBrowserGuards(page);
  await page.goto('/#/inicio');
  await expect(page.locator('main h1')).toBeVisible();

  const routesToVerify: ReadonlyArray<readonly [string, RegExp]> = [
    ['#/mapa', /Mapa curricular/i],
    ['#/rutas', /Rutas de aprendizaje/i],
    ['#/especializaciones', /Especializaciones técnicas/i],
    ['#/rutas/R06', /Microservicios y eventos/i],
    ['#/aprender/B01', /Qué es arquitectura de software/i],
    ['#/modulo/I07', /Arquitectura hexagonal/i],
    ['#/proyectos', /Proyectos integradores y Capstones/i],
    ['#/proyectos/INT-BASICO', /App de Reservas/i],
    ['#/laboratorios', /Laboratorios de arquitectura/i],
    ['#/minijuegos', /Minijuegos de arquitectura/i],
    ['#/senior', /18 misiones|Senior/i],
    ['#/mision/S09', /Pedido y pago distribuido/i],
    ['#/taller-senior/S09', /S09/i],
    ['#/recursos', /Recursos, patrones y comparativas/i],
    ['#/recursos/patrones/strategy', /Strategy/i],
    ['#/recursos/adr', /Plantillas y guía práctica de ADR/i],
    ['#/logros', /Logros e insignias/i],
    ['#/perfil', /Mi perfil de arquitecto/i],
    ['#/ajustes', /Ajustes de ARQPIXEL/i],
    ['#/sobre', /Sobre ARQPIXEL Academy/i],
  ];

  for (const [hash, expectedTitle] of routesToVerify) {
    await page.goto(`/${hash}`);
    await expect(page.locator('main h1')).toContainText(expectedTitle);
  }

  // Unknown route fallback without crashing
  await page.goto('/#/ruta-desconocida-404');
  await expect(page.locator('main h1')).toBeVisible();

  // Back / Forward & Reload resilience
  await page.goBack();
  await expect(page.locator('main h1')).toContainText(/Sobre ARQPIXEL Academy/i);
  await page.reload();
  await expect(page.locator('main h1')).toContainText(/Sobre ARQPIXEL Academy/i);

  await assertCleanBrowserTelemetry(page, guards);
});

test('ARQ-022: Aula #/aprender/A05?senior=1 → Diagrama enriquecido → HintDrawer → SolutionReveal → Reflexión Senior → XP idempotente tras reload', async ({
  page,
}) => {
  const guards = await attachBrowserGuards(page);
  await page.goto('/#/aprender/A05?senior=1');

  await expect(page.locator('.lesson-visual-enrichment[data-enrichment-module="A05"]')).toBeVisible();
  await expect(page.locator('svg.lesson-arch-svg')).toBeVisible();

  // Progressive hint drawer
  const hintBtn = page.locator('#lesson-hint-next-btn');
  await expect(hintBtn).toBeVisible();
  await hintBtn.click();
  await expect(page.locator('.hint-list li')).toHaveCount(1);

  // Answer quiz (A05 correct === 0) & unlock SolutionReveal
  await page.locator('[data-answer="0"]').click();
  await expect(page.locator('.solution-reveal')).toBeVisible();

  // Complete module and verify +50 XP
  await page.locator('#complete-lesson').click();
  await expect(page.locator('#header-xp')).toContainText('50 XP');

  // Reload and confirm persistence + idempotency (re-completing never inflates XP)
  await page.reload();
  await expect(page.locator('#header-xp')).toContainText('50 XP');
  await page.locator('#complete-lesson').click();
  await expect(page.locator('#header-xp')).toContainText('50 XP');

  // Contextual Senior challenge inside lesson
  const seniorNotes = page.locator('#lesson-notes');
  await expect(seniorNotes).toBeVisible();
  await seniorNotes.fill(
    'Ante 18.000 req/min y SLO 99,95 %, adoptamos Transactional Outbox en la misma transacción SQL y consumidor idempotente con deduplicación; descartamos dual-write directo por riesgo de eventos perdidos y coste de inconsistencia. Verificamos con tests de corte de red y monitor de lag.',
  );
  await page.locator('#check-senior-lesson').click();
  await expect(page.locator('#senior-lesson-report')).toContainText('REQUIRES_REVIEW');

  await assertCleanBrowserTelemetry(page, guards);
});

test('ARQ-022: Laboratorios interactivos y descargas reales verificadas (C4 JSON/Mermaid/SVG/PNG, DDD .md y ADR .md)', async ({
  page,
}) => {
  const guards = await attachBrowserGuards(page);

  // 1. C4 Studio exports
  await page.goto('/#/laboratorio/c4');
  await expect(page.locator('#c4-export')).toBeVisible();

  const [jsonDl] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#c4-export').click(),
  ]);
  const jsonContent = JSON.parse(readFileSync((await jsonDl.path())!, 'utf8'));
  expect(jsonContent.containers.length).toBeGreaterThanOrEqual(2);

  const [mmdDl] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#c4-mermaid').click(),
  ]);
  const mmdText = readFileSync((await mmdDl.path())!, 'utf8');
  expect(mmdText).toContain('flowchart');

  const [svgDl] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#c4-svg').click(),
  ]);
  const svgText = readFileSync((await svgDl.path())!, 'utf8');
  expect(svgText).toContain('<svg');

  const [pngDl] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#c4-png').click(),
  ]);
  const pngBytes = readFileSync((await pngDl.path())!);
  expect(Array.from(pngBytes.subarray(0, 4))).toEqual([0x89, 0x50, 0x4e, 0x47]);

  // 2. DDD Workshop export
  await page.goto('/#/laboratorio/ddd');
  const [dddDl] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#ddd-export-md').click(),
  ]);
  expect(readFileSync((await dddDl.path())!, 'utf8')).toContain('Context Map');

  // 3. ADR Studio export
  await page.goto('/#/laboratorio/adr');
  await page.locator('#adr-context').fill('20.000 req/min en campaña flash y equipo de 6 personas.');
  await page.locator('#adr-decision').fill('Adoptamos monolito modular con Outbox transaccional.');
  await page.locator('#adr-tradeoff').fill('Descartamos microservicios prematuros por sobrecarga operativa.');
  const [adrDl] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#adr-export').click(),
  ]);
  expect(readFileSync((await adrDl.path())!, 'utf8')).toContain('ADR-001');

  await assertCleanBrowserTelemetry(page, guards);
});

test('ARQ-022: Senior Mode 2.0 (S09) — Fase 2 encadenada, dictamen humano separado y exportación real Dossier v2 JSON/MD', async ({
  page,
}) => {
  const guards = await attachBrowserGuards(page);
  await page.goto('/#/taller-senior/S09');

  await expect(page.locator('#suite-consequences-panel')).toContainText('Estimación FinOps mensual');

  // Select required S09 components (Idempotencia + Cola de eventos) and connect them
  await page.locator('[data-suite-arch="Idempotencia"]').check();
  await page.locator('[data-suite-arch="Cola de eventos"]').check();
  await page.locator('#suite-edge-from').selectOption('Idempotencia');
  await page.locator('#suite-edge-to').selectOption('Cola de eventos');
  await page.locator('#suite-add-edge').click();

  // Attach structured Mentor Review
  await page.locator('#human-review-gate summary').click();
  await page.locator('#mentor-name').fill('Comité Arquitectura Vigilio');
  await page.locator('#mentor-role').fill('Principal Software Architect');
  await page.locator('#mentor-adr').fill('Cubre claramente invariantes de cobro único.');
  await page.locator('#mentor-tradeoff').fill('Explicita latencia eventual y retención de claves.');
  await page.locator('#mentor-failures').fill('Aborda caída post-commit y webhooks repetidos.');
  await page.locator('#mentor-verif').fill('Define simulación determinista de replay y lag.');
  await page.locator('#mentor-notes').fill('Revisión humana registrada de forma independiente al score.');
  await page.locator('#save-mentor-review').click();
  await expect(page.locator('#mentor-review-status')).toContainText('APPROVED_WITH_EVIDENCE');

  // Export Dossier v2 JSON & Markdown
  const [dossierJsonDl] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#suite-export').click(),
  ]);
  const dossierV2 = JSON.parse(readFileSync((await dossierJsonDl.path())!, 'utf8'));
  expect(dossierV2.schemaVersion).toBe(2);
  expect(dossierV2.format).toBe('ARQPIXEL-SENIOR-DOSSIER-V2');
  expect(dossierV2.humanReview.verdict).toBe('APPROVED_WITH_EVIDENCE');
  expect(dossierV2.mechanicalSummary.separationGuarantee).toContain('no altera el XP');

  const [dossierMdDl] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#suite-export-md').click(),
  ]);
  const mdText = readFileSync((await dossierMdDl.path())!, 'utf8');
  expect(mdText).toContain('Guía de preguntas para el Revisor Humano');

  await assertCleanBrowserTelemetry(page, guards);
});

test('ARQ-022: Minijuego completo + Backup v2 (exportar → restablecer → restaurar) + rechazo fail-closed de backup corrupto', async ({
  page,
}) => {
  const guards = await attachBrowserGuards(page);

  await page.goto('/#/minijuego/tetris');
  for (let i = 0; i < 6; i++) {
    await page.locator('[data-mini-answer="0"]').click();
    await page.locator('#mini-next').click();
  }
  await expect(page.locator('.mini-game-complete')).toBeVisible();

  await page.goto('/#/perfil');
  const [backupDl] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#export-progress').click(),
  ]);
  const backupBuffer = readFileSync((await backupDl.path())!);
  const backupJson = JSON.parse(backupBuffer.toString('utf8'));
  expect(backupJson.version).toBe(2);

  // Accept confirm dialog when resetting
  page.once('dialog', (dlg) => dlg.accept());
  await page.locator('#reset-progress').click();

  // Restore valid backup
  await page.locator('#import-progress').setInputFiles({
    name: 'arqpixel-backup-v2.json',
    mimeType: 'application/json',
    buffer: backupBuffer,
  });
  await expect(page.locator('#profile-feedback')).toContainText(/Progreso importado/i);

  // Attempt hostile/corrupt backup upload -> rejected fail-closed without crashing or erasing valid data
  await page.locator('#import-progress').setInputFiles({
    name: 'corrupt-hostile.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"app":"ARQPIXEL","version":999,"evil":true}', 'utf8'),
  });
  await expect(page.locator('#profile-feedback')).toContainText(/No se pudo importar/i);

  const storedMini = await page.evaluate(() => localStorage.getItem('arqpixel-minigames-v1'));
  expect(storedMini).toContain('tetris');

  await assertCleanBrowserTelemetry(page, guards);
});
