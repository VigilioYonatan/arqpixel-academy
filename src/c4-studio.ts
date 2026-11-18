/**
 * Pure, bounded, static C4 multi-level modeler (C1 Context, C2 Containers, C3 Components)
 * with topological validation, semantic architectural smell analysis, and accessible summary.
 */

export type ContainerType = 'API' | 'Base de datos' | 'Frontend' | 'Servicio externo';

export type C1ElementType = 'Persona / Actor' | 'Sistema Principal' | 'Sistema Externo';

export type C3ElementType =
  | 'Controlador / Adapter'
  | 'Caso de Uso'
  | 'Dominio / Agregado'
  | 'Repositorio / Puerto';

export type C4ElementType = ContainerType | C1ElementType | C3ElementType;

export type C4Level = 'C1' | 'C2' | 'C3';

export const C4_LEVELS = ['C1', 'C2', 'C3'] as const;

/** C2 default types kept at exact length 4 for backward compatibility. */
export const C4_TYPES: ContainerType[] = ['API', 'Base de datos', 'Frontend', 'Servicio externo'];

export const C1_TYPES: readonly C1ElementType[] = Object.freeze([
  'Persona / Actor',
  'Sistema Principal',
  'Sistema Externo',
]);

export const C3_TYPES: readonly C3ElementType[] = Object.freeze([
  'Controlador / Adapter',
  'Caso de Uso',
  'Dominio / Agregado',
  'Repositorio / Puerto',
]);

export const ALL_C4_ELEMENT_TYPES: readonly C4ElementType[] = Object.freeze([
  ...C4_TYPES,
  ...C1_TYPES,
  ...C3_TYPES,
]);

export const C4_LEVEL_TYPES: Readonly<Record<C4Level, readonly C4ElementType[]>> = Object.freeze({
  C1: C1_TYPES,
  C2: C4_TYPES,
  C3: C3_TYPES,
});

export const C4_LEVEL_METADATA: Readonly<
  Record<C4Level, { readonly title: string; readonly subtitle: string }>
> = Object.freeze({
  C1: {
    title: 'C1 · Contexto del Sistema',
    subtitle: 'Actores humanos, sistema principal NexoShop y sistemas externos.',
  },
  C2: {
    title: 'C2 · Vista de Contenedores',
    subtitle: 'Aplicaciones web, APIs desplegables, bases de datos y proveedores externos.',
  },
  C3: {
    title: 'C3 · Vista de Componentes',
    subtitle: 'Controladores/Adaptadores, Casos de Uso, Dominio y Puertos/Repositorios internos.',
  },
});

export type C4Container = {
  id: string;
  label: string;
  type: C4ElementType;
};

export type C4Relation = {
  from: string;
  to: string;
  label: string;
};

export type C4Model = {
  kind: 'C4-containers-educational';
  system: 'NexoShop';
  level?: C4Level;
  containers: C4Container[];
  relations: C4Relation[];
};

export type C4SemanticWarningCode =
  | 'DIRECT_FRONTEND_TO_DB'
  | 'DOMAIN_DEPENDENCY_INVERSION'
  | 'EXTERNAL_DIRECT_TO_DB'
  | 'DIRECTED_CYCLE'
  | 'AMBIGUOUS_EDGE_CONTRACT'
  | 'ISOLATED_ELEMENT';

export type C4SemanticWarning = {
  readonly code: C4SemanticWarningCode;
  readonly severity: 'high' | 'medium';
  readonly message: string;
  readonly recommendation: string;
};

