import { ARCHITECTURE_RESOURCES_SUMMARY } from '../labs/constants/labs.constants.js';
import {
  ADR_TEMPLATES_LIBRARY,
  type ComparativeSheet,
  EXPANDED_GLOSSARY_TERMS,
  MANDATORY_COMPARISONS,
  PATTERN_CARDS,
  PATTERN_CATEGORIES,
  type PatternCard,
} from './constants/resources.constants.js';

export type ResourcesFilterState = {
  readonly query: string;
  readonly category: string;
};

export type FilteredResourcesModel = {
  readonly patterns: readonly PatternCard[];
  readonly comparisons: readonly ComparativeSheet[];
  readonly glossary: ReadonlyArray<readonly [string, string]>;
};

function esc(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch),
  );
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function filterResourcesHub(filter: ResourcesFilterState): FilteredResourcesModel {
  const q = normalizeSearch(filter.query);

  const patterns = PATTERN_CARDS.filter((card) => {
    if (filter.category !== 'ALL' && card.category !== filter.category) return false;
    if (!q) return true;
    return normalizeSearch(
      `${card.id} ${card.name} ${card.category} ${card.intent} ${card.problem} ${card.solution}`,
    ).includes(q);
  });

  const comparisons = MANDATORY_COMPARISONS.filter((sheet) => {
    if (!q) return true;
    return normalizeSearch(
      `${sheet.title} ${sheet.question} ${sheet.chooseFirstWhen} ${sheet.chooseSecondWhen} ${sheet.commonTrap}`,
    ).includes(q);
  });

  const glossary = EXPANDED_GLOSSARY_TERMS.filter(([term, def]) => {
    if (!q) return true;
    return normalizeSearch(`${term} ${def}`).includes(q);
  });

  return { patterns, comparisons, glossary };
}

export function findPatternById(pattern_id: string): PatternCard | undefined {
  const clean_id = pattern_id.trim().toLowerCase();
  return PATTERN_CARDS.find((card) => card.id === clean_id);
}

