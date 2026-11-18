# ARQPIXEL Academy 1.6 — Arquitectura de Software

Academia interactiva **en español**, de diseño Modern Pixel con identidad azul/cian y la mascota **ArquiBot**. Enseña diseño de sistemas, SOLID, patrones GoF, DDD, Clean Architecture, arquitectura hexagonal, contratos API, sistemas distribuidos y decisiones de arquitectura.

Esta versión preserva **todos los nombres de archivos del ZIP 1.2**, amplía el Senior Mode y se distribuye con salida compilada y compilador TypeScript local. **No es una certificación profesional ni un simulador de infraestructura real.** El informe `AUDIT_REPORT.md` distingue verificaciones reales de objetivos pendientes.

## Cambios auditados en v1.6

- **Identidad visual corregida:** `public/assets/arquibot.png` ahora usa **ArquiBot azul/cian**, diferenciado de la mascota morada de Terraform. El PNG anterior se conserva únicamente como histórico en `docs/legacy/arquibot-v15-mascota-terraform.png`; no se usa en la interfaz. `arquibot-lab.png` conserva el panel azul de arquitectura.
- **Threat Modeling / STRIDE:** 18 amenazas específicas, una por misión, con activos, límite de confianza, caso de abuso, mitigación y prueba recomendada. Es un **bonus educativo**; no altera las seis actividades centrales, sus XP ni los borradores antiguos. La respuesta se guarda/exporta junto a cada variante.
- **Navegador probado:** comprobaciones reales de DOM/interacción en Chromium, con transporte local simulado por las restricciones de navegación del entorno; detalle en `docs/PRUEBAS_NAVEGADOR.md`.
- **DevSecOps:** SBOM offline CycloneDX 1.5, tests añadidos, CI con job de navegador propuesto y corrección de nombres accesibles en los dos cuadernos de la interfaz.
- **Compatibilidad:** preservados todos los paths del ZIP v1.5; ningún archivo original eliminado. La migración del frontend a Preact/Vite sigue pendiente.

### Comandos de validación

```bash
npm run devsecops:offline    # TypeScript, build, SBOM, tests, secretos, headers y licencia
npm run test:browser         # opcional: requiere Python Playwright y Chromium
npm run biome:check         # opcional: requiere instalación de Biome (sin red no funciona)
```

La app de `dist/` se puede ejecutar sin npm, sin internet y sin configurar API keys. Los scripts de prueba/compilación tienen requisitos diferentes; ver `SECURITY.md` y `AUDIT_REPORT.md`.

## Iniciar la app sin instalaciones de npm

1. Descomprime el ZIP. Entra en `arqpixel-academy/`.
2. Ejecuta uno de estos comandos desde esa carpeta:

```bash
python3 -m http.server 4173 --directory dist
# Windows con Python instalado:
py -m http.server 4173 --directory dist
```

3. Abre **http://localhost:4173**. Alternativamente, en Windows ejecuta `iniciar-windows.bat`; en Linux/macOS ejecuta `./iniciar-linux-macos.sh`. La app es estática, no requiere login, base de datos ni claves de API. El contenido educativo y la evaluación residen en el navegador. Para ver catálogos JSON usa HTTP; `file://` no funciona correctamente.

Puedes abrir el taller S09 (pagos distribuidos) en `http://localhost:4173/#/taller-senior/S09`, y el laboratorio de capacidad en `/#/taller-senior/S11`.

## Recompilar el código sin descargar paquetes

Requiere **Node.js 20+**. El ZIP incluye **TypeScript 5.8.3** en `tools/typescript/` con su licencia Apache-2.0 y avisos de terceros. Los comandos no usan un `tsc` global ni se descargan dependencias:

```bash
npm run typecheck
npm run build
npm test
npm run release-check
# O ejecutar todos los controles: npm run verify
```

`npm run dev` recompila y abre un servidor Python (requiere `python3` en PATH). `dist/` ya viene compilado: **no necesitas npm para usarlo**.

## Funciones entregadas

- Portada con diagramas apilados y ArquiBot; modos claro/oscuro, navegación responsive y guardado local.
- **36 lecciones** (12 básicas, 12 intermedias y 12 avanzadas) con teoría, comparación, ejemplos, métricas, reto de transferencia, una pregunta corregible y notas.
- **8 especializaciones técnicas** (`/#/especializaciones`) con módulos enlazados, progreso compartido y proyectos: SOLID/GoF, Clean/Hexagonal, DDD, APIs, System Design, microservicios, Cloud/SRE y Senior.
- **8 laboratorios**: grafo de dependencias, C4, DDD, patrones, APIs, sistemas distribuidos, ADR e incidentes. Son experiencias didácticas simplificadas; no ejecutan proyectos backend ni servicios cloud.
- **Senior Mode 1.5**: 18 misiones × **6 actividades** = **108 actividades educativas** (diagnóstico, Architecture Builder con grafo de relaciones, ADR, respuesta a incidentes, capacidad y Contract/Code Review). Son actividades por caso reutilizando motores didácticos, **no 108 simuladores independientes**.
- **18 laboratorios de impacto por misión**: controles alternativos, métrica antes/después y trade-offs sintéticos; se conservan las simulaciones detalladas adicionales S09 (pagos) y S11 (saturación).
- **Progreso integrado**: el taller Senior registra una misión y concede 80 XP solo cuando pasan los checks mecánicos y la estructura del ADR; los XP históricos de v1.3 no se borran.
- Cada misión Senior tiene **Code Review específico** y un **playbook propio**: objetivo, componentes esenciales, investigación, verificación propuesta, artefacto y antipatrón. La referencia de diagnóstico depende de tráfico/SLO, no solamente de una posición fija.
- **S09** incorpora un banco de pruebas determinista de reintentos, idempotencia y outbox. **S11** incorpora uno de saturación/colas/capacidad. Ambos explican explícitamente sus hipótesis y límites.
- Las misiones permiten exportar **JSON de evidencias** y **dossier Markdown** con restricciones, decisiones, criterios, chequeos y limitaciones; el experimento opcional S09/S11 se incluye si se ejecutó.
- Perfil con XP, avances, insignias y respaldo/restauración JSON. Los borradores Senior se conservan por misión/variante y se incluyen en el respaldo.

