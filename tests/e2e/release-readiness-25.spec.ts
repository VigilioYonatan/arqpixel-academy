import { existsSync, mkdirSync, statSync } from 'node:fs';
import { expect, test } from '@playwright/test';

test('§25 L2730: light, dark, mobile responsive, 3D Three.js and Senior S09 verified with real PNG screenshots', async ({
  page,
  request,
}) => {
  mkdirSync('reports/screenshots', { recursive: true });

  const font_res = await request.get('/fonts/silkscreen-latin.woff2');
  expect(font_res.status()).toBe(200);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/#/inicio');
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('.hero-pill')).toBeVisible();
  await expect(page.locator('#primary-sidebar .pixel-nav-icon')).toHaveCount(13);
  await expect(page.locator('#primary-sidebar .pixel-crown-gold')).toHaveCount(1);
  await expect(page.locator('#primary-sidebar .senior-dot')).toBeVisible();

  const font_audit = await page.evaluate(() => {
    const kpi = document.querySelector('.arq-stats-strip strong');
    const prose = document.querySelector('.hero-copy p');
    return {
      kpiFont: kpi ? getComputedStyle(kpi).fontFamily : '',
      proseFont: prose ? getComputedStyle(prose).fontFamily : '',
    };
  });
  expect(font_audit.kpiFont.toLowerCase()).toContain('silkscreen');
  expect(font_audit.proseFont.toLowerCase()).toContain('dm sans');
  expect(font_audit.proseFont.toLowerCase()).not.toContain('silkscreen');

  await expect(page.locator('.orbit-chip')).toHaveCount(4);
  await expect(page.locator('.arq-level-card')).toHaveCount(3);
  await expect(page.locator('.home-spec-pill')).toHaveCount(8);
  await expect(page.locator('.senior-feature-band')).toBeVisible();
  await expect(page.locator('.arq-bottom-cta')).toBeVisible();
  await page.screenshot({ path: 'reports/screenshots/landing-dark-desktop.png', fullPage: false });

  // Switch to light theme and capture desktop light screenshot
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.screenshot({ path: 'reports/screenshots/landing-light-desktop.png', fullPage: false });

  // Switch back to dark and capture 375x812 mobile responsive screenshot + verify >= 44px mobile touch targets
  await page.locator('#theme-toggle').click();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/#/inicio');
  await expect(page.locator('main h1')).toBeVisible();
  const mobile_menu_box = await page.locator('#mobile-menu').boundingBox();
  expect(mobile_menu_box?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(mobile_menu_box?.width ?? 0).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: 'reports/screenshots/landing-mobile-375.png', fullPage: false });

  // Capture 3D Three.js minigame stage & Senior S09 workshop screenshots
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/#/minijuego/tetris');
  const stage_host = page.locator('#three-arcade-host');
  await expect(stage_host).toBeVisible();
  await expect
    .poll(async () => stage_host.getAttribute('data-renderer-mode'))
    .toMatch(/^(webgl-threejs|svg-fallback)$/);
  await page.screenshot({ path: 'reports/screenshots/minigame-3d-threejs.png', fullPage: false });

  await page.goto('/#/rutas');
  await expect(page.locator('.stats-strip')).toBeVisible();
  await expect(page.locator('.level-icon')).toHaveCount(3);

  await page.goto('/#/especializaciones');
  await expect(page.locator('.level-ghost-num')).toHaveCount(8);

  await page.goto('/#/proyectos');
  await expect(page.locator('.level-ghost-num')).toHaveCount(11);
  await expect(page.locator('.intro-stat')).toHaveCount(4);

  await page.goto('/#/laboratorios');
  await expect(page.locator('.stats-strip')).toBeVisible();

  await page.goto('/#/senior');
  await expect(page.locator('.level-ghost-num')).toHaveCount(18);
  await page.screenshot({ path: 'reports/screenshots/senior-dashboard-dark.png', fullPage: false });

  await page.goto('/#/taller-senior/S09?seed=42');
  await expect(page.locator('#senior-suite h1')).toContainText('S09');
  await page.screenshot({ path: 'reports/screenshots/senior-s09-dark.png', fullPage: false });

  await page.goto('/#/logros');
  const ach_select = page.locator('#ach-category-filter');
  await expect(ach_select).toBeVisible();
  const ach_layout = await page.evaluate(() => {
    const stats = document.querySelector('.stats-grid')?.getBoundingClientRect();
    const filter = document.querySelector('.map-filters-card')?.getBoundingClientRect();
    const sel = document.querySelector('#ach-category-filter') as HTMLSelectElement | null;
    const bg = sel ? getComputedStyle(sel).backgroundColor : '';
    return {
      gapPx: stats && filter ? Math.round(filter.top - stats.bottom) : 0,
      selectBg: bg,
      selectHeight: sel ? Math.round(sel.getBoundingClientRect().height) : 0,
    };
  });
  expect(ach_layout.gapPx).toBeGreaterThanOrEqual(16);
  expect(ach_layout.selectHeight).toBeGreaterThanOrEqual(40);
  expect(ach_layout.selectBg).not.toBe('rgb(255, 255, 255)');
  await page.screenshot({ path: 'reports/screenshots/achievements-dark.png', fullPage: false });

  for (const shot of [
    'reports/screenshots/landing-dark-desktop.png',
    'reports/screenshots/landing-light-desktop.png',
    'reports/screenshots/landing-mobile-375.png',
    'reports/screenshots/minigame-3d-threejs.png',
    'reports/screenshots/senior-dashboard-dark.png',
    'reports/screenshots/senior-s09-dark.png',
    'reports/screenshots/achievements-dark.png',
  ]) {
    expect(existsSync(shot), `${shot} must exist`).toBe(true);
    expect(statSync(shot).size, `${shot} must be non-empty PNG`).toBeGreaterThan(5_000);
  }
});

