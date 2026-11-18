/**
 * Minimalist laboratory telemetry headers (`L2600`), non-drag-and-drop SVG layer visualizers (`L2601`),
 * per-failure root-cause diagnostics (`L2602`), and script-free diagram export guards (`L2603`).
 */
import { detectGraphProblems } from '../../engine.js';
import { LAB_TELEMETRY_SPECS } from './constants/lab-fixtures.constants.js';
import { MIN_ADR_FIELD_LENGTH } from './constants/labs.constants.js';

const esc = (v: unknown): string =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch),
  );

/**
 * Renders a `runkiri.com`-inspired minimalist live telemetry & explicit assumptions banner
 * for every laboratory (`§21.3 L2600`: simulators explicitly label results and assumptions).
 */
export function renderLabTelemetryHeaderHtml(studio_id: string): string {
  const spec = LAB_TELEMETRY_SPECS[studio_id] ?? LAB_TELEMETRY_SPECS.dependencias;

  return `<section class="live-blueprint-shell lab-telemetry-strip mb-18" aria-label="Supuestos explícitos y modelo del simulador ${esc(spec.studioId)}">
    <div class="live-blueprint-topbar">
      <div class="live-status-group">
        <span class="live-status-pill"><i class="live-dot" aria-hidden="true"></i> SUPUESTOS DEL SIMULADOR</span>
        <span class="map-badge" data-lab-model-badge="${esc(spec.studioId)}">${esc(spec.modelBadge)}</span>
      </div>
      <small class="muted">${esc(spec.modelFormulaSummary)}</small>
    </div>
    <div class="live-blueprint-body">
      <div class="map-svg-wrap live-blueprint-canvas" tabindex="0" role="region" aria-label="Esquema visual rápido del laboratorio ${esc(spec.studioId)}">
        <svg class="senior-pipeline-svg" viewBox="0 0 840 112" role="img" aria-label="Flujo de evaluación ${esc(spec.modelBadge)}">
          <defs>
            <marker id="lab-hdr-arrow-${esc(spec.studioId)}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="#16e1ee"/>
            </marker>
          </defs>
          ${spec.flowNodes
            .map((node_label, idx) => {
              const x = 14 + idx * 212;
              return `<g>
                <rect x="${x}" y="36" width="166" height="60" rx="11" fill="#0b233a" stroke="${idx === 3 ? '#53e2ba' : '#18e1ee'}" stroke-width="1.5"/>
                <text x="${x + 83}" y="62" text-anchor="middle" fill="#f2fbff" font-size="11.5" font-weight="bold" font-family="sans-serif">${esc(node_label)}</text>
                <text x="${x + 83}" y="82" text-anchor="middle" fill="#8fd8f2" font-size="9.5" font-family="monospace">Etapa 0${idx + 1}</text>
              </g>`;
            })
            .join('')}
          ${spec.flowEdges
            .map((edge_text, idx) => {
              const x = 14 + idx * 212;
              const mid_x = x + 189;
              const pill_w = Math.max(82, edge_text.length * 6.2 + 14);
              return `<g>
                <line x1="${x + 166}" y1="66" x2="${x + 212}" y2="66" class="arch-flow-edge" stroke="#16e1ee" stroke-width="2" marker-end="url(#lab-hdr-arrow-${esc(spec.studioId)})"/>
                <rect x="${Math.round(mid_x - pill_w / 2)}" y="8" width="${Math.round(pill_w)}" height="19" rx="6" fill="#081b2e" stroke="#1b5878"/>
                <text x="${mid_x}" y="21" text-anchor="middle" fill="#9beeff" font-size="9" font-family="monospace">${esc(edge_text)}</text>
              </g>`;
            })
            .join('')}
        </svg>
      </div>
      <div class="digest-cards-grid">
        ${spec.assumptions
          .map(
            (item, idx) => `<div class="digest-mini-card">
              <span class="overline">SUPUESTO 0${idx + 1}</span>
              <p>${esc(item)}</p>
            </div>`,
          )
          .join('')}
      </div>
      <p class="sim-scope-disclaimer m-0">⚖ <strong>Alcance y límites del modelo:</strong> ${esc(spec.outOfScopeNotice)}</p>
    </div>
  </section>`;
}

