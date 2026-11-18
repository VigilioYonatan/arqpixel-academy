/**
 * Senior UX resilience, corrupted-storage quarantine, offline telemetry, first-visit onboarding,
 * last-visited activity pointer, ADR lab draft persistence, modal focus trap & keyboard shortcuts dialog.
 * Strictly zero inline styles (`style-src 'self'`) and zero external dependencies (`ADR-0001`, `ADR-0005`).
 */
import {
  ADR_LAB_DRAFT_STORAGE_KEY,
  CORRUPT_BACKUP_STORAGE_KEY,
  LAST_VISITED_STORAGE_KEY,
  ONBOARDING_DISMISSED_STORAGE_KEY,
  PROGRESS_STORAGE_KEY,
} from '../constants/app.constants.js';

const esc = (value: unknown): string =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch),
  );

export type CorruptStorageSnapshot = {
  readonly detectedAt: string;
  readonly affectedKeys: readonly string[];
  readonly rawEntries: Readonly<Record<string, string>>;
};

export type LastVisitedPointer = {
  readonly href: string;
  readonly category: string;
  readonly title: string;
  readonly updatedAt: string;
};

export type AdrLabDraft = {
  readonly optionId: 'modular-monolith' | 'event-microservices' | 'managed-serverless';
  readonly title: string;
  readonly context: string;
  readonly decision: string;
  readonly tradeoff: string;
};

const WATCHED_OBJECT_KEYS: ReadonlyArray<{
  readonly key: string;
  readonly validate: (parsed: unknown) => boolean;
}> = Object.freeze([
  {
    key: PROGRESS_STORAGE_KEY,
    validate: (p) =>
      Boolean(p && typeof p === 'object' && !Array.isArray(p) && Array.isArray((p as { done?: unknown }).done)),
  },
  {
    key: 'arqpixel-projects-v1',
    validate: (p) => Boolean(p && typeof p === 'object' && !Array.isArray(p)),
  },
  {
    key: 'arqpixel-minigames-v1',
    validate: (p) => Boolean(p && typeof p === 'object' && !Array.isArray(p)),
  },
  {
    key: 'arqpixel-settings-v1',
    validate: (p) =>
      Boolean(
        p &&
          typeof p === 'object' &&
          !Array.isArray(p) &&
          typeof (p as { themeMode?: unknown }).themeMode === 'string',
      ),
  },
]);

/**
 * Inspects persisted ARQPIXEL keys BEFORE boot overwrites anything.
 * If non-empty data is malformed JSON or fails structural validation, quarantines the raw strings
 * in `arqpixel-corrupt-backup-v1` so the learner can download a raw rescue file (`§3.4`, `§10.2`, `§18.1`).
 */
export function inspectAndQuarantineCorruptedStorage(
  storage: Pick<Storage, 'getItem' | 'setItem' | 'key' | 'length'> = localStorage,
): CorruptStorageSnapshot | null {
  try {
    const raw_entries: Record<string, string> = {};
    const affected_keys: string[] = [];

    for (const spec of WATCHED_OBJECT_KEYS) {
      const raw = storage.getItem(spec.key);
      if (!raw || raw.trim() === '' || raw.trim() === 'null') continue;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (!spec.validate(parsed)) {
          affected_keys.push(spec.key);
          raw_entries[spec.key] = raw;
        }
      } catch {
        affected_keys.push(spec.key);
        raw_entries[spec.key] = raw;
      }
    }

    for (let idx = 0; idx < storage.length; idx++) {
      const key_name = storage.key(idx) || '';
      if (!/^arqpixel-senior-suite-v2-S\d{2}-\d{1,7}$/.test(key_name)) continue;
      const raw = storage.getItem(key_name);
      if (!raw) continue;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          affected_keys.push(key_name);
          raw_entries[key_name] = raw;
        }
      } catch {
        affected_keys.push(key_name);
        raw_entries[key_name] = raw;
      }
    }

    if (affected_keys.length > 0) {
      const snapshot: CorruptStorageSnapshot = {
        detectedAt: new Date().toISOString(),
        affectedKeys: affected_keys,
        rawEntries: raw_entries,
      };
      try {
        storage.setItem(CORRUPT_BACKUP_STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        /* ignore quota while returning in-memory snapshot */
      }
      return snapshot;
    }

    return readCorruptBackupSnapshot(storage);
  } catch {
    return null;
  }
}

