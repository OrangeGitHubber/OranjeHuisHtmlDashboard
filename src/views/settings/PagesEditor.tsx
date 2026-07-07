import { useState } from 'preact/hooks';
import {
  settings,
  addPage,
  removePage,
  renamePage,
  setPageIcon,
  setPageShowTitles,
  movePage,
} from '../../lib/settings';
import { currentRoute, navigate } from '../../lib/router';
import { iconPath } from '../../lib/icons';
import { IconPickerModal } from './IconPickerModal';
import styles from './settings.module.css';

export function PagesEditor() {
  const pages = settings.value.pages;
  const [iconFor, setIconFor] = useState<string | null>(null);
  const iconPage = iconFor ? pages.find((p) => p.id === iconFor) : undefined;

  const remove = (id: string, title: string) => {
    if (!confirm(`Delete page “${title}”? Its layout is lost.`)) return;
    removePage(id);
    if (currentRoute.value === id) {
      const remaining = settings.peek().pages;
      if (remaining.length > 0) navigate(remaining[0].id);
    }
  };

  return (
    <>
      <ul class={styles.pageList}>
        {pages.map((p, i) => (
          <li key={p.id} class={styles.pageRow}>
            <button
              class={styles.iconBtn}
              onClick={() => setIconFor(p.id)}
              aria-label={`Change icon for ${p.title}`}
            >
              <svg viewBox="0 0 24 24">
                <path d={iconPath(p.icon)} fill="currentColor" />
              </svg>
            </button>
            <input
              class={styles.pageTitleInput}
              type="text"
              value={p.title}
              onInput={(e) => renamePage(p.id, (e.target as HTMLInputElement).value)}
            />
            <select
              class={styles.pageTitleSel}
              title="Card titles on this page"
              value={p.showTitles === undefined ? 'system' : p.showTitles ? 'show' : 'hide'}
              onChange={(e) => {
                const v = (e.target as HTMLSelectElement).value;
                setPageShowTitles(p.id, v === 'system' ? undefined : v === 'show');
              }}
            >
              <option value="system">Titles: system</option>
              <option value="show">Titles: show</option>
              <option value="hide">Titles: hide</option>
            </select>
            <span class={styles.widgetArrows}>
              <button onClick={() => movePage(p.id, -1)} disabled={i === 0} aria-label="Move up">
                ▲
              </button>
              <button
                onClick={() => movePage(p.id, 1)}
                disabled={i === pages.length - 1}
                aria-label="Move down"
              >
                ▼
              </button>
              <button
                onClick={() => remove(p.id, p.title)}
                disabled={pages.length <= 1}
                aria-label={`Delete ${p.title}`}
              >
                ✕
              </button>
            </span>
          </li>
        ))}
      </ul>
      <div class={styles.buttonRow}>
        <button
          class={styles.fileBtn}
          onClick={() => {
            const p = addPage();
            navigate(p.id);
          }}
        >
          ＋ Add page
        </button>
      </div>
      {iconPage && (
        <IconPickerModal
          current={iconPage.icon}
          onPick={(name) => setPageIcon(iconPage.id, name)}
          onClose={() => setIconFor(null)}
        />
      )}
    </>
  );
}
