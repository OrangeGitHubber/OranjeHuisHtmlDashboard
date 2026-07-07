import { signal } from '@preact/signals';
import { settings } from './settings';

/** true once the server reports a different build than the one we loaded */
export const updateAvailable = signal(false);

const POLL_MS = 5 * 60_000;
let loaded: string | null = null;

async function fetchVersion(): Promise<string | null> {
  try {
    const res = await fetch('/version', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: unknown };
    return typeof data.version === 'string' ? data.version : null;
  } catch {
    return null;
  }
}

/**
 * Remember the build we booted on, then poll for a newer one. When a new image
 * is deployed the hash changes and StatusBanner prompts a refresh (gated by the
 * checkUpdates setting so a display can opt out).
 */
export function startVersionWatch(): void {
  fetchVersion().then((v) => {
    loaded = v;
  });
  setInterval(async () => {
    if (!settings.peek().checkUpdates || updateAvailable.value) return;
    const v = await fetchVersion();
    if (v && loaded && v !== loaded) updateAvailable.value = true;
  }, POLL_MS);
}
