import { renderPixelNavIconSvg } from '../shared/ui/visual-clarity.js';
import { CAPSTONE_PROJECTS, MIN_PROJECT_SECTION_LENGTH, } from './constants/projects.constants.js';
import { capstoneRubricAuditEntrySchema, } from './schemas/projects.schema.js';
function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
}
function normalizeText(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}
/** Deterministic FNV-1a 32-bit fingerprint of the student's 5 deliverable sections + checklist. */
export function computeProjectDraftFingerprint(sub) {
    const payload = JSON.stringify([
        sub.architectureSummary.trim(),
        sub.alternativesAnalysis.trim(),
        sub.adrDecision.trim(),
        sub.risksAndMitigations.trim(),
        sub.verificationPlan.trim(),
        sub.checklist,
    ]);
    let hash = 0x811c9dc5;
    for (let i = 0; i < payload.length; i++) {
        hash ^= payload.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}
export function resolveCapstoneAuditStatus(sub) {
    const trail = sub.auditTrail ?? [];
    if (trail.length === 0)
        return 'UNREVIEWED';
    const latest = trail[trail.length - 1];
    const current_fp = computeProjectDraftFingerprint(sub);
    return latest.draftFingerprint === current_fp
        ? 'VERIFIED_MATCHING_DRAFT'
        : 'DRAFT_MODIFIED_AFTER_REVIEW';
}
export function appendCapstoneAuditReview(sub, input) {
    const validated_entry = capstoneRubricAuditEntrySchema.parse({
        reviewerName: input.reviewerName.trim(),
        reviewerRole: input.reviewerRole.trim(),
        reviewedAt: input.reviewedAt ?? new Date().toISOString(),
        draftFingerprint: computeProjectDraftFingerprint(sub),
        scores: input.scores,
        verdict: input.verdict,
        auditComment: input.auditComment.trim(),
    }, 'capstoneRubricAuditEntry');
    const existing_trail = sub.auditTrail ?? [];
    const next_trail = [...existing_trail.slice(-19), validated_entry];
    return {
        ...sub,
        auditTrail: next_trail,
    };
}
export function isProjectDraftUntouched(sub) {
    const combined = sub.architectureSummary.trim() +
        sub.alternativesAnalysis.trim() +
        sub.adrDecision.trim() +
        sub.risksAndMitigations.trim() +
        sub.verificationPlan.trim();
    const any_check = Object.values(sub.checklist).some(Boolean);
    return combined.length === 0 && !any_check;
}
export function evaluateProjectSubmission(project, submission) {
    const fingerprint = computeProjectDraftFingerprint(submission);
    const audit_status = resolveCapstoneAuditStatus(submission);
    if (isProjectDraftUntouched(submission)) {
        const idle_checks = [
            {
                name: 'Modelo C4 y límites de contenedores',
                status: 'NOT_RUN',
                detail: 'Aún no se ha descrito la arquitectura propuesta.',
                evidenceSnippet: '0 caracteres registrados en bloque 1.',
                actionableFeedback: `Describe contenedores, puertos y dirección de dependencias (mín. ${MIN_PROJECT_SECTION_LENGTH} caracteres).`,
            },
            {
                name: 'Alternativas y trade-offs',
                status: 'NOT_RUN',
                detail: 'Pendiente de comparar al menos una alternativa descartada.',
                evidenceSnippet: '0 caracteres registrados en bloque 2.',
                actionableFeedback: 'Contrasta la arquitectura elegida frente a una opción descartada indicando coste y complejidad.',
            },
            {
                name: 'Registro ADR contextualizado',
                status: 'NOT_RUN',
                detail: 'Pendiente de redactar la decisión citando restricciones del caso.',
                evidenceSnippet: `Términos esperados: ${project.expectedDomainTerms.join(', ')}.`,
                actionableFeedback: `Cita al menos 2 conceptos clave del dominio (${project.expectedDomainTerms.slice(0, 3).join(', ')}).`,
            },
            {
                name: 'Matriz de riesgos y verificación',
                status: 'NOT_RUN',
                detail: 'Pendiente de definir riesgos, métricas y plan de pruebas/rollback.',
                evidenceSnippet: 'Sin métricas SLO ni estrategia de reversión.',
                actionableFeedback: 'Añade modos de fallo, SLI/SLO cuantitativos y procedimiento de rollback seguro.',
            },
            {
                name: 'Checklist de autoverificación',
                status: 'NOT_RUN',
                detail: 'Marca los 5 entregables cuando los hayas revisado.',
                evidenceSnippet: '0/5 compromisos marcados.',
                actionableFeedback: 'Revisa y marca las 5 casillas de autoverificación antes de exportar el dossier.',
            },
            {
                name: 'Calidad técnica y adecuación al dominio',
                status: 'REQUIRES_REVIEW',
                detail: 'Requiere revisión humana con rúbrica auditable (sin IA omnisciente).',
                evidenceSnippet: `Huella actual: ${fingerprint} (${audit_status}).`,
                actionableFeedback: 'Adjunta o solicita revisión humana en el panel de rúbrica 1–4; no infla XP.',
            },
        ];
        return {
            structurallyComplete: false,
            humanReviewRequired: true,
            passedMechanicalCount: 0,
            totalMechanicalCount: 5,
            draftFingerprint: fingerprint,
            matchedDomainTerms: [],
            missingDomainTerms: [...project.expectedDomainTerms],
            auditVerificationStatus: audit_status,
            checks: idle_checks,
        };
    }
    const full_corpus = normalizeText(`${submission.architectureSummary} ${submission.alternativesAnalysis} ${submission.adrDecision} ${submission.risksAndMitigations} ${submission.verificationPlan}`);
    const matched_terms = project.expectedDomainTerms.filter((term) => full_corpus.includes(normalizeText(term)));
    const missing_terms = project.expectedDomainTerms.filter((term) => !full_corpus.includes(normalizeText(term)));
    const c4_len = submission.architectureSummary.trim().length;
    const c4_keywords = [
        'contenedor',
        'componente',
        'contexto',
        'c4',
        'servicio',
        'modulo',
        'capa',
        'puerto',
        'bd',
        'base de datos',
    ].filter((kw) => full_corpus.includes(kw));
    const c4_ok = c4_len >= MIN_PROJECT_SECTION_LENGTH && c4_keywords.length >= 1;
    const alt_norm = normalizeText(submission.alternativesAnalysis);
    const alt_len = submission.alternativesAnalysis.trim().length;
    const alt_keywords = [
        'alternativ',
        'descart',
        'frente a',
        'trade-off',
        'compromiso',
        'coste',
        'costo',
        'complejidad',
    ].filter((kw) => alt_norm.includes(kw));
    const alt_ok = alt_len >= MIN_PROJECT_SECTION_LENGTH && alt_keywords.length >= 1;
    const adr_len = submission.adrDecision.trim().length;
    const adr_ok = adr_len >= MIN_PROJECT_SECTION_LENGTH && matched_terms.length >= 2;
    const risk_len = submission.risksAndMitigations.trim().length;
    const verif_len = submission.verificationPlan.trim().length;
    const verif_norm = normalizeText(submission.verificationPlan);
    const verif_keywords = [
        'test',
        'prueba',
        'slo',
        'latencia',
        'metrica',
        'rollback',
        'monitor',
        'contrato',
    ].filter((kw) => verif_norm.includes(kw));
    const risk_verif_ok = risk_len >= MIN_PROJECT_SECTION_LENGTH &&
        verif_len >= MIN_PROJECT_SECTION_LENGTH &&
        verif_keywords.length >= 1;
    const checklist_values = Object.values(submission.checklist);
    const checked_count = checklist_values.filter(Boolean).length;
    const checklist_ok = checklist_values.every(Boolean);
    const checks = [
        {
            name: 'Modelo C4 y límites de contenedores',
            status: c4_ok ? 'PASS' : 'FAIL',
            detail: c4_ok
                ? 'Incluye descripción suficiente de contenedores, módulos o fronteras.'
                : `Amplía el resumen arquitectónico (mín. ${MIN_PROJECT_SECTION_LENGTH} caracteres) mencionando contenedores, capas o puertos.`,
            evidenceSnippet: `Longitud: ${c4_len} car. · Señales C4: ${c4_keywords.join(', ') || 'ninguna'}.`,
            actionableFeedback: c4_ok
                ? 'Evidencia estructural presente; verifica en revisión humana que no existan acoplamientos ocultos.'
                : 'Explicita qué contenedores/módulos existen y en qué dirección apuntan sus dependencias.',
        },
        {
            name: 'Alternativas y trade-offs',
            status: alt_ok ? 'PASS' : 'FAIL',
            detail: alt_ok
                ? 'Documenta alternativas descartadas, costes o compromisos explícitos.'
                : 'Explica qué alternativa descartaste y qué coste o complejidad aceptas a cambio.',
            evidenceSnippet: `Longitud: ${alt_len} car. · Señales trade-off: ${alt_keywords.join(', ') || 'ninguna'}.`,
            actionableFeedback: alt_ok
                ? 'Contraste de opciones detectado.'
                : 'Menciona al menos una arquitectura descartada y el costo operativo que te llevó a rechazarla.',
        },
        {
            name: 'Registro ADR contextualizado',
            status: adr_ok ? 'PASS' : 'FAIL',
            detail: adr_ok
                ? `Cita vocabulario relevante del caso (${matched_terms.slice(0, 4).join(', ')}).`
                : `Conecta tu ADR con las restricciones y términos del dominio (ej. ${project.expectedDomainTerms.slice(0, 3).join(', ')}).`,
            evidenceSnippet: `Detectados (${matched_terms.length}/${project.expectedDomainTerms.length}): ${matched_terms.join(', ') || 'ninguno'}.`,
            actionableFeedback: adr_ok
                ? missing_terms.length > 0
                    ? `Opcional: considera cubrir también «${missing_terms.join(', ')}».`
                    : 'Cubre todos los términos esperados del dominio.'
                : `Incorpora al menos 2 términos clave faltantes: ${missing_terms.slice(0, 3).join(', ')}.`,
        },
        {
            name: 'Matriz de riesgos y verificación',
            status: risk_verif_ok ? 'PASS' : 'FAIL',
            detail: risk_verif_ok
                ? 'Define riesgos y estrategia verificable (pruebas, métricas SLO o rollback).'
                : 'Completa riesgos y cómo medirás éxito/reversión con pruebas o métricas SLO.',
            evidenceSnippet: `Riesgos: ${risk_len} car. · Verificación: ${verif_len} car. (${verif_keywords.join(', ') || 'sin señal'}).`,
            actionableFeedback: risk_verif_ok
                ? 'Plan de pruebas/métricas identificado.'
                : 'Especifica qué test automatizado, métrica p95/SLO y paso de rollback protegerán el despliegue.',
        },
        {
            name: 'Checklist de autoverificación',
            status: checklist_ok ? 'PASS' : 'FAIL',
            detail: checklist_ok
                ? 'Los 5 puntos de autoverificación están confirmados.'
                : `Marcados ${checked_count}/5 compromisos del checklist.`,
            evidenceSnippet: `${checked_count}/5 casillas confirmadas.`,
            actionableFeedback: checklist_ok
                ? 'Autoverificación completa.'
                : `Marca los ${5 - checked_count} compromisos restantes tras revisar tu borrador.`,
        },
        {
            name: 'Calidad técnica y adecuación al dominio',
            status: 'REQUIRES_REVIEW',
            detail: 'La coherencia real de los límites, costes y supuestos requiere evaluación humana; la plataforma no emite certificaciones automáticas.',
            evidenceSnippet: `Huella: ${fingerprint} · Estado auditoría: ${audit_status}.`,
            actionableFeedback: audit_status === 'VERIFIED_MATCHING_DRAFT'
                ? 'Existe dictamen humano vigente alineado con la huella actual del borrador.'
                : audit_status === 'DRAFT_MODIFIED_AFTER_REVIEW'
                    ? 'El borrador cambió después de la última revisión; solicita re-auditoría de la nueva huella.'
                    : 'Registra una revisión humana opcional con rúbrica 1–4 abajo para cerrar el ciclo auditable.',
        },
    ];
    const passed_count = checks.filter((c) => c.status === 'PASS').length;
    return {
        structurallyComplete: passed_count === 5,
        humanReviewRequired: true,
        passedMechanicalCount: passed_count,
        totalMechanicalCount: 5,
        draftFingerprint: fingerprint,
        matchedDomainTerms: matched_terms,
        missingDomainTerms: missing_terms,
        auditVerificationStatus: audit_status,
        checks,
    };
}
export function getStructurallyCompletedProjectIds(projects_state) {
    const completed = [];
    for (const project of CAPSTONE_PROJECTS) {
        const sub = projects_state[project.id];
        if (!sub)
            continue;
        if (evaluateProjectSubmission(project, sub).structurallyComplete) {
            completed.push(project.id);
        }
    }
    return completed;
}
export function exportProjectMarkdown(project, submission, evaluation) {
    const clean = (val) => val.replace(/\r/g, '').trim() || '_Sin completar_';
    const trail = submission.auditTrail ?? [];
    return [
        `# ${project.id} — ${project.title}`,
        '',
        `- **Categoría:** ${project.badgeTag}`,
        `- **Última edición:** ${submission.updatedAt}`,
        `- **Huella determinista del borrador:** \`${evaluation.draftFingerprint}\``,
        `- **Estado estructural:** ${evaluation.structurallyComplete ? 'ESTRUCTURA COMPLETA (Pendiente de revisión humana)' : `INCOMPLETO (${evaluation.passedMechanicalCount}/${evaluation.totalMechanicalCount} controles mecánicos)`}`,
        `- **Revisión experta:** REQUIRES_REVIEW (${evaluation.auditVerificationStatus})`,
        '',
        '## 1. Contexto y Restricciones del Caso',
        project.context,
        '',
        `- **Tráfico / Carga:** ${project.constraints.traffic}`,
        `- **SLO Objetivo:** ${project.constraints.slo}`,
        `- **Equipo:** ${project.constraints.team}`,
        `- **Restricción clave:** ${project.constraints.primaryConstraint}`,
        '',
        '## 2. Arquitectura Propuesta (C4 / Límites y Responsabilidades)',
        clean(submission.architectureSummary),
        '',
        '## 3. Análisis de Alternativas y Trade-offs',
        clean(submission.alternativesAnalysis),
        '',
        '## 4. Decisión Arquitectónica (ADR)',
        clean(submission.adrDecision),
        '',
        '## 5. Matriz de Riesgos y Mitigaciones',
        clean(submission.risksAndMitigations),
        '',
        '## 6. Plan de Verificación, Métricas y Rollback',
        clean(submission.verificationPlan),
        '',
        '## 7. Rúbrica Estructural y Evidencia Automática por Check',
        ...evaluation.checks.map((c) => `- **[${c.status}]** ${c.name}: ${c.detail}\n  - *Evidencia:* ${c.evidenceSnippet}\n  - *Retroalimentación:* ${c.actionableFeedback}`),
        '',
        '## 8. Registro Auditable de Revisiones Humanas (Sin IA Omnisciente)',
        ...(trail.length === 0
            ? ['- _Sin revisiones humanas registradas todavía (`UNREVIEWED`)._']
            : trail.map((entry, idx) => `- **#${idx + 1} · ${entry.verdict}** por ${entry.reviewerName} (${entry.reviewerRole}) el ${entry.reviewedAt} · Huella revisada: \`${entry.draftFingerprint}\` · Rúbrica: Contexto ${entry.scores.contextClarity}/4, Límites ${entry.scores.boundaryIntegrity}/4, Trade-offs ${entry.scores.tradeoffHonesty}/4, Verificación ${entry.scores.verificationRigor}/4 — "${entry.auditComment}"`)),
        '',
        '> Nota de privacidad: revisa este documento antes de publicarlo para confirmar que no incluyes información confidencial.',
        '',
    ].join('\n');
}
export function exportProjectJson(project, submission, evaluation) {
    return JSON.stringify({
        schemaVersion: 2,
        app: 'ARQPIXEL',
        kind: 'capstone-dossier',
        project: {
            id: project.id,
            title: project.title,
            constraints: project.constraints,
        },
        submission,
        evaluation,
    }, null, 2);
}
export function exportReferenceNestjsGuideMarkdown() {
    return [
        '# Laboratorios Poliglotas de Referencia — NexoShop (TypeScript/NestJS · C#/.NET 8 · Java 21)',
        '',
        'Tres micro-repositorios hexagonales incluidos en `examples/` con auditoría automática de fronteras de capas (`scripts/check-polyglot-architecture.mjs`).',
        '',
        '## 1. `examples/nexoshop-reference-nestjs/` (TypeScript · Ejecutable 100 % offline)',
        '- **Misión S04 (Clean / Hexagonal):** `domain/` y `application/` sin imports de ORM ni HTTP.',
        '- **Misión S06 (Agregados y Concurrencia):** `StockItem` con invariante `available_qty >= 0` y versión optimista.',
        '- **Misión S09 (Outbox + Idempotencia + OpenAPI 3.1):** `OrdersService.placeOrder()` + `openapi/orders.openapi.json` sin carpeta `contracts/` global.',
        '',
        '## 2. `examples/nexoshop-reference-csharp/` (C# 12 / .NET 8)',
        '- `Domain/OrderAggregate.cs` (`Version` optimista + `TenantId`) + `Application/Ports/IOrderRepository.cs` + `Infrastructure/PostgresOrderRepository.cs`.',
        '',
        '## 3. `examples/nexoshop-reference-java/` (Java 21 Records)',
        '- `domain/OrderAggregate.java` + `application/port/OrderRepositoryPort.java` + `infrastructure/JpaOrderRepositoryAdapter.java`.',
        '',
        '## Cómo verificar localmente',
        '```bash',
        'node scripts/check-polyglot-architecture.mjs',
        'cd examples/nexoshop-reference-nestjs && npm run typecheck && npm test',
        '```',
        '',
    ].join('\n');
}
export function renderProjectsCatalogHtml(projects_state, completed_modules, filter_kind = 'ALL') {
    const done_modules = new Set(completed_modules);
    const completed_projects = new Set(getStructurallyCompletedProjectIds(projects_state));
    const visible = CAPSTONE_PROJECTS.filter((p) => filter_kind === 'ALL' || p.kind === filter_kind);
    return `<div class="page-title">
    <span class="eyebrow">▣ PORTAFOLIO PRÁCTICO DE ARQUITECTURA</span>
    <h1>Proyectos integradores y Capstones</h1>
    <p>Once casos integradores (3 por nivel + 8 por especialización técnica) con evidencia automática por check, huella determinista y registro auditable de revisión humana.</p>
  </div>

  <div class="stats-grid">
    <div class="stat intro-stat"><span class="stat-ico">${renderPixelNavIconSvg('projects', 18)}</span><strong>${completed_projects.size}<small>/ ${CAPSTONE_PROJECTS.length}</small></strong><p>Dossiers con estructura completa</p></div>
    <div class="stat intro-stat"><span class="stat-ico mint">${renderPixelNavIconSvg('specs', 18)}</span><strong>3</strong><p>Integradores de nivel (B12, I12, A12)</p></div>
    <div class="stat intro-stat"><span class="stat-ico purple">${renderPixelNavIconSvg('senior', 18)}</span><strong>8</strong><p>Capstones de especialización (R01–R08)</p></div>
    <div class="stat intro-stat"><span class="stat-ico yellow">${renderPixelNavIconSvg('about', 18)}</span><strong>100%</strong><p>Revisión humana (REQUIRES_REVIEW)</p></div>
  </div>

  <section class="lesson-card spec-capstone-callout mb-20" aria-label="Laboratorios poliglotas de referencia NexoShop">
    <span class="eyebrow">📦 REPOSITORIOS POLIGLOTAS DE REFERENCIA · TYPESCRIPT · C# · JAVA</span>
    <h2>Arquitectura Hexagonal + Agregados + Outbox en 3 Stacks (<code>examples/nexoshop-reference-*</code>)</h2>
    <p>Compara cómo se protegen exactamente las mismas invariantes de <strong>NexoShop Orders</strong> sin contaminar el Dominio ni crear carpetas <code>contracts/</code> globales: <code>examples/nexoshop-reference-nestjs/</code> (TypeScript ejecutable + OpenAPI 3.1), <code>examples/nexoshop-reference-csharp/</code> (.NET 8) y <code>examples/nexoshop-reference-java/</code> (Java 21), auditados por <code>scripts/check-polyglot-architecture.mjs</code>.</p>
    <div class="inline-actions">
      <button type="button" class="btn primary small" id="download-ref-nestjs-guide">Descargar guía poliglota (.md)</button>
      <a class="btn secondary small" href="#/taller-senior/S04">Misión S04 (Hexagonal) →</a>
      <a class="btn secondary small" href="#/taller-senior/S06">Misión S06 (Agregados) →</a>
      <a class="btn secondary small" href="#/taller-senior/S09">Misión S09 (Outbox/Pagos) →</a>
    </div>
  </section>

  <section class="lesson-card map-filters-card" aria-label="Filtrar proyectos integradores">
    <div class="map-filter-bar filter-bar-flush">
      <label class="field-label min-w-250">Tipo de proyecto
        <select id="projects-kind-filter">
          <option value="ALL" ${filter_kind === 'ALL' ? 'selected' : ''}>Todos los proyectos (${CAPSTONE_PROJECTS.length})</option>
          <option value="level_integrator" ${filter_kind === 'level_integrator' ? 'selected' : ''}>Integradores por nivel (3)</option>
          <option value="specialization_capstone" ${filter_kind === 'specialization_capstone' ? 'selected' : ''}>Capstones por especialización (8)</option>
        </select>
      </label>
      <p class="muted" role="status" aria-live="polite">Mostrando <strong>${visible.length}</strong> proyectos. Tus avances se guardan localmente y se incluyen en el backup general.</p>
    </div>
  </section>

  <div class="specialization-grid">
    ${visible
        .map((proj, idx) => {
        const sub = projects_state[proj.id];
        const is_complete = completed_projects.has(proj.id);
        const has_draft = Boolean(sub && !isProjectDraftUntouched(sub));
        const ready_mods = proj.relatedModules.filter((m) => done_modules.has(m)).length;
        const status_text = is_complete
            ? '✓ Estructura lista para revisión'
            : has_draft
                ? '✎ Borrador en curso'
                : '◌ Sin iniciar';
        return `<article class="specialization-card project-card">
          <div class="level-ghost-num" aria-hidden="true">${String(idx + 1).padStart(2, '0')}</div>
          <div class="map-node-top">
            <span class="eyebrow">${esc(proj.badgeTag)}</span>
            <span class="map-badge">${esc(status_text)}</span>
          </div>
          <h2>${esc(proj.title)}</h2>
          <p>${esc(proj.subtitle)}</p>
          <div class="spec-capstone my-14">
            <strong>Restricción crítica</strong>
            <p>${esc(proj.constraints.primaryConstraint)}</p>
            <small>Carga: ${esc(proj.constraints.traffic)} · SLO: ${esc(proj.constraints.slo)}</small>
          </div>
          <p class="muted text-sm">Módulos base completados: <b>${ready_mods}/${proj.relatedModules.length}</b> (${esc(proj.relatedModules.join(', '))})</p>
          <div class="inline-actions mt-14">
            <a class="btn primary small" href="#/proyectos/${esc(proj.id)}">${has_draft ? 'Continuar dossier →' : 'Iniciar proyecto →'}</a>
            ${proj.relatedPathId ? `<a class="btn secondary small" href="#/rutas/${esc(proj.relatedPathId)}">Ver ruta ${esc(proj.relatedPathId)}</a>` : ''}
          </div>
        </article>`;
    })
        .join('')}
  </div>`;
}
export function renderProjectWorkspaceHtml(project, submission, evaluation) {
    if (!project) {
        return `<div class="page-title">
      <span class="eyebrow">PROYECTO NO ENCONTRADO</span>
      <h1>Caso integrador desconocido</h1>
      <p>Selecciona uno de los once proyectos integradores o capstones registrados en la academia.</p>
      <a class="btn primary small" href="#/proyectos">Volver a proyectos</a>
    </div>`;
    }
    const current_eval = evaluation ?? evaluateProjectSubmission(project, submission);
    const trail = submission.auditTrail ?? [];
    return `<div class="backline">
    <a href="#/proyectos">← Todos los proyectos</a>
    <span>${esc(project.id)} · ${esc(project.badgeTag)}</span>
  </div>

  <div class="page-title">
    <span class="eyebrow">▣ WORKSPACE DE PROYECTO CAPSTONE</span>
    <h1>${esc(project.title)}</h1>
    <p>${esc(project.subtitle)}</p>
  </div>

  <div class="mission-layout">
    <div>
      <div class="mission-brief">
        <h2>01 · Contexto y restricciones no negociables</h2>
        <p>${esc(project.context)}</p>
        <div class="constraints">
          <div><span>CARGA / TRÁFICO</span><b>${esc(project.constraints.traffic)}</b></div>
          <div><span>SLO OBJETIVO</span><b>${esc(project.constraints.slo)}</b></div>
          <div><span>EQUIPO</span><b>${esc(project.constraints.team)}</b></div>
          <div><span>CONCEPTOS CLAVE</span><b>${esc(project.expectedDomainTerms.join(', '))}</b></div>
        </div>
        <div class="incident-alert">◈ Restricción rectora: ${esc(project.constraints.primaryConstraint)}.</div>
      </div>

      <section class="lesson-card">
        <span class="overline">02 / ENTREGABLES ARQUITECTÓNICOS</span>
        <h2>Dossier de diseño y decisiones</h2>
        <p class="muted">Mínimo ${MIN_PROJECT_SECTION_LENGTH} caracteres por bloque para superar la revisión estructural. Huella actual del borrador: <code>${esc(current_eval.draftFingerprint)}</code>.</p>

        <label class="field-label">1. Modelo C4 / Contenedores, componentes y dirección de dependencias
          <textarea id="proj-arch" class="note-area" rows="4" placeholder="Contenedores, responsabilidades, protocolos y límites de dominio...">${esc(submission.architectureSummary)}</textarea>
        </label>

        <label class="field-label">2. Alternativas evaluadas y trade-offs asumidos
          <textarea id="proj-alt" class="note-area" rows="4" placeholder="Opción elegida frente a opción descartada; coste operativo, complejidad y límites...">${esc(submission.alternativesAnalysis)}</textarea>
        </label>

        <label class="field-label">3. Registro de Decisión Arquitectónica (ADR principal)
          <textarea id="proj-adr" class="note-area" rows="4" placeholder="Contexto cuantitativo, decisión concreta y consecuencias sobre los requisitos del caso...">${esc(submission.adrDecision)}</textarea>
        </label>

        <label class="field-label">4. Matriz de riesgos técnicos, seguridad y mitigaciones
          <textarea id="proj-risks" class="note-area" rows="4" placeholder="Modos de fallo, seguridad/autorización, cuellos de botella y plan de contención...">${esc(submission.risksAndMitigations)}</textarea>
        </label>

        <label class="field-label">5. Estrategia de verificación, métricas SLO y plan de rollback
          <textarea id="proj-verif" class="note-area" rows="4" placeholder="Tests unitarios/contratos/carga, SLI/SLO medibles y cómo revertir sin pérdida de datos...">${esc(submission.verificationPlan)}</textarea>
        </label>
      </section>

      <section class="lesson-card">
        <span class="overline">03 / CHECKLIST Y EVIDENCIA AUTOMÁTICA POR CHECK</span>
        <h2>Compromisos de entrega y retroalimentación</h2>
        <div class="suite-checks">
          <label><input type="checkbox" id="proj-chk-c4" ${submission.checklist.c4Included ? 'checked' : ''}/> Declaro contenedores, límites y dirección de dependencias</label>
          <label><input type="checkbox" id="proj-chk-adr" ${submission.checklist.adrCompleted ? 'checked' : ''}/> El ADR cita las restricciones específicas del escenario</label>
          <label><input type="checkbox" id="proj-chk-tradeoff" ${submission.checklist.tradeOffsExplicit ? 'checked' : ''}/> Justifico al menos una alternativa descartada y su trade-off</label>
          <label><input type="checkbox" id="proj-chk-verif" ${submission.checklist.verificationDefined ? 'checked' : ''}/> Incluyo pruebas verificables, métricas SLO y rollback</label>
          <label><input type="checkbox" id="proj-chk-limits" ${submission.checklist.limitationsDeclared ? 'checked' : ''}/> Comprendo que requiere revisión humana (REQUIRES_REVIEW)</label>
        </div>

        <div class="inline-actions mt-18">
          <button type="button" class="btn secondary small" id="proj-save">Guardar borrador</button>
          <button type="button" class="btn primary small" id="proj-evaluate">Validar estructura del dossier</button>
          <button type="button" class="btn secondary small" id="proj-export-md">Exportar Markdown (.md)</button>
          <button type="button" class="btn secondary small" id="proj-export-json">Exportar Dossier (.json)</button>
          <button type="button" class="btn secondary small" data-print-dossier="true">🖨 Imprimir / PDF</button>
        </div>

        <div id="proj-evaluation-report" role="status" aria-live="polite" class="mt-16">
          <div class="scorecard">
            <div class="score-big"><b>${current_eval.passedMechanicalCount}<small>/${current_eval.totalMechanicalCount}</small></b><span>controles estructurales · huella <code>${esc(current_eval.draftFingerprint)}</code></span></div>
            ${current_eval.checks
        .map((chk) => `<div class="proj-check-item">
                    <p>${chk.status === 'PASS' ? '✓' : chk.status === 'REQUIRES_REVIEW' ? '◇' : '○'} <b>${esc(chk.status)}</b> · <strong>${esc(chk.name)}</strong>: ${esc(chk.detail)}</p>
                    <small class="muted">🔎 Evidencia: ${esc(chk.evidenceSnippet)} · 💡 Acción: ${esc(chk.actionableFeedback)}</small>
                  </div>`)
        .join('')}
          </div>
        </div>
      </section>

      <section class="lesson-card" id="proj-audit-gate">
        <span class="overline">04 / RÚBRICA HUMANA OPCIONAL Y BITÁCORA AUDITABLE (SIN IA OMNISCIENTE)</span>
        <h2>Revisión por mentor, par o comité de arquitectura</h2>
        <p class="muted">Estado de auditoría frente al borrador actual: <strong>${esc(current_eval.auditVerificationStatus)}</strong>. El dictamen humano queda vinculado a la huella <code>${esc(current_eval.draftFingerprint)}</code> y nunca infla XP automáticamente.</p>
        <details class="mt-12">
          <summary class="mentor-summary">Registrar nueva revisión con rúbrica 1–4 en bitácora auditable</summary>
          <div class="mt-12">
            <div class="specialization-grid">
              <label class="field-label">Nombre del revisor<input id="proj-rev-name" maxlength="120" placeholder="Ej. Arquitecta Principal"/></label>
              <label class="field-label">Rol / Comité<input id="proj-rev-role" maxlength="120" placeholder="Ej. Comité Arquitectura"/></label>
            </div>
            <div class="map-filters-grid">
              <label class="field-label">Contexto (1–4)<select id="proj-score-ctx"><option value="4" selected>4 · Sobresaliente</option><option value="3">3 · Sólido</option><option value="2">2 · Parcial</option><option value="1">1 · Insuficiente</option></select></label>
              <label class="field-label">Límites (1–4)<select id="proj-score-bnd"><option value="4" selected>4 · Sobresaliente</option><option value="3">3 · Sólido</option><option value="2">2 · Parcial</option><option value="1">1 · Insuficiente</option></select></label>
              <label class="field-label">Trade-offs (1–4)<select id="proj-score-trd"><option value="4" selected>4 · Sobresaliente</option><option value="3">3 · Sólido</option><option value="2">2 · Parcial</option><option value="1">1 · Insuficiente</option></select></label>
              <label class="field-label">Verificación (1–4)<select id="proj-score-ver"><option value="4" selected>4 · Sobresaliente</option><option value="3">3 · Sólido</option><option value="2">2 · Parcial</option><option value="1">1 · Insuficiente</option></select></label>
            </div>
            <label class="field-label">Dictamen
              <select id="proj-rev-verdict">
                <option value="APPROVED_WITH_EVIDENCE">APPROVED_WITH_EVIDENCE · Evidencia coherente</option>
                <option value="ITERATE_DESIGN">ITERATE_DESIGN · Iterar límites o riesgos</option>
                <option value="REJECTED_UNSAFE">REJECTED_UNSAFE · Riesgo severo no mitigado</option>
              </select>
            </label>
            <label class="field-label">Comentario auditable (mín. 12 caracteres)
              <textarea id="proj-rev-comment" rows="2" class="note-area" placeholder="Observaciones concretas sobre límites, riesgos y plan de verificación..."></textarea>
            </label>
            <button type="button" class="btn secondary small" id="proj-save-review">Registrar revisión en bitácora</button>
          </div>
        </details>
        <div id="proj-audit-log" class="mt-14" role="region" aria-label="Bitácora auditable de revisiones humanas">
          ${trail.length === 0
        ? '<p class="muted">Sin revisiones humanas registradas todavía.</p>'
        : trail
            .map((entry, idx) => `<div class="feedback ${entry.draftFingerprint === current_eval.draftFingerprint ? 'good' : 'bad'}">
                        <strong>#${idx + 1} · ${esc(entry.verdict)} · ${esc(entry.reviewerName)} (${esc(entry.reviewerRole)})</strong>
                        <p>Rúbrica: Contexto ${entry.scores.contextClarity}/4 · Límites ${entry.scores.boundaryIntegrity}/4 · Trade-offs ${entry.scores.tradeoffHonesty}/4 · Verificación ${entry.scores.verificationRigor}/4 (${entry.draftFingerprint === current_eval.draftFingerprint ? '✓ Huella vigente' : '⚠ Borrador editado tras esta revisión'})</p>
                        <p>${esc(entry.auditComment)}</p>
                      </div>`)
            .join('')}
        </div>
      </section>
    </div>

    <aside class="lesson-aside">
      <div class="aside-panel">
        <img src="./assets/arquibot.png" width="128" height="128" alt="ArquiBot"/>
        <h3>Herramientas de apoyo</h3>
        <p>Construye diagramas o borradores complementarios en los laboratorios conectados:</p>
        <div class="inline-actions">
          <a class="btn secondary small" href="#/laboratorio/${esc(project.recommendedLabId)}">Abrir laboratorio sugerido ↗</a>
          <a class="btn secondary small" href="#/laboratorio/c4">Abrir C4 Studio ↗</a>
        </div>
      </div>
      <div class="aside-panel">
        <h3>Lecciones y misiones base</h3>
        <p class="muted">Módulos recomendados: <b>${esc(project.relatedModules.join(', '))}</b></p>
        <p class="muted">Misiones Senior: <b>${esc(project.relatedMissions.join(', '))}</b></p>
        ${project.relatedPathId ? `<a class="text-link" href="#/rutas/${esc(project.relatedPathId)}">← Ver especialización ${esc(project.relatedPathId)}</a>` : ''}
      </div>
    </aside>
  </div>`;
}
