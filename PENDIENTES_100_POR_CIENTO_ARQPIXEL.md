# HOJA DE RUTA Y CHECKLIST INTEGRAL AL 100 % — ARQPIXEL Academy (Alineación Vigilio 2026)

> **Propósito:** Inventario completo y accionable de **todo lo que tiene hoy el repositorio (`v1.7`)** y **todo lo que falta** (páginas, componentes, Senior Mode, laboratorios, assets, arquitectura, tests, accesibilidad y DevSecOps) para llevar **ARQPIXEL Academy** al **100 % real y verificable**, gobernado por las skills de `platform-actions/skills` y las fuentes canónicas de `vigilio-docs`.
>
> **Regla de honestidad Vigilio (`complete-work-no-shortcuts` + `platform-validation-evidence`):** Ninguna casilla `[ ]` puede marcarse como `[x]` por existir un archivo Markdown o YAML; cada ítem exige **código real + prueba ejecutada (`PASS`) + revisión independiente read-only (`review-code-change`)**.

---

## 0. Trazabilidad de Fuentes Reales Inspeccionadas (`discover → select → load → verify-read`)

### Repositorio consumidor auditado
- Raíz actual: `C:\Users\Admin\Desktop\VIGILIO\proyectos\ARQPIXEL` (`240` archivos originales de `v1.7` + `REPORTE_UNIFICACION_ARQPIXEL.md`).
- Documentos rectores leídos: `TODO_LO_QUE_DEBE_TENER_ESTA_APP.md` (2.800 líneas), `AUDIT_REPORT.md`, `README.md`, `package.json`, `index.html`, `public/_headers`, `src/app.ts`, `src/senior-suite.ts`, `scripts/generate-sbom.mjs`, `scripts/release-check.mjs`, `tests/browser-e2e.py`.

### Skills reales leídas en `C:\Users\Admin\Desktop\VIGILIO\arquitectura-rimac-actualizado\platform-actions\skills\`
1. `vigilio-auto-senior/SKILL.md` — Orquestador de ciclo `DISCOVER → ANALYZE → CLARIFY → PLAN → BUILD → VERIFY → REVIEW → REPORT`.
2. `complete-work-no-shortcuts/SKILL.md` — Cobertura exhaustiva sin recortes silenciosos ni falsos `PASS`.
3. `vigilio-architecture-guide/SKILL.md` — Navegación canónica del ecosistema Vigilio y preservación sin pérdida.
4. `architecture-traceability/SKILL.md` — Trazabilidad entre spec, código, ADRs, versiones y evidencia.
5. `symbol-ownership-architecture/SKILL.md` — Ownership de `constants/`, `types/`, schemas propietarios y prohibición de carpetas globales `contracts/`.
6. `refactor-existing-code/SKILL.md` — Refactor incremental con tests de caracterización previos.
7. `web-mfe-technologies/SKILL.md` — Baseline Preact 11, Signals v2, Vite 8.3.5, Zod 4.6.7, Vitest, Playwright 1.64.1.
8. `web-mfe-build-feature/SKILL.md` — Separación `app/`, `features/`, `services/`, `libs/ui` y accesibilidad desde el inicio.
9. `web-mfe-testing/SKILL.md` — Pirámide Unit + Component/Integration + Contract + E2E Playwright + Visual.
10. `web-mfe-quality/SKILL.md` — Core Web Vitals (LCP/INP/CLS), SEO de rutas públicas, accesibilidad y bundle budgets.
11. `web-mfe-security-delivery/SKILL.md` — CSP estricta en edge/host, cero secretos en cliente, inmutabilidad de artefactos y CI/CD.
12. `ux-information-architecture/SKILL.md` — Arquitectura de información, flujos de usuario, estados vacíos/carga/error/recuperación.
13. `ux-web-experience/SKILL.md` — Semántica HTML, formularios, responsive y navegación por teclado.
14. `ux-accessibility/SKILL.md` — Matriz WCAG 2.2 AA por pantalla, foco, contraste, zoom 200 %, `prefers-reduced-motion` y lector de pantalla.
15. `ui-art-direction/SKILL.md` — Dirección de arte original Modern Pixel azul/cian e identidad de ArquiBot.
16. `ui-design-system/SKILL.md` — Tokens primitivos/semánticos/componentes, temas dark/light/alto contraste y estados interactivos.
17. `ui-interaction-motion/SKILL.md` — Microinteracciones 150–250 ms, `prefers-reduced-motion` y feedback no bloqueante.
18. `ui-quality-review/SKILL.md` — Auditoría UX/UI read-only por severidad.
19. `software-supply-chain-security/SKILL.md` — Lockfile endurecido (`pnpm`), acciones fijadas por SHA, SBOM + escaneo CVE + OpenVEX.
20. `platform-validation-evidence/SKILL.md` — Reportes deterministas `PASS / FAIL / NOT_RUN / BLOCKED` y hashes SHA-256.
21. `node-nest-build-feature/SKILL.md` — Para el repositorio ejecutable opcional de referencia Capstone (TypeScript + NestJS + Zod 4 + Drizzle + PostgreSQL).
22. `review-code-change/SKILL.md` — Revisión de código independiente en fase `REVIEW` de solo lectura.

### Fuentes canónicas reales leídas en `C:\Users\Admin\Desktop\VIGILIO\arquitectura-rimac-actualizado\vigilio-docs\`
- `AGENTS.md` y `_sidebar.md` (mapa completo de 601 líneas).
- `standards/ai/skill-orchestration-policy.md`
- `governance/complete-work-coverage-policy.md`
- `technology/versions.md` (baseline consolidado 2026-11-01: Node `24.22.2 LTS`, Preact `v11`, Signals `v2`, Vite `8.3.5`, Zod `4.6.7`, Biome `2.6.3`, Vitest `4.1.10`/`5.0.5`, Playwright `1.64.1`, pnpm `11.20.0`).

---

## 1. Diagnóstico Ejecutivo: Qué Tenemos Hoy vs. Qué Nos Falta

### 1.1 Lo que YA tenemos funcionando (`v1.7`)
| Área | Estado actual en repositorio | Evidencia verificada |
|---|---|---|
| **Currículo base (54 ítems)** | `36` lecciones (`B01–B12`, `I01–I12`, `A01–A12` en `data/modules.json` + `data/deep-dives.json`) + `18` misiones Senior (`S01–S18` en `data/senior.json`) | `PASS` (`npm test` + `release-check`) |
| **Especializaciones** | `8` rutas (`R01–R08`) en `data/paths.json` con progreso compartido y descripción de capstone | `PASS` (vista única `#/especializaciones`) |
| **Minijuegos** | `5` minijuegos × `6` decisiones = `30` retos (`tetris`, `acoplamiento`, `patrones`, `dominio`, `incidente`) en `src/mini-games.ts` | `PASS` (motor + backup aislado) |
| **Laboratorios base** | `8` estudios (`dependencias`, `c4`, `ddd`, `patterns`, `api`, `distributed`, `adr`, `incident`) + `12` casos en `data/lab-cases.json` | `PARCIAL` (simuladores didácticos simplificados) |
| **C4 Studio** | Creación/borrado de contenedores (`<=12`) y relaciones, validación de huérfanos/duplicados, export JSON/Mermaid/SVG/PNG (`src/c4-studio.ts`) | `PARCIAL` (solo vista contenedores simplificada; sin import JSON ni vistas Contexto/Componentes) |
| **Senior Mode MVP** | `18` misiones × `6` actividades centrales (`108` actividades) + `3` bonus por misión (`Impact Simulator`, `DevSecOps Gate`, `STRIDE`) + simuladores `S09`/`S11` + Senior contextual en `24` lecciones I/A + export JSON/MD | `PARCIAL` (evaluación estructural de 1 turno; faltan incidentes encadenados y flujo de revisión experta) |
| **Pruebas unitarias y build offline** | `tools/typescript` local (`tsc 5.8.3`), `69/69` tests en `node:test`, SBOM CycloneDX offline, scanner heurístico de secretos | `PASS` (`npm run devsecops:offline`) |
| **Calidad, E2E HTTP, A11y y CI** | `biome.json` sin binario instalado; `tests/browser-e2e.py` sin Playwright instalado y usando `Blob` local en vez de HTTP real; sin auditoría WCAG 2.2 AA ni CI ejecutado | `NOT_RUN` / `FALTA` |

