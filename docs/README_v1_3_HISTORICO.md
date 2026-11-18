# ARQPIXEL Academy 1.3 — Arquitectura de Software

Academia interactiva **en español**, de diseño Modern Pixel con identidad azul/cian y la mascota **ArquiBot**. Enseña diseño de sistemas, SOLID, patrones GoF, DDD, Clean Architecture, arquitectura hexagonal, contratos API, sistemas distribuidos y decisiones de arquitectura.

Esta versión preserva **todos los nombres de archivos del ZIP 1.2**, amplía el Senior Mode y se distribuye con salida compilada y compilador TypeScript local. **No es una certificación profesional ni un simulador de infraestructura real.** El informe `AUDIT_REPORT.md` distingue verificaciones reales de objetivos pendientes.

## Iniciar la app sin instalaciones de npm

1. Descomprime el ZIP. Entra en `arqpixel-academy/`.
2. Ejecuta uno de estos comandos desde esa carpeta:

```bash
python3 -m http.server 4173 --directory dist
# Windows con Python instalado:
py -m http.server 4173 --directory dist
```

3. Abre **http://localhost:4173**. La app es estática, no requiere login, base de datos ni claves de API. El contenido educativo y la evaluación residen en el navegador. Para ver catálogos JSON usa HTTP; `file://` no funciona correctamente.

Puedes abrir el taller S09 (pagos distribuidos) en `http://localhost:4173/#/taller-senior/S09`, y el laboratorio de capacidad en `/#/taller-senior/S11`.

## Recompilar el código sin descargar paquetes

Requiere **Node.js 20+**. El ZIP incluye **TypeScript 5.8.3** en `tools/typescript/` con su licencia Apache-2.0 y avisos de terceros. Los comandos no usan un `tsc` global ni se descargan dependencias:

```bash
npm run typecheck
npm run build
npm test
node scripts/release-check.mjs
```

`npm run dev` recompila y abre un servidor Python (requiere `python3` en PATH). `dist/` ya viene compilado: **no necesitas npm para usarlo**.

## Funciones entregadas

- Portada con diagramas apilados y ArquiBot; modos claro/oscuro, navegación responsive y guardado local.
- **36 lecciones** (12 básicas, 12 intermedias y 12 avanzadas) con teoría, comparación, ejemplos, métricas, reto de transferencia, una pregunta corregible y notas.
- **8 especializaciones técnicas** (`/#/especializaciones`) con módulos enlazados, progreso compartido y proyectos: SOLID/GoF, Clean/Hexagonal, DDD, APIs, System Design, microservicios, Cloud/SRE y Senior.
- **8 laboratorios**: grafo de dependencias, C4, DDD, patrones, APIs, sistemas distribuidos, ADR e incidentes. Son experiencias didácticas simplificadas; no ejecutan proyectos backend ni servicios cloud.
- **Senior Mode**: 18 misiones temáticas × cinco tipos de actividad = **90 actividades educativas**. Las cinco actividades son diagnóstico, Architecture Builder, ADR, Incident Response y Capacity/Reliability; se alimentan de escenarios reproducibles. **No son 90 simuladores independientes**.
- Cada misión Senior tiene un **playbook propio**: objetivo, componentes esenciales, investigación, verificación propuesta, artefacto y antipatrón. La referencia de diagnóstico depende de tráfico/SLO, no solamente de una posición fija.
- **S09** incorpora un banco de pruebas determinista de reintentos, idempotencia y outbox. **S11** incorpora uno de saturación/colas/capacidad. Ambos explican explícitamente sus hipótesis y límites.
- Las misiones permiten exportar **JSON de evidencias** y **dossier Markdown** con restricciones, decisiones, criterios, chequeos y limitaciones; el experimento opcional S09/S11 se incluye si se ejecutó.
- Perfil con XP, avances, insignias y respaldo/restauración JSON. Los borradores Senior se conservan por misión/variante y se incluyen en el respaldo.

## Qué NO está implementado o certificado

- La interfaz usa **TypeScript + DOM nativo**, no Preact + Vite previsto en `docs/MASTER_SPEC.md`. La app sí compila offline; no prometer una migración que aún no existe.
- Los chequeos ADR evalúan **estructura y referencias a restricciones**, no la calidad de las decisiones. `REQUIRES_REVIEW` exige revisión humana; una puntuación alta **no acredita competencia profesional**.
- Los simuladores son modelos didácticos de capacidad e incidentes. No generan infraestructura real, pruebas de rendimiento, pagos, despliegues, pruebas de carga ni facturación real.
- Los editores C4/DDD no sustituyen a herramientas profesionales de modelado completo; faltan las validaciones semánticas profundas, los proyectos ejecutables en Java/C# y los minijuegos extensos del master spec.
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
│   ├── app.ts               # interfaz, rutas y laboratorios
│   ├── engine.ts            # comprobadores puros
│   ├── senior-suite.ts      # 18 playbooks y 5 actividades/ misión
│   ├── senior-simulations.ts # S09 y S11 (fixtures reproducibles)
│   └── styles.css           # diseño responsive azul/cian
├── data/                    # modules, senior, deep-dives, lab-cases, paths
├── public/assets/           # ArquiBot y referencias visuales PNG
├── tests/                   # 26 pruebas automatizadas
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
