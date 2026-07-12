import { Modal } from '../components/Modal';
import { updateElementOptions, removeElement } from '../lib/settings';
import { useEntitiesByDomain } from '../lib/ha/entities';
import { friendlyName } from '../views/settings/EntitySelect';
import { CardOpacityRow, CardTitleRow } from './CardOpacityRow';
import { TextSizeRow } from './TextSizeRow';
import { DEFAULT_FONT_SCALE } from '../lib/fontSizePresets';
import type { EditorProps } from './domainOptionsEditor';
import opt from '../components/options.module.css';

const DAY_CHOICES = [3, 4, 5, 6, 7];

export default function WeatherOptionsEditor({ pageId, element, onClose }: EditorProps) {
  const entities = useEntitiesByDomain('weather').value;
  const rawId = element.options?.entityId;
  const current = typeof rawId === 'string' ? rawId : '';
  const rawDays = element.options?.forecastDays;
  const days = typeof rawDays === 'number' ? rawDays : 5;
  const rawScale = element.options?.fontScale;
  const fontScale = typeof rawScale === 'number' ? rawScale : DEFAULT_FONT_SCALE;
  const rawDropHourly = element.options?.dropHourlyAtXs;
  const dropHourlyAtXs = typeof rawDropHourly === 'boolean' ? rawDropHourly : true;
  const set = (patch: Record<string, unknown>) =>
    updateElementOptions(pageId, element.id, patch);

  return (
    <Modal onClose={onClose} maxWidth={420}>
      <header class={opt.header}>
        <span>Weather settings</span>
        <button class={opt.close} onClick={onClose} aria-label="Close">
          ✕
        </button>
      </header>
      <div class={opt.form}>
        {entities.length === 0 && <p class={opt.dim}>No weather entities found.</p>}
        <ul class={opt.checklist}>
          {entities.map((e) => (
            <li key={e.entity_id}>
              <label class={opt.checkItem}>
                <input
                  type="radio"
                  name="entity"
                  checked={e.entity_id === current}
                  onChange={() => set({ entityId: e.entity_id })}
                />
                <span class={opt.checkName}>{friendlyName(e)}</span>
                <span class={opt.checkId}>{e.entity_id}</span>
              </label>
            </li>
          ))}
        </ul>
        <div class={opt.row}>
          Forecast days
          <div class={opt.seg}>
            {DAY_CHOICES.map((d) => (
              <button
                key={d}
                class={`${opt.segBtn}${days === d ? ` ${opt.segActive}` : ''}`}
                onClick={() => set({ forecastDays: d })}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <TextSizeRow scale={fontScale} onChange={(pct) => set({ fontScale: pct })} />
        <div class={opt.row}>
          Hourly forecast at smallest size
          <div class={opt.seg}>
            <button
              class={`${opt.segBtn}${dropHourlyAtXs ? ` ${opt.segActive}` : ''}`}
              onClick={() => set({ dropHourlyAtXs: true })}
            >
              Hide
            </button>
            <button
              class={`${opt.segBtn}${!dropHourlyAtXs ? ` ${opt.segActive}` : ''}`}
              onClick={() => set({ dropHourlyAtXs: false })}
            >
              Always show
            </button>
          </div>
        </div>
        <CardTitleRow pageId={pageId} element={element} />
        <CardOpacityRow pageId={pageId} element={element} />
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
