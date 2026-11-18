---
name: ux-interactive-cinema
description: Diseño e implementación de videos intro minimalistas de cuadro único, pizarras didácticas animadas en HTML/CSS/SVG sin gasto de tokens en runtime y audio neuronal HD conversacional a dos voces masterizado en estudio (estilo NotebookLM / trailers tech).
owner: governance-platform
lifecycle: stable
introduced_in: 0.8.0
routing_ecosystems: "any"
routing_keywords: "video intro,reproductor interactivo,cinema player,pizarra animada,notebooklm,voz neuronal,audio estudio,explicacion animada,onboarding video,tts profesional"
routing_files: "package.json"
routing_capabilities: "feature,ux,audio,onboarding"
requires:
  - ui-interaction-motion
  - ux-accessibility
optional:
  - ui-art-direction
  - web-mfe-testing
conflicts: []
supersedes: []
---

# ux-interactive-cinema — procedimiento Senior/Staff

## Condiciones de activación

Activar cuando el usuario solicite crear o mejorar un **video intro en la portada**, **explicaciones animadas por clase ahorrando tokens**, **briefings visuales en Senior Mode** o **elevar voces sintéticas robóticas a calidad conversacional de estudio**.

## Arquitectura obligatoria de respuesta

1. **Cuadro Único Minimalista («Solo darle Play»):**
   - Prohibido apilar cajas periféricas fuera del reproductor (sin títulos externos duplicados, sin cajas de subtítulos separadas debajo, sin cuadrículas grandes de capítulos ni botoneras sueltas).
   - En estado `idle`, renderizar un póster cinematográfico limpio con vista previa difuminada, insignia de duración y **un único botón circular central `▶`**.
   - En reproducción (`playing | paused`), integrar **todo dentro de `.cinema-screen`**: píldora superior de locutor con ecualizador en vivo + puntos de capítulo, pizarra semántica animada en el centro, subtítulos `CC` translúcidos tipo cine y barra inferior delgada con `scrubber` continuo y marcas `cues`.

2. **Ahorro total de tokens, cero inline styles y presupuesto estricto:**
   - Construir `CinemaDeck` deterministas desde los JSON/manifiestos de dominio del proyecto (`0` llamadas a LLMs en vivo, `0 MB` de `.mp4` borrosos).
   - Bajo CSP estricta (`style-src 'self'`), prohibir `style="..."` en el `scrubber`: emplear `<svg viewBox="0 0 1000 8">` con atributos geométricos (`width`, `x1`) más `<input type="range">` accesible.

3. **Audio Neuronal HD a 2 Voces + Mastering DSP:**
   - Alternar `Host` curioso (`es-CO-SalomeNeural`) + `Mentor Senior` profundo (`es-ES-AlvaroNeural`) para lograr ritmo conversacional humano.
   - Aplicar limpieza fonética (`clean_for_speech`) a siglas y símbolos técnicos antes del TTS manteniendo el texto técnico exacto en pantalla y en `<track kind="captions">` (`WebVTT`).
   - Masterizar con `ffmpeg` (`silenceremove` + `apad=0.28s`, colchón armónico cálido a `24 kHz` con *swell* inicial, *ducking* y *chime* en cada `cue`, `highpass=85Hz`, compresor vocal y limitador a `80 kbps` `.mp3`) y exportar `data/audio-manifest.json` con `totalSec`, `cues[]` y `speakers[]` medidos exactamente.
   - Incluir adaptador de reloj dual (sincronía con `<audio>` real + fallback automático en entornos CI headless sin hardware de sonido).

## Entrega verificable

- Componente reproductor de cuadro único + generador reproducible de audio + `data/audio-manifest.json` + `<track kind="captions" default>` (`WebVTT`).
- Pruebas unitarias/BDD sobre storyboards/manifiesto + auditoría A11y (`axe-core`, slider por teclado) + prueba E2E Playwright en desktop y móvil sin overflow + capturas reales inspeccionadas.

## Lectura obligatoria de referencias

Consultar [references/execution.md](references/execution.md) antes de ejecutar implementaciones o auditorías de este módulo.
