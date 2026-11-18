# ARQPIXEL — Manual del taller Senior v1.3

## Qué es el Senior Mode

Es un taller de decisiones arquitectónicas bajo restricciones. Cada misión muestra un brief, cargas, disponibilidad, equipo, presupuesto, incidente y objetivos. El estudiante escoge un diagnóstico, selecciona componentes, redacta un ADR, propone una primera respuesta al incidente y calcula la capacidad. Estos cinco trabajos están guiados por un playbook distinto para cada una de las 18 misiones.

**No equivale a una revisión de arquitectura profesional.** Las reglas automáticas verifican restricciones y estructuras de respuestas, no demuestran que una solución sería segura o rentable en producción.

## Uso paso a paso

1. Entra a `#/senior` y abre una misión.
2. Elige «Taller de 5 actividades»; la variante de ese caso se guarda con una semilla.
3. Lee los requisitos y el foco técnico. Ajusta las cinco respuestas y observa componentes recomendados.
4. Usa «Mostrar pista» progresivamente. Escribe ADR con una decisión, alternativas, riesgos, restricciones concretas y plan de verificación.
5. En S09 prueba idempotencia/outbox con distintas tasas de reintento. En S11 simula saturación variando réplicas, capacidad, buffer y duración.
6. Pulsa «Evaluar las 5 actividades». Revisa las reglas PASS/FAIL, sus motivos y lo que permanece como `REQUIRES_REVIEW`.
7. Exporta JSON y/o dossier Markdown; conserva el resultado para revisión por un docente o colega.

## Cinco rúbricas (límite pedagógico)

- **Diagnóstico:** la referencia se adapta a la demanda y SLO calculados.
- **Architecture Builder:** se verifican dos componentes fundamentales del playbook de la misión; no se juzgan automáticamente las demás decisiones.
- **ADR:** se verifica longitud, documentación de alternativas/riesgos, mención de restricciones y plan de validación; exige revisión humana de calidad.
- **Incidente:** se compara una primera respuesta segura con alternativas nocivas.
- **Capacidad:** se usa la demanda explícita (`600`, `8.000` o `65.000 req/min`) y un factor de holgura dependiente del SLO. **No es un benchmark.**

## Semillas y reproducibilidad

La misma misión+semilla reproduce los mismos parámetros. Cambiar una semilla cambia el escenario y sus opciones. Guarda/exporta evidencias antes de reemplazar un borrador. La app recupera el avance por misión y semilla desde `localStorage`.

## Qué queda para una release de alcance integral

- Validadores de invariantes propios para todos los casos (hoy solo S09/S11 tienen bancos de prueba adicionales).
- Modelado y ejecución de proyectos backend reales, diagramas exportables avanzados y validación semántica más rica.
- Revisión humana guiada, pruebas visuales E2E y accesibilidad completas.
- Migración de la interfaz a Preact/Vite si se mantiene esa decisión del documento maestro.
