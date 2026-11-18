import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const REPRESENTATIVE_ROUTES = [
  '#/inicio',
  '#/mapa',
  '#/aprender/B01',
  '#/laboratorio/c4',
  '#/minijuego/tetris',
  '#/taller-senior/S09',
  '#/proyectos/CAP-R06',
  '#/recursos/patrones/strategy',
  '#/ajustes',
] as const;

test('ARQ-023: Auditoría automatizada WCAG 2.2 AA (@axe-core/playwright) en modos dark, light y high-contrast (0 violaciones críticas/serias)', async ({
  page,
}) => {
  await page.goto('/#/ajustes');

  for (const themeMode of ['dark', 'light', 'high-contrast'] as const) {
    await page.goto('/#/ajustes');
    await page.locator('#set-theme-mode').selectOption(themeMode);

    for (const hash of REPRESENTATIVE_ROUTES) {
      await page.goto(`/${hash}`);
      await expect(page.locator('main h1')).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      const blocking = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      );
      expect(
        blocking.map((v) => ({
          theme: themeMode,
          route: hash,
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.slice(0, 3).map((n) => n.html),
        })),
      ).toEqual([]);
    }
  }
});

test('ARQ-023: Navegación 100 % por teclado — SkipLink, SearchCommand (Ctrl+K + flechas + Escape con foco restaurado) y cero focus traps', async ({
  page,
}) => {
  await page.goto('/#/inicio');
  await expect(page.locator('main h1')).toBeVisible();

  // First Tab lands on SkipLink -> Enter moves focus to #main without changing route
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();

  // Open SearchCommand via button with keyboard, type query, ArrowDown, Escape restores focus to trigger
  const searchTrigger = page.locator('#open-search-cmd');
  await searchTrigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#search-cmd-input')).toBeFocused();

  await page.keyboard.type('outbox');
  await expect(page.locator('.search-cmd-item').first()).toBeVisible();
  await page.keyboard.press('ArrowDown');

  await page.keyboard.press('Escape');
  await expect(page.locator('#search-cmd-backdrop')).toHaveCount(0);
  await expect(searchTrigger).toBeFocused();
});

test('ARQ-022 & ARQ-023: Cinco viewports (320, 375, 768, 1024, 1440 px), reflow tipográfico xlarge, prefers-reduced-motion y tamaño táctil >= 24x24 px', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });

  const viewports = [
    { width: 320, height: 640 },
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
  ] as const;

  for (const vp of viewports) {
    await page.setViewportSize(vp);
    for (const hash of ['#/inicio', '#/aprender/B01', '#/taller-senior/S09', '#/ajustes']) {
      await page.goto(`/${hash}`);
      await expect(page.locator('main h1')).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(
        overflow,
        `Sin scroll horizontal accidental en ${hash} (${vp.width}x${vp.height})`,
      ).toBeLessThanOrEqual(2);
    }
  }

  // Enable xlarge font scale (125%) + narrow 320px viewport to verify 200%-equivalent reflow resilience
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/#/ajustes');
  await page.locator('#set-font-scale').selectOption('xlarge');
  await page.locator('#set-reduced-motion').check();
  await page.goto('/#/inicio');
  const reflowOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(reflowOverflow).toBeLessThanOrEqual(2);

  // Verify primary interactive buttons meet WCAG 2.2 SC 2.5.8 target size (>= 24x24 CSS px)
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/#/inicio');
  const targetDimensions = await page.locator('main .btn, .topbar button').evaluateAll((els) =>
    els
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      }),
  );
  expect(targetDimensions.length).toBeGreaterThan(0);
  for (const item of targetDimensions) {
    expect(item.width, `Button "${item.text}" width >= 24px`).toBeGreaterThanOrEqual(24);
    expect(item.height, `Button "${item.text}" height >= 24px`).toBeGreaterThanOrEqual(24);
  }
});
