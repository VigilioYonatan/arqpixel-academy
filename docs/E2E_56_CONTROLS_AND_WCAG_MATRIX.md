# Matriz de Trazabilidad E2E (56 Controles Vigilio) y Accesibilidad WCAG 2.2 AA — ARQPIXEL Academy

> **Fuentes normativas:** `vigilio-docs/standards/testing/e2e-quality-gates.md`, `vigilio-docs/stacks/frontend/web-mfe/testing/e2e-playwright.md`, `vigilio-docs/standards/experience/accessibility-inclusive-interactions.md`, `vigilio-docs/standards/experience/ux-quality-gates-and-ci-cd.md`.
>
> **Principio de honestidad (`ADR-0003` & `platform-validation-evidence`):** Se distinguen explícitamente los controles ejecutados y verificados en el runner real (`PASS`), los controles del dominio backend cubiertos sobre el repositorio ejecutable de referencia (`examples/nexoshop-reference-nestjs/`), y los controles que dependen de sesión manual con lector de pantalla asistivo o infraestructura cloud externa (`NOT_RUN`).

---

## 1. Catálogo de 56 Controles E2E Vigilio — Aplicación Proporcional a ARQPIXEL Academy

ARQPIXEL Academy es una **SPA educativa local-first sin autenticación remota ni BFF con base de datos en la nube**, acompañada por el **laboratorio backend ejecutable de referencia `examples/nexoshop-reference-nestjs/`** para los controles de autorización multi-tenant, concurrencia, idempotencia y Outbox.

