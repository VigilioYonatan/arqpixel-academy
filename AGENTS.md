# Reglas de Agente — ARQPIXEL Academy (Alineación Vigilio 2026)

## 1. Jerarquía de Autoridad y Fuentes de Verdad

La autoridad en este repositorio se separa por responsabilidad para impedir deriva documental, pérdida de archivos o afirmaciones falsas de completitud:

1. **Evidencia ejecutable del consumidor:** El código fuente en `src/`, los bundles compilados en `dist/`, los catálogos en `data/`, los scripts de control en `scripts/` y las suites en `tests/` demuestran lo que realmente está implementado y verificado.
2. **Contrato de producto y decisiones locales:** [`TODO_LO_QUE_DEBE_TENER_ESTA_APP.md`](TODO_LO_QUE_DEBE_TENER_ESTA_APP.md) y los registros en [`docs/adr/`](docs/adr/README.md) definen los requisitos curriculares, pedagógicos, de UX/accesibilidad y las decisiones arquitectónicas aprobadas de ARQPIXEL Academy.
3. **Normativa transversal Vigilio:** `C:\Users\Admin\Desktop\VIGILIO\arquitectura-rimac-actualizado\vigilio-docs` gobierna estándares de ingeniería, ownership de símbolos, pruebas por riesgo/BDD, accesibilidad WCAG 2.2 AA y seguridad/DevSecOps.
4. **Skills operativas Vigilio:** `C:\Users\Admin\Desktop\VIGILIO\arquitectura-rimac-actualizado\platform-actions\skills` actúa como adaptador procedimental (`discover → select → load → verify-read → execute`). Nombrar una skill sin abrir su `SKILL.md` y sus referencias aplicables constituye incumplimiento.

Si una afirmación documental contradice una prueba ejecutable, prevalece la evidencia real: se corrige la brecha o se documenta honestamente como `NOT_RUN` / `BLOCKED` / `PARCIAL`. Prohibido declarar un control externo como `PASS` solo porque exista un archivo `.md`, `.json` o `.yml`.

---

## 2. Regla Innegociable de Conservación (Cero Pérdida)

- **Preservación de archivos base:** Prohibido eliminar recursos históricos en `docs/`, assets en `public/assets/`, el compilador local en `tools/typescript/`, `TODO_LO_QUE_DEBE_TENER_ESTA_APP.md` o suites de prueba preexistentes.
- **Compatibilidad de progreso:** Las claves `arqpixel-progress-v1`, `arqpixel-minigames-v1` y los borradores Senior por `(mission_id, seed)` son contratos persistidos del usuario. Toda evolución debe mantener compatibilidad regresiva y recalcular XP de forma idempotente sin inflar puntajes.
- **Rutas compatibles:** Conservar las rutas hash publicadas (`#/inicio`, `#/mapa`, `#/rutas`, `#/especializaciones`, `#/modulo/:id`, `#/laboratorios`, `#/laboratorio/:id`, `#/minijuegos`, `#/minijuego/:id`, `#/senior`, `#/mision/:id`, `#/taller-senior/:id`, `#/recursos`, `#/perfil`) al introducir vistas o alias nuevos.

---

## 3. Ciclo Operativo Auto-Senior Obligatorio

Todo cambio de código o contenido sigue estrictamente las fases:

`DISCOVER → ANALYZE → CLARIFY (solo bloqueos reales) → PLAN → BUILD → VERIFY → REVIEW (solo lectura) → REPORT`

1. **Inspección previa:** Leer código vecino, contratos de `scripts/release-check.mjs`, `tests/*.test.mjs` y ADRs antes de editar.
2. **Ownership de símbolos (`symbol-ownership-architecture`):**
   - Extraer constantes operativas, límites, claves de almacenamiento y recompensas XP a `{feature}/constants/*.constants.ts` en `UPPER_SNAKE_CASE`.
   - Mantener variables temporales locales dentro de su función en `snake_case` (código nuevo) y funciones/métodos con verbos semánticos en `camelCase`.
   - Definir validadores de borde y tipos inferidos juntos en `{feature}/schemas/*.schema.ts` (`export type ModuleSchema = InferSchema<typeof moduleSchema>`).
   - **Prohibido** crear carpetas globales `contracts/` o `packages/contracts/` y **prohibido** introducir `any` o casts inseguros para ocultar errores de tipos.
   - No crear carpetas vacías (`shared/`, `libs/`, `interfaces/`) sin al menos un consumidor real verificado.
3. **Honestidad pedagógica y técnica (`ADR-0003`):**
   - Los motores automáticos evalúan estructura, invariantes deterministas, grafos y cálculos reproducibles (`PASS` / `FAIL` / `NOT_RUN` / `BLOCKED`).
   - El razonamiento arquitectónico abierto (ADRs, reflexiones Senior, capstones) **siempre** conserva el marcador `REQUIRES_REVIEW` y nunca promete certificación profesional automática.
4. **Fase `REVIEW` independiente:** Al terminar `VERIFY`, auditar el diff en modo estricto de **solo lectura** aplicando `review-code-change` y `ui-quality-review`. Si surgen hallazgos `BLOQUEANTE`, `ALTA` o `MEDIA`, abrir fase `FIX` separada y repetir `REVIEW`.

---

## 4. Gates de Verificación Local

Ejecutar siempre antes de cerrar cualquier tarea:

```bash
npm run typecheck
npm run build
npm test
npm run security:scan
npm run security:headers
npm run security:licenses
npm run release-check
npm run devsecops:offline
```

Controles condicionales (declarar `NOT_RUN` / `BLOCKED` si el binario no está instalado en el entorno actual; jamás inventar `PASS`):

```bash
npm run biome:check
npm run test:browser
```

---

## 5. Índice de Gobernanza Relacionado

- Especificación integral del producto: [`TODO_LO_QUE_DEBE_TENER_ESTA_APP.md`](TODO_LO_QUE_DEBE_TENER_ESTA_APP.md)
- Decisiones de arquitectura (ADR): [`docs/adr/README.md`](docs/adr/README.md)
- Hoja de ruta al 100 % con trazabilidad de skills: [`PENDIENTES_100_POR_CIENTO_ARQPIXEL.md`](PENDIENTES_100_POR_CIENTO_ARQPIXEL.md)
- Política de seguridad y límites: [`SECURITY.md`](SECURITY.md)
- Auditoría de entrega: [`AUDIT_REPORT.md`](AUDIT_REPORT.md)
