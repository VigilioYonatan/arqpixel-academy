import { s } from '../../shared/schemas/schema-validator.js';
import { CINEMA_AURA_THEMES, CINEMA_SPEAKER_ROLES } from '../constants/cinema.constants.js';
export const speakerRoleSchema = s.enum(CINEMA_SPEAKER_ROLES);
export const cinemaAuraSchema = s.enum(CINEMA_AURA_THEMES);
export const studioAudioMetaSchema = s
    .object({
    src: s.string({
        min: 10,
        max: 120,
        pattern: /^\.\/audio\/[a-z0-9-]+\.mp3$/,
    }),
    totalSec: s.number({ min: 3, max: 300 }),
    cues: s.array(s.number({ min: 0, max: 300 }), { min: 1, max: 12 }),
    speakers: s.array(speakerRoleSchema, { min: 1, max: 12 }).optional(),
}, { strict: true })
    .refine((meta) => meta.speakers === undefined || meta.speakers.length === meta.cues.length, 'speakers[] debe tener la misma longitud que cues[]')
    .refine((meta) => meta.cues.every((cue, idx) => cue < meta.totalSec && (idx === 0 || cue > meta.cues[idx - 1])), 'cues[] debe ser estrictamente creciente y menor que totalSec');
export const audioManifestCatalogSchema = s.record(s.string({ min: 3, max: 40, pattern: /^[A-Z0-9-]+$/ }), studioAudioMetaSchema, { maxKeys: 120 });
