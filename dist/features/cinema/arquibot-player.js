/**
 * Single-Frame Minimalist Interactive Cinema Player (`ArquiBotPlayer`) in native TypeScript + DOM (`ADR-0001`, `ADR-0005`, `ADR-0007`).
 * - Zero inline CSS attributes (SVG geometric attributes + native `<input type="range">` scrubber).
 * - Studio-mastered 2-voice neural HD `<audio>` + `<track kind="captions">` (`WebVTT`) + headless-resilient dual clock.
 * - 5 Software Architecture visual boards (`c4-topology`, `dependency-rings`, `event-lanes`, `arch-code-diff`, `adr-radar`).
 */
import { renderArquiBotSprite, } from '../shared/schemas/assets-manifest.schema.js';
import { ARCHITECTURE_SPEECH_REPLACEMENTS, CINEMA_KEYBOARD_SEEK_SEC, CINEMA_PLAYBACK_SPEEDS, CINEMA_SCRUBBER_MAX, CINEMA_SPEAKER_LABELS, CINEMA_STALL_TICKS_LIMIT, CINEMA_TICK_MS, CINEMA_WORDS_PER_SECOND_ESTIMATE, } from './constants/cinema.constants.js';
const activeDisposers = new Set();
const registeredDecks = new Map();
function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
}
export function formatCinemaTime(sec) {
    const whole = Math.max(0, Math.floor(sec));
    const mins = Math.floor(whole / 60);
    const rem = whole % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}
