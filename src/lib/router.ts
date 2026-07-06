import { signal } from '@preact/signals';

/**
 * Hash routing over settings-defined page ids. The raw hash is exposed as-is;
 * Shell resolves it against settings.pages (falling back to the first page),
 * so this module needs no knowledge of which pages exist.
 */

function routeFromHash(): string {
  return location.hash.replace(/^#\/?/, '');
}

export const currentRoute = signal<string>(routeFromHash());

export function navigate(id: string): void {
  location.hash = `#/${id}`;
}

window.addEventListener('hashchange', () => {
  currentRoute.value = routeFromHash();
});
