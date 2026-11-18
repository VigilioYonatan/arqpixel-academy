# AUDITORÍA DE ENTREGA — ARQPIXEL Academy v1.2 (Senior Suite)

**Dictamen:** ENTREGA FUNCIONAL PARCIAL, NO APROBADA COMO CUMPLIMIENTO INTEGRAL DEL MASTER_SPEC. Se corrigieron varias omisiones de v1.1 y se verificó el código/ZIP en el alcance disponible. No se sustituye la inspección E2E en navegador por tests de lógica.

## Inventario y conservación

- Fuente: `ARQPIXEL_Academy_AUDITADA_v1_1.zip`, extraído a una carpeta de trabajo. Todos los **27 nombres de entrada** del ZIP base se mantienen en el ZIP nuevo sin eliminación.
- Se conservan `docs/MASTER_SPEC.md`, los PNG originales, los scripts, los datos, los tests previos y la app compilada. La auditoría anterior se conserva íntegra en `docs/AUDIT_REPORT_v1_1.md`.
- Se añadieron `src/senior-suite.ts`, `data/deep-dives.json`, `data/lab-cases.json`, pruebas y scripts de auditoría; `src/app.ts`, `src/styles.css`, `README.md` y el build se actualizaron.
- No se incluyen `node_modules`, cachés ni un `package-lock.json` inexistente en el paquete base; la aplicación compilada no requiere instalación de terceros.

## Matriz de trazabilidad y comprobaciones

| ID | Requisito | Localización | Prueba / evidencia | Estado |
|---|---|---|---|---|
| R01 | Identidad azul/cian + ArquiBot | `src/styles.css`, `public/assets/*` | Presencia PNG, CSS y archivos copiados | VERIFICADO (estructura) |
| R02 | Inicio y navegación por rutas | `src/app.ts` | Compilación, referencias y respuesta HTTP; sin E2E | NO VERIFICABLE (navegación) |
| R03 | 36 lecciones base | `data/modules.json`, `src/app.ts` | `tests/catalog.test.mjs` | VERIFICADO (estructura) |
| R04 | 36 comparaciones y retos de transferencia | `data/deep-dives.json`, `src/app.ts` | `tests/deep-dives.test.mjs` + `release-check` | VERIFICADO (datos e integración estática) |
| R05 | Laboratorios: ocho rutas | `src/app.ts` | Build + revisión estática; sin E2E | NO VERIFICABLE (interacción) |
| R06 | 12 casos extra de patrones/API/incidentes | `data/lab-cases.json`, `src/app.ts` | `tests/lab-cases.test.mjs` | VERIFICADO (datos e integración estática) |
| R07 | 18 misiones identificables | `data/senior.json` | `tests/catalog.test.mjs` | VERIFICADO |
| R08 | 90 actividades Senior accesibles (5/misión) | `src/senior-suite.ts`, `src/app.ts` | `tests/senior-suite.test.mjs`; 18×5 comprobado | VERIFICADO (lógica), UI NO VERIFICABLE |
| R09 | Variantes reproducibles y cambios de referencia | `src/senior-suite.ts`, `src/engine.ts` | Semillas y casos alternativos probados | VERIFICADO (reglas educativas) |
| R10 | Cinco motores profesionales exhaustivos | `src/senior-suite.ts` | Cinco tipos interactivos implementados; fidelidad limitada | INCOMPLETO (profundidad) |
| R11 | Persistencia/backup de talleres | `src/senior-suite.ts`, `src/app.ts` | Sanitización probada; flujo E2E no ejecutado | NO VERIFICABLE (flujo UI) |
| R12 | Sanitización de importaciones | `src/engine.ts`, `src/senior-suite.ts` | `tests/engine.test.mjs`, `tests/senior-suite.test.mjs` | VERIFICADO (lógica) |
| R13 | Detección de ciclos de dependencias | `src/engine.ts` | `tests/engine.test.mjs` | VERIFICADO |
| R14 | Evaluación ADR con revisión humana | `src/engine.ts`, `src/senior-suite.ts` | Regla `REQUIRES_REVIEW` y tests | VERIFICADO (límite explícito) |
| R15 | Stack Preact + Vite del MASTER_SPEC | `package.json`, `src/` | Proyecto es TypeScript/DOM nativo | INCOMPLETO |
| R16 | E2E, WCAG, responsive real | UI / navegador | Chromium headless no produjo prueba útil | NO VERIFICABLE |
| R17 | Build/typecheck/pruebas existentes | `tsconfig.json`, `tests/`, `scripts/` | Comandos locales | VERIFICADO |
| R18 | ZIP autoejecutable con dist y fuentes | Paquete final | Integridad, extracción, tests y build de extraído | VERIFICADO |

**Controles profesionales pendientes:** revisión manual de ADR, simuladores de red/tiempo/disponibilidad con modelos más ricos, E2E, auditoría de accesibilidad, migración al stack original y despliegue externo. Estas carencias impiden marcar G1/G4/G7 como cumplimiento integral.

## Correcciones y extensiones

- La variante Senior ahora utiliza una política de evaluación contextual con capacidad ligada al volumen de tráfico expuesto en la pantalla; no hay incoherencia entre la cifra mostrada y la calculada.
- El diagnóstico de referencia cambia entre una estrategia incremental para restricciones moderadas y una estrategia orientada a resiliencia para escenarios de carga más alta.
- Se añadieron cinco actividades por misión, checks mecánicos con fallo/paso, ADR con revisión pendiente, pistas y exportación de evidencia JSON; las 90 actividades se derivan de 18 contextos con motores compartidos, no se presentan como validadores independientes de producción.
- Las lecciones ganaron comparación, fundamento, métrica verificable y desafío práctico específicos.
- Patrones, APIs e incidentes disponen de cuatro escenarios cada uno en vez de una sola pregunta.
- Los talleres guardan borradores por semilla; respaldos JSON incluyen sus borradores con sanitización durante importación.

## Control de riesgo y seguridad

Sin credenciales, tokens o backends. Los ejercicios son locales y educativos; no ejecutan código de los estudiantes, no despliegan infraestructura, no llaman a APIs cloud. Las entradas mostradas se escapan antes de insertarse en HTML. JSON de progreso puede contener texto personal de usuario y debe conservarse privadamente. El contenido formativo no reemplaza un auditor o arquitecto profesional.

## Evidencias reproducibles

Desde la raíz extraída:

```bash
npm run typecheck
npm run build
npm test
node scripts/release-check.mjs
python3 -m http.server 4173 --directory dist
```

Prueba con `curl -I http://localhost:4173/` y `curl -I http://localhost:4173/data/deep-dives.json`.

## Bloqueos y dictamen adversarial

- **P1:** no existe migración completa a Preact/Vite definida en el MASTER_SPEC.
- **P1:** los laboratorios no representan todas las validaciones semánticas y simulaciones profesionales del contrato maestro.
- **P1:** no se demuestra compatibilidad E2E/accessibilidad en navegadores reales.
- **P2:** se añaden actividades pedagógicas profundas, pero aún faltan editor de código por lenguaje, ejemplos ejecutables de C#/Java y proyectos back-end completos.
- **P2:** motores de capacidad e incidentes tienen supuestos simplificados, etiquetados en pantalla.

**Gates:** paquete, fuentes, pruebas de lógica y build: aceptables en el entorno disponible. Conformidad integral: NO APROBADA. El ZIP es una entrega funcional ampliada, no un producto terminado certificado.