const SPOKEN_DIGITS = Object.freeze({
    '0': 'cero',
    '1': 'uno',
    '2': 'dos',
    '3': 'tres',
    '4': 'cuatro',
    '5': 'cinco',
    '6': 'seis',
    '7': 'siete',
    '8': 'ocho',
    '9': 'nueve',
});
const SPOKEN_PREFIX_LETTERS = Object.freeze({
    B: 'be',
    I: 'i',
    A: 'a',
    S: 'ese',
});
export function cleanArchitectureSpeechText(text) {
    let out = text.replace(/\b([BIAS])(\d)(\d)\b/g, (_full, letter, d1, d2) => {
        const l = SPOKEN_PREFIX_LETTERS[letter] ?? letter;
        if (d1 === '0') {
            return `${l} cero ${SPOKEN_DIGITS[d2] ?? d2}`;
        }
        return `${l} ${d1}${d2}`;
    });
    for (const [pattern, spoken] of ARCHITECTURE_SPEECH_REPLACEMENTS) {
        out = out.split(pattern).join(spoken);
    }
    return out;
}
function stopFallbackSpeech() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window))
        return;
    try {
        window.speechSynthesis.cancel();
    }
    catch {
        /* ignore speechSynthesis quirk */
    }
}
function speakFallbackTurn(text, rate) {
    if (typeof window === 'undefined' ||
        !('speechSynthesis' in window) ||
        typeof SpeechSynthesisUtterance === 'undefined') {
        return;
    }
    try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(cleanArchitectureSpeechText(text));
        utter.lang = 'es-ES';
        utter.rate = Math.min(1.5, Math.max(0.9, rate));
        window.speechSynthesis.speak(utter);
    }
    catch {
        /* ignore blocked speechSynthesis */
    }
}
export function computeDeckTimeline(deck) {
    if (deck.audio && deck.audio.cues.length === deck.scenes.length) {
        const starts = deck.audio.cues.map((cue, idx) => (idx === 0 ? 0 : cue));
        const total = deck.audio.totalSec;
        const ends = starts.map((_, idx) => (idx < starts.length - 1 ? (starts[idx + 1] ?? total) : total));
        return { starts, ends, total };
    }
    const durations = deck.scenes.map((sc) => {
        const words = sc.speech.trim().split(/\s+/).length;
        return Math.max(sc.durationSec, Math.ceil(words / CINEMA_WORDS_PER_SECOND_ESTIMATE));
    });
    const starts = [];
    let acc = 0;
    for (const dur of durations) {
        starts.push(acc);
        acc += dur;
    }
    const ends = starts.map((st, idx) => st + (durations[idx] ?? 8));
    return { starts, ends, total: acc };
}
export function buildWebVttDataUri(deck, timeline) {
    const fmtVtt = (sec) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        const ms = Math.round((sec - Math.floor(sec)) * 1000);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
    };
    const body = deck.scenes
        .map((sc, idx) => {
        const start = timeline.starts[idx] ?? 0;
        const end = timeline.ends[idx] ?? start + sc.durationSec;
        return `${fmtVtt(start)} --> ${fmtVtt(end)}\n${sc.speech}`;
    })
        .join('\n\n');
    return `data:text/vtt;charset=utf-8,${encodeURIComponent(`WEBVTT\n\n${body}`)}`;
}
export function renderStageVisualHtml(visual, progress) {
    if (visual.kind === 'adr-radar') {
        const visible_count = Math.max(1, Math.ceil(progress * visual.lines.length + 0.2));
        return `<div class="cinema-board cinema-terminal" data-stage-kind="adr-radar">
      <div class="cinema-board-top">
        <span class="cinema-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="cinema-board-title">${esc(visual.title)}</span>
        <span class="cinema-chip">ADR · GATE</span>
      </div>
      <div class="cinema-term-body">
        ${visual.lines
            .map((ln, idx) => {
            const shown = idx < visible_count;
            return `<div class="cinema-term-line ${ln.tone ?? 'cmd'} ${shown ? 'is-visible' : 'is-pending'}" data-term-line="${idx}">
              ${ln.prompt ? `<span class="term-prompt">${esc(ln.prompt)}</span>` : ''}
              <code>${esc(ln.text)}</code>
              ${idx === visible_count - 1 ? '<span class="cinema-pixel-cursor" aria-hidden="true"></span>' : ''}
            </div>`;
        })
            .join('')}
      </div>
    </div>`;
    }
    if (visual.kind === 'dependency-rings') {
        return `<div class="cinema-board cinema-dep-rings" data-stage-kind="dependency-rings">
      <div class="cinema-board-top">
        <span class="cinema-board-title">${esc(visual.outerLayer)}</span>
        <span class="cinema-chip ${visual.mode === 'clean' ? 'ok' : 'hot'}">${esc(visual.badgeLabel)}</span>
      </div>
      <div class="cinema-rings-grid">
        <div class="cinema-ring-col">
          ${visual.coreItems
            .map((item) => `<div class="cinema-ring-row state-${item.state}">
                <strong>${esc(item.name)}</strong>
                <code>${esc(item.rule)}</code>
              </div>`)
            .join('')}
        </div>
        <div class="cinema-ring-arrow" aria-hidden="true">${visual.mode === 'clean' ? '◀── PUERTO' : 'SQL FUGA ──▶'}</div>
        <div class="cinema-ring-infra ${visual.mode === 'clean' ? 'is-safe' : 'is-alert'}">
          <strong>${esc(visual.infraTitle)}</strong>
          <small>${esc(visual.infraNote)}</small>
        </div>
      </div>
    </div>`;
    }
    if (visual.kind === 'event-lanes') {
        const active_step = Math.min(2, Math.floor(progress * 3));
        return `<div class="cinema-board cinema-lanes" data-stage-kind="event-lanes">
      <div class="cinema-lanes-head">
        <span class="cinema-chip ${visual.mode === 'resilient' ? 'ok' : 'hot'}">${esc(visual.statusBadge)}</span>
      </div>
      ${[visual.laneA, visual.laneB]
            .map((lane) => `<div class="cinema-lane-row">
            <div class="cinema-lane-label">${esc(lane.name)}</div>
            <div class="cinema-lane-steps">
              ${lane.steps
            .map((st, idx) => `<span class="cinema-step-pill ${idx <= active_step ? 'active' : ''}" data-lane-step="${idx}">${esc(st)}</span>`)
            .join('')}
            </div>
          </div>`)
            .join('')}
    </div>`;
    }
    if (visual.kind === 'arch-code-diff') {
        const show_after = progress >= 0.25;
        return `<div class="cinema-board cinema-diff" data-stage-kind="arch-code-diff">
      <div class="cinema-board-top">
        <span class="cinema-board-title">${esc(visual.file)}</span>
        <span class="cinema-chip ok">ARCH DIFF</span>
      </div>
      <div class="cinema-diff-lines">
        ${visual.before.map((b) => `<div class="cinema-diff-del"><code>- ${esc(b)}</code></div>`).join('')}
        ${visual.after
            .map((a) => `<div class="cinema-diff-add ${show_after ? 'is-lit' : ''}" data-diff-after="true"><code>+ ${esc(a)}</code></div>`)
            .join('')}
      </div>
      <div class="cinema-callout">✦ <span>${esc(visual.callout)}</span></div>
    </div>`;
    }
    return `<div class="cinema-board cinema-arch" data-stage-kind="c4-topology">
    <div class="cinema-arch-nodes">
      ${visual.nodes
        .map((nd, idx) => `<div class="cinema-arch-step">
            <div class="cinema-arch-box state-${nd.state ?? 'normal'}">
              <strong>${esc(nd.label)}</strong>
              <small>${esc(nd.sub)}</small>
            </div>
            ${idx < visual.nodes.length - 1 ? '<span class="cinema-flow-arrow" aria-hidden="true">══▶</span>' : ''}
          </div>`)
        .join('')}
    </div>
    <div class="cinema-metric-strip">
      <span class="cinema-metric-label">${esc(visual.metricLabel)}</span>
      <div class="cinema-metric-values">
        <span class="before">${esc(visual.metricBefore)}</span>
        <span aria-hidden="true">→</span>
        <strong class="${visual.mode === 'incident' ? 'hot' : 'ok'}">${esc(visual.metricAfter)}</strong>
      </div>
    </div>
  </div>`;
}
function renderPosterInnerHtml(deck, timeline, compact, manifest_lookup) {
    const first_scene = deck.scenes[0];
    if (!first_scene)
        return '';
    const sprite_size = compact ? 72 : 92;
    const sub_label = deck.audio
        ? `Audio Estudio HD · Sofía & ArquiBot · ${deck.scenes.length} escenas`
        : `Pizarra interactiva guiada · ${deck.scenes.length} escenas`;
    return `<button type="button" class="cinema-poster" data-cinema-play-poster="true" aria-label="Reproducir video: ${esc(deck.heading)}">
    <div class="cinema-poster-backdrop" aria-hidden="true">
      ${renderStageVisualHtml(first_scene.visual, 0.75)}
    </div>
    <div class="cinema-poster-top">
      <span class="cinema-pill-hd"><i class="cinema-live-dot" aria-hidden="true"></i> ${esc(deck.kicker)}</span>
      <span class="cinema-pill-dur">${formatCinemaTime(timeline.total)}</span>
    </div>
    <div class="cinema-poster-center">
      <span class="cinema-play-orb" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="${compact ? 22 : 28}" height="${compact ? 22 : 28}" fill="currentColor">
          <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.02-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z"/>
        </svg>
      </span>
      <strong class="cinema-poster-heading">${esc(deck.heading)}</strong>
      <span class="cinema-poster-sub">${esc(sub_label)}</span>
    </div>
    <span class="cinema-poster-bot" aria-hidden="true">
      ${renderArquiBotSprite(first_scene.spriteId, sprite_size, '', manifest_lookup)}
    </span>
  </button>`;
}
function renderActiveScreenInnerHtml(params) {
    const { deck, timeline, status, currentTime, sceneIdx, sceneProgress, speed, muted, captionsOn, compact, manifestLookup, } = params;
    const current_scene = deck.scenes[sceneIdx] ?? deck.scenes[0];
    const speaker_role = current_scene.speaker;
    const is_live_audio = status === 'playing' && !muted;
    const is_mentor_talking = is_live_audio && speaker_role === 'mentor';
    const fill_units = timeline.total > 0
        ? Math.min(CINEMA_SCRUBBER_MAX, Math.max(0, Math.round((currentTime / timeline.total) * CINEMA_SCRUBBER_MAX)))
        : 0;
    const cue_lines_svg = timeline.starts
        .slice(1)
        .map((cue) => {
        const cue_x = Math.round((cue / Math.max(1, timeline.total)) * CINEMA_SCRUBBER_MAX);
        return `<line x1="${cue_x}" y1="0" x2="${cue_x}" y2="8" class="cinema-cue-line" />`;
    })
        .join('');
    const cta_html = deck.ctaLabel && (deck.ctaHref || deck.ctaScrollTarget)
        ? deck.ctaScrollTarget
            ? `<button type="button" class="btn btn-gold small" data-cinema-scroll="${esc(deck.ctaScrollTarget)}">${esc(deck.ctaLabel)} →</button>`
            : `<a class="btn btn-gold small" href="${esc(deck.ctaHref)}">${esc(deck.ctaLabel)} →</a>`
        : '';
    return `<div class="cinema-top-overlay">
      <div class="cinema-speaker-badge role-${speaker_role} ${is_live_audio ? 'is-live' : ''}">
        <span class="cinema-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span>${esc(CINEMA_SPEAKER_LABELS[speaker_role])}</span>
      </div>
      <nav class="cinema-scene-dots" aria-label="Capítulos del video">
        ${deck.scenes
        .map((sc, idx) => `<button type="button" class="cinema-dot-btn ${idx === sceneIdx ? 'active' : ''}" data-cinema-jump="${idx}" aria-label="Ir a ${esc(sc.chapter)}" ${idx === sceneIdx ? 'aria-current="step"' : ''}>${esc(sc.chapter)}</button>`)
        .join('')}
      </nav>
    </div>

    <div class="cinema-stage-body">
      <div class="cinema-stage-left">
        <h3 class="cinema-live-title">${esc(current_scene.title)}</h3>
        <div data-cinema-stage-canvas="true">
          ${renderStageVisualHtml(current_scene.visual, sceneProgress)}
        </div>
      </div>
      <div class="cinema-stage-mascot ${is_mentor_talking ? 'is-speaking' : ''}">
        ${renderArquiBotSprite(current_scene.spriteId, compact ? 84 : 104, 'cinema-bot-img', manifestLookup)}
      </div>
    </div>

    ${captionsOn && status !== 'ended'
        ? `<div class="cinema-subtitles" aria-live="polite"><p>${esc(current_scene.speech)}</p></div>`
        : ''}

    ${status === 'ended'
        ? `<div class="cinema-ended-overlay">
            <div class="cinema-ended-card">
              <button type="button" class="btn primary small" data-cinema-toggle-play="true">↺ Volver a ver</button>
              ${cta_html}
            </div>
          </div>`
        : ''}

    <div class="cinema-bottom-bar">
      <div class="cinema-scrubber-wrap">
        <svg class="cinema-scrubber-svg" viewBox="0 0 ${CINEMA_SCRUBBER_MAX} 8" preserveAspectRatio="none" aria-hidden="true">
          <rect class="cinema-scrubber-svg-track" x="0" y="0" width="${CINEMA_SCRUBBER_MAX}" height="8" rx="4" />
          <rect class="cinema-scrubber-svg-fill" data-cinema-fill-rect="true" x="0" y="0" width="${fill_units}" height="8" rx="4" />
          ${cue_lines_svg}
        </svg>
        <input
          type="range"
          class="cinema-scrubber-range"
          data-cinema-range="true"
          min="0"
          max="${CINEMA_SCRUBBER_MAX}"
          step="1"
          value="${fill_units}"
          aria-label="Línea de tiempo del video"
        />
      </div>
      <div class="cinema-controls-strip">
        <div class="cinema-ctrl-group">
          <button
            type="button"
            class="cinema-icon-btn is-primary"
            data-cinema-toggle-play="true"
            aria-label="${status === 'playing' ? 'Pausar video' : status === 'ended' ? 'Repetir video' : 'Reproducir video'}"
          >${status === 'playing' ? '⏸' : status === 'ended' ? '↺' : '▶'}</button>
          <span class="cinema-time-readout" data-cinema-time="true">${formatCinemaTime(currentTime)} / ${formatCinemaTime(timeline.total)}</span>
          <span class="cinema-chapter-inline">${esc(current_scene.chapter)}</span>
        </div>
        <div class="cinema-ctrl-group">
          <button
            type="button"
            class="cinema-icon-btn ${captionsOn ? 'is-active' : ''}"
            data-cinema-toggle-cc="true"
            aria-pressed="${captionsOn ? 'true' : 'false'}"
            aria-label="${captionsOn ? 'Ocultar subtítulos' : 'Mostrar subtítulos'}"
            title="Subtítulos (CC)"
          >CC</button>
          <button
            type="button"
            class="cinema-icon-btn"
            data-cinema-cycle-speed="true"
            aria-label="Velocidad de reproducción ${speed}x"
          >${speed}x</button>
          <button
            type="button"
            class="cinema-icon-btn ${!muted ? 'is-active' : ''}"
            data-cinema-toggle-mute="true"
            aria-pressed="${!muted ? 'true' : 'false'}"
            aria-label="${muted ? 'Activar audio' : 'Silenciar audio'}"
          >${muted ? '🔇' : '🔊'}</button>
          <button
            type="button"
            class="cinema-icon-btn"
            data-cinema-fullscreen="true"
            aria-label="Pantalla completa"
            title="Pantalla completa"
          >⛶</button>
        </div>
      </div>
    </div>`;
}
/**
 * Renders the single-frame `ArquiBotPlayer` HTML container and registers its `CinemaDeck` for interactive hydration.
 * Strictly preserves zero inline CSS attributes (`ADR-0005`).
 */
