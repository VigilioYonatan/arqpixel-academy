# ARQPIXEL — Guía Senior Mode v1.4

## Objetivo

18 misiones de arquitectura con **seis actividades cada una (108 en total)**, además de un laboratorio de impacto sintético por misión (18); S09 y S11 conservan sus experimentos numéricos adicionales. El escenario se genera a partir de `id + seed` y reproduce las mismas restricciones, opciones y rúbrica. Los casos son educativos y **no prueban despliegues, códigos ni contratos reales**.

## Cómo se trabaja

1. Abre `/#/senior`, selecciona S01–S18 y entra en **Taller de 6 actividades**. El taller conserva la variante elegida.
2. **Diagnóstico:** elige una estrategia bajo restricciones de tráfico, SLO, equipo, presupuesto y fallo observado.
3. **Architecture Builder:** elige **2–4** componentes con prioridades y crea conexiones de origen → destino. El control comprueba cobertura de componentes, conectividad y ausencia de ciclos; **no certifica** la semántica del diseño.
4. **Decision/ADR:** redacta decisión, alternativas, riesgos, dos restricciones del escenario y cómo verificarías. El resultado puede ser `REQUIRES_REVIEW` incluso con estructura correcta.
5. **Incident Response:** selecciona una acción de contención y mitigación segura, evitando ampliar el incidente.
6. **Capacity/Reliability:** dimensiona un valor sintético con holgura del **15 %** o **30 %**, según SLO. No constituye prueba de carga.
7. **Contract/Code Review:** lee un snippet defectuoso específico de la misión, identifica la corrección prioritaria y revisa la justificación y prueba de referencia.
8. **Laboratorio de impacto:** prueba distintas estrategias de mitigación. Muestra antes/después, supuestos y trade-offs **sintéticos**, con parámetros deterministas por seed; es **adicional** a los seis ejercicios evaluados.
9. **S09:** además, ejecuta el simulador de idempotencia/outbox; **S11:** ejecuta saturación de réplicas/cola bajo un modelo lineal.
10. Evalúa; corrige estados `FAIL` y `NOT_RUN`; revisa criterios `REQUIRES_REVIEW` con un tutor si necesitas calificación profesional.
11. Exporta respaldo JSON, dossier Markdown y/o evidencias de la misión. Los borradores sobreviven recargas y migran desde v1.3.

## Interpretación de estados

- `NOT_RUN`: falta respuesta o ejercicio.
- `FAIL`: no satisface el criterio didáctico explicitado.
- `PASS`: cumple el criterio mecánico del simulador.
- `REQUIRES_REVIEW`: se verificó estructura ADR, **no** pertinencia arquitectónica.

La puntuación es un **indicador educativo 0–100**, proporcional a seis checks de 20 puntos. Una misión se registra en el perfil y se recompensa con **80 XP solo cuando pasan los cinco checks mecánicos y el ADR cumple los requisitos estructurales**. No significa que el ADR haya superado una revisión humana. Los puntos previos de v1.3 se conservan al migrar.

## Seguridad y límites

Los snippets no se ejecutan y no se conecta a proveedores cloud ni servicios externos. La app opera localmente en el navegador. El grafo verifica conectividad y ciclos, pero no sustituye un análisis C4, DDD ni threat modeling profesional. Los experimentos son hipotéticos, no predicciones de incidentes, costos, disponibilidad o rendimiento.

La exportación puede contener texto escrito por el estudiante: revísala antes de compartir. Para reproducir: mismo ID de misión, misma seed y misma versión del evaluador.


## Bonus v1.6 — Threat Modeling / STRIDE

Después de los seis checks principales, el taller presenta una amenaza específica de la misión: activo a proteger, límite de confianza, abuso, categoría STRIDE, tres mitigaciones alternativas y evidencia recomendada. El alumno elige una acción y recibe evaluación `PASS`, `FAIL` o `NOT_RUN` con explicación. Es una práctica ilustrativa y no un pentest real.

La opción del alumno se guarda en `threatChoice` junto al borrador versionado existente; también se exporta en el JSON de evidencias y el dossier Markdown. Los borradores de versiones anteriores siguen restaurándose sin este campo (`-1`). El bonus no otorga XP adicional ni modifica las 108 actividades Senior originales.
