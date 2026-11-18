# ADR 0005: Endurecimiento de CSP a `style-src 'self'` sin `'unsafe-inline'` y Verificación HTTP Real

- **Estado:** Aprobado (complementa y endurece [ADR 0004](0004-politica-csp-cabeceras-y-seguridad-local-first.md))
- **Fecha:** 2026-11-16
- **Decisores:** Arquitectura & DevSecOps ARQPIXEL Academy (Alineación Vigilio 2026)
- **Alcance:** `index.html`, `public/_headers`, `src/styles.css`, `src/**/*.ts`, `scripts/check-security-headers.mjs`, `scripts/serve-dist-with-headers.mjs`

## Contexto

Hasta `v1.7`, la política `Content-Security-Policy` permitía `style-src 'self' 'unsafe-inline'` únicamente para sostener barras de progreso con `style="width:..."` y espaciados puntuales inline. Conforme a `vigilio-docs/stacks/frontend/web-mfe/security/9-seguridad-hardening-privacidad.md`, `'unsafe-inline'` amplía innecesariamente la superficie ante inyección de estilos (CSS exfiltration / UI redressing) cuando no existe requerimiento de CSS-in-JS dinámico.

## Decisión

1. **Eliminación total de atributos `style="..."`:** Todas las barras de progreso pasan al elemento semántico nativo `<progress class="progress arq-progress" max="100" value="...">` estilizado en `src/styles.css`, y todo espaciado o variante cromática emplea clases declarativas CSS.
2. **Política CSP endurecida:** Tanto `<meta http-equiv="Content-Security-Policy">` en `index.html` como `public/_headers` aplican exactamente `style-src 'self'` sin `'unsafe-inline'` ni `'unsafe-eval'`.
3. **Bloqueo automático en gates y E2E HTTP real:** `scripts/check-security-headers.mjs` rechaza cualquier aparición de `'unsafe-inline'` o `'unsafe-eval'`, y el servidor local de pruebas HTTP (`scripts/serve-dist-with-headers.mjs`) inyecta literalmente las cabeceras de `dist/_headers` para verificar en navegador real Chromium que `securitypolicyviolation` permanece en `0`.

## Consecuencias

- **Positivas:** Defensa en profundidad real en navegador, semántica nativa accesible (`<progress>`) para lectores de pantalla y paridad exacta entre meta tag local y cabeceras HTTP servidas.
- **Límites honestos:** En producción externa (Cloudflare Pages, Nginx, S3+CloudFront), el operador del hosting sigue siendo responsable de aplicar `dist/_headers` o su equivalente en el CDN/reverse proxy.