export type SpecificEdgeFailure = {
  readonly edgeLabel: string;
  readonly code:
    | 'DOMAIN_OUTWARD_DEPENDENCY'
    | 'APPLICATION_TO_PRESENTATION'
    | 'INFRASTRUCTURE_TO_PRESENTATION'
    | 'SELF_DEPENDENCY'
    | 'UNKNOWN_LAYER'
    | 'DIRECTED_CYCLE';
  readonly reason: string;
  readonly fixAction: string;
};

/**
 * Produces specific root-cause failure diagnosis for every broken architectural edge or cycle (`§21.3 L2602`).
 */
export function diagnoseDependencyFailures(
  edges: ReadonlyArray<readonly [string, string]>,
): {
  readonly valid: boolean;
  readonly cycle: boolean;
  readonly failures: readonly SpecificEdgeFailure[];
} {
  const tuple_edges: [string, string][] = edges.map(([a, b]) => [a, b]);
  const base = detectGraphProblems(tuple_edges);
  const failures: SpecificEdgeFailure[] = [];

  for (const [from, to] of base.invalid) {
    const label = `${from} → ${to}`;
    if (from === to) {
      failures.push({
        edgeLabel: label,
        code: 'SELF_DEPENDENCY',
        reason: `Autodependencia redundante sobre la misma capa «${from}».`,
        fixAction: 'Elimina el bucle reflexivo; modela relaciones únicamente entre capas distintas.',
      });
    } else if (from === 'Dominio') {
      failures.push({
        edgeLabel: label,
        code: 'DOMAIN_OUTWARD_DEPENDENCY',
        reason: `Violación de Regla Concéntrica: «Dominio» depende hacia fuera de «${to}», contaminando reglas de negocio con detalles externos.`,
        fixAction: `Declara un Puerto (interfaz) en Dominio/Aplicación e invierte la flecha para que «${to}» implemente ese contrato (DIP).`,
      });
    } else if (from === 'Aplicación' && to === 'Presentación') {
      failures.push({
        edgeLabel: label,
        code: 'APPLICATION_TO_PRESENTATION',
        reason:
          'Inversión acoplada a UI: los Casos de Uso conocen controladores HTTP o vistas de «Presentación».',
        fixAction:
          'Haz que «Presentación» invoque a «Aplicación» y recibe DTOs de respuesta agnósticos del transporte.',
      });
    } else if (from === 'Infraestructura' && to === 'Presentación') {
      failures.push({
        edgeLabel: label,
        code: 'INFRASTRUCTURE_TO_PRESENTATION',
        reason:
          'Salto de fronteras: un adaptador de «Infraestructura» (ORM/cola/cliente) acopla directamente a «Presentación».',
        fixAction:
          'Conecta «Infraestructura» hacia «Aplicación» o «Dominio» implementando sus puertos secundarios.',
      });
    } else {
      failures.push({
        edgeLabel: label,
        code: 'UNKNOWN_LAYER',
        reason: `Capa no reconocida en la relación «${label}».`,
        fixAction: 'Utiliza únicamente Presentación, Aplicación, Dominio o Infraestructura.',
      });
    }
  }

  if (base.cycle) {
    failures.push({
      edgeLabel: 'Ciclo dirigido entre capas',
      code: 'DIRECTED_CYCLE',
      reason:
        'Existe un ciclo cerrado de dependencias que impide compilar, probar y evolucionar capas de forma aislada.',
      fixAction:
        'Rompe la arista de retorno extrayendo una interfaz/puerto en la capa más estable o publicando un evento de dominio.',
    });
  }

  return {
    valid: base.valid,
    cycle: base.cycle,
    failures,
  };
}

