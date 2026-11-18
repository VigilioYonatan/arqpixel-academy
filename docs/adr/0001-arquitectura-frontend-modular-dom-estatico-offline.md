# ADR 0001 - Arquitectura frontend modular en TypeScript ES2022 + DOM nativo offline-first

## Estado

Aprobado

## Contexto

El anexo inicial de planificación (`MASTER_SPEC v1.0`) contemplaba Preact + Vite como posible stack frontend, mientras que el documento rector vigente (`TODO_LO_QUE_DEBE_TENER_ESTA_APP.md`, secciones 3.1, 3.2, 12.4 R-15 y 15.4) dejó explícitamente abierta la decisión arquitectónica entre:

1. Migrar a Preact + Vite añadiendo dependencias npm de runtime y empaquetador; o
2. Formalizar mediante ADR y pruebas una arquitectura modular sobre **TypeScript estricto ES2022 + DOM nativo** preservando la compilación 100 % offline con `tools/typescript/bin/tsc`.

El proyecto cuenta actualmente con restricciones verificables críticas:

- El pipeline `npm run devsecops:offline` se ejecuta **sin instalar paquetes externos** (`no dependency install` en `.github/workflows/quality-security.yml`).
- El inventario `security/sbom.cdx.json` y `tests/sbom.test.mjs` exigen cero dependencias de runtime en el navegador y solo el compilador TypeScript `5.8.3` vendorizado con licencia `Apache-2.0`.
- El problema real de mantenibilidad en `v1.7` no proviene de carecer de un virtual DOM, sino de concentrar las vistas, constantes y validaciones en un único archivo monolítico `src/app.ts` de 62 KB.

## Decision

Adoptar oficialmente **TypeScript estricto (`ES2022`) compilado a módulos ES nativos sobre DOM estándar, organizado por features cohesivas (`src/features/<feature>/`) y cero dependencias de runtime**, descartando introducir Preact o Vite mientras no exista un requisito funcional que el estándar web no cubra.

La descomposición interna sigue las reglas de `symbol-ownership-architecture` y `web-mfe-build-feature`:

- **Motores puros y esquemas sin DOM** en módulos dedicados, 100 % testeables directamente en Node.js (`node:test`).
- **Constantes operativas** extraídas a `src/features/<feature>/constants/*.constants.ts`.
- **Validadores de borde y tipos inferidos** colocalizados en `src/features/<feature>/schemas/*.schema.ts` (cero carpetas globales `contracts/` y cero uso de `any`).
- **Compatibilidad de artefactos:** mantener intactas las entradas `dist/app.js`, `dist/engine.js`, `dist/c4-studio.js`, `dist/mini-games.js`, `dist/lesson-senior.js` y `dist/senior-*.js` exigidas por `scripts/release-check.mjs` y `tests/catalog.test.mjs`.

## Consecuencias

- **Beneficios:** compilación determinista bit a bit en cualquier máquina sin red (`npm run build`), superficie de ataque de cadena de suministro nula en el bundle del navegador, arranque instantáneo y pruebas de lógica/render ejecutables en milisegundos con `node:test`.
- **Costos y disciplina exigida:** toda interpolación en HTML o SVG debe pasar obligatoriamente por funciones de escape (`esc()`) para impedir XSS, y la gestión de foco/teclado debe implementarse y probarse explícitamente al re-renderizar vistas.
- **Deuda controlada:** si en una versión futura se incorporan editores complejos de terceros (como CodeMirror), deberá emitirse un nuevo ADR evaluando su vendorización con licencia auditable frente a un bundler con lockfile endurecido.

## Alternativas consideradas

- **Opción A (Elegida):** Modularización por features en TypeScript ES2022 + DOM nativo sin dependencias de runtime, compilado con `tools/typescript`.
- **Opción B:** Migrar a Preact 11 + Vite 8.3.5 instalando `node_modules`. Descartada en esta etapa porque rompe la garantía de compilación offline sin `npm install` de `devsecops:offline` y amplía la cadena de suministro sin necesidad funcional para una SPA estática local-first.
- **Opción C:** Mantener `src/app.ts` monolítico sin separar constantes, esquemas ni features. Descartada por dificultar la evolución a las nuevas pantallas (`#/mapa`, `#/proyectos`, `#/rutas/:id`, `#/ajustes`), ocultar números mágicos y propiciar regresiones.

## Fecha

2026-11-16

## Owners

- Equipo: Arquitectura y Plataforma Educativa ARQPIXEL
- Responsable: Comité Técnico ARQPIXEL / Gobernanza Vigilio
