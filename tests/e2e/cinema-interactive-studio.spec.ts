import { mkdirSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('ADR-0007: Interactive Cinema & Studio Audio HD — 10 videos HD, transición Play/Pause, capítulos, CC, móvil sin overflow y WCAG 2.2 AA', async ({
  page,
  request,
}) => {
  mkdirSync('reports/screenshots', { recursive: true });

  // 1. Verify all 10 Studio HD MP3 files are served over HTTP with audio/mpeg and 200 OK
  for (const mp3 of [
    '/audio/home-intro.mp3',
    '/audio/senior-overview.mp3',
    '/audio/class-b01.mp3',
    '/audio/class-b02.mp3',
    '/audio/class-b03.mp3',
    '/audio/class-b04.mp3',
    '/audio/class-b05.mp3',
    '/audio/class-b06.mp3',
    '/audio/senior-s01.mp3',
    '/audio/senior-s02.mp3',
  ]) {
    const res = await request.get(mp3);
    expect(res.status(), `HTTP status for ${mp3}`).toBe(200);
    expect(res.headers()['content-type']).toContain('audio/mpeg');
    const csp = res.headers()['content-security-policy'] ?? '';
    expect(csp).toContain("media-src 'self' data:");
  }

  // 2. Desktop #/inicio — Single-Frame Poster -> Play -> Chapter Jump -> CC Toggle -> WCAG 2.2 AA
  await page.setViewportSize({ width: 1280, height: 820 });
  await page.goto('/#/inicio');

  const homeCinema = page.locator('[data-cinema-deck="HOME-INTRO"]');
  await expect(homeCinema).toBeVisible();
  await expect(homeCinema.locator('audio.cinema-audio-el')).toHaveAttribute('src', './audio/home-intro.mp3');
  await expect(homeCinema.locator('track[kind="captions"]')).toHaveCount(1);

  const posterBtn = homeCinema.locator('[data-cinema-play-poster]');
  await expect(posterBtn).toBeVisible();
  await expect(posterBtn).toContainText('De dibujar cajas a pensar como Arquitecto de Software Senior');

  // Click Play -> transitions from idle poster to active single-frame player
  await posterBtn.click();
  await expect(homeCinema).toHaveClass(/is-playing/);
  await expect(homeCinema.locator('[data-cinema-toggle-play]')).toHaveAttribute('aria-label', 'Pausar video');
  await expect(homeCinema.locator('.cinema-speaker-badge')).toContainText('Sofía · Tech Lead');
  await expect(homeCinema.locator('.cinema-subtitles')).toBeVisible();

  // Jump to chapter 02 (Mentor ArquiBot · Dependency Rings) and verify it does NOT snap back after loadedmetadata
  await homeCinema.locator('[data-cinema-jump="1"]').click();
  await page.waitForTimeout(300);
  await expect(homeCinema.locator('.cinema-speaker-badge')).toContainText('ArquiBot · Mentor Senior');
  await expect(homeCinema.locator('[data-stage-kind="dependency-rings"]')).toBeVisible();

  // Verify zero inline style attributes even during active playback
  const inlineStylesCount = await page.evaluate(() => document.querySelectorAll('[style]').length);
  expect(inlineStylesCount).toBe(0);

  // Axe WCAG 2.2 AA audit on LIVE playing cinema state
  const axePlaying = await new AxeBuilder({ page })
    .include('[data-cinema-deck="HOME-INTRO"]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const seriousViolations = axePlaying.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
  expect(seriousViolations).toEqual([]);

  // Toggle CC subtitles off and back on
  const ccBtn = homeCinema.locator('[data-cinema-toggle-cc]');
  await expect(ccBtn).toHaveAttribute('aria-pressed', 'true');
  await ccBtn.click();
  await expect(ccBtn).toHaveAttribute('aria-pressed', 'false');
  await expect(homeCinema.locator('.cinema-subtitles')).toHaveCount(0);
  await ccBtn.click();
  await expect(homeCinema.locator('.cinema-subtitles')).toBeVisible();

  // 3. Verify CLASS-B01..B06, SENIOR-OVERVIEW, and SENIOR-S01..S02 mount cleanly and tear down on route change
  const expectedRouteDecks = [
    ['/#/aprender/B01', 'CLASS-B01', './audio/class-b01.mp3'],
    ['/#/aprender/B02', 'CLASS-B02', './audio/class-b02.mp3'],
    ['/#/aprender/B03', 'CLASS-B03', './audio/class-b03.mp3'],
    ['/#/aprender/B04', 'CLASS-B04', './audio/class-b04.mp3'],
    ['/#/aprender/B05', 'CLASS-B05', './audio/class-b05.mp3'],
    ['/#/aprender/B06', 'CLASS-B06', './audio/class-b06.mp3'],
    ['/#/senior', 'SENIOR-OVERVIEW', './audio/senior-overview.mp3'],
    ['/#/taller-senior/S01', 'SENIOR-S01', './audio/senior-s01.mp3'],
    ['/#/taller-senior/S02', 'SENIOR-S02', './audio/senior-s02.mp3'],
  ] as const;

  for (const [routeHash, deckId, expectedSrc] of expectedRouteDecks) {
    await page.goto(routeHash);
    const deckHost = page.locator(`[data-cinema-deck="${deckId}"]`);
    await expect(deckHost).toBeVisible();
    await expect(deckHost.locator('audio.cinema-audio-el')).toHaveAttribute('src', expectedSrc);
    await deckHost.locator('[data-cinema-play-poster]').click();
    await expect(deckHost).toHaveClass(/is-playing/);
  }

  // Verify cold HTTP Range (206 Partial Content) + chapter jump persistence on CLASS-B03
  const rangeRes = await request.get('/audio/class-b03.mp3', {
    headers: { Range: 'bytes=0-1023' },
  });
  expect(rangeRes.status()).toBe(206);
  expect(rangeRes.headers()['accept-ranges']).toBe('bytes');

  await page.goto('/#/aprender/B03');
  const b03JumpHost = page.locator('[data-cinema-deck="CLASS-B03"]');
  await b03JumpHost.locator('[data-cinema-play-poster]').click();
  await b03JumpHost.locator('[data-cinema-jump="1"]').click();
  await page.waitForTimeout(300);
  await expect(b03JumpHost.locator('.cinema-dot-btn.active')).toContainText('02 · Cohesión');
  await expect(b03JumpHost.locator('[data-stage-kind="arch-code-diff"]')).toBeVisible();

  // Axe WCAG 2.2 AA audit on CLASS-B06 Scene 1 (dependency-rings violation mode)
  await page.goto('/#/aprender/B06');
  const b06Host = page.locator('[data-cinema-deck="CLASS-B06"]');
  await b06Host.locator('[data-cinema-play-poster]').click();
  await expect(b06Host.locator('[data-stage-kind="dependency-rings"]')).toBeVisible();
  const axeB06 = await new AxeBuilder({ page })
    .include('[data-cinema-deck="CLASS-B06"]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    axeB06.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious'),
  ).toEqual([]);

  // Also verify deterministic non-MP3 module storyboard (e.g. B07) works with resilient internal clock
  await page.goto('/#/aprender/B07');
  const b07Host = page.locator('[data-cinema-deck="CLASS-B07"]');
  await expect(b07Host).toBeVisible();
  await b07Host.locator('[data-cinema-play-poster]').click();
  await expect(b07Host).toHaveClass(/is-playing/);

  // 4. Mobile 375x812 — zero horizontal overflow + >= 44px touch targets
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/#/inicio');
  const mobileHome = page.locator('[data-cinema-deck="HOME-INTRO"]');
  await mobileHome.locator('[data-cinema-play-poster]').click();
  await expect(mobileHome).toHaveClass(/is-playing/);

  const playBtnBox = await mobileHome.locator('[data-cinema-toggle-play]').boundingBox();
  expect(playBtnBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(playBtnBox?.width ?? 0).toBeGreaterThanOrEqual(44);

  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(hasOverflow).toBe(false);
});