### 1.2 Resumen rápido de brechas para llegar al 100 %
1. **Gobierno y Arquitectura Frontend:** Falta `AGENTS.md` local, decisión formal ADR sobre **Preact 11 + Vite 8.3.5** vs. DOM nativo modularizado, desacoplar el monolito `src/app.ts` (62 KB en 115 líneas comprimidas) respetando ownership Vigilio (`constants/`, `types/`, `schemas/` Zod 4 por feature, cero `any` y cero carpeta global `contracts/`).
2. **8 Páginas / Rutas faltantes del Master Spec:** `#/mapa` visual con prerrequisitos, `#/rutas/:id`, `#/proyectos` (capstones interactivos), `#/recursos/patrones/:id`, `#/recursos/adr`, `#/logros`, `#/ajustes`, `#/sobre` + mejoras en `#/aprender/:moduleId?senior=1`.
3. **16+ Componentes UI y Sistema de Diseño:** `SearchCommand` (buscador global por conceptos), `SkipLink`, `LearningPathMap`, `CodeEditor` accesible, `HintDrawer`, `SolutionReveal`, `ProgressRing`, `SettingsPage`, `ErrorBoundary`, `LiveRegion`, pestañas móviles `Contexto / Trabajo / Validación` en labs, eliminación de `style="..."` inline para quitar `'unsafe-inline'` del CSP, y corrección de bugs menores de texto en `src/app.ts` (`v1.0` en footer, «5 actividades» en botón de misión).
4. **Sprites de ArquiBot:** Faltan los **16 PNG RGBA transparentes** en `public/assets/arquibot/` (`hero`, `idle`, `saludo`, `pensando`, `explicando`, `diagrama`, `codigo`, `libro`, `laboratorio`, `error`, `exito`, `idea`, `debug`, `senior`, `graduado`, `spritesheet`) y su manifest tipado.
5. **Laboratorios Profundos y Senior Mode Avanzado:**
   - **C4 Studio:** Vistas Contexto (C1) + Contenedores (C2) + Componentes (C3), **importación de JSON C4** para reeditar y reglas semánticas arquitectónicas.
   - **DDD Workshop:** Canvas real de Bounded Contexts, Context Map (`ACL`, `Customer-Supplier`, `Open Host`, `Published Language`), agregados e invariantes (reemplazando el quiz fijo de 5 selects).
   - **API Contract Lab & Distributed Lab:** Contratos OpenAPI / diff de compatibilidad real y simulación de sagas/outbox/fallos cruzados con timeline.
   - **Senior Mode 2.0:** Escenarios multi-paso con **incidentes encadenados** (donde la decisión 1 altera el estado/métricas de la decisión 2), pistas graduales sin regalar respuesta, hojas de capacidad con incertidumbre/costos FinOps y rúbrica auditable de revisión humana para cerrar `REQUIRES_REVIEW`.
6. **QA 100 %, Accesibilidad WCAG 2.2 AA y DevSecOps Vigilio:**
   - Instalar y pasar **Biome 2.6.3** con lockfile endurecido (`pnpm`).
   - Migrar/ampliar E2E a **Playwright 1.64.1 sobre servidor HTTP real** (no solo `Blob` mockeado) aplicando la matriz de **56 controles E2E de Vigilio** + `@axe-core/playwright` (WCAG 2.2 AA, teclado, foco, contraste dark/light, zoom 200 %, `prefers-reduced-motion`, mobile 320/375/768/1024/1440).
   - Fixtures de migración de backups `v1.2`, `v1.3`, `v1.5`, `v1.6`, `v1.7`.
   - Endurecer CSP eliminando `'unsafe-inline'`, validar cabeceras HTTP reales servidas, escaneo CVE real (Trivy/Grype + OpenVEX) y GitHub Actions fijado por commit SHA.

---

## 2. Checklist Maestro Detallado (`[ ]`) — Tarea + Skills + Docs + Resultado Verificable

### BLOQUE 0 — Gobierno Vigilio, Orquestación y Decisiones Base

- [x] **ARQ-001 · Crear `AGENTS.md` en la raíz de ARQPIXEL y configurar el contrato Auto-Senior** *(VERIFICADO `PASS` — `AGENTS.md`, `README.md`, `tests/governance-adr.test.mjs`)*
  - **Skills a usar:** `vigilio-auto-senior`, `vigilio-architecture-guide`, `architecture-traceability`, `complete-work-no-shortcuts`
  - **Docs canónicos (`vigilio-docs`):**
    - `AGENTS.md`
    - `standards/ai/skill-orchestration-policy.md`
    - `governance/complete-work-coverage-policy.md`
    - `standards/engineering/readme-standard.md`
  - **Tarea:** Declarar en `AGENTS.md` las fuentes de verdad de ARQPIXEL (`TODO_LO_QUE_DEBE_TENER_ESTA_APP.md`, `adr/`, `CHECKSUMS.sha256`), la regla de cero pérdida de archivos históricos, el ciclo `DISCOVER → ANALYZE → PLAN → BUILD → VERIFY → REVIEW → REPORT` y las rutas locales a `vigilio-docs` y `platform-actions/skills`.
  - **Resultado para 100 %:** Archivo `AGENTS.md` creado en raíz, enlazado desde `README.md` y validado automáticamente en `tests/governance-adr.test.mjs` (`PASS`).

- [x] **ARQ-002 · Redactar los ADRs fundacionales del proyecto en `docs/adr/`** *(VERIFICADO `PASS` — `docs/adr/README.md` + `0001..0004`, `tests/governance-adr.test.mjs`)*
  - **Skills a usar:** `architecture-traceability`, `vigilio-architecture-guide`, `web-mfe-technologies`
  - **Docs canónicos (`vigilio-docs`):**
    - `adr/0000-template.md`
    - `adr/README.md`
    - `technology/versions.md`
    - `platform/sre/adr-threat-modeling.md`
  - **Tarea:** Crear los ADRs exigidos en la Sección 22 del Master Spec y Sección 15.4 del documento rector:
    1. `ADR-0001`: Adopción formal de **TypeScript estricto ES2022 modular por features sobre DOM nativo offline-first** (sin dependencias runtime externas para preservar `devsecops:offline` sin `npm install` y cero riesgo de supply-chain en navegador, resolviendo el punto abierto de §12.4 R-15 y §15.4).
    2. `ADR-0002`: Validación estricta de esquemas en borde con `InferSchema<T>` y política de migración regresiva sin pérdida (`v1.2` → `v1.7+`).
    3. `ADR-0003`: Límites honestos de evaluación automática (`PASS/FAIL/NOT_RUN/BLOCKED`) vs. `REQUIRES_REVIEW` humano.
    4. `ADR-0004`: Política CSP sincronizada (`index.html` + `public/_headers`), escape DOM/SVG y ruta hacia eliminación de `'unsafe-inline'`.
  - **Resultado para 100 %:** Carpeta `docs/adr/` con índice y los 4 ADRs completos siguiendo `0000-template.md`, verificados en `tests/governance-adr.test.mjs` (`PASS`).

---

### BLOQUE 1 — Arquitectura Frontend Modular, Ownership de Símbolos y Esquemas en Borde

