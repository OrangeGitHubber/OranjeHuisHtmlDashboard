import { currentRoute, navigate } from '../lib/router';
import { settings, setNavWidth } from '../lib/settings';
import { currentProfileName } from '../lib/profiles';
import { iconPath, GEAR_ICON } from '../lib/icons';

const REFRESH_ICON =
  'M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z';

function NavButton({
  id,
  title,
  icon,
  active,
}: {
  id: string;
  title: string;
  icon: string;
  active: boolean;
}) {
  return (
    <button
      class={`nav-item${active ? ' active' : ''}`}
      onClick={() => navigate(id)}
      aria-current={active ? 'page' : undefined}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={icon} />
      </svg>
      {title}
    </button>
  );
}

/**
 * Drag the sidebar's right edge to resize it. During the drag we set
 * --nav-width live on <html> (smooth; the grid re-measures via its
 * ResizeObserver and rescales proportionally), then persist on release.
 */
function startNavResize(e: PointerEvent) {
  e.preventDefault();
  const clamp = (x: number) => Math.min(Math.max(x, 60), 320);
  const handle = e.currentTarget as HTMLElement;
  handle.classList.add('dragging');
  const move = (ev: PointerEvent) => {
    document.documentElement.style.setProperty('--nav-width', `${clamp(ev.clientX)}px`);
  };
  const up = (ev: PointerEvent) => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    handle.classList.remove('dragging');
    setNavWidth(clamp(ev.clientX));
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

export function Nav() {
  const s = settings.value;
  const route = currentRoute.value;
  // unknown routes render the first page (see Shell) — highlight it too
  const activeId =
    route === 'settings' || s.pages.some((p) => p.id === route) ? route : s.pages[0]?.id;

  return (
    <nav class="nav" aria-label="Main">
      <div
        class="nav-resize"
        onPointerDown={startNavResize}
        role="separator"
        aria-label="Resize sidebar"
        title="Drag to resize"
      />
      <div class="nav-brand" aria-hidden="true">
        <span class="nav-brand-title">{s.title}</span>
        {s.subtitle && <span class="nav-brand-sub">{s.subtitle}</span>}
      </div>
      {s.pages
        .filter((p) => !p.hidden)
        .map((p) => (
          <NavButton
            key={p.id}
            id={p.id}
            title={p.title}
            icon={iconPath(p.icon)}
            active={activeId === p.id}
          />
        ))}
      <div class="nav-bottom">
        <div class="nav-extra">
          <span class="nav-screen" title="Current dashboard">
            {currentProfileName()}
          </span>
          {s.showRefresh && (
            <button
              class="nav-refresh"
              onClick={() => location.reload()}
              aria-label="Refresh"
              title="Refresh"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d={REFRESH_ICON} fill="currentColor" />
              </svg>
            </button>
          )}
        </div>
        <NavButton id="settings" title="Settings" icon={GEAR_ICON} active={route === 'settings'} />
      </div>
    </nav>
  );
}
