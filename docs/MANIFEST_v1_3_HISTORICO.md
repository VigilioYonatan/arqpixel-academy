# MANIFEST — ARQPIXEL Academy 1.3

**Origen preservado:** 40 archivos de ARQPIXEL v1.2, **0 rutas eliminadas**. Se conservan todos los archivos originales, con modificaciones explícitas en código/docs cuando corresponde.

## Puntos de entrada

- `dist/index.html` y `dist/app.js`: app estática ya compilada.
- `src/app.ts`, `src/styles.css`, `src/engine.ts`: navegación, diseño, motor de reglas.
- `src/senior-suite.ts`, `src/senior-simulations.ts`: Senior Mode, 18 playbooks y experimentos S09/S11.
- `data/modules.json`, `data/deep-dives.json`, `data/senior.json`, `data/lab-cases.json`, `data/paths.json`: catálogos y especializaciones.
- `public/assets/` y `dist/assets/`: ArquiBot, referencia y variantes de imagen.
- `tools/typescript/bin/tsc`: compilador TypeScript 5.8.3 para builds sin descargas; su licencia está incluida en `tools/typescript/LICENSE.txt`.
- `tests/*.test.mjs`: 26 tests de catálogos, reglas, playbooks, simuladores, importación y especializaciones.
- `scripts/release-check.mjs`: verifica integridad de estructura y sincronía de `dist`.
- `docs/MASTER_SPEC.md`: contrato original de producto; no afirma que todo esté implementado.
- `docs/AUDIT_REPORT_v1_1.md`, `docs/AUDIT_REPORT_v1_2_HISTORICO.md`, `docs/README_v1_2_HISTORICO.md`: historial conservado.
- `docs/SENIOR_MODE_GUIA.md`: instrucciones prácticas y límites.
- `README.md`, `AUDIT_REPORT.md`, `CHECKSUMS.sha256`: instalación, estado y hashes de fuentes.

## Comandos de verificación (Node.js 20+)

```bash
npm run typecheck
npm run build
npm test
node scripts/release-check.mjs
```

## Exclusiones conscientes

- No se agregan `node_modules`, cachés, credenciales ni archivos `.env`.
- No se genera `package-lock.json`: no hay `dependencies` ni `devDependencies` en npm; el compilador necesario ya está dentro del ZIP.
- No se incorpora captura de pantalla automática: Chromium quedó bloqueado por la política del entorno.
- No se incluye el PNG `senior-preview.png`: fue un intento de captura no producido exitosamente.

## Regla de trazabilidad

El estado y las pruebas observadas están en `AUDIT_REPORT.md`; la lista de hashes en `CHECKSUMS.sha256`. La estructura respeta una única raíz `arqpixel-academy/` dentro del ZIP.
