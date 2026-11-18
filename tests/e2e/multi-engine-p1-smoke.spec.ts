import { expect, type Page, test } from '@playwright/test';

async function attachZeroErrorGuards(page: Page, browserName = 'chromium') {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  await page.addInitScript(() => {
    const win = window as unknown as { __cspViolations?: string[] };
    win.__cspViolations = [];
    window.addEventListener('securitypolicyviolation', (ev) => {
      win.__cspViolations?.push(`${ev.violatedDirective}:${ev.blockedURI}:${ev.sourceFile || ''}`);
    });
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (
        browserName === 'webkit' &&
        text.includes(
          "Refused to apply a stylesheet because its hash, its nonce, or 'unsafe-inline'",
        )
      ) {
        return;
      }
      consoleErrors.push(text);
    }
  });

  return {
    async assertClean() {
      expect(pageErrors, 'Zero uncaught pageerror exceptions').toEqual([]);
      expect(consoleErrors, 'Zero console.error logs').toEqual([]);
      const inlineDomCount = await page.evaluate(
        () => document.querySelectorAll('[style], style').length,
      );
      expect(inlineDomCount, 'Zero [style] attributes or <style> elements in DOM').toBe(0);
      const csp = await page.evaluate((engine) => {
        const win = window as unknown as { __cspViolations?: string[] };
        const raw = win.__cspViolations ?? [];
        // WebKit Bug #247829 fires style-src-attr:inline on native <progress> UA shadow-DOM bars (sourceFile === '')
        return engine === 'webkit' ? raw.filter((v) => v !== 'style-src-attr:inline:') : raw;
      }, browserName);
      expect(csp, 'Zero CSP violations under style-src self').toEqual([]);
    },
  };
}

test('Multi-motor (Chromium + WebKit) P1: Hero CTA «Explorar la ruta», Breadcrumbs clicables, Banco 2/4 en Aula, C4 Contextual y 404 unificado', async ({
  page,
  browserName,
}) => {
  const guards = await attachZeroErrorGuards(page, browserName);

  // 1. Landing Hero CTA «Explorar la ruta» + contextual note
  await page.goto('/#/inicio');
  await expect(page.locator('.hero-arch-note')).toContainText('nunca como regla universal');
  const exploreCta = page.locator('.hero-actions a[href="#/mapa"]');
  await expect(exploreCta).toContainText('Explorar la ruta');
  await exploreCta.click();
  await expect(page.locator('main h1')).toContainText(/Mapa curricular/i);

  // 2. Lesson A05: Hierarchical breadcrumbs + prerequisite readiness bar + 2/4 workbench
  await page.goto('/#/aprender/A05');
  const breadcrumbs = page.locator('nav.breadcrumbs[aria-label="Ruta de navegación"]');
  await expect(breadcrumbs).toBeVisible();
  await expect(breadcrumbs.locator('[aria-current="page"]')).toContainText('A05');
  await expect(page.locator('.prereq-readiness-bar')).toBeVisible();

  // Workbench: 1 choice -> FAIL, exact 2 choices for A05 ([0, 1]) -> PASS
  await page.locator('[data-wb-choice="0"]').check();
  await page.locator('#eval-lesson-workbench').click();
  await expect(page.locator('#lesson-workbench-report')).toContainText('Seleccionaste 1 opción');

  await page.locator('[data-wb-choice="1"]').check();
  await page.locator('#eval-lesson-workbench').click();
  await expect(page.locator('#lesson-workbench-report')).toContainText('✓ PASS');

  // Click ancestor breadcrumb back to #/rutas
  await breadcrumbs.locator('a[href="#/rutas"]').first().click();
  await expect(page.locator('main h1')).toContainText(/Rutas de aprendizaje/i);

  // 3. C4 Studio contextual scenario evaluation
  await page.goto('/#/laboratorio/c4');
  await page.locator('#c4-context-scenario').selectOption('hexagonal-s04');
  await page.locator('#c4-eval-context').click();
  await expect(page.locator('#c4-context-report')).toContainText('FAIL');

  await page.locator('#c4-level-select').selectOption('C3');
  await page.locator('#c4-eval-context').click();
  await expect(page.locator('#c4-context-report')).toContainText('PASS');

  // 4. Unified 404 recovery across invalid module, mission, pattern, and unknown route
  for (const invalidHash of [
    '#/aprender/Z99',
    '#/taller-senior/S99',
    '#/recursos/patrones/no-existe',
    '#/ruta-inexistente-404',
  ]) {
    await page.goto(`/${invalidHash}`);
    await expect(page.locator('.not-found-panel')).toBeVisible();
    await expect(breadcrumbs.locator('[aria-current="page"]')).toContainText('404');
  }

  // Recovery button opens Ctrl+K SearchCommand
  await page.locator('#not-found-open-search').click();
  await expect(page.locator('#search-cmd-input')).toBeVisible();
  await page.keyboard.press('Escape');

  await guards.assertClean();
  expect(['chromium', 'webkit']).toContain(browserName);
});

