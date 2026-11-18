# AUDITORÍA TOTAL — ARQPIXEL Academy

**Decisión:** NO APROBADO — REQUIERE CORRECCIÓN para afirmar cumplimiento integral de `docs/MASTER_SPEC.md`.  La distribución es una **versión parcial ejecutable**; algunos controles locales pasan, pero no equivalen a una prueba integral del producto.

## Alcance y método

Se inspeccionaron el código fuente, el catálogo JSON, configuración, comandos, README, especificación, recursos PNG por metadatos y estructura ZIP. Se ejecutaron compilación TypeScript, tests de Node, HTTP local, integridad y extracción de ZIP. **No se certifica una sesión E2E en navegador**: la automatización Chromium disponible no completó su ejecución.

## Matriz de requisitos (G1)

| ID | Requisito obligatorio | Prioridad | Implementación / evidencia | Estado |
| --- | --- | --- | --- | --- |
| R01 | Identidad azul/cian, ArquiBot | Alta | `src/styles.css`, `public/assets/*`; archivos y paleta inspeccionados | VERIFICADO (estático) |
| R02 | Landing responsive y CTA | Alta | `src/app.ts`, CSS, página HTML; sin E2E visual | NO VERIFICABLE (navegador) |
| R03 | Navegación rutas/lecciones | Alta | `src/app.ts` rutas hash | NO VERIFICABLE (E2E) |
| R04 | 36 lecciones con opción evaluable | Alta | `data/modules.json`; `tests/catalog.test.mjs` | VERIFICADO (estructura) |
| R05 | Contenido integral de cada módulo (concepto, visual, comparación, práctica, transferencia) | Alta | Solo concepto, ejemplo, pregunta y notas en `src/app.ts` | INCOMPLETO |
| R06 | 18 casos Senior identificables | Alta | `data/senior.json`, `src/app.ts`; tests | VERIFICADO (estructura) |
| R07 | Senior Mode con variables reproducibles | Alta | `src/engine.ts`; tests con semillas | VERIFICADO (mecánica) |
| R08 | Decisiones Senior que cambien de forma sustancial con cada variante | Alta | Se alterna presentación y referencias del caso, no estrategia de fondo | INCOMPLETO |
| R09 | Cinco motores Senior y >=90 actividades | Alta | Un motor básico de decisión/ADR, actividades adicionales no implementadas | INCOMPLETO |
| R10 | Diferenciar PASS/FAIL/REQUIRES_REVIEW | Alta | `src/engine.ts`, tests | VERIFICADO (lógica) |
| R11 | Dependency Graph y detección de ciclos | Alta | `src/engine.ts`, `src/app.ts`, tests | VERIFICADO (lógica) |
| R12 | C4 Studio con edición y exportación | Alta | `src/app.ts`; editor simplificado, sin E2E | NO VERIFICABLE (interacción) |
| R13 | DDD Workshop | Media | `src/app.ts`; clasificación limitada a cinco conceptos | INCOMPLETO (alcance maestro) |
| R14 | Patrones, API e incidentes | Alta | `src/app.ts`; una pregunta por laboratorio | INCOMPLETO (profundidad) |
| R15 | Simulador de distribuidos | Media | `src/app.ts`; modelo determinista de duplicados | VERIFICADO (existencia, no fidelidad real) |
| R16 | ADR editor y descarga | Alta | `src/app.ts`; sin E2E | NO VERIFICABLE (descarga UI) |
| R17 | Persistencia local, XP, backup y restauración | Alta | `src/app.ts`, `src/engine.ts`; validación y XP probados | NO VERIFICABLE (flujo E2E) |
| R18 | Rechazar importación corrupta y manipulación simple de XP | Alta | `src/engine.ts`, `tests/engine.test.mjs` | VERIFICADO (lógica) |
| R19 | Stack prescrito Preact + Vite | Alta | Implementado con TS/DOM nativo y `tsc` | INCOMPLETO |
| R20 | Lint, typecheck, build y pruebas UI/E2E | Alta | `tsc`, Node tests pasan; lint y E2E no instalados | INCOMPLETO |
| R21 | ZIP íntegro, extraíble, con build y fuentes | Bloqueante | Verificación posterior a ZIP | VERIFICADO (paquete) |
| R22 | Accesibilidad WCAG y responsive en dispositivos | Alta | Reglas CSS, algunos ARIA; sin auditoría visual/teclado | NO VERIFICABLE |
| R23 | Ruta `/mapa` de aceptación | Media | Alias `mapa` -> `tracks` en `src/app.ts` | VERIFICADO (estático) |
| R24 | Imagen PNG de ArquiBot y assets sin faltantes | Alta | `public/assets`, `dist/assets` | VERIFICADO (integridad) |

**Cobertura:** 24 requisitos registrados; 11 verificados en su alcance limitado, 7 incompletos y 6 no verificables. *La matriz no sustituye pruebas de UX y no avala cumplimiento integral.*

## Fallos detectados y corregidos

- Importación aceptaba datos con XP arbitrario, identificadores desconocidos y estructuras internas sin validación suficiente. Implementado sanitizador de tipos, IDs, fechas, límites de tamaño y XP derivado; añadidos casos positivos/negativos.
- Laboratorio de dependencias no detectaba ciclos. Añadida búsqueda DFS y comprobación de relaciones inválidas.
- Todas las estrategias Senior se calificaban asumiendo la respuesta en índice cero. Añadido reordenamiento determinista y validación contra índice correcto por variante.
- ADR Senior puntuaba por palabras sin citar condiciones del escenario. Añadido criterio explícito de dos restricciones del caso, conservando etiqueta `REQUIRES_REVIEW` para la calidad profesional.
- Cambiar de variante podía descartar el ADR sin aviso; añadido diálogo de confirmación de borrador.
- Tras abandonar una misión podía conservarse la semilla de otra; ahora la semilla activa se restaura por misión.
- Ajustados mensajes de lección ya completada y etiqueta de catálogo `36 lecciones + 18 retos`.

## Defectos P0/P1 conocidos pendientes

- **P1:** implementación no corresponde a Preact/Vite prescrito.
- **P1:** los 36 módulos no contienen el paquete profundo de actividades y explicaciones visuales exigido.
- **P1:** 18 misiones no equivalen a las 90 actividades avanzadas del plan; falta simulación de consecuencias por restricciones y cinco motores completos.
- **P1:** laboratorios de patrones, API, incidentes y DDD no tienen la profundidad funcional de la especificación.
- **P1:** falta validación E2E de UI, responsive, teclado y accesibilidad; por tanto no puede verificarse un release completo.

## Restricciones

La ejecución en un navegador gráfico no se pudo completar mediante Chromium headless en este entorno; las comprobaciones HTTP y de JavaScript puro no reemplazan interacción real. No se probaron navegadores de usuario ni despliegue remoto. No se ejecutan clouds, ni servicios externos, ni código de estudiantes: los laboratorios son educativos y locales.

## Reproducción

```bash
npm run typecheck
npm run build
npm test
python3 -m http.server 4173 --directory dist
```

Consultar el README y el manifiesto para uso e inventario.
