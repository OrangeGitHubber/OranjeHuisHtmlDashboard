import { views } from '../views/registry';
import { currentViewId, navigate } from '../lib/router';

export function Nav() {
  const active = currentViewId.value;
  return (
    <nav class="nav" aria-label="Main">
      {views.map((v) => (
        <button
          key={v.id}
          class={`nav-item${v.id === active ? ' active' : ''}`}
          onClick={() => navigate(v.id)}
          aria-current={v.id === active ? 'page' : undefined}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={v.icon} />
          </svg>
          {v.title}
        </button>
      ))}
    </nav>
  );
}
