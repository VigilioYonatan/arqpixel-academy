/**
 * Interactive Modo 3 Senior Lab Panels for OpenAPI CDC (`L1252`), Cross-Fault Saga/Outbox (`L1254`),
 * and Dimensional Capacity & Stress (`L1255`), complete with visual SVG diagrams.
 */
import { API_BREAKING_ISSUE_LABELS, API_CONTRACT_DIFF_SCENARIOS, } from './advanced-labs.js';
import { evaluateDimensionalCapacityAndStress, renderDimensionalCapacitySvgHtml, STRESS_WAVE_SCENARIOS, } from './capacity-stress-engine.js';
import { CROSS_FAULT_SCENARIOS, renderCrossFaultStateSvgHtml, simulateCrossFaultSaga, } from './cross-fault-saga-engine.js';
import { OPENAPI_PROVIDER_SPECS, renderOpenApiCdcDiagramSvgHtml, verifyOpenApiConsumerContracts, } from './openapi-cdc-engine.js';
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
export function renderOpenApiCdcLabPanelHtml() {
    const initial = verifyOpenApiConsumerContracts('v1_baseline');
    return `<hr class="section-divider"/>
  <div data-workspace-pane="work" id="openapi-cdc-panel">
    <span class="overline">MODO 3 · OPENAPI 3.1 &amp; CONSUMER-DRIVEN CONTRACTS (CDC)</span>
    <h2>Verifica 3 consumidores reales frente al contrato del proveedor</h2>
    <div class="builder-box">
      <label>Versión OpenAPI del proveedor
        <select id="cdc-provider-variant">
          <option value="v1_baseline">v1.0.0 · Línea base estable</option>
          <option value="v2_additive_compatible">v1.2.0 · Evolución aditiva Expand-Contract</option>
          <option value="v2_breaking_rename_and_required">v2.0.0-rc1 · PR con cambios rompedores</option>
        </select>
      </label>
      <button type="button" class="btn primary small" id="cdc-run-btn">▶ Ejecutar suite CDC</button>
    </div>
    <details class="mb-14">
      <summary class="mentor-summary">Inspeccionar especificación OpenAPI 3.1 activa (JSON)</summary>
      <pre class="suite-code mt-10"><code id="cdc-spec-preview">${esc(JSON.stringify(OPENAPI_PROVIDER_SPECS.v1_baseline, null, 2))}</code></pre>
    </details>
    <div id="cdc-diagram-output" role="status" aria-live="polite">
      ${renderOpenApiCdcDiagramSvgHtml(initial)}
    </div>
  </div>`;
}
export function bindOpenApiCdcLabControls() {
    const sel = document.querySelector('#cdc-provider-variant');
    const run_btn = document.querySelector('#cdc-run-btn');
    const out = document.querySelector('#cdc-diagram-output');
    const preview = document.querySelector('#cdc-spec-preview');
    if (!sel || !run_btn || !out)
        return;
    const execute = () => {
        const variant = sel.value;
        if (preview) {
            preview.textContent = JSON.stringify(OPENAPI_PROVIDER_SPECS[variant], null, 2);
        }
        const res = verifyOpenApiConsumerContracts(variant);
        out.innerHTML = `${renderOpenApiCdcDiagramSvgHtml(res)}
      <div class="feedback ${res.overallStatus === 'PASS' ? 'good' : 'bad'}">
        <strong>Gate CDC OpenAPI ${esc(res.providerVersion)}: ${res.overallStatus}</strong>
        ${res.outcomes
            .map((o) => o.violations.length === 0
            ? `<p>✓ <b>${esc(o.consumerName)}:</b> contrato satisfecho.</p>`
            : `<p>✕ <b>${esc(o.consumerName)}:</b> ${esc(o.violations.join(' | '))}</p>`)
            .join('')}
      </div>`;
    };
    sel.onchange = execute;
    run_btn.onclick = execute;
}
export function renderCrossFaultSagaPanelHtml() {
    return `<hr class="section-divider"/>
  <div data-workspace-pane="work" id="cross-fault-saga-panel">
    <span class="overline">MODO 3 · CONSISTENCIA EVENTUAL, SAGAS &amp; FALLOS CRUZADOS</span>
    <h2>Matriz de fallos compuestos sobre 5 almacenes de estado</h2>
    <label class="field-label">Escenario de fallo cruzado
      <select id="cross-fault-scenario">
        ${CROSS_FAULT_SCENARIOS.map((s) => `<option value="${s.id}">${esc(s.label)}</option>`).join('')}
      </select>
    </label>
    <div class="suite-checks my-14">
      <label><input type="checkbox" id="cf-outbox" checked/> Transactional Outbox atómico</label>
      <label><input type="checkbox" id="cf-inbox" checked/> Inbox Idempotency deduplicado</label>
      <label><input type="checkbox" id="cf-version" checked/> Guarda monotónica de versión (v1→v2→v3)</label>
      <label><input type="checkbox" id="cf-dlq" checked/> Saga compensatoria + aislamiento DLQ</label>
    </div>
    <button type="button" class="btn primary small" id="cross-fault-run-btn">▶ Simular fallo cruzado</button>
    <div id="cross-fault-output" role="status" aria-live="polite" class="mt-12"></div>
  </div>`;
}
export function bindCrossFaultSagaControls() {
    const btn = document.querySelector('#cross-fault-run-btn');
    const out = document.querySelector('#cross-fault-output');
    if (!btn || !out)
        return;
    btn.onclick = () => {
        const scenario_id = document.querySelector('#cross-fault-scenario')
            .value;
        const res = simulateCrossFaultSaga(scenario_id, {
            transactionalOutbox: document.querySelector('#cf-outbox').checked,
            inboxIdempotency: document.querySelector('#cf-inbox').checked,
            versionOrderingGuard: document.querySelector('#cf-version').checked,
            compensatingSagaAndDlq: document.querySelector('#cf-dlq').checked,
        });
        out.innerHTML = `${renderCrossFaultStateSvgHtml(res)}
      <div class="feedback ${res.consistent ? 'good' : 'bad'}">
        <strong>${esc(res.summary)}</strong>
        ${res.anomalies.map((a) => `<p>⚠ ${esc(a)}</p>`).join('')}
      </div>`;
    };
}
export function renderDimensionalCapacityPanelHtml() {
    return `<hr class="section-divider"/>
  <div data-workspace-pane="work" id="dimensional-capacity-panel">
    <span class="overline">MODO 3 · CAPACIDAD CON UNIDADES, INCERTIDUMBRE, FINOPS Y SENSIBILIDAD</span>
    <h2>Simulador de stress reproducible (<code>req/s</code> · <code>ms</code> · <code>vCPU</code> · <code>USD/mes</code>)</h2>
    <div class="builder-box">
      <label>Escenario de stress
        <select id="cap-stress-scenario">
          ${STRESS_WAVE_SCENARIOS.map((s) => `<option value="${s.id}">${esc(s.label)}</option>`).join('')}
        </select>
      </label>
      <label>Base (req/s) <input type="number" id="cap-base-rps" min="20" max="20000" value="240"/></label>
      <label>SQL media (ms) <input type="number" id="cap-db-ms" min="2" max="2000" value="18"/></label>
      <label>Réplicas <input type="number" id="cap-replicas" min="1" max="64" value="4"/></label>
      <label>vCPU / réplica <input type="number" id="cap-vcpu" min="1" max="16" value="2"/></label>
      <label>Pool SQL / réplica <input type="number" id="cap-sql-pool" min="5" max="200" value="25"/></label>
      <label>Caché hit (%) <input type="number" id="cap-cache-hit" min="0" max="98" value="75"/></label>
      <label>Factor retries <input type="number" id="cap-retry-factor" min="1" max="4" step="0.1" value="1.2"/></label>
      <button type="button" class="btn primary small" id="cap-stress-run-btn">▶ Evaluar stress y sensibilidad</button>
    </div>
    <div id="cap-stress-output" role="status" aria-live="polite"></div>
  </div>`;
}
export function bindDimensionalCapacityControls() {
    const btn = document.querySelector('#cap-stress-run-btn');
    const out = document.querySelector('#cap-stress-output');
    if (!btn || !out)
        return;
    btn.onclick = () => {
        const num = (sel) => Number(document.querySelector(sel).value);
        const rep = evaluateDimensionalCapacityAndStress({
            seed: 1,
            baselineRps: num('#cap-base-rps'),
            dbMeanLatencyMs: num('#cap-db-ms'),
            replicasCount: num('#cap-replicas'),
            vcpuPerReplica: num('#cap-vcpu'),
            sqlPoolPerReplica: num('#cap-sql-pool'),
            cacheHitPercent: num('#cap-cache-hit'),
            retryAmplificationFactor: num('#cap-retry-factor'),
            stressScenarioId: document.querySelector('#cap-stress-scenario')
                .value,
        });
        out.innerHTML = `${renderDimensionalCapacitySvgHtml(rep)}
      <div class="feedback ${rep.status === 'PASS' ? 'good' : 'bad'}">
        <strong>Estado dimensional: ${rep.status} · Coste estimado: $${rep.estimatedMonthlyCostUsd} USD/mes</strong>
        <p>${esc(rep.diagnosis)}</p>
      </div>
      <div class="map-table-scroll" tabindex="0" role="region" aria-label="Matriz de sensibilidad de capacidad">
        <table class="map-accessible-table">
          <thead><tr><th>Variación de sensibilidad</th><th>Latencia p95 (ms)</th><th>Techo sostenible (req/s)</th><th>Saturación (%)</th></tr></thead>
          <tbody>
            ${rep.sensitivityMatrix.map((row) => `<tr><td>${esc(row.factorLabel)}</td><td>${row.p95LatencyMs} ms</td><td>${row.maxSustainableRps} req/s</td><td>${row.saturationPercent}%</td></tr>`).join('')}
          </tbody>
        </table>
      </div>`;
    };
}
export function renderCaseLabAdvancedSectionHtml(case_lab_id, selected_api_diff_scenario_id) {
    if (case_lab_id === 'patterns') {
        return `<hr class="section-divider"/>
    <div data-workspace-pane="work">
      <span class="overline">MODO 2 · SIMULADOR DE VARIABILIDAD VS SOBREDISEÑO</span>
      <h2>¿Cuándo compensa introducir una abstracción?</h2>
      <div class="builder-box">
        <label>Variantes activas reales
          <select id="pat-variants"><option value="1">1 sola variante actual</option><option value="3" selected>3 proveedores activos</option><option value="6">6+ proveedores multi-país</option></select>
        </label>
        <label>Frecuencia de cambio
          <select id="pat-freq"><option value="anual">Anual / estable</option><option value="mensual" selected>Mensual</option><option value="semanal">Semanal</option></select>
        </label>
        <label>Diseño propuesto
          <select id="pat-approach">
            <option value="direct-conditional">Condicional directo explícito</option>
            <option value="strategy-port" selected>Strategy + Puerto de dominio</option>
            <option value="plugin-bus-factory">Abstract Factory + Bus dinámico</option>
          </select>
        </label>
        <button type="button" class="btn secondary small" id="pat-run-eval">Analizar trade-off</button>
      </div>
      <div id="pat-sim-result" role="status"></div>
    </div>`;
    }
    if (case_lab_id === 'api') {
        const scenario = API_CONTRACT_DIFF_SCENARIOS.find((s) => s.id === selected_api_diff_scenario_id) ??
            API_CONTRACT_DIFF_SCENARIOS[0];
        return `<hr class="section-divider"/>
    <div data-workspace-pane="work">
      <span class="overline">MODO 2 · COMPARADOR DE EVOLUCIÓN OPENAPI / JSON (v1 vs v2)</span>
      <h2>Detecta los breaking changes antes de producción</h2>
      <label class="field-label">Escenario de contrato
        <select id="api-diff-scenario">
          ${API_CONTRACT_DIFF_SCENARIOS.map((s) => `<option value="${s.id}" ${s.id === scenario.id ? 'selected' : ''}>${esc(s.title)}</option>`).join('')}
        </select>
      </label>
      <div class="solution-compare-grid my-14">
        <div class="solution-box"><span class="overline">CONTRATO ACTUAL (v1)</span><pre class="suite-code"><code>${esc(scenario.v1Contract)}</code></pre></div>
        <div class="solution-box"><span class="overline">PROPUESTA DE PR (v2)</span><pre class="suite-code"><code>${esc(scenario.v2ProposedContract)}</code></pre></div>
      </div>
      <p>Marca todos los problemas reales presentes en la propuesta v2:</p>
      <div class="suite-checks">
        ${Object.entries(API_BREAKING_ISSUE_LABELS)
            .map(([issue_id, label]) => `<label><input type="checkbox" data-api-issue="${issue_id}"/> ${esc(label)}</label>`)
            .join('')}
      </div>
      <div class="inline-actions">
        <button type="button" class="btn secondary small" id="api-audit-btn">Auditar contrato v2</button>
        <button type="button" class="btn secondary small" id="api-export-md">Exportar auditoría (.md)</button>
      </div>
      <div id="api-audit-result" role="status"></div>
    </div>
    ${renderOpenApiCdcLabPanelHtml()}`;
    }
    return `<hr class="section-divider"/>
  <div data-workspace-pane="work">
    <span class="overline">MODO 2 · CALCULADORA DE ERROR BUDGET / BURN RATE &amp; RESILIENCIA</span>
    <h2>Presupuesto de error SLO y coordinación de defensas</h2>
    <div class="builder-box">
      <label>SLO objetivo (%) <input type="number" id="slo-target" min="95" max="99.99" step="0.05" value="99.9"/></label>
      <label>Ventana (días) <input type="number" id="slo-window-days" min="7" max="90" step="1" value="30"/></label>
      <label>Tasa de error actual (%) <input type="number" id="slo-observed-err" min="0" max="50" step="0.05" value="1.5"/></label>
      <button type="button" class="btn secondary small" id="slo-calc-btn">Calcular Burn Rate</button>
    </div>
    <div id="slo-calc-result" role="status"></div>
    <h3 class="mt-20">Coordinación de Timeout + Retries + Jitter + Circuit Breaker + Bulkhead</h3>
    <div class="builder-box">
      <label>SLA del llamador (ms) <input type="number" id="res-sla-ms" min="100" max="30000" step="100" value="1500"/></label>
      <label>Timeout dependencia (ms) <input type="number" id="res-timeout-ms" min="50" max="15000" step="50" value="400"/></label>
      <label>Máx. reintentos <input type="number" id="res-retries" min="0" max="10" step="1" value="2"/></label>
    </div>
    <div class="suite-checks">
      <label><input type="checkbox" id="res-jitter" checked/> Backoff exponencial + Jitter</label>
      <label><input type="checkbox" id="res-cb" checked/> Circuit Breaker activo</label>
      <label><input type="checkbox" id="res-bulkhead" checked/> Bulkhead (aislamiento de pool)</label>
    </div>
    <div class="inline-actions">
      <button type="button" class="btn secondary small" id="res-eval-btn">Verificar coordinación de resiliencia</button>
      <button type="button" class="btn secondary small" id="incident-export-md">Exportar Runbook (.md)</button>
    </div>
    <div id="res-eval-result" role="status"></div>
  </div>
  ${renderDimensionalCapacityPanelHtml()}`;
}