export const C4_LEVEL_PRESETS: Readonly<Record<C4Level, C4Model>> = Object.freeze({
  C1: {
    kind: 'C4-containers-educational',
    system: 'NexoShop',
    level: 'C1',
    containers: [
      { id: 'comprador', label: 'Comprador NexoShop', type: 'Persona / Actor' },
      { id: 'nexoshop-core', label: 'Plataforma NexoShop', type: 'Sistema Principal' },
      { id: 'psp-pagos', label: 'Pasarela Pagos HTTPS', type: 'Sistema Externo' },
      { id: 'operador-envios', label: 'Operador Logístico API', type: 'Sistema Externo' },
    ],
    relations: [
      { from: 'comprador', to: 'nexoshop-core', label: 'Compra productos vía HTTPS' },
      { from: 'nexoshop-core', to: 'psp-pagos', label: 'Autoriza cobro REST idempotente' },
      { from: 'nexoshop-core', to: 'operador-envios', label: 'Solicita despacho vía Webhook/API' },
    ],
  },
  C2: {
    kind: 'C4-containers-educational',
    system: 'NexoShop',
    level: 'C2',
    containers: [
      { id: 'frontend', label: 'Web NexoShop', type: 'Frontend' },
      { id: 'api-pedidos', label: 'API Pedidos', type: 'API' },
      { id: 'bd-pedidos', label: 'BD Pedidos', type: 'Base de datos' },
      { id: 'proveedor-pagos', label: 'Proveedor de pagos', type: 'Servicio externo' },
    ],
    relations: [
      { from: 'frontend', to: 'api-pedidos', label: 'Solicita pedidos HTTPS/JSON' },
      { from: 'api-pedidos', to: 'bd-pedidos', label: 'Persiste pedidos SQL/Tx' },
      { from: 'api-pedidos', to: 'proveedor-pagos', label: 'Autoriza cobros HTTPS' },
    ],
  },
  C3: {
    kind: 'C4-containers-educational',
    system: 'NexoShop',
    level: 'C3',
    containers: [
      { id: 'orders-controller', label: 'Orders HTTP Controller', type: 'Controlador / Adapter' },
      { id: 'place-order-uc', label: 'PlaceOrder UseCase', type: 'Caso de Uso' },
      { id: 'order-aggregate', label: 'Agregado Pedido', type: 'Dominio / Agregado' },
      { id: 'orders-repo-port', label: 'OrderRepository Port', type: 'Repositorio / Puerto' },
    ],
    relations: [
      { from: 'orders-controller', to: 'place-order-uc', label: 'Invoca comando DTO validado' },
      { from: 'place-order-uc', to: 'order-aggregate', label: 'Ejecuta invariantes de pedido' },
      { from: 'place-order-uc', to: 'orders-repo-port', label: 'Persiste agregado vía puerto' },
    ],
  },
});

const isWord = (x: string): boolean => x.trim().length >= 2 && x.trim().length <= 40;

export function resolveC4Level(model: Pick<C4Model, 'level'>): C4Level {
  if (model.level === 'C1' || model.level === 'C2' || model.level === 'C3') {
    return model.level;
  }
  return 'C2';
}

export function validateC4(model: C4Model): string[] {
  const issues: string[] = [];
  const level = resolveC4Level(model);
  const allowed_types = C4_LEVEL_TYPES[level];

  if (model.level !== undefined && !C4_LEVELS.includes(model.level)) {
    issues.push('Nivel C4 no reconocido (usa C1, C2 o C3).');
  }
  if (model.containers.length < 1 || model.containers.length > 12) {
    issues.push('Se admiten de 1 a 12 contenedores.');
  }
  const ids = new Set<string>();
  for (const c of model.containers) {
    if (!/^[a-zA-Z0-9_-]{1,36}$/.test(c.id) || ids.has(c.id)) {
      issues.push('Identificador de contenedor incorrecto o repetido.');
    }
    ids.add(c.id);
    if (!isWord(c.label) || !allowed_types.includes(c.type)) {
      issues.push('Etiqueta o tipo de contenedor inválido.');
    }
  }
  if (model.relations.length > 24) {
    issues.push('Demasiadas relaciones para esta vista.');
  }
  const edges = new Set<string>();
  for (const rel of model.relations) {
    const key = `${rel.from}→${rel.to}`;
    if (
      rel.from === rel.to ||
      !ids.has(rel.from) ||
      !ids.has(rel.to) ||
      !isWord(rel.label) ||
      edges.has(key)
    ) {
      issues.push('Relación inválida, duplicada o sin origen/destino.');
    }
    edges.add(key);
  }
  return [...new Set(issues)];
}

const VAGUE_EDGE_LABELS = new Set([
  'usa',
  'conecta',
  'llama',
  'datos',
  'info',
  'habla',
  'relacion',
  'relación',
  'link',
  'va a',
]);