| Grupo (# Control) | Cobertura en ARQPIXEL Academy + Repo Referencia | Evidencia Ejecutable | Estado |
|---|---|---|---|
| **01–08 · Estrategia, alcance, transiciones, error/recuperación y oráculo independiente** | Recorridos críticos mapeados (Aula, 8 Laboratorios, 5 Minijuegos, Senior Mode 2.0 Fase 1+Fase 2, Capstones, Backups v1.2→v2.0); transiciones inválidas y respaldos corruptos probados con oráculos independientes | `tests/e2e/http-security-routes-and-journeys.spec.ts`, `tests/bdd-*.test.mjs` | `PASS` |
| **09–16 · Datos aislados, cleanup, semilla determinista y readiness real** | Contexto Playwright limpio por test (`localStorage` aislado), `seed` reproducible en 18 misiones Senior, readiness HTTP vía `webServer.url` sin `waitForTimeout` fijo, cero credenciales reales | `playwright.config.ts`, `tests/senior-suite.test.mjs` | `PASS` |
| **17–24 · AuthN/AuthZ, tenant cruzado (BOLA/IDOR), exposición de campos y entrada hostil** | En SPA local-first: rechazo fail-closed de JSON hostil/contaminado (`__proto__`) y sanitización XSS/SVG. En `examples/nexoshop-reference-nestjs/`: denegación sin contexto (`401/403`), aislamiento `tenant_id` anti-BOLA y proyección allowlist sin columnas internas | `examples/nexoshop-reference-nestjs/tests/orders-reference.test.mjs`, `tests/schema-contracts.test.mjs`, `tests/e2e/http-security-routes-and-journeys.spec.ts` | `PASS` |
| **25–32 · HTTP observable, cabeceras CSP, idempotencia, concurrencia, rollback y Outbox** | Servidor HTTP real (`scripts/serve-dist-with-headers.mjs`) validando `200 / 404 / 405`, `style-src 'self'` sin `'unsafe-inline'`, `X-Frame-Options: DENY`, `nosniff`; concurrencia optimista, `Idempotency-Key` y rollback atómico de Outbox probados en repo NestJS y simuladores S09/LAB-F | `tests/e2e/http-security-routes-and-journeys.spec.ts`, `tests/csp-governance-and-evidence.test.mjs`, `examples/nexoshop-reference-nestjs/tests/orders-reference.test.mjs` | `PASS` |
| **33–40 · Locators accesibles, cero sleeps fijos, teclado, 5 viewports, deep-links y estados UI** | `SkipLink`, `SearchCommand` (`Ctrl+K`, flechas, `Escape` con restauración de foco), 5 viewports (`320`, `375`, `768`, `1024`, `1440` px), `prefers-reduced-motion: reduce`, reflow tipográfico `xlarge`, deep-links hash + `goBack()` + `reload()` | `tests/e2e/wcag-a11y-and-viewports.spec.ts`, `tests/e2e/http-security-routes-and-journeys.spec.ts` | `PASS` |
| **41–48 · Trazas en fallo, reproducibilidad, `retries: 0`, `forbidOnly: true` y cero skips ocultos** | `trace: 'retain-on-failure'`, `screenshot: 'only-on-failure'`, `retries: 0`, `forbidOnly: true`, cero `test.skip` permanentes | `playwright.config.ts` | `PASS` |
| **49–56 · Gate CI inmutable, artefactos retenidos, bloqueo de release y evidencia honesta** | `.github/workflows/quality-security.yml` con SHAs completos de 40 caracteres, job `Required CI Gate` y `security/operational-evidence.json` diferenciando controles ejecutados localmente (`PASS`) de runners cloud externos (`NOT_RUN`) | `.github/workflows/quality-security.yml`, `scripts/check-workflows-governance.mjs`, `security/operational-evidence.json` | `PASS` (local) / `NOT_RUN` (runner GitHub remoto) |

---

## 2. Matriz de Accesibilidad WCAG 2.2 AA por Pantalla y Capacidad

| Pantalla / Ruta | Auditoría `@axe-core/playwright` (`dark` / `light` / `high-contrast`) | Navegación Teclado y Foco Visible (`:focus-visible`) | Reflow (`320 px` + `xlarge`) y Touch Targets (`>= 24×24 px`) | Alternativa Textual / Semántica No-Color | Sesión Manual Lector de Pantalla Nativo (NVDA / VoiceOver) |
|---|---|---|---|---|---|
| `#/inicio` + Shell global (`SkipLink`, `SearchCommand`) | `PASS` (`0` críticas/serias) | `PASS` (`Tab` → `SkipLink` → `#main-content`; `Escape` restaura foco) | `PASS` (`overflow <= 2px`, botones `>= 24×24 px`) | `PASS` (`alt` y `width/height` en sprites RGBA) | `NOT_RUN` (requiere operador humano con NVDA) |
| `#/mapa` (Grafo 54 nodos) | `PASS` (`0` críticas/serias) | `PASS` (tabla accesible equivalente y enlaces enfocables) | `PASS` (contenedor con scroll propio controlado) | `PASS` (`<title>`, `<desc>` y tabla equivalente) | `NOT_RUN` |
| `#/aprender/:id` (Aula + Diagrama SVG + `HintDrawer` + `SolutionReveal`) | `PASS` (`0` críticas/serias) | `PASS` (opciones `<button>`, foco conservado al pedir pista) | `PASS` (`solution-compare-grid` colapsa a 1 columna en móvil) | `PASS` (iconos `✓ / ↺ / ⚡` + etiquetas textuales, no solo color) | `NOT_RUN` |
| `#/laboratorio/c4` & `#/laboratorio/ddd` | `PASS` (`0` críticas/serias) | `PASS` (`<label>` explícito en todos los `input`/`select`, `.sr-file-input` enfocable) | `PASS` (pestañas móviles `Contexto / Trabajo / Validación`) | `PASS` (`renderC4AccessibleSummaryHtml` + `aria-live="polite"`) | `NOT_RUN` |
| `#/taller-senior/:id` (Senior Mode 2.0 + Fase 2 + Revisión Humana) | `PASS` (`0` críticas/serias) | `PASS` (radios/checkboxes con `<label>`, import JSON enfocable con `.file-label:focus-within`) | `PASS` (`320–1440 px` verificado en E2E) | `PASS` (`PASS / FAIL / REQUIRES_REVIEW` explícitos en texto) | `NOT_RUN` |
| `#/proyectos/:id` & `#/recursos/patrones/:id` | `PASS` (`0` críticas/serias) | `PASS` (formularios asociados por `<label>`) | `PASS` | `PASS` (`<progress>` nativo con `aria-label`) | `NOT_RUN` |
| `#/ajustes`, `#/perfil` y `#/logros` | `PASS` (`0` críticas/serias) | `PASS` (controles de tema, escala tipográfica y `reduced-motion`) | `PASS` | `PASS` (`role="status"` y `<progress>` accesible) | `NOT_RUN` |

### Guía Reproducible para Sign-Off Manual con NVDA en Windows (Pendiente Humano `NOT_RUN`)
1. Iniciar el servidor con cabeceras reales: `npm run dev` (`http://127.0.0.1:4173`).
2. Activar **NVDA** (`Ctrl + Alt + N`) y recorrer con `Tab` desde la barra de direcciones:
   - Confirmar anuncio de *«Saltar al contenido principal»* (`Enter` mueve el foco a `<main id="main-content">`).
   - Abrir el buscador con `Ctrl + K`, escribir `outbox`, desplazarse con flechas y cerrar con `Escape` comprobando anuncio del diálogo modal y retorno del foco.
   - Cursar `#/aprender/A05?senior=1` y `#/taller-senior/S09` verificando que los cambios en `#live-announcer`, `#suite-consequences-panel` y `#mentor-review-status` se leen sin interrumpir abruptamente (`aria-live="polite"`).
