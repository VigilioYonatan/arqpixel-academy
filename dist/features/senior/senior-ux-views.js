/**
 * Minimalist Senior Mode UX/UI views, Seed Reproducer (`L2610`), Immutable Criteria Snapshot (`L2611`),
 * 5-State Canonical Check Audit (`PASS / FAIL / NOT_RUN / BLOCKED / REQUIRES_REVIEW`, `L2612`),
 * 18-Mission Separated Criteria Matrix (`L2609`), and Live SVG Architecture Builder Diagram.
 * Follows `vigilio-docs` (`ui-art-direction`, `ui-interaction-motion`, `ux-accessibility`, `ADR-0003`).
 */
import { renderPixelNavIconSvg } from '../shared/ui/visual-clarity.js';
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
function normalizeSearch(v) {
    return v
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}
/**
 * Validates and clamps a reproducible Senior seed into `[0, 1_000_000]` (`§21.4 L2610`).
 */
export function sanitizeSeniorSeed(raw, fallback = 0) {
    const num = typeof raw === 'string' && raw.trim() !== '' ? Number(raw.trim()) : Number(raw);
    if (!Number.isFinite(num))
        return fallback;
    const rounded = Math.trunc(num);
    if (rounded < 0 || rounded > 1_000_000) {
        return Math.max(0, Math.min(1_000_000, rounded));
    }
    return rounded;
}
/**
 * Computes a deterministic FNV-1a 32-bit fingerprint of a mission's criteria for `(mission_id, seed)`
 * so callers and learners can verify criteria NEVER mutate before/after delivery (`§21.4 L2611`).
 */
