# REPORTE DE UNIFICACIÓN — ARQPIXEL Academy v1.7

**Fecha de ejecución:** 2026-11-16  
**Entorno:** Windows (PowerShell), Python 3.14.7, Node.js v24.22.0, npm 11.19.1  
**Estado general:** UNIFICACIÓN COMPLETADA E ÍNTEGRA (240/240 archivos recuperados y verificados por SHA-256)

---

## 1. Ruta de los cuatro ZIP originales

Los cuatro archivos ZIP originales se localizaron intactos y sin modificaciones en:

1. `C:\Users\Admin\Desktop\VIGILIO\proyectos\ARQPIXEL\ARQPIXEL_v1_7_PARTE_01_DE_04.zip` (`3,558,308` bytes — SHA-256: `46266D1B29C6BACEDFC18B7BFCAED0B2D0656DC310FA0CA8B876402F3B22B579`)
2. `C:\Users\Admin\Desktop\VIGILIO\proyectos\ARQPIXEL\ARQPIXEL_v1_7_PARTE_02_DE_04.zip` (`3,407,658` bytes — SHA-256: `264B8C11178C7161B66EE32C253C17DA2F03E96CA8DAD3E6096B82343323AC67`)
3. `C:\Users\Admin\Desktop\VIGILIO\proyectos\ARQPIXEL\ARQPIXEL_v1_7_PARTE_03_DE_04.zip` (`3,407,950` bytes — SHA-256: `8EB667825982F76666A78B52C15FCE2FD66BD850F8AF8ECBCEA1C2FDC6AC8BCF`)
4. `C:\Users\Admin\Desktop\VIGILIO\proyectos\ARQPIXEL\ARQPIXEL_v1_7_PARTE_04_DE_04.zip` (`3,407,850` bytes — SHA-256: `8E037C6727306B3920ABCD80C47B338B66C928EE9931E78CC5B463E7FBAF0600`)

---

## 2. Cantidad de archivos por ZIP

Todos los ZIP superaron la comprobación de integridad `zipfile.ZipFile.testzip()` (`None`, sin entradas corruptas) y comparten el único prefijo raíz `arqpixel-academy/`:

| Archivo ZIP | Entradas de archivo | Entradas de directorio explícitas | `testzip()` |
|---|---:|---:|---|
| `ARQPIXEL_v1_7_PARTE_01_DE_04.zip` | 3 | 0 | OK (`None`) |
| `ARQPIXEL_v1_7_PARTE_02_DE_04.zip` | 78 | 0 | OK (`None`) |
| `ARQPIXEL_v1_7_PARTE_03_DE_04.zip` | 81 | 0 | OK (`None`) |
| `ARQPIXEL_v1_7_PARTE_04_DE_04.zip` | 78 | 0 | OK (`None`) |
| **Suma total** | **240** | **0** | **OK** |

---

## 3. Total de archivos únicos

- **Total de rutas únicas en los 4 ZIP:** `240` archivos.
- **Total de archivos extraídos en `ARQPIXEL_COMPLETO/arqpixel-academy/`:** `240` archivos.
- **Archivos de 0 bytes (vacíos):** `0`.
- **Carpetas raíz en `ARQPIXEL_COMPLETO/`:** únicamente `arqpixel-academy/` (sin carpetas duplicadas como `arqpixel-academy/arqpixel-academy/` ni `PARTE_01/`).
- **Elementos clave verificados presentes:** `TODO_LO_QUE_DEBE_TENER_ESTA_APP.md` (194,875 bytes), `package.json`, `README.md`, `biome.json`, `CHECKSUMS.sha256`, `MANIFEST.md`, `SECURITY.md`, `AUDIT_REPORT.md`, `src/`, `dist/`, `public/`, `tools/`, `data/`, `docs/` (19 archivos), `tests/`, `scripts/`, `security/`, `.github/workflows/quality-security.yml`, `.gitignore`.

---

## 4. Archivos duplicados

- **Rutas duplicadas entre los cuatro ZIP:** `0` (`0` duplicados idénticos).

---

## 5. Conflictos encontrados y resolución

- **Conflictos de rutas con distinto contenido:** `0`.
- **Rutas inseguras / path traversal / symlinks:** `0` detectados.

---

## 6. Cantidad de archivos recuperados correctamente

- **Recuperados correctamente:** `240` de `240` (`100%`), sin pérdidas, sin truncamientos, sin archivos faltantes y sin archivos extra inesperados.

---

## 7. Resultados de SHA-256

1. **Verificación ZIP original -> proyecto reconstruido (`ARQPIXEL_COMPLETO/arqpixel-academy/`):**
   - Comparados los `240` archivos uno a uno mediante SHA-256 entre el flujo de bytes leído de los ZIP originales y los archivos escritos en disco.
   - **Coincidencias:** `240 / 240` (`0` discrepancias).
2. **Verificación contra `CHECKSUMS.sha256` incluido en el proyecto:**
   - Entradas listadas en `CHECKSUMS.sha256`: `239` (todos los archivos del proyecto excepto el propio `CHECKSUMS.sha256`).
   - **Coincidencias:** `239 / 239` (`0` discrepancias, `0` faltantes).
