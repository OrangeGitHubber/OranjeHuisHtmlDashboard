import { settings, toggleWidget, moveWidget } from '../../lib/settings';
import { widgetDefs } from '../main/widgets';
import styles from './settings.module.css';

export function WidgetListEditor() {
  const widgets = settings.value.widgets;
  return (
    <ul class={styles.widgetList}>
      {widgets.map((w, i) => {
        const def = widgetDefs[w.type];
        return (
          <li key={w.id} class={`${styles.widgetRow}${def ? '' : ` ${styles.widgetUnknown}`}`}>
            <label class={styles.checkItem}>
              <input type="checkbox" checked={w.enabled} onChange={() => toggleWidget(w.id)} />
              {def ? def.title : `${w.type} (not supported in this version)`}
            </label>
            <span class={styles.widgetArrows}>
              <button
                onClick={() => moveWidget(w.id, -1)}
                disabled={i === 0}
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                onClick={() => moveWidget(w.id, 1)}
                disabled={i === widgets.length - 1}
                aria-label="Move down"
              >
                ▼
              </button>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
