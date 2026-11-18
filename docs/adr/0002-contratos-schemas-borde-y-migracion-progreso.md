# ADR 0002 - Validación estricta de esquemas en borde y compatibilidad regresiva de progreso

## Estado

Aprobado

## Contexto

ARQPIXEL Academy consume seis catálogos JSON en el arranque (`modules.json`, `deep-dives.json`, `senior.json`, `paths.json`, `lab-cases.json`, `mini-games.json`) y procesa archivos JSON no confiables importados por el estudiante desde su navegador (respaldos de progreso, borradores de talleres Senior, puntuaciones de minijuegos y modelos C4).

En TypeScript, una aserción `await response.json() as Module[]` o `JSON.parse(raw) as Backup` **no valida nada en tiempo de ejecución**. Un archivo truncado, manipulado o con claves como `__proto__`, `constructor` o `prototype` puede provocar fallos silenciosos, corrupción de `localStorage` o inflación artificial de experiencia (`XP`).

## Decision

1. **Validación estructural en cada frontera de entrada:** Implementar un validador de esquemas tipado, determinista y libre de dependencias externas en `src/features/shared/schemas/schema-validator.ts` con inferencia estática `InferSchema<T>` (siguiendo el principio de `vigilio-docs/standards/engineering/naming-and-boundaries.md`: el archivo `*.schema.ts` posee tanto el validador runtime como el tipo exportado `*Schema`).
2. **Propiedad por dominio (cero carpeta `contracts/` global):**
   - `src/features/curriculum/schemas/curriculum.schema.ts` valida catálogos educativos (`moduleSchema`, `deepDiveSchema`, `learningPathSchema`, `labCasesCatalogSchema`).
   - `src/features/senior/schemas/senior.schema.ts` valida misiones (`missionSchema`), envoltorios de respaldo (`backupEnvelopeSchema`) e importaciones C4 (`c4ModelImportSchema`).
3. **Anti-contaminación de prototipos y límites:** Rechazar cualquier objeto JSON no plano o que contenga claves propias peligrosas (`__proto__`, `prototype`, `constructor`), limitar tamaños máximos de archivo (`2 MB`) y longitudes de texto, descartar identificadores inexistentes y **recalcular siempre los puntos `XP`** a partir de lecciones realmente completadas (`+50 XP`) y misiones Senior con evidencia premiada (`+80 XP`, máximo una vez por misión).
4. **Compatibilidad regresiva:** Conservar la migración limpia de respaldos históricos (`v1.2`, `v1.3`, `v1.5`, `v1.6`, `v1.7`) sin sobrescribir claves ajenas de `localStorage`.

## Consecuencias

- **Beneficios:** Ningún JSON corrupto o malicioso derriba la aplicación ni sobrescribe el progreso válido existente; los tipos TypeScript quedan sincronizados automáticamente con las reglas reales de validación.
- **Costos:** Cualquier nuevo campo en `data/*.json` o en el formato de exportación requiere actualizar primero su `*.schema.ts` propietario y sus pruebas negativas en `tests/schema-contracts.test.mjs`.

## Alternativas consideradas

- **Opción A (Elegida):** Validador de esquemas tipado zero-dependency con `InferSchema<T>` y schemas propietarios por feature.
- **Opción B:** Añadir `zod` como dependencia npm de navegador. Descartada temporalmente para no romper la restricción de cero dependencias runtime de `ADR 0001` y `devsecops:offline`, manteniendo exactamente la misma disciplina de diseño (`*Schema` inferido del validador propietario) para que una futura adopción sea directa.
- **Opción C:** Confiar en `JSON.parse` + casts `as` de TypeScript. Rechazada por insegura y contraria a las normas Vigilio.

## Fecha

2026-11-16

## Owners

- Equipo: Arquitectura y Seguridad Aplicativa ARQPIXEL
- Responsable: Comité Técnico ARQPIXEL / Gobernanza Vigilio