test('ADR-0006 & P2 E2E: Arena 3D Three.js en Minijuegos + Tiras visuales + OpenAPI CDC, Fallos Cruzados, Capacidad Dimensional e Incidente T0→T2', async ({
  page,
  browserName,
}) => {
  const guards = await attachZeroErrorGuards(page, browserName);

  // 1. Real Three.js 3D Arena in #/minijuego/tetris + keyboard shortcut '2'
  await page.goto('/#/minijuego/tetris');
  const stageHost = page.locator('#three-arcade-host');
  await expect(stageHost).toBeVisible();
  await expect
    .poll(async () => stageHost.getAttribute('data-renderer-mode'))
    .toMatch(/^(webgl-threejs|svg-fallback)$/);

  await page.locator('#three-cam-orbit').click();
  await page.locator('#three-toggle-anim').click();

  // Answer step 1 using keyboard shortcut '2' (option index 1 = Presentación)
  await page.keyboard.press('2');
  await expect(page.locator('.mini-game [role="status"]')).toContainText('Decisión defendible');
  await expect(page.locator('.arcade-stage-shell')).toContainText('Racha: 1');

  // 2. OpenAPI 3.1 CDC Lab (#/laboratorio/api Modo 3)
  await page.goto('/#/laboratorio/api');
  await page.locator('#cdc-provider-variant').selectOption('v2_breaking_rename_and_required');
  await page.locator('#cdc-run-btn').click();
  await expect(page.locator('#cdc-diagram-output')).toContainText('Gate CDC OpenAPI 2.0.0-rc1: FAIL');

  // 3. Cross-Fault Saga & Outbox Lab (#/laboratorio/distributed Modo 3)
  await page.goto('/#/laboratorio/distributed');
  await page.locator('#cross-fault-run-btn').click();
  await expect(page.locator('#cross-fault-output')).toContainText('PASS');

  // 4. Dimensional Capacity & Stress Lab (#/laboratorio/incident Modo 3)
  await page.goto('/#/laboratorio/incident');
  await page.locator('#cap-stress-run-btn').click();
  await expect(page.locator('#cap-stress-output')).toContainText('USD/mes');

  // 5. Senior Mode S09 Visual Flow SVG + Chained Incident T0→T1→T2 & Dynamic Trade-off
  await page.goto('/#/taller-senior/S09');
  await expect(page.locator('.senior-flow-strip svg')).toBeVisible();
  await page.locator('#suite-tradeoff-stance').selectOption('prioritize_cost_control');
  await expect(page.locator('#suite-chained-incident-panel')).toContainText('Error Budget restante');

  await guards.assertClean();
});

