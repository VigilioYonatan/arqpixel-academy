# AUDITORÍA DE ENTREGA Y TRAZABILIDAD VIGILIO 2026 — ARQPIXEL Academy (`v2.0 / Dossier v2`)

> **Conservación histórica:** El informe original de `v1.7` se preserva íntegro en [`docs/AUDIT_REPORT_v1_7_HISTORICO.md`](docs/AUDIT_REPORT_v1_7_HISTORICO.md), junto con `v1.1`, `v1.2`, `v1.3` y `v1.6` bajo `docs/`.

**Dictamen técnico local:** **`APPROVE` (`READY` en el 100 % de los controles ejecutables locales y de navegador HTTP real)**. Los controles que dependen de binarios Python opcionales no instalados en el host se reportan honestamente como **`BLOCKED`**, y los que dependen de runners remotos en la nube (GitHub Actions hospedado, CDN TLS externo) o de sesión manual humana con lector de pantalla asistivo (NVDA/VoiceOver) se registran honestamente como **`NOT_RUN`**, jamás como `PASS` ficticio.

---

## 1. Conservación Cero Pérdida (`Zero-Loss Audit`)

- **Rutas históricas de `v1.6` conservadas:** `223 / 223` (`100 %`).
- **Rutas históricas de `v1.7` conservadas:** `240 / 240` (`100 %`, verificado automáticamente por `scripts/verify-zero-loss-and-package.mjs` contra `docs/CHECKSUMS_v1_7_HISTORICO.sha256`).
- **Archivos eliminados:** **`0`**.
- **Compatibilidad de progreso:** Migración verificada con fixtures reales `v1.2`, `v1.3`, `v1.5`, `v1.6`, `v1.7` y `v2.0` (`tests/backup-migrations.test.mjs`, `tests/final-dod-settings-release-25.test.mjs` y `tests/e2e/release-readiness-25.spec.ts`) con recálculo idempotente de XP y rechazo fail-closed de JSON corruptos o contaminados.

---

## 2. Estado Real de Gates Ejecutados (`PASS / FAIL / NOT_RUN / BLOCKED`)

| Control / Comando | Herramienta / Entorno Real | Resultado | Evidencia |
|---|---|---|---|
| Compilación estricta TypeScript (`npm run typecheck`) | `tools/typescript` (`tsc 5.8.3`, `strict: true`, `0` `any`) | **`PASS`** | Exit `0` sobre todos los módulos en `src/` |
| Linter estático Vigilio (`pnpm run biome:check`) | `@biomejs/biome@2.6.3` (`biome ci src scripts tests`) | **`PASS`** | Exit `0` (`0` errores sobre todos los archivos auditados) |
| Build offline y sincronización de assets (`npm run build`) | `tsc` + `scripts/copy-assets.mjs` | **`PASS`** | `dist/` sincronizado con 16 sprites RGBA ArquiBot, 7 catálogos JSON y `three@0.187.0` ESM vendorizado |
| Presupuesto de bundle y cero fugas Node (`npm run bundle:budget`) | `scripts/check-bundle-budget.mjs` | **`PASS`** | Cada chunk JS `< 145 KB`; `0` marcadores `node:*` o `@nestjs/*` en `dist/` |
| Gobernanza Supply Chain, Lockfile y Políglota (`governance:*`) | `check-workflows-governance.mjs`, `check-toolchain-lockfile.mjs`, `check-polyglot-architecture.mjs` | **`PASS`** | Acciones fijadas por SHA-40, `pnpm-lock.yaml` íntegro y `0` violaciones hexagonales en TS/C#/Java |
| Manifiesto DoD Curricular y Senior (`npm run governance:dod`) | `scripts/check-dod-manifest.mjs` → `reports/curriculum-dod-verification.json` | **`PASS`** | **`36 / 36` módulos y `18 / 18` misiones Senior** verificados como `implemented` (`0` sin verificar) |
| Suite unitaria, contratos, arquitectura y BDD (`npm test`) | Node.js (`node:test`) | **`PASS`** | **`152 / 152` pruebas en `PASS`** (`0` fallos) |
| Laboratorio ejecutable de referencia (`npm --prefix examples/nexoshop-reference-nestjs test`) | TypeScript + Node `node:test` offline | **`PASS`** | **`4 / 4` pruebas en `PASS`** (Hexagonal `S04`, Stock optimista `S06`, Outbox + Idempotencia `S09`, anti-BOLA `S12`) |
| Seguridad offline (`security:scan`, `headers`, `licenses`, `sbom`, `release-check`) | `npm run devsecops:offline` | **`PASS`** | Exit `0`; CSP `style-src 'self'` y `font-src 'self'` sin `'unsafe-inline'`, SBOM CycloneDX 1.5 (`Apache-2.0` + `MIT` + `SIL OFL-1.1`) |
| E2E HTTP real + capturas + resiliencia UX (`pnpm run test:e2e`) | `@playwright/test@1.64.1` + Chromium headless + `scripts/serve-dist-with-headers.mjs` | **`PASS`** | **`19 / 19` pruebas E2E en `PASS`**: rutas, onboarding, cuarentena de storage corrupto, modal `?` con focus trap, 3D WebGL Raycaster/Órbita, descargas reales, recarga y capturas PNG en `reports/screenshots/` |
| Accesibilidad automatizada WCAG 2.2 AA (`@axe-core/playwright`) | `axe-core` `4.12.1` en temas `dark`, `light` y `high-contrast` | **`PASS`** | **`0` violaciones críticas y `0` serias** en las 24 auditorías pantalla × tema + targets `>= 24x24 px` |
| Runner Python heredado (`npm run test:browser`) | `python tests/browser-e2e.py` (Python `3.14.7`) | **`BLOCKED`** | `ModuleNotFoundError: No module named 'playwright'` en el intérprete Python del host; cubierto en navegador real por `@playwright/test@1.64.1` (`PASS`) |
| Runner remoto GitHub Actions / Trivy / Gitleaks en nube | Requiere push a repositorio remoto GitHub | **`NOT_RUN`** | Workflow validado estáticamente con SHAs de 40 caracteres; no ejecutado en runner cloud externo |
| Hosting CDN/HTTPS externo y lector de pantalla humano (NVDA/VoiceOver) | Requiere despliegue externo y sesión asistiva humana | **`NOT_RUN`** | Guía reproducible incluida en `docs/E2E_56_CONTROLS_AND_WCAG_MATRIX.md` |

---

## 3. Límites Pedagógicos Declarados (`ADR-0003`)

- Los motores de ARQPIXEL evalúan estructura, grafos dirigidos acíclicos, cobertura de restricciones cuantitativas y cálculos reproducibles (`PASS / FAIL / NOT_RUN / BLOCKED`).
- Todo juicio arquitectónico abierto (ADRs en misiones `S01–S18`, reflexiones Senior en aula y los 11 proyectos Capstone) conserva siempre `REQUIRES_REVIEW` sin marcas de «aprobado por IA»; el dictamen humano importable/adjuntable en Dossier v2 o rúbrica 1–4 con detección FNV-1a de deriva se audita por separado y nunca altera ni infla el puntaje mecánico ni el XP.
