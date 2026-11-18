# ADR 0006 - Escenas 3D interactivas con Three.js (`0.187.0`, MIT) bajo carga diferida y claridad cognitiva minimalista

## Estado

Aprobado

## Contexto

Los cinco minijuegos arquitectónicos (`tetris`, `acoplamiento`, `patrones`, `dominio`, `incidente`) necesitaban evolucionar hacia escenarios espaciales dinámicos en 3D que representen visualmente capas concéntricas, acoplamientos circulares, patrones GoF, contextos acotados DDD y telemetría SRE de 60 pasos, sin degradar el tiempo de carga inicial de la academia ni violar:

1. La compilación 100 % offline sin red de `npm run devsecops:offline` (`ADR-0001`).
2. La política `Content-Security-Policy` estricta (`script-src 'self'; style-src 'self'; connect-src 'none'`, `ADR-0005`).
3. El ciclo de vida WebGL seguro de `vigilio-docs/technology/libraries/ogl.md` y `ux-game-experience`: carga perezosa, limpieza determinista de buffers/`requestAnimationFrame`/`WEBGL_lose_context`, respeto a `prefers-reduced-motion` y fallback 2D accesible por teclado.

## Decision

1. **Vendorización íntegra con licencia auditable (`MIT`) y SBOM SHA-256:** incorporar `three@0.187.0` exacto en `package.json`/`pnpm-lock.yaml` y vendorizar los módulos ESM originales inalterados (`three.module.js`, `three.core.js`, `LICENSE`, `package.json`) en `public/vendor/three/`, inventariados con sus hashes `SHA-256` en `security/sbom.cdx.json` y validados por `scripts/check-licenses.mjs`.
2. **Aislamiento por `import()` dinámico en `#/minijuego/:id`:** prohibir cualquier `import` estático de `vendor/three/` en `dist/app.js` (auditado automáticamente en `scripts/check-bundle-budget.mjs`). El motor 3D solo se solicita al abrir un minijuego.
3. **Ciclo de vida GPU y accesibilidad (`src/features/minigames/three-arcade-stage.ts`):**
   - Usar `renderer.setSize(width, height, false)` para nunca inyectar atributos `style` inline y cumplir `style-src 'self'`.
   - Limitar `devicePixelRatio <= 2`, pausar o renderizar estático bajo `prefers-reduced-motion` / `userSettings.reducedMotion`, ofrecer controles de cámara y pausa por teclado/botón, y ejecutar `dispose()` + `cancelAnimationFrame()` + `loseContext()` en cada cambio de ruta.
   - Si WebGL no está disponible (ej. entornos sin GPU o harness aislado de módulos Blob), degradar limpiamente a un esquema SVG interactivo 2D sin lanzar errores.
4. **Claridad cognitiva minimalista (`src/features/shared/ui/visual-clarity.ts`):** incorporar resúmenes visuales ejecutivos de lectura rápida (< 10 s) y diagramas de flujo SVG antes de bloques densos en Aula y Senior Mode, preservando medida tipográfica legible (`max-width: 70ch`) y espacio negativo limpio.

## Consecuencias

- **Beneficios:** experiencia 3D real, fluida y pedagógicamente conectada a cada decisión arquitectónica en los 5 minijuegos; cero impacto en el bundle inicial de `#/inicio`, `#/mapa`, `#/aprender` o `#/senior`; trazabilidad completa de licencia MIT y hashes SHA-256.
- **Costos:** el directorio `dist/vendor/three/` añade ~2.1 MB estáticos servidos únicamente bajo demanda en `#/minijuego/:id`, controlados por un presupuesto explícito (`maxLazyVendorJsRawBytes`) separado del presupuesto de módulos ESM sin minificar (`maxSingleJsRawBytes: 135 KB`, `maxTotalJsRawBytes: 865 KB`, `maxTotalJsGzipBytes: 275 KB`).

## Alternativas consideradas

- **Opción A (Elegida):** `three@0.187.0` vendorizado en `public/vendor/three/` cargado vía `import()` dinámico exclusivo en `#/minijuego/:id` con fallback SVG 2D y cleanup GPU estricto.
- **Opción B:** Cargar Three.js desde un CDN externo (`unpkg`/`jsdelivr`). Descartada porque viola `script-src 'self'` y rompe el funcionamiento offline-first.
- **Opción C:** Importar Three.js de forma estática en `src/app.ts`. Descartada porque penalizaría todas las rutas de lectura y superaría el presupuesto de carga inicial.

## Fecha

2026-11-16

## Owners

- Equipo: Experiencia de Producto, Gráficos Web y Arquitectura ARQPIXEL Academy