/**
 * Renders an interactive-free, XML-escaped SVG diagram of the 4 concentric layers (`§21.3 L2601 & L2603`).
 */
export function renderDependencyLayerSvgHtml(
  edges: ReadonlyArray<readonly [string, string]>,
): string {
  const layers = ['Presentación', 'Aplicación', 'Dominio', 'Infraestructura'] as const;
  const coords: Record<string, { x: number; y: number }> = {
    Presentación: { x: 110, y: 88 },
    Aplicación: { x: 315, y: 88 },
    Dominio: { x: 520, y: 88 },
    Infraestructura: { x: 725, y: 88 },
  };
  const diag = diagnoseDependencyFailures(edges);
  const invalid_keys = new Set(
    edges
      .filter(([a, b]) =>
        diag.failures.some((f) => f.edgeLabel === `${a} → ${b}`),
      )
      .map(([a, b]) => `${a}→${b}`),
  );

  const paths_svg = edges
    .map(([from, to], idx) => {
      const a = coords[from];
      const b = coords[to];
      if (!a || !b) return '';
      const is_bad = invalid_keys.has(`${from}→${to}`);
      const stroke = is_bad ? '#ff7890' : '#38d6f9';
      const marker = is_bad ? 'url(#dep-arrow-bad)' : 'url(#dep-arrow-ok)';
      const mid_x = Math.round((a.x + b.x) / 2);
      const arc_y = a.x < b.x ? 26 - (idx % 2) * 10 : 156 + (idx % 2) * 10;
      const d =
        from === to
          ? `M ${a.x - 18} ${a.y - 28} C ${a.x - 36} ${a.y - 68}, ${a.x + 36} ${a.y - 68}, ${a.x + 18} ${a.y - 28}`
          : `M ${a.x} ${a.x < b.x ? a.y - 28 : a.y + 28} Q ${mid_x} ${arc_y} ${b.x} ${a.x < b.x ? b.y - 28 : b.y + 28}`;
      return `<path d="${d}" class="${is_bad ? '' : 'arch-flow-edge'}" fill="none" stroke="${stroke}" stroke-width="2.3" marker-end="${marker}"/>`;
    })
    .join('');

  const nodes_svg = layers
    .map((name) => {
      const pt = coords[name];
      const is_domain = name === 'Dominio';
      return `<g>
        <rect x="${pt.x - 76}" y="${pt.y - 28}" width="152" height="56" rx="12" fill="${is_domain ? '#0d3648' : '#0b2239'}" stroke="${is_domain ? '#53e2ba' : '#18e1ee'}" stroke-width="1.8"/>
        <text x="${pt.x}" y="${pt.y - 3}" text-anchor="middle" fill="#f2fbff" font-size="13" font-weight="bold" font-family="sans-serif">${esc(name)}</text>
        <text x="${pt.x}" y="${pt.y + 16}" text-anchor="middle" fill="#8fd8f2" font-size="10" font-family="monospace">${is_domain ? 'Ce objetivo = 0' : 'Capa arquitectónica'}</text>
      </g>`;
    })
    .join('');

  return sanitizeAndVerifySvgExport(
    `<svg xmlns="http://www.w3.org/2000/svg" class="curriculum-map-svg lesson-arch-svg" viewBox="0 0 840 182" role="img" aria-label="Diagrama SVG de dependencias entre Presentación, Aplicación, Dominio e Infraestructura">
      <title>Grafo de dependencias por capas · NexoShop</title>
      <desc>${edges.length} relaciones declaradas; estado ${diag.valid ? 'válido' : 'con violaciones'}.</desc>
      <defs>
        <marker id="dep-arrow-ok" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#38d6f9"/></marker>
        <marker id="dep-arrow-bad" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#ff7890"/></marker>
      </defs>
      <rect width="840" height="182" rx="14" fill="#071628"/>
      ${paths_svg}
      ${nodes_svg}
    </svg>`,
  ).svg;
}

