# ARQPIXEL Academy v1.7+ (Alineación Vigilio 2026) — Arquitectura de Software y Senior Mode 2.0

**Academia web interactiva en español** dedicada a Arquitectura de Software: identidad Modern Pixel azul/cian, mascota oficial **ArquiBot** (16 poses PNG RGBA transparentes), 36 lecciones enriquecidas con diagramas y código ✅/❌, mapa curricular de 54 nodos, ocho especializaciones con vistas paso a paso, once proyectos Capstone, ocho laboratorios profundos, cinco minijuegos, **Senior Mode 2.0** con incidentes encadenados y Dossier v2 auditable, y laboratorio backend ejecutable de referencia (`examples/nexoshop-reference-nestjs/`).

> **Documento rector incluido en la raíz:** [`TODO_LO_QUE_DEBE_TENER_ESTA_APP.md`](TODO_LO_QUE_DEBE_TENER_ESTA_APP.md) (2.800 líneas). Reglas operativas, ADRs y matrices de calidad en [`AGENTS.md`](AGENTS.md), [`docs/adr/README.md`](docs/adr/README.md), [`docs/E2E_56_CONTROLS_AND_WCAG_MATRIX.md`](docs/E2E_56_CONTROLS_AND_WCAG_MATRIX.md) y [`PENDIENTES_100_POR_CIENTO_ARQPIXEL.md`](PENDIENTES_100_POR_CIENTO_ARQPIXEL.md). El README anterior se conserva íntegro en [`docs/README_v1_7_HISTORICO.md`](docs/README_v1_7_HISTORICO.md).

## Qué incluye esta entrega

| Área | Implementación verificada |
|---|---|
| **36 lecciones (`B01–A12`)** | Teoría, analogía, diagrama arquitectónico SVG accesible + Mermaid seguro, comparativa TypeScript **✅ Diseño defendible vs ❌ Anti-patrón**, contraejemplo, `HintDrawer` progresivo, `SolutionReveal` y enlace directo a laboratorio |
| **Mapa y 8 especializaciones** | Grafo DAG accesible de 54 nodos (`#/mapa`) + 8 rutas individuales (`#/rutas/R01..R08`) con prerrequisitos y progreso compartido idempotente |
| **11 proyectos integradores y Capstones** | Workspace interactivo (`#/proyectos` y `#/proyectos/:id`) con exportación Markdown/JSON + repositorio ejecutable offline `examples/nexoshop-reference-nestjs/` |
| **8 laboratorios profundos** | **C4 Studio** (`C1/C2/C3`, análisis semántico y round-trip JSON/Mermaid/SVG/PNG), **DDD Workshop** (polisemia, Context Map y Agregados), **Dependencias** (`Ca/Ce/I`), **Patterns** (YAGNI), **API Contract Lab** (diff OpenAPI `v1 vs v2`), **Distributed Lab** (Outbox/Idempotencia/DLQ/Saga), **ADR Studio** y **SLO Burn Rate & Resiliencia** |
| **5 minijuegos (`30` decisiones)** | `tetris`, `acoplamiento`, `patrones`, `dominio`, `incidente` con estrellas independientes del XP Senior |
| **Senior Mode 2.0 (`S01–S18`)** | 108 actividades centrales + telemetría cruzada FinOps/Capacidad con banda de incertidumbre + crisis encadenada en **Fase 2** + gates STRIDE/DevSecOps + **Dossier Senior v2** con dictamen humano importable/adjuntable (`REQUIRES_REVIEW` siempre separado del score mecánico) |
| **Persistencia y migraciones** | Motor fail-closed compatible con backups `v1.2`, `v1.3`, `v1.5`, `v1.6`, `v1.7` y `v2.0` (`tests/backup-migrations.test.mjs`) |
| **Seguridad, QA y Accesibilidad** | CSP estricta `style-src 'self'` (cero `'unsafe-inline'`), `Biome 2.6.3`, `121` tests Node/BDD + `4` tests repo referencia + `9` suites Playwright `1.64.1` sobre HTTP real con `@axe-core/playwright` (`dark`/`light`/`high-contrast`) y 5 viewports (`320–1440 px`) |

**Importante (`ADR-0003`):** Los evaluadores automáticos validan estructura, grafos e invariantes deterministas; el razonamiento arquitectónico abierto conserva siempre `REQUIRES_REVIEW` y no constituye certificación profesional automática.

## Ejecutar la aplicación sin instalar paquetes (100 % offline)

El proyecto incluye `dist/` compilado y un servidor Node sin dependencias que aplica las cabeceras de seguridad reales de `dist/_headers`:

```bash
node scripts/serve-dist-with-headers.mjs --port 4173
# Alternativa estática básica: python -m http.server 4173 --directory dist
```

Abre `http://127.0.0.1:4173` en tu navegador (`#/inicio`, `#/mapa`, `#/rutas/R06`, `#/aprender/A05?senior=1`, `#/proyectos`, `#/laboratorio/c4`, `#/laboratorio/ddd`, `#/taller-senior/S09`, `#/recursos/patrones/strategy`, `#/logros`, `#/ajustes`, `#/sobre`).

## Comandos de verificación

```bash
# Gates 100 % offline (solo requiere Node.js 20+, usa tools/typescript vendorizado)
npm run typecheck
npm run build
npm test
npm run devsecops:offline
npm --prefix examples/nexoshop-reference-nestjs test

# Gates con devDependencies fijadas en pnpm-lock.yaml (Biome 2.6.3 + Playwright 1.64.1 + axe-core)
pnpm install --frozen-lockfile
pnpm run biome:check
pnpm run test:e2e
```

Consulta [`AUDIT_REPORT.md`](AUDIT_REPORT.md), [`SECURITY.md`](SECURITY.md) y [`security/operational-evidence.json`](security/operational-evidence.json) para el detalle exacto de controles `PASS` locales frente a controles externos `NOT_RUN`.
