import { type InferSchema, s } from '../../shared/schemas/schema-validator.js';
import { FONT_SCALES, THEME_MODES } from '../constants/profile.constants.js';

export const userSettingsSchema = s.object(
  {
    themeMode: s.enum(THEME_MODES),
    reducedMotion: s.boolean(),
    fontScale: s.enum(FONT_SCALES),
    classroomSidebarOpen: s.boolean(),
  },
  { strict: true },
);

export type UserSettingsSchema = InferSchema<typeof userSettingsSchema>;

export function defaultUserSettings(fallback_theme: 'dark' | 'light' = 'dark'): UserSettingsSchema {
  return {
    themeMode: fallback_theme,
    reducedMotion: false,
    fontScale: 'normal',
    classroomSidebarOpen: false,
  };
}

export function sanitizeUserSettings(
  raw: unknown,
  fallback_theme: 'dark' | 'light' = 'dark',
): UserSettingsSchema {
  const parsed = userSettingsSchema.safeParse(raw, 'settings');
  return parsed.success ? parsed.data : defaultUserSettings(fallback_theme);
}
