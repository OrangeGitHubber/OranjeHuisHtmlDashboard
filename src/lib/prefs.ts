import { signal } from '@preact/signals';

/**
 * Per-device display preferences (localStorage, like the connection config).
 */

const CALENDARS_KEY = 'oranjehuis.selectedCalendars.v1';

function loadSelectedCalendars(): string[] | null {
  try {
    const raw = localStorage.getItem(CALENDARS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

/** Calendar entity_ids shown on the Main screen; null = all calendars. */
export const selectedCalendars = signal<string[] | null>(loadSelectedCalendars());

export function setSelectedCalendars(ids: string[] | null): void {
  selectedCalendars.value = ids;
  if (ids === null) localStorage.removeItem(CALENDARS_KEY);
  else localStorage.setItem(CALENDARS_KEY, JSON.stringify(ids));
}
