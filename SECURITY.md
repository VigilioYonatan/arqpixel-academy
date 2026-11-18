# Política de seguridad y límites — ARQPIXEL Academy v1.6

## Superficie de exposición

ARQPIXEL es una aplicación web estática, sin backend ni cuentas. Los textos de ADR, notas y progreso se guardan en `localStorage`. La exportación importa datos locales; el usuario decide dónde compartir el respaldo. No se envían datos a un servicio externo.

## Controles existentes

- Importación de progreso validada con límites de tamaño y listas de IDs permitidos.
- Texto que se muestra en HTML dinámico escapado para los campos del alumno; los fragmentos de código de revisión son fixtures ilustrativos y nunca se ejecutan.
- Política CSP meta en el HTML y cabeceras declaradas en `public/_headers` para hosts compatibles; `python -m http.server` **no aplica** dichas cabeceras.
- Escaneo de secretos con patrones heurísticos `npm run security:scan`; no cubre historia Git ni detección de alta entropía.
- Código TypeScript estricto y 54 tests unitarios; prueba de interacción de navegador con transporte de datos simulado (ver `docs/PRUEBAS_NAVEGADOR.md`).
- SBOM CycloneDX mínimo generado offline con información del compilador vendorizado y la dependencia opcional de Biome.

## Límites de confianza

- **JSON importados:** validar y nunca importar desde remitentes no confiables; contienen respuestas y notas del alumno.
- **Navegador local:** datos accesibles a quienes tengan acceso a su perfil de navegador; exportar antes de limpiar los datos del sitio.
- **Cadenas ADR/Markdown exportadas:** pueden incorporar información sensible que el alumno introduzca; revisar antes de publicarlas.
- **Fixtures de seguridad en Senior Mode:** son casos didácticos, no resultados de un pentest ni una auditoría de un sistema real.
- **DevSecOps CI:** Biome y acciones de GitHub requieren un runner online; en este entorno no se ejecutó el binario real de Biome ni una auditoría SCA basada en CVE.

## Informe de hallazgos

No existe actualmente un contacto público ni un servicio de recepción de vulnerabilidades asociado a este proyecto local. Si lo publicas en un repositorio, define primero un canal de contacto privado y la política de divulgación responsable, sin añadir credenciales en este archivo.

## Adenda v1.7 — documentación rectora y archivos de estudiante

El archivo `TODO_LO_QUE_DEBE_TENER_ESTA_APP.md` documenta las políticas, las pruebas negativas, la preservación de los recursos y las tareas DevSecOps no verificadas. No se debe utilizar como excusa para anunciar un control de seguridad que no se ejecutó. Los minijuegos y diagramas C4 exportados siguen siendo ejercicios educativos locales; PNG/SVG/JSON/Mermaid pueden contener nombres escritos por el usuario y deben revisarse antes de publicarse.

## Adenda Alineación Vigilio 2026 (`ARQ-021..ARQ-025`)

- **CSP endurecida sin `'unsafe-inline'` (`ADR-0005`):** Tanto `index.html` como `public/_headers` aplican `style-src 'self'` (cero `'unsafe-inline'`, cero `'unsafe-eval'`). El servidor local `scripts/serve-dist-with-headers.mjs` sirve `dist/_headers` reales y la suite Playwright verifica `0` eventos `securitypolicyviolation`.
- **Supply Chain y Workflows por SHA (`ARQ-024`):** `pnpm-workspace.yaml` bloquea scripts arbitrarios de postinstall (`strictDepBuilds: true`, `dangerouslyAllowAllBuilds: false`, `verifyStoreIntegrity: true`), `pnpm-lock.yaml` fija `@biomejs/biome@2.6.3`, `@playwright/test@1.64.1` y `@axe-core/playwright@4.12.1` solo para desarrollo (nunca incluidos en `dist/`), y `.github/workflows/quality-security.yml` fija todas las acciones por commit SHA completo de 40 caracteres con `permissions: contents: read` y `persist-credentials: false`.
- **Frontera honesta de evidencia (`security/operational-evidence.json`):** Los gates locales (`tsc`, `biome ci`, `node:test`, `playwright test` HTTP + `axe-core` WCAG 2.2 AA, budget y scanner heurístico) constan como `PASS` reales ejecutados; los runners hospedados externos de GitHub Actions, cabeceras TLS en CDN externo y sesión asistiva manual NVDA/VoiceOver permanecen honestamente en `NOT_RUN`.
