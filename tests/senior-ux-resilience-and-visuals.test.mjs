import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderLabTelemetryHeaderHtml } from '../dist/features/labs/lab-visual-diagnostics.js';
import { renderMinigamesCatalogHtml } from '../dist/features/minigames/three-arcade-stage.js';
import { userSettingsSchema } from '../dist/features/profile/schemas/settings.schema.js';
import {
  dismissCorruptBackupSnapshot,
  inspectAndQuarantineCorruptedStorage,
  readAdrLabDraft,
  readCorruptBackupSnapshot,
  readLastVisitedRoute,
  readOnboardingDismissed,
  recordLastVisitedRoute,
  renderFirstVisitOnboardingHtml,
  renderKeyboardShortcutsModalHtml,
  renderResumeLastActivityBarHtml,
  renderSystemResilienceBannersHtml,
  saveAdrLabDraft,
  setOnboardingDismissed,
} from '../dist/features/shared/ui/resilience-and-onboarding.js';
import { renderHomeInteractiveBlueprintHtml } from '../dist/features/shared/ui/visual-clarity.js';
import { shouldIncludeInRelease } from '../scripts/verify-zero-loss-and-package.mjs';

function createMemoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    key(idx) {
      return Array.from(map.keys())[idx] ?? null;
    },
    getItem(k) {
      return map.has(k) ? map.get(k) : null;
    },
    setItem(k, v) {
      map.set(String(k), String(v));
    },
    removeItem(k) {
      map.delete(String(k));
    },
  };
}

describe('Feature: Senior UX Resilience, Storage Quarantine, Onboarding, Draft Persistence & CSP-Safe SVGs', () => {
  it('Scenario: Given malformed JSON in localStorage, When boot inspects storage, Then it quarantines raw data without silent loss and renders accessible alert banner', () => {
    const storage = createMemoryStorage({
      'arqpixel-progress-v1': '{"done": "BROKEN_NOT_ARRAY"}',
      'arqpixel-senior-suite-v2-S09-42': '{truncated-json',
    });

    const snap = inspectAndQuarantineCorruptedStorage(storage);
    assert.ok(snap !== null);
    assert.equal(snap.affectedKeys.length, 2);
    assert.ok(snap.affectedKeys.includes('arqpixel-progress-v1'));
    assert.ok(snap.affectedKeys.includes('arqpixel-senior-suite-v2-S09-42'));
    assert.equal(snap.rawEntries['arqpixel-senior-suite-v2-S09-42'], '{truncated-json');

    const persisted = readCorruptBackupSnapshot(storage);
    assert.ok(persisted !== null);
    assert.equal(persisted.affectedKeys.length, 2);

    const banners_html = renderSystemResilienceBannersHtml({
      isOffline: true,
      storageWriteError: 'QuotaExceededError',
      corruptSnapshot: persisted,
    });
    assert.ok(banners_html.includes('data-offline-banner="true"'));
    assert.ok(banners_html.includes('data-storage-error-banner="true"'));
    assert.ok(banners_html.includes('data-corrupt-storage-banner="true"'));
    assert.equal(/\bstyle\s*=\s*["']/.test(banners_html), false);

    dismissCorruptBackupSnapshot(storage);
    assert.equal(readCorruptBackupSnapshot(storage), null);
  });

  it('Scenario: Given first-visit onboarding, last-visited pointer & ADR lab draft, When persisted and validated, Then XSS URLs are rejected and drafts survive navigation', () => {
    const storage = createMemoryStorage();
    assert.equal(readOnboardingDismissed(storage), false);
    setOnboardingDismissed(storage);
    assert.equal(readOnboardingDismissed(storage), true);

    recordLastVisitedRoute(
      {
        href: '#/taller-senior/S09?seed=42',
        category: 'Senior S09 (Seed 42)',
        title: 'Pedido y pago distribuido',
      },
      storage,
    );
    const valid_ptr = readLastVisitedRoute(storage);
    assert.ok(valid_ptr !== null);
    assert.equal(valid_ptr.href, '#/taller-senior/S09?seed=42');

    // Attempt XSS / external URL injection
    recordLastVisitedRoute(
      {
        href: 'javascript:alert(1)',
        category: 'Attack',
        title: 'XSS',
      },
      storage,
    );
    assert.equal(readLastVisitedRoute(storage)?.href, '#/taller-senior/S09?seed=42');

    saveAdrLabDraft(
      {
        optionId: 'event-microservices',
        title: 'ADR-009 Pagos con Outbox',
        context: 'Pico quincenal de 25k req/min',
        decision: 'Transactional Outbox + consumidor idempotente',
        tradeoff: 'Mayor observabilidad de lag y DLQ',
      },
      storage,
    );
    const adr_draft = readAdrLabDraft(storage);
    assert.ok(adr_draft !== null);
    assert.equal(adr_draft.optionId, 'event-microservices');
    assert.equal(adr_draft.title, 'ADR-009 Pagos con Outbox');
  });

  it('Scenario: Given system theme mode, release file exclusions & updated SVG templates, When validated, Then zero inline style attributes exist and transient logs are excluded', () => {
    const sys_parsed = userSettingsSchema.safeParse(
      {
        themeMode: 'system',
        reducedMotion: true,
        fontScale: 'large',
        classroomSidebarOpen: false,
      },
      'settings',
    );
    assert.equal(sys_parsed.success, true);

    assert.equal(shouldIncludeInRelease('http.log'), false);
    assert.equal(shouldIncludeInRelease('http.pid'), false);
    assert.equal(shouldIncludeInRelease('verify-run.log'), false);
    assert.equal(shouldIncludeInRelease('src/app.ts'), true);

    const fragments = [
      renderFirstVisitOnboardingHtml(),
      renderResumeLastActivityBarHtml({
        href: '#/laboratorio/c4',
        category: 'Laboratorio',
        title: 'C4 Studio',
        updatedAt: '2026-11-18T00:00:00Z',
      }),
      renderKeyboardShortcutsModalHtml(true),
      renderHomeInteractiveBlueprintHtml('modular-monolith'),
      renderLabTelemetryHeaderHtml('c4'),
      renderMinigamesCatalogHtml(
        [
          {
            id: 'tetris',
            icon: '▥',
            tag: 'CAPAS',
            title: 'Arquitectura Tetris',
            subtitle: 'Capas',
            bestScore: 5,
            starsCount: 3,
          },
        ],
        5,
      ),
    ];

    for (const html of fragments) {
      assert.equal(/\bstyle\s*=\s*["']/.test(html), false);
    }
  });
});
