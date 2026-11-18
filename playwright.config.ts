import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, defineConfig, webkit } from '@playwright/test';

function resolveChromiumExecutable(): string | undefined {
  const defaultPath = chromium.executablePath();
  if (existsSync(defaultPath)) return undefined;

  const localAppData = process.env.LOCALAPPDATA;
  if (localAppData) {
    const msPlaywrightRoot = join(localAppData, 'ms-playwright');
    if (existsSync(msPlaywrightRoot)) {
      const candidates = readdirSync(msPlaywrightRoot)
        .filter((name) => name.startsWith('chromium-'))
        .sort()
        .reverse();
      for (const dir of candidates) {
        const winExe = join(msPlaywrightRoot, dir, 'chrome-win64', 'chrome.exe');
        if (existsSync(winExe)) return winExe;
        const linuxExe = join(msPlaywrightRoot, dir, 'chrome-linux', 'chrome');
        if (existsSync(linuxExe)) return linuxExe;
      }
    }
  }
  return undefined;
}

const fallbackChromiumPath = resolveChromiumExecutable();
const matchingWebkitInstalled = existsSync(webkit.executablePath());
const e2ePort = process.env.E2E_PORT ?? '4273';
const e2eBaseUrl = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: e2eBaseUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        launchOptions: fallbackChromiumPath
          ? { executablePath: fallbackChromiumPath }
          : undefined,
      },
    },
    ...(matchingWebkitInstalled
      ? [
          {
            name: 'webkit',
            testMatch: /multi-engine-p1-smoke\.spec\.ts/,
            use: {
              browserName: 'webkit' as const,
            },
          },
        ]
      : []),
  ],
  webServer: {
    command: `node scripts/serve-dist-with-headers.mjs --port ${e2ePort}`,
    url: e2eBaseUrl,
    reuseExistingServer: false,
    timeout: 15_000,
  },
});