3. **Verificación proyecto reconstruido -> ZIP definitivo (`ARQPIXEL_ACADEMY_v1_7_UNIFICADO.zip`):**
   - `zipfile.ZipFile.testzip()` sobre el ZIP final: `None` (compresión íntegra).
   - Cantidad de archivos en el ZIP final: `240`, todos bajo el prefijo único `arqpixel-academy/`.
   - **Coincidencias SHA-256 (ZIP final vs. originales y vs. reconstruido):** `240 / 240` (`0` discrepancias).
   - **Prueba de extracción limpia:**
     - Con Python `zipfile.extractall()`: `240 / 240` archivos extraídos con SHA-256 idéntico (`0` discrepancias).
     - Con PowerShell `Expand-Archive` (compatible con Windows 11): `240` archivos extraídos correctamente.

---

## 8. Pruebas ejecutadas y resultados reales

### Ejecutadas sobre `ARQPIXEL_COMPLETO/arqpixel-academy`

| Comando | Resultado | Detalle observado |
|---|---|---|
| `npm run typecheck` (`tsc -p tsconfig.json --noEmit`) | **PASS** (exit 0) | Compilación de tipos TypeScript con `tools/typescript/bin/tsc` sin errores |
| `npm test` (`node --test tests/*.test.mjs`) | **PASS** (exit 0) | **69 / 69** pruebas pasadas (`0` fallos, `0` omitidas, `0` todo) |
| `npm run security:scan` | **PASS** (exit 0) | `SECRET SCAN PASS (heuristic patterns; not full historical/entropy scan)` |
| `npm run security:headers` | **PASS** (exit 0) | `SECURITY HEADERS PASS: static policies declared (deployment-dependent)` |
| `npm run security:licenses` | **PASS** (exit 0) | `VENDORED TYPESCRIPT LICENSE PASS (Apache-2.0)` |
| `npm run release-check` | **PASS** (exit 0) | `36 lecciones, 18 misiones, 108 actividades Senior, 8 especializaciones, 5 minijuegos / 30 decisiones, C4 editable, 12 casos extra, assets y dist sincronizados.` |

### Ejecutadas en copia temporal aislada (para no alterar fechas/hashes originales durante `build` y `sbom`)

| Comando | Resultado | Detalle observado |
|---|---|---|
| `npm run devsecops:offline` (`typecheck`, `build`, `sbom`, `test`, `security:scan`, `security:headers`, `security:licenses`, `release-check`) | **PASS** (exit 0) | `build dist/ successfully`; `SBOM PASS: 2 libraries inventoried`; **69 / 69** tests PASS; todos los controles PASS |
| Comparación SHA-256 post-recompilación vs. original | **PASS** | `0` archivos extra, `0` faltantes, `0` hashes distintos (compilación y SBOM 100% reproducibles bit a bit) |

### Comprobación de referencias y recursos

- `dist/index.html` referencia `./styles.css` y `./app.js`: ambos existen en `dist/`.
- Importaciones relativas entre módulos JS de `dist/*.js` y rutas `assets/` / `data/`: todas existen en `dist/` (la única coincidencia `../infra/legacy-db` encontrada por regex corresponde a un snippet de texto educativo en `src/senior-reviews.ts` para la revisión de código de la misión `S01`).
- Assets gráficos en `public/assets/` y `dist/assets/`: `arquibot.png` (967,336 B), `arquibot-lab.png` (1,583,243 B), `hero-reference.png` (1,747,202 B).
- Catálogos en `data/`: `modules.json` (36), `deep-dives.json` (36), `senior.json` (18), `mini-games.json` (5 juegos / 30 decisiones), `paths.json` (8), `lab-cases.json` (`patterns`: 4, `api`: 4, `incident`: 4).

---

## 9. Ruta del proyecto reconstruido

- **Carpeta contenedora:** `C:\Users\Admin\Desktop\VIGILIO\proyectos\ARQPIXEL\ARQPIXEL_COMPLETO\`
- **Raíz única del proyecto:** `C:\Users\Admin\Desktop\VIGILIO\proyectos\ARQPIXEL\ARQPIXEL_COMPLETO\arqpixel-academy\`

---

## 10. Ruta del ZIP final

- **Archivo:** `C:\Users\Admin\Desktop\VIGILIO\proyectos\ARQPIXEL\ARQPIXEL_ACADEMY_v1_7_UNIFICADO.zip`
- **Tamaño:** `13,841,503` bytes
- **SHA-256:** `AE60B312CFD65FD38AC30065E158FA0D6F011E662389E5A26260446427F70517`
- **Estructura interna:** contiene directamente `arqpixel-academy/` con los `240` archivos íntegros.

---

## 11. Problemas pendientes o verificaciones imposibles

Las siguientes comprobaciones **NO se pudieron ejecutar** en este entorno y quedan marcadas como **NO VERIFICADA**:

1. **`npm run biome:check` (`biome ci src scripts tests`):** **NO VERIFICADA** — El ejecutable `@biomejs/biome` (`2.2.7`) no está instalado ni en el sistema ni en `node_modules` (el proyecto es offline-first y declara `@biomejs/biome` como `devDependency` opcional).
2. **`npm run test:browser` (`python3 tests/browser-e2e.py`):** **NO VERIFICADA** — El paquete Python `playwright` (y Chromium asociado) no está instalado en el entorno actual, por lo que la interacción real en navegador (render visual de ArquiBot azul/cian, navegación SPA, interacción de laboratorios/minijuegos y exportación en UI) no ha sido ejecutada en vivo aquí; su comportamiento lógico y generación de HTML/contratos fue verificado únicamente mediante los 69 tests unitarios/integración de Node.js.
3. **Auditoría CVE externa y headers HTTP en servidor de producción real:** **NO VERIFICADA** — Conforme documenta el propio `SECURITY.md` y `scripts/generate-sbom.mjs`, los controles offline no consultan bases de vulnerabilidades ni prueban despliegue TLS/HTTPS real.