/**
 * Evaluates architectural semantics beyond basic graph syntax:
 * boundary bypasses, Clean/Hexagonal inversions, directed cycles, vague contracts, and isolated elements.
 */
export function analyzeC4Semantics(model: C4Model): C4SemanticWarning[] {
  if (validateC4(model).length > 0) return [];

  const warnings: C4SemanticWarning[] = [];
  const by_id = new Map(model.containers.map((c) => [c.id, c]));
  const degree = new Map(model.containers.map((c) => [c.id, 0]));
  const adjacency = new Map(model.containers.map((c) => [c.id, [] as string[]]));

  for (const rel of model.relations) {
    const source = by_id.get(rel.from);
    const target = by_id.get(rel.to);
    if (!source || !target) continue;

    degree.set(source.id, (degree.get(source.id) ?? 0) + 1);
    degree.set(target.id, (degree.get(target.id) ?? 0) + 1);
    adjacency.get(source.id)?.push(target.id);

    if (source.type === 'Frontend' && target.type === 'Base de datos') {
      warnings.push({
        code: 'DIRECT_FRONTEND_TO_DB',
        severity: 'high',
        message: `Acoplamiento crítico: «${source.label}» (Frontend) conecta directo a «${target.label}» (Base de datos).`,
        recommendation:
          'Introduce una API o Backend-for-Frontend intermedio para proteger credenciales, autorización e invariantes.',
      });
    }

    if (
      (source.type === 'Servicio externo' ||
        source.type === 'Sistema Externo' ||
        source.type === 'Persona / Actor') &&
      target.type === 'Base de datos'
    ) {
      warnings.push({
        code: 'EXTERNAL_DIRECT_TO_DB',
        severity: 'high',
        message: `Violación de frontera: «${source.label}» accede directamente a «${target.label}».`,
        recommendation:
          'Nunca expongas el almacenamiento interno a actores o proveedores externos; publica un contrato explícito vía API.',
      });
    }

    if (source.type === 'Dominio / Agregado' && target.type === 'Controlador / Adapter') {
      warnings.push({
        code: 'DOMAIN_DEPENDENCY_INVERSION',
        severity: 'high',
        message: `Inversión rota en C3: «${source.label}» (Dominio) depende de «${target.label}» (Adapter).`,
        recommendation:
          'En Clean/Hexagonal las dependencias apuntan hacia el Dominio; invierte la relación mediante un Puerto.',
      });
    }

    const normalized_label = rel.label.trim().toLowerCase();
    if (normalized_label.length < 6 || VAGUE_EDGE_LABELS.has(normalized_label)) {
      warnings.push({
        code: 'AMBIGUOUS_EDGE_CONTRACT',
        severity: 'medium',
        message: `Relación ambigua entre «${source.label}» y «${target.label}»: «${rel.label}».`,
        recommendation:
          'Indica intención y protocolo/contrato (ej. «Solicita pedidos HTTPS/JSON», «Publica evento OrderPlaced»).',
      });
    }
  }

  // Detect directed synchronous cycles
  const visiting = new Set<string>();
  const visited = new Set<string>();
  let has_cycle = false;

  const visitNode = (node_id: string): void => {
    if (has_cycle) return;
    visiting.add(node_id);
    for (const next_id of adjacency.get(node_id) ?? []) {
      if (visiting.has(next_id)) {
        has_cycle = true;
        return;
      }
      if (!visited.has(next_id)) {
        visitNode(next_id);
      }
    }
    visiting.delete(node_id);
    visited.add(node_id);
  };

  for (const c of model.containers) {
    if (!visited.has(c.id)) visitNode(c.id);
  }

  if (has_cycle) {
    warnings.push({
      code: 'DIRECTED_CYCLE',
      severity: 'high',
      message: 'Ciclo dirigido detectado entre elementos del modelo C4.',
      recommendation:
        'Rompe la dependencia circular extrayendo un contrato/evento asíncrono o invirtiendo el puerto compartido.',
    });
  }

  if (model.containers.length > 1) {
    for (const c of model.containers) {
      if ((degree.get(c.id) ?? 0) === 0) {
        warnings.push({
          code: 'ISOLATED_ELEMENT',
          severity: 'medium',
          message: `Elemento aislado sin relaciones: «${c.label}» (${c.type}).`,
          recommendation:
            'Conecta el elemento indicando qué contrato consume o expone, o elimínalo si no participa en esta vista.',
        });
      }
    }
  }

  // Deduplicate identical warning messages
  const seen_messages = new Set<string>();
  return warnings.filter((w) => {
    if (seen_messages.has(w.message)) return false;
    seen_messages.add(w.message);
    return true;
  });
}