export function renderArquiBotCinemaHtml(deck, options = {}) {
    registeredDecks.set(deck.id, deck);
    const compact = Boolean(options.compact);
    const timeline = computeDeckTimeline(deck);
    const initial_aura = deck.scenes[0]?.aura ?? 'amber';
    const vtt_uri = buildWebVttDataUri(deck, timeline);
    return `<section
    class="arquibot-cinema aura-${initial_aura} ${compact ? 'is-compact' : ''} is-idle"
    data-cinema-deck="${esc(deck.id)}"
    data-cinema-compact="${compact ? 'true' : 'false'}"
    aria-label="Video: ${esc(deck.heading)}"
  >
    ${deck.audio
        ? `<audio class="cinema-audio-el" src="${esc(deck.audio.src)}" preload="none">
            <track kind="captions" src="${esc(vtt_uri)}" srclang="es" label="Subtítulos en español" default />
          </audio>`
        : ''}
    <div class="cinema-screen" data-cinema-screen="true">
      ${renderPosterInnerHtml(deck, timeline, compact, options.manifestLookup)}
    </div>
  </section>`;
}
/**
 * Pauses all active `<audio>` elements, clears playback intervals, and cancels fallback speechSynthesis on route changes.
 */
export function disposeActiveCinemaPlayers() {
    for (const dispose of activeDisposers) {
        dispose();
    }
    activeDisposers.clear();
    stopFallbackSpeech();
}
/**
 * Hydrates all `[data-cinema-deck]` single-frame players currently mounted in the DOM.
 */