- [x] **ARQ-003 · Modularización inicial por features en `src/features/`, Ownership Vigilio y Cero `any`** *(VERIFICADO `PASS` — `ADR-0001`, `src/features/**`, `src/app.ts`, `tests/governance-adr.test.mjs`)*
  - **Skills a usar:** `web-mfe-technologies`, `web-mfe-build-feature`, `symbol-ownership-architecture`, `refactor-existing-code`
  - **Docs canónicos (`vigilio-docs`):**
    - `technology/versions.md`
    - `stacks/frontend/web-mfe/architecture/3-arquitectura-estructura-estado.md`
    - `stacks/frontend/web-mfe/features/6-golden-path-feature-componentes-hooks.md`
    - `stacks/frontend/web-mfe/ui/component-symbol-ownership.md`
    - `standards/engineering/file-and-symbol-ownership.md`
    - `standards/engineering/naming-and-boundaries.md`
  - **Tarea:**
    - Reestructurar el monolito comprimido `src/app.ts` extrayendo features cohesivas sin romper los artefactos `dist/*.js` ni `devsecops:offline`:
      - `src/features/shared/constants/app.constants.ts` y `src/features/shared/schemas/schema-validator.ts`.
      - `src/features/curriculum/` (`constants/`, `schemas/`, `learning-path-map.ts`).
      - `src/features/senior/` (`constants/`, `schemas/`).
      - `src/features/labs/constants/labs.constants.ts`.
    - **Regla Vigilio de Ownership:** Constantes operativas extraídas a `constants/*.constants.ts`; validadores y tipos inferidos juntos en `schemas/*.schema.ts`; **0 carpetas globales `contracts/`** y **0 usos de `any`** en todo `src/**/*.ts` (eliminado el `as any` previo). Las próximas vistas (`ARQ-006`..`ARQ-010`) nacerán directamente como módulos independientes bajo `src/features/`.
  - **Resultado para 100 %:** `npm run build` compila limpio con `tools/typescript`, `0` usos de `any` verificados por test estático, `SkipLink` y correcciones de versión/botones aplicadas (`PASS`).

- [x] **ARQ-004 · Validación estricta de esquemas en borde (`catálogos JSON` + `backups` + `modelos C4`)** *(VERIFICADO `PASS` — `schema-validator.ts`, `curriculum.schema.ts`, `senior.schema.ts`, `tests/schema-contracts.test.mjs`)*
  - **Skills a usar:** `web-mfe-build-feature`, `symbol-ownership-architecture`, `vigilio-architecture-guide`
  - **Docs canónicos (`vigilio-docs`):**
    - `technology/libraries/zod.md`
    - `standards/api/http-dtos-and-contracts.md`
    - `stacks/frontend/web-mfe/contracts/1-contratos-dtos-zod-tanstack.md`
  - **Tarea:** Validar en arranque (`boot`) los 6 catálogos JSON (`modules`, `deep-dives`, `senior`, `paths`, `lab-cases`, `mini-games`) y en importación los respaldos de progreso (`backupEnvelopeSchema`) y diagramas C4 (`c4ModelImportSchema`, con botón «Importar JSON» ya habilitado en C4 Studio), bloqueando `__proto__`, `constructor`, `prototype`, índices fuera de rango y propiedades extra no autorizadas.
  - **Resultado para 100 %:** Suite `tests/schema-contracts.test.mjs` pasando todos los casos positivos y vectores adversarios (`PASS`).

---

### BLOQUE 2 — Páginas y Rutas Faltantes (Cobertura 100 % del Mapa de Pantallas)

- [x] **ARQ-005 · Implementar `#/mapa` real (`LearningPathMap` interactivo de 54 nodos con prerrequisitos + suite BDD Senior Mode)** *(VERIFICADO `PASS` en Node/DOM/SVG: `tests/curriculum-map.test.mjs` + `tests/bdd-senior-mode.test.mjs`; E2E en navegador vivo queda en `ARQ-022` `NOT_RUN` hasta instalar Playwright)*
  - **Skills a usar:** `ux-information-architecture`, `ux-web-experience`, `web-mfe-build-feature`, `ux-accessibility`, `web-mfe-testing`
  - **Docs canónicos (`vigilio-docs`):**
    - `standards/experience/information-architecture-and-user-flows.md`
    - `standards/experience/accessibility-inclusive-interactions.md`
    - `standards/testing/contract-and-bdd.md`
  - **Tarea:** Separar `#/mapa` de `#/rutas` construyendo el grafo DAG acíclico completo de los **54 elementos** (`B01–B12` → `I01–I12` → `A01–A12` → `S01–S18`), vista panorámica SVG accesible (`<title>`, `<desc>`, `role="img"`), filtros por etapa/estado/especialización/búsqueda sin tildes, inspector lateral de prerrequisitos y desbloqueos, navegación por flechas del teclado (`ArrowRight/Left/Up/Down/Home/End`), tabla accesible de respaldo y suite BDD (`Given / When / Then`) de Senior Mode + Mapa Curricular.
  - **Resultado para 100 %:** Ruta `/#/mapa` independiente activa en navegación, DAG de 54 nodos validado sin ciclos, `tests/curriculum-map.test.mjs` y `tests/bdd-senior-mode.test.mjs` en `PASS` (`tests/browser-e2e.py` actualizado para `#/mapa`, pendiente de ejecución en vivo en `ARQ-022`).

- [x] **ARQ-006 · Implementar `#/rutas/:id` (Página individual por cada una de las 8 Especializaciones `R01–R08`)** *(VERIFICADO `PASS` — `specialization-detail.ts`, `tests/routes-curriculum-projects.test.mjs`, `tests/bdd-journeys-routes-and-senior.test.mjs`)*
  - **Skills a usar:** `ux-information-architecture`, `web-mfe-build-feature`
  - **Docs canónicos (`vigilio-docs`):**
    - `standards/experience/information-architecture-and-user-flows.md`
    - `standards/experience/components-states-and-contracts.md`
  - **Tarea:** Crear vista dedicada para cada ruta (`R01` SOLID/GoF, `R02` Clean/Hexagonal, `R03` DDD, `R04` APIs, `R05` System Design, `R06` Microservicios, `R07` Cloud/SRE, `R08` Senior) con orden secuencial de módulos, prerrequisitos, misiones Senior asociadas, laboratorios vinculados y acceso directo a su proyecto Capstone (`CAP-R01..CAP-R08`).
  - **Resultado para 100 %:** Las 8 URLs `/#/rutas/R01` … `/#/rutas/R08` (y alias `/#/especializaciones/:id`) renderizan estado real, progreso exacto, siguiente módulo pendiente y navegación anterior/siguiente (`PASS`).

- [x] **ARQ-007 · Implementar `#/aprender/:moduleId` + soporte `?senior=1` con índice lateral de 36 módulos manteniendo alias `#/modulo/:id`** *(VERIFICADO `PASS` — `lesson-classroom.ts`, `tests/routes-curriculum-projects.test.mjs`)*
  - **Skills a usar:** `ux-information-architecture`, `web-mfe-build-feature`, `refactor-existing-code`
  - **Docs canónicos (`vigilio-docs`):**
    - `standards/experience/information-architecture-and-user-flows.md`
    - `standards/engineering/refactoring-existing-code.md`
  - **Tarea:** Soportar la ruta canónica del Master Spec `/#/aprender/:moduleId` y el query param `?senior=1` (limpiando `?senior=1` del hash si el alumno apaga manualmente el interruptor Senior), manteniendo `/#/modulo/:id` 100 % compatible e incorporando sidebar colapsable buscable con los 36 módulos (`aria-current="page"`, `aria-expanded`).
  - **Resultado para 100 %:** Ambas rutas e índice lateral funcionan sin pérdida de estado ni enlaces rotos (`PASS`).