const textEscape = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/** Mermaid is exported as inert text, not executed in the app. */
export function c4Mermaid(model: C4Model): string {
  if (validateC4(model).length) throw Error('Modelo C4 inválido');
  const level = resolveC4Level(model);
  const safeLabel = (s: string): string => textEscape(s.replace(/[\[\]`{}|\r\n]/g, ' '));
  const aliases = new Map(model.containers.map((c, i) => [c.id, `node${i + 1}`]));

  if (level === 'C1') {
    return (
      [
        'flowchart TB',
        ...model.containers.map((c, i) => `node${i + 1}["${safeLabel(c.label)} (${safeLabel(c.type)})"]`),
        ...model.relations.map(
          (r) => `${aliases.get(r.from)} -->|"${safeLabel(r.label)}"| ${aliases.get(r.to)}`,
        ),
      ].join('\n') + '\n'
    );
  }

  if (level === 'C3') {
    return (
      [
        'flowchart TB',
        'boundary["Contenedor · API NexoShop (C3)"]',
        ...model.containers.map((c, i) => `node${i + 1}["${safeLabel(c.label)} (${safeLabel(c.type)})"]`),
        ...model.containers
          .filter((x) => x.type === 'Controlador / Adapter')
          .map((x) => `boundary --> ${aliases.get(x.id)}`),
        ...model.relations.map(
          (r) => `${aliases.get(r.from)} -->|"${safeLabel(r.label)}"| ${aliases.get(r.to)}`,
        ),
      ].join('\n') + '\n'
    );
  }

  return (
    [
      'flowchart TB',
      'actor["Cliente · NexoShop"]',
      ...model.containers.map((c, i) => `node${i + 1}["${safeLabel(c.label)} (${safeLabel(c.type)})"]`),
      ...model.containers.filter((x) => x.type === 'Frontend').map((x) => `actor --> ${aliases.get(x.id)}`),
      ...model.relations.map(
        (r) => `${aliases.get(r.from)} -->|"${safeLabel(r.label)}"| ${aliases.get(r.to)}`,
      ),
    ].join('\n') + '\n'
  );
}

/** Static SVG with XML-escaped user labels; no HTML/JS is inserted. */
export function c4Svg(model: C4Model): string {
  if (validateC4(model).length) throw Error('Modelo C4 inválido');
  const level = resolveC4Level(model);
  const heading =
    level === 'C1'
      ? 'NexoShop · Vista de contexto (C1)'
      : level === 'C3'
        ? 'NexoShop · Vista de componentes (C3)'
        : 'NexoShop · Vista de contenedores';

  const width = 1080;
  const cols = 3;
  const box_w = 290;
  const box_h = 98;
  const x_gap = 43;
  const y_gap = 90;
  const top = 180;
  const left = 62;
  const rows = Math.ceil(model.containers.length / cols);
  const height = Math.max(450, top + rows * (box_h + y_gap) + 80);

  const node_pos = new Map(
    model.containers.map((c, i) => [
      c.id,
      { x: left + (i % cols) * (box_w + x_gap), y: top + Math.floor(i / cols) * (box_h + y_gap) },
    ]),
  );

  const nodes = model.containers
    .map((c) => {
      const p = node_pos.get(c.id)!;
      return `<g><rect x="${p.x}" y="${p.y}" width="${box_w}" height="${box_h}" rx="17" fill="#0d3350" stroke="#38d6f9" stroke-width="2"/><text x="${p.x + 18}" y="${p.y + 37}" fill="#eefaff" font-family="sans-serif" font-size="19" font-weight="bold">${textEscape(c.label.slice(0, 27))}</text><text x="${p.x + 18}" y="${p.y + 69}" fill="#91edff" font-family="sans-serif" font-size="15">${textEscape(c.type)}</text></g>`;
    })
    .join('');

  const links = model.relations
    .map((r) => {
      const a = node_pos.get(r.from)!;
      const b = node_pos.get(r.to)!;
      const x1 = a.x + box_w / 2;
      const y1 = a.y + box_h / 2;
      const x2 = b.x + box_w / 2;
      const y2 = b.y + box_h / 2;
      return `<path d="M${x1} ${y1} L${x2} ${y2}" class="arch-flow-edge" fill="none" stroke="#8b8fff" stroke-width="3" stroke-dasharray="7 5" marker-end="url(#arrow)"/>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="curriculum-map-svg lesson-arch-svg" role="img"><title>${heading}</title><desc>Modelo educativo ${level}, no certifica el diseño.</desc><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="#8b8fff"/></marker></defs><rect width="100%" height="100%" fill="#071729"/><text x="62" y="62" fill="#f3fbff" font-family="sans-serif" font-size="29" font-weight="bold">${heading}</text><text x="62" y="96" fill="#92dfff" font-family="sans-serif" font-size="16">C4 (${level}) simplificado — relaciones y límites requieren revisión humana</text><circle cx="90" cy="135" r="17" fill="#45d9ff"/><text x="122" y="142" fill="#fff" font-family="sans-serif" font-size="20">${level === 'C3' ? 'Frontera Contenedor' : 'Cliente'}</text>${links}${nodes}</svg>`;
}

export function moveC4ContainerOrder(
  items: readonly C4Container[],
  index: number,
  direction: 'up' | 'down',
): C4Container[] {
  const copy = items.map((c) => ({ ...c }));
  const target_idx = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || index >= copy.length || target_idx < 0 || target_idx >= copy.length) {
    return copy;
  }
  const tmp = copy[index];
  copy[index] = copy[target_idx];
  copy[target_idx] = tmp;
  return copy;
}

export function renameC4ContainerLabel(
  items: readonly C4Container[],
  id: string,
  next_label: string,
): C4Container[] {
  const trimmed = next_label.trim();
  if (!isWord(trimmed)) return items.map((c) => ({ ...c }));
  return items.map((c) => (c.id === id ? { ...c, label: trimmed } : { ...c }));
}

export function downloadC4ModelPng(model: C4Model, on_error: (msg: string) => void): void {
  const level = resolveC4Level(model);
  const canvas = document.createElement('canvas');
  canvas.width = 1_100;
  canvas.height = Math.max(480, 180 + Math.ceil(model.containers.length / 3) * 175 + 70);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    on_error('Canvas no disponible en este navegador');
    return;
  }
  ctx.fillStyle = '#071729';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e8fbff';
  ctx.font = 'bold 29px sans-serif';
  ctx.fillText(`NexoShop · ${C4_LEVEL_METADATA[level].title}`, 40, 55);
  ctx.fillStyle = '#9edfff';
  ctx.font = '16px sans-serif';
  ctx.fillText('C4 simplificado · Ilustración educativa', 40, 87);

  const centers = new Map(
    model.containers.map((c, i) => [
      c.id,
      { x: 58 + (i % 3) * 342 + 147, y: 150 + Math.floor(i / 3) * 170 + 52 },
    ]),
  );
  ctx.strokeStyle = '#8b8fff';
  ctx.lineWidth = 3;
  for (const rel of model.relations) {
    const a = centers.get(rel.from);
    const b = centers.get(rel.to);
    if (!a || !b) continue;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  for (const c of model.containers) {
    const pt = centers.get(c.id);
    if (!pt) continue;
    ctx.fillStyle = '#103550';
    ctx.fillRect(pt.x - 147, pt.y - 52, 294, 104);
    ctx.strokeStyle = '#38d6f9';
    ctx.strokeRect(pt.x - 147, pt.y - 52, 294, 104);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText(c.label.slice(0, 27), pt.x - 133, pt.y - 10);
    ctx.fillStyle = '#9edfff';
    ctx.font = '14px sans-serif';
    ctx.fillText(c.type, pt.x - 133, pt.y + 23);
  }
  canvas.toBlob((blob) => {
    if (!blob) {
      on_error('No se pudo exportar PNG');
      return;
    }
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `nexoshop-${level.toLowerCase()}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1_500);
  }, 'image/png');
}

