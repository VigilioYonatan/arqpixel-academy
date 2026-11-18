import { LESSON_WORKBENCH_BY_ID, } from './constants/lesson-workbench.constants.js';
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
export function getLessonWorkbench(module_id) {
    return LESSON_WORKBENCH_BY_ID.get(module_id);
}
export function evaluateLessonWorkbench(module_id, selected_indices) {
    const item = LESSON_WORKBENCH_BY_ID.get(module_id);
    if (!item) {
        throw new Error(`No existe ejercicio práctico interactivo para el módulo ${module_id}`);
    }
    const unique = [...new Set(selected_indices)].filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < item.options.length);
    if (unique.length === 0) {
        return {
            status: 'NOT_RUN',
            passed: false,
            selectedCount: 0,
            summary: 'Selecciona exactamente 2 decisiones arquitectónicas antes de validar.',
            detail: 'Este banco práctico exige combinar dos salvaguardas coherentes y descartar antipatrones.',
        };
    }
    if (unique.length !== 2) {
        return {
            status: 'FAIL',
            passed: false,
            selectedCount: unique.length,
            summary: `Seleccionaste ${unique.length} opción(es); debes elegir exactamente las 2 decisiones coherentes.`,
            detail: unique.length > 2
                ? 'Marcar opciones de más incluye sobreingeniería o contradicciones arquitectónicas.'
                : 'Una sola medida resulta incompleta frente a las restricciones del escenario.',
        };
    }
    const expected = new Set(item.requiredIndices);
    const exact_match = unique.every((idx) => expected.has(idx));
    return {
        status: exact_match ? 'PASS' : 'FAIL',
        passed: exact_match,
        selectedCount: 2,
        summary: exact_match
            ? '✓ PASS · Combinación arquitectónica coherente y proporcionada'
            : '↺ FAIL · Revisa los trade-offs de la combinación elegida',
        detail: exact_match ? item.explanationPass : item.explanationFail,
    };
}
export function renderLessonWorkbenchHtml(module_id, selected_indices = [], evaluated = false) {
    const item = LESSON_WORKBENCH_BY_ID.get(module_id);
    if (!item)
        return '';
    const chosen_set = new Set(selected_indices);
    const result = evaluated ? evaluateLessonWorkbench(module_id, selected_indices) : null;
    return `<article class="lesson-card lesson-workbench-card" data-workbench-module="${esc(module_id)}">
    <span class="overline">02B / BANCO PRÁCTICO INTERACTIVO · MULTI-CRITERIO</span>
    <h2>Taller aplicado de decisiones (${esc(module_id)})</h2>
    <p>${esc(item.prompt)}</p>
    <div class="suite-checks my-14">
      ${item.options
        .map((opt, idx) => `<label class="workbench-option">
            <input type="checkbox" data-wb-choice="${idx}" ${chosen_set.has(idx) ? 'checked' : ''}/>
            <span>${esc(opt)}</span>
          </label>`)
        .join('')}
    </div>
    <div class="inline-actions">
      <button type="button" class="btn secondary small" id="eval-lesson-workbench">Validar combinación práctica (2/4)</button>
      ${item.hasRunnableReferenceRepo
        ? `<a class="btn secondary small" href="#/proyectos">📦 Ver código ejecutable real en NexoShop NestJS →</a>`
        : ''}
    </div>
    <div id="lesson-workbench-report" role="status" aria-live="polite" class="mt-12">
      ${result
        ? `<div class="feedback ${result.passed ? 'good' : 'bad'}"><strong>${esc(result.summary)}</strong><p>${esc(result.detail)}</p></div>`
        : '<p class="muted">Marca las 2 decisiones defendibles y pulsa «Validar combinación práctica».</p>'}
    </div>
  </article>`;
}
