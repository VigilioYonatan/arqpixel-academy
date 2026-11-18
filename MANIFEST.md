# MANIFEST DE ENTREGA — ARQPIXEL Academy (`v1.7+ / Alineación Vigilio 2026`)

> **Conservación histórica:** El manifiesto original de `v1.7` se conserva íntegro en [`docs/MANIFEST_v1_7_HISTORICO.md`](docs/MANIFEST_v1_7_HISTORICO.md) junto con `v1.3` y `v1.6`.

**Raíz única dentro del ZIP de entrega:** `arqpixel-academy/`.

## 1. Garantía de Cero Pérdida (`Zero-Loss`)

- **Rutas de `v1.6` conservadas:** `223 / 223`.
- **Rutas de `v1.7` conservadas:** `240 / 240` (`0` archivos eliminados; comprobado automáticamente por `scripts/verify-zero-loss-and-package.mjs`).
- **Exclusiones conscientes del ZIP de release:** `node_modules/`, `.git/`, `playwright-report/`, `test-results/`, `.tmp/` y cachés efímeras nunca se empaquetan. El proyecto compilado en `dist/` y el compilador en `tools/typescript/` permiten servir y recompilar la aplicación 100 % offline sin internet.

## 2. Piezas Principales Incorporadas en la Alineación 100 % Vigilio (`ARQ-001..ARQ-025`)

- **Gobernanza y ADRs:** `AGENTS.md`, `PENDIENTES_100_POR_CIENTO_ARQPIXEL.md`, `compatibility.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `docs/adr/0001..0005.md`, `docs/E2E_56_CONTROLS_AND_WCAG_MATRIX.md`.
- **Arquitectura modular por features (`src/features/`):** `curriculum/`, `labs/`, `projects/`, `resources/`, `profile/`, `senior/`, `shared/` con schemas propietarios en borde, constantes tipadas y cero carpeta `contracts/` global.
- **Identidad visual ArquiBot:** 16 sprites PNG RGBA transparentes (`>= 512×512`) en `public/assets/arquibot/` + `data/assets-manifest.json`.
- **Laboratorios y Senior Mode 2.0:** `src/c4-studio.ts` (`C1/C2/C3`), `src/ddd-workshop.ts`, `src/features/labs/advanced-labs.ts`, `src/features/senior/senior-evolution-engine.ts` (telemetría FinOps/Capacidad + Fase 2 encadenada + Dossier v2 con revisión humana separada).
- **Repositorio ejecutable de referencia:** `examples/nexoshop-reference-nestjs/` con dominio puro, stock optimista, Transactional Outbox, `Idempotency-Key`, anti-BOLA y suite propia de tests offline.
- **Seguridad, QA y Evidencia:** `scripts/serve-dist-with-headers.mjs` (CSP `style-src 'self'` sin `'unsafe-inline'`), `scripts/check-bundle-budget.mjs`, `scripts/check-workflows-governance.mjs`, `scripts/write-operational-evidence.mjs`, `scripts/verify-zero-loss-and-package.mjs`, `security/operational-evidence.json`, `playwright.config.ts`, `tests/e2e/*.spec.ts` y fixtures históricos `tests/fixtures/backups/backup-v1.2..v2.0.json`.
