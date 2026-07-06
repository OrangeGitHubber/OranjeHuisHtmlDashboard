import { useState } from 'preact/hooks';
import { Modal } from '../components/Modal';
import { updateElementOptions, removeElement } from '../lib/settings';
import { useEntitiesByDomain } from '../lib/ha/entities';
import { friendlyName } from '../views/settings/EntitySelect';
import type { EditorProps } from './domainOptionsEditor';
import type { GraphOptions } from './GraphCard';
import opt from '../components/options.module.css';

const WINDOWS: { hours: number; label: string }[] = [
  { hours: 3, label: '3 h' },
  { hours: 12, label: '12 h' },
  { hours: 24, label: '24 h' },
  { hours: 48, label: '2 d' },
  { hours: 168, label: '7 d' },
];

const MAX_RESULTS = 50;

export default function GraphOptionsEditor({ pageId, element, onClose }: EditorProps) {
  const o = (element.options ?? {}) as GraphOptions;
  const [query, setQuery] = useState('');
  const sensors = useEntitiesByDomain('sensor').value;
  const set = (patch: Partial<GraphOptions>) => updateElementOptions(pageId, element.id, patch);

  const q = query.trim().toLowerCase();
  const matches = q
    ? sensors
        .filter(
          (s) =>
            friendlyName(s).toLowerCase().includes(q) || s.entity_id.toLowerCase().includes(q),
        )
        .slice(0, MAX_RESULTS)
    : [];

  return (
    <Modal onClose={onClose} maxWidth={460}>
      <header class={opt.header}>
        <span>History graph settings</span>
        <button class={opt.close} onClick={onClose} aria-label="Close">
          ✕
        </button>
      </header>
      <div class={opt.form}>
        <p class={opt.dim}>
          Showing <code>{o.entityId ?? 'no sensor yet'}</code>
        </p>
        <label class={opt.row}>
          Sensor
          <input
            type="search"
            placeholder="Search sensors (e.g. glances, cpu, temperature)…"
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          />
        </label>
        {q && matches.length === 0 && <p class={opt.dim}>No sensors match.</p>}
        {matches.length > 0 && (
          <ul class={opt.checklist}>
            {matches.map((s) => (
              <li key={s.entity_id}>
                <label class={opt.checkItem}>
                  <input
                    type="radio"
                    name="sensor"
                    checked={s.entity_id === o.entityId}
                    onChange={() => set({ entityId: s.entity_id })}
                  />
                  <span class={opt.checkName}>{friendlyName(s)}</span>
                  <span class={opt.checkId}>{s.entity_id}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <div class={opt.row}>
          Window
          <div class={opt.seg}>
            {WINDOWS.map((w) => (
              <button
                key={w.hours}
                class={`${opt.segBtn}${(o.hours ?? 24) === w.hours ? ` ${opt.segActive}` : ''}`}
                onClick={() => set({ hours: w.hours })}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
        <label class={opt.row}>
          Title (a friendly name for ugly sensor names)
          <input
            type="text"
            value={o.title ?? ''}
            placeholder="Uses the sensor's name if empty"
            onInput={(e) => set({ title: (e.target as HTMLInputElement).value })}
          />
        </label>
        <div class={opt.footerRow}>
          <button
            class={opt.removeBtn}
            onClick={() => {
              removeElement(pageId, element.id);
              onClose();
            }}
          >
            Remove element
          </button>
          <button class={opt.doneBtn} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
