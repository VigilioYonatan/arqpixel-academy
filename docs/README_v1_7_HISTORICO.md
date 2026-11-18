# ARQPIXEL Academy 1.7 — Arquitectura de Software y Senior Mode

**Academia web interactiva en español**, basada en la experiencia educativa de GoPixel pero personalizada para Arquitectura de Software: identidad Modern Pixel azul/cian, mascota oficial **ArquiBot** (robot blanco y azul), 36 lecciones, ocho especializaciones, ocho laboratorios, cinco minijuegos y 18 misiones Senior.

> **Documento rector incluido en la raíz:** [`TODO_LO_QUE_DEBE_TENER_ESTA_APP.md`](TODO_LO_QUE_DEBE_TENER_ESTA_APP.md). Contiene una especificación de 2.800 líneas, el currículo por tema, el detalle de Senior Mode, pantallas, arquitectura de la app, seguridad, pruebas, requisitos y pendientes, además del master spec original completo. Léelo antes de modificar una función o anunciar una release como «completa». Reglas operativas de ingeniería y ADRs en [`AGENTS.md`](AGENTS.md) y [`docs/adr/README.md`](docs/adr/README.md).

## Qué hay en la v1.7

| Función | Implementación disponible |
|---|---|
| 36 lecciones | 12 básicas B01–B12, 12 intermedias I01–I12 y 12 avanzadas A01–A12, con teoría, ejemplo, comparación, métrica, práctica de transferencia y pregunta con explicación |
| 8 especializaciones | SOLID/GoF, Clean/Hexagonal, DDD, APIs, System Design, Microservicios, Cloud/SRE, Senior |
| 8 laboratorios | Dependencias, C4, DDD, patrones, API, sistemas distribuidos, ADR e incidentes; **simuladores educativos** |
| C4 Studio nuevo | Crear/editar contenedores y relaciones; validar duplicados/nodos; exportar **JSON, Mermaid, SVG y PNG** |
| 5 minijuegos nuevos | Arquitectura Tetris, Caza del Acoplamiento, Patrón Correcto, Dominio Dividido, Incidente en 60 pasos; 6 decisiones cada uno |
| Senior Mode | 18 misiones × 6 actividades centrales = **108 actividades didácticas**; diagnóstico, builder/grafo, ADR, incidentes, capacidad y code/contract review |
| Bonus Senior | 18 DevSecOps Gates + 18 Threat Modeling / STRIDE + simulador de impacto; no sustituyen las 108 actividades |
| Senior contextual nuevo | Retos y revisión estructural de reflexión para las 24 lecciones intermedias/avanzadas; las 12 básicas no aplican |
| Progreso | XP idempotente, notas, insignias, mejor puntuación de minijuegos, respaldo/restauración JSON, exportación de dossier Senior JSON/MD |
| Calidad y seguridad | TypeScript local, pruebas automatizadas (incluidos controles del documento rector), scripts DevSecOps offline, SBOM, scanner heurístico, CSP declarativa y tests Chromium disponibles |

**Importante:** Los evaluadores verifican reglas didácticas y estructura; no acreditan la calidad profesional de un diseño abierto. Los simuladores no despliegan sistemas ni miden infraestructura real.

## Ejecutar la aplicación sin instalar paquetes

El ZIP contiene `dist/` listo para servir. Requiere **Python 3**, o cualquier servidor estático que preserve rutas relativas y content types:

```sh
cd arqpixel-academy
python3 -m http.server 4173 --directory dist
```

Abrir `http://localhost:4173` en el navegador. No abrir con `file://` porque los catálogos usan `fetch`. En Windows también puedes ejecutar `iniciar-windows.bat`; en Linux/macOS, `./iniciar-linux-macos.sh`.

Enlaces útiles: `/#/inicio`, `/#/rutas`, `/#/especializaciones`, `/#/laboratorios`, `/#/minijuegos`, `/#/senior`, `/#/taller-senior/S09`, `/#/taller-senior/S11`, `/#/perfil`.

## Desarrollar, comprobar y compilar

Requiere **Node.js 20+**; el compilador TypeScript está incluido en `tools/typescript/` para recompilación offline, con licencias y avisos de terceros. El proyecto no descarga paquetes al ejecutar:

```sh
npm run typecheck
npm run build
npm test
npm run release-check
npm run devsecops:offline
```

Si existe Python Playwright + Chromium en tu equipo:

```sh
npm run test:browser
```

El test de navegador utiliza **módulos compilados reales con fixtures de transporte local** porque la navegación HTTP estaba restringida en el entorno de validación; **no** certifica desplegar con HTTPS, headers reales ni auditoría WCAG de lector de pantalla. Para Biome:

```sh
# Requiere instalar la versión de Biome indicada en package.json
npm run biome:check
```

La presencia de `biome.json` y del workflow de CI **no demuestra** que Biome o GitHub Actions se hayan ejecutado en este entorno. Consulta [`AUDIT_REPORT.md`](AUDIT_REPORT.md) y [`SECURITY.md`](SECURITY.md).

## Estructura principal

```text
arqpixel-academy/
├── TODO_LO_QUE_DEBE_TENER_ESTA_APP.md    # especificación exhaustiva
├── src/                                  # UI y motores TypeScript
├── data/                                 # 36 lecciones, 18 casos, 5 juegos, rutas y casos
├── public/assets/                        # ArquiBot azul, panel y hero
├── tests/                                # tests unitarios y Chromium
├── scripts/                              # build, SBOM, controles DevSecOps
├── tools/typescript/                     # compilador vendorizado con licencia
├── dist/                                 # sitio ya compilado
├── docs/                                 # Master Spec e informes históricos
├── security/                             # SBOM CycloneDX
├── .github/workflows/                   # workflow de CI declarado
├── AUDIT_REPORT.md                       # evidencia de esta release
└── MANIFEST.md                           # inventario y preservación
```

## Estado real y pendientes

La v1.7 amplía funcionalidades reales y cuenta con pruebas técnicas. **No cumple todo el Master Spec original**: usa TypeScript/DOM nativo en lugar de Preact/Vite; faltan mayor profundidad en validación semántica C4/DDD, proyectos ejecutables, auditoría WCAG completa y pruebas de hosting real, ejecución local de Biome/CI y análisis de CVEs externo. Todos figuran en el documento rector y en la auditoría.

La aplicación trabaja con datos locales del navegador. Exportaciones JSON, Markdown y diagramas pueden contener texto ingresado por el estudiante; **revísalas antes de compartirlas**. Usa la función de respaldo del Perfil antes de borrar datos del sitio.

**Licencias de herramientas:** consulta `tools/typescript/LICENSE.txt`, `tools/typescript/ThirdPartyNoticeText.txt` y `SECURITY.md`. No añadir credenciales ni claves al ZIP.
