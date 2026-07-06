import { settings } from '../../lib/settings';
import { widgetDefs } from './widgets';
import { AsyncView } from '../../components/AsyncView';
import styles from './main.module.css';

export default function MainView() {
  const widgets = settings.value.widgets.filter((w) => w.enabled && widgetDefs[w.type]);
  return (
    <div class={styles.widgetGrid}>
      {widgets.map((w) => {
        const def = widgetDefs[w.type];
        return (
          <section key={w.id} class={def.fullWidth ? styles.cellFull : styles.cell}>
            <AsyncView load={def.load} />
          </section>
        );
      })}
    </div>
  );
}
