# Manifest de entrega — ARQPIXEL Academy v1.6

## Composición

La raíz del ZIP se llama `arqpixel-academy/`, con aplicación web estática lista para servir y fuentes editables. Se conserva **cada ruta de los 212 archivos del ZIP v1.5**; las rutas modificadas incorporan correcciones y las nuevas son adicionales. Los viejos logs y el archivo `http.pid` son históricos conservados exclusivamente por petición de no borrar archivos: no son procesos activos ni evidencia de esta auditoría.

| Grupo | Rutas clave | Propósito |
|---|---|---|
| Web servida | `dist/index.html`, `dist/app.js`, `dist/styles.css`, `dist/data`, `dist/assets` | Versión ejecutable sin npm |
| Fuentes | `src/*.ts`, `src/styles.css`, `index.html` | Código editable TypeScript/DOM |
| Contenido | `data/{modules,deep-dives,senior,paths,lab-cases}.json` | 36 lecciones, 18 Senior, 8 rutas |
| Senior Mode | `src/senior-suite.ts`, `src/senior-reviews.ts`, `src/senior-threats.ts`, `src/senior-devsecops.ts`, `src/senior-impact.ts`, `src/senior-simulations.ts` | 108 actividades + 18 bonus DevSecOps + 18 bonus STRIDE |
| Calidad | `tests/*.test.mjs`, `tests/browser-e2e.py`, `scripts/*.mjs`, `biome.json` | Unit tests, pruebas de UI, escáneres y build |
| CI | `.github/workflows/quality-security.yml` | Pipeline propuesto GitHub (no ejecutado aquí) |
| Dependencias | `tools/typescript/` | Compilador TypeScript vendorizado con licencia |
| Seguridad | `SECURITY.md`, `security/sbom.cdx.json`, `public/_headers`, `CHECKSUMS.sha256` | Límites, inventario y checksums |
| Documentos | `README.md`, `AUDIT_REPORT.md`, `docs/MASTER_SPEC.md`, `docs/PRUEBAS_NAVEGADOR.md` | Uso, objetivo, evidencia y pendientes |
| Marca | `public/assets/arquibot.png`, `public/assets/arquibot-lab.png` | Robot azul/cian, no TerraBot |
| Histórico visual | `docs/legacy/arquibot-v15-mascota-terraform.png` | Recurso anterior conservado, no usado por la app |

## Comandos reproducibles

```sh
# Uso del paquete compilado
python3 -m http.server 4173 --directory dist

# Con Node.js 20+ (el compilador viene incluido)
npm run devsecops:offline

# Con Python Playwright y Chromium disponibles
npm run test:browser
```

## Límites

Biome está configurado y en el CI, pero el ejecutable no se incluye. Su instalación requiere acceso a npm. El SBOM es inventario offline, **no** consulta vulnerabilidades. La aplicación está lista para ser probada/estudiada en local; un deploy productivo requiere comprobaciones adicionales de HTTP, accesibilidad y seguridad del hosting.
