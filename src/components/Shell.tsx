import { settings } from '../lib/settings';
import { currentRoute } from '../lib/router';
import { haBase } from '../lib/config';
import { minuteTick } from '../lib/clock';
import { useIdle } from '../lib/useIdle';
import { settingsLoader } from '../views/registry';
import { Nav } from './Nav';
import { StatusBanner } from './StatusBanner';
import { AsyncView } from './AsyncView';

const gridPageLoader = () => import('../grid/GridPage');

function backgroundUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  // HA-served paths (/local/…) go through the reverse proxy
  if (raw.startsWith('/')) return haBase() + raw;
  return raw;
}

export function Shell() {
  const route = currentRoute.value;
  const pages = settings.value.pages;

  let content;
  let bg: string | null = null;
  let glass = 50;
  if (route === 'settings') {
    content = <AsyncView key="settings" load={settingsLoader} />;
  } else {
    const page = pages.find((p) => p.id === route) ?? pages[0];
    bg = backgroundUrl(page.background);
    glass = page.backgroundGlass ?? 50;
    content = <AsyncView key={page.id} load={gridPageLoader} props={{ pageId: page.id }} />;
  }

  const s = settings.value;
  const d = new Date(minuteTick.value);
  const cur = d.getHours() * 60 + d.getMinutes();
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h % 24) * 60 + (m || 0);
  };
  const start = toMin(s.nightDimStart);
  const end = toMin(s.nightDimEnd);
  // window may wrap past midnight (22:00 → 07:00)
  const inWindow = start <= end ? cur >= start && cur < end : cur >= start || cur < end;
  // user activity lifts the dim; it returns after the configured idle time
  const idle = useIdle(s.nightDimResume * 60_000);
  const nightDim = s.nightDim && inWindow && idle;

  return (
    <div class="shell">
      {bg && (
        <div
          class="page-bg"
          style={{
            backgroundImage: `url(${bg})`,
            '--bg-blur': `${Math.round((glass / 100) * 28)}px`,
          }}
        />
      )}
      <StatusBanner />
      <Nav />
      <main class="shell-main">{content}</main>
      <button
        class="refresh-fab"
        onClick={() => location.reload()}
        aria-label="Refresh"
        title="Refresh"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
            fill="currentColor"
          />
        </svg>
      </button>
      {nightDim && (
        <div
          class="night-overlay"
          style={{ background: `rgba(0, 0, 0, ${s.nightDimAmount / 100})` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
