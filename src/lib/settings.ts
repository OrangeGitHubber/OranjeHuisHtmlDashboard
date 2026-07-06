import { signal } from '@preact/signals';
import { applyTheme } from './themes';

/**
 * All dashboard configuration in one versioned, exportable object.
 * Stored per device (localStorage) so the Docker image stays generic;
 * Export/Import in Settings copies a setup between devices/households.
 * The HA URL + token are deliberately NOT part of this (see config.ts).
 */

export interface WidgetInstance {
  id: string;
  type: string;
  enabled: boolean;
  options?: Record<string, unknown>;
}

export interface AppSettings {
  version: 1;
  title: string;
  subtitle: string;
  /** Main-screen widgets in render order */
  widgets: WidgetInstance[];
  /** Theme id from src/lib/themes.ts; unknown ids fall back to orange visually. */
  theme: string;
  weather: { entityId: string | null };
  presence: { personIds: string[] | null };
  calendars: { selected: string[] | null };
}

const KEY = 'oranjehuis.settings.v1';
const LEGACY_CALENDARS_KEY = 'oranjehuis.selectedCalendars.v1';

const DEFAULT_WIDGETS: WidgetInstance[] = [
  { id: 'calendar', type: 'calendar', enabled: true },
  { id: 'weather', type: 'weather', enabled: true },
  { id: 'presence', type: 'presence', enabled: true },
];

function defaults(): AppSettings {
  return {
    version: 1,
    title: 'My Home',
    subtitle: 'Smart Dashboard',
    widgets: DEFAULT_WIDGETS.map((w) => ({ ...w })),
    theme: 'orange',
    weather: { entityId: null },
    presence: { personIds: null },
    calendars: { selected: null },
  };
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

function normalizeWidgets(raw: unknown): WidgetInstance[] {
  const out: WidgetInstance[] = [];
  const seen = new Set<string>();
  if (Array.isArray(raw)) {
    for (const w of raw) {
      // keep entries with unknown types too — forward compatibility: configs
      // from newer builds must survive an export/import round trip here
      if (
        w &&
        typeof w === 'object' &&
        typeof (w as WidgetInstance).id === 'string' &&
        typeof (w as WidgetInstance).type === 'string' &&
        !seen.has((w as WidgetInstance).id)
      ) {
        const wi = w as WidgetInstance;
        seen.add(wi.id);
        out.push({
          id: wi.id,
          type: wi.type,
          enabled: !!wi.enabled,
          ...(wi.options && typeof wi.options === 'object' ? { options: wi.options } : {}),
        });
      }
    }
  }
  for (const def of DEFAULT_WIDGETS) {
    if (!seen.has(def.id)) out.push({ ...def });
  }
  return out;
}

/** Coerces arbitrary (imported) JSON into a valid AppSettings, preserving unknown keys. */
function normalize(raw: unknown): AppSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const base = defaults();
  return {
    ...r, // preserve unknown top-level keys from newer versions
    version: 1,
    title: typeof r.title === 'string' && r.title.trim() ? r.title : base.title,
    subtitle: typeof r.subtitle === 'string' ? r.subtitle : base.subtitle,
    widgets: normalizeWidgets(r.widgets),
    theme: typeof r.theme === 'string' && r.theme ? r.theme : base.theme,
    weather: {
      entityId:
        r.weather && typeof (r.weather as { entityId?: unknown }).entityId === 'string'
          ? ((r.weather as { entityId: string }).entityId)
          : null,
    },
    presence: {
      personIds: isStringArray((r.presence as { personIds?: unknown } | undefined)?.personIds)
        ? ((r.presence as { personIds: string[] }).personIds)
        : null,
    },
    calendars: {
      selected: isStringArray((r.calendars as { selected?: unknown } | undefined)?.selected)
        ? ((r.calendars as { selected: string[] }).selected)
        : null,
    },
  };
}

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      localStorage.removeItem(LEGACY_CALENDARS_KEY);
      return normalize(JSON.parse(raw));
    }
    const s = defaults();
    const legacy = localStorage.getItem(LEGACY_CALENDARS_KEY);
    if (legacy) {
      const ids = JSON.parse(legacy);
      if (isStringArray(ids)) s.calendars.selected = ids;
      localStorage.removeItem(LEGACY_CALENDARS_KEY);
      localStorage.setItem(KEY, JSON.stringify(s));
    }
    return s;
  } catch {
    return defaults();
  }
}

export const settings = signal<AppSettings>(load());

function persist(next: AppSettings): void {
  settings.value = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full/blocked — keep running with in-memory settings */
  }
}

export function updateSettings(patch: Partial<AppSettings>): void {
  persist({ ...settings.peek(), ...patch });
}

export function setSelectedCalendars(ids: string[] | null): void {
  updateSettings({ calendars: { selected: ids } });
}

export function setTheme(id: string): void {
  updateSettings({ theme: id });
}

export function toggleWidget(id: string): void {
  const s = settings.peek();
  updateSettings({
    widgets: s.widgets.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)),
  });
}

export function moveWidget(id: string, dir: -1 | 1): void {
  const widgets = [...settings.peek().widgets];
  const i = widgets.findIndex((w) => w.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= widgets.length) return;
  [widgets[i], widgets[j]] = [widgets[j], widgets[i]];
  updateSettings({ widgets });
}

export function exportSettings(): string {
  return JSON.stringify(settings.peek(), null, 2);
}

export function importSettings(json: string): { ok: true } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: 'That is not valid JSON.' };
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Expected a settings object.' };
  }
  const version = (raw as { version?: unknown }).version;
  if (typeof version !== 'number') {
    return { ok: false, error: 'Not an Oranjehuis settings file (missing version).' };
  }
  persist(normalize(raw));
  return { ok: true };
}

// keep the browser tab named after the household
settings.subscribe((s) => {
  document.title = s.subtitle ? `${s.title} — ${s.subtitle}` : s.title;
});

settings.subscribe((s) => {
  applyTheme(s.theme);
});
