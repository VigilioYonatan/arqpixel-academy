# AUDITORÍA TOTAL — ARQPIXEL Academy v1.5 DevSecOps

**Estado:** ENTREGA FUNCIONAL AMPLIADA / NO APROBADA COMO CUMPLIMIENTO INTEGRAL DEL MASTER SPEC.

## Origen y criterio de conservación

Base: `ARQPIXEL_Academy_Senior_Mode_v1_4_AUDITADA.zip`. Se conservan las rutas de los **194 archivos** de ese ZIP; se añaden archivos DevSecOps y código. Los cambios de archivos existentes se limitan a integrar los controles, nuevas pruebas, documentación y versión. No se eliminan rutas originales.

## Requisitos y evidencias

| ID | Requisito | Prioridad | Implementación | Validación | Estado |
|---|---|---|---|---|---|
| R01 | Preservar estructura v1.4 | P0 | Árbol anterior + nuevos archivos | Comparación de inventario ZIP | VERIFICADO en empaquetado |
| R02 | Mantener web ejecutable y recursos | P0 | `dist/`, `src/`, `data/`, `public/` | Compilación, release-check y HTTP | VERIFICADO |
| R03 | Mantener 36 lecciones / 18 misiones | P0 | `data/*.json`, `src/*` | tests + release-check | VERIFICADO |
| R04 | Conservar 108 actividades centrales y XP | P0 | `src/senior-suite.ts`, `src/app.ts` | tests y compilación | VERIFICADO en pruebas unitarias; UI manual NO VERIFICABLE |
| R05 | Incorporar DevSecOps por misión | P1 | `src/senior-devsecops.ts`, `src/senior-suite.ts` | 18 políticas, tests de selección inválida y marcadores de UI | VERIFICADO en pruebas unitarias |
| R06 | Compatibilidad de borradores | P1 | `sanitizeSeniorDraft` | tests existentes y typecheck; navegador no accesible | PARCIAL / NO VERIFICABLE visualmente |
| R07 | Biome configurado | P1 | `biome.json`, `package.json`, `.github/workflows` | JSON válido; binario remoto sin conectividad | CONFIGURADO / NO VERIFICABLE ejecución |
| R08 | TypeScript y pruebas | P0 | `tools/typescript/`, `tests/*` | `npm run devsecops:offline` | VERIFICADO |
| R09 | Detección de secretos | P1 | `scripts/security-scan.mjs` | pruebas positivas/negativas y ejecución | VERIFICADO en cobertura heurística; no histórico Git |
| R10 | Cabeceras/CSP de hosting | P1 | `index.html`, `public/_headers` | test de sincronización, release y HTTP | VERIFICADO como archivos; aplicación en hosting real NO VERIFICADA |
| R11 | Licencia TypeScript | P1 | `scripts/check-licenses.mjs` | ejecución offline | VERIFICADO para TypeScript vendorizado |
| R12 | CI de GitHub | P1 | `.github/workflows/quality-security.yml` | Parse de YAML; ejecución GitHub no disponible | NO VERIFICABLE en GitHub |
| R13 | E2E y accesibilidad | P1 | requiere browser libre, no entregado | Playwright Chromium bloqueado por administrador | NO VERIFICABLE |
| R14 | Stack Preact/Vite del master spec | P1 | no implementado; continúa TS/DOM | inspección de `package.json`, `src/` | INCOMPLETO |
| R15 | Simuladores avanzados realistas en 18 misiones | P1 | modelos educativos existentes + nuevo gate | inspección de motores | INCOMPLETO frente a simulación profesional |
| R16 | SBOM / SCA real de dependencias | P1 | no integrado | sin acceso a registro npm/CVE | INCOMPLETO |

## Ejecutado en el entorno

- `npm run typecheck` — pasó.
- `npm run build` — pasó, incluye `dist/_headers` y `dist/senior-devsecops.js`.
- `npm test` — **47 pruebas pasaron, 0 fallaron** (tras la última integración).
- `npm run security:scan` — pasó sus patrones heurísticos.
- `npm run security:headers` — pasó el chequeo estático de políticas.
- `npm run security:licenses` — pasó para TypeScript vendorizado.
- `npm run release-check` — catálogo y recursos completos.
- HTTP local de `dist/index.html` — 200, pero no prueba interacción web completa.
- Playwright/Chromium — **`ERR_BLOCKED_BY_ADMINISTRATOR`**. No es una prueba UI aprobada.
- `npm run biome:check` — **NO EJECUTADO**, registro de npm inaccesible (`EAI_AGAIN`). No se debe afirmar que el linter pasó.

## Limitaciones y deuda real

El master spec continúa sin cumplirse íntegramente: no está migrado a Preact/Vite; los motores Senior realizan comprobaciones educativas, no pruebas reales de un sistema desplegado; la evaluación del ADR exige revisión humana. Faltan E2E, pruebas responsive y WCAG, ejecución real del workflow CI, lockfile de Biome, SCA/SBOM y revisión de seguridad de producción.

`public/_headers` sirve de configuración para hosts compatibles, **no** habilita cabeceras HTTP en `python3 -m http.server`. CSP meta sí se procesa en navegador si el host entrega HTML normalmente.

## Decisión de release

**Aceptable para uso educativo local y revisión de código dentro de las pruebas ejecutadas; NO APROBADO como producto final 100 % del master spec ni como release DevSecOps certificado.** El archivo ZIP debe validarse de nuevo por extracción limpia. Consulte `docs/DEVSECOPS.md`.
