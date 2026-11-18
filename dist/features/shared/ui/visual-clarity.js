const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
function firstSentence(text, max_chars = 135) {
    const clean = text.trim();
    const dot_idx = clean.indexOf('. ');
    const candidate = dot_idx > 20 ? `${clean.slice(0, dot_idx + 1)}` : clean;
    return candidate.length <= max_chars ? candidate : `${candidate.slice(0, max_chars - 1)}…`;
}
/**
 * Verifies real lesson content before allowing a module to appear as available or completed
 * (`§21.2`: never mark an empty/stub module as completed; mark it as `coming_soon`).
 */
export function resolveModuleContentReadiness(mod, completed_ids) {
    const has_real_content = typeof mod.lesson === 'string' &&
        mod.lesson.trim().length >= 40 &&
        typeof mod.question === 'string' &&
        mod.question.trim().length >= 10 &&
        Array.isArray(mod.options) &&
        mod.options.length >= 3;
    if (!has_real_content) {
        return 'coming_soon';
    }
    return completed_ids.includes(mod.id) ? 'completed' : 'available';
}
/**
 * Escapes raw text against XSS first, then formats inline backtick tokens as `<code class="inline-code-pill">`.
 */
export function formatSafeArchitecturalProseHtml(raw_text) {
    const escaped = esc(raw_text);
    return escaped.replace(/`([^`\r\n]{1,72})`/g, '<code class="inline-code-pill">$1</code>');
}
export function renderLessonExecutiveDigestHtml(mod, quiz_answered, workbench_done, lesson_completed) {
    const steps = [
        ['01', 'Idea y Diagrama', true],
        ['02', 'Taller 2/4', workbench_done],
        ['03', 'Decisión', quiz_answered],
        ['04', 'Aprobado', lesson_completed],
    ];
    return `<section class="visual-digest-strip" aria-label="Mapa rápido de la lección">
    <ol class="digest-stepper" aria-label="Pasos de aprendizaje de esta lección">
      ${steps
        .map(([num, label, ok]) => `<li class="digest-step ${ok ? 'done' : ''}"><span>${ok ? '✓' : num}</span><strong>${esc(label)}</strong></li>`)
        .join('')}
    </ol>
    <div class="digest-cards-grid">
      <div class="digest-mini-card">
        <span class="overline">◈ QUÉ RESUELVE</span>
        <p>${formatSafeArchitecturalProseHtml(firstSentence(mod.concept, 130))}</p>
      </div>
      <div class="digest-mini-card">
        <span class="overline">✓ CASO REAL NEXOSHOP</span>
        <p>${formatSafeArchitecturalProseHtml(firstSentence(mod.example, 130))}</p>
      </div>
      <div class="digest-mini-card">
        <span class="overline">⚖ SEÑAL VERIFICABLE</span>
        <p>${formatSafeArchitecturalProseHtml(firstSentence(mod.metric || mod.activity, 130))}</p>
      </div>
    </div>
  </section>`;
}
export function renderSeniorVisualFlowSvgHtml(mission_id, seed) {
    return `<section class="visual-digest-strip senior-flow-strip" aria-label="Mapa visual del flujo Senior Mode">
    <div class="digest-flow-head">
      <span class="overline">♛ GUÍA VISUAL RÁPIDA · ${esc(mission_id)} (SEED ${seed})</span>
      <small class="muted">Sigue estos 4 bloques en orden: el motor evalúa invariantes; el criterio abierto conserva revisión humana.</small>
    </div>
    <div class="map-svg-wrap" tabindex="0" role="region" aria-label="Diagrama de 4 etapas de evaluación Senior">
      <svg class="senior-pipeline-svg" viewBox="0 0 760 92" role="img" aria-label="Flujo Senior: 1 Diagnóstico y Grafo, 2 Incidente Encadenado y Trade-off, 3 Contratos y Seguridad, 4 ADR con Revisión Humana">
        <defs>
          <marker id="sr-flow-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="#16e1ee"/>
          </marker>
        </defs>
        <rect x="10" y="14" width="168" height="64" rx="11" fill="#0c263e" stroke="#16e1ee"/>
        <text x="94" y="38" text-anchor="middle" fill="#5ce1ff" font-size="11" font-weight="bold" font-family="sans-serif">01 · ARQUITECTURA</text>
        <text x="94" y="58" text-anchor="middle" fill="#d9f2ff" font-size="10" font-family="sans-serif">Diagnóstico + Grafo + RPS</text>

        <line x1="178" y1="46" x2="200" y2="46" class="arch-flow-edge" stroke="#16e1ee" stroke-width="2" marker-end="url(#sr-flow-arrow)"/>

        <rect x="204" y="14" width="168" height="64" rx="11" fill="#142242" stroke="#a481ff"/>
        <text x="288" y="38" text-anchor="middle" fill="#c4afff" font-size="11" font-weight="bold" font-family="sans-serif">02 · INCIDENTE VIVO</text>
        <text x="288" y="58" text-anchor="middle" fill="#d9f2ff" font-size="10" font-family="sans-serif">Cadena T0→T2 + Trade-off</text>

        <line x1="372" y1="46" x2="394" y2="46" class="arch-flow-edge" stroke="#16e1ee" stroke-width="2" marker-end="url(#sr-flow-arrow)"/>

        <rect x="398" y="14" width="168" height="64" rx="11" fill="#0d2b38" stroke="#53e2ba"/>
        <text x="482" y="38" text-anchor="middle" fill="#53e2ba" font-size="11" font-weight="bold" font-family="sans-serif">03 · DEFENSA &amp; CÓDIGO</text>
        <text x="482" y="58" text-anchor="middle" fill="#d9f2ff" font-size="10" font-family="sans-serif">Code Review + STRIDE</text>

        <line x1="566" y1="46" x2="588" y2="46" class="arch-flow-edge" stroke="#16e1ee" stroke-width="2" marker-end="url(#sr-flow-arrow)"/>

        <rect x="592" y="14" width="158" height="64" rx="11" fill="#292115" stroke="#ffd77c"/>
        <text x="671" y="38" text-anchor="middle" fill="#ffd77c" font-size="11" font-weight="bold" font-family="sans-serif">04 · JUICIO ADR</text>
        <text x="671" y="58" text-anchor="middle" fill="#fff3d1" font-size="10" font-family="sans-serif">REQUIRES_REVIEW</text>
      </svg>
    </div>
  </section>`;
}
export const HERO_LAYER_GRAPHIC_HTML = `<div class="arch-visual"><div class="floating-code">&lt;/&gt; <span>SYSTEM DESIGN</span></div><div class="layer-stack"><div class="stack-layer l1">▣ <span>Frontend</span><small>WEB / APP</small></div><div class="stack-layer l2">⌘ <span>Application</span><small>CASOS DE USO</small></div><div class="stack-layer l3">⬡ <span>Domain</span><small>REGLAS DE NEGOCIO</small></div><div class="stack-layer l4">▥ <span>Infrastructure</span><small>DATOS / SERVICIOS</small></div></div><span class="vis-node node-one">◈ SOLID</span><span class="vis-node node-two">⬡ DDD</span><span class="vis-node node-three">☁ CLOUD</span><span class="vis-node node-four">⌘ API</span><div class="visual-grid"></div></div>`;
export const HOME_LIVE_BLUEPRINTS = Object.freeze([
    {
        id: 'modular-monolith',
        tabLabel: '01 · Monolito Modular',
        badge: 'BAJA FRICCIÓN OPERATIVA',
        headline: 'Fronteras explícitas de módulos en un solo despliegue atómico',
        summary: 'Ideal para equipos de 3–10 ingenieros que necesitan velocidad de entrega y transacciones ACID locales sin pagar red distribuida prematura.',
        latencyP95: '18 ms',
        couplingIndex: '0.18 · Fronteras internas',
        teamOverhead: '1 pipeline · Bajo coste SRE',
        failureMode: 'Blast radius compartido en proceso',
        lessonHref: '#/aprender/I08',
        labHref: '#/laboratorio/dependencias',
        nodes: [
            ['API HTTP', 'Controlador fino'],
            ['Módulo Ventas', 'Caso de uso + Reglas'],
            ['Módulo Pagos', 'Contrato interno'],
            ['PostgreSQL', 'Esquemas aislados'],
        ],
        edgeLabels: ['DTO validado', 'Evento en memoria', 'ACID local'],
    },
    {
        id: 'hexagonal-ports',
        tabLabel: '02 · Hexagonal / Clean',
        badge: 'DOMINIO PURO TESTABLE',
        headline: 'El negocio define puertos; SQL, HTTP y colas son adaptadores reemplazables',
        summary: 'Protege invariantes críticas frente a cambios de proveedor o ORM permitiendo probar reglas de negocio en milisegundos sin levantar infraestructura.',
        latencyP95: '21 ms',
        couplingIndex: '0.00 · 0 imports ORM en Dominio',
        teamOverhead: 'Tests < 50 ms en memoria',
        failureMode: 'Mapeo extra si el CRUD es trivial',
        lessonHref: '#/aprender/I06',
        labHref: '#/laboratorio/ddd',
        nodes: [
            ['Adaptador REST', 'Entrada primaria'],
            ['Caso de Uso', 'Aplicación pura'],
            ['Agregado Pedido', 'Invariantes + Puerto'],
            ['Adaptador Stripe', 'Salida secundaria'],
        ],
        edgeLabels: ['Comando tipado', 'Regla pura', 'Implementa puerto'],
    },
    {
        id: 'outbox-events',
        tabLabel: '03 · Outbox + Eventos',
        badge: 'CONSISTENCIA EVENTUAL SEGURA',
        headline: 'Persistencia atómica de estado + evento con consumidores idempotentes',
        summary: 'Elimina la doble escritura fantasma entre base de datos y broker garantizando entrega at-least-once y deduplicación por event_id.',
        latencyP95: '42 ms + async',
        couplingIndex: '0.12 · Contrato versionado v1',
        teamOverhead: 'Relay + DLQ + Observabilidad',
        failureMode: 'Duplicados si falta tabla dedup',
        lessonHref: '#/aprender/A05',
        labHref: '#/laboratorio/distributed',
        nodes: [
            ['Checkout API', 'Idempotency-Key'],
            ['Pedidos + Outbox', '1 TX SQL atómica'],
            ['Relay / Broker', 'At-least-once'],
            ['Inventario', 'Consumer idempotente'],
        ],
        edgeLabels: ['TX única', 'CDC / Polling', 'Dedup event_id'],
    },
    {
        id: 'sre-circuit-breaker',
        tabLabel: '04 · Resiliencia SRE',
        badge: 'PROTECCIÓN DE ERROR BUDGET',
        headline: 'Timeouts acotados, Backoff + Jitter, Circuit Breaker y Bulkhead coordinados',
        summary: 'Impide que una pasarela externa degradada agote el pool de hilos y provoque una tormenta de reintentos sobre todo el comercio.',
        latencyP95: '85 ms degradado',
        couplingIndex: '0.09 · Fallo aislado por pool',
        teamOverhead: 'SLI/SLO + Alertas burn-rate',
        failureMode: 'Retry storm si no hay jitter',
        lessonHref: '#/aprender/A09',
        labHref: '#/laboratorio/incident',
        nodes: [
            ['Tráfico Pico', '3.5k req/s'],
            ['Bulkhead Pool', 'Aislamiento cuota'],
            ['Circuit Breaker', 'Timeout 400ms + Jitter'],
            ['Fallback Seguro', 'Encolado / Degradación'],
        ],
        edgeLabels: ['Límite cola', 'Fast-fail OPEN', 'Protege SLO 99.9%'],
    },
]);
export function renderHomeInteractiveBlueprintHtml(active_id) {
    const active = HOME_LIVE_BLUEPRINTS.find((item) => item.id === active_id) ?? HOME_LIVE_BLUEPRINTS[0];
    return `<section class="live-blueprint-shell" aria-label="Explorador interactivo de arquitecturas en vivo">
    <div class="live-blueprint-topbar">
      <div class="live-status-group">
        <span class="live-status-pill"><i class="live-dot" aria-hidden="true"></i> TELEMETRÍA DIDÁCTICA INTERACTIVA</span>
        <span class="map-badge">${esc(active.badge)}</span>
      </div>
      <div class="blueprint-tabs" role="group" aria-label="Cambiar topología arquitectónica">
        ${HOME_LIVE_BLUEPRINTS.map((bp) => {
        const is_selected = bp.id === active.id;
        return `<button type="button" class="blueprint-tab ${is_selected ? 'active' : ''}" data-blueprint-tab="${esc(bp.id)}" aria-pressed="${is_selected ? 'true' : 'false'}">${esc(bp.tabLabel)}</button>`;
    }).join('')}
      </div>
    </div>

    <div class="live-blueprint-body">
      <div class="live-blueprint-copy">
        <h3>${esc(active.headline)}</h3>
        <p>${esc(active.summary)}</p>
      </div>

      <div class="map-svg-wrap live-blueprint-canvas" tabindex="0" role="region" aria-label="Diagrama animado ${esc(active.tabLabel)}">
        <svg class="senior-pipeline-svg" viewBox="0 0 880 134" role="img" aria-label="Topología ${esc(active.headline)}">
          <defs>
            <marker id="home-bp-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="#16e1ee"/>
            </marker>
          </defs>
          ${active.nodes
        .map(([title, subtitle], idx) => {
        const x = 16 + idx * 222;
        const stroke = idx === 2 ? '#53e2ba' : '#18e1ee';
        return `<g>
                <rect x="${x}" y="38" width="174" height="76" rx="12" fill="#0b233a" stroke="${stroke}" stroke-width="1.6"/>
                <text x="${x + 87}" y="68" text-anchor="middle" fill="#f2fbff" font-size="12.5" font-weight="bold" font-family="sans-serif">${esc(title)}</text>
                <text x="${x + 87}" y="91" text-anchor="middle" fill="#8fd8f2" font-size="10.5" font-family="sans-serif">${esc(subtitle)}</text>
              </g>`;
    })
        .join('')}
          ${active.edgeLabels
        .map((edge_label, idx) => {
        const x = 16 + idx * 222;
        const mid_x = x + 198;
        const pill_w = Math.max(88, edge_label.length * 6.4 + 16);
        return `<g>
                <line x1="${x + 174}" y1="76" x2="${x + 222}" y2="76" class="arch-flow-edge" stroke="#16e1ee" stroke-width="2.2" marker-end="url(#home-bp-arrow)"/>
                <rect x="${Math.round(mid_x - pill_w / 2)}" y="9" width="${Math.round(pill_w)}" height="20" rx="6" fill="#081b2e" stroke="#1b5878"/>
                <text x="${mid_x}" y="22.5" text-anchor="middle" fill="#9beeff" font-size="9.5" font-family="monospace">${esc(edge_label)}</text>
              </g>`;
    })
        .join('')}
        </svg>
      </div>

      <div class="tabular-metrics-grid">
        <div class="tabular-metric-cell">
          <span>LATENCIA P95 REF.</span>
          <b>${esc(active.latencyP95)}</b>
        </div>
        <div class="tabular-metric-cell">
          <span>ACOPLAMIENTO</span>
          <b>${esc(active.couplingIndex)}</b>
        </div>
        <div class="tabular-metric-cell">
          <span>COSTE DE EQUIPO</span>
          <b>${esc(active.teamOverhead)}</b>
        </div>
        <div class="tabular-metric-cell">
          <span>RIESGO PRINCIPAL</span>
          <b>${esc(active.failureMode)}</b>
        </div>
      </div>

      <div class="live-blueprint-footer">
        <span class="muted">Haz clic en cualquier arquitectura arriba para comparar contratos, latencia y trade-offs en tiempo real.</span>
        <div class="inline-actions m-0">
          <a class="btn secondary small" href="${esc(active.lessonHref)}">Estudiar lección ↗</a>
          <a class="btn primary small" href="${esc(active.labHref)}">Simular en laboratorio ↗</a>
        </div>
      </div>
    </div>
  </section>`;
}
/**
 * Renders the editorial Home showcase inspired by CloudEngineerPixel's UX/UI craft while preserving
 * 100 % of ARQPIXEL's curriculum data, interactive blueprints, Senior Mode pillars, 3D minigames & Capstones.
 */
export function renderHomeEditorialShowcaseHtml(options) {
    const { modules, paths, completedModuleIds, attemptedMissionsCount, expectedModulesCount, expectedMissionsCount, labsCount, xp, activeBlueprint, nextModule, seniorArtSpriteHtml, bottomIdeaSpriteHtml, } = options;
    const done_set = new Set(completedModuleIds);
    const level_specs = [
        {
            level: 'Básico',
            slug: 'basico',
            num: '01',
            codeRange: 'B01–B12',
            summary: 'Atributos de calidad, cohesión/acoplamiento, modelo C4, contratos HTTP, transacciones, observabilidad y ADR.',
        },
        {
            level: 'Intermedio',
            slug: 'intermedio',
            num: '02',
            codeRange: 'I01–I12',
            summary: 'SOLID con criterio, patrones GoF sin sobreingeniería, DDD estratégico/táctico y arquitecturas Clean / Hexagonal.',
        },
        {
            level: 'Avanzado',
            slug: 'avanzado',
            num: '03',
            codeRange: 'A01–A12',
            summary: 'Capacidad, microservicios cuando compensan, Outbox, Sagas, idempotencia, resiliencia SRE, STRIDE, Canary y FinOps.',
        },
    ];
    const level_cards_html = level_specs
        .map((spec, idx) => {
        const lvl_mods = modules.filter((m) => m.level === spec.level);
        const mins = lvl_mods.reduce((sum, m) => sum + m.readingMinutes, 0);
        const done_in_lvl = lvl_mods.filter((m) => done_set.has(m.id)).length;
        const first_pending = lvl_mods.find((m) => !done_set.has(m.id)) ?? lvl_mods[0];
        const target_href = first_pending ? `#/aprender/${first_pending.id}` : '#/rutas';
        return `<a class="arq-level-card arq-level-${spec.slug}" href="${esc(target_href)}">
        <div class="arq-level-top">
          <div class="arq-level-icon"><span>${spec.num}</span></div>
          <span class="arq-level-meta">${mins} MIN · ${done_in_lvl}/${lvl_mods.length} HECHOS</span>
        </div>
        <div class="arq-level-ghost" aria-hidden="true">0${idx + 1}</div>
        <span class="arq-level-step">NIVEL ${idx + 1} · ${spec.codeRange}</span>
        <h3>${esc(spec.level)}</h3>
        <p>${esc(spec.summary)}</p>
        <div class="arq-level-bottom">
          <span>${lvl_mods.length} módulos + banco práctico 2/4</span>
          <span class="arq-round-arrow" aria-hidden="true">↗</span>
        </div>
      </a>`;
    })
        .join('');
    const specializations_pills_html = paths
        .map((p) => {
        const done_count = p.modules.filter((id) => done_set.has(id)).length;
        return `<a class="home-spec-pill" href="#/rutas/${esc(p.id)}">
        <small>${esc(p.id)} · ${done_count}/${p.modules.length} MÓDULOS</small>
        <strong>${esc(p.title)}</strong>
        <span>${esc(firstSentence(p.summary, 88))}</span>
      </a>`;
    })
        .join('');
    return `<section class="arq-stats-strip" aria-label="Indicadores generales de la academia y tu avance">
    <div>
      <span class="arq-stat-sym" aria-hidden="true">◈</span>
      <strong>${completedModuleIds.length}<small class="arq-stat-denom">/${expectedModulesCount}</small></strong>
      <small>LECCIONES</small>
    </div>
    <div>
      <span class="arq-stat-sym purple" aria-hidden="true">♛</span>
      <strong>${attemptedMissionsCount}<small class="arq-stat-denom">/${expectedMissionsCount}</small></strong>
      <small>CASOS SENIOR</small>
    </div>
    <div>
      <span class="arq-stat-sym mint" aria-hidden="true">⌘</span>
      <strong>${labsCount} + 5</strong>
      <small>LABS Y MUNDOS 3D</small>
    </div>
    <div>
      <span class="arq-stat-sym gold" aria-hidden="true">✦</span>
      <strong>${xp}</strong>
      <small>XP VERIFICADOS</small>
    </div>
  </section>

  ${renderHomeInteractiveBlueprintHtml(activeBlueprint)}

  <section class="home-section-block" aria-label="Niveles progresivos del currículo">
    <div class="arq-section-heading">
      <div>
        <span class="arq-eyebrow-line"><i class="eyebrow-square" aria-hidden="true"></i> ESCOGE TU CAMINO</span>
        <h2>De fundamentos a arquitectura de producción</h2>
        <p>Tres niveles conectados en un grafo acíclico de 54 nodos con teoría concisa, código ✅/❌, diagramas SVG y evaluación honesta.</p>
      </div>
      <a class="text-link" href="#/rutas">Ver los 36 módulos →</a>
    </div>
    <div class="arq-level-cards">
      ${level_cards_html}
    </div>

    <div class="home-specs-strip" aria-label="Ocho rutas de especialización técnica">
      <div class="home-specs-strip-head">
        <div>
          <strong>8 Especializaciones transversales (R01–R08)</strong>
          <span> · Conectadas con Proyectos Capstone y repositorios políglotas</span>
        </div>
        <a class="btn secondary small" href="#/especializaciones">Explorar especializaciones ↗</a>
      </div>
      <div class="home-specs-pills">
        ${specializations_pills_html}
      </div>
    </div>
  </section>

  <section class="senior-feature-band" aria-label="Presentación de Senior Mode">
    <div class="senior-band-copy">
      <span class="arq-eyebrow-line gold"><i class="eyebrow-square gold" aria-hidden="true"></i> ENTRENA COMO EN PRODUCCIÓN</span>
      <h2>Los diagramas estáticos no bastan.<br/><span>Defiende decisiones bajo presión real.</span></h2>
      <p>Enfréntate a 18 misiones Senior (108 actividades conectadas) con restricciones reproducibles por semilla: Outbox e idempotencia, Sagas, aislamiento multi-tenant, capacidad, STRIDE, Canary y FinOps.</p>
      <div class="senior-band-checks">
        <span>✓ Decisiones con consecuencias encadenadas</span>
        <span>✓ 5 estados canónicos + REQUIRES_REVIEW</span>
        <span>✓ Dossier JSON/MD auditable local-first</span>
      </div>
      <div class="inline-actions m-0">
        <a class="btn btn-gold" href="#/senior">Entrar a Senior Mode →</a>
        <a class="btn btn-band-ghost" href="#/taller-senior/S09?seed=42">Probar misión S09 (Seed 42) ↗</a>
      </div>
    </div>
    <div class="senior-band-art" aria-hidden="true">
      <div class="senior-halo"></div>
      <span class="senior-orbit-tag senior-orbit-top">♛ 18 Playbooks · Seed FNV-1a</span>
      <span class="senior-orbit-tag senior-orbit-bottom">⚖ Juicio humano · Sin IA mágica</span>
      ${seniorArtSpriteHtml}
    </div>
  </section>

  <section class="home-section-block" aria-label="Herramientas prácticas de aprendizaje">
    <div class="arq-section-heading">
      <div>
        <span class="arq-eyebrow-line"><i class="eyebrow-square" aria-hidden="true"></i> APRENDE HACIENDO</span>
        <h2>Todo tu escritorio de arquitectura en un solo lugar</h2>
      </div>
    </div>
    <div class="feature-grid">
      <article class="feature-card route-card">
        <div class="card-icon cyan-bg">${renderPixelNavIconSvg('map', 24)}</div>
        <span class="mini-tag">MAPA CURRICULAR · 54 NODOS</span>
        <h3>Grafo DAG de prerrequisitos</h3>
        <p>Explora visualmente cómo cada principio desbloquea patrones intermedios, sistemas distribuidos y misiones Senior.</p>
        <a href="#/mapa">Abrir mapa de 54 nodos <span>↗</span></a>
      </article>
      <article class="feature-card lab-card">
        <div class="card-icon purple-bg">${renderPixelNavIconSvg('labs', 24)}</div>
        <span class="mini-tag">8 ESTUDIOS INTERACTIVOS</span>
        <h3>Laboratorios y simuladores</h3>
        <p>C4 Studio (C1–C3 + PNG/SVG), DDD Workshop, OpenAPI CDC, Outbox/Sagas, Capacidad USL y editor ADR.</p>
        <a href="#/laboratorios">Entrar a laboratorios <span>↗</span></a>
      </article>
      <article class="feature-card">
        <div class="card-icon cyan-bg">${renderPixelNavIconSvg('minigames', 24)}</div>
        <span class="mini-tag">ARENA ESPACIAL · THREE.JS 3D</span>
        <h3>Cinco minijuegos en 3D</h3>
        <p>30 retos con selección WebGL Raycaster, órbita 360°, presets de cámara y atajos 1–4 sin inflar tu XP Senior.</p>
        <a href="#/minijuegos">Jugar en 3D y aprender <span>↗</span></a>
      </article>
      <article class="feature-card senior-card">
        <div class="card-icon gold-bg">${renderPixelNavIconSvg('projects', 24)}</div>
        <span class="mini-tag">11 CAPSTONES + REPOS EJECUTABLES</span>
        <h3>Proyectos y código de referencia</h3>
        <p>Construye dossiers integradores con rúbrica humana 1–4 y audita implementaciones Hexagonales en TS, C# y Java.</p>
        <a href="#/proyectos">Abrir proyectos Capstone <span>↗</span></a>
      </article>
    </div>
  </section>

  <section class="arq-bottom-cta" aria-label="Siguiente paso recomendado">
    <div class="arq-bottom-bot">${bottomIdeaSpriteHtml}</div>
    <div class="arq-bottom-copy">
      <span class="overline">SIGUIENTE PASO RECOMENDADO · ${esc(nextModule.id)}</span>
      <h2>${esc(nextModule.title)}</h2>
      <p>${esc(nextModule.concept)}</p>
    </div>
    <div class="inline-actions m-0">
      <button type="button" class="btn primary" data-go="aprender/${esc(nextModule.id)}">Continuar lección →</button>
      <a class="btn secondary" href="#/recursos">Patrones y ADR ↗</a>
    </div>
  </section>`;
}
const PIXEL_NAV_ICON_PATHS = Object.freeze({
    home: 'M7 2h2v1h2v1h2v2h1v8H9v-4H7v4H2V6h1V4h2V3h2V2zm0 3v1H5v6h1V9h4v3h1V6H9V5H7z',
    map: 'M2 3h4v1h4V3h4v10h-4v-1H6v1H2V3zm2 2v6h2V5H4zm4 1v4h2V6H8zm4-1v6h1V5h-1z',
    routes: 'M2 3h5v1h2V3h5v10H9v-1H7v1H2V3zm2 2v6h3V5H4zm5 0v6h3V5H9z',
    specs: 'M4 2h8v2h2v2H2V4h2V2zm-2 5h12v2H2V7zm2 4h8v3H4v-3z',
    projects: 'M3 2h10v2h1v8h-1v2H3v-2H2V4h1V2zm1 2v8h8V4H4zm2 2h4v4H6V6z',
    labs: 'M2 3h12v10H2V3zm2 2v6h8V5H4zm1 1h2v1h1v1H7v1H5V8h1V7H5V6zm4 3h3v1H9V9z',
    minigames: 'M6 2h4v2H9v3l4 5v2H3v-2l4-5V4H6V2zm1 6-2 3h6l-2-3H7z',
    senior: 'M2 4h2v2h2v1h1V4h2v3h1V6h2V4h2v7H2V4zm1 8h10v2H3v-2z',
    library: 'M3 2h2v12H3V2zm4 1h2v11H7V3zm4 2h2v9h-2V5z',
    badges: 'M4 2h8v2h2v3h-2v1h-2v2H9v2h3v2H4v-2h3v-2H6V8H4V7H2V4h2V2zm2 2v3h4V4H6z',
    profile: 'M2 13h12v1H2v-1zm1-4h2v3H3V9zm4-3h2v6H7V6zm4-3h2v9h-2V3z',
    settings: 'M6 2h4v2h2v2h2v4h-2v2h-2v2H6v-2H4v-2H2V6h2V4h2V2zm0 4v4h4V6H6z',
    about: 'M5 2h6v2h2v2h1v4h-1v2h-2v2H5v-2H3v-2H2V6h1V4h2V2zm2 3v2h2V5H7zm0 3v4h2V8H7z',
});
/**
 * Renders a 16x16 integer-grid pixel-art SVG icon (`shape-rendering="crispEdges"`) following
 * `pixel-senior-ux`: inherits `currentColor` across themes and reserves `--gold` for Senior Mode's crown.
 */
export function renderPixelNavIconSvg(name, size = 16) {
    const key = (name in PIXEL_NAV_ICON_PATHS && name !== '__proto__' && name !== 'constructor' ? name : 'home');
    const path_d = PIXEL_NAV_ICON_PATHS[key];
    const extra_cls = key === 'senior' ? ' pixel-crown-gold' : '';
    return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true" class="pixel-nav-icon${extra_cls}"><path d="${path_d}"/></svg>`;
}