export function renderC4AccessibleSummaryHtml(
  model: C4Model,
  semantic_warnings: readonly C4SemanticWarning[],
): string {
  const level = resolveC4Level(model);
  const meta = C4_LEVEL_METADATA[level];
  const by_id = new Map(model.containers.map((c) => [c.id, c]));

  return `<section class="c4-accessible-summary" aria-label="Resumen textual accesible del modelo C4">
    <h4>Resumen textual accesible (${textEscape(meta.title)})</h4>
    <p>${textEscape(meta.subtitle)} Total: <strong>${model.containers.length}</strong> elementos y <strong>${model.relations.length}</strong> relaciones dirigidas.</p>
    <ul>
      ${model.containers
        .map((c) => `<li><strong>${textEscape(c.label)}</strong> — Tipo: ${textEscape(c.type)} (ID: <code>${textEscape(c.id)}</code>)</li>`)
        .join('')}
    </ul>
    ${
      model.relations.length > 0
        ? `<p><strong>Contratos y dependencias declaradas:</strong></p>
          <ul>
            ${model.relations
              .map(
                (r) =>
                  `<li>${textEscape(by_id.get(r.from)?.label ?? r.from)} → ${textEscape(by_id.get(r.to)?.label ?? r.to)}: <em>${textEscape(r.label)}</em></li>`,
              )
              .join('')}
          </ul>`
        : '<p class="muted">Sin relaciones declaradas todavía.</p>'
    }
    ${
      semantic_warnings.length > 0
        ? `<div class="feedback bad">
            <strong>⚠ ${semantic_warnings.length} alerta(s) semántica(s) de arquitectura</strong>
            ${semantic_warnings
              .map(
                (w) =>
                  `<p><b>[${w.severity === 'high' ? 'ALTA' : 'MEDIA'}]</b> ${textEscape(w.message)} <span>Recomendación: ${textEscape(w.recommendation)}</span></p>`,
              )
              .join('')}
          </div>`
        : '<div class="feedback good"><strong>✓ Validación semántica sin alertas evidentes</strong><p>No se detectaron accesos directos Frontend→BD, inversiones de dominio, ciclos ni elementos aislados. La pertinencia de negocio sigue requiriendo revisión humana.</p></div>'
    }
  </section>`;
}

