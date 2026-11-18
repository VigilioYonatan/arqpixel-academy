import { s } from './schema-validator.js';
export const ARQUIBOT_SPRITE_IDS = [
    'arquibot-hero',
    'arquibot-idle',
    'arquibot-saludo',
    'arquibot-pensando',
    'arquibot-explicando',
    'arquibot-diagrama',
    'arquibot-codigo',
    'arquibot-libro',
    'arquibot-laboratorio',
    'arquibot-error',
    'arquibot-exito',
    'arquibot-idea',
    'arquibot-debug',
    'arquibot-senior',
    'arquibot-graduado',
    'arquibot-spritesheet',
];
export const assetManifestItemSchema = s.object({
    id: s.string({ trimMin: 3, max: 60, pattern: /^[a-z0-9-]+$/ }),
    src: s.string({ trimMin: 6, max: 160, pattern: /^\.\/assets\/[a-z0-9/_-]+\.png$/ }),
    alt: s.string({ trimMin: 10, max: 220 }),
    width: s.number({ int: true, min: 64, max: 4096 }),
    height: s.number({ int: true, min: 64, max: 4096 }),
    transparentRgba: s.boolean(),
    pixelArt: s.boolean(),
    theme: s.enum(['dark', 'light', 'both']),
    usage: s.string({ trimMin: 10, max: 240 }),
}, { strict: true });
export const assetsManifestCatalogSchema = s
    .array(assetManifestItemSchema, { min: 19, max: 40 })
    .refine((items) => {
    const ids = new Set(items.map((x) => x.id));
    return ids.size === items.length && ARQUIBOT_SPRITE_IDS.every((req) => ids.has(req));
}, 'El manifest de assets debe incluir IDs únicos y los 16 sprites oficiales de ArquiBot');
const DEFAULT_SPRITE_ALTS = Object.freeze({
    'arquibot-hero': 'ArquiBot señalando capas de arquitectura',
    'arquibot-idle': 'ArquiBot atento para acompañarte',
    'arquibot-saludo': 'ArquiBot saludando',
    'arquibot-pensando': 'ArquiBot analizando restricciones',
    'arquibot-explicando': 'ArquiBot explicando una solución de referencia',
    'arquibot-diagrama': 'ArquiBot proyectando un diagrama C4',
    'arquibot-codigo': 'ArquiBot mostrando contratos y código limpio',
    'arquibot-libro': 'ArquiBot sosteniendo un registro ADR',
    'arquibot-laboratorio': 'ArquiBot en modo laboratorio experimental',
    'arquibot-error': 'ArquiBot advirtiendo un riesgo arquitectónico',
    'arquibot-exito': 'ArquiBot celebrando un criterio superado',
    'arquibot-idea': 'ArquiBot sugiriendo una pista de diseño',
    'arquibot-debug': 'ArquiBot diagnosticando incidentes y métricas',
    'arquibot-senior': 'ArquiBot en modo Comité de Arquitectura Senior',
    'arquibot-graduado': 'ArquiBot celebrando un logro de portafolio',
    'arquibot-spritesheet': 'Atlas completo de poses de ArquiBot',
});
function escapeAttr(val) {
    return val.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
}
export function renderArquiBotSprite(pose_id, display_size = 72, extra_class = '', manifest_lookup) {
    const item = manifest_lookup?.get(pose_id);
    const src = item?.src ?? `./assets/arquibot/${pose_id}.png`;
    const alt = item?.alt ?? DEFAULT_SPRITE_ALTS[pose_id];
    const cls = `arquibot-sprite ${item?.pixelArt !== false ? 'pixel-art-sprite' : ''} ${extra_class}`.trim();
    return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" width="${display_size}" height="${display_size}" decoding="async" class="${escapeAttr(cls)}"/>`;
}
