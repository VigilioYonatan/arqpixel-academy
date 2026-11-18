/**
 * Boundary schema validators and inferred domain types for Interactive Cinema & Studio Audio (`ADR-0002`, `ADR-0007`).
 */
import type { ArquiBotSpriteId } from '../../shared/schemas/assets-manifest.schema.js';
import { type InferSchema, s } from '../../shared/schemas/schema-validator.js';
import { CINEMA_AURA_THEMES, CINEMA_SPEAKER_ROLES } from '../constants/cinema.constants.js';

export const speakerRoleSchema = s.enum(CINEMA_SPEAKER_ROLES);
export type CinemaSpeakerRole = InferSchema<typeof speakerRoleSchema>;

export const cinemaAuraSchema = s.enum(CINEMA_AURA_THEMES);
export type CinemaAuraTheme = InferSchema<typeof cinemaAuraSchema>;

export const studioAudioMetaSchema = s
  .object(
    {
      src: s.string({
        min: 10,
        max: 120,
        pattern: /^\.\/audio\/[a-z0-9-]+\.mp3$/,
      }),
      totalSec: s.number({ min: 3, max: 300 }),
      cues: s.array(s.number({ min: 0, max: 300 }), { min: 1, max: 12 }),
      speakers: s.array(speakerRoleSchema, { min: 1, max: 12 }).optional(),
    },
    { strict: true },
  )
  .refine(
    (meta) => meta.speakers === undefined || meta.speakers.length === meta.cues.length,
    'speakers[] debe tener la misma longitud que cues[]',
  )
  .refine(
    (meta) => meta.cues.every((cue, idx) => cue < meta.totalSec && (idx === 0 || cue > meta.cues[idx - 1]!)),
    'cues[] debe ser estrictamente creciente y menor que totalSec',
  );

export type StudioAudioMetaSchema = InferSchema<typeof studioAudioMetaSchema>;

export const audioManifestCatalogSchema = s.record(
  s.string({ min: 3, max: 40, pattern: /^[A-Z0-9-]+$/ }),
  studioAudioMetaSchema,
  { maxKeys: 120 },
);

export type AudioManifestCatalogSchema = InferSchema<typeof audioManifestCatalogSchema>;

export type StageVisual =
  | {
      readonly kind: 'c4-topology';
      readonly mode: 'incident' | 'mitigated';
      readonly nodes: ReadonlyArray<{
        readonly label: string;
        readonly sub: string;
        readonly state?: 'normal' | 'hot' | 'ok';
      }>;
      readonly metricLabel: string;
      readonly metricBefore: string;
      readonly metricAfter: string;
    }
  | {
      readonly kind: 'dependency-rings';
      readonly mode: 'violation' | 'clean';
      readonly outerLayer: string;
      readonly coreItems: ReadonlyArray<{
        readonly name: string;
        readonly rule: string;
        readonly state: 'ok' | 'port' | 'leak';
      }>;
      readonly infraTitle: string;
      readonly infraNote: string;
      readonly badgeLabel: string;
    }
  | {
      readonly kind: 'event-lanes';
      readonly mode: 'unsafe' | 'resilient';
      readonly statusBadge: string;
      readonly laneA: { readonly name: string; readonly steps: readonly string[] };
      readonly laneB: { readonly name: string; readonly steps: readonly string[] };
    }
  | {
      readonly kind: 'arch-code-diff';
      readonly file: string;
      readonly before: readonly string[];
      readonly after: readonly string[];
      readonly callout: string;
    }
  | {
      readonly kind: 'adr-radar';
      readonly title: string;
      readonly lines: ReadonlyArray<{
        readonly prompt?: string;
        readonly text: string;
        readonly tone?: 'cmd' | 'ok' | 'warn' | 'muted';
      }>;
    };

export type CinemaScene = {
  readonly chapter: string;
  readonly title: string;
  readonly durationSec: number;
  readonly spriteId: ArquiBotSpriteId;
  readonly aura: CinemaAuraTheme;
  readonly speaker: CinemaSpeakerRole;
  readonly speech: string;
  readonly visual: StageVisual;
};

export type CinemaDeck = {
  readonly id: string;
  readonly kicker: string;
  readonly heading: string;
  readonly ctaLabel?: string;
  readonly ctaHref?: string;
  readonly ctaScrollTarget?: string;
  readonly audio?: StudioAudioMetaSchema;
  readonly scenes: readonly CinemaScene[];
};