export type C4ContextualScenarioId =
  | 'libre'
  | 'hexagonal-s04'
  | 'checkout-outbox-s09'
  | 'multitenant-s12';

export type C4ContextualScenarioDef = {
  readonly id: C4ContextualScenarioId;
  readonly label: string;
  readonly expectedLevel: C4Level;
  readonly goal: string;
};

export const C4_CONTEXTUAL_SCENARIOS: readonly C4ContextualScenarioDef[] = Object.freeze([
  {
    id: 'libre',
    label: 'Exploración libre (reglas estructurales y semánticas generales)',
    expectedLevel: 'C2',
    goal: 'Diseña libremente cuidando fronteras, contratos explícitos y ausencia de ciclos.',
  },
  {
    id: 'hexagonal-s04',
    label: 'Caso S04 · Pedidos con Puertos y Adaptadores (C3)',
    expectedLevel: 'C3',
    goal: 'Exige Caso de Uso + Dominio / Agregado + Repositorio / Puerto sin inversión hacia Controlador.',
  },
  {
    id: 'checkout-outbox-s09',
    label: 'Caso S09 · Checkout resiliente con Tx/Outbox y Servicio de Pagos (C2)',
    expectedLevel: 'C2',
    goal: 'Exige API → Base de datos (SQL/Tx/Outbox) y API → Servicio externo con contrato explícito.',
  },
  {
    id: 'multitenant-s12',
    label: 'Caso S12 · Frontera de confianza B2B sin acceso directo a BD (C2)',
    expectedLevel: 'C2',
    goal: 'Exige frontera API explícita protegiendo Base de datos y cero saltos Frontend/Externo → BD.',
  },
]);

