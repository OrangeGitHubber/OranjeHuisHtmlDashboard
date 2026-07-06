import { settings } from '../lib/settings';
import { currentRoute } from '../lib/router';
import { loadConfig } from '../lib/config';
import { camerasLoader, settingsLoader } from '../views/registry';
import { Nav } from './Nav';
import { StatusBanner } from './StatusBanner';
import { AsyncView } from './AsyncView';

const gridPageLoader = () => import('../grid/GridPage');

function backgroundUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith('/')) {
    const cfg = loadConfig();
    return cfg ? cfg.hassUrl + raw : null;
  }
  return raw;
}

export function Shell() {
  const route = currentRoute.value;
  const pages = settings.value.pages;

  let content;
  let bg: string | null = null;
  if (route === 'settings') {
    content = <AsyncView key="settings" load={settingsLoader} />;
  } else {
    const page = pages.find((p) => p.id === route) ?? pages[0];
    bg = backgroundUrl(page.background);
    content =
      page.kind === 'cameras' ? (
        <AsyncView key={page.id} load={camerasLoader} />
      ) : (
        <AsyncView key={page.id} load={gridPageLoader} props={{ pageId: page.id }} />
      );
  }

  return (
    <div class="shell">
      {bg && <div class="page-bg" style={{ backgroundImage: `url(${bg})` }} />}
      <StatusBanner />
      <Nav />
      <main class="shell-main">{content}</main>
    </div>
  );
}
