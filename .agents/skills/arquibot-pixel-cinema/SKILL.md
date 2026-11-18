---
name: arquibot-pixel-cinema
version: 1.0.0
description: Reproductor minimalista de cuadro único (ArquiBotPlayer) en TypeScript DOM nativo bajo CSP estricta con 5 pizarras semánticas de Arquitectura de Software y pistas de audio neuronal HD conversacional a 2 voces masterizadas en estudio.
---

# ArquiBot Pixel Cinema — Arquitectura y Operación en ARQPIXEL Academy

## Propiedad y archivos del módulo (`symbol-ownership-architecture`)

- `src/features/cinema/constants/cinema.constants.ts` — velocidades (`1x/1.25x/1.5x`), umbrales de reloj resiliente, etiquetas de locutores (`Sofía · Tech Lead` / `ArquiBot · Mentor Senior`) y diccionario fonético de respaldo.
- `src/features/cinema/schemas/cinema.schema.ts` — validador de borde `audioManifestCatalogSchema` y tipos inferidos (`CinemaDeck`, `CinemaScene`, `StageVisual`, `StudioAudioMetaSchema`).
- `data/audio-manifest.json` — tiempos exactos (`src`, `totalSec`, `cues[]`, `speakers[]`) medidos tras el mastering DSP sobre `public/audio/*.mp3` y copiados a `dist/data/audio-manifest.json`.
- `src/features/cinema/arquibot-storyboards.ts` — guiones conversacionales a 2 voces para los 15 videos HD masterizados actuales (`HOME-INTRO`, `SENIOR-OVERVIEW`, `CLASS-B01..B10`, `SENIOR-S01..S03`, escalable a los 56/72 videos) más generador determinista para las 36 clases (`B01–A12`) y las 18 misiones Senior (`S01–S18`).
- `src/features/cinema/arquibot-player.ts` — reproductor de pantalla única (`.cinema-screen`) con póster limpio `▶`, 5 pizarras de arquitectura (`c4-topology`, `dependency-rings`, `event-lanes`, `arch-code-diff`, `adr-radar`), subtítulos `CC` + `<track kind="captions">` (`WebVTT`), scrubber SVG + `<input type="range">` (`0` estilos inline) y limpieza determinista `disposeActiveCinemaPlayers()`.
- `scripts/generate-cinema-audio.py` — sintetizador y masterizador DSP (`edge-tts` `es-CO-SalomeNeural` + `es-ES-AlvaroNeural` + pad armónico estéreo `24 kHz` + `ffmpeg` `highpass` / `acompressor` / `amix` / `alimiter` → `public/audio/*.mp3` + `data/audio-manifest.json`).

## Reglas innegociables de diseño, CSP y pedagogía

1. **Cuadro Único Minimalista (`16:9`):** prohibido rodear `.arquibot-cinema` con paneles externos de transcripción o botoneras redundantes.
2. **CSP estricta (`ADR-0005` y `ADR-0007`):** jamás usar atributos `style="..."` en plantillas ni mutaciones DOM; el avance visual del scrubber muta exclusivamente el atributo SVG `width` y `input.value`.
3. **Sincronía exacta voz ↔ escena:** si cambia un diálogo en `scripts/generate-cinema-audio.py`, actualizar el campo `speech` homólogo en `src/features/cinema/arquibot-storyboards.ts` y regenerar con `python scripts/generate-cinema-audio.py`.
4. **Honestidad pedagógica (`ADR-0003`):** los videos Senior explican qué invariantes se verifican mecánicamente (`PASS/FAIL`) y recuerdan que los ADRs abiertos requieren revisión humana (`REQUIRES_REVIEW`).
5. **Tipografía de 4 niveles:** `Space Grotesk` en titulares, `DM Sans` en subtítulos `CC`, `JetBrains Mono` en código/métricas/capítulos con tildes y `Silkscreen` exclusivamente en timecodes numéricos (`00:12 / 00:37`).

## Gates de verificación obligatorios

- Regenerar audio de estudio (cuando cambien guiones): `python scripts/generate-cinema-audio.py`
- Calidad estática y build: `npm run typecheck`, `pnpm run biome:check` y `npm run build`
- Suite unitaria/BDD y seguridad: `npm test` y `npm run devsecops:offline`
- E2E y accesibilidad WCAG 2.2 AA: `pnpm run test:e2e`