test('§21.5 L2618–L2621: reload preserves drafts/progress, reset requires confirmation, and import validates errors', async ({
  page,
}) => {
  await page.goto('/#/aprender/B01');
  await page.locator('#lesson-notes').fill('Nota persistente de prueba: monolito modular con contratos.');
  await page.locator('#save-notes').click();

  await page.goto('/#/taller-senior/S09?seed=42');
  await page
    .locator('#suite-adr')
    .fill('Borrador Senior S09 seed 42 conservado tras recargar navegador completo.');

  await page.reload();
  await expect(page.locator('#suite-adr')).toHaveValue(
    'Borrador Senior S09 seed 42 conservado tras recargar navegador completo.',
  );

  await page.goto('/#/aprender/B01');
  await expect(page.locator('#lesson-notes')).toHaveValue(
    'Nota persistente de prueba: monolito modular con contratos.',
  );
  await expect(page.locator('[data-module-references="true"]')).toBeVisible();

  // Test invalid JSON import error handling on #/perfil (L2619, L2621)
  await page.goto('/#/perfil');
  await page.locator('#import-progress').setInputFiles({
    name: 'corrupt-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ app: 'arqpixel-academy', version: '9.9', progress: {} })),
  });
  await expect(page.locator('#profile-feedback')).toContainText('No se pudo importar');

  // Test reset confirmation: dismissing dialog MUST keep notes intact (L2620)
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.locator('#reset-progress').click();
  await page.goto('/#/aprender/B01');
  await expect(page.locator('#lesson-notes')).toHaveValue(
    'Nota persistente de prueba: monolito modular con contratos.',
  );

  // Accepting reset dialog clears progress cleanly
  await page.goto('/#/perfil');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#reset-progress').click();
  await page.goto('/#/aprender/B01');
  await expect(page.locator('#lesson-notes')).toHaveValue('');
});

test('§21.4 L2613–L2614 & §23 L2693–L2694: Senior S09 E2E variant + seed regression + reasoned solution guide without AI approval', async ({
  page,
}) => {
  await page.goto('/#/taller-senior/S09?seed=0');
  const fp_seed0 = await page.locator('[data-criteria-fingerprint]').getAttribute('data-criteria-fingerprint');
  expect(fp_seed0).toMatch(/^fnv1a-[0-9a-f]{8}$/);

  await page.goto('/#/taller-senior/S09?seed=77');
  const fp_seed77 = await page.locator('[data-criteria-fingerprint]').getAttribute('data-criteria-fingerprint');
  expect(fp_seed77).toMatch(/^fnv1a-[0-9a-f]{8}$/);
  expect(fp_seed77).not.toBe(fp_seed0);

  // Evaluate on #/taller-senior/S09?seed=77 and verify reasoned solution guide + REQUIRES_REVIEW + no AI approval
  await page.locator('input[name="suite-diagnosis"]').first().check();
  await page.locator('#suite-evaluate').click();
  await expect(page.locator('[data-senior-alternatives="true"]')).toBeVisible();
  await expect(page.locator('[data-senior-solution-guide="true"]')).toBeVisible();
  await expect(page.locator('#suite-report')).toContainText('REQUIRES_REVIEW');

  // Repeat seed=0 to verify deterministic fingerprint stability
  await page.goto('/#/taller-senior/S09?seed=0');
  await expect(page.locator('[data-criteria-fingerprint]')).toHaveAttribute(
    'data-criteria-fingerprint',
    fp_seed0 || '',
  );
});

