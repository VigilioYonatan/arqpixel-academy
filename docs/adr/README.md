# Índice de Registros de Decisión Arquitectónica (ADR) — ARQPIXEL Academy

Este directorio contiene las decisiones arquitectónicas normativas de **ARQPIXEL Academy**, redactadas conforme a la plantilla canónica de `vigilio-docs/adr/0000-template.md`. Los ADRs aprobados no se sobrescriben silenciosamente; si una decisión cambia en el futuro, debe registrarse un nuevo ADR que la reemplace explícitamente.

| ID | Título | Estado | Fecha | Alcance principal |
|---|---|---|---|---|
| [ADR 0001](0001-arquitectura-frontend-modular-dom-estatico-offline.md) | Arquitectura frontend modular en TypeScript ES2022 + DOM nativo offline-first | Aprobado | 2026-11-16 | `src/`, `dist/`, `tools/typescript/`, `package.json` |
| [ADR 0002](0002-contratos-schemas-borde-y-migracion-progreso.md) | Validación estricta de esquemas en borde y compatibilidad regresiva de progreso | Aprobado | 2026-11-16 | `src/features/**/schemas/`, `data/*.json`, `localStorage` |
| [ADR 0003](0003-limites-evaluacion-automatica-y-revision-humana.md) | Frontera entre verificación determinista y revisión humana (`REQUIRES_REVIEW`) | Aprobado | 2026-11-16 | `src/engine.ts`, `src/senior-*.ts`, `src/lesson-senior.ts` |
| [ADR 0004](0004-politica-csp-cabeceras-y-seguridad-local-first.md) | Política de seguridad local-first, sanitización DOM/SVG y cabeceras CSP | Aprobado | 2026-11-16 | `index.html`, `public/_headers`, `scripts/security-*.mjs` |
| [ADR 0005](0005-csp-estricta-sin-unsafe-inline-y-servidor-http-test.md) | Endurecimiento de CSP a `style-src 'self'` sin `'unsafe-inline'` y verificación HTTP real | Aprobado | 2026-11-16 | `index.html`, `public/_headers`, `src/styles.css`, `scripts/serve-dist-with-headers.mjs` |
| [ADR 0006](0006-escenas-3d-threejs-lazy-minijuegos-y-claridad-cognitiva.md) | Escenas 3D interactivas con Three.js (`0.187.0`, MIT) bajo carga diferida y claridad cognitiva minimalista | Aprobado | 2026-11-16 | `public/vendor/three/`, `src/features/minigames/`, `src/features/shared/ui/` |