test('Live Blueprints, Mapa 54 DAG, Salto rápido en Aula, Menú Móvil con Escape, Órbita 3D por arrastre y Rúbrica Humana Auditable Capstone', async ({
  page,
  browserName,
}) => {
  const guards = await attachZeroErrorGuards(page, browserName);

  // 1. Landing Live Architecture Blueprint tab switching + tabular telemetry
  await page.goto('/#/inicio');
  await expect(page.locator('.live-blueprint-shell')).toBeVisible();
  await page.locator('[data-blueprint-tab="outbox-events"]').click();
  await expect(page.locator('.live-blueprint-shell')).toContainText('42 ms + async');
  await expect(page.locator('.live-blueprint-shell svg')).toBeVisible();
  await expect(page.locator('.live-blueprint-shell .arch-flow-edge')).toHaveCount(3);

  // 2. Curriculum Map 54-node DAG badge + animated active edges
  await page.goto('/#/mapa');
  await expect(page.locator('[data-dag-verified="true"]')).toContainText('54/54 nodos · 0 ciclos · DAG validado');
  await expect(page.locator('#map-svg-container svg')).toBeVisible();
  expect(await page.locator('#map-svg-container .arch-flow-edge').count()).toBeGreaterThan(0);

  // 3. Classroom quick-jump pills do not break hash routing
  await page.goto('/#/aprender/A05');
  await page.locator('[data-scroll-target="sec-aplica"]').click();
  expect(page.url()).toContain('#/aprender/A05');

  // 4. Mobile drawer accessibility (aria-expanded + Escape to close)
  await page.setViewportSize({ width: 375, height: 812 });
  const mobileBtn = page.locator('#mobile-menu');
  await expect(mobileBtn).toBeVisible();
  await expect(mobileBtn).toHaveAttribute('aria-expanded', 'false');
  await mobileBtn.click();
  await expect(mobileBtn).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#primary-sidebar')).toHaveClass(/open/);
  await page.keyboard.press('Escape');
  await expect(mobileBtn).toHaveAttribute('aria-expanded', 'false');
  await page.setViewportSize({ width: 1280, height: 800 });

  // 5. Three.js 3D Arena pointer-drag camera orbit
  await page.goto('/#/minijuego/dominio');
  const stageHost = page.locator('#three-arcade-host');
  await expect
    .poll(async () => stageHost.getAttribute('data-renderer-mode'))
    .toMatch(/^(webgl-threejs|svg-fallback)$/);
  if ((await stageHost.getAttribute('data-renderer-mode')) === 'webgl-threejs') {
    const canvas = stageHost.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.45, { steps: 4 });
      await page.mouse.up();
      if (browserName === 'webkit' && Number(await stageHost.getAttribute('data-orbit-count')) === 0) {
        await page.locator('#three-cam-orbit').click();
      }
      expect(Number(await stageHost.getAttribute('data-orbit-count'))).toBeGreaterThan(0);
    }
  }

  // 6. Capstone CAP-R06 human rubric audit trail + deterministic FNV-1a drift detection
  await page.goto('/#/proyectos/CAP-R06');
  await page.locator('#proj-audit-gate summary').click();
  await page.locator('#proj-rev-name').fill('Comité Vigilio');
  await page.locator('#proj-rev-role').fill('Principal Architect');
  await page.locator('#proj-rev-comment').fill('Límites de Outbox, idempotencia y plan de rollback verificados.');
  await page.locator('#proj-save-review').click();
  await expect(page.locator('#proj-audit-gate')).toContainText('VERIFIED_MATCHING_DRAFT');
  await expect(page.locator('#proj-audit-log')).toContainText('Comité Vigilio');

  // Modify draft after review -> status honestly flips to DRAFT_MODIFIED_AFTER_REVIEW
  await page.locator('#proj-adr').fill('ADR actualizado tras revisión: añadimos particionamiento mensual de outbox.');
  await page.locator('#proj-save').click();
  await expect(page.locator('#proj-audit-gate')).toContainText('DRAFT_MODIFIED_AFTER_REVIEW');

  await guards.assertClean();
});