export type C4ContextualEvaluation = {
  readonly scenarioId: C4ContextualScenarioId;
  readonly status: 'PASS' | 'FAIL';
  readonly passedChecks: readonly string[];
  readonly missingChecks: readonly string[];
  readonly summary: string;
};

export function evaluateC4ContextualScenario(
  model: C4Model,
  scenario_id: C4ContextualScenarioId,
): C4ContextualEvaluation {
  const structural = validateC4(model);
  const semantic = analyzeC4Semantics(model);
  const high_warnings = semantic.filter((w) => w.severity === 'high');
  const passed: string[] = [];
  const missing: string[] = [];

  if (structural.length > 0) {
    missing.push(...structural);
  } else {
    passed.push('Estructura topológica válida (sin duplicados ni referencias huérfanas).');
  }

  if (high_warnings.length > 0) {
    missing.push(...high_warnings.map((w) => w.message));
  } else {
    passed.push('Cero violaciones semánticas severas (sin saltos directos a BD ni ciclos).');
  }

  const hasType = (t: C4ElementType): boolean => model.containers.some((c) => c.type === t);
  const by_id = new Map(model.containers.map((c) => [c.id, c]));
  const hasEdge = (from_t: C4ElementType, to_t: C4ElementType): boolean =>
    model.relations.some(
      (r) => by_id.get(r.from)?.type === from_t && by_id.get(r.to)?.type === to_t,
    );

  if (scenario_id === 'hexagonal-s04') {
    if (resolveC4Level(model) === 'C3') passed.push('Nivel C3 (Componentes) seleccionado.');
    else missing.push('Cambia al nivel C3 (Componentes) para modelar puertos y dominio.');

    if (hasType('Caso de Uso') && hasType('Dominio / Agregado') && hasType('Repositorio / Puerto')) {
      passed.push('Incluye Caso de Uso, Dominio / Agregado y Repositorio / Puerto.');
    } else {
      missing.push('Faltan componentes esenciales C3: Caso de Uso, Dominio / Agregado y Repositorio / Puerto.');
    }
  } else if (scenario_id === 'checkout-outbox-s09') {
    if (hasType('API') && hasType('Base de datos') && hasType('Servicio externo')) {
      passed.push('Contenedores API, Base de datos y Servicio externo presentes.');
    } else {
      missing.push('Incluye API, Base de datos y Servicio externo para modelar el flujo S09.');
    }
    if (hasEdge('API', 'Base de datos') && hasEdge('API', 'Servicio externo')) {
      passed.push('API coordina persistencia en Base de datos e integración hacia Servicio externo.');
    } else {
      missing.push('Conecta API → Base de datos y API → Servicio externo con contratos explícitos.');
    }
    const has_tx_or_outbox_contract = model.relations.some((r) =>
      /(outbox|tx|transacci|idempoten|evento)/i.test(r.label),
    );
    if (has_tx_or_outbox_contract) {
      passed.push('Contrato explícito de transacción/Outbox/idempotencia declarado en relación.');
    } else {
      missing.push('Declara explícitamente Tx, Outbox, Evento o Idempotencia en el contrato de relación.');
    }
  } else if (scenario_id === 'multitenant-s12') {
    if (hasType('Frontend') && hasType('API') && hasType('Base de datos')) {
      passed.push('Frontera Frontend → API → Base de datos declarada.');
    } else {
      missing.push('Declara explícitamente Frontend, API de autorización y Base de datos.');
    }
    if (hasEdge('Frontend', 'API') && hasEdge('API', 'Base de datos')) {
      passed.push('Todo acceso pasa por la frontera API antes de tocar almacenamiento.');
    } else {
      missing.push('Conecta Frontend → API y API → Base de datos sin atajos directos.');
    }
  }

  const ok = missing.length === 0;
  return {
    scenarioId: scenario_id,
    status: ok ? 'PASS' : 'FAIL',
    passedChecks: passed,
    missingChecks: missing,
    summary: ok
      ? '✓ PASS · El modelo C4 satisface las restricciones contextuales del escenario.'
      : `↺ FAIL · Faltan ${missing.length} condición(es) contextuales en el modelo C4.`,
  };
}