## DevSecOps y Senior Mode 1.5

- Gate DevSecOps **opcional por misión** (18 políticas contextuales), con selección priorizada de controles de seguridad, análisis de trade-offs y salida de evidencias; no altera las 108 actividades obligatorias ni los XP históricos.
- `npm run devsecops:offline` ejecuta chequeo TypeScript, compilación, tests, escaneo heurístico de secretos, políticas CSP, licencia del compilador y release gate, sin conexión ni nuevas dependencias.
- Se incluye `.github/workflows/quality-security.yml`, `biome.json`, scripts `security:*` y tests de controles DevSecOps. `npm run biome:check` requiere instalación de Biome desde npm y **no se ha ejecutado localmente** por falta de conexión. El CI también necesita verificación real en GitHub.
- Consulta `docs/DEVSECOPS.md` para capacidades, amenazas, controles, límites de cabeceras HTTP y pendientes de supply chain.

## Qué NO está implementado o certificado

- La interfaz usa **TypeScript + DOM nativo**, no Preact + Vite previsto en `docs/MASTER_SPEC.md`. La app sí compila offline; no prometer una migración que aún no existe.
- Los chequeos ADR evalúan **estructura y referencias a restricciones**, no la calidad de las decisiones. `REQUIRES_REVIEW` exige revisión humana; una puntuación alta **no acredita competencia profesional**.
- Los simuladores son modelos didácticos de capacidad e incidentes. No generan infraestructura real, pruebas de rendimiento, pagos, despliegues, pruebas de carga ni facturación real.
- El grafo Senior valida forma (conectividad y ciclos) pero no es un análisis semántico de arquitectura. Los editores C4/DDD no sustituyen a herramientas profesionales de modelado completo; faltan las validaciones semánticas profundas, los proyectos ejecutables en Java/C# y los minijuegos extensos del master spec.
- No hay multiusuario, backend, nube, autenticación, certificados oficiales ni sincronización de cuentas.
- **No se completó la ejecución E2E en navegador/lector de pantalla**: Chromium del entorno de auditoría respondió `ERR_BLOCKED_BY_ADMINISTRATOR`, incluso mediante rutas locales. Se verificaron build, sintaxis, reglas, integridad ZIP, extracción, tests y HTTP, pero eso no equivale a una auditoría WCAG o responsive visual.

## Seguridad, uso de datos y copias

La aplicación no envía el progreso a ningún servidor. `localStorage` conserva respuestas y textos del estudiante en ese navegador; puede perderse al limpiar los datos del sitio. Exporta una copia de progreso desde Perfil antes de borrar el navegador. Los JSON/Markdown exportados pueden contener texto sensible que el estudiante haya escrito: **no los publiques sin revisarlos**. Las importaciones de progreso están validadas por esquema y límites; no confíes en un archivo de origen desconocido. La aplicación no ejecuta scripts del estudiante.

## Estructura principal

```text
arqpixel-academy/
├── index.html               # entrada fuente
├── dist/                    # versión web ya compilada
├── src/
│   ├── senior-reviews.ts    # 18 ejercicios de code/contract review
│   ├── senior-impact.ts     # 18 experimentos de impacto sintético
│   ├── app.ts               # interfaz, rutas y laboratorios
│   ├── engine.ts            # comprobadores puros
│   ├── senior-suite.ts      # 18 playbooks y 6 actividades/ misión
│   ├── senior-simulations.ts # S09 y S11 (fixtures reproducibles)
│   └── styles.css           # diseño responsive azul/cian
├── data/                    # modules, senior, deep-dives, lab-cases, paths
├── public/assets/           # ArquiBot y referencias visuales PNG
├── tests/                   # pruebas unitarias y smoke de plantilla
├── scripts/                 # build/copia, validación de release
├── tools/typescript/        # TypeScript 5.8.3 redistribuido, licencia incluida
├── docs/                    # master spec e informes históricos
├── MANIFEST.md              # archivos esenciales
├── CHECKSUMS.sha256         # integridad de entregables seleccionados
└── AUDIT_REPORT.md          # reporte de evidencia, límites y prioridades
```

## Verificación recomendada por quien recibe el ZIP

Ejecuta los cuatro comandos de build/pruebas desde el **ZIP extraído**. Si cambias datos, recompila y repite las pruebas. Revisa `AUDIT_REPORT.md` antes de afirmar que el proyecto cumple íntegramente la especificación maestra.

## Licencias

Las fuentes propias de la academia se entregan para revisión y personalización por el destinatario de este proyecto; el código de TypeScript redistribuido conserva su licencia **Apache-2.0** y avisos en `tools/typescript/LICENSE.txt` y `tools/typescript/ThirdPartyNoticeText.txt`. No se incluyen fuentes tipográficas instalables, credenciales ni servicios externos.
