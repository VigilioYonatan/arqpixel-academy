import { renderArquiBotSprite, } from '../schemas/assets-manifest.schema.js';
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
export function resolveBreadcrumbsTrail(raw_route, ctx, is_not_found = false) {
    const root = { label: 'ACADEMIA', href: '#/inicio' };
    if (is_not_found) {
        return [root, { label: '404 · RUTA NO ENCONTRADA', current: true }];
    }
    const clean = (raw_route || 'inicio').split('?')[0].replace(/^\/+|\/+$/g, '') || 'inicio';
    const [base, second, third] = clean.split('/');
    if (base === 'inicio') {
        return [{ label: 'ACADEMIA', href: '#/inicio' }, { label: 'INICIO', current: true }];
    }
    if (base === 'mapa') {
        return [root, { label: 'MAPA CURRICULAR (54 NODOS)', current: true }];
    }
    if (base === 'rutas') {
        const path_id = second?.trim().toUpperCase();
        if (path_id) {
            if (ctx.pathTitleById.has(path_id)) {
                return [
                    root,
                    { label: 'ESPECIALIZACIONES', href: '#/especializaciones' },
                    { label: `${path_id} · ${ctx.pathTitleById.get(path_id)}`, current: true },
                ];
            }
            return [root, { label: '404 · ESPECIALIZACIÓN NO ENCONTRADA', current: true }];
        }
        return [root, { label: 'RUTAS DE APRENDIZAJE', current: true }];
    }
    if (base === 'especializaciones') {
        const path_id = second?.trim().toUpperCase();
        if (path_id) {
            if (ctx.pathTitleById.has(path_id)) {
                return [
                    root,
                    { label: 'ESPECIALIZACIONES', href: '#/especializaciones' },
                    { label: `${path_id} · ${ctx.pathTitleById.get(path_id)}`, current: true },
                ];
            }
            return [root, { label: '404 · ESPECIALIZACIÓN NO ENCONTRADA', current: true }];
        }
        return [root, { label: 'ESPECIALIZACIONES (R01–R08)', current: true }];
    }
    if (base === 'aprender' || base === 'modulo') {
        const mod_id = (second || 'B01').trim().toUpperCase();
        const title = ctx.moduleTitleById.get(mod_id);
        const level = ctx.moduleLevelById.get(mod_id);
        if (!title) {
            return [root, { label: '404 · MÓDULO NO ENCONTRADO', current: true }];
        }
        return [
            root,
            { label: 'RUTAS', href: '#/rutas' },
            ...(level ? [{ label: level.toUpperCase(), href: '#/rutas' }] : []),
            { label: `${mod_id} · ${title}`, current: true },
        ];
    }
    if (base === 'proyectos') {
        if (second) {
            const proj_id = second.trim().toUpperCase();
            const proj_title = ctx.projectTitleById.get(proj_id);
            if (!proj_title)
                return [root, { label: '404 · PROYECTO NO ENCONTRADO', current: true }];
            return [
                root,
                { label: 'PROYECTOS', href: '#/proyectos' },
                { label: `${proj_id} · ${proj_title}`, current: true },
            ];
        }
        return [root, { label: 'PROYECTOS Y CAPSTONES', current: true }];
    }
    if (base === 'laboratorios') {
        return [root, { label: 'LABORATORIOS', current: true }];
    }
    if (base === 'laboratorio') {
        const lab_id = (second || 'dependencias').trim().toLowerCase();
        const lab_title = ctx.labTitleById.get(lab_id);
        if (!lab_title)
            return [root, { label: '404 · LABORATORIO NO ENCONTRADO', current: true }];
        return [
            root,
            { label: 'LABORATORIOS', href: '#/laboratorios' },
            { label: lab_title.toUpperCase(), current: true },
        ];
    }
    if (base === 'minijuegos') {
        return [root, { label: 'MINIJUEGOS', current: true }];
    }
    if (base === 'minijuego') {
        const game_id = (second || 'tetris').trim().toLowerCase();
        const game_title = ctx.miniGameTitleById.get(game_id);
        if (!game_title)
            return [root, { label: '404 · MINIJUEGO NO ENCONTRADO', current: true }];
        return [
            root,
            { label: 'MINIJUEGOS', href: '#/minijuegos' },
            { label: game_title.toUpperCase(), current: true },
        ];
    }
    if (base === 'senior') {
        return [root, { label: 'SENIOR MODE (18 MISIONES)', current: true }];
    }
    if (base === 'mision' || base === 'taller-senior') {
        const mis_id = (second || 'S01').trim().toUpperCase();
        const mis_title = ctx.missionTitleById.get(mis_id);
        if (!mis_title)
            return [root, { label: '404 · MISIÓN NO ENCONTRADA', current: true }];
        return [
            root,
            { label: 'SENIOR MODE', href: '#/senior' },
            {
                label: `${base === 'taller-senior' ? 'TALLER ' : ''}${mis_id} · ${mis_title}`,
                current: true,
            },
        ];
    }
    if (base === 'recursos') {
        if (second === 'patrones') {
            const pat_id = (third || 'strategy').trim().toLowerCase();
            const pat_name = ctx.patternNameById.get(pat_id);
            if (!pat_name)
                return [root, { label: '404 · PATRÓN NO ENCONTRADO', current: true }];
            return [
                root,
                { label: 'RECURSOS', href: '#/recursos' },
                { label: `PATRÓN · ${pat_name.toUpperCase()}`, current: true },
            ];
        }
        if (second === 'adr') {
            return [
                root,
                { label: 'RECURSOS', href: '#/recursos' },
                { label: 'PLANTILLAS ADR', current: true },
            ];
        }
        if (!second) {
            return [root, { label: 'RECURSOS Y PATRONES', current: true }];
        }
        return [root, { label: '404 · RECURSO NO ENCONTRADO', current: true }];
    }
    if (base === 'logros')
        return [root, { label: 'LOGROS E INSIGNIAS', current: true }];
    if (base === 'perfil')
        return [root, { label: 'MI PERFIL', current: true }];
    if (base === 'ajustes')
        return [root, { label: 'AJUSTES Y ACCESIBILIDAD', current: true }];
    if (base === 'sobre')
        return [root, { label: 'SOBRE ARQPIXEL', current: true }];
    return [root, { label: '404 · RUTA NO ENCONTRADA', current: true }];
}
export function renderBreadcrumbsNavHtml(trail) {
    return `<nav class="breadcrumbs" aria-label="Ruta de navegación">
    <ol class="breadcrumb-list">
      ${trail
        .map((item, idx) => {
        const sep = idx > 0 ? '<span class="breadcrumb-sep" aria-hidden="true">/</span>' : '';
        if (item.current || !item.href) {
            return `<li>${sep}<strong aria-current="page">${esc(item.label)}</strong></li>`;
        }
        return `<li>${sep}<a href="${esc(item.href)}">${esc(item.label)}</a></li>`;
    })
        .join('')}
    </ol>
  </nav>`;
}
export function renderNotFoundPageHtml(options) {
    const target_label = options.entityLabel ?? 'Ruta o recurso';
    return `<section class="lesson-card not-found-panel" data-ui-state="error" role="region" aria-labelledby="not-found-heading">
    <div class="solution-reveal-head">
      ${renderArquiBotSprite('arquibot-error', 96, '', options.manifestLookup)}
      <div>
        <span class="eyebrow">⚠ 404 · ${esc(target_label.toUpperCase())} NO ENCONTRADO</span>
        <h1 id="not-found-heading">No encontramos «${esc(options.requestedRoute)}»</h1>
        <p>La dirección solicitada no corresponde a ninguna lección, laboratorio, ruta, patrón o misión activa en el catálogo verificado de ARQPIXEL Academy.</p>
      </div>
    </div>
    <div class="inline-actions mt-18">
      <a class="btn primary small" href="#/inicio">⌂ Volver al inicio</a>
      <a class="btn secondary small" href="#/mapa">◈ Abrir mapa de 54 nodos</a>
      <a class="btn secondary small" href="#/rutas">▤ Explorar 36 lecciones</a>
      <a class="btn secondary small" href="#/laboratorios">⌘ Ir a los 8 laboratorios</a>
      <a class="btn secondary small" href="#/senior">♛ Ir a Senior Mode</a>
      <button type="button" class="btn secondary small" id="not-found-open-search">⌕ Buscar concepto (Ctrl+K)</button>
    </div>
  </section>`;
}