export function renderResourcesHubHtml(filter: ResourcesFilterState): string {
  const filtered = filterResourcesHub(filter);

  return `<div class="page-title">
    <span class="eyebrow">▣ BIBLIOTECA DEL ARQUITECTO · CATÁLOGO OPERATIVO</span>
    <h1>Recursos, patrones y comparativas</h1>
    <p>Doce fichas de patrones con ejemplos TypeScript ✅/❌, ocho matrices comparativas de trade-offs, biblioteca de plantillas ADR y glosario de arquitectura.</p>
  </div>

  <section class="live-blueprint-shell mb-20" aria-label="Flujo de decisión con biblioteca de patrones, comparativas y ADR">
    <div class="live-blueprint-topbar">
      <div class="live-status-group">
        <span class="live-status-pill"><i class="live-dot" aria-hidden="true"></i> FLUJO DE DECISIÓN ARQUITECTÓNICA</span>
        <span class="map-badge">${PATTERN_CARDS.length} patrones · ${MANDATORY_COMPARISONS.length} comparativas · ${ADR_TEMPLATES_LIBRARY.length} formatos ADR</span>
      </div>
    </div>
    <div class="live-blueprint-body">
      <svg class="senior-pipeline-svg" viewBox="0 0 680 76" role="img" aria-label="Flujo: Restricción real hacia Matriz Comparativa, Patrón TypeScript y Registro ADR">
        <rect width="680" height="76" rx="12" fill="#061426"/>
        <line x1="166" y1="38" x2="254" y2="38" class="arch-flow-edge" stroke="#16e1ee" stroke-width="2"/>
        <line x1="418" y1="38" x2="504" y2="38" class="arch-flow-edge" stroke="#53e2ba" stroke-width="2"/>
        <rect x="18" y="16" width="148" height="44" rx="9" fill="#0b2239" stroke="#18e1ee"/>
        <text x="92" y="36" text-anchor="middle" fill="#f3fbff" font-size="11" font-weight="bold" font-family="sans-serif">1. Matriz Trade-Offs</text>
        <text x="92" y="50" text-anchor="middle" fill="#8fd8f2" font-size="9" font-family="monospace">SLO · Coste · Equipo</text>
        <rect x="254" y="16" width="164" height="44" rx="9" fill="#0d3648" stroke="#53e2ba"/>
        <text x="336" y="36" text-anchor="middle" fill="#f3fbff" font-size="11" font-weight="bold" font-family="sans-serif">2. Patrón ✅ vs ❌</text>
        <text x="336" y="50" text-anchor="middle" fill="#8fd8f2" font-size="9" font-family="monospace">Código TS sin dogma</text>
        <rect x="504" y="16" width="158" height="44" rx="9" fill="#0b2239" stroke="#18e1ee"/>
        <text x="583" y="36" text-anchor="middle" fill="#f3fbff" font-size="11" font-weight="bold" font-family="sans-serif">3. ADR Verificable</text>
        <text x="583" y="50" text-anchor="middle" fill="#8fd8f2" font-size="9" font-family="monospace">Métrica de salida</text>
      </svg>
    </div>
  </section>

  <div class="inline-actions mb-18">
    <a class="btn primary small" href="#/recursos/adr">✎ Biblioteca y plantillas ADR →</a>
    <a class="btn secondary small" href="#/recursos/patrones/strategy">⌘ Explorar fichas de patrones (${PATTERN_CARDS.length}) →</a>
    <a class="btn secondary small" href="#/laboratorio/adr">Abrir editor ADR en laboratorio ↗</a>
  </div>

  <section class="lesson-card map-filters-card" aria-label="Buscador de recursos arquitectónicos">
    <div class="map-filters-grid grid-2col">
      <label class="field-label">Buscar concepto, patrón, anti-patrón o término
        <input id="res-query" type="search" value="${esc(filter.query)}" placeholder="Ej. outbox, strategy, hexagonal, CQRS, saga..." maxlength="60"/>
      </label>
      <label class="field-label">Categoría de patrón
        <select id="res-category">
          <option value="ALL" ${filter.category === 'ALL' ? 'selected' : ''}>Todas las categorías (${PATTERN_CARDS.length})</option>
          ${PATTERN_CATEGORIES.map(
            (cat) => `<option value="${esc(cat)}" ${filter.category === cat ? 'selected' : ''}>${esc(cat)}</option>`,
          ).join('')}
        </select>
      </label>
    </div>
    <div class="map-filter-bar">
      <p role="status" aria-live="polite" class="muted">Resultados: <strong>${filtered.patterns.length}</strong> patrones · <strong>${filtered.comparisons.length}</strong> comparativas · <strong>${filtered.glossary.length}</strong> términos de glosario.</p>
      <button type="button" class="btn secondary small" id="res-reset">Limpiar filtro</button>
    </div>
  </section>

  <div class="section-head"><div><span class="overline">PILARES</span><h2>Principios fundamentales</h2></div></div>
  <div class="resource-grid">
    ${ARCHITECTURE_RESOURCES_SUMMARY.map(
      ([name, desc, id]) =>
        `<a href="#/aprender/${esc(id)}" class="resource-card"><span>◈</span><h3>${esc(name)}</h3><p>${esc(desc)}</p><small>Leer módulo ${esc(id)} ↗</small></a>`,
    ).join('')}
  </div>

  <div class="section-head mt-28">
    <div><span class="overline">CATÁLOGO DE PATRONES</span><h2>Fichas de patrones GoF y arquitectónicos</h2></div>
  </div>
  <div class="specialization-grid">
    ${
      filtered.patterns.length
        ? filtered.patterns
            .map(
              (card) => `<article class="specialization-card">
                <span class="eyebrow">${esc(card.category)}</span>
                <h3>${esc(card.name)}</h3>
                <p>${esc(card.intent)}</p>
                <p class="muted text-sm">Coste: ${esc(card.operationalCost)}</p>
                <div class="inline-actions mt-12">
                  <a class="btn secondary small" href="#/recursos/patrones/${esc(card.id)}">Abrir ficha completa ✅/❌ →</a>
                </div>
              </article>`,
            )
            .join('')
        : '<section class="lesson-card"><p>No hay patrones para el filtro seleccionado.</p></section>'
    }
  </div>

  <div class="section-head mt-28">
    <div><span class="overline">MATRICES DE DECISIÓN (§17.4)</span><h2>Fichas comparativas obligatorias</h2></div>
  </div>
  <div class="specialization-grid">
    ${filtered.comparisons
      .map(
        (sheet) => `<article class="lesson-card comparison-sheet-card m-0">
          <span class="eyebrow">TRADE-OFFS EXPLÍCITOS</span>
          <h3>${esc(sheet.title)}</h3>
          <p><strong>Pregunta clave:</strong> ${esc(sheet.question)}</p>
          <p><b>✓ Cuándo preferir la primera / simple:</b> ${esc(sheet.chooseFirstWhen)}</p>
          <p><b>✓ Cuándo compensa la alternativa avanzada:</b> ${esc(sheet.chooseSecondWhen)}</p>
          <p><b>⚠ Trampa habitual:</b> ${esc(sheet.commonTrap)}</p>
          <small class="muted">Cómo verificarlo: ${esc(sheet.verificationSignal)}</small>
        </article>`,
      )
      .join('')}
  </div>

  <section class="lesson-card mt-24">
    <h2>Glosario esencial (${filtered.glossary.length})</h2>
    <div class="glossary">
      ${filtered.glossary.map(([term, def]) => `<div><b>${esc(term)}</b><p>${esc(def)}</p></div>`).join('')}
    </div>
  </section>`;
}

