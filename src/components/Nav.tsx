import { currentRoute, navigate } from '../lib/router';
import { settings } from '../lib/settings';
import { iconPath, GEAR_ICON } from '../lib/icons';

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

export function Nav() {
  const s = settings.value;
  const route = currentRoute.value;
  // unknown routes render the first page (see Shell) — highlight it too
  const activeId =
    route === 'settings' || s.pages.some((p) => p.id === route) ? route : s.pages[0]?.id;

  return (
    <nav class="nav" aria-label="Main">
      <div class="nav-brand" aria-hidden="true">
        <span class="nav-brand-title">{s.title}</span>
        {s.subtitle && <span class="nav-brand-sub">{s.subtitle}</span>}
      </div>
      {s.pages.map((p) => (
        <NavButton
          key={p.id}
          id={p.id}
          title={p.title}
          icon={iconPath(p.icon)}
          active={activeId === p.id}
        />
      ))}
      <div class="nav-bottom">
        <NavButton id="settings" title="Settings" icon={GEAR_ICON} active={route === 'settings'} />
      </div>
    </nav>
  );
}
