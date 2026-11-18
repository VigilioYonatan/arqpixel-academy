# ARQPIXEL Academy — DevSecOps, seguridad y release gate (v1.5)

## Qué es y qué NO es

La aplicación es una academia estática local-first. Este documento controla **nuestro código y paquete**; el laboratorio de Senior Mode enseña a priorizar controles, pero **no escanea repositorios de terceros ni despliega infraestructura real**.

## Línea base de seguridad y controles

| Control | Implementación | Cómo verificar | Alcance |
|---|---|---|---|
| TypeScript estricto | `tsconfig.json`, `tools/typescript/` | `npm run typecheck` | Código `src/` |
| Tests nativos Node | `tests/*.test.mjs` | `npm test` | Lógica didáctica, importación, validaciones y controles |
| Build reproducible offline | `scripts/copy-assets.mjs`, `tools/typescript/` | `npm run build` | Código + catálogos + assets |
| Biome lint | `biome.json`, `package.json` | `npm install` y `npm run biome:check` | Lint incremental; **formato deshabilitado** por deuda heredada |
| Secret scanning heurístico | `scripts/security-scan.mjs` | `npm run security:scan` | Fuentes; ignora dependencias vendorizadas, no revisa historia Git |
| CSP en la app | `index.html` | `npm run security:headers` | CSP meta se aplica con cualquier hosting HTTP compatible |
| Cabeceras del hosting | `public/_headers` | `npm run security:headers` | Solo hosts compatibles (ej. Netlify/Cloudflare Pages); servidor Python **no** aplica `_headers` |
| Licencias TypeScript vendorizado | `tools/typescript/LICENSE.txt`, `ThirdPartyNoticeText.txt` | `npm run security:licenses` | Solo TypeScript; no constituye SBOM |
| Integridad de catálogos y dist | `scripts/release-check.mjs` | `npm run release-check` | Recursos principales, 36/18/8 y gate DevSecOps |
| CI GitHub Actions | `.github/workflows/quality-security.yml` | Push/PR en GitHub | **NO VERIFICADO** hasta ejecutar en GitHub |

### Biome

En CI se instala de forma explícita `@biomejs/biome@2.2.7` y se ejecuta `biome ci` con configuración conservadora. La versión se fija, pero **todavía no hay `package-lock.json` de Biome** porque la red de npm no está disponible en este entorno. No se afirma instalación reproducible del binario de Biome ni éxito de su ejecución local. La app compilada y `npm run devsecops:offline` **no dependen de Biome ni de npm externo**.

La configuración intencionalmente desactiva el formatter y las reglas recomendadas globales: el proyecto tiene archivos heredados con líneas largas; activar un autoformateo masivo podría alterar cientos de líneas y dificultar la auditoría. La futura mejora es limpiar el formato sin romper pruebas, habilitar más reglas y generar lockfile en entorno con conectividad.

### Cabeceras y CSP

`index.html` contiene CSP meta restrictiva compatible con la app. `public/_headers` añade defensas HTTP solo cuando el hosting admite ese archivo. **Python `http.server` no envía automáticamente las cabeceras de `_headers`.** Una comprobación local de texto no demuestra protección HTTP en producción: valida con `curl -I` contra el dominio desplegado. En este proyecto no se cargan bibliotecas ni fuentes CDN en ejecución.

### Qué falta para un release productivo de alto aseguramiento

- Biome y workflow CI ejecutados en runners reales, con resultados publicados.
- `package-lock.json` para la dependencia opcional de desarrollo; SBOM y escáner SCA real con acceso al registro/CVE.
- Secret scanner con análisis de historial Git y reglas de entropía (Gitleaks o equivalente).
- SAST profundo adicional y revisión manual de flujos DOM; DAST/E2E, pruebas responsive y accesibilidad.
- Protección de ramas/owners, firma/procedencia de artefactos, verificación del servidor de despliegue y políticas de permisos reales.

## Puertas de release para este ZIP

Para comprobar **offline**:

```sh
npm run devsecops:offline
```

Para comprobar Biome **con red y después de instalar sus dependencias**:

```sh
npm install --ignore-scripts
npm run biome:check
```

No se confunde el resultado offline con una auditoría SCA o CI real.

## Senior Mode bonus: DevSecOps

Cada una de las 18 misiones incorpora un **gate adicional opcional**, con foco y dos controles prioritarios distintos por contexto. El alumnado escoge 2–4 de ocho controles y recibe una justificación de los faltantes, un test recomendado y un antipatrón. Marcar todos no da aprobación. Su resultado se guarda con el borrador y se exporta en JSON/Markdown.

Este gate **no modifica los 108 ejercicios centrales ni su puntuación de XP**, para preservar el progreso de v1.4. La aprobación mecánica del gate no garantiza que el CI esté implementado o sea seguro de verdad.


## Extensión auditada v1.6: STRIDE + SBOM + navegador

- `src/senior-threats.ts` define 18 casos específicos de Threat Modeling / STRIDE. La respuesta se almacena en `threatChoice`; un borrador anterior sin dicho campo se importa como `NOT_RUN`. La pregunta extra no se usa para acreditar XP por sí sola.
- `npm run sbom` genera `security/sbom.cdx.json` (CycloneDX 1.5) a partir de la metadata efectivamente disponible. El hash del archivo `tools/typescript/lib/tsc.js` se incluye como evidencia parcial del compilador. La dependencia Biome figura como **declarada no empaquetada**. No hay consulta a CVE, vulnerabilidades conocidas ni provenance firmada.
- `npm run devsecops:offline` incluye ahora la generación del SBOM y 54 pruebas unitarias.
- `npm run test:browser` ejecuta pruebas Chromium con JSON/localStorage de pruebas; **la navegación HTTP real permanece bloqueada por el entorno**, y el workflow con Playwright requiere validarse en GitHub. Consulta `docs/PRUEBAS_NAVEGADOR.md`.
- Biome continúa configurado, con versión fijada a `2.2.7`. Intentar acceder al registry de npm produjo `EAI_AGAIN`; el binario **NO se ejecutó**. El CI propuesto incluye instalación online, pero su resultado no debe presentarse como aprobado hasta que se ejecute.