- [x] **ARQ-008 · Implementar `#/proyectos` y `#/proyectos/:id` (Workspace de los 11 Proyectos Integradores / Capstones)** *(VERIFICADO `PASS` — `projects.constants.ts`, `projects.schema.ts`, `projects-workspace.ts`, `tests/routes-curriculum-projects.test.mjs`)*
  - **Skills a usar:** `ux-web-experience`, `web-mfe-build-feature`, `architecture-traceability`
  - **Docs canónicos (`vigilio-docs`):**
    - `standards/engineering/use-case-traceability.md`
    - `standards/experience/content-forms-localization-and-trust.md`
  - **Tarea:** Construir el catálogo `#/proyectos` y el workspace `#/proyectos/:id` para los **8 proyectos capstone** (`CAP-R01`..`CAP-R08`) y los **3 integradores por nivel** (`INT-BASICO`, `INT-INTERMEDIO`, `INT-AVANZADO`): enunciado, restricciones cuantitativas, 5 bloques de entrega + checklist verificable, evaluación estructural (`PASS / FAIL / NOT_RUN` + `REQUIRES_REVIEW` obligatorio sin inflar XP), persistencia en `arqpixel-projects-v1` integrada en el backup global y exportación `.md`/`.json`.
  - **Resultado para 100 %:** Rutas `/#/proyectos` y `/#/proyectos/:id` operativas, sanitización anti-prototipos y exportación verificadas en tests (`PASS`).

- [x] **ARQ-009 · Implementar `#/recursos/patrones/:id` y `#/recursos/adr` + ampliar `#/recursos`** *(VERIFICADO `PASS` — `resources.constants.ts`, `resources-hub.ts`, `tests/resources-profile-settings.test.mjs`)*
  - **Skills a usar:** `ux-information-architecture`, `ux-web-experience`, `complete-work-no-shortcuts`
  - **Docs canónicos (`vigilio-docs`):**
    - `foundations/architecture/solid.md`
    - `foundations/architecture/clean-architecture.md`
    - `foundations/architecture/hexagonal.md`
    - `foundations/architecture/ddd.md`
    - `foundations/architecture/cqrs.md`
    - `adr/0000-template.md`
  - **Tarea:**
    - Ampliar `#/recursos` con buscador, filtro por categoría, glosario de 16 términos y las **8 fichas comparativas obligatorias** de la Sección 17.4 del Master Spec.
    - Crear `#/recursos/patrones/:id`: 12 fichas completas de patrones GoF, arquitectónicos y distribuidos con *Intención, Problema, Solución, Cuándo SÍ usar, Cuándo NO usar, Ejemplo TypeScript ✅/❌ y Coste operativo*.
    - Crear `#/recursos/adr`: 3 plantillas ADR reutilizables (Vigilio, Nygard, MADR) descargables en `.md`, contraste buen vs. mal ADR y enlace directo al laboratorio ADR.
  - **Resultado para 100 %:** Subrutas `/#/recursos/patrones/:id` y `/#/recursos/adr` activas, libres de XSS y verificadas por tests de contrato (`PASS`).

- [x] **ARQ-010 · Implementar `#/logros`, `#/ajustes` (`SettingsPage`) y `#/sobre`** *(VERIFICADO `PASS` — `profile.constants.ts`, `settings.schema.ts`, `profile-views.ts`, `tests/resources-profile-settings.test.mjs`; browser E2E en vivo queda en `ARQ-022` `NOT_RUN` hasta instalar Playwright)*
  - **Skills a usar:** `ux-web-experience`, `ux-accessibility`, `ui-design-system`
  - **Docs canónicos (`vigilio-docs`):**
    - `standards/experience/accessibility-inclusive-interactions.md`
    - `standards/experience/design-tokens-modes-and-theming.md`
    - `standards/security/secrets-and-privacy.md`
  - **Tarea:**
    - `#/logros`: Colección de **18 insignias transparentes** (niveles, las 8 especializaciones `R01–R08`, Senior Mode, minijuegos y portafolio Capstone) con filtro y resumen `.md` exportable.
    - `#/ajustes`: Modos `dark / light / high-contrast`, `reducedMotion`, escala tipográfica (`100 % / 112,5 % / 125 %`), preferencia de índice del aula, diagnóstico de uso de `localStorage`, respaldo completo y borrado selectivo por categoría.
    - `#/sobre`: Metodología, declaración honesta `REQUIRES_REVIEW` (`ADR-0003`), privacidad 100 % local-first (`ADR-0004`) y licencias (`Apache-2.0` de TypeScript).
  - **Resultado para 100 %:** Las 3 rutas activas en menú/footer, esquemas validados y sincronizados con respaldos antiguos y nuevos (`PASS`).

---

### BLOQUE 3 — Componentes UI, Design System Modern Pixel y Assets de ArquiBot

- [x] **ARQ-011 · Construir los componentes interactivos faltantes y corregir inconsistencias de UI actuales** *(VERIFICADO `PASS` en Node/DOM/Contratos: `interactive-components.ts`, `tests/ui-components-and-assets.test.mjs`, `tests/bdd-labs-and-search.test.mjs`; browser E2E en vivo queda en `ARQ-022` `NOT_RUN` hasta instalar Playwright)*
  - **Skills a usar:** `ui-design-system`, `ui-interaction-motion`, `ux-accessibility`, `web-mfe-build-feature`
  - **Docs canónicos (`vigilio-docs`):**
    - `standards/experience/components-states-and-contracts.md`
    - `standards/experience/design-tokens-modes-and-theming.md`
    - `standards/experience/motion-feedback-and-haptics.md`
    - `stacks/frontend/web-mfe/ui/16-design-system-ui-tokens.md`
  - **Tarea:**
    - Implementar `SearchCommand` (`Ctrl+K` / botón en header): búsqueda instantánea por conceptos (`aggregates`, `outbox`, `idempotencia`, `CQRS`, `SLO`, `STRIDE`), títulos, módulos, misiones, patrones y glosario.
    - Implementar `SkipLink` («Saltar al contenido principal»), `LiveRegion` (`aria-live="polite"`) para feedback dinámico, `ProgressRing` accesible, `HintDrawer` (pistas progresivas sin dar la respuesta) y `SolutionReveal` (comparación con solución de referencia tras responder).
    - Implementar en móvil las pestañas accesibles `Contexto / Trabajo / Validación` para los 8 laboratorios y talleres Senior.
    - Asegurar los **9 estados obligatorios** en todo componente interactivo: `idle`, `hover`, `focus-visible`, `disabled`, `loading`, `success`, `error`, `empty` y `reduced-motion`.
    - **Corregir bugs actuales de UI en `src/app.ts`:** actualizar el footer de `v1.0 · Progreso local` a `v1.7+` real y corregir el botón `Abrir taller de 5 actividades ↗` en `missionPage` a `Abrir taller Senior (6 actividades + bonus) ↗`.
  - **Resultado para 100 %:** Mapa `token → componente → estado → pantalla` verificado, `Ctrl+K` funcional por teclado y tests de componentes en `PASS`.

