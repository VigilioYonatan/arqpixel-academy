import { type ProgressRecord, sanitizeProgress } from '../../engine.js';
import {
  emptyMiniProgress,
  MINI_STORAGE_KEY,
  type MiniProgress,
  sanitizeMiniProgress,
} from '../../mini-games.js';
import { type SeniorDraft, sanitizeSeniorDraft } from '../../senior-suite.js';
import { SETTINGS_STORAGE_KEY } from '../profile/constants/profile.constants.js';
import {
  defaultUserSettings,
  sanitizeUserSettings,
  type UserSettingsSchema,
} from '../profile/schemas/settings.schema.js';
import { PROJECTS_STORAGE_KEY } from '../projects/constants/projects.constants.js';
import {
  type ProjectsStateMap,
  sanitizeProjectsState,
} from '../projects/schemas/projects.schema.js';
import { backupEnvelopeSchema } from '../senior/schemas/senior.schema.js';
import { PROGRESS_STORAGE_KEY } from './constants/app.constants.js';
import { isSafePlainObject } from './schemas/schema-validator.js';

const LEGACY_V12_KEYS = new Set([
  'done',
  'answers',
  'missions',
  'notes',
  'xp',
  'theme',
  'seniorMode',
  'lastVisit',
]);

export type DetectedBackupEra = 'v1.2-raw' | 'v1.x-envelope' | 'v2.0-envelope';

export type MigratedBackupBundle = {
  readonly detectedEra: DetectedBackupEra;
  readonly schemaVersion: 1 | 2;
  readonly progress: ProgressRecord;
  readonly seniorSuites: ReadonlyArray<readonly [string, SeniorDraft]>;
  readonly miniGames: MiniProgress;
  readonly projects: ProjectsStateMap | null;
  readonly settings: UserSettingsSchema;
};

export type BackupMigrationContext = {
  readonly moduleIds: readonly string[];
  readonly missionIds: readonly string[];
  readonly miniGameIds: readonly string[];
  readonly existingProjects?: ProjectsStateMap;
  readonly existingSettings?: UserSettingsSchema;
};

function isLegacyV12RawProgress(input: unknown): input is Record<string, unknown> {
  if (!isSafePlainObject(input)) return false;
  if ('app' in input || 'version' in input) return false;
  if (!Array.isArray(input.done)) return false;
  const keys = Object.keys(input);
  return keys.length >= 4 && keys.every((k) => LEGACY_V12_KEYS.has(k));
}

/**
 * Pure multi-version backup parser & migrator (`v1.2`, `v1.3`, `v1.5`, `v1.6`, `v1.7`, `v2.0`).
 * Validates everything in memory before any storage write; recalculates XP idempotently.
 */
export function parseAndMigrateBackup(
  raw_input: unknown,
  context: BackupMigrationContext,
): MigratedBackupBundle {
  const mod_ids = [...context.moduleIds];
  const mis_ids = [...context.missionIds];
  const game_ids = [...context.miniGameIds];
  const allowed_missions = new Set(mis_ids);

  // Case A: Historical v1.2 raw progress export (pre-envelope)
  if (isLegacyV12RawProgress(raw_input)) {
    const progress = sanitizeProgress(raw_input, mod_ids, mis_ids);
    if (!progress) {
      throw new Error('Datos de progreso v1.2 inválidos');
    }
    const base_settings = context.existingSettings
      ? { ...context.existingSettings, themeMode: progress.theme }
      : defaultUserSettings(progress.theme);

    return {
      detectedEra: 'v1.2-raw',
      schemaVersion: 1,
      progress,
      seniorSuites: [],
      miniGames: emptyMiniProgress(),
      projects: context.existingProjects ?? null,
      settings: base_settings,
    };
  }

  // Case B: Versioned envelope (v1.3 / v1.5 / v1.6 / v1.7 -> version 1; v2.0 -> version 2)
  const envelope = backupEnvelopeSchema.parse(raw_input, 'backup.json');
  const progress = sanitizeProgress(envelope.progress, mod_ids, mis_ids);
  if (!progress) {
    throw new Error('Datos de progreso inválidos');
  }

  const mini =
    envelope.miniGames === undefined
      ? emptyMiniProgress()
      : sanitizeMiniProgress(envelope.miniGames, game_ids);
  if (!mini) {
    throw new Error('Datos de minijuegos inválidos');
  }

  let projects: ProjectsStateMap | null = context.existingProjects ?? null;
  if (envelope.projects !== undefined) {
    const sanitized_projects = sanitizeProjectsState(envelope.projects);
    if (!sanitized_projects) {
      throw new Error('Proyectos Capstone inválidos en respaldo');
    }
    projects = sanitized_projects;
  }

  const settings =
    envelope.settings !== undefined
      ? sanitizeUserSettings(envelope.settings, progress.theme)
      : context.existingSettings
        ? { ...context.existingSettings, themeMode: progress.theme }
        : defaultUserSettings(progress.theme);

  const validated_suites: Array<readonly [string, SeniorDraft]> = [];
  if (envelope.seniorSuites !== undefined) {
    const suite_entries = Object.entries(envelope.seniorSuites);
    if (suite_entries.length > 1_800) {
      throw new Error('Demasiados borradores Senior en el respaldo');
    }
    for (const [suite_key, raw_draft] of suite_entries) {
      const match = /^(S\d{2})-(\d{1,7})$/.exec(suite_key);
      if (!match || !allowed_missions.has(match[1]) || Number(match[2]) > 1_000_000) {
        throw new Error(`Identificador de taller Senior inválido: ${suite_key}`);
      }
      const clean_draft = sanitizeSeniorDraft(raw_draft);
      if (!clean_draft) {
        throw new Error(`Borrador Senior corrupto en ${suite_key}`);
      }
      validated_suites.push([`arqpixel-senior-suite-v2-${suite_key}`, clean_draft]);
    }
  }

  const version_num = envelope.version === 2 ? 2 : 1;
  return {
    detectedEra: version_num === 2 ? 'v2.0-envelope' : 'v1.x-envelope',
    schemaVersion: version_num,
    progress,
    seniorSuites: validated_suites,
    miniGames: mini,
    projects,
    settings,
  };
}

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

/**
 * Applies a pre-validated `MigratedBackupBundle` to `storage` without touching unrelated keys
 * or deleting pre-existing `(missionId, seed)` Senior Suite drafts outside the bundle.
 */
export function applyMigratedBackupToStorage(
  storage: StorageLike,
  bundle: MigratedBackupBundle,
): { readonly restoredSuitesCount: number; readonly xpAfterRestore: number } {
  storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(bundle.progress));
  storage.setItem(MINI_STORAGE_KEY, JSON.stringify(bundle.miniGames));
  storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(bundle.settings));
  if (bundle.projects !== null) {
    storage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(bundle.projects));
  }
  for (const [storage_key, draft] of bundle.seniorSuites) {
    storage.setItem(storage_key, JSON.stringify(draft));
  }

  return {
    restoredSuitesCount: bundle.seniorSuites.length,
    xpAfterRestore: bundle.progress.xp,
  };
}
