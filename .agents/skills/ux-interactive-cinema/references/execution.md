# Ejecución y casos adversarios — ux-interactive-cinema

## Protocolo operativo

1. Leer íntegros `SKILL.md` y [`docs/PROPUESTA_ARQPIXEL_CINEMA_INTERACTIVO.md`](../../../docs/PROPUESTA_ARQPIXEL_CINEMA_INTERACTIVO.md).
2. Inventariar manifiestos existentes en `data/*.json` antes de diseñar escenas para reutilizar datos de dominio sin duplicar contenido ni gastar tokens.
3. Verificar disponibilidad de `Python`, `edge-tts` y `ffmpeg` con soporte `libmp3lame` (`imageio-ffmpeg` estático) antes de ejecutar el pipeline de mastering.
4. Garantizar codificación UTF-8 explícita en consola (`sys.stdout.reconfigure(encoding="utf-8")` en Windows) durante la generación por lotes.
5. Ejecutar `npm run typecheck`, `pnpm run biome:check`, `npm run build`, `npm test`, `npm run devsecops:offline` y `pnpm run test:e2e` verificando estado `idle`, transición a `playing`, salto de escena, cero atributos `style="..."`, ausencia de overflow en móvil e inspección visual de capturas.

## Casos adversarios obligatorios en QA

- **Entorno CI / Playwright sin dispositivo de audio:** si `audio.currentTime` permanece inmóvil tras `play()` (`>= 600 ms`), el reproductor debe conmutar automáticamente al reloj determinista interno sin lanzar errores ni congelar la barra de progreso.
- **Cambio rápido de módulo o ruta en mitad de la locución:** el cambio de ruta en `shell()` debe invocar `disposeActiveCinemaPlayers()` para pausar `<audio>`, limpiar intervalos y cancelar cualquier `speechSynthesis` residual.
- **Siglas y símbolos técnicos de arquitectura (`C4`, `DDD`, `CQRS`, `p95`, `SLO`, `RPO/RTO`, `STRIDE`, `IDOR`, `S01`):** nunca deben enviarse crudos al sintetizador neuronal; verificar diccionario fonético `clean_for_speech`.
- **CSP estricta (`style-src 'self'`, `media-src 'self' data:`):** prohibido inyectar `style="..."` al actualizar la barra de progreso; validar `<track kind="captions">`, `<input type="range">` con teclado y respeto a `[data-motion="reduce"]` / `prefers-reduced-motion`.

## Contrato de salida

`stack_detectado`, `skills_realmente_leidas`, `fuentes_leidas`, `pistas_mp3_generadas`, `peso_total_audio_kb`, `tests`, `a11y`, `visual_qa`, `review`, `pendientes`.
