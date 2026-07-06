import { views } from '../views/registry';
import { currentViewId, navigate } from '../lib/router';
import { settings } from '../lib/settings';

function NavButton({ id, title, icon }: { id: string; title: string; icon: string }) {
  const active = currentViewId.value === id;
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
  const mainViews = views.filter((v) => !v.hidden);
  const settingsView = views.find((v) => v.id === 'settings');

  return (
    <nav class="nav" aria-label="Main">
      <div class="nav-brand" aria-hidden="true">
        <span class="nav-brand-title">{s.title}</span>
        {s.subtitle && <span class="nav-brand-sub">{s.subtitle}</span>}
      </div>
      {mainViews.map((v) => (
        <NavButton key={v.id} id={v.id} title={v.title} icon={v.icon} />
      ))}
      {settingsView && (
        <div class="nav-bottom">
          <NavButton id={settingsView.id} title={settingsView.title} icon={settingsView.icon} />
        </div>
      )}
    </nav>
  );
}
