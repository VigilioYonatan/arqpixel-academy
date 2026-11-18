# ADR 0003 - Frontera entre verificación determinista y revisión humana (`REQUIRES_REVIEW`)

## Estado

Aprobado

## Contexto

Una academia de Arquitectura de Software corre el riesgo ético y técnico de engañar al estudiante si presenta verificaciones heurísticas de texto como si fueran juicios expertos sobre diseño de sistemas reales, o si promete «certificación de Arquitecto Senior» tras rellenar un formulario.

Simultáneamente, el alumno necesita retroalimentación inmediata, reproducible y exigente cuando omite restricciones cuantitativas del escenario (`req/min`, `SLO`, presupuesto, equipo), introduce ciclos en un grafo de dependencias, sobredimensiona o satura capacidad, o selecciona todos los controles por fuerza bruta.

## Decision

Establecer una separación contractual estricta en todos los motores de evaluación (`engine.ts`, `lesson-senior.ts`, `senior-suite.ts`, `senior-devsecops.ts`, `senior-threats.ts`, `c4-studio.ts`, `mini-games.ts`):

1. **Estados estandarizados obligatorios:**
   - `PASS`: Regla mecánica o invariante determinista medida y cumplida (grafo conexo sin ciclos, cálculo de capacidad dentro de margen seguro, estrategia congruente con la semilla, controles prioritarios exactos).
   - `FAIL`: Regla mecánica incumplida, acompañada de explicación accionable sobre qué falta o qué riesgo introduce.
   - `NOT_RUN`: Actividad o control aún no ejecutado (jamás equivalente a `PASS`).
   - `BLOCKED`: Control que depende de una herramienta o entorno externo no disponible en la sesión actual.
   - `REQUIRES_REVIEW`: Criterio abierto de calidad arquitectónica (coherencia semántica de un ADR, validez de trade-offs propuestos, adecuación al negocio de un proyecto capstone) que **siempre** exige revisión por una persona experta.
2. **Reglas anti-trampa obligatorias:**
   - Reordenar determinísticamente las opciones según `(mission_id, seed)` para evitar que la opción `A` sea siempre la correcta.
   - Rechazar la selección masiva de todos los componentes en *Architecture Builder* o todos los controles en *DevSecOps Gate*.
   - Exigir mención verificable de las restricciones activas de la semilla antes de superar el umbral estructural de un ADR, manteniendo aun así la marca `REQUIRES_REVIEW` en el resultado y en los dossiers exportados.
   - Otorgar `XP` de forma estrictamente idempotente (una sola vez por módulo o misión superada estructuralmente).

## Consecuencias

- **Beneficios:** Transparencia pedagógica total, ausencia de falsos positivos por longitud vacía y alineación con las reglas de evidencia honesta de `platform-validation-evidence` y `complete-work-no-shortcuts`.
- **Costos:** Los dossiers exportados (`.json` y `.md`) deben preservar siempre la sección de criterios pendientes de revisión humana para que un mentor o comité pueda auditarlos fuera o dentro de la plataforma.

## Alternativas consideradas

- **Opción A (Elegida):** Separación explícita entre checks deterministas (`PASS`/`FAIL`/`NOT_RUN`/`BLOCKED`) y juicio experto (`REQUIRES_REVIEW`).
- **Opción B:** Calificar ADRs como `100 % Aprobado / Arquitecto Certificado` solo por conteo de palabras clave. Rechazada por deshonesta y antipedagógica.
- **Opción C:** Eliminar toda evaluación en texto libre y dejar únicamente preguntas cerradas. Rechazada porque impide entrenar la redacción de ADRs, supuestos, riesgos y planes de verificación.

## Fecha

2026-11-16

## Owners

- Equipo: Diseño Pedagógico y Comité Senior ARQPIXEL
- Responsable: Comité Técnico ARQPIXEL / Gobernanza Vigilio