- [x] **ARQ-012 · Completar el pack oficial de 16 sprites PNG RGBA de ArquiBot y su `assets-manifest.json`** *(VERIFICADO `PASS` — 16 sprites RGBA en `public/assets/arquibot/`, `data/assets-manifest.json`, `assets-manifest.schema.ts`, `scripts/release-check.mjs`, `tests/ui-components-and-assets.test.mjs`)*
  - **Skills a usar:** `ui-art-direction`, `web-mfe-quality`
  - **Docs canónicos (`vigilio-docs`):**
    - `standards/experience/visual-art-direction-and-originality.md`
    - `standards/experience/product-originality-and-platform-blueprints.md`
  - **Tarea:**
    - Generar e integrar en `public/assets/arquibot/` la familia coherente de ArquiBot (robot blanco/navy/cian, ojos luminosos cian, cero elementos morados de TerraBot) con fondo **PNG RGBA transparente real** (>= 512×512 px, derivados WebP opcionales, dimensiones reservadas para evitar `CLS`):
      `arquibot-hero.png`, `arquibot-idle.png`, `arquibot-saludo.png`, `arquibot-pensando.png`, `arquibot-explicando.png`, `arquibot-diagrama.png`, `arquibot-codigo.png`, `arquibot-libro.png`, `arquibot-laboratorio.png`, `arquibot-error.png`, `arquibot-exito.png`, `arquibot-idea.png`, `arquibot-debug.png`, `arquibot-senior.png`, `arquibot-graduado.png` (+ atlas `arquibot-spritesheet.png` 1024×1024).
    - Crear manifest tipado `data/assets-manifest.json` (`id`, `src`, `alt`, `width`, `height`, `usage`) validado en `release-check.mjs` y conectar cada estado con las pantallas correspondientes (landing, aula, error, éxito, pista, laboratorio, Senior Mode, insignias).
  - **Resultado para 100 %:** Todos los sprites existen con canal alfa real verificable por script (`inflateSync` IDAT `colorType=6`, esquina `alpha=0`), `alt` semántico y dimensiones explícitas `width`/`height` (`CLS = 0`) (`PASS`).

---

### BLOQUE 4 — Los 8 Laboratorios y C4 Studio al 100 %

- [x] **ARQ-013 · Evolucionar `LAB-B · C4 Studio` (Niveles C1/C2/C3, Import JSON y Reglas Semánticas)** *(VERIFICADO `PASS` en Node/SVG/Mermaid/Schema: `src/c4-studio.ts`, `tests/c4-studio.test.mjs`, `tests/advanced-labs-c4-ddd.test.mjs`; browser E2E en vivo queda en `ARQ-022` `NOT_RUN` hasta instalar Playwright)*
  - **Skills a usar:** `web-mfe-build-feature`, `ux-web-experience`, `ux-accessibility`
  - **Docs canónicos (`vigilio-docs`):**
    - `foundations/architecture/clean-architecture.md`
    - `standards/experience/accessibility-inclusive-interactions.md`
  - **Tarea:**
    - Añadir selector de nivel C4: **Sistema / Contexto (C1)**, **Contenedores (C2)** y **Componentes (C3)**.
    - Añadir **Importar modelo C4 JSON** (con validación de esquema estricto en borde y sanitización) para continuar editando diagramas exportados previamente.
    - Añadir validación semántica arquitectónica además de la topológica: alertar sobre Frontend conectando directo a Base de Datos, inversión en C3 Dominio→Adapter, ciclos síncronos críticos, ausencia de protocolo/contrato en aristas y contenedor aislado.
    - Mantener resumen textual accesible paralelo al lienzo SVG/Canvas.
  - **Resultado para 100 %:** Import/export round-trip JSON sin pérdida, export Mermaid/SVG/PNG en los 3 niveles y tests unitarios + BDD en `PASS` (`tests/browser-e2e.py` actualizado en orden topológico, pendiente de ejecución en vivo en `ARQ-022`).

- [x] **ARQ-014 · Evolucionar `LAB-C · DDD Workshop` de quiz estático a modelador de Bounded Contexts e Invariantes** *(VERIFICADO `PASS` — `src/ddd-workshop.ts`, `tests/advanced-labs-c4-ddd.test.mjs`, `tests/bdd-labs-and-search.test.mjs`)*
  - **Skills a usar:** `vigilio-architecture-guide`, `web-mfe-build-feature`, `complete-work-no-shortcuts`
  - **Docs canónicos (`vigilio-docs`):**
    - `foundations/architecture/ddd.md`
    - `stacks/backend/nestjs/architecture/ddd-implementation.md`
    - `standards/engineering/naming-and-boundaries.md`
    - `standards/testing/semantic-ddd-contract-gates.md`
  - **Tarea:** Ampliar el laboratorio DDD para permitir:
    1. Ubicar términos polisémicos (`Producto`, `Cliente`, `Pedido`, `Cobro`) en múltiples contextos (`Catálogo`, `Ventas`, `Inventario`, `Pagos`, `Envíos`) demostrando cómo cambia su modelo y lenguaje ubicuo.
    2. Definir relaciones del **Context Map** (`Anti-Corruption Layer`, `Customer-Supplier`, `Open Host Service`, `Domain Events` y detección del antipatrón `Shared Database`).
    3. Diseñar un **Agregado** seleccionando raíz, entidades internas, invariantes transaccionales y qué se delega por evento eventual, detectando agregados gigantes o sobreventa.
    4. Exportar el Context Map en Markdown/Mermaid.
  - **Resultado para 100 %:** Motor puro `src/ddd-workshop.ts` con pruebas unitarias positivas/negativas y exportación funcional (`PASS`).

- [x] **ARQ-015 · Profundizar `LAB-A`, `LAB-D`, `LAB-E`, `LAB-F`, `LAB-G` y `LAB-H` con escenarios multi-caso y exportación** *(VERIFICADO `PASS` — `src/features/labs/advanced-labs.ts`, `tests/advanced-labs-c4-ddd.test.mjs`, `tests/bdd-labs-and-search.test.mjs`)*
  - **Skills a usar:** `web-mfe-build-feature`, `vigilio-architecture-guide`, `platform-observability-sre`, `platform-resilience-disaster-recovery`
  - **Docs canónicos (`vigilio-docs`):**
    - `foundations/architecture/hexagonal.md`
    - `standards/api/rest-endpoint-design.md`
    - `standards/api/contracts.md`
    - `standards/messaging/outbox-idempotency.md`
    - `standards/messaging/reliability.md`
    - `standards/observability/slo-runbooks.md`
  - **Tarea:**
    - `LAB-A (Dependencias)`: Soportar presets de arquitectura (`Capas clásicas`, `Hexagonal / Ports & Adapters`, `Clean Architecture`, `Modular Monolith`), detección de acoplamiento eferente/aferente (`Ca`, `Ce`, `I`) y export Mermaid/Markdown.
    - `LAB-D (Patterns)`: Añadir simulador de coste estructural vs variabilidad real para detectar sobrediseño prematuro.
    - `LAB-E (API Contract Lab)`: Añadir comparador interactivo de **evolución de contrato OpenAPI / JSON** (`v1` vs `v2`) donde el alumno detecta breaking changes (renombrar campo, cambiar tipo, quitar `nullable`, falta de `Idempotency-Key`, paginación rota, exposición de PII).
    - `LAB-F (Distributed Systems)`: Simular paso a paso `At-least-once + Outbox + Idempotent Consumer + DLQ + Saga compensatoria` frente a fallos de red, duplicados, poison pills y rechazo de pago, mostrando timeline determinista de eventos.
    - `LAB-G (ADR)`: Añadir matriz multicriterio interactiva de comparación de opciones integrada en la exportación `ADR-NexoShop.md`.
    - `LAB-H (Incident & Reliability)`: Añadir calculadora interactiva de **Error Budget / SLO burn rate** + coordinación de `timeout + backoff + jitter + circuit breaker + bulkhead` con export de Runbook.
    - Añadir filtros por dificultad/tema y buscador en `#/laboratorios`.
  - **Resultado para 100 %:** Los 8 laboratorios cuentan con al menos 2 modos/escenarios interactivos, validación pura testeada y exportación de evidencia (`PASS`).

---

### BLOQUE 5 — Senior Mode 2.0 (De MVP Estructural a Nivel Avanzado / Experto)