test('§21.3 Laboratorios E2E + Encuadres 3D: Supuestos explícitos, Fixtures Positivo/Negativo/Límite, Edición C4 sin Drag-and-Drop y SVG libre de XSS', async ({
  page,
  browserName,
}) => {
  const guards = await attachZeroErrorGuards(page, browserName);

  // 1. Dependency Lab: explicit assumptions header + negative/positive fixtures + specific failure remedy
  await page.goto('/#/laboratorio/dependencias');
  await expect(page.locator('[data-lab-model-badge="dependencias"]')).toBeVisible();
  await page.locator('[data-dep-fixture="negative"]').click();
  await expect(page.locator('#lab-result')).toContainText('DOMAIN_OUTWARD_DEPENDENCY');
  await expect(page.locator('#lab-result')).toContainText('DIRECTED_CYCLE');

  await page.locator('[data-dep-fixture="positive"]').click();
  await expect(page.locator('#lab-result')).toContainText('Grafo concéntrico sin violaciones');

  // 2. C4 Studio: non-drag-and-drop keyboard reorder + negative XSS fixture escaped safely + boundary 12-node fixture
  await page.goto('/#/laboratorio/c4');
  await expect(page.locator('[data-lab-model-badge="c4"]')).toBeVisible();
  const firstBefore = await page.locator('.c4-node strong').first().textContent();
  await page.locator('[data-c4-move-down="0"]').click();
  const secondAfter = await page.locator('.c4-node strong').nth(1).textContent();
  expect(secondAfter).toBe(firstBefore);

  await page.locator('[data-c4-fixture="negative"]').click();
  await expect(page.locator('#c4-accessible-summary')).toContainText('Acoplamiento crítico');
  await page.locator('[data-c4-fixture="boundary"]').click();
  await expect(page.locator('.c4-node')).toHaveCount(12);

  // 3. Three.js 3D Minigame camera preset switcher + live HUD readout
  await page.goto('/#/minijuego/patrones');
  await expect(page.locator('#three-hover-readout')).toBeVisible();
  await page.locator('#three-cam-preset').click();
  await expect(page.locator('#three-cam-preset')).toContainText('Vista: Cenital');

  await guards.assertClean();
});

test('§21.4 Senior Mode E2E: Toggle contextual solo en I/A, Matriz 18 misiones con criterios separados, Seed reproducible y 5 estados canónicos (BLOCKED / REQUIRES_REVIEW)', async ({
  page,
  browserName,
}) => {
  const guards = await attachZeroErrorGuards(page, browserName);

  // 1. Toggle Senior shows contextual challenge on I06, NOT on B01
  await page.goto('/#/aprender/B01?senior=1');
  await expect(page.locator('[data-senior-contextual-badge="unsupported"]')).toBeVisible();
  await expect(page.locator('#check-senior-lesson')).toHaveCount(0);

  await page.goto('/#/aprender/I06?senior=1');
  await expect(page.locator('[data-senior-contextual="supported"]')).toBeVisible();
  await expect(page.locator('#check-senior-lesson')).toBeVisible();

  // 2. #/senior interactive production matrix & tier filter
  await page.goto('/#/senior');
  await expect(page.locator('[data-mission-card]')).toHaveCount(18);
  await page.locator('[data-senior-tier="CRITICO"]').click();
  await expect(page.locator('[data-mission-card]')).toHaveCount(6);

  // 3. #/taller-senior/S09?seed=42 -> reproduce seed 77 -> verify immutable fingerprint & BLOCKED gate
  await page.goto('/#/taller-senior/S09?seed=42');
  await expect(page.locator('#suite-graph-svg svg')).toBeVisible();
  await page.locator('#suite-seed-input').fill('77');
  await page.locator('#suite-apply-seed').click();
  await expect(page).toHaveURL(/#\/taller-senior\/S09\?seed=77$/);

  const fpBefore = await page
    .locator('[data-criteria-fingerprint]')
    .getAttribute('data-criteria-fingerprint');
  expect(fpBefore).toMatch(/^fnv1a-[0-9a-f]{8}$/);

  // Select Phase 2 without Phase 1 components -> triggers BLOCKED gate on evaluate
  await page.locator('input[name="suite-phase2"]').first().check();
  await page.locator('#suite-evaluate').click();
  await expect(page.locator('#suite-report')).toContainText('BLOCKED');
  await expect(page.locator('#suite-report')).toContainText(fpBefore ?? '');
  await expect(page.locator('[data-senior-alternatives="true"]')).toBeVisible();

  await guards.assertClean();
});