test('§25 L2737–L2738: clear licenses/privacy/terms on #/sobre and graceful .fatal recovery when catalog load fails', async ({
  browser,
  page,
}) => {
  await page.goto('/#/sobre');
  await expect(page.locator('[data-privacy-policy="true"]')).toBeVisible();
  await expect(page.locator('[data-licenses-table="true"]')).toContainText('Three.js');
  await expect(page.locator('[data-licenses-table="true"]')).toContainText('Apache-2.0');
  await expect(page.locator('[data-terms-of-use="true"]')).toBeVisible();

  // Isolated context simulating network/server failure on data/modules.json
  const fail_ctx = await browser.newContext();
  const fail_page = await fail_ctx.newPage();
  const uncaught: string[] = [];
  fail_page.on('pageerror', (err) => uncaught.push(err.message));
  await fail_page.route('**/data/modules.json', (route) =>
    route.fulfill({ status: 500, contentType: 'text/plain', body: 'Catalog unavailable' }),
  );
  await fail_page.goto('/#/inicio');
  await expect(fail_page.locator('.fatal h1')).toContainText('No se pudo iniciar ARQPIXEL');
  expect(uncaught).toEqual([]);
  await fail_ctx.close();
});

test('Senior UX Resilience: onboarding selector, ADR draft auto-save, resume bar, ? shortcuts modal focus trap & corrupted storage quarantine', async ({
  browser,
  page,
}) => {
  await page.goto('/#/inicio');
  await expect(page.locator('[data-onboarding-card="true"]')).toBeVisible();
  await page.locator('#dismiss-onboarding-card').click();
  await expect(page.locator('[data-onboarding-card="true"]')).toHaveCount(0);

  // Open ? shortcuts modal via keyboard, verify Tab focus trap and Escape close
  await page.locator('body').press('?');
  await expect(page.locator('[data-shortcuts-modal="true"]')).toBeVisible();
  await page.keyboard.press('Tab');
  const focused_inside = await page.evaluate(() =>
    Boolean(document.querySelector('#shortcuts-modal-dialog')?.contains(document.activeElement)),
  );
  expect(focused_inside).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-shortcuts-modal="true"]')).toHaveCount(0);

  // Visit ADR Lab, type draft, navigate to Home -> Resume bar appears & ADR draft persists on return
  await page.goto('/#/laboratorio/adr');
  await expect(page.locator('#primary-sidebar .nav-link.active')).toContainText('Laboratorios');
  await page.locator('#adr-title').fill('ADR-042 Outbox Transaccional');
  await page.goto('/#/inicio');
  await expect(page.locator('[data-resume-last-activity="true"]')).toContainText(
    'Architecture Decision Studio',
  );
  await page.goto('/#/laboratorio/adr');
  await expect(page.locator('#adr-title')).toHaveValue('ADR-042 Outbox Transaccional');

  // Isolated context with corrupted localStorage -> quarantine alert banner without uncaught errors
  const corrupt_ctx = await browser.newContext();
  const corrupt_page = await corrupt_ctx.newPage();
  const page_errors: string[] = [];
  corrupt_page.on('pageerror', (err) => page_errors.push(err.message));
  await corrupt_page.addInitScript(() => {
    localStorage.setItem('arqpixel-progress-v1', '{broken-json-payload');
  });
  await corrupt_page.goto('/#/inicio');
  await expect(corrupt_page.locator('[data-corrupt-storage-banner="true"]')).toBeVisible();
  await corrupt_page.locator('#banner-dismiss-corrupt-raw').click();
  await expect(corrupt_page.locator('[data-corrupt-storage-banner="true"]')).toHaveCount(0);
  expect(page_errors).toEqual([]);
  await corrupt_ctx.close();
});
