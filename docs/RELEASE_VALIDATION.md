# Validación de release — ARQPIXEL v1.7

**Proyecto:** ARQPIXEL Academy — Arquitectura de Software. **Salida:** sitio estático `dist/` con código TypeScript disponible. **Documento obligatorio:** `TODO_LO_QUE_DEBE_TENER_ESTA_APP.md`.

## Comprobaciones de código previas al empaquetado (observadas)

| Comando | Resultado |
|---|---|
| `npm run typecheck` | Exit 0; TypeScript 5.8.3 vendorizado |
| `npm run build` | Exit 0; JS compilado, catálogos y assets copiados a `dist/` |
| `npm test` | **69 pruebas pasan**, 0 fallan, incluidas cuatro de integridad del documento rector |
| `npm run release-check` | Valida 36 lecciones, 18 Senior, 8 rutas, 5 minijuegos, C4 y el documento rector |
| `npm run devsecops:offline` | Exit 0: tipo/build, SBOM, tests, escáner heurístico, headers declarativos, licencias y release check |
| `npm run test:browser` | Exit 0: Chromium ejecuta los ES modules reales con transporte fixture local; ver abajo |

### Alcance de navegador

El test Chromium recorre 36 lecciones, 18 talleres Senior, ocho laboratorios, minijuegos (30 decisiones), exportaciones C4 JSON/Mermaid/SVG/PNG, backup/reset/import, XP e idempotencia, el Senior contextual de 24 lecciones y tamaños 375/768/1440 px. Usa `page.set_content()` y módulos JS compilados reales con fetch/localStorage aislados porque el entorno restringe navegación HTTP. No representa E2E sobre hosting público, certificación WCAG ni revisión humana de ADR.

## Pendientes explícitos

- Biome configurado pero ejecutable ausente: no se verificó `biome ci`.
- CI GitHub Actions, SCA CVEs y cabeceras HTTP de hosting real: no ejecutados.
- Migración Preact/Vite de la especificación original: pendiente.
- Evaluación semántica experta de las arquitecturas: no implementada.

## Procedimiento postempaquetado obligatorio

1. Comprobar `unzip -t` / CRC y SHA-256 del archivo ZIP.
2. Comparar las **223 rutas** del ZIP v1.6 con el ZIP v1.7; no permitir pérdida silenciosa.
3. Extraer a carpeta independiente y comprobar `TODO_LO_QUE_DEBE_TENER_ESTA_APP.md` y el resto del manifiesto.
4. Desde la carpeta extraída ejecutar `npm run devsecops:offline`, `npm run test:browser` si Playwright existe.
5. Servir `dist/` con Python y probar los recursos principales por HTTP (status 200, bytes válidos).
6. Guardar los resultados definitivos en `AUDIT_REPORT.md` y en el archivo de validación junto al ZIP.

El tamaño del ZIP no es evidencia de integridad funcional. No declarar «100 % completo» mientras persistan los pendientes.