export function computeCriteriaSnapshotFingerprint(input) {
    const canonical = JSON.stringify([
        input.missionId,
        input.seed,
        input.traffic,
        input.availability,
        input.team,
        input.budget,
        input.failure,
        [...input.requiredComponents],
        input.diagnosisCorrect,
        input.incidentCorrect,
        input.targetCapacity,
    ]);
    let hash = 0x811c9dc5;
    for (let i = 0; i < canonical.length; i++) {
        hash ^= canonical.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}
/**
 * Maps Senior Suite evaluation into the strict 5-state canonical contract
 * `PASS | FAIL | NOT_RUN | BLOCKED | REQUIRES_REVIEW` (`§21.4 L2612`).
 * Qualitative ADR/mentor checks NEVER become `PASS` via automated/AI heuristics (`ADR-0003`).
 */
export function buildCanonicalSeniorGateMatrix(input) {
    const mapped_base = input.baseChecks.map((chk, idx) => {
        const raw = chk.status;
        const normalized_status = raw === 'PASS' ||
            raw === 'FAIL' ||
            raw === 'NOT_RUN' ||
            raw === 'BLOCKED' ||
            raw === 'REQUIRES_REVIEW'
            ? raw
            : 'NOT_RUN';
        return {
            id: `act-0${idx + 1}`,
            label: chk.name,
            status: normalized_status,
            detail: chk.detail,
        };
    });
    // Dependent Gate: Fase 2 crisis response is BLOCKED if attempted when Fase 1 has 0 components selected
    const phase2_status = input.phase2Choice < 0
        ? 'NOT_RUN'
        : input.selectedComponentsCount === 0
            ? 'BLOCKED'
            : input.phase2RawStatus;
    const phase2_detail = phase2_status === 'BLOCKED'
        ? 'Bloqueado: selecciona y conecta primero entre 2 y 4 componentes en Fase 1 (Architecture Builder).'
        : input.phase2Feedback;
    // Qualitative Human Review Gate: BLOCKED until structural ADR passes; thereafter strictly REQUIRES_REVIEW
    const human_gate_status = input.adrDecisionOk
        ? 'REQUIRES_REVIEW'
        : 'BLOCKED';
    return Object.freeze([
        ...mapped_base,
        {
            id: 'phase-2-crisis',
            label: 'Resistencia en Fase 2 encadenada',
            status: phase2_status,
            detail: phase2_detail,
        },
        {
            id: 'qualitative-adr-review',
            label: 'Juicio arquitectónico abierto (Mentor / Comité)',
            status: human_gate_status,
            detail: input.adrDecisionOk
                ? 'Estructura completa; requiere revisión humana experta (jamás aprobado automáticamente por IA).'
                : 'Bloqueado hasta completar un ADR con restricciones reales, trade-offs y plan de verificación.',
        },
    ]);
}
export function renderSeedReproducerBarHtml(options) {
    const { idPrefix, missionId, activeSeed, savedSeed, criteriaFingerprint } = options;
    return `<div class="seed-reproducer-bar" role="region" aria-label="Control de semilla reproducible y criterios inmutables">
    <div class="live-status-group">
      <span class="live-status-pill"><i class="live-dot" aria-hidden="true"></i> VARIANTE REPRODUCIBLE · ${esc(missionId)}</span>
      <span class="map-badge" data-criteria-fingerprint="${esc(criteriaFingerprint)}">🔒 Criterios fijos: <code>${esc(criteriaFingerprint)}</code></span>
    </div>
    <div class="seed-controls-group">
      <label class="seed-inline-label" for="${idPrefix}-seed-input">Seed (0–1000000)
        <input id="${idPrefix}-seed-input" type="number" min="0" max="1000000" step="1" value="${activeSeed}"/>
      </label>
      <button type="button" class="btn secondary small" id="${idPrefix}-apply-seed">Reproducir seed</button>
      ${savedSeed !== undefined && savedSeed !== activeSeed
        ? `<button type="button" class="btn secondary small" id="${idPrefix}-restore-saved-seed">Cargar seed guardado (${savedSeed})</button>`
        : ''}
      <button type="button" class="btn secondary small" id="${idPrefix}-next-seed">↻ Siguiente seed</button>
    </div>
  </div>`;
}
/**
 * Live minimalist SVG visualizer for `02 / 06 Architecture Builder` in `#/taller-senior/:id`.
 */
export function renderSeniorBuilderGraphSvgHtml(selected, relations, required) {
    if (selected.length === 0) {
        return `<svg class="senior-pipeline-svg" viewBox="0 0 680 94" role="img" aria-label="Grafo Senior vacío">
      <rect width="680" height="94" rx="12" fill="#071628" stroke="#1b3f5c"/>
      <text x="340" y="44" text-anchor="middle" fill="#9beeff" font-size="12" font-weight="bold" font-family="sans-serif">Marca entre 2 y 4 componentes arriba para visualizar tu topología en vivo</text>
      <text x="340" y="66" text-anchor="middle" fill="#8bb0c9" font-size="10.5" font-family="monospace">Esenciales sugeridos en esta misión: ${esc(required.join(' + '))}</text>
    </svg>`;
    }
    const coords = new Map();
    const cols = Math.min(4, selected.length);
    selected.forEach((comp, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const step_x = cols > 1 ? 490 / (cols - 1) : 0;
        const x = cols === 1 ? 340 : 95 + Math.round(col * step_x);
        const y = selected.length > 4 ? 46 + row * 72 : 66;
        coords.set(comp, { x, y });
    });
    const svg_h = selected.length > 4 ? 164 : 132;
    const edges_svg = relations
        .map(([from, to], idx) => {
        const a = coords.get(from);
        const b = coords.get(to);
        if (!a || !b)
            return '';
        const mid_x = Math.round((a.x + b.x) / 2);
        const curve_y = Math.max(14, Math.min(a.y, b.y) - 34 - (idx % 2) * 10);
        return `<path d="M ${a.x} ${a.y - 20} Q ${mid_x} ${curve_y} ${b.x} ${b.y - 20}" class="arch-flow-edge" fill="none" stroke="#16e1ee" stroke-width="2.1" marker-end="url(#sr-graph-arrow)"/>`;
    })
        .join('');
    const nodes_svg = selected
        .map((comp) => {
        const pt = coords.get(comp);
        const is_req = required.includes(comp);
        return `<g>
        <rect x="${pt.x - 72}" y="${pt.y - 22}" width="144" height="44" rx="10" fill="${is_req ? '#0d3648' : '#0b2239'}" stroke="${is_req ? '#53e2ba' : '#18e1ee'}" stroke-width="1.6"/>
        <text x="${pt.x}" y="${pt.y - 2}" text-anchor="middle" fill="#f2fbff" font-size="11" font-weight="bold" font-family="sans-serif">${esc(comp.slice(0, 20))}</text>
        <text x="${pt.x}" y="${pt.y + 13}" text-anchor="middle" fill="#8fd8f2" font-size="9" font-family="monospace">${is_req ? '★ Esencial misión' : 'Componente activo'}</text>
      </g>`;
    })
        .join('');
    return `<svg class="senior-pipeline-svg" viewBox="0 0 680 ${svg_h}" role="img" aria-label="Diagrama en vivo de ${selected.length} componentes seleccionados y ${relations.length} relaciones">
    <defs>
      <marker id="sr-graph-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 z" fill="#16e1ee"/>
      </marker>
    </defs>
    <rect width="680" height="${svg_h}" rx="12" fill="#071628"/>
    ${edges_svg}
    ${nodes_svg}
  </svg>`;
}
export function renderSeniorAlternativesComparisonHtml(options) {
    return `<div class="c4-accessible-summary mt-14" data-senior-alternatives="true" role="region" aria-label="Comparativa de alternativas, consecuencias y justificación">
    <h4>⚖ Alternativas, consecuencias y justificación (${esc(options.heading)})</h4>
    <ul>
      ${options.choices
        .map((opt, idx) => {
        const is_ref = idx === options.recommendedIndex;
        const is_picked = idx === options.chosenIndex;
        const tag = is_ref
            ? '✓ Opción defendible de referencia'
            : '⚠ Consecuencia adversa / riesgo operativo';
        return `<li><strong>Opción ${String.fromCharCode(65 + idx)}${is_picked ? ' (Tu elección)' : ''}:</strong> ${esc(opt)} — <b>${tag}</b></li>`;
    })
        .join('')}
    </ul>
    <p><strong>Justificación contextual:</strong> ${esc(options.justification)}</p>
    <p class="muted"><strong>Antipatrón crítico a evitar:</strong> ${esc(options.antipatternWarning)} · Ningún criterio cualitativo es certificado por IA (<code>REQUIRES_REVIEW</code>).</p>
  </div>`;
}
/**
 * Renders the reasoned solution guide and defensible trade-off alternatives for a Senior mission
 * (`§21.4 L2613–L2614` & `§23 L2694`), explicitly separating deterministic verification from open
 * human architectural judgment (`REQUIRES_REVIEW`).
 */
export function renderSeniorReasonedSolutionGuideHtml(options) {
    const { missionId, missionTitle, missionDecision, seed, traffic, availability, team, budget, failure, playbook, targetCapacityRpm, } = options;
    const req_pair = `${playbook.required[0]} → ${playbook.required[1]}`;
    const cap_clause = typeof targetCapacityRpm === 'number' && targetCapacityRpm > 0
        ? ` y margen operativo >= ${targetCapacityRpm.toLocaleString('es')} req/min`
        : '';
    return `<details class="lesson-card mt-14" data-senior-solution-guide="true">
    <summary class="cursor-pointer"><strong>🧭 Guía de solución razonada y alternativas defendibles (${esc(missionId)} — ${esc(missionTitle)} · Seed ${seed})</strong></summary>
    <div class="mt-12">
      <p><strong>1. Estrategia defendible bajo restricciones actuales (${esc(traffic)}, SLO ${esc(availability)}, ${esc(team)}, presupuesto ${esc(budget)}):</strong> ${esc(missionDecision)}. Articula el flujo acíclico <code>${esc(req_pair)}</code>${esc(cap_clause)} para contener «${esc(failure)}».</p>
      <p><strong>2. Cuándo otra alternativa SÍ sería defendible (pensamiento no dogmático):</strong></p>
      <ul>
        <li><strong>Alternativa incremental / menor coste operativo:</strong> defendible si el tráfico cae por debajo de 2.000 req/min, el SLO tolera ventanas de mantenimiento programadas (&lt; 99,5 %) o el equipo (${esc(team)}) no puede absorber guardias 24x7 sobre infraestructura distribuida adicional.</li>
        <li><strong>Alternativa de aislamiento reforzado / multi-región:</strong> defendible únicamente cuando el impacto financiero por minuto de indisponibilidad supera el sobrecoste de replicación, observabilidad y pruebas de caos continuas.</li>
      </ul>
      <p><strong>3. Evidencia verificable y prueba de aceptación:</strong> ${esc(playbook.verification)} · Entregable: <code>${esc(playbook.artifact)}</code>.</p>
      <p><strong>4. Antipatrón descartado:</strong> ${esc(playbook.failureMode)}</p>
      <p class="muted" data-no-ai-approval="true">⚖ Honestidad ADR-0003: ningún criterio cualitativo se marca «aprobado por IA»; la argumentación abierta conserva siempre <code>REQUIRES_REVIEW</code> hasta dictamen humano.</p>
    </div>
  </details>`;
}
export function resolveMissionTier(index) {
    if (index >= 12)
        return 'CRITICO';
    if (index >= 6)
        return 'AVANZADO';
    return 'PROFESIONAL';
}
export function filterSeniorMissions(missions, playbooks, tier, query) {
    const norm_q = normalizeSearch(query);
    return missions
        .map((mission, index) => ({
        mission,
        index,
        tier: resolveMissionTier(index),
    }))
        .filter((item) => {
        if (tier !== 'ALL' && item.tier !== tier)
            return false;
        if (!norm_q)
            return true;
        const pb = playbooks[item.mission.id];
        const hay = normalizeSearch(`${item.mission.id} ${item.mission.title} ${item.mission.brief} ${pb?.focus ?? ''} ${pb?.required.join(' ') ?? ''} ${pb?.artifact ?? ''}`);
        return hay.includes(norm_q);
    });
}
/**
 * Renders the `#/senior` dashboard with 18 clearly distinguishable missions, separated engineering
 * criteria per mission (`L2609`), saved seed badges (`L2610`), and minimalist live telemetry.
 */
export function renderSeniorDashboardHtml(options) {
    const { missions, playbooks, savedMissions, tierFilter, searchQuery, heroSpriteHtml } = options;
    const filtered = filterSeniorMissions(missions, playbooks, tierFilter, searchQuery);
    const attempted_count = Object.keys(savedMissions).length;
    const awarded_count = Object.values(savedMissions).filter((m) => m.awarded).length;
    return `<div class="page-title">
    <span class="eyebrow crown-color">${renderPixelNavIconSvg('senior', 14)} EL CAMINO DEL ARQUITECTO SENIOR</span>
    <h1>Senior Mode <span class="gradient-text">/ Production Lab</span></h1>
    <p>18 misiones identificables (S01–S18) × 6 actividades conectadas (108 retos) con criterios separados por misión, variantes reproducibles por seed e invariantes deterministas.</p>
  </div>

  <div class="senior-hero">
    <div>
      <span class="eyebrow">♛ DISEÑA BAJO PRESIÓN REAL</span>
      <h2>Elige. Justifica. Verifica. Evoluciona.</h2>
      <p>Cada check reporta honestamente <code>PASS / FAIL / NOT_RUN / BLOCKED / REQUIRES_REVIEW</code>. Ningún criterio abierto se marca «aprobado por IA».</p>
      <div class="hero-tags"><span>18 misiones con criterios propios</span><span>Seed 0–1.000.000 reproducible</span><span>Criterios inmutables tras entrega</span></div>
    </div>
    ${heroSpriteHtml}
  </div>

  <section class="live-blueprint-shell mt-22" aria-label="Telemetría y filtro de las 18 misiones Senior">
    <div class="live-blueprint-topbar">
      <div class="live-status-group">
        <span class="live-status-pill"><i class="live-dot" aria-hidden="true"></i> MATRIZ DE PRODUCCIÓN S01–S18</span>
        <span class="map-badge">${attempted_count}/${missions.length} intentadas · ${awarded_count} validadas estructuralmente</span>
      </div>
      <div class="blueprint-tabs" role="group" aria-label="Filtrar misiones por criticidad">
        ${[
        ['ALL', 'Todas (18)'],
        ['PROFESIONAL', 'Profesional (S01–S06)'],
        ['AVANZADO', 'Avanzado (S07–S12)'],
        ['CRITICO', 'Crítico (S13–S18)'],
    ]
        .map(([id, label]) => `<button type="button" class="blueprint-tab ${tierFilter === id ? 'active' : ''}" data-senior-tier="${id}" aria-pressed="${tierFilter === id ? 'true' : 'false'}">${label}</button>`)
        .join('')}
      </div>
    </div>
    <div class="live-blueprint-body">
      <div class="tabular-metrics-grid">
        <div class="tabular-metric-cell"><span>MISIONES ÚNICAS</span><b>18 playbooks distintos</b></div>
        <div class="tabular-metric-cell"><span>REPRODUCIBILIDAD</span><b>FNV-1a · Seed guardado</b></div>
        <div class="tabular-metric-cell"><span>ESTADOS DE CHECK</span><b>5 estados · REQUIRES_REVIEW</b></div>
        <div class="tabular-metric-cell"><span>JUICIO CUALITATIVO</span><b>100 % Humano (Sin IA mágica)</b></div>
      </div>
      <label class="field-label m-0">Buscar por código, patrón, componente requerido o entregable
        <input id="senior-search-query" type="search" value="${esc(searchQuery)}" placeholder="Ej. S09, Outbox, Idempotencia, FinOps, STRIDE, Canary..." maxlength="60"/>
      </label>
    </div>
  </section>

  <div class="section-head">
    <h2>Misiones de producción (${filtered.length} visibles)</h2>
    <span class="muted">Cada misión exige componentes, evidencia y antipatrón diferenciados</span>
  </div>

  ${filtered.length === 0
        ? `<section class="lesson-card" data-ui-state="empty"><h3>Ninguna misión coincide con «${esc(searchQuery)}»</h3><p class="muted">Limpia el filtro para explorar las 18 misiones Senior.</p></section>`
        : `<div class="missions-grid">
          ${filtered
            .map(({ mission, tier }) => {
            const pb = playbooks[mission.id];
            const saved = savedMissions[mission.id];
            const tier_label = tier === 'CRITICO' ? 'CRÍTICO' : tier;
            return `<article class="mission-card senior-mission-card" data-mission-card="${esc(mission.id)}">
                <div class="level-ghost-num" aria-hidden="true">${esc(mission.id.slice(1))}</div>
                <div class="map-node-top">
                  <span class="mission-index">${esc(mission.id)} · ${tier_label}</span>
                  <span class="map-badge sr-score">${saved ? `✓ Seed ${saved.seed} (${saved.score} pt)` : '◌ Disponible'}</span>
                </div>
                <h3>${esc(mission.title)}</h3>
                <p>${esc(mission.brief)}</p>
                ${pb
                ? `<div class="senior-criteria-box">
                        <small><b>◈ Foco:</b> ${esc(pb.focus)}</small>
                        <small><b>⬡ Componentes clave:</b> ${esc(pb.required.join(' + '))}</small>
                        <small><b>▤ Entregable:</b> ${esc(pb.artifact)}</small>
                      </div>`
                : ''}
                <div class="mission-footer mt-12">
                  <a class="text-link" href="#/mision/${esc(mission.id)}${saved ? `?seed=${saved.seed}` : ''}">Brief ADR ↗</a>
                  <a class="btn primary small" href="#/taller-senior/${esc(mission.id)}${saved ? `?seed=${saved.seed}` : ''}">Taller 6 retos ↗</a>
                </div>
              </article>`;
        })
            .join('')}
        </div>`}`;
}
export function renderMissionBriefWorkspaceHtml(options) {
    const { mission, totalMissionsCount, activeSeed, savedSeed, savedAdr, criteriaFingerprint, scenario, choices, hintDrawerHtml, sideSpriteHtml, workshopCtaLabel, } = options;
    return `<div class="backline"><a href="#/senior">← Volver a Senior Mode</a><span>MISIÓN ${esc(mission.id)} / ${totalMissionsCount}</span></div>
  <div class="page-title"><span class="eyebrow crown-color">♛ MISIÓN SENIOR · ESCENARIO REPRODUCIBLE</span><h1>${esc(mission.title)}</h1><p>${esc(mission.brief)}</p></div>
  ${renderSeedReproducerBarHtml({
        idPrefix: 'mission',
        missionId: mission.id,
        activeSeed,
        savedSeed,
        criteriaFingerprint,
    })}
  <div class="mission-layout">
    <div>
      <div class="mission-brief">
        <div class="brief-heading"><h2>01 · Brief de producción</h2><button class="btn secondary small" id="refresh-case">↻ Nueva variante</button></div>
        <p>${esc(mission.brief)} El objetivo es tomar una decisión defendible bajo las siguientes restricciones.</p>
        <div class="constraints">
          <div><span>TRÁFICO</span><b>${esc(scenario.traffic)}</b></div>
          <div><span>SLO OBJETIVO</span><b>${esc(scenario.availability)}</b></div>
          <div><span>EQUIPO</span><b>${esc(scenario.team)}</b></div>
          <div><span>PRESUPUESTO</span><b>${esc(scenario.budget)}</b></div>
        </div>
        <div class="incident-alert">⚡ Señal de incidente: ${esc(scenario.failure)}.</div>
        <small>Seed ${activeSeed} · Huella inmutable de criterios: <code>${esc(criteriaFingerprint)}</code>.</small>
      </div>
      <section class="lesson-card">
        <span class="overline">02 / DECISIÓN</span>
        <h2>Selecciona una estrategia</h2>
        <p>Prioriza una opción considerando las restricciones de este escenario. Una alternativa está diseñada como recomendación educativa, no como verdad universal.</p>
        ${hintDrawerHtml}
        <div class="question-box">
          ${choices.map((opt, i) => `<button class="option" data-senior-option="${i}"><span>${String.fromCharCode(65 + i)}</span>${esc(opt)}</button>`).join('')}
        </div>
        <div id="senior-feedback"></div>
      </section>
      <section class="lesson-card">
        <span class="overline">03 / EVIDENCIA</span>
        <h2>Escribe un ADR</h2>
        <p>Documenta contexto, la alternativa elegida, al menos un trade-off y cómo verificarías el éxito. Mínimo 160 caracteres para la comprobación estructural.</p>
        <textarea id="senior-adr" rows="8" class="note-area" aria-label="ADR de la misión Senior" placeholder="Contexto: ...\nDecisión: ...\nAlternativa descartada: ...\nRiesgos: ...\nEstrategia de verificación: ...">${esc(savedAdr)}</textarea>
        <div class="inline-actions">
          <button class="btn primary" id="evaluate-mission">Evaluar evidencia</button>
          <button class="btn secondary" id="export-mission">Exportar ADR</button>
          <a class="btn primary" href="#/taller-senior/${esc(mission.id)}?seed=${activeSeed}">${esc(workshopCtaLabel)}</a>
          ${['S04', 'S06', 'S09'].includes(mission.id) ? '<a class="btn secondary small" href="#/proyectos">📦 Ver repo ejecutable NexoShop (NestJS) →</a>' : ''}
        </div>
        <div id="mission-score"></div>
      </section>
    </div>
    <aside class="lesson-aside">
      <div class="aside-panel senior-side">${sideSpriteHtml}<h3>Tu comité de arquitectura</h3><p>Decisión central: ${esc(mission.decision)}</p><hr/><p><b>Evidencia esperada:</b><br>${esc(mission.evidence)}</p></div>
      <div class="aside-panel"><h3>Rúbrica visible</h3><p>▣ Estrategia · 30 pt</p><p>✎ ADR suficiente · 20 pt</p><p>◈ Riesgos / alternativas · 15 pt</p><p>✓ Verificación · 15 pt</p><p>◉ Contexto específico · 20 pt</p><small>Los últimos criterios son chequeos estructurales, no una evaluación profesional de calidad.</small></div>
    </aside>
  </div>`;
}