export type AdrFieldFailure = {
  readonly fieldId: 'adr-title' | 'adr-context' | 'adr-decision' | 'adr-tradeoff';
  readonly fieldLabel: string;
  readonly currentLength: number;
  readonly requiredLength: number;
  readonly specificHint: string;
};

export function diagnoseAdrDraftFields(
  draft: {
    readonly title: string;
    readonly context: string;
    readonly decision: string;
    readonly tradeoff: string;
  },
  min_len = MIN_ADR_FIELD_LENGTH,
): {
  readonly complete: boolean;
  readonly failures: readonly AdrFieldFailure[];
} {
  const failures: AdrFieldFailure[] = [];
  if (draft.title.trim().length < 8) {
    failures.push({
      fieldId: 'adr-title',
      fieldLabel: 'Título del ADR',
      currentLength: draft.title.trim().length,
      requiredLength: 8,
      specificHint: 'Identifica código y decisión concreta (ej. «ADR-004: Outbox transaccional en Pedidos»).',
    });
  }
  if (draft.context.trim().length < min_len) {
    failures.push({
      fieldId: 'adr-context',
      fieldLabel: 'Contexto y restricciones',
      currentLength: draft.context.trim().length,
      requiredLength: min_len,
      specificHint: 'Cita volumen (req/s), SLO objetivo, tamaño de equipo y cuello de botella actual.',
    });
  }
  if (draft.decision.trim().length < min_len) {
    failures.push({
      fieldId: 'adr-decision',
      fieldLabel: 'Decisión arquitectónica',
      currentLength: draft.decision.trim().length,
      requiredLength: min_len,
      specificHint: 'Declara qué patrón o frontera adoptas y cómo se integra con los módulos vecinos.',
    });
  }
  if (draft.tradeoff.trim().length < min_len) {
    failures.push({
      fieldId: 'adr-tradeoff',
      fieldLabel: 'Alternativas descartadas y consecuencias',
      currentLength: draft.tradeoff.trim().length,
      requiredLength: min_len,
      specificHint: 'Nombra al menos una alternativa descartada y el coste o riesgo que aceptas asumir.',
    });
  }
  return {
    complete: failures.length === 0,
    failures,
  };
}

/**
 * Defense-in-depth sanitizer & verifier ensuring exported SVG diagrams NEVER contain executable scripts,
 * inline event handlers (`onload=`, `onerror=`), `javascript:` URIs, `<foreignObject>`, or `<iframe>` (`§21.3 L2603`).
 */
export function sanitizeAndVerifySvgExport(svg_markup: string): {
  readonly svg: string;
  readonly safe: boolean;
  readonly strippedCount: number;
} {
  let stripped = 0;
  const countAndStrip = (input: string, pattern: RegExp, replacement = ''): string =>
    input.replace(pattern, () => {
      stripped += 1;
      return replacement;
    });

  let clean = svg_markup;
  clean = countAndStrip(clean, /<script\b[^>]*>[\s\S]*?<\/script>/gi);
  clean = countAndStrip(clean, /<script\b[^>]*\/?>/gi);
  clean = countAndStrip(clean, /<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject>/gi);
  clean = countAndStrip(clean, /<(?:iframe|object|embed)\b[^>]*>[\s\S]*?<\/(?:iframe|object|embed)>/gi);
  clean = countAndStrip(clean, /<(?:iframe|object|embed)\b[^>]*\/?>/gi);
  clean = countAndStrip(clean, /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi);
  clean = countAndStrip(clean, /javascript\s*:/gi, 'blocked:');

  const has_residual_hazard =
    /<script\b/i.test(clean) ||
    /<foreignObject\b/i.test(clean) ||
    /\son[a-z]+\s*=/i.test(clean) ||
    /javascript\s*:/i.test(clean);

  return {
    svg: clean,
    safe: !has_residual_hazard,
    strippedCount: stripped,
  };
}
