import { signal } from '@preact/signals';
import { views } from '../views/registry';

function viewFromHash(): string {
  const id = location.hash.replace(/^#\/?/, '');
  return views.some((v) => v.id === id) ? id : views[0].id;
}

export const currentViewId = signal<string>(viewFromHash());

export function navigate(id: string): void {
  location.hash = `#/${id}`;
}

window.addEventListener('hashchange', () => {
  currentViewId.value = viewFromHash();
});
