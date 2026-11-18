import { formatSafeArchitecturalProseHtml } from '../shared/ui/visual-clarity.js';
import { LESSON_ENRICHMENTS_BY_ID } from './constants/lesson-enrichments.constants.js';
import type { LessonEnrichmentItemSchema } from './schemas/lesson-enrichment.schema.js';

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeMermaidToken(value: string): string {
  return value.replace(/[&<>"'`[\]{}|\r\n]/g, ' ').trim();
}

export function getLessonEnrichment(module_id: string): LessonEnrichmentItemSchema | undefined {
  return LESSON_ENRICHMENTS_BY_ID.get(module_id);
}

export function renderLessonMermaidSource(item: LessonEnrichmentItemSchema): string {
  const lines: string[] = [
    'flowchart LR',
    ...item.nodes.map(
      (node) => `  ${node.id}["${safeMermaidToken(node.label)} (${safeMermaidToken(node.role)})"]`,
    ),
    ...item.edges.map(
      (edge) => `  ${edge.from} -->|"${safeMermaidToken(edge.label)}"| ${edge.to}`,
    ),
  ];
  return `${lines.join('\n')}\n`;
}

export function renderLessonArchitectureSvg(item: LessonEnrichmentItemSchema): string {
  const count = item.nodes.length;
  const width = 920;
  const height = 235;
  const box_w = count >= 5 ? 152 : count === 4 ? 190 : 230;
  const box_h = 84;
  const gap = Math.floor((width - 64 - count * box_w) / Math.max(1, count - 1));
  const top_y = 92;

  const positions = new Map(
    item.nodes.map((node, index) => [
      node.id,
      {
        x: 32 + index * (box_w + gap),
        y: top_y,
      },
    ]),
  );

  const edges_svg = item.edges
    .map((edge, idx) => {
      const from_pos = positions.get(edge.from);
      const to_pos = positions.get(edge.to);
      if (!from_pos || !to_pos) return '';
      const forward = to_pos.x >= from_pos.x;
      const x1 = forward ? from_pos.x + box_w : from_pos.x;
      const x2 = forward ? to_pos.x : to_pos.x + box_w;
      const mid_x = Math.round((x1 + x2) / 2);
      const curve_y = forward ? top_y - 18 - (idx % 2) * 14 : top_y + box_h + 26;
      const path_d =
        Math.abs(to_pos.x - from_pos.x) <= box_w + gap + 8 && forward
          ? `M ${x1} ${top_y + box_h / 2} L ${x2} ${top_y + box_h / 2}`
          : `M ${x1} ${forward ? top_y + 18 : top_y + box_h - 14} Q ${mid_x} ${curve_y} ${x2} ${forward ? top_y + 18 : top_y + box_h - 14}`;
      const label_y =
        Math.abs(to_pos.x - from_pos.x) <= box_w + gap + 8 && forward
          ? top_y + box_h / 2 - 9
          : forward
            ? curve_y + 4
            : curve_y + 12;

      return `<g>
        <path d="${path_d}" class="arch-flow-edge" fill="none" stroke="#38d6f9" stroke-width="2.2" marker-end="url(#lesson-arrow-${xmlEscape(item.moduleId)})"/>
        <text x="${mid_x}" y="${label_y}" text-anchor="middle" fill="#9beeff" font-family="sans-serif" font-size="11">${xmlEscape(edge.label.slice(0, 28))}</text>
      </g>`;
    })
    .join('');

  const nodes_svg = item.nodes
    .map((node) => {
      const pos = positions.get(node.id)!;
      return `<g>
        <rect x="${pos.x}" y="${pos.y}" width="${box_w}" height="${box_h}" rx="12" fill="#0d2b45" stroke="#18e1ee" stroke-width="1.8"/>
        <text x="${pos.x + box_w / 2}" y="${pos.y + 34}" text-anchor="middle" fill="#f2fbff" font-family="sans-serif" font-size="13" font-weight="bold">${xmlEscape(node.label.slice(0, 24))}</text>
        <text x="${pos.x + box_w / 2}" y="${pos.y + 58}" text-anchor="middle" fill="#8fd8f2" font-family="sans-serif" font-size="11">${xmlEscape(node.role.slice(0, 24))}</text>
      </g>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" class="curriculum-map-svg lesson-arch-svg" role="img" aria-label="Diagrama arquitectónico ${xmlEscape(item.moduleId)}: ${xmlEscape(item.diagramTitle)}">
    <title>${xmlEscape(item.moduleId)} · ${xmlEscape(item.diagramTitle)}</title>
    <desc>Flujo estructural con ${item.nodes.length} elementos y ${item.edges.length} contratos explícitos.</desc>
    <defs>
      <marker id="lesson-arrow-${xmlEscape(item.moduleId)}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
        <path d="M0 0 L8 4 L0 8 z" fill="#38d6f9"/>
      </marker>
    </defs>
    <rect width="100%" height="100%" rx="14" fill="#071728"/>
    <text x="28" y="34" fill="#eaf9ff" font-family="sans-serif" font-size="16" font-weight="bold">${xmlEscape(item.moduleId)} · ${xmlEscape(item.diagramTitle)}</text>
    ${edges_svg}
    ${nodes_svg}
  </svg>`;
}

export function renderLessonEnrichmentSectionHtml(item: LessonEnrichmentItemSchema): string {
  const mermaid_src = renderLessonMermaidSource(item);
  return `<article id="sec-diagrama" class="lesson-card lesson-visual-enrichment" data-enrichment-module="${xmlEscape(item.moduleId)}">
    <span class="overline">DIAGRAMA VISUAL EN VIVO, CÓDIGO ✅/❌ Y CONTRAEJEMPLO</span>
    <h2>${xmlEscape(item.diagramTitle)}</h2>
    <div class="map-svg-wrap my-14" tabindex="0" role="region" aria-label="Diagrama arquitectónico ${xmlEscape(item.moduleId)}">
      ${renderLessonArchitectureSvg(item)}
    </div>
    <details class="map-table-details mb-16">
      <summary class="text-link">Ver especificación textual Mermaid (segura / exportable)</summary>
      <pre class="suite-code mt-8"><code>${xmlEscape(mermaid_src)}</code></pre>
    </details>

    <div class="solution-compare-grid">
      <div class="solution-box reference">
        <span class="overline text-mint">✅ DISEÑO DEFENDIBLE · ${xmlEscape(item.goodTitle)}</span>
        <pre class="suite-code mt-8"><code>${xmlEscape(item.goodCodeTs)}</code></pre>
      </div>
      <div class="solution-box">
        <span class="overline text-gold">❌ ANTI-PATRÓN FRECUENTE · ${xmlEscape(item.badTitle)}</span>
        <pre class="suite-code mt-8"><code>${xmlEscape(item.badCodeTs)}</code></pre>
      </div>
    </div>

    <div class="lesson-quote mt-16">
      <b>⚡ Contraejemplo · Cuándo falla o resulta excesivo</b>
      <p>${formatSafeArchitecturalProseHtml(item.counterexample)}</p>
    </div>

    <div class="senior-inline mt-16">
      <strong>⌘ Ejercicio práctico conectado al Laboratorio</strong>
      <p>${formatSafeArchitecturalProseHtml(item.practicalExercise)}</p>
      <div class="inline-actions mt-12">
        <a class="btn secondary small" href="#/laboratorio/${xmlEscape(item.labId)}">Practicar en laboratorio (${xmlEscape(item.labId.toUpperCase())}) →</a>
      </div>
    </div>
  </article>`;
}
