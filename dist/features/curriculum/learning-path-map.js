import { EXPECTED_CURRICULUM_NODES_COUNT } from '../shared/constants/app.constants.js';
import { resolveModuleContentReadiness } from '../shared/ui/visual-clarity.js';
import { CURRICULUM_PREREQUISITES, } from './constants/curriculum.constants.js';
function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
}
function normalizeSearchText(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}
export function validateCurriculumMapDag(known_node_ids, prereq_map = CURRICULUM_PREREQUISITES) {
    const errors = [];
    const known_set = new Set(known_node_ids);
    for (const node_id of known_node_ids) {
        if (!Object.prototype.hasOwnProperty.call(prereq_map, node_id)) {
            errors.push(`Nodo sin definición de prerrequisitos: ${node_id}`);
            continue;
        }
        const prereqs = prereq_map[node_id] ?? [];
        if (new Set(prereqs).size !== prereqs.length) {
            errors.push(`Prerrequisitos duplicados en ${node_id}`);
        }
        for (const req_id of prereqs) {
            if (req_id === node_id) {
                errors.push(`Autociclo detectado en ${node_id}`);
            }
            else if (!known_set.has(req_id)) {
                errors.push(`Prerrequisito desconocido ${req_id} referenciado por ${node_id}`);
            }
        }
    }
    for (const configured_id of Object.keys(prereq_map)) {
        if (!known_set.has(configured_id)) {
            errors.push(`Nodo huérfano en tabla de prerrequisitos: ${configured_id}`);
        }
    }
    const visiting = new Set();
    const visited = new Set();
    const depths = {};
    const computeDepth = (node_id) => {
        if (depths[node_id] !== undefined)
            return depths[node_id];
        if (visiting.has(node_id)) {
            errors.push(`Ciclo curricular detectado involucrando ${node_id}`);
            return 0;
        }
        visiting.add(node_id);
        const prereqs = prereq_map[node_id] ?? [];
        let max_parent = -1;
        for (const req_id of prereqs) {
            if (known_set.has(req_id)) {
                max_parent = Math.max(max_parent, computeDepth(req_id));
            }
        }
        visiting.delete(node_id);
        visited.add(node_id);
        const depth = max_parent + 1;
        depths[node_id] = depth;
        return depth;
    };
    for (const node_id of known_node_ids) {
        if (!visited.has(node_id))
            computeDepth(node_id);
    }
    return {
        valid: errors.length === 0,
        errors,
        depths,
    };
}
export function buildCurriculumMapModel(modules, missions, paths, completed_module_ids, awarded_mission_ids, prereq_map = CURRICULUM_PREREQUISITES) {
    const all_ids = [...modules.map((m) => m.id), ...missions.map((s) => s.id)];
    const dag = validateCurriculumMapDag(all_ids, prereq_map);
    if (!dag.valid) {
        throw new Error(`Mapa curricular inválido: ${dag.errors.join('; ')}`);
    }
    const completed_set = new Set([...completed_module_ids, ...awarded_mission_ids]);
    const dependents_map = new Map(all_ids.map((id) => [id, []]));
    for (const node_id of all_ids) {
        for (const req_id of prereq_map[node_id] ?? []) {
            dependents_map.get(req_id)?.push(node_id);
        }
    }
    const paths_by_module = new Map();
    for (const learning_path of paths) {
        for (const mod_id of learning_path.modules) {
            const list = paths_by_module.get(mod_id) ?? [];
            list.push(learning_path.id);
            paths_by_module.set(mod_id, list);
        }
    }
    const draft_nodes = [];
    for (const mod of modules) {
        const prerequisites = prereq_map[mod.id] ?? [];
        const missing = prerequisites.filter((req) => !completed_set.has(req));
        const readiness = resolveModuleContentReadiness(mod, completed_module_ids);
        const status = readiness === 'coming_soon'
            ? 'coming_soon'
            : readiness === 'completed'
                ? 'completed'
                : missing.length === 0
                    ? 'ready'
                    : 'pending_prereq';
        draft_nodes.push({
            id: mod.id,
            kind: 'lesson',
            stage: mod.level,
            title: mod.title,
            summary: mod.concept,
            estimatedMinutes: mod.readingMinutes,
            prerequisites,
            missingPrerequisites: missing,
            unlocks: dependents_map.get(mod.id) ?? [],
            pathIds: paths_by_module.get(mod.id) ?? [],
            status,
            depth: dag.depths[mod.id] ?? 0,
            primaryRoute: `modulo/${mod.id}`,
        });
    }
    for (const mission of missions) {
        const prerequisites = prereq_map[mission.id] ?? [];
        const missing = prerequisites.filter((req) => !completed_set.has(req));
        const is_done = completed_set.has(mission.id);
        const status = is_done
            ? 'completed'
            : missing.length === 0
                ? 'ready'
                : 'pending_prereq';
        draft_nodes.push({
            id: mission.id,
            kind: 'senior_mission',
            stage: 'Senior',
            title: mission.title,
            summary: mission.brief,
            estimatedMinutes: 25,
            prerequisites,
            missingPrerequisites: missing,
            unlocks: dependents_map.get(mission.id) ?? [],
            pathIds: paths.some((p) => p.id === 'R08') ? ['R08'] : [],
            status,
            depth: dag.depths[mission.id] ?? 0,
            primaryRoute: `mision/${mission.id}`,
            workshopRoute: `taller-senior/${mission.id}`,
        });
    }
    const recommended = draft_nodes.find((n) => n.status === 'ready') ?? draft_nodes.find((n) => n.status !== 'completed') ?? null;
    const recommended_id = recommended ? recommended.id : null;
    const nodes = draft_nodes.map((node) => ({
        ...node,
        isRecommendedNext: node.id === recommended_id,
    }));
    const completed_lessons = nodes.filter((n) => n.kind === 'lesson' && n.status === 'completed').length;
    const completed_missions = nodes.filter((n) => n.kind === 'senior_mission' && n.status === 'completed').length;
    const ready_count = nodes.filter((n) => n.status === 'ready').length;
    const pending_count = nodes.filter((n) => n.status === 'pending_prereq').length;
    return {
        nodes,
        summary: {
            totalNodes: nodes.length || EXPECTED_CURRICULUM_NODES_COUNT,
            completedLessons: completed_lessons,
            completedMissions: completed_missions,
            totalCompleted: completed_lessons + completed_missions,
            readyCount: ready_count,
            pendingPrereqCount: pending_count,
            recommendedNodeId: recommended_id,
        },
    };
}
export function filterCurriculumMapNodes(model, filter) {
    const normalized_query = normalizeSearchText(filter.query);
    return model.nodes.filter((node) => {
        if (filter.stage !== 'ALL' && node.stage !== filter.stage)
            return false;
        if (filter.status === 'READY' && node.status !== 'ready')
            return false;
        if (filter.status === 'COMPLETED' && node.status !== 'completed')
            return false;
        if (filter.status === 'PENDING_PREREQ' && node.status !== 'pending_prereq')
            return false;
        if (filter.pathId !== 'ALL' && !node.pathIds.includes(filter.pathId))
            return false;
        if (normalized_query.length > 0) {
            const haystack = normalizeSearchText(`${node.id} ${node.title} ${node.summary} ${node.stage}`);
            if (!haystack.includes(normalized_query))
                return false;
        }
        return true;
    });
}
export function nextMapFocusIndex(current_index, key, total_items, columns = 4) {
    if (total_items <= 0)
        return -1;
    const clamped = Math.max(0, Math.min(current_index, total_items - 1));
    if (key === 'ArrowRight')
        return Math.min(total_items - 1, clamped + 1);
    if (key === 'ArrowLeft')
        return Math.max(0, clamped - 1);
    if (key === 'ArrowDown')
        return Math.min(total_items - 1, clamped + columns);
    if (key === 'ArrowUp')
        return Math.max(0, clamped - columns);
    if (key === 'Home')
        return 0;
    if (key === 'End')
        return total_items - 1;
    return clamped;
}
function statusBadgeMeta(node) {
    if (node.status === 'coming_soon') {
        return { symbol: '◌', label: 'Próximamente', css: 'map-node-pending' };
    }
    if (node.status === 'completed') {
        return { symbol: '✓', label: 'Completado', css: 'map-node-completed' };
    }
    if (node.isRecommendedNext) {
        return { symbol: '★', label: 'Siguiente recomendado', css: 'map-node-recommended' };
    }
    if (node.status === 'ready') {
        return { symbol: '▶', label: 'Listo para cursar', css: 'map-node-ready' };
    }
    return { symbol: '◇', label: 'Prerrequisito sugerido', css: 'map-node-pending' };
}
export function renderCurriculumMapSvg(all_nodes, selected_node_id) {
    const stages = ['Básico', 'Intermedio', 'Avanzado', 'Senior'];
    const coords = new Map();
    stages.forEach((stage, stage_idx) => {
        const group = all_nodes.filter((n) => n.stage === stage);
        const base_y = 58 + stage_idx * 86;
        group.forEach((node, idx) => {
            const step = group.length > 1 ? 820 / (group.length - 1) : 0;
            const x = 90 + Math.round(idx * step);
            coords.set(node.id, { x, y: base_y });
        });
    });
    const selected = all_nodes.find((n) => n.id === selected_node_id) ?? all_nodes[0];
    const active_prereqs = new Set(selected?.prerequisites ?? []);
    const active_unlocks = new Set(selected?.unlocks ?? []);
    const edges_svg = [];
    for (const node of all_nodes) {
        const to = coords.get(node.id);
        if (!to)
            continue;
        for (const req_id of node.prerequisites) {
            const from = coords.get(req_id);
            if (!from)
                continue;
            const is_highlighted = (selected && node.id === selected.id) ||
                (selected && req_id === selected.id);
            const stroke = is_highlighted ? '#38d6f9' : '#244869';
            const width = is_highlighted ? '2.4' : '1';
            const opacity = is_highlighted ? '0.95' : '0.38';
            const edge_cls = is_highlighted ? ' class="arch-flow-edge"' : '';
            edges_svg.push(`<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"${edge_cls} stroke="${stroke}" stroke-width="${width}" stroke-opacity="${opacity}"/>`);
        }
    }
    const stage_labels_svg = stages
        .map((stage, idx) => `<text x="16" y="${62 + idx * 86}" fill="#9edfff" font-size="11" font-family="sans-serif" font-weight="bold">${escapeHtml(stage.toUpperCase())}</text>`)
        .join('');
    const nodes_svg = all_nodes
        .map((node) => {
        const pt = coords.get(node.id);
        if (!pt)
            return '';
        const is_selected = selected?.id === node.id;
        const is_related = active_prereqs.has(node.id) || active_unlocks.has(node.id);
        const fill = node.status === 'completed'
            ? '#1d6f58'
            : node.status === 'ready'
                ? '#12466e'
                : '#10243a';
        const stroke = is_selected
            ? '#ffe07b'
            : is_related
                ? '#38d6f9'
                : node.status === 'completed'
                    ? '#47d4a4'
                    : '#2d577b';
        const radius = is_selected ? 15 : 12;
        return `<g data-map-svg-node="${escapeHtml(node.id)}"><circle cx="${pt.x}" cy="${pt.y}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${is_selected ? '3' : '1.6'}"/><text x="${pt.x}" y="${pt.y + 4}" text-anchor="middle" fill="#f4f9ff" font-size="8.5" font-family="monospace" font-weight="bold">${escapeHtml(node.id)}</text></g>`;
    })
        .join('');
    const selected_label = selected ? `${selected.id} (${selected.title})` : 'ninguno';
    return `<svg class="curriculum-map-svg" viewBox="0 0 940 365" role="img" aria-label="Grafo curricular de 54 nodos y sus dependencias"><title>Mapa curricular de 54 nodos de ARQPIXEL</title><desc>Conecta 12 módulos básicos, 12 intermedios, 12 avanzados y 18 misiones Senior. Nodo enfocado: ${escapeHtml(selected_label)}.</desc><rect width="940" height="365" rx="14" fill="#071526"/>${stage_labels_svg}${edges_svg.join('')}${nodes_svg}</svg>`;
}
export function renderNodeInspectorHtml(node, node_lookup, paths) {
    if (!node) {
        return `<div class="aside-panel" role="region" aria-label="Detalle del nodo seleccionado"><h3>Sin nodos coincidentes</h3><p>Ajusta los filtros de etapa, estado o búsqueda para inspeccionar un módulo o misión Senior.</p></div>`;
    }
    const badge = statusBadgeMeta(node);
    const path_titles = node.pathIds
        .map((pid) => paths.find((p) => p.id === pid))
        .filter((p) => Boolean(p));
    const prereq_items = node.prerequisites.length
        ? node.prerequisites
            .map((req_id) => {
            const req_node = node_lookup.get(req_id);
            const done = req_node?.status === 'completed';
            return `<li><button type="button" class="map-rel-chip ${done ? 'done' : 'pending'}" data-map-select="${escapeHtml(req_id)}">${done ? '✓' : '○'} ${escapeHtml(req_id)} · ${escapeHtml(req_node?.title ?? req_id)}</button></li>`;
        })
            .join('')
        : '<li><span class="muted">Nodo de entrada — sin prerrequisitos previos.</span></li>';
    const unlock_items = node.unlocks.length
        ? node.unlocks
            .map((dep_id) => {
            const dep_node = node_lookup.get(dep_id);
            return `<li><button type="button" class="map-rel-chip" data-map-select="${escapeHtml(dep_id)}">→ ${escapeHtml(dep_id)} · ${escapeHtml(dep_node?.title ?? dep_id)}</button></li>`;
        })
            .join('')
        : '<li><span class="muted">Nodo terminal / integrador de etapa.</span></li>';
    return `<div class="aside-panel map-inspector" role="region" aria-label="Detalle del nodo ${escapeHtml(node.id)}">
    <span class="eyebrow">${escapeHtml(node.stage.toUpperCase())} · NIVEL DAG ${node.depth}</span>
    <h2>${escapeHtml(node.id)} — ${escapeHtml(node.title)}</h2>
    <p class="map-status-line ${badge.css}"><strong>${badge.symbol} ${escapeHtml(badge.label)}</strong> · ◷ ~${node.estimatedMinutes} min</p>
    <p>${escapeHtml(node.summary)}</p>
    ${node.missingPrerequisites.length > 0
        ? `<div class="senior-inline"><p><strong>Orden pedagógico sugerido:</strong> te recomendamos completar antes <b>${escapeHtml(node.missingPrerequisites.join(', '))}</b>, aunque puedes entrar libremente si ya dominas el tema.</p></div>`
        : ''}
    <div class="inline-actions">
      <a class="btn primary small" href="#/${escapeHtml(node.primaryRoute)}">${node.kind === 'senior_mission' ? 'Abrir brief de misión ↗' : 'Entrar a la lección ↗'}</a>
      ${node.workshopRoute
        ? `<a class="btn secondary small" href="#/${escapeHtml(node.workshopRoute)}">Taller Senior (6 actividades) ↗</a>`
        : ''}
    </div>
    <hr/>
    <h3>Prerrequisitos (${node.prerequisites.length})</h3>
    <ul class="map-rel-list">${prereq_items}</ul>
    <h3>Habilita a continuación (${node.unlocks.length})</h3>
    <ul class="map-rel-list">${unlock_items}</ul>
    ${path_titles.length > 0
        ? `<h3>Especializaciones asociadas</h3><p class="muted">${path_titles.map((p) => `${escapeHtml(p.id)} (${escapeHtml(p.title)})`).join(' · ')}</p>`
        : ''}
  </div>`;
}
export function renderCurriculumMapHtml(model, filtered_nodes, filter, selected_node_id, paths) {
    const node_lookup = new Map(model.nodes.map((n) => [n.id, n]));
    const selected_node = filtered_nodes.length === 0
        ? undefined
        : filtered_nodes.find((n) => n.id === selected_node_id) ?? filtered_nodes[0];
    const stages = ['Básico', 'Intermedio', 'Avanzado', 'Senior'];
    const stage_sections = stages
        .map((stage) => {
        const group = filtered_nodes.filter((n) => n.stage === stage);
        if (group.length === 0)
            return '';
        return `<section class="map-stage-group" aria-label="Etapa ${escapeHtml(stage)}">
        <div class="map-stage-header">
          <h2>${stage === 'Senior' ? '♛ Senior Mode · Producción (S01–S18)' : `Nivel ${escapeHtml(stage)}`}</h2>
          <span class="track-pill">${group.filter((n) => n.status === 'completed').length} / ${group.length} visibles completados</span>
        </div>
        <div class="map-nodes-grid" role="list">
          ${group
            .map((node) => {
            const badge = statusBadgeMeta(node);
            const is_selected = selected_node?.id === node.id;
            return `<div role="listitem">
                <button
                  type="button"
                  class="map-node-card ${badge.css} ${is_selected ? 'selected' : ''}"
                  data-map-node="${escapeHtml(node.id)}"
                  aria-pressed="${is_selected ? 'true' : 'false'}"
                >
                  <div class="map-node-top">
                    <span class="tile-number">${escapeHtml(node.id)}</span>
                    <span class="map-badge">${badge.symbol} ${escapeHtml(badge.label)}</span>
                  </div>
                  <strong>${escapeHtml(node.title)}</strong>
                  <small>Prerrequisitos: ${node.prerequisites.length ? escapeHtml(node.prerequisites.join(', ')) : 'Inicial'} · Desbloquea: ${node.unlocks.length}</small>
                </button>
              </div>`;
        })
            .join('')}
        </div>
      </section>`;
    })
        .join('');
    const recommended = model.summary.recommendedNodeId
        ? node_lookup.get(model.summary.recommendedNodeId)
        : undefined;
    return `<div class="page-title">
      <span class="eyebrow">◈ ARQUITECTURA CURRICULAR · 54 ELEMENTOS CONECTADOS</span>
      <h1>Mapa curricular de arquitectura</h1>
      <p>Explora el grafo completo de 36 lecciones y 18 misiones Senior, sus prerrequisitos sugeridos y qué capacidades desbloquea cada paso. Usa las flechas del teclado para recorrer los nodos.</p>
    </div>

    <div class="stats-grid">
      <div class="stat"><span class="stat-ico">✓</span><b>${model.summary.totalCompleted}<small>/ ${model.summary.totalNodes}</small></b><p>Nodos completados (${model.summary.completedLessons} lecciones · ${model.summary.completedMissions} Senior)</p></div>
      <div class="stat"><span class="stat-ico mint">▶</span><b>${model.summary.readyCount}</b><p>Listos para cursar hoy (prerrequisitos cubiertos)</p></div>
      <div class="stat"><span class="stat-ico yellow">◇</span><b>${model.summary.pendingPrereqCount}</b><p>Con prerrequisitos previos recomendados</p></div>
      <div class="stat"><span class="stat-ico purple">★</span><b>${escapeHtml(recommended?.id ?? '¡54/54!')}</b><p>${recommended ? `Siguiente sugerido: ${escapeHtml(recommended.title)}` : 'Currículo completo superado'}</p></div>
    </div>

    <section class="lesson-card map-filters-card" aria-label="Filtros del mapa curricular">
      <div class="map-filters-grid">
        <label class="field-label">Buscar por concepto o código
          <input id="map-query" type="search" value="${escapeHtml(filter.query)}" placeholder="Ej. SOLID, DDD, outbox, S09..." maxlength="60"/>
        </label>
        <label class="field-label">Etapa
          <select id="map-stage">
            <option value="ALL" ${filter.stage === 'ALL' ? 'selected' : ''}>Todas las etapas (54)</option>
            <option value="Básico" ${filter.stage === 'Básico' ? 'selected' : ''}>Básico (B01–B12)</option>
            <option value="Intermedio" ${filter.stage === 'Intermedio' ? 'selected' : ''}>Intermedio (I01–I12)</option>
            <option value="Avanzado" ${filter.stage === 'Avanzado' ? 'selected' : ''}>Avanzado (A01–A12)</option>
            <option value="Senior" ${filter.stage === 'Senior' ? 'selected' : ''}>Senior Mode (S01–S18)</option>
          </select>
        </label>
        <label class="field-label">Estado de preparación
          <select id="map-status">
            <option value="ALL" ${filter.status === 'ALL' ? 'selected' : ''}>Todos los estados</option>
            <option value="READY" ${filter.status === 'READY' ? 'selected' : ''}>▶ Listos para cursar</option>
            <option value="COMPLETED" ${filter.status === 'COMPLETED' ? 'selected' : ''}>✓ Completados</option>
            <option value="PENDING_PREREQ" ${filter.status === 'PENDING_PREREQ' ? 'selected' : ''}>◇ Con prerrequisito pendiente</option>
          </select>
        </label>
        <label class="field-label">Especialización
          <select id="map-path">
            <option value="ALL" ${filter.pathId === 'ALL' ? 'selected' : ''}>Todas las rutas</option>
            ${paths
        .map((p) => `<option value="${escapeHtml(p.id)}" ${filter.pathId === p.id ? 'selected' : ''}>${escapeHtml(p.id)} · ${escapeHtml(p.title)}</option>`)
        .join('')}
          </select>
        </label>
      </div>
      <div class="map-filter-bar">
        <p id="map-filter-status" role="status" aria-live="polite" class="muted">Mostrando <strong>${filtered_nodes.length}</strong> de ${model.summary.totalNodes} nodos curriculares. Leyenda: <b>✓</b> Completado · <b>★</b> Siguiente recomendado · <b>▶</b> Listo · <b>◇</b> Prerrequisito sugerido.</p>
        <button type="button" class="btn secondary small" id="map-reset-filters">Restablecer filtros</button>
      </div>
    </section>

    <section class="lesson-card map-visual-card" aria-label="Vista panorámica de dependencias">
      <div class="section-head">
        <div><span class="overline">GRAFO ACÍCLICO DIRIGIDO (DAG)</span><h2>Red de dependencias curriculares</h2></div>
        <span class="map-badge" data-dag-verified="true">✓ ${model.summary.totalNodes}/54 nodos · 0 ciclos · DAG validado</span>
      </div>
      <div class="map-svg-wrap" id="map-svg-container" tabindex="0" role="region" aria-label="Grafo curricular de 54 nodos">
        ${renderCurriculumMapSvg(model.nodes, selected_node?.id ?? 'B01')}
      </div>
    </section>

    <div class="lesson-layout map-workspace-layout">
      <div id="map-nodes-container">
        ${stage_sections ||
        `<section class="lesson-card"><h2>Sin resultados para este filtro</h2><p>No hay nodos que coincidan con la combinación actual. Pulsa «Restablecer filtros» para volver a ver los 54 nodos.</p></section>`}
      </div>
      <aside class="lesson-aside" id="map-inspector-container">
        ${renderNodeInspectorHtml(selected_node, node_lookup, paths)}
      </aside>
    </div>

    <details class="lesson-card map-table-details">
      <summary><strong>Tabla accesible completa de prerrequisitos y dependencias (54 elementos)</strong></summary>
      <div class="map-table-scroll" tabindex="0" role="region" aria-label="Tabla accesible de 54 nodos y dependencias">
        <table class="map-accessible-table">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Etapa</th>
              <th scope="col">Título</th>
              <th scope="col">Estado</th>
              <th scope="col">Prerrequisitos</th>
              <th scope="col">Desbloquea</th>
            </tr>
          </thead>
          <tbody>
            ${model.nodes
        .map((node) => {
        const badge = statusBadgeMeta(node);
        return `<tr>
                  <td><a href="#/${escapeHtml(node.primaryRoute)}"><b>${escapeHtml(node.id)}</b></a></td>
                  <td>${escapeHtml(node.stage)}</td>
                  <td>${escapeHtml(node.title)}</td>
                  <td>${badge.symbol} ${escapeHtml(badge.label)}</td>
                  <td>${node.prerequisites.length ? escapeHtml(node.prerequisites.join(', ')) : 'Ninguno'}</td>
                  <td>${node.unlocks.length ? escapeHtml(node.unlocks.join(', ')) : 'Meta final'}</td>
                </tr>`;
    })
        .join('')}
          </tbody>
        </table>
      </div>
    </details>`;
}
