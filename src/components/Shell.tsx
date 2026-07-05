import { views } from '../views/registry';
import { currentViewId } from '../lib/router';
import { Nav } from './Nav';
import { StatusBanner } from './StatusBanner';
import { AsyncView } from './AsyncView';

export function Shell() {
  const view = views.find((v) => v.id === currentViewId.value) ?? views[0];
  return (
    <div class="shell">
      <StatusBanner />
      <Nav />
      <main class="shell-main">
        <AsyncView key={view.id} load={view.load} />
      </main>
    </div>
  );
}