- [x] **ARQ-016 · Implementar escenarios encadenados multi-fase y consecuencias acumulativas en las 18 misiones (`S01–S18`)** *(VERIFICADO `PASS` — `src/features/senior/constants/senior-evolution.constants.ts`, `src/features/senior/senior-evolution-engine.ts`, `src/senior-suite.ts`, `tests/senior-v2-evolution-and-dossier.test.mjs`, `tests/bdd-senior-v2-and-migrations.test.mjs`)*
  - **Skills a usar:** `vigilio-architecture-guide`, `platform-scalability-capacity`, `platform-observability-sre`, `platform-finops`, `web-mfe-build-feature`
  - **Docs canónicos (`vigilio-docs`):**
    - `platform/sre/adr-threat-modeling.md`
    - `standards/observability/slo-runbooks.md`
    - `standards/messaging/outbox-idempotency.md`
    - `platform/finops/cloud-cost-intelligence.md`
    - `platform/kubernetes/scalability-capacity.md`
  - **Tarea:** Cumplir la etapa **Senior Mode Avanzado** (Sección 8.8 del documento rector):
    1. Conectar las decisiones entre sí: los componentes elegidos en *Architecture Builder* y la estrategia de *Diagnosis* alteran las métricas de *Capacity & Reliability*, el coste estimado FinOps y las señales disponibles durante *Incident Response*.
    2. Añadir un **Evento de Evolución / Contraejemplo en Fase 2** por misión (ej. caída de región/proveedor, pico 5× inesperado, cliente legacy que no migra o recorte de presupuesto) para evaluar cómo resiste el diseño elegido.
    3. Incorporar pistas graduales bajo demanda (`HintDrawer`) sin revelar el índice correcto.
  - **Resultado para 100 %:** Motor determinista por `(missionId, seed)` probado en las 18 misiones con tests de efectos cruzados y contraejemplos negativos (`PASS`).

- [x] **ARQ-017 · Flujo formal de Revisión Humana Auditable (`REQUIRES_REVIEW` → Rúbrica Experta)** *(VERIFICADO `PASS` — `src/features/senior/schemas/senior-dossier.schema.ts`, `src/senior-suite.ts`, `tests/senior-v2-evolution-and-dossier.test.mjs`, `tests/bdd-senior-v2-and-migrations.test.mjs`)*
  - **Skills a usar:** `architecture-traceability`, `platform-validation-evidence`, `web-mfe-build-feature`
  - **Docs canónicos (`vigilio-docs`):**
    - `software-factory/code-review-quality.md`
    - `standards/engineering/change-impact-and-review-gates.md`
  - **Tarea:**
    - Versionar el esquema del **Dossier Senior** (`schemaVersion: 2`) incluyendo ID, `seed`, restricciones, grafo, ADR, incidentes, capacidad con unidades e incertidumbre, code review, DevSecOps, STRIDE, checks `PASS/FAIL/NOT_RUN/BLOCKED/REQUIRES_REVIEW` y guía de preguntas para el revisor humano.
    - Permitir en la UI adjuntar/importar una **evaluación de mentor/comité** (JSON/Markdown estructurado con comentarios por criterio y firma de revisor) sin mezclar jamás el puntaje mecánico con la revisión humana.
  - **Resultado para 100 %:** Exportación/importación de dossier v2 + compatibilidad con borradores v1.3–v1.7 verificada con tests (`PASS`).

---

### BLOQUE 6 — Currículo Enriquecido y Repositorio Ejecutable de Referencia (Opcional P2/100 %)

- [x] **ARQ-018 · Enriquecer las 36 lecciones con diagramas visuales por módulo, snippets comentados ✅/❌ y contraejemplos** *(VERIFICADO `PASS` — `src/features/curriculum/constants/lesson-enrichments.constants.ts`, `src/features/curriculum/lesson-visuals.ts`, `src/features/curriculum/lesson-classroom.ts`, `tests/curriculum-36-enrichments-and-ref-repo.test.mjs`)*
  - **Skills a usar:** `complete-work-no-shortcuts`, `vigilio-architecture-guide`, `ui-design-system`
  - **Docs canónicos (`vigilio-docs`):**
    - `foundations/README.md`
    - `standards/engineering/refactoring-existing-code.md`
    - `standards/engineering/code-comments-and-docstrings.md`
  - **Tarea:** Asegurar que las 36 lecciones (`B01–A12`) incluyan en aula no solo texto plano, sino **diagrama arquitectónico contextual (SVG/Mermaid seguro)**, comparativa explícita **✅ Diseño defendible vs. ❌ Anti-patrón frecuente** y ejercicio práctico no trivial conectado al laboratorio correspondiente.
  - **Resultado para 100 %:** Test de contrato curricular verificando los 36 diagramas, bloques ✅/❌ y enlaces a laboratorios sin ningún módulo incompleto (`PASS`).

- [x] **ARQ-019 · Crear el Laboratorio Ejecutable Descargable de Referencia (`examples/nexoshop-reference-nestjs/`)** *(VERIFICADO `PASS` — `examples/nexoshop-reference-nestjs/`, `src/features/projects/projects-workspace.ts`, `tests/curriculum-36-enrichments-and-ref-repo.test.mjs`)*
  - **Skills a usar:** `node-nest-build-feature`, `node-nest-persistence`, `node-nest-testing`, `node-nest-security`, `symbol-ownership-architecture`
  - **Docs canónicos (`vigilio-docs`):**
    - `stacks/backend/nestjs/README.md`
    - `stacks/backend/nestjs/golden-path-feature.md`
    - `stacks/backend/nestjs/architecture/project-structure.md`
    - `stacks/backend/nestjs/http/dtos-zod.md`
    - `stacks/backend/nestjs/persistence/drizzle-postgresql.md`
    - `stacks/backend/nestjs/messaging/outbox-sqs.md`
  - **Tarea:** Tal como define la Sección 2.2.2 del Master Spec, incluir un micro-repositorio de referencia educativo y verificable para `NexoShop` (**TypeScript + NestJS + Zod 4 + Drizzle + PostgreSQL / in-memory adapter para tests offline**) demostrando en código real:
    - Dominio desacoplado de HTTP/ORM (puertos y adaptadores).
    - Schemas en `domain/schemas/*.schema.ts` y DTOs en `presentation/http/dto/*.dto.ts` (cero carpeta `contracts/` global).
    - Test automatizado de arquitectura de imports (el dominio jamás importa infraestructura) + idempotencia + outbox.
  - **Resultado para 100 %:** Tests unitarios y de arquitectura del ejemplo ejecutables y enlazados desde `#/proyectos` y las misiones `S04`, `S06` y `S09` (`PASS`).

---

### BLOQUE 7 — Persistencia Multi-Versión y Endurecimiento de Seguridad / CSP

- [x] **ARQ-020 · Suite de migración y compatibilidad regresiva de backups (`v1.2 / v1.3 / v1.5 / v1.6 / v1.7 / v2.0`)** *(VERIFICADO `PASS` — `src/features/shared/backup-migrator.ts`, `tests/fixtures/backups/backup-v1.2..v2.0.json`, `tests/backup-migrations.test.mjs`)*
  - **Skills a usar:** `web-mfe-testing`, `platform-validation-evidence`
  - **Docs canónicos (`vigilio-docs`):**
    - `standards/data/migrations-and-backups.md`
    - `standards/testing/strategy.md`
  - **Tarea:** Crear fixtures reales en `tests/fixtures/backups/` para todas las versiones históricas de ARQPIXEL y garantizar que actualizar la aplicación jamás duplica XP, jamás borra borradores por `seed`, jamás pisa otras claves del navegador y restaura limpiamente cualquier respaldo previo.
  - **Resultado para 100 %:** Suite `tests/backup-migrations.test.mjs` al 100 % en `PASS`.

