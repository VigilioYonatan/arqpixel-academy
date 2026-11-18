# ADR 0007: Cinema Interactivo de Cuadro Único, Audio Neuronal Offline-First y Directiva CSP `media-src`

- **Estado:** Aprobado
- **Fecha:** 2026-11-18
- **Decisores:** Arquitectura & Gobernanza ARQPIXEL Academy (Alineación Vigilio `ux-interactive-cinema`)
- **ADRs relacionados:** [ADR 0001](0001-arquitectura-frontend-modular-dom-estatico-offline.md), [ADR 0003](0003-limites-evaluacion-automatica-y-revision-humana.md), [ADR 0004](0004-politica-csp-cabeceras-y-seguridad-local-first.md), [ADR 0005](0005-csp-estricta-sin-unsafe-inline-y-servidor-http-test.md)

## Contexto y Problema

ARQPIXEL Academy incorpora cápsulas audiovisuales interactivas para portada (`#/inicio`), clases curriculares (`#/aprender/:id` / `#/modulo/:id`) y briefings tácticos de **Senior Mode** (`#/senior`, `#/mision/:id`, `#/taller-senior/:id`).

Incrustar videos `.mp4` tradicionales añadiría cientos de megabytes al repositorio Git, degradaría la legibilidad de diagramas C4/código en pantallas de alta densidad y dificultaría el mantenimiento curricular. Llamar a APIs externas de TTS o LLMs en tiempo de ejecución violaría el principio *local-first / cero red externa* (`connect-src 'self'`) de [ADR 0004](0004-politica-csp-cabeceras-y-seguridad-local-first.md). Adicionalmente, bajo `default-src 'none'`, los elementos HTML5 `<audio>` y `<track kind="captions">` requieren declarar explícitamente `media-src`, y bajo `style-src 'self'` ([ADR 0005](0005-csp-estricta-sin-unsafe-inline-y-servidor-http-test.md)) la barra de progreso no puede usar atributos `style="width: ..."`.

## Decisión

1. **Motor DOM Nativo de Cuadro Único (`ArquiBotPlayer`):**
   - Implementar `src/features/cinema/` en TypeScript ES2022 sin frameworks externos, renderizando un único marco `16:9` (`.cinema-screen`) con 5 pizarras semánticas de Arquitectura de Software (`c4-topology`, `dependency-rings`, `event-lanes`, `arch-code-diff`, `adr-radar`).
2. **Audio Neuronal Conversacional Pre-Masterizado (`0` llamadas externas en runtime):**
   - Generar pistas `.mp3` estéreo (`24 kHz`, `80 kbps`, `~250–450 KB` por cápsula) mediante `scripts/generate-cinema-audio.py` (`edge-tts` a 2 voces + pad armónico DSP + compresión/limitación `ffmpeg`) y registrar sus marcas de tiempo exactas en `data/audio-manifest.json`, validado en borde por `cinema.schema.ts`.
   - Mantener un reloj dual resiliente que conmute automáticamente a temporizador determinista cuando `audio.play()` sea bloqueado o corra en navegadores CI headless sin hardware de sonido.
3. **Endurecimiento explícito de CSP con `media-src 'self' data:` y cero estilos inline:**
   - Añadir `media-src 'self' data:` en `index.html`, `public/_headers` y `scripts/check-security-headers.mjs` para autorizar únicamente audios locales (`./audio/*.mp3`) y pistas de subtítulos `WebVTT` (`<track kind="captions" src="data:text/vtt,...">`), bloqueando cualquier origen multimedia remoto.
   - Construir la línea de tiempo (`scrubber`) con `<svg viewBox="0 0 1000 8">` (atributos geométricos `width` y `x1`) superpuesto con `<input type="range">`, preservando **cero atributos `style="..."`**.

## Alternativas Descartadas

- **Videos `.mp4` renderizados:** descartados por peso (`15–30 MB` por clase) y pérdida de nitidez tipográfica/accesibilidad DOM.
- **`window.speechSynthesis` como canal primario:** descartado por timbre robótico e inconsistente entre sistemas operativos; se conserva únicamente como respaldo degradado opcional cuando una cápsula aún no tenga `.mp3` pre-masterizado, siempre con sanitización fonética previa.
- **TTS/IA en vivo desde el navegador:** descartado por coste en tokens, exposición de credenciales y ruptura del contrato offline-first.

## Consecuencias y Verificación

- `scripts/copy-assets.mjs` copia `public/audio/` hacia `dist/audio/` y `scripts/serve-dist-with-headers.mjs` sirve `.mp3` (`audio/mpeg`) y `.vtt` (`text/vtt`).
- Los tests unitarios, de cabeceras de seguridad y E2E en Playwright verifican la existencia e integridad de cada pista declarada en `data/audio-manifest.json`, el cumplimiento estricto de CSP (`0` atributos `style=`) y la accesibilidad WCAG 2.2 AA (`<track kind="captions">`, control por teclado y `prefers-reduced-motion`).
