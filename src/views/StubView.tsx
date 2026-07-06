import type { FunctionComponent } from 'preact';
import { EmptyState } from '../components/EmptyState';

/** Placeholder for views that are planned but not built yet. */
export function makeStub(title: string): FunctionComponent {
  return function StubView() {
    return (
      <div>
        <h1 class="view-title">{title}</h1>
        <EmptyState message={`${title} is coming soon.`} />
      </div>
    );
  };
}