export function renderPatternDetailHtml(pattern_id: string): string {
  const card = findPatternById(pattern_id);
  if (!card) {
    return `<div class="page-title">
      <span class="eyebrow">PATRÓN NO ENCONTRADO</span>
      <h1>Ficha de patrón inexistente</h1>
      <p>Consulta el catálogo de doce patrones GoF, arquitectónicos y distribuidos en la biblioteca de recursos.</p>
      <a class="btn primary small" href="#/recursos">← Volver a Recursos</a>
    </div>`;
  }

  const idx = PATTERN_CARDS.findIndex((p) => p.id === card.id);
  const prev = idx > 0 ? PATTERN_CARDS[idx - 1] : undefined;
  const next = idx >= 0 && idx < PATTERN_CARDS.length - 1 ? PATTERN_CARDS[idx + 1] : undefined;

  return `<div class="backline">
    <a href="#/recursos">← Volver a Recursos</a>
    <span>PATRÓN · ${esc(card.category.toUpperCase())}</span>
  </div>

  <div class="page-title">
    <span class="eyebrow">⌘ FICHA TÉCNICA DE PATRÓN</span>
    <h1>${esc(card.name)}</h1>
    <p>${esc(card.intent)}</p>
  </div>

  <div class="lesson-layout">
    <div>
      <article class="lesson-card">
        <span class="overline">01 / PROBLEMA Y SOLUCIÓN</span>
        <h2>Por qué existe este patrón</h2>
        <p><strong>Problema recurrente:</strong> ${esc(card.problem)}</p>
        <p><strong>Solución estructural:</strong> ${esc(card.solution)}</p>
        <div class="lesson-quote"><b>Coste operativo y de mantenimiento</b><p>${esc(card.operationalCost)}</p></div>
      </article>

      <article class="lesson-card">
        <span class="overline">02 / CRITERIO DE ADOPCIÓN</span>
        <h2>Cuándo SÍ usarlo vs. cuándo NO usarlo</h2>
        <h3>✓ Cuándo aporta valor real</h3>
        <ul>${card.whenToUse.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
        <h3 class="mt-16">✕ Cuándo evitarlo (anti-patrón / sobreingeniería)</h3>
        <ul>${card.whenNotToUse.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
      </article>

      <article class="lesson-card">
        <span class="overline">03 / IMPLEMENTACIÓN TYPESCRIPT</span>
        <h2>Contraste de código: ✅ Defendible vs. ❌ Frágil</h2>
        <h3>✅ Aplicación alineada con fronteras limpias</h3>
        <pre class="suite-code"><code>${esc(card.goodExampleTs)}</code></pre>
        <h3 class="mt-16">❌ Anti-patrón frecuente</h3>
        <pre class="suite-code"><code>${esc(card.badExampleTs)}</code></pre>
      </article>

      <div class="lesson-nav">
        ${prev ? `<a href="#/recursos/patrones/${esc(prev.id)}">← ${esc(prev.name)}</a>` : '<span></span>'}
        ${next ? `<a href="#/recursos/patrones/${esc(next.id)}">${esc(next.name)} →</a>` : '<a href="#/recursos/adr">Ir a Plantillas ADR →</a>'}
      </div>
    </div>

    <aside class="lesson-aside">
      <div class="aside-panel">
        <h3>Practicar este patrón</h3>
        <p class="muted">Lecciones donde se profundiza:</p>
        <div class="spec-modules">
          ${card.relatedModules.map((m) => `<a href="#/aprender/${esc(m)}">${esc(m)} ↗</a>`).join('')}
        </div>
        <p class="muted mt-12">Misiones Senior relacionadas:</p>
        <div class="spec-modules">
          ${card.relatedMissions.map((s) => `<a href="#/taller-senior/${esc(s)}">${esc(s)} ↗</a>`).join('')}
        </div>
      </div>
      <div class="aside-panel">
        <h3>Otros patrones del catálogo</h3>
        <ul class="map-rel-list">
          ${PATTERN_CARDS.map(
            (item) =>
              `<li><a class="map-rel-chip ${item.id === card.id ? 'done' : ''}" href="#/recursos/patrones/${esc(item.id)}">${esc(item.name)}</a></li>`,
          ).join('')}
        </ul>
      </div>
    </aside>
  </div>`;
}