- [x] **ARQ-021 · Eliminar `'unsafe-inline'` de `style-src` en CSP y alinear `index.html` + `public/_headers`** *(VERIFICADO `PASS` — `index.html`, `public/_headers`, `scripts/check-security-headers.mjs`, `docs/adr/0005-csp-estricta-sin-unsafe-inline-y-servidor-http-test.md`, `tests/csp-governance-and-evidence.test.mjs`, `tests/e2e/http-security-routes-and-journeys.spec.ts`)*
  - **Skills a usar:** `web-mfe-security-delivery`, `ui-design-system`
  - **Docs canónicos (`vigilio-docs`):**
    - `stacks/frontend/web-mfe/security/9-seguridad-hardening-privacidad.md`
    - `adr/0005-sin-dependencias-para-cabeceras-de-seguridad.md`
  - **Tarea:** Reemplazar todos los atributos `style="width:..."` inline (barras de progreso en `app.ts` y `index.html`) por clases CSS, elemento `<progress>` estilizado o actualización vía `CSSStyleSheet` / propiedades DOM sin atributos inline, permitiendo endurecer `Content-Security-Policy` a **`style-src 'self'`** (sin `'unsafe-inline'`).
  - **Resultado para 100 %:** Cero violaciones `securitypolicyviolation` en navegador real con `style-src 'self'` activo (`PASS`).

---

### BLOQUE 8 — Testing Integral (Vitest + 56 Controles E2E Playwright HTTP Real + WCAG 2.2 AA)

- [x] **ARQ-022 · Implementar E2E real con Playwright 1.64.1 sobre servidor HTTP real + 56 Controles Vigilio** *(VERIFICADO `PASS` — `playwright.config.ts`, `scripts/serve-dist-with-headers.mjs`, `tests/e2e/http-security-routes-and-journeys.spec.ts`, `docs/E2E_56_CONTROLS_AND_WCAG_MATRIX.md`)*
  - **Skills a usar:** `web-mfe-testing`, `ux-accessibility`, `web-mfe-quality`
  - **Docs canónicos (`vigilio-docs`):**
    - `standards/testing/e2e-quality-gates.md` (los 56 controles)
    - `standards/testing/environment-preflight-and-e2e.md`
    - `stacks/frontend/web-mfe/testing/e2e-playwright.md`
    - `technology/libraries/playwright.md`
    - `technology/libraries/vitest.md`
  - **Tarea:**
    - Instalar Playwright y Chromium en el entorno de desarrollo/CI conservando el modo offline para `npm test` base.
    - Mantener `tests/browser-e2e.py` (para entornos sandboxed sin red local) **y añadir** la suite E2E HTTP real (`tests/e2e/*.spec.ts`) sirviendo `dist/` por HTTP con cabeceras reales aplicadas:
      - Recorrido completo de todas las rutas (incluidas las 8 rutas nuevas y 404).
      - Flujo completo de lección → reflexión Senior → XP idempotente → recarga de página → persistencia intacta.
      - Flujo de los 8 laboratorios y descarga real verificada de archivos C4 (`JSON`, `Mermaid`, `SVG`, `PNG`), ADR (`MD`) y Dossier Senior (`JSON`, `MD`).
      - Flujo de los 5 minijuegos y backup/restauración válido + rechazo de backup corrupto.
      - Cero errores de consola (`console.error`), cero `pageerror` y cero violaciones CSP.
      - Viewports ensayados: `320`, `375`, `768`, `1024` y `1440` px sin scroll horizontal accidental.
  - **Resultado para 100 %:** Suite Playwright HTTP real en `PASS` con reporte de trazas generado.

- [x] **ARQ-023 · Auditoría automatizada y manual de Accesibilidad WCAG 2.2 AA + Performance Budget** *(VERIFICADO `PASS` automatizado / `NOT_RUN` lector asistivo humano NVDA — `tests/e2e/wcag-a11y-and-viewports.spec.ts`, `scripts/check-bundle-budget.mjs`, `docs/E2E_56_CONTROLS_AND_WCAG_MATRIX.md`)*
  - **Skills a usar:** `ux-accessibility`, `web-mfe-quality`, `ui-quality-review`
  - **Docs canónicos (`vigilio-docs`):**
    - `standards/experience/accessibility-inclusive-interactions.md`
    - `standards/experience/ux-quality-gates-and-ci-cd.md`
    - `stacks/frontend/web-mfe/quality/8-calidad-seo-accesibilidad-rendimiento.md`
  - **Tarea:**
    - Integrar `@axe-core/playwright` en todas las pantallas tanto en tema `dark` como `light` (y modo `high-contrast`).
    - Verificar navegación 100 % por teclado (orden de tabulación, sin focus traps, `SkipLink`, foco restaurado al navegar), tamaño táctil >= 24×24 CSS px, zoom al 200 % sin solapamientos y `prefers-reduced-motion: reduce`.
    - Configurar un **budget de bundle y assets** en `release-check.mjs` que falle en CI ante regresiones de peso o `CLS`.
    - Ejecutar y documentar lista de comprobación con lector de pantalla real (NVDA en Windows).
  - **Resultado para 100 %:** 0 violaciones críticas/serias en `axe-core`, matriz WCAG por pantalla documentada y budget gate en `PASS` (sesión humana NVDA documentada honestamente como `NOT_RUN`).

---

### BLOQUE 9 — Toolchain Vigilio (Biome + pnpm), Supply Chain y Hosting con Headers Reales

