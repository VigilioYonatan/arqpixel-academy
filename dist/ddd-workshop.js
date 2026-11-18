/**
 * Pure Domain-Driven Design (DDD) strategic & tactical workshop engine (`ARQ-014`).
 * Models polysemic ubiquitous language across Bounded Contexts, validates Context Map
 * integration patterns, evaluates Aggregate boundaries/invariants, and exports Markdown & Mermaid.
 */
export const DDD_BOUNDED_CONTEXT_LIST = [
    'Catálogo',
    'Ventas',
    'Inventario',
    'Pagos',
    'Envíos',
];
export const DDD_POLYSEMIC_TERMS = ['Producto', 'Cliente', 'Pedido', 'Cobro'];
export const DDD_POLYSEMIC_LENSES = Object.freeze([
    {
        term: 'Producto',
        context: 'Catálogo',
        localModelName: 'ItemPublicacion',
        keyAttributes: ['sku', 'tituloSeo', 'galeriaImagenes', 'atributosTecnicos'],
        invariantOrRule: 'No puede publicarse sin SKU válido ni categoría activa.',
    },
    {
        term: 'Producto',
        context: 'Ventas',
        localModelName: 'LineaCotizable',
        keyAttributes: ['sku', 'precioUnitarioCongelado', 'elegibleDescuento'],
        invariantOrRule: 'El precio de la línea se congela al confirmar el pedido.',
    },
    {
        term: 'Producto',
        context: 'Inventario',
        localModelName: 'UnidadAlmacenada',
        keyAttributes: ['sku', 'stockFisico', 'stockReservado', 'versionOptimista'],
        invariantOrRule: 'stockFisico - stockReservado >= 0 (prohibida la sobreventa).',
    },
    {
        term: 'Producto',
        context: 'Envíos',
        localModelName: 'BultoDespachable',
        keyAttributes: ['sku', 'pesoGramos', 'dimensionesCm', 'requiereCadenaFrio'],
        invariantOrRule: 'El peso y volumen determinan tarifa y transportista, no su descripción comercial.',
    },
    {
        term: 'Cliente',
        context: 'Ventas',
        localModelName: 'Comprador',
        keyAttributes: ['compradorId', 'nivelFidelidad', 'cuponesUsados'],
        invariantOrRule: 'Un cupón de uso único no puede aplicarse dos veces al mismo comprador.',
    },
    {
        term: 'Cliente',
        context: 'Pagos',
        localModelName: 'TitularFacturacion',
        keyAttributes: ['compradorId', 'tokenMetodoPago', 'paisFiscal', 'riesgoFraude'],
        invariantOrRule: 'Nunca almacenar PAN/CVV en claro; operar solo con token del PSP.',
    },
    {
        term: 'Cliente',
        context: 'Envíos',
        localModelName: 'DestinatarioEntrega',
        keyAttributes: ['nombreReceptor', 'direccionNormalizada', 'geocodigo', 'ventanaHoraria'],
        invariantOrRule: 'La dirección del envío se congela al emitir la guía logística.',
    },
    {
        term: 'Pedido',
        context: 'Ventas',
        localModelName: 'OrdenCompra (Aggregate Root)',
        keyAttributes: ['pedidoId', 'lineas', 'totalMonetario', 'estadoOrden'],
        invariantOrRule: 'Total = suma(lineas) - descuentos; mínimo 1 línea activa.',
    },
    {
        term: 'Pedido',
        context: 'Inventario',
        localModelName: 'SolicitudReserva',
        keyAttributes: ['pedidoId', 'itemsSolicitados', 'expiracionTtl'],
        invariantOrRule: 'Toda reserva expira o se confirma; nunca bloquea unidades indefinidamente.',
    },
    {
        term: 'Pedido',
        context: 'Envíos',
        localModelName: 'OrdenDespacho',
        keyAttributes: ['pedidoId', 'bultos', 'transportistaId', 'estadoTracking'],
        invariantOrRule: 'Solo se genera guía cuando el pago y la reserva fueron confirmados.',
    },
    {
        term: 'Cobro',
        context: 'Pagos',
        localModelName: 'TransaccionCobro (Aggregate Root)',
        keyAttributes: ['cobroId', 'idempotencyKey', 'monto', 'moneda', 'estadoPsp'],
        invariantOrRule: 'A lo sumo un cargo autorizado por (pedidoId, idempotencyKey).',
    },
    {
        term: 'Cobro',
        context: 'Ventas',
        localModelName: 'ReferenciaLiquidacion',
        keyAttributes: ['pedidoId', 'estadoPagoResumen', 'fechaConfirmacion'],
        invariantOrRule: 'Ventas reacciona al evento PagoAutorizado; no conoce reintentos internos del PSP.',
    },
]);
export const DDD_TACTICAL_CONCEPTS = Object.freeze([
    {
        id: 'concept-orden',
        conceptLabel: 'OrdenCompra con precio congelado y cupones',
        description: 'Calcula total comercial y protege las líneas cerradas del carrito.',
        expectedContext: 'Ventas',
    },
    {
        id: 'concept-reserva',
        conceptLabel: 'Reserva de stock con versión optimista',
        description: 'Descuenta disponibilidad física evitando sobreventa concurrente.',
        expectedContext: 'Inventario',
    },
    {
        id: 'concept-cobro',
        conceptLabel: 'Transacción idempotente con token PSP',
        description: 'Garantiza un único cargo ante timeouts o webhooks repetidos.',
        expectedContext: 'Pagos',
    },
    {
        id: 'concept-ficha',
        conceptLabel: 'Ficha SEO, fotos y atributos buscables del SKU',
        description: 'Optimiza descubrimiento comercial sin bloquear transacciones.',
        expectedContext: 'Catálogo',
    },
    {
        id: 'concept-guia',
        conceptLabel: 'Guía de despacho, peso volumétrico y ruta',
        description: 'Coordina entrega física con operadores logísticos.',
        expectedContext: 'Envíos',
    },
]);
export const DDD_CONTEXT_MAP_PATTERNS = [
    'Domain Events',
    'Anti-Corruption Layer',
    'Customer-Supplier',
    'Open Host Service',
    'Shared Database',
];
export function getPolysemicLensesForTerm(term) {
    return DDD_POLYSEMIC_LENSES.filter((lens) => lens.term === term);
}
export function evaluateUbiquitousLanguageAssignments(assignments) {
    const details = DDD_TACTICAL_CONCEPTS.map((item) => {
        const chosen = assignments[item.id] ?? '';
        const ok = chosen === item.expectedContext;
        return {
            id: item.id,
            conceptLabel: item.conceptLabel,
            chosen,
            expected: item.expectedContext,
            ok,
        };
    });
    const correct_count = details.filter((d) => d.ok).length;
    return {
        correctCount: correct_count,
        totalCount: DDD_TACTICAL_CONCEPTS.length,
        allCorrect: correct_count === DDD_TACTICAL_CONCEPTS.length,
        details,
    };
}
export function validateDddContextMap(relations) {
    const findings = [];
    if (relations.length === 0) {
        findings.push({
            code: 'EMPTY_CONTEXT_MAP',
            severity: 'error',
            message: 'Agrega al menos una relación explícita en el Context Map.',
        });
        return {
            valid: false,
            findings,
            summary: 'Context Map vacío: define cómo colaboran los Bounded Contexts.',
        };
    }
    const seen_pairs = new Set();
    const sync_adj = new Map();
    for (const rel of relations) {
        if (rel.upstream === rel.downstream) {
            findings.push({
                code: 'SELF_CONTEXT_RELATION',
                severity: 'error',
                message: `Relación reflexiva inválida en «${rel.downstream}».`,
            });
        }
        const pair_key = `${rel.upstream}→${rel.downstream}`;
        if (seen_pairs.has(pair_key)) {
            findings.push({
                code: 'DUPLICATE_CONTEXT_RELATION',
                severity: 'error',
                message: `Relación duplicada entre «${rel.upstream}» y «${rel.downstream}».`,
            });
        }
        seen_pairs.add(pair_key);
        if (rel.pattern === 'Shared Database') {
            findings.push({
                code: 'SHARED_DATABASE_ANTIPATTERN',
                severity: 'error',
                message: `Antipatrón Shared Database entre «${rel.upstream}» y «${rel.downstream}»: acopla esquemas, bloquea despliegues independientes y rompe invariantes.`,
            });
        }
        if (rel.upstream === 'PSP Externo Legado' && rel.pattern !== 'Anti-Corruption Layer') {
            findings.push({
                code: 'MISSING_ACL_FOR_LEGACY_PSP',
                severity: 'error',
                message: `Integrar «PSP Externo Legado» con «${rel.downstream}» mediante «${rel.pattern}» filtra vocabulario externo al dominio. Usa Anti-Corruption Layer.`,
            });
        }
        // Track synchronous coupling edges (Customer-Supplier / Open Host Service)
        if (rel.pattern === 'Customer-Supplier' || rel.pattern === 'Open Host Service') {
            const list = sync_adj.get(rel.upstream) ?? [];
            list.push(rel.downstream);
            sync_adj.set(rel.upstream, list);
        }
    }
    // Detect synchronous cycle across bounded contexts
    const visiting = new Set();
    const visited = new Set();
    let has_sync_cycle = false;
    const walk = (node) => {
        if (has_sync_cycle)
            return;
        visiting.add(node);
        for (const next of sync_adj.get(node) ?? []) {
            if (visiting.has(next)) {
                has_sync_cycle = true;
                return;
            }
            if (!visited.has(next))
                walk(next);
        }
        visiting.delete(node);
        visited.add(node);
    };
    for (const node of sync_adj.keys()) {
        if (!visited.has(node))
            walk(node);
    }
    if (has_sync_cycle) {
        findings.push({
            code: 'SYNCHRONOUS_CYCLE',
            severity: 'error',
            message: 'Ciclo síncrono entre Bounded Contexts detectado: desacopla al menos una frontera con Domain Events.',
        });
    }
    const has_errors = findings.some((f) => f.severity === 'error');
    return {
        valid: !has_errors,
        findings,
        summary: !has_errors
            ? `Context Map coherente (${relations.length} integraciones explícitas sin base de datos compartida ni ciclos síncronos).`
            : `Revisa ${findings.length} hallazgo(s) en el Context Map antes de congelar fronteras.`,
    };
}
export const AGGREGATE_ROOT_CANDIDATES = [
    { id: 'OrdenCompra', label: 'OrdenCompra (Ventas)', targetContext: 'Ventas' },
    { id: 'StockItem', label: 'StockItem (Inventario)', targetContext: 'Inventario' },
    {
        id: 'MegaAgregadoEcommerce',
        label: 'MegaAgregadoEcommerce (Catálogo + Ventas + Pagos + Envíos)',
        targetContext: 'Ventas',
    },
];
export const AGGREGATE_INTERNAL_ENTITIES = [
    { id: 'lineas-pedido', label: 'LineaOrden (cantidad + precio congelado)', belongsTo: 'OrdenCompra' },
    { id: 'cupon-aplicado', label: 'DescuentoAplicado (Value Object)', belongsTo: 'OrdenCompra' },
    { id: 'reserva-lote', label: 'ReservaActiva (unidades + TTL)', belongsTo: 'StockItem' },
    { id: 'catalogo-global-fotos', label: 'Catálogo completo de fotos y reseñas SEO', belongsTo: 'FOREIGN' },
    { id: 'historial-psp-tarjetas', label: 'Registro crudo de reintentos HTTP del PSP', belongsTo: 'FOREIGN' },
    { id: 'flota-camiones-gps', label: 'Tracking GPS en vivo del camión de reparto', belongsTo: 'FOREIGN' },
];
export const AGGREGATE_INVARIANTS = [
    {
        id: 'inv-total-positivo',
        label: 'Total de la orden = suma(líneas) - descuento >= 0 y al menos 1 línea',
        appliesTo: 'OrdenCompra',
    },
    {
        id: 'inv-no-overselling',
        label: 'stockFisico - stockReservado >= 0 protegido con versión optimista',
        appliesTo: 'StockItem',
    },
    {
        id: 'inv-no-mutar-pagada',
        label: 'Prohibido añadir/quitar líneas cuando la orden pasa a CONFIRMADA',
        appliesTo: 'OrdenCompra',
    },
];
export const AGGREGATE_EVENTUAL_EVENTS = [
    {
        id: 'evt-reservar-stock',
        label: 'OrdenCreada → Inventario reserva unidades asíncronamente (Outbox)',
    },
    {
        id: 'evt-autorizar-cobro',
        label: 'StockReservado → Pagos ejecuta cobro idempotente',
    },
    {
        id: 'evt-despachar-envio',
        label: 'PagoAutorizado → Envíos emite guía logística',
    },
];
export function evaluateDddAggregateDesign(design) {
    const issues = [];
    const strengths = [];
    if (design.rootId === 'MegaAgregadoEcommerce') {
        issues.push('Agregado gigante detectado: «MegaAgregadoEcommerce» fusiona múltiples Bounded Contexts en una sola transacción ACID, causando contención severa de bloqueos.');
    }
    const foreign_selected = AGGREGATE_INTERNAL_ENTITIES.filter((ent) => design.internalEntities.includes(ent.id) && ent.belongsTo === 'FOREIGN');
    if (foreign_selected.length > 0) {
        issues.push(`Frontera inflada: incluiste entidades ajenas al agregado (${foreign_selected.map((f) => f.label).join('; ')}). Referencia otros contextos solo por ID.`);
    }
    if (design.internalEntities.length === 0) {
        issues.push('Selecciona al menos una entidad interna o Value Object coherente con la raíz del agregado.');
    }
    if (design.rootId === 'OrdenCompra') {
        if (design.internalEntities.includes('reserva-lote')) {
            issues.push('Mezclaste «ReservaActiva» de Inventario dentro de «OrdenCompra» (Ventas): cada agregado debe residir en un único Bounded Context.');
        }
        if (!design.invariants.includes('inv-total-positivo')) {
            issues.push('Falta la invariante transaccional del cálculo de total y mínimo de líneas en OrdenCompra.');
        }
        else {
            strengths.push('Invariante monetaria inmediata protegida dentro de OrdenCompra.');
        }
    }
    if (design.rootId === 'StockItem') {
        if (design.internalEntities.includes('lineas-pedido') ||
            design.internalEntities.includes('cupon-aplicado')) {
            issues.push('Mezclaste reglas comerciales de Ventas (líneas/cupones) dentro del agregado de Inventario «StockItem».');
        }
        if (!design.invariants.includes('inv-no-overselling')) {
            issues.push('Riesgo crítico de sobreventa: «StockItem» debe exigir la invariante stockFisico - stockReservado >= 0.');
        }
        if (!design.optimisticConcurrency) {
            issues.push('Riesgo de condición de carrera (sobreventa): «StockItem» requiere control de concurrencia optimista (versión) ante compras simultáneas.');
        }
        else {
            strengths.push('Control optimista activado contra sobreventa concurrente.');
        }
    }
    if (design.eventualEvents.length === 0) {
        issues.push('No delegaste ningún efecto entre contextos por evento de dominio: intentar coordinar Ventas, Inventario, Pagos y Envíos sin eventos empuja a transacciones distribuidas frágiles.');
    }
    else {
        strengths.push(`Coordinación eventual explícita mediante ${design.eventualEvents.length} evento(s) de dominio.`);
    }
    return {
        status: issues.length === 0 ? 'PASS' : 'FAIL',
        issues,
        strengths,
        requiresHumanReviewNote: 'REQUIRES_REVIEW: La granularidad final del agregado depende de la tasa real de contención y acuerdos de equipos.',
    };
}
export const INITIAL_DDD_CONTEXT_MAP = Object.freeze([
    {
        upstream: 'Ventas',
        downstream: 'Inventario',
        pattern: 'Domain Events',
        contractSummary: 'Publica OrdenCreada v1 vía Outbox para reservar unidades',
    },
    {
        upstream: 'PSP Externo Legado',
        downstream: 'Pagos',
        pattern: 'Anti-Corruption Layer',
        contractSummary: 'Traduce códigos propietarios del PSP al modelo TransaccionCobro',
    },
    {
        upstream: 'Catálogo',
        downstream: 'Ventas',
        pattern: 'Open Host Service',
        contractSummary: 'Expone consulta de precio vigente para congelarlo al cotizar',
    },
]);
function safeMermaidText(raw) {
    return raw
        .replace(/[&<>"']/g, '')
        .replace(/[\[\]`{}|\r\n]/g, ' ')
        .trim();
}
export function exportDddContextMapMermaid(relations) {
    const nodes = new Set();
    for (const rel of relations) {
        nodes.add(rel.upstream);
        nodes.add(rel.downstream);
    }
    const node_list = [...nodes];
    const alias_map = new Map(node_list.map((name, idx) => [name, `ctx${idx + 1}`]));
    const lines = [
        'flowchart LR',
        ...node_list.map((name) => `  ${alias_map.get(name)}["${safeMermaidText(name)}"]`),
        ...relations.map((r) => `  ${alias_map.get(r.upstream)} -->|"${safeMermaidText(r.pattern)}: ${safeMermaidText(r.contractSummary)}"| ${alias_map.get(r.downstream)}`),
    ];
    return `${lines.join('\n')}\n`;
}
export function exportDddContextMapSvg(relations) {
    const xmlEsc = (val) => val.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
    const all_contexts = ['Catálogo', 'Ventas', 'Inventario', 'Pagos', 'Envíos', 'PSP Externo Legado'];
    const coords = new Map(all_contexts.map((ctx, idx) => [
        ctx,
        {
            x: 135 + (idx % 3) * 285,
            y: 62 + Math.floor(idx / 3) * 102,
        },
    ]));
    const edges_svg = relations
        .map((rel) => {
        const a = coords.get(rel.upstream);
        const b = coords.get(rel.downstream);
        if (!a || !b)
            return '';
        const is_antipattern = rel.pattern === 'Shared Database' ||
            (rel.upstream === 'PSP Externo Legado' && rel.pattern !== 'Anti-Corruption Layer');
        const stroke = is_antipattern ? '#ff7890' : '#38d6f9';
        const mid_x = Math.round((a.x + b.x) / 2);
        const mid_y = Math.round((a.y + b.y) / 2) - 8;
        return `<g>
        <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${is_antipattern ? '' : 'arch-flow-edge'}" stroke="${stroke}" stroke-width="2.2" marker-end="${is_antipattern ? 'url(#ddd-arrow-bad)' : 'url(#ddd-arrow-ok)'}"/>
        <text x="${mid_x}" y="${mid_y}" text-anchor="middle" fill="#9beeff" font-size="9.5" font-family="monospace">${xmlEsc(rel.pattern.slice(0, 22))}</text>
      </g>`;
    })
        .join('');
    const nodes_svg = all_contexts
        .map((ctx) => {
        const pt = coords.get(ctx);
        const is_ext = ctx === 'PSP Externo Legado';
        return `<g>
        <rect x="${pt.x - 92}" y="${pt.y - 26}" width="184" height="52" rx="11" fill="${is_ext ? '#291f17' : '#0b253c'}" stroke="${is_ext ? '#ffd77c' : '#18e1ee'}" stroke-width="1.6"/>
        <text x="${pt.x}" y="${pt.y - 2}" text-anchor="middle" fill="#f2fbff" font-size="12" font-weight="bold" font-family="sans-serif">${xmlEsc(ctx)}</text>
        <text x="${pt.x}" y="${pt.y + 15}" text-anchor="middle" fill="#8fd8f2" font-size="9.5" font-family="monospace">${is_ext ? 'Sistema externo' : 'Bounded Context'}</text>
      </g>`;
    })
        .join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 226" width="840" height="226" class="curriculum-map-svg lesson-arch-svg" role="img" aria-label="Diagrama SVG del Context Map DDD"><title>Context Map DDD · NexoShop</title><desc>${relations.length} integraciones declaradas entre contextos acotados.</desc><defs><marker id="ddd-arrow-ok" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#38d6f9"/></marker><marker id="ddd-arrow-bad" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#ff7890"/></marker></defs><rect width="840" height="226" rx="14" fill="#071628"/>${edges_svg}${nodes_svg}</svg>`;
}
export function exportDddWorkshopMarkdown(params) {
    const lenses = getPolysemicLensesForTerm(params.selectedTerm);
    const map_eval = validateDddContextMap(params.contextMap);
    const agg_eval = evaluateDddAggregateDesign(params.aggregateDesign);
    const mermaid = exportDddContextMapMermaid(params.contextMap);
    return [
        '# Dossier DDD Workshop · NexoShop',
        '',
        '## 1. Lenguaje Ubicuo Polisémico (`' + params.selectedTerm + '`)',
        ...lenses.map((l) => `- **${l.context}** → \`${l.localModelName}\` (${l.keyAttributes.join(', ')}) — *Regla:* ${l.invariantOrRule}`),
        '',
        `## 2. Context Map (${map_eval.valid ? 'PASS' : 'FAIL'})`,
        map_eval.summary,
        '',
        '```mermaid',
        mermaid.trimEnd(),
        '```',
        '',
        ...(map_eval.findings.length > 0
            ? ['### Hallazgos del Context Map', ...map_eval.findings.map((f) => `- [${f.code}] ${f.message}`), '']
            : []),
        `## 3. Diseño de Agregado (${agg_eval.status})`,
        `- **Aggregate Root:** ${params.aggregateDesign.rootId}`,
        `- **Concurrencia optimista:** ${params.aggregateDesign.optimisticConcurrency ? 'Sí' : 'No'}`,
        `- **Entidades internas:** ${params.aggregateDesign.internalEntities.join(', ') || 'Ninguna'}`,
        `- **Invariantes inmediatas:** ${params.aggregateDesign.invariants.join(', ') || 'Ninguna'}`,
        `- **Eventos eventuales:** ${params.aggregateDesign.eventualEvents.join(', ') || 'Ninguno'}`,
        '',
        ...(agg_eval.issues.length > 0
            ? ['### Riesgos detectados', ...agg_eval.issues.map((i) => `- ⚠ ${i}`), '']
            : []),
        `> ${agg_eval.requiresHumanReviewNote}`,
        '',
    ].join('\n');
}
const escHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
export function renderDddWorkshopHtml(options) {
    const { selectedTerm, conceptChoices, contextMapLinks, aggregateDraft } = options;
    const lenses = getPolysemicLensesForTerm(selectedTerm);
    const cm_eval = validateDddContextMap(contextMapLinks);
    return `<div data-workspace-pane="context">
    <span class="overline">01 · LENGUAJE UBICUO POLISÉMICO</span>
    <h2>Un mismo nombre, modelos distintos por Bounded Context</h2>
    <p>Observa cómo cambia el modelo de <strong>${escHtml(selectedTerm)}</strong> según el límite semántico de cada contexto en NexoShop.</p>
    <label class="field-label max-w-320">Término de negocio a inspeccionar
      <select id="ddd-term-select">
        ${DDD_POLYSEMIC_TERMS.map((t) => `<option value="${escHtml(t)}" ${t === selectedTerm ? 'selected' : ''}>${escHtml(t)}</option>`).join('')}
      </select>
    </label>
    <div class="specialization-grid my-14">
      ${lenses
        .map((l) => `<article class="solution-box">
            <span class="overline">${escHtml(l.context.toUpperCase())}</span>
            <h3>${escHtml(l.localModelName)}</h3>
            <p><b>Atributos:</b> <code>${escHtml(l.keyAttributes.join(', '))}</code></p>
            <p><small><b>Invariante:</b> ${escHtml(l.invariantOrRule)}</small></p>
          </article>`)
        .join('')}
    </div>
  </div>

  <div data-workspace-pane="work">
    <hr class="section-divider"/>
    <span class="overline">02 · CLASIFICACIÓN DE RESPONSABILIDADES Y CONTEXT MAP</span>
    <h2>Ubica conceptos e integraciones entre contextos</h2>
    <div id="ddd-puzzle">
      ${DDD_TACTICAL_CONCEPTS.map((item) => `<label class="ddd-row">
          <div><strong>${escHtml(item.conceptLabel)}</strong><br/><small class="muted">${escHtml(item.description)}</small></div>
          <select data-ddd-concept="${item.id}">
            <option value="">Elegir contexto</option>
            ${DDD_BOUNDED_CONTEXT_LIST.map((ctx) => `<option value="${escHtml(ctx)}" ${conceptChoices[item.id] === ctx ? 'selected' : ''}>${escHtml(ctx)}</option>`).join('')}
          </select>
        </label>`).join('')}
    </div>
    <button type="button" class="btn secondary small" id="ddd-check">Verificar ubicación de conceptos</button>
    <div id="ddd-concepts-result" role="status"></div>

    <h3 class="mt-22">Modelador de Context Map (ACL, Eventos, OHS)</h3>
    <div class="builder-box">
      <label>Upstream
        <select id="ddd-cm-upstream">
          ${[...DDD_BOUNDED_CONTEXT_LIST, 'PSP Externo Legado'].map((c) => `<option value="${escHtml(c)}">${escHtml(c)}</option>`).join('')}
        </select>
      </label>
      <label>Downstream
        <select id="ddd-cm-downstream">
          ${DDD_BOUNDED_CONTEXT_LIST.map((c) => `<option value="${escHtml(c)}">${escHtml(c)}</option>`).join('')}
        </select>
      </label>
      <label>Patrón de relación
        <select id="ddd-cm-pattern">
          ${DDD_CONTEXT_MAP_PATTERNS.map((p) => `<option value="${escHtml(p)}">${escHtml(p)}</option>`).join('')}
        </select>
      </label>
      <label>Acuerdo / evento
        <input id="ddd-cm-contract" placeholder="Ej. Evento StockReservado v1" maxlength="60"/>
      </label>
      <button type="button" class="btn secondary small" id="ddd-cm-add">+ Añadir relación</button>
    </div>
    <div class="map-svg-wrap my-14" tabindex="0" role="region" aria-label="Vista visual del Context Map DDD">
      ${exportDddContextMapSvg(contextMapLinks)}
    </div>
    <div class="edge-list" id="ddd-cm-list">
      ${contextMapLinks
        .map((rel, idx) => `<span><b>${escHtml(rel.upstream)}</b> → <b>${escHtml(rel.downstream)}</b> [${escHtml(rel.pattern)}]: ${escHtml(rel.contractSummary)} <button type="button" data-ddd-cm-remove="${idx}" aria-label="Eliminar integración ${idx + 1}">×</button></span>`)
        .join('')}
    </div>
    <div class="feedback ${cm_eval.valid ? 'good' : 'bad'}" role="status">
      <strong>${cm_eval.valid ? '✓ Context Map saludable' : '⚠ Riesgo en Context Map'}</strong>
      <p>${escHtml(cm_eval.summary)}</p>
      ${cm_eval.findings.map((f) => `<p>• ${escHtml(f.message)}</p>`).join('')}
    </div>

    <hr class="section-divider"/>
    <span class="overline">03 · DISEÑO DE AGREGADO E INVARIANTES</span>
    <h2>Frontera transaccional vs consistencia eventual</h2>
    <label class="field-label">Aggregate Root candidato
      <select id="ddd-agg-root">
        ${AGGREGATE_ROOT_CANDIDATES.map((r) => `<option value="${r.id}" ${aggregateDraft.rootId === r.id ? 'selected' : ''}>${escHtml(r.label)}</option>`).join('')}
      </select>
    </label>
    <p><strong>Entidades / Value Objects dentro de la misma transacción ACID:</strong></p>
    <div class="suite-checks">
      ${AGGREGATE_INTERNAL_ENTITIES.map((e) => `<label><input type="checkbox" data-ddd-ent="${e.id}" ${aggregateDraft.internalEntities.includes(e.id) ? 'checked' : ''}/> ${escHtml(e.label)}</label>`).join('')}
    </div>
    <p class="mt-14"><strong>Invariantes inmediatas protegidas por la raíz:</strong></p>
    <div class="suite-checks">
      ${AGGREGATE_INVARIANTS.map((inv) => `<label><input type="checkbox" data-ddd-inv="${inv.id}" ${aggregateDraft.invariants.includes(inv.id) ? 'checked' : ''}/> ${escHtml(inv.label)}</label>`).join('')}
    </div>
    <p class="mt-14"><strong>Efectos delegados por Eventos de Dominio (consistencia eventual):</strong></p>
    <div class="suite-checks">
      ${AGGREGATE_EVENTUAL_EVENTS.map((ev) => `<label><input type="checkbox" data-ddd-evt="${ev.id}" ${aggregateDraft.eventualEvents.includes(ev.id) ? 'checked' : ''}/> ${escHtml(ev.label)}</label>`).join('')}
    </div>
    <label class="suite-option mt-12">
      <input type="checkbox" id="ddd-agg-optimistic" ${aggregateDraft.optimisticConcurrency ? 'checked' : ''}/>
      <span>Activar control de concurrencia optimista (campo <code>version</code>) contra condiciones de carrera / sobreventa</span>
    </label>
  </div>

  <div data-workspace-pane="validation">
    <div class="inline-actions mt-16">
      <button type="button" class="btn primary small" id="ddd-agg-evaluate">Evaluar diseño de Agregado</button>
      <button type="button" class="btn secondary small" id="ddd-export-svg">Exportar Context Map (.svg)</button>
      <button type="button" class="btn secondary small" id="ddd-export-mermaid">Exportar Context Map (.mmd)</button>
      <button type="button" class="btn secondary small" id="ddd-export-md">Exportar Dossier DDD (.md)</button>
    </div>
    <div id="lab-result" role="status"></div>
  </div>`;
}
