# Prueba de interfaz de ARQPIXEL — alcance y límites

El archivo `tests/browser-e2e.py` ejecuta **módulos JavaScript compilados reales** de `dist/` dentro de Chromium usando Playwright Python. Se conecta a la interfaz real (`document`, botones, cambios de rutas hash, formularios y descargas), y verifica el estado de la aplicación y resultados de sus evaluadores. **No** sustituye una prueba E2E con HTTP y host de producción.

## Por qué existe el aislamiento

En el entorno de auditoría de esta entrega, Chromium devuelve `ERR_BLOCKED_BY_ADMINISTRATOR` al navegar incluso a un servidor `127.0.0.1`. Para comprobar las interacciones sin inventar resultados, el script usa `page.set_content()` (documento vacío) e importa los módulos JavaScript del build por `Blob URL`. Los archivos JSON provienen de `dist/data`, pero se entregan mediante un `fetch` local de pruebas; `localStorage` se reemplaza por un almacén `Map` de test. **No se reemplaza la lógica de la academia** ni sus evaluadores. El archivo CSS compilado se incorpora al documento.

## Qué se comprueba

- Carga e inicialización real de la app en Chromium, rutas de inicio, rutas, especializaciones, laboratorios, Senior, recursos y perfil.
- Navegación y render de las 36 lecciones, los 18 talleres Senior y los 8 laboratorios.
- Presencia de nombres accesibles básicos de formularios y botones; no implica conformidad WCAG 2.2 AA.
- Flujo de evaluación S09: fallo vacío, respuestas completas, grafo, XP sin duplicación, pagos, simulador de impacto, gates STRIDE/DevSecOps, exportación JSON/MD, respaldo/restauración.
- S11, simulador de capacidad y viewport móvil de 375 px sin desbordamiento global.
- Errores JavaScript no gestionados en las rutas recorridas.

## Ejecución

```bash
npm run build
# Necesita Python + pip y navegador Chromium de Playwright o del sistema
python -m pip install playwright==1.56.0
python -m playwright install chromium
python tests/browser-e2e.py
```

Si usas otro binario de Chromium, define `CHROMIUM_PATH` con la ruta completa. El workflow de GitHub Actions propone ejecutarlo automáticamente, pero **la ejecución en GitHub no está verificada localmente**.

## Qué queda SIN comprobar

- Respuestas HTTP reales en navegador (CSP HTTP, cookies, políticas del hosting y tipos MIME); solo `curl` verifica las rutas del servidor de prueba.
- Flujos en Safari/Firefox, lectores de pantalla reales, zoom 200 %, traducciones y auditoría WCAG integral.
- Concurrencia multiusuario, nube, cuentas y backend (no existen en esta versión).
- Seguridad de infraestructura/producto real; los simuladores Senior son educativos.

**No describir esta prueba como Playwright E2E completo con un servidor productivo.**
