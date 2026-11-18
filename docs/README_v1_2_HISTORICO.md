# ARQPIXEL Academy — Arquitectura de Software

Aplicación web interactiva, responsive y **local-first** en español, inspirada en el lenguaje visual Modern Pixel de GoPixel pero con identidad propia: **azul marino, cian, azul eléctrico y ArquiBot**.

## Cómo iniciarla (lista para usar)

El ZIP incluye la carpeta **`dist/` ya compilada**. No necesitas npm ni internet para usar la app. Desde la raíz del proyecto:

```bash
python3 -m http.server 4173 --directory dist
```

Abre **http://localhost:4173** en el navegador. En Windows también puedes usar `py -m http.server 4173 --directory dist`.

**Importante:** usa un servidor HTTP local. Abrir `dist/index.html` con `file://` bloquea la carga de catálogos JSON por seguridad del navegador.

## Compilar desde el código fuente

Requiere Node.js 20+ y TypeScript (`tsc` en PATH). La aplicación **no tiene dependencias de ejecución de terceros**; los scripts del proyecto no necesitan una descarga de paquetes si ya tienes `tsc`.

```bash
npm run build
npm test
npm run dev
```

Si no tienes TypeScript instalado, **`dist/` funciona directamente**, sin compilar ni instalarlo. El stack entregado es **TypeScript + HTML/CSS + DOM nativo**, no Preact/Vite. Se eligió una distribución autónoma por la indisponibilidad de paquetes remotos en el entorno de construcción. El documento `docs/MASTER_SPEC.md` conserva la propuesta Preact/Vite para una migración futura.

## Qué incluye esta versión

- Dashboard personalizado con ArquiBot, hero ilustrado con capas y 3 niveles educativos.
- **36 lecciones** (12 básicas, 12 intermedias, 12 avanzadas), cada uno con explicación, caso NexoShop, pregunta corregible y reflexión escrita.
- **18 misiones Senior**, con condiciones de tráfico, SLO, equipo, presupuesto e incidente derivadas de una semilla reproducible, opciones reordenadas por escenario, redacción de ADR, rúbrica estructural con comprobación de referencias a las restricciones y exportación Markdown. La estrategia de referencia todavía no se adapta sustancialmente a las restricciones.
- 8 espacios de laboratorio: dependencias (grafo dirigido editable), C4 (editor de contenedores y exportación), DDD (clasificación), patrones, API, sistemas distribuidos (simulación), ADR (editor) e incidentes.
- Rutas hash, modo oscuro/claro, diseño responsive, accesibilidad básica, progreso/XP/logros, exportación/importación JSON y guardado local.
- Código y documentación para personalizar o ampliar cada parte.

## Límites honestos

- Esta es una **primera aplicación funcional y autocontenida**, no una implementación integral de cada detalle del extenso `MASTER_SPEC.md`.
- Cada módulo incluye **una lección esencial y una evaluación**; aún no hay lecciones multimedia ni editores de código completos para todos los módulos.
- Los laboratorios son **simulaciones locales simplificadas**; no crean infraestructura cloud, no ejecutan código arbitrario, no hacen análisis semántico completo ni son equivalentes a un entorno profesional.
- Los 18 retos Senior incluyen **una decisión de referencia por misión, variantes de contexto y un ADR**, no cinco motores profundos independientes por cada misión. La semilla modifica las condiciones y el orden de las opciones, pero la recomendación base por misión sigue siendo la misma; NO es una simulación de trade-offs calibrada según condiciones reales. Los chequeos de texto del ADR verifican estructura y palabras clave, **no validez técnica ni calidad profesional**. El resultado no representa certificación profesional.
- No hay backend multiusuario, sincronización, autenticación, emisión de certificados ni revisión humana.
- Se carga tipografía web opcional desde Google Fonts; sin internet se usan fuentes del sistema y el resto de la app funciona con normalidad.

## Estructura

```text
arqpixel-academy/
├── dist/                  # Web compilada y lista para ejecutar
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── data/              # 36 módulos + 18 misiones
│   └── assets/            # ArquiBot y recursos visuales
├── src/
│   ├── app.ts             # Render, navegación, progreso, evaluación, simuladores
│   └── styles.css         # Design system responsive Modern Pixel
├── data/
│   ├── modules.json
│   └── senior.json
├── docs/
│   └── MASTER_SPEC.md     # Especificación de producto previa
├── tests/
│   └── catalog.test.mjs
├── scripts/
│   └── copy-assets.mjs
├── tsconfig.json
└── package.json
```

## Privacidad y seguridad