export function bindCinemaPlayersInDom(manifest_lookup) {
    if (typeof document === 'undefined')
        return;
    const hosts = Array.from(document.querySelectorAll('[data-cinema-deck]'));
    for (const host of hosts) {
        if (host.dataset.cinemaBound === 'true')
            continue;
        const deck_id = host.dataset.cinemaDeck || '';
        const deck = registeredDecks.get(deck_id);
        if (!deck)
            continue;
        host.dataset.cinemaBound = 'true';
        const compact = host.dataset.cinemaCompact === 'true';
        const timeline = computeDeckTimeline(deck);
        const screen_el = host.querySelector('[data-cinema-screen]');
        const audio_el = host.querySelector('audio.cinema-audio-el');
        if (!screen_el)
            continue;
        let status = 'idle';
        let current_time = 0;
        let speed = 1;
        let muted = false;
        let captions_on = true;
        let fallback_clock = !deck.audio;
        let timer_id;
        let last_rendered_scene = -1;
        let last_spoken_scene = -1;
        let pending_seek_sec = null;
        let last_audio_time = 0;
        const resolveSceneIdx = (t) => {
            let idx = 0;
            for (let i = 0; i < timeline.starts.length; i++) {
                if (t >= (timeline.starts[i] ?? 0) - 0.02)
                    idx = i;
            }
            return idx;
        };
        const computeSceneProgress = (idx, t) => {
            if (status === 'idle')
                return 0.75;
            if (status === 'ended')
                return 1;
            const start = timeline.starts[idx] ?? 0;
            const end = timeline.ends[idx] ?? timeline.total;
            const span = Math.max(0.5, end - start);
            return Math.min(1, Math.max(0, (t - start) / span));
        };
        const clearTickTimer = () => {
            if (timer_id !== undefined) {
                window.clearInterval(timer_id);
                timer_id = undefined;
            }
        };
        const updateFastTickDom = (scene_idx, scene_progress) => {
            const fill_units = timeline.total > 0
                ? Math.min(CINEMA_SCRUBBER_MAX, Math.max(0, Math.round((current_time / timeline.total) * CINEMA_SCRUBBER_MAX)))
                : 0;
            const fill_rect = screen_el.querySelector('[data-cinema-fill-rect]');
            if (fill_rect)
                fill_rect.setAttribute('width', String(fill_units));
            const range_el = screen_el.querySelector('[data-cinema-range]');
            if (range_el && document.activeElement !== range_el) {
                range_el.value = String(fill_units);
            }
            const time_el = screen_el.querySelector('[data-cinema-time]');
            if (time_el) {
                time_el.textContent = `${formatCinemaTime(current_time)} / ${formatCinemaTime(timeline.total)}`;
            }
            const stage_canvas = screen_el.querySelector('[data-cinema-stage-canvas]');
            const current_scene = deck.scenes[scene_idx];
            if (stage_canvas && current_scene) {
                stage_canvas.innerHTML = renderStageVisualHtml(current_scene.visual, scene_progress);
            }
        };
        const renderFullScreen = () => {
            const scene_idx = resolveSceneIdx(current_time);
            const current_scene = deck.scenes[scene_idx] ?? deck.scenes[0];
            host.className = `arquibot-cinema aura-${current_scene.aura} ${compact ? 'is-compact' : ''} is-${status}`;
            if (status === 'idle') {
                last_rendered_scene = -1;
                screen_el.innerHTML = renderPosterInnerHtml(deck, timeline, compact, manifest_lookup);
                return;
            }
            last_rendered_scene = scene_idx;
            screen_el.innerHTML = renderActiveScreenInnerHtml({
                deck,
                timeline,
                status,
                currentTime: current_time,
                sceneIdx: scene_idx,
                sceneProgress: computeSceneProgress(scene_idx, current_time),
                speed,
                muted,
                captionsOn: captions_on,
                compact,
                manifestLookup: manifest_lookup,
            });
        };
        const syncFallbackNarration = (scene_idx) => {
            if (deck.audio)
                return;
            if (status !== 'playing' || muted) {
                stopFallbackSpeech();
                return;
            }
            if (last_spoken_scene !== scene_idx) {
                last_spoken_scene = scene_idx;
                const sc = deck.scenes[scene_idx];
                if (sc)
                    speakFallbackTurn(sc.speech, speed);
            }
        };
        const applyAudioTimeSafely = (target_sec) => {
            if (!deck.audio || !audio_el)
                return true;
            if (audio_el.readyState >= 1) {
                try {
                    audio_el.currentTime = target_sec;
                    if (Math.abs(audio_el.currentTime - target_sec) <= 0.6) {
                        last_audio_time = audio_el.currentTime;
                        pending_seek_sec = null;
                        return true;
                    }
                }
                catch {
                    /* seekable range still buffering */
                }
            }
            pending_seek_sec = target_sec;
            return false;
        };
        const startClockLoop = () => {
            clearTickTimer();
            last_audio_time = audio_el?.currentTime ?? current_time;
            let stalled_ticks = 0;
            timer_id = window.setInterval(() => {
                if (status !== 'playing')
                    return;
                if (deck.audio && audio_el && !fallback_clock && !audio_el.error) {
                    if (pending_seek_sec !== null) {
                        if (!applyAudioTimeSafely(pending_seek_sec)) {
                            stalled_ticks += 1;
                            if (stalled_ticks >= CINEMA_STALL_TICKS_LIMIT) {
                                fallback_clock = true;
                                pending_seek_sec = null;
                            }
                            else {
                                return;
                            }
                        }
                        else {
                            stalled_ticks = 0;
                        }
                    }
                    if (!fallback_clock) {
                        const t = audio_el.currentTime;
                        if (Math.abs(t - last_audio_time) < 0.001) {
                            stalled_ticks += 1;
                            if (stalled_ticks >= CINEMA_STALL_TICKS_LIMIT) {
                                fallback_clock = true;
                            }
                        }
                        else {
                            stalled_ticks = 0;
                            last_audio_time = t;
                            current_time = t;
                            if (audio_el.ended || t >= timeline.total - 0.05) {
                                current_time = timeline.total;
                                status = 'ended';
                                clearTickTimer();
                                renderFullScreen();
                                return;
                            }
                            const next_scene = resolveSceneIdx(current_time);
                            if (next_scene !== last_rendered_scene) {
                                renderFullScreen();
                            }
                            else {
                                updateFastTickDom(next_scene, computeSceneProgress(next_scene, current_time));
                            }
                            return;
                        }
                    }
                }
                current_time = Math.min(timeline.total, current_time + (CINEMA_TICK_MS / 1000) * speed);
                const next_scene = resolveSceneIdx(current_time);
                syncFallbackNarration(next_scene);
                if (current_time >= timeline.total) {
                    current_time = timeline.total;
                    status = 'ended';
                    clearTickTimer();
                    stopFallbackSpeech();
                    renderFullScreen();
                    return;
                }
                if (next_scene !== last_rendered_scene) {
                    renderFullScreen();
                }
                else {
                    updateFastTickDom(next_scene, computeSceneProgress(next_scene, current_time));
                }
            }, CINEMA_TICK_MS);
        };
        const startOrTogglePlay = () => {
            if (status === 'playing') {
                audio_el?.pause();
                stopFallbackSpeech();
                clearTickTimer();
                status = 'paused';
                renderFullScreen();
                return;
            }
            const is_restart = status === 'ended' || current_time >= timeline.total - 0.08;
            if (is_restart) {
                current_time = 0;
                last_spoken_scene = -1;
            }
            status = 'playing';
            if (deck.audio && audio_el) {
                try {
                    applyAudioTimeSafely(current_time);
                    audio_el.playbackRate = speed;
                    audio_el.muted = muted;
                    const play_promise = audio_el.play();
                    if (play_promise && typeof play_promise.catch === 'function') {
                        play_promise.catch(() => {
                            fallback_clock = true;
                            pending_seek_sec = null;
                        });
                    }
                }
                catch {
                    fallback_clock = true;
                    pending_seek_sec = null;
                }
            }
            else {
                syncFallbackNarration(resolveSceneIdx(current_time));
            }
            renderFullScreen();
            startClockLoop();
        };
        const seekTo = (target_sec) => {
            const clamped = Math.max(0, Math.min(timeline.total, target_sec));
            current_time = clamped;
            last_spoken_scene = -1;
            applyAudioTimeSafely(clamped);
            if (status === 'idle' || status === 'ended') {
                status = 'playing';
                if (deck.audio && audio_el) {
                    try {
                        audio_el.playbackRate = speed;
                        audio_el.muted = muted;
                        const p = audio_el.play();
                        if (p && typeof p.catch === 'function') {
                            p.catch(() => {
                                fallback_clock = true;
                                pending_seek_sec = null;
                            });
                        }
                    }
                    catch {
                        fallback_clock = true;
                        pending_seek_sec = null;
                    }
                }
                startClockLoop();
            }
            syncFallbackNarration(resolveSceneIdx(clamped));
            renderFullScreen();
        };
        if (audio_el) {
            const flushPendingSeek = () => {
                if (pending_seek_sec !== null) {
                    applyAudioTimeSafely(pending_seek_sec);
                }
            };
            audio_el.addEventListener('loadedmetadata', flushPendingSeek);
            audio_el.addEventListener('canplay', flushPendingSeek);
            audio_el.addEventListener('ended', () => {
                current_time = timeline.total;
                status = 'ended';
                clearTickTimer();
                renderFullScreen();
            });
        }
        screen_el.addEventListener('click', (ev) => {
            const target = ev.target;
            if (!target)
                return;
            if (target.closest('[data-cinema-play-poster]') || target.closest('[data-cinema-toggle-play]')) {
                startOrTogglePlay();
                return;
            }
            const jump_btn = target.closest('[data-cinema-jump]');
            if (jump_btn) {
                const idx = Math.max(0, Math.min(deck.scenes.length - 1, Number(jump_btn.dataset.cinemaJump || '0')));
                const cue_sec = idx === 0 ? 0 : (timeline.starts[idx] ?? 0) + 0.03;
                seekTo(cue_sec);
                return;
            }
            if (target.closest('[data-cinema-toggle-cc]')) {
                captions_on = !captions_on;
                renderFullScreen();
                screen_el.querySelector('[data-cinema-toggle-cc]')?.focus();
                return;
            }
            if (target.closest('[data-cinema-cycle-speed]')) {
                const next_idx = (CINEMA_PLAYBACK_SPEEDS.indexOf(speed) + 1) % CINEMA_PLAYBACK_SPEEDS.length;
                speed = CINEMA_PLAYBACK_SPEEDS[next_idx] ?? 1;
                if (audio_el)
                    audio_el.playbackRate = speed;
                renderFullScreen();
                screen_el.querySelector('[data-cinema-cycle-speed]')?.focus();
                return;
            }
            if (target.closest('[data-cinema-toggle-mute]')) {
                muted = !muted;
                if (audio_el)
                    audio_el.muted = muted;
                if (muted)
                    stopFallbackSpeech();
                renderFullScreen();
                screen_el.querySelector('[data-cinema-toggle-mute]')?.focus();
                return;
            }
            if (target.closest('[data-cinema-fullscreen]')) {
                if (document.fullscreenElement) {
                    void document.exitFullscreen?.();
                }
                else {
                    void screen_el.requestFullscreen?.();
                }
                return;
            }
            const scroll_btn = target.closest('[data-cinema-scroll]');
            if (scroll_btn?.dataset.cinemaScroll) {
                document.getElementById(scroll_btn.dataset.cinemaScroll)?.scrollIntoView({ behavior: 'smooth' });
            }
        });
        screen_el.addEventListener('input', (ev) => {
            const target = ev.target;
            if (!target || target.dataset.cinemaRange !== 'true')
                return;
            const ratio = Number(target.value) / CINEMA_SCRUBBER_MAX;
            seekTo(ratio * timeline.total);
            screen_el.querySelector('[data-cinema-range]')?.focus();
        });
        screen_el.addEventListener('keydown', (ev) => {
            const target = ev.target;
            if (!target || target.dataset.cinemaRange !== 'true')
                return;
            if (ev.key === 'ArrowRight') {
                ev.preventDefault();
                seekTo(current_time + CINEMA_KEYBOARD_SEEK_SEC);
                screen_el.querySelector('[data-cinema-range]')?.focus();
            }
            else if (ev.key === 'ArrowLeft') {
                ev.preventDefault();
                seekTo(current_time - CINEMA_KEYBOARD_SEEK_SEC);
                screen_el.querySelector('[data-cinema-range]')?.focus();
            }
        });
        const dispose = () => {
            clearTickTimer();
            if (audio_el) {
                audio_el.pause();
            }
            stopFallbackSpeech();
        };
        activeDisposers.add(dispose);
    }
}
