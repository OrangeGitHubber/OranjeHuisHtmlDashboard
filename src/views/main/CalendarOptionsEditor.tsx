import { Modal } from '../../components/Modal';
import { settings, updateElementOptions, removeElement } from '../../lib/settings';
import { useEntitiesByDomain } from '../../lib/ha/entities';
import { friendlyName } from '../settings/EntitySelect';
import { pageIcons } from '../../lib/icons';
import { CardOpacityRow, CardTitleRow } from '../../elements/CardOpacityRow';
import { FontSizeRow } from '../../elements/FontSizeRow';
import { calendarColor } from './useCalendarEvents';
import { DEFAULT_DAY_FONT_SIZES, DEFAULT_AGENDA_FONT_SIZES } from './WeekCalendar';
import type { GridElement } from '../../grid/types';
import type { CalendarOptions, DayBucket } from './WeekCalendar';
import opt from '../../components/options.module.css';
import styles from './main.module.css';

const BUCKETS: { key: DayBucket; label: string }[] = [
  { key: 'xs', label: 'Smallest' },
  { key: 'sm', label: 'Small' },
  { key: 'md', label: 'Medium' },
  { key: 'lg', label: 'Large' },
];

/**
 * Per-instance settings for a calendar element (gear badge / tap in page
 * edit mode). Live-edit: every change persists immediately, Close exits.
 */