No hay servidores ni analítica; las respuestas se almacenan con la clave `arqpixel-progress-v1` en `localStorage`. Los campos de usuario se escapan para HTML al renderizarse y los contenidos se entregan como datos JSON. La importación restringe formato y tamaño, filtra identificadores desconocidos y recalcula XP a partir de las actividades válidas. No constituye protección contra manipulación deliberada del propio navegador. El usuario puede borrar su avance desde Perfil. Exportar sus ADR puede incluir texto sensible que el propio usuario haya escrito.

## Auditoría de esta versión

Lee `AUDIT_REPORT.md` antes de presentar el proyecto como terminado. La auditoría no aprueba la conformidad integral con el documento maestro: faltan implementación Preact/Vite, actividades múltiples por lección, los cinco motores Senior y pruebas end-to-end de navegador.

## Siguientes mejoras prioritarias

1. Separar la aplicación monolítica `app.ts` en features con rutas y tests de lógica.
2. Incorporar motor de diagramas con drag-and-drop accesible y validación de modelos.
3. Expandir lecciones a contenido MDX, diagramas, ejemplos C#/Java/TS y ejercicios múltiples.
4. Expandir las 18 misiones Senior a los cinco motores de evidencias y casos negativos propuestos en el documento maestro.
5. Añadir tests e2e Playwright al habilitar dependencias, auditoría WCAG 2.2 AA y pruebas con usuarios.
6. Opcionalmente migrar UI a Preact/Vite según el stack objetivo del documento.

**Hecho para aprender arquitectura, no para añadir complejidad innecesaria a la academia.**

---

## Actualización de entrega — ARQPIXEL v1.2 · Senior Suite

Esta entrega **conserva los archivos del paquete auditado v1.1**, incluyendo código, imágenes, especificación y pruebas originales. El informe de la auditoría anterior permanece en `docs/AUDIT_REPORT_v1_1.md`; los cambios nuevos están documentados en `AUDIT_REPORT.md`.

### Novedades funcionales

1. **Senior Suite, 18 misiones × 5 actividades = 90 actividades accesibles.** Entra en **Senior Mode → cualquier misión → Abrir taller de 5 actividades**. Los motores son diagnóstico, selección de componentes arquitectónicos, ADR, respuesta al incidente y estimación de capacidad. Las reglas son deterministas por ID y semilla. La referencia de diagnóstico cambia entre variantes de complejidad moderada y alta. Se ofrecen tres pistas progresivas, rúbrica visible, autoevaluación mecánica y exportación JSON.
2. **36 extensiones prácticas de lección**, una por módulo: comparación, explicación, métrica de verificación y desafío de transferencia específico al tema. Se muestran junto a la lección original.
3. **12 casos adicionales comprobables** para patrones, contratos API e incidentes: cuatro por laboratorio, con feedback individual.
4. **Borradores Senior por misión y variante** con persistencia local. La exportación de perfil incluye estos borradores, y la importación verifica sus estructuras e identificadores antes de restaurarlos.
5. **Pruebas adicionales y control de release**. Ejecuta `npm run typecheck && npm run build && npm test && node scripts/release-check.mjs` desde la raíz. El ZIP incluye `dist/` listo para servir.

### Enlace directo a una misión

`http://localhost:4173/#/taller-senior/S09` abre el taller de pagos distribuidos; cambia `S09` por `S01`…`S18`. Para navegar por el catálogo de misiones utiliza `/#/senior`.

### Límites que siguen siendo importantes

- Los **cinco motores reutilizan un marco de actividades común** y adaptan contexto, restricciones, componentes y respuestas por misión. No equivalen a 90 simuladores profesionales independientes ni a un sistema experto que valida arquitecturas arbitrarias.
- La puntuación de ADR **comprueba estructura y referencias explícitas**, no certifica calidad técnica; el resultado `REQUIRES_REVIEW` es deliberado. El modelo de capacidad es lineal e idealizado.
- Las 36 lecciones tienen contenido original y prácticas extendidas; no incluyen, por ahora, editores ejecutables por lenguaje o proyectos backend completos.
- Se conserva **TypeScript + DOM nativo, HTML y CSS**, no Preact/Vite del plan maestro: reemplazar el framework requiere migración y pruebas visuales adicionales. Se priorizó una distribución con cero dependencias de runtime.
- No se verificó navegación real en navegador automatizado. La prueba de Chromium headless no produjo captura usable en este entorno. Typecheck, build, tests de lógica, recursos y comprobación HTTP no sustituyen E2E ni una auditoría WCAG en navegador.
- No es SaaS multiusuario ni se conecta a proveedores externos. El modo local no usa servicios cloud ni un backend de evaluación.

**Para una evaluación honesta de release**, consulta `AUDIT_REPORT.md`. No publiques la aplicación como certificación profesional ni como cumplimiento integral del `MASTER_SPEC.md`.
