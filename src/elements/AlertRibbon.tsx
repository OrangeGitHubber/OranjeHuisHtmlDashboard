import type { HassEntity } from '../lib/types';
import { useEntity } from '../lib/ha/entities';
import EntityCard from './EntityCard';
import type { ElementProps } from '../grid/elements';
import type { GridElement } from '../grid/types';
import styles from './elements.module.css';

export type AlertOp = 'on' | 'off' | 'gt' | 'lt' | 'eq' | 'ne';

export interface AlertItem {
  id: string;
  entityId: string;
  op: AlertOp;
  /** comparison value for gt/lt/eq/ne */
  value?: string;
}

export interface AlertRibbonOptions {
  title?: string;
  items?: AlertItem[];
}

export function alertActive(entity: HassEntity, it: AlertItem): boolean {
  const s = entity.state;
  if (s === 'unavailable' || s === 'unknown') return false;
  switch (it.op) {
    case 'on':
      return s === 'on';
    case 'off':
      return s === 'off';
    case 'gt': {
      const a = Number(s);
      const b = Number(it.value);
      return Number.isFinite(a) && Number.isFinite(b) && a > b;
    }
    case 'lt': {
      const a = Number(s);
      const b = Number(it.value);
      return Number.isFinite(a) && Number.isFinite(b) && a < b;
    }
    case 'eq':
      return s.toLowerCase() === String(it.value ?? '').trim().toLowerCase();
    case 'ne':
      return s.toLowerCase() !== String(it.value ?? '').trim().toLowerCase();
  }
}

export function opLabel(it: AlertItem): string {
  switch (it.op) {
    case 'on':
      return 'is on';
    case 'off':
      return 'is off';
    case 'gt':
      return `> ${it.value ?? '?'}`;
    case 'lt':
      return `< ${it.value ?? '?'}`;
    case 'eq':
      return `= ${it.value ?? '?'}`;
    case 'ne':
      return `≠ ${it.value ?? '?'}`;
  }
}

/**
 * Shows entity cards ONLY while their "display if…" condition holds
 * (e.g. door open, temperature above a threshold). Quiet when all clear.
 */
export default function AlertRibbon({ element }: ElementProps) {
  const o = (element.options ?? {}) as AlertRibbonOptions;
  const items = Array.isArray(o.items) ? o.items : [];
  const title = o.title?.trim() || 'Alerts';

  // useEntity is a plain signal getter (not a hook), safe in a loop
  const active = items.filter((it) => {
    const entity = useEntity(it.entityId).value;
    return entity !== undefined && alertActive(entity, it);
  });

  const syntheticFor = (entityId: string): GridElement => ({
    id: `alert-${entityId}`,
    type: 'entity',
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    options: { entityId },
  });

  return (
    <div class={`${styles.card} ${styles.alertRibbon}`}>
      <div class={styles.graphHead}>
        <span class={styles.name}>{title}</span>
        <span class={styles.graphWindow}>
          {items.length === 0 ? 'no rules' : `${active.length}/${items.length}`}
        </span>
      </div>
      {items.length === 0 ? (
        <span class={styles.alertClear}>No alert rules — tap this card in page edit mode.</span>
      ) : active.length === 0 ? (
        <span class={styles.alertClear}>All clear ✓</span>
      ) : (
        <div class={styles.alertRow}>
          {active.map((it) => (
            <div key={it.id} class={styles.alertItem}>
              <EntityCard pageId="" element={syntheticFor(it.entityId)} editing={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
