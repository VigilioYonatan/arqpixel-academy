# ADR 0004 - Política de seguridad local-first, sanitización DOM/SVG y cabeceras CSP

## Estado

Aprobado

## Contexto

ARQPIXEL Academy opera bajo un modelo 100 % *local-first* sin cuentas ni backend remoto. Sin embargo, maneja entradas no confiables críticas en el cliente:

- Notas libres, nombres de contenedores C4 y textos ADR ingresados por el usuario que luego se renderizan en DOM, diagramas SVG o bloques Mermaid.
- Archivos JSON importados desde el sistema de archivos local.
- Valores en `location.hash` utilizados por el enrutador SPA.
- Artefactos descargables (`.json`, `.md`, `.mmd`, `.svg`, `.png`) que podrían contener notas privadas del estudiante.

Además, un archivo estático `public/_headers` declara políticas de seguridad (`Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`), pero servidores locales simples como `python -m http.server` no inyectan cabeceras HTTP automáticamente desde `_headers`.

## Decision

1. **Escape obligatorio y cero ejecución dinámica:** Prohibido usar `eval`, `new Function` o inyectar entradas del usuario en `innerHTML` / SVG sin escapar caracteres especiales (`&`, `<`, `>`, `"`, `'`). En exportaciones Mermaid, neutralizar saltos de línea y caracteres de directiva en etiquetas de usuario.
2. **Doble barrera CSP sincronizada:** Mantener sincronizadas las directivas compatibles entre la etiqueta `<meta http-equiv="Content-Security-Policy">` de `index.html` y el archivo `public/_headers` (verificado automáticamente en `scripts/check-security-headers.mjs` y `tests/security-headers.test.mjs`), declarando explícitamente que las directivas exclusivas de cabecera HTTP (`frame-ancestors`, `X-Frame-Options`) dependen del servidor o CDN de despliegue.
3. **Ruta de endurecimiento de estilos:** Reemplazar progresivamente estilos inline dinámicos por clases CSS, `<progress>` semántico o reglas controladas para eliminar `'unsafe-inline'` de `style-src` en la fase de cierre de seguridad (`ARQ-021`).
4. **Higiene de repositorio y privacidad:** Escanear fuentes con `scripts/security-scan.mjs` bloqueando archivos `.env`, claves privadas y tokens en cada corrida de `devsecops:offline`, advirtiendo al usuario antes de compartir exportaciones JSON o Markdown.

## Consecuencias

- **Beneficios:** Protección efectiva frente a XSS reflejado/almacenado en `localStorage` o vía backups importados, incluso cuando se sirve localmente sin proxy inverso gracias al `<meta>` CSP de `index.html`.
- **Costos:** Cualquier componente visual nuevo debe evitar `onclick="..."` inline, URLs `javascript:` y recursos remotos externos (`default-src 'none'`).

## Alternativas consideradas

- **Opción A (Elegida):** Escape sistemático + `<meta>` CSP sincronizado con `public/_headers` + scanner offline de secretos y validación de esquemas en importación.
- **Opción B:** Confiar únicamente en `public/_headers`. Descartada porque deja desprotegida la ejecución local mediante servidores HTTP estáticos básicos.
- **Opción C:** Permitir fuentes, scripts o CDN externos en la CSP. Descartada porque rompe tanto la privacidad como el funcionamiento offline-first del proyecto.

## Fecha

2026-11-16

## Owners

- Equipo: Seguridad y DevSecOps ARQPIXEL
- Responsable: Comité Técnico ARQPIXEL / Gobernanza Vigilio
