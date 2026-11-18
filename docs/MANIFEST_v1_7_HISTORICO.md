# MANIFEST DE ENTREGA — ARQPIXEL v1.7

**Raíz correcta dentro del ZIP:** `arqpixel-academy/`. **Objetivo:** sitio estático de Arquitectura de Software, con código fuente, assets, tests y compilador local para recompilar sin npm.

## Conservación estricta de archivos

- ZIP v1.6 original: **223** archivos.
- Árbol v1.7: **240** archivos.
- Archivos anteriores conservados por ruta relativa: **223/223**.
- Archivos anteriores faltantes: **0**.
- Nombres nuevos: **17**.
- Ningún archivo se borra deliberadamente. Los documentos anteriores están conservados bajo `docs/` como versiones históricas cuando se actualizaron.

## Archivos nuevos (respecto a v1.6)

- `TODO_LO_QUE_DEBE_TENER_ESTA_APP.md`
- `data/mini-games.json`
- `dist/c4-studio.js`
- `dist/data/mini-games.json`
- `dist/lesson-senior.js`
- `dist/mini-games.js`
- `docs/AUDIT_REPORT_v1_6_HISTORICO.md`
- `docs/MANIFEST_v1_6_HISTORICO.md`
- `docs/README_v1_6_HISTORICO.md`
- `docs/RELEASE_VALIDATION_v1_4_HISTORICO.md`
- `src/c4-studio.ts`
- `src/lesson-senior.ts`
- `src/mini-games.ts`
- `tests/c4-studio.test.mjs`
- `tests/lesson-senior.test.mjs`
- `tests/mini-games.test.mjs`
- `tests/spec-document.test.mjs`

## Inventario por carpeta

| Carpeta | Archivos |
|---|---:|
| `(raíz)` | 17 |
| `.github` | 1 |
| `data` | 6 |
| `dist` | 23 |
| `docs` | 19 |
| `public` | 4 |
| `scripts` | 7 |
| `security` | 1 |
| `src` | 12 |
| `tests` | 20 |
| `tools` | 130 |

## Piezas mínimas y su responsabilidad

- `TODO_LO_QUE_DEBE_TENER_ESTA_APP.md`: contrato exhaustivo del producto **(2.800 líneas)**; exigido por release-check y tests.
- `README.md`: uso y compilación de la versión actual.
- `AUDIT_REPORT.md`: hallazgos, evidencia y límites.
- `CHECKSUMS.sha256`: hash de cada archivo incluido salvo sí mismo.
- `package.json`, `tsconfig.json`, `tools/typescript/`: build reproducible offline.
- `index.html`, `src/`, `public/`, `data/`, `dist/`: app lista para servir sin npm.
- `tests/`: 69 pruebas Node más pruebas navegador; no eliminar.
- `scripts/`: build, seguridad, licencias, SBOM y release gate.
- `security/sbom.cdx.json`: lista de componentes declarados; no informe de CVEs.
- `.github/workflows/quality-security.yml`, `biome.json`: CI/lint configurados pero ejecución real externa no certificada.
- `docs/MASTER_SPEC.md`: especificación original, reproducida además dentro del documento rector nuevo.

## Exclusiones conscientes

- No se empaquetan dependencias de npm descargadas, `.env`, credenciales, claves privadas ni cachés de navegador.
- Se conserva TypeScript vendorizado y su licencia porque habilita build offline.
- Se conservan los recursos históricos y logs antiguos que ya formaban parte de v1.6 para no incumplir preservación. En una próxima limpieza se requiere autorización y manifiesto de migración.

## Instrucciones

```bash
cd arqpixel-academy
python3 -m http.server 4173 --directory dist
# Navegador: http://localhost:4173
npm run devsecops:offline  # requiere Node 20+
npm run test:browser       # requiere Python Playwright + Chromium
```

**Regla final:** comprobar CRC, hashes, extracción limpia y todas las rutas de v1.6. **No** usar el tamaño en MB como prueba de completitud. Ver `AUDIT_REPORT.md` para gates no verificados.