export function readCorruptBackupSnapshot(
  storage: Pick<Storage, 'getItem'> = localStorage,
): CorruptStorageSnapshot | null {
  try {
    const raw = storage.getItem(CORRUPT_BACKUP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CorruptStorageSnapshot>;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray(parsed.affectedKeys) ||
      parsed.affectedKeys.length === 0 ||
      !parsed.rawEntries ||
      typeof parsed.rawEntries !== 'object'
    ) {
      return null;
    }
    return {
      detectedAt: typeof parsed.detectedAt === 'string' ? parsed.detectedAt : new Date(0).toISOString(),
      affectedKeys: parsed.affectedKeys.filter((k): k is string => typeof k === 'string'),
      rawEntries: parsed.rawEntries as Record<string, string>,
    };
  } catch {
    return null;
  }
}

export function dismissCorruptBackupSnapshot(
  storage: Pick<Storage, 'removeItem'> = localStorage,
): void {
  try {
    storage.removeItem(CORRUPT_BACKUP_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function renderSystemResilienceBannersHtml(options: {
  readonly isOffline: boolean;
  readonly storageWriteError: string | null;
  readonly corruptSnapshot: CorruptStorageSnapshot | null;
}): string {
  const blocks: string[] = [];

  if (options.isOffline) {
    blocks.push(`<div class="sys-banner sys-banner-offline" role="status" aria-live="polite" data-offline-banner="true">
      <div>
        <strong>⚡ Modo sin conexión activo</strong>
        <span>ARQPIXEL opera 100 % local en tu navegador; lecciones, simuladores, mundos 3D y borradores siguen disponibles.</span>
      </div>
    </div>`);
  }

  if (options.storageWriteError) {
    blocks.push(`<div class="sys-banner sys-banner-warn" role="alert" data-storage-error-banner="true">
      <div>
        <strong>⚠ No se pudo guardar en localStorage</strong>
        <span>${esc(options.storageWriteError)} Descarga un respaldo JSON para proteger tu sesión actual.</span>
      </div>
      <div class="inline-actions m-0">
        <button type="button" class="btn primary small" id="banner-export-rescue-json">Exportar respaldo JSON</button>
        <button type="button" class="btn secondary small" id="banner-dismiss-storage-err">Ocultar aviso</button>
      </div>
    </div>`);
  }

  if (options.corruptSnapshot && options.corruptSnapshot.affectedKeys.length > 0) {
    const keys_list = options.corruptSnapshot.affectedKeys.slice(0, 3).join(', ');
    blocks.push(`<div class="sys-banner sys-banner-warn" role="alert" data-corrupt-storage-banner="true">
      <div>
        <strong>🛡 Datos locales dañados puestos en cuarentena (${options.corruptSnapshot.affectedKeys.length} clave/s: ${esc(keys_list)})</strong>
        <span>Se aisló una copia íntegra antes de iniciar con valores seguros para evitar pérdida silenciosa de trabajo.</span>
      </div>
      <div class="inline-actions m-0">
        <button type="button" class="btn primary small" id="banner-download-corrupt-raw">Descargar respaldo crudo (.json)</button>
        <button type="button" class="btn secondary small" id="banner-dismiss-corrupt-raw">Continuar y descartar aviso</button>
      </div>
    </div>`);
  }

  return blocks.length > 0 ? `<div class="sys-banners-stack">${blocks.join('')}</div>` : '';
}

export function readOnboardingDismissed(
  storage: Pick<Storage, 'getItem'> = localStorage,
): boolean {
  try {
    return storage.getItem(ONBOARDING_DISMISSED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setOnboardingDismissed(
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  try {
    storage.setItem(ONBOARDING_DISMISSED_STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

const SAFE_LAST_HREF_RE =
  /^#\/(?:aprender|modulo|taller-senior|mision|laboratorio|proyectos|minijuego|rutas|especializaciones)\/[A-Za-z0-9_-]+(?:\?seed=\d{1,7}|\?senior=1)?$/;

export function recordLastVisitedRoute(
  pointer: Omit<LastVisitedPointer, 'updatedAt'>,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  if (!SAFE_LAST_HREF_RE.test(pointer.href)) return;
  try {
    const payload: LastVisitedPointer = {
      href: pointer.href,
      category: pointer.category.slice(0, 40),
      title: pointer.title.slice(0, 110),
      updatedAt: new Date().toISOString(),
    };
    storage.setItem(LAST_VISITED_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function readLastVisitedRoute(
  storage: Pick<Storage, 'getItem'> = localStorage,
): LastVisitedPointer | null {
  try {
    const raw = storage.getItem(LAST_VISITED_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastVisitedPointer>;
    if (
      !parsed ||
      typeof parsed.href !== 'string' ||
      !SAFE_LAST_HREF_RE.test(parsed.href) ||
      typeof parsed.title !== 'string' ||
      typeof parsed.category !== 'string'
    ) {
      return null;
    }
    return {
      href: parsed.href,
      category: parsed.category,
      title: parsed.title,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return null;
  }
}

export function renderFirstVisitOnboardingHtml(): string {
  return `<section class="onboarding-card" aria-label="Selector rápido de punto de partida según tu perfil" data-onboarding-card="true">
    <div class="onboarding-head">
      <div>
        <span class="eyebrow">✦ BIENVENIDA · ELIGE TU PUNTO DE PARTIDA</span>
        <h2>¿Cuál es tu objetivo actual en Arquitectura de Software?</h2>
        <p class="muted m-0">Selecciona el recorrido recomendado para tu experiencia o explora libremente los 54 nodos sin bloqueos.</p>
      </div>
      <button type="button" class="btn secondary small" id="dismiss-onboarding-card" aria-label="Ocultar guía inicial">Explorar libremente ×</button>
    </div>
    <div class="onboarding-grid">
      <a class="onboarding-option" href="#/aprender/B01" data-onboarding-pick="B01">
        <span class="overline">01 · PRINCIPIANTE / JUNIOR</span>
        <strong>Fundamentos desde cero</strong>
        <small>Empieza en B01: atributos de calidad, cohesión, C4 y contratos HTTP.</small>
      </a>
      <a class="onboarding-option" href="#/aprender/I06" data-onboarding-pick="I06">
        <span class="overline">02 · BACKEND / INTERMEDIO</span>
        <strong>DDD, Clean y Hexagonal</strong>
        <small>Aísla reglas de negocio con puertos, adaptadores y código ✅/❌.</small>
      </a>
      <a class="onboarding-option" href="#/aprender/A05" data-onboarding-pick="A05">
        <span class="overline">03 · SISTEMAS DISTRIBUIDOS</span>
        <strong>Outbox, Sagas y Resiliencia</strong>
        <small>Domina consistencia eventual, idempotencia y fallos parciales.</small>
      </a>
      <a class="onboarding-option onboarding-senior" href="#/taller-senior/S09?seed=42" data-onboarding-pick="S09">
        <span class="overline">04 · ARQUITECTO SENIOR / STAFF</span>
        <strong>Senior Production Lab</strong>
        <small>Defiende decisiones bajo presión real con semillas reproducibles.</small>
      </a>
    </div>
  </section>`;
}

export function renderResumeLastActivityBarHtml(last_visited: LastVisitedPointer | null): string {
  if (!last_visited) return '';
  return `<div class="resume-activity-bar" role="region" aria-label="Continuar última actividad" data-resume-last-activity="true">
    <div class="resume-activity-copy">
      <span class="map-badge">↺ ÚLTIMA ACTIVIDAD</span>
      <span><strong>${esc(last_visited.category)}:</strong> ${esc(last_visited.title)}</span>
    </div>
    <a class="btn secondary small" href="${esc(last_visited.href)}">Retomar sesión ↗</a>
  </div>`;
}

export function readAdrLabDraft(
  storage: Pick<Storage, 'getItem'> = localStorage,
): AdrLabDraft | null {
  try {
    const raw = storage.getItem(ADR_LAB_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AdrLabDraft>;
    if (!parsed || typeof parsed !== 'object') return null;
    const valid_opt =
      parsed.optionId === 'event-microservices' || parsed.optionId === 'managed-serverless'
        ? parsed.optionId
        : 'modular-monolith';
    if (
      typeof parsed.title !== 'string' ||
      typeof parsed.context !== 'string' ||
      typeof parsed.decision !== 'string' ||
      typeof parsed.tradeoff !== 'string'
    ) {
      return null;
    }
    return {
      optionId: valid_opt,
      title: parsed.title.slice(0, 300),
      context: parsed.context.slice(0, 6_000),
      decision: parsed.decision.slice(0, 6_000),
      tradeoff: parsed.tradeoff.slice(0, 6_000),
    };
  } catch {
    return null;
  }
}

export function saveAdrLabDraft(
  draft: AdrLabDraft,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  try {
    storage.setItem(ADR_LAB_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

/**
 * Traps `Tab` and `Shift+Tab` inside an open modal dialog (`WCAG 2.2 AA` 2.1.2 / 2.4.3).
 */
export function trapDialogTabFocus(event: KeyboardEvent, dialog: HTMLElement | null): void {
  if (event.key !== 'Tab' || !dialog) return;
  const focusable = Array.from(
    dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('hidden'));
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement as HTMLElement | null;

  if (event.shiftKey) {
    if (!active || active === first || !dialog.contains(active)) {
      event.preventDefault();
      last.focus();
    }
  } else if (!active || active === last || !dialog.contains(active)) {
    event.preventDefault();
    first.focus();
  }
}

export function renderKeyboardShortcutsModalHtml(is_open: boolean): string {
  if (!is_open) return '';
  return `<div class="search-cmd-backdrop" id="shortcuts-modal-backdrop" role="presentation" data-shortcuts-modal="true">
    <div class="search-cmd-dialog shortcuts-dialog" id="shortcuts-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="shortcuts-modal-title">
      <div class="search-cmd-header">
        <div class="search-cmd-label">
          <span id="shortcuts-modal-title">⌨ Atajos de teclado y accesibilidad</span>
          <small>Navegación completa sin ratón en todas las vistas de ARQPIXEL Academy</small>
        </div>
        <button type="button" class="btn secondary small" id="shortcuts-modal-close" aria-label="Cerrar ventana de atajos">Esc · Cerrar</button>
      </div>
      <div class="shortcuts-grid">
        <div class="shortcut-row"><kbd>Ctrl + K</kbd><span>Abrir o cerrar el buscador global de 54 nodos, laboratorios y patrones</span></div>
        <div class="shortcut-row"><kbd>?</kbd><span>Mostrar esta guía rápida de atajos de teclado (fuera de campos de texto)</span></div>
        <div class="shortcut-row"><kbd>Esc</kbd><span>Cerrar modales activos o replegar el menú lateral móvil</span></div>
        <div class="shortcut-row"><kbd>← ↑ ↓ →</kbd><span>Recorrer nodos en el Mapa Curricular DAG y resultados del buscador</span></div>
        <div class="shortcut-row"><kbd>1 – 4</kbd><span>Seleccionar decisiones arquitectónicas [A–D] en los 5 Minijuegos 3D</span></div>
        <div class="shortcut-row"><kbd>Tab / Shift+Tab</kbd><span>Saltar al contenido principal y recorrer controles con foco visible</span></div>
      </div>
    </div>
  </div>`;
}