export default function CalendarOptionsEditor({
  pageId,
  element,
  onClose,
}: {
  pageId: string;
  element: GridElement;
  onClose: () => void;
}) {
  const o = (element.options ?? {}) as CalendarOptions;
  const calendarEntities = useEntitiesByDomain('calendar').value;
  const mode = o.mode === 'agenda' ? 'agenda' : 'week';
  const dayFontSizes = { ...DEFAULT_DAY_FONT_SIZES, ...(o.dayFontSizes ?? {}) };
  const agendaFontSizes = { ...DEFAULT_AGENDA_FONT_SIZES, ...(o.agendaFontSizes ?? {}) };

  const set = (patch: Partial<CalendarOptions>) =>
    updateElementOptions(pageId, element.id, patch);

  const calMode: 'global' | 'all' | 'custom' =
    o.calendars === undefined ? 'global' : o.calendars === null ? 'all' : 'custom';

  const startCustom = () => {
    // prefill with what this instance currently shows
    const effective = o.calendars !== undefined ? o.calendars : settings.peek().calendars.selected;
    set({
      calendars: effective === null ? calendarEntities.map((e) => e.entity_id) : effective,
    });
  };

  const toggleCalendar = (id: string) => {
    const cur = Array.isArray(o.calendars) ? o.calendars : [];
    set({
      calendars: cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id],
    });
  };

  const num = (v: string, lo: number, hi: number, fallback: number): number => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(Math.max(n, lo), hi) : fallback;
  };

  return (
    <Modal onClose={onClose} maxWidth={420}>
      <header class={opt.header}>
        <span>Calendar settings</span>
        <button class={opt.close} onClick={onClose} aria-label="Close">
          ✕
        </button>
      </header>
      <div class={opt.form}>
        <label class={opt.row}>
          Title
          <input
            type="text"
            value={o.title ?? ''}
            placeholder={mode === 'agenda' ? 'Upcoming' : 'This week'}
            onInput={(e) => set({ title: (e.target as HTMLInputElement).value })}
          />
        </label>

        <div class={opt.row}>
          Icon
          <div class={opt.iconRow}>
            <button
              class={`${opt.iconBtn}${!o.icon ? ` ${opt.iconBtnActive}` : ''}`}
              onClick={() => set({ icon: undefined })}
            >
              None
            </button>
            {Object.entries(pageIcons).map(([name, path]) => (
              <button
                key={name}
                class={`${opt.iconBtn}${o.icon === name ? ` ${opt.iconBtnActive}` : ''}`}
                onClick={() => set({ icon: name })}
                aria-label={`Icon: ${name}`}
              >
                <svg viewBox="0 0 24 24">
                  <path d={path} fill="currentColor" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div class={opt.row}>
          Show
          <div class={opt.seg}>
            <button
              class={`${opt.segBtn}${mode === 'week' ? ` ${opt.segActive}` : ''}`}
              onClick={() => set({ mode: 'week' })}
            >
              Day board
            </button>
            <button
              class={`${opt.segBtn}${mode === 'agenda' ? ` ${opt.segActive}` : ''}`}
              onClick={() => set({ mode: 'agenda' })}
            >
              Next entries
            </button>
          </div>
        </div>

        {mode === 'week' && (
          <>
            <label class={opt.row}>
              Days
              <input
                class={opt.num}
                type="number"
                min={1}
                max={14}
                value={o.days ?? 7}
                onChange={(e) =>
                  set({ days: num((e.target as HTMLInputElement).value, 1, 14, 7) })
                }
              />
            </label>
            <div class={opt.row}>
              Layout
              <div class={opt.seg}>
                <button
                  class={`${opt.segBtn}${!o.vertical ? ` ${opt.segActive}` : ''}`}
                  onClick={() => set({ vertical: false })}
                >
                  Columns
                </button>
                <button
                  class={`${opt.segBtn}${o.vertical ? ` ${opt.segActive}` : ''}`}
                  onClick={() => set({ vertical: true })}
                >
                  Stacked
                </button>
              </div>
            </div>
            <FontSizeRow
              label="Day column text size (px)"
              buckets={BUCKETS}
              sizes={dayFontSizes}
              defaults={DEFAULT_DAY_FONT_SIZES}
              onChange={(bucket, v) => set({ dayFontSizes: { ...dayFontSizes, [bucket]: v } })}
              onReset={() => set({ dayFontSizes: undefined })}
              hint="Picked from a day column's own width — a size much bigger than what its bucket was tuned for can crowd the header if the column is ever narrower."
            />
          </>
        )}

        {mode === 'agenda' && (
          <>
            <label class={opt.row}>
              Entries
              <input
                class={opt.num}
                type="number"
                min={1}
                max={20}
                value={o.count ?? 5}
                onChange={(e) =>
                  set({ count: num((e.target as HTMLInputElement).value, 1, 20, 5) })
                }
              />
            </label>
            <div class={opt.row}>
              Card background
              <div class={opt.seg}>
                <button
                  class={`${opt.segBtn}${!o.agendaCard ? ` ${opt.segActive}` : ''}`}
                  onClick={() => set({ agendaCard: false })}
                >
                  None
                </button>
                <button
                  class={`${opt.segBtn}${o.agendaCard ? ` ${opt.segActive}` : ''}`}
                  onClick={() => set({ agendaCard: true })}
                >
                  Surface
                </button>
              </div>
              <span class={opt.dim}>
                “Surface” draws a bordered card that follows the card-opacity setting; “None” lets
                entries use the full space.
              </span>
            </div>
            <div class={opt.row}>
              Entry spacing
              <div class={opt.seg}>
                <button
                  class={`${opt.segBtn}${!o.agendaFill ? ` ${opt.segActive}` : ''}`}
                  onClick={() => set({ agendaFill: false })}
                >
                  Compact
                </button>
                <button
                  class={`${opt.segBtn}${o.agendaFill ? ` ${opt.segActive}` : ''}`}
                  onClick={() => set({ agendaFill: true })}
                >
                  Fill height
                </button>
              </div>
              <span class={opt.dim}>
                “Compact” keeps entries close together; “Fill height” spreads them out to use the
                whole card, which can look gappy on a tall widget with few entries.
              </span>
            </div>
            <FontSizeRow
              label="Entry text size (px)"
              buckets={BUCKETS}
              sizes={agendaFontSizes}
              defaults={DEFAULT_AGENDA_FONT_SIZES}
              onChange={(bucket, v) => set({ agendaFontSizes: { ...agendaFontSizes, [bucket]: v } })}
              onReset={() => set({ agendaFontSizes: undefined })}
              hint="Picked from the entry list's own width — a size much bigger than what its bucket was tuned for can wrap onto extra lines if the widget is ever narrower."
            />
          </>
        )}

        <div class={opt.row}>
          Calendars
          <div class={opt.seg}>
            <button
              class={`${opt.segBtn}${calMode === 'global' ? ` ${opt.segActive}` : ''}`}
              onClick={() => set({ calendars: undefined })}
              title="This display's default calendar selection (all, unless configured before)"
            >
              Default
            </button>
            <button
              class={`${opt.segBtn}${calMode === 'all' ? ` ${opt.segActive}` : ''}`}
              onClick={() => set({ calendars: null })}
            >
              All
            </button>
            <button
              class={`${opt.segBtn}${calMode === 'custom' ? ` ${opt.segActive}` : ''}`}
              onClick={startCustom}
            >
              Choose…
            </button>
          </div>
        </div>

        {calMode === 'custom' && (
          <ul class={opt.checklist}>
            {calendarEntities.length === 0 && (
              <li class={opt.dim}>No calendar entities found.</li>
            )}
            {calendarEntities.map((e) => (
              <li key={e.entity_id}>
                <label class={opt.checkItem}>
                  <input
                    type="checkbox"
                    checked={Array.isArray(o.calendars) && o.calendars.includes(e.entity_id)}
                    onChange={() => toggleCalendar(e.entity_id)}
                  />
                  <span
                    class={styles.eventDot}
                    style={{ background: calendarColor(e.entity_id) }}
                  />
                  {friendlyName(e)}
                </label>
              </li>
            ))}
          </ul>
        )}

        <div class={opt.row}>
          “Updated Xm ago” hint
          <div class={opt.seg}>
            <button
              class={`${opt.segBtn}${o.showUpdated !== false ? ` ${opt.segActive}` : ''}`}
              onClick={() => set({ showUpdated: undefined })}
            >
              Show
            </button>
            <button
              class={`${opt.segBtn}${o.showUpdated === false ? ` ${opt.segActive}` : ''}`}
              onClick={() => set({ showUpdated: false })}
            >
              Hide
            </button>
          </div>
        </div>

        <div class={opt.row}>
          Calendar color marker on entries
          <div class={opt.seg}>
            {(
              [
                ['hide', 'Hide'],
                ['dot', 'Dots'],
                ['bar', 'Bar'],
              ] as const
            ).map(([val, label]) => {
              const cur = o.marker ?? (o.showDots === false ? 'hide' : 'dot');
              return (
                <button
                  key={val}
                  class={`${opt.segBtn}${cur === val ? ` ${opt.segActive}` : ''}`}
                  onClick={() => set({ marker: val, showDots: undefined })}
                >
                  {label}
                </button>
              );
            })}
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
