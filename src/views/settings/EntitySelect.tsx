import type { HassEntity } from 'home-assistant-js-websocket';
import styles from './settings.module.css';

export function friendlyName(e: HassEntity): string {
  return (e.attributes.friendly_name as string | undefined) ?? e.entity_id;
}

export function EntitySelect({
  entities,
  value,
  onChange,
  noneLabel = 'None',
}: {
  entities: HassEntity[];
  value: string | null;
  onChange: (id: string | null) => void;
  noneLabel?: string;
}) {
  return (
    <select
      class={styles.select}
      value={value ?? ''}
      onChange={(e) => {
        const v = (e.target as HTMLSelectElement).value;
        onChange(v === '' ? null : v);
      }}
    >
      <option value="">{noneLabel}</option>
      {entities.map((e) => (
        <option key={e.entity_id} value={e.entity_id}>
          {friendlyName(e)}
        </option>
      ))}
    </select>
  );
}

/** Checkbox list; when everything is checked, null is stored so new entities appear automatically. */
export function EntityMultiSelect({
  entities,
  selected,
  onChange,
}: {
  entities: HassEntity[];
  selected: string[] | null;
  onChange: (ids: string[] | null) => void;
}) {
  const isChecked = (id: string) => selected === null || selected.includes(id);

  function toggle(id: string) {
    const current = selected === null ? entities.map((e) => e.entity_id) : selected;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    onChange(next.length >= entities.length ? null : next);
  }

  if (entities.length === 0) {
    return <p class={styles.dim}>None found in Home Assistant.</p>;
  }
  return (
    <ul class={styles.checkList}>
      {entities.map((e) => (
        <li key={e.entity_id}>
          <label class={styles.checkItem}>
            <input
              type="checkbox"
              checked={isChecked(e.entity_id)}
              onChange={() => toggle(e.entity_id)}
            />
            {friendlyName(e)}
          </label>
        </li>
      ))}
    </ul>
  );
}
