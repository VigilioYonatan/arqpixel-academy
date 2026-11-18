# Validación independiente del ZIP extraído — ARQPIXEL v1.4

**Procedimiento observado:** el ZIP se abrió por CRC y sus 194 archivos se extrajeron a `ARQPIXEL_v14_validacion_extraida/arqpixel-academy`, en una carpeta distinta de la fuente. Se comprobó cada entrada con SHA-256 frente a `CHECKSUMS.sha256`; todas las 193 entradas comprobables coincidieron. Las 180 rutas del ZIP 1.3 están conservadas.

Desde la copia extraída se ejecutó `npm run verify` (typecheck → build → npm test → release-check). Resultado **PASS, 35/35 tests, 0 fallos**. El servidor de archivos arrancó con el `dist/` extraído y las **16 rutas HTTP** (HTML, scripts, CSS, cinco catálogos JSON y tres PNG) respondieron **200 OK**, con bytes no vacíos.

**Seguridad de paquete:** sin entradas con traversal, nombres duplicados, rutas inesperadas ni archivos de claves por extensión. No se hallaron patrones de secretos de proveedores en el código propio y los datos JSON inspeccionados. No es un análisis de seguridad exhaustivo.

**No verificado:** navegación real en Chromium, interacción mouse/teclado, lector de pantalla y responsive visual. El navegador devolvió `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Las comprobaciones locales de HTML generado no equivalen a E2E.

Los experimentos Senior operan con números sintéticos deterministas; **no representan benchmarks, sistemas productivos ni revisión humana**. El contrato Preact/Vite de la especificación maestra sigue pendiente.

Para reproducir esta validación, descomprime el ZIP y ejecuta:

```sh
cd arqpixel-academy
npm run verify
python3 -m http.server 4173 --directory dist
```

El checksum SHA-256 del propio ZIP está disponible junto al artefacto final, fuera del ZIP, para evitar una referencia circular.