export function renderAdrLibraryHtml(selected_template_id = 'vigilio-canonical'): string {
  const active_tpl =
    ADR_TEMPLATES_LIBRARY.find((t) => t.id === selected_template_id) ?? ADR_TEMPLATES_LIBRARY[0];

  return `<div class="backline">
    <a href="#/recursos">← Volver a Recursos</a>
    <span>BIBLIOTECA ADR</span>
  </div>

  <div class="page-title">
    <span class="eyebrow">✎ ARCHITECTURE DECISION RECORDS</span>
    <h1>Plantillas y guía práctica de ADR</h1>
    <p>Documenta decisiones reversibles e irreversibles con contexto medible, alternativas reales, riesgos asumidos y señales claras de validación.</p>
  </div>

  <div class="lesson-layout">
    <div>
      <section class="lesson-card">
        <span class="overline">01 / SELECCIONA UN FORMATO</span>
        <h2>Plantillas reutilizables</h2>
        <div class="inline-actions mb-14">
          ${ADR_TEMPLATES_LIBRARY.map(
            (tpl) =>
              `<button type="button" class="btn ${tpl.id === active_tpl.id ? 'primary' : 'secondary'} small" data-adr-tpl="${esc(tpl.id)}">${esc(tpl.title)}</button>`,
          ).join('')}
        </div>
        <p>${esc(active_tpl.summary)}</p>
        <pre class="suite-code" id="adr-template-preview"><code>${esc(active_tpl.markdownTemplate)}</code></pre>
        <div class="inline-actions mt-14">
          <button type="button" class="btn primary small" id="download-adr-template">Descargar plantilla (.md)</button>
          <a class="btn secondary small" href="#/laboratorio/adr">Redactar en Architecture Decision Studio ↗</a>
        </div>
      </section>

      <section class="lesson-card">
        <span class="overline">02 / CONTRASTE REAL</span>
        <h2>✅ ADR defendible vs. ❌ ADR vacío</h2>
        <div class="specialization-grid">
          <div class="spec-capstone">
            <strong>✅ Ejemplo defendible (contextualizado)</strong>
            <p>«Con 25.000 cobros/min y SLO 99,95 %, adoptamos Outbox transaccional en PostgreSQL + clave Idempotency-Key de 24 h descartando doble escritura directa a cola. Asumimos hasta 3 s de retardo en facturación y verificaremos con inyección de fallos que effectiveCharges == orders.»</p>
          </div>
          <div class="spec-capstone capstone-bad">
            <strong>❌ Ejemplo deficiente (opinión sin evidencia)</strong>
            <p>«Elegimos microservicios con Kafka en todos los módulos porque es moderno, escalable y usado por grandes tecnológicas. No prevemos desventajas relevantes.»</p>
          </div>
        </div>
      </section>
    </div>

    <aside class="lesson-aside">
      <div class="aside-panel">
        <h3>Checklist de revisión humana</h3>
        <p>✓ ¿Cita restricciones numéricas (carga, SLO, equipo, coste)?</p>
        <p>✓ ¿Incluye al menos una alternativa descartada honesta?</p>
        <p>✓ ¿Declara qué se empeora o encarece con esta decisión?</p>
        <p>✓ ¿Define qué métrica obligaría a reconsiderar el ADR?</p>
      </div>
    </aside>
  </div>`;
}