- [x] **ARQ-024 · Alinear `pnpm` + `Biome 2.6.3` ejecutado realmente + Supply Chain & CI GitHub Actions por SHA** *(VERIFICADO `PASS` local / `NOT_RUN` runner GitHub remoto — `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `biome.json`, `.github/workflows/quality-security.yml`, `scripts/check-workflows-governance.mjs`, `security/operational-evidence.json`)*
  - **Skills a usar:** `software-supply-chain-security`, `web-mfe-security-delivery`, `platform-validation-evidence`
  - **Docs canónicos (`vigilio-docs`):**
    - `technology/versions.md`
    - `technology/libraries/biome.md`
    - `technology/libraries/pnpm.md`
    - `technology/libraries/github-actions.md`
    - `stacks/frontend/web-mfe/quality/11-tooling-pnpm-biome-supply-chain.md`
    - `stacks/frontend/web-mfe/delivery/12-devsecops-cicd-github.md`
    - `platform/security/supply-chain.md`
  - **Tarea:**
    - Configurar lockfile determinista (`pnpm-lock.yaml` con `verifyStoreIntegrity: true`, `strictDepBuilds: true`, scripts de postinstall bloqueados por defecto) sin romper la capacidad de compilar y servir `dist/` offline.
    - Instalar y ejecutar **`biome ci`** real sobre `src/`, `scripts/` y `tests/`, corrigiendo cualquier warning de lint/formato/a11y estática.
    - Fijar todas las acciones en `.github/workflows/quality-security.yml` por **commit SHA completo** (en vez de tags mutables `@v4`/`@v5`, cumpliendo `vigilio-docs/AGENTS.md`).
    - Añadir escaneo de vulnerabilidades real sobre el SBOM CycloneDX (Trivy/Grype en CI) y validación HTTP de cabeceras reales en preview/hosting estático (Cloudflare Pages / GitHub Pages / servidor local con middleware de `_headers`).
  - **Resultado para 100 %:** `npm run biome:check` en `PASS` real, workflow validado con SHAs inmutables y reporte determinista `security/operational-evidence.json` generado sin ningún `FAIL`.

---

### BLOQUE 10 — Gate Final de Revisión Independiente y Reempaquetado Cero Pérdida

- [x] **ARQ-025 · Fase `REVIEW` independiente de solo lectura + Empaquetado final verificado con SHA-256** *(VERIFICADO `PASS` — `CHECKSUMS.sha256`, `MANIFEST.md`, `AUDIT_REPORT.md`, `scripts/verify-zero-loss-and-package.mjs`, `ARQPIXEL_ACADEMY_v2_0_VIGILIO_100.zip` extraído y revalidado en carpeta limpia)*
  - **Skills a usar:** `review-code-change`, `ui-quality-review`, `complete-work-no-shortcuts`, `platform-validation-evidence`
  - **Docs canónicos (`vigilio-docs`):**
    - `standards/engineering/change-impact-and-review-gates.md`
    - `governance/implementation-readiness-2026.md`
    - `migration-evidence/ZERO-LOSS-AUDIT.md`
  - **Tarea:**
    1. Ejecutar `review-code-change` y `ui-quality-review` en **modo estricto de solo lectura** sobre todo el diff acumulado; si aparece cualquier hallazgo `BLOQUEANTE`, `ALTA` o `MEDIA`, abrir fase `FIX` separada y repetir `REVIEW` hasta obtener veredicto `APPROVE`.
    2. Comprobar conservación **100 % cero pérdida** de los 240 archivos históricos/base (registrando toda adición o migración en `MANIFEST.md`, regenerando `CHECKSUMS.sha256` y `AUDIT_REPORT.md`).
    3. Extraer el nuevo ZIP final en una carpeta limpia independiente y volver a ejecutar `typecheck`, `biome:check`, `build`, `test`, `test:e2e`, `devsecops` y smoke HTTP real.
  - **Resultado para 100 %:** Veredicto `APPROVE` (`READY`), `CHECKSUMS.sha256` 100 % coincidente y calificación de implementación verificada **10/10 con evidencia reproducible**.

---

## 3. Matriz Rápida: Qué Hacer → Qué Skills Cargar → Resultado Esperado

| ID | Bloque / Entregable | Skills principales (`platform-actions/skills`) | Resultado verificable que desbloquea el `[x]` |
|---|---|---|---|
| `ARQ-001` | `AGENTS.md` y gobierno local | `vigilio-auto-senior`, `vigilio-architecture-guide`, `complete-work-no-shortcuts` | `AGENTS.md` activo con jerarquía de fuentes y reglas cero pérdida |
| `ARQ-002` | 4 ADRs fundacionales | `architecture-traceability`, `web-mfe-technologies` | `docs/adr/0001..0004.md` aprobados y enlazados |
| `ARQ-003` | Migración Preact 11 + Vite + modularización `src/` | `web-mfe-technologies`, `web-mfe-build-feature`, `symbol-ownership-architecture`, `refactor-existing-code` | Fin del monolito `src/app.ts`; features limpias, 0 `any`, build reproducible |
| `ARQ-004` | Validación Zod 4 en catálogos y backups | `web-mfe-build-feature`, `symbol-ownership-architecture` | Schemas propietarios por feature; payloads corruptos rechazados en tests |
| `ARQ-005` | Página `#/mapa` visual con prerrequisitos | `ux-information-architecture`, `ux-web-experience`, `ux-accessibility` | Grafo curricular de 54 nodos accesible por teclado |
| `ARQ-006` | Páginas `#/rutas/R01..R08` individuales | `ux-information-architecture`, `web-mfe-build-feature` | 8 vistas de detalle con progreso y acceso a capstone |
| `ARQ-007` | Ruta `#/aprender/:id?senior=1` + sidebar aula | `ux-information-architecture`, `refactor-existing-code` | URL canónica del Master Spec activa + alias `#/modulo/:id` intacto |
| `ARQ-008` | Página `#/proyectos` (Capstones interactivos) | `ux-web-experience`, `web-mfe-build-feature`, `architecture-traceability` | Workspace de los 8 capstones con checklist y export `.md`/`.json` |
| `ARQ-009` | Subrutas `#/recursos/patrones/:id` y `#/recursos/adr` | `ux-information-architecture`, `complete-work-no-shortcuts` | Fichas completas de patrones + comparativas + plantillas ADR |
| `ARQ-010` | Páginas `#/logros`, `#/ajustes` y `#/sobre` | `ux-web-experience`, `ux-accessibility`, `ui-design-system` | Preferencias a11y, insignias dedicadas y transparencia metodológica |
| `ARQ-011` | `SearchCommand` (`Ctrl+K`), `SkipLink`, `HintDrawer` y estados UI | `ui-design-system`, `ui-interaction-motion`, `ux-accessibility` | 9 estados interactivos, buscador global y bugs de texto corregidos |
| `ARQ-012` | 16 sprites PNG RGBA de ArquiBot + manifest | `ui-art-direction`, `web-mfe-quality` | `public/assets/arquibot/*.png` transparentes + `CLS = 0` |
| `ARQ-013` | C4 Studio C1/C2/C3 + Import JSON + reglas semánticas | `web-mfe-build-feature`, `ux-accessibility` | Round-trip JSON C4, 3 niveles C4 y alertas de antipatrones |
| `ARQ-014` | DDD Workshop real (Context Map + Agregados) | `vigilio-architecture-guide`, `web-mfe-build-feature` | Lienzo de Bounded Contexts, ACL/eventos e invariantes testeados |
| `ARQ-015` | Profundización de los otros 6 laboratorios | `web-mfe-build-feature`, `platform-observability-sre`, `platform-resilience-disaster-recovery` | OpenAPI diff, simulador Outbox/Saga/DLQ y calculadora SLO burn rate |
| `ARQ-016` | Senior Mode 2.0: incidentes encadenados multi-paso | `vigilio-architecture-guide`, `platform-scalability-capacity`, `platform-finops` | Decisiones con efectos cruzados en capacidad/costos y fase 2 de crisis |
| `ARQ-017` | Dossier Senior v2 + rúbrica humana importable | `architecture-traceability`, `platform-validation-evidence` | Cierre formal auditable para controles `REQUIRES_REVIEW` |
| `ARQ-018` | 36 lecciones con diagramas SVG/Mermaid y bloques ✅/❌ | `complete-work-no-shortcuts`, `ui-design-system` | 36/36 módulos con visualización y comparativa de código verificada |
| `ARQ-019` | Repo ejecutable `examples/nexoshop-reference-nestjs/` | `node-nest-build-feature`, `node-nest-testing`, `symbol-ownership-architecture` | Proyecto NestJS + Zod 4 + Drizzle con tests de arquitectura de capas |
| `ARQ-020` | Migración regresiva de backups `v1.2` → `v2.0` | `web-mfe-testing`, `platform-validation-evidence` | Fixtures históricos pasando al 100 % sin inflar XP |
| `ARQ-021` | CSP estricto sin `'unsafe-inline'` | `web-mfe-security-delivery`, `ui-design-system` | `style-src 'self'` activo con 0 violaciones CSP |
| `ARQ-022` | Playwright 1.64.1 sobre HTTP real (56 controles) | `web-mfe-testing`, `web-mfe-quality` | E2E real con descargas, persistencia, headers y 5 viewports en `PASS` |
| `ARQ-023` | Accesibilidad WCAG 2.2 AA (`axe-core` + teclado/SR) | `ux-accessibility`, `ui-quality-review` | 0 fallos serios/críticos en dark/light/high-contrast + zoom 200 % |
| `ARQ-024` | `pnpm` endurecido + `Biome 2.6.3` + Actions por SHA | `software-supply-chain-security`, `web-mfe-security-delivery` | `biome ci` ejecutado en `PASS`, workflows con SHA completo y escaneo CVE |
| `ARQ-025` | Review independiente + ZIP final cero pérdida | `review-code-change`, `ui-quality-review`, `complete-work-no-shortcuts` | Veredicto `APPROVE`, `CHECKSUMS.sha256` íntegro y validación en limpio |
