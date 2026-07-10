import { Modal } from '../components/Modal';
import { updateElementOptions, removeElement } from '../lib/settings';
import { useEntitiesByDomain } from '../lib/ha/entities';
import { friendlyName } from '../views/settings/EntitySelect';
import { CardOpacityRow, CardTitleRow } from './CardOpacityRow';
import { DEFAULT_WEATHER_FONT_SIZES } from '../views/main/weather/WeatherWidget';
import type { WeatherBucket } from '../views/main/weather/WeatherWidget';
import type { EditorProps } from './domainOptionsEditor';
import opt from '../components/options.module.css';

const DAY_CHOICES = [3, 4, 5, 6, 7];
const BUCKETS: { key: WeatherBucket; label: string }[] = [
  { key: 'xs', label: 'Smallest' },
  { key: 'sm', label: 'Small' },
  { key: 'md', label: 'Medium' },
  { key: 'lg', label: 'Large' },
];

export default function WeatherOptionsEditor({ pageId, element, onClose }: EditorProps) {
  const entities = useEntitiesByDomain('weather').value;
  const rawId = element.options?.entityId;
  const current = typeof rawId === 'string' ? rawId : '';
  const rawDays = element.options?.forecastDays;
  const days = typeof rawDays === 'number' ? rawDays : 5;
  const rawFontSizes = element.options?.fontSizes as Partial<Record<WeatherBucket, number>> | undefined;
  const fontSizes = { ...DEFAULT_WEATHER_FONT_SIZES, ...(rawFontSizes ?? {}) };
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
        <div class={opt.row}>
          Text size by widget size (px)
          <div class={opt.seg}>
            {BUCKETS.map(({ key, label }) => (
              <label
                key={key}
                title={label}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
              >
                <span style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>{key}</span>
                <input
                  type="number"
                  class={opt.num}
                  style={{ width: 56 }}
                  min={6}
                  max={72}
                  value={fontSizes[key]}
                  onChange={(e) => {
                    const v = Number((e.target as HTMLInputElement).value);
                    set({
                      fontSizes: {
                        ...fontSizes,
                        [key]: Number.isFinite(v) ? v : DEFAULT_WEATHER_FONT_SIZES[key],
                      },
                    });
                  }}
                />
              </label>
            ))}
          </div>
          {JSON.stringify(fontSizes) !== JSON.stringify(DEFAULT_WEATHER_FONT_SIZES) && (
            <button
              class={opt.segBtn}
              style={{ justifySelf: 'start' }}
              onClick={() => set({ fontSizes: undefined })}
            >
              Reset to defaults
            </button>
          )}
          <span class={opt.dim}>
            Widget picks one of these four sizes based on its current width/height — a size much
            bigger than what its bucket was tuned for can overflow if the widget is ever resized
            smaller.
          </span>
        </div>
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
