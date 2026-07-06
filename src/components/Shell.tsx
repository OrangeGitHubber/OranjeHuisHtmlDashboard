import { settings } from '../lib/settings';
import { currentRoute } from '../lib/router';
import { camerasLoader, settingsLoader } from '../views/registry';
import { Nav } from './Nav';
import { StatusBanner } from './StatusBanner';
import { AsyncView } from './AsyncView';

const gridPageLoader = () => import('../grid/GridPage');

export function Shell() {
  const route = currentRoute.value;
  const pages = settings.value.pages;

  let content;
  if (route === 'settings') {
    content = <AsyncView key="settings" load={settingsLoader} />;
  } else {
    const page = pages.find((p) => p.id === route) ?? pages[0];
    content =
      page.kind === 'cameras' ? (
        <AsyncView key={page.id} load={camerasLoader} />
      ) : (
        <AsyncView key={page.id} load={gridPageLoader} props={{ pageId: page.id }} />
      );
  }

  return (
    <div class="shell">
      <StatusBanner />
      <Nav />
      <main class="shell-main">{content}</main>
    </div>
  );
}
