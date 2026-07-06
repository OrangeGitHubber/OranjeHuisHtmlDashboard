import { settings, setSelectedCalendars } from '../../lib/settings';
import { calendarColor } from './useCalendarEvents';
import type { CalendarInfo } from '../../lib/types';
import styles from './main.module.css';

export function CalendarPicker({
  calendars,
  onClose,
}: {
  calendars: CalendarInfo[];
  onClose: () => void;
}) {
  const sel = settings.value.calendars.selected;
  const isChecked = (id: string) => sel === null || sel.includes(id);

  function toggle(id: string) {
    const current = sel === null ? calendars.map((c) => c.entity_id) : sel;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    // when everything is selected, store null so newly added calendars show up automatically
    setSelectedCalendars(next.length >= calendars.length ? null : next);
  }

  return (
    <div class={styles.pickerOverlay} onClick={onClose}>
      <div class={styles.picker} onClick={(e) => e.stopPropagation()}>
        <h3 class={styles.pickerTitle}>Calendars on this display</h3>
        {calendars.length === 0 ? (
          <p class={styles.pickerEmpty}>No calendar entities found in Home Assistant.</p>
        ) : (
          <ul class={styles.pickerList}>
            {calendars.map((cal) => (
              <li key={cal.entity_id}>
                <label class={styles.pickerItem}>
                  <input
                    type="checkbox"
                    checked={isChecked(cal.entity_id)}
                    onChange={() => toggle(cal.entity_id)}
                  />
                  <span
                    class={styles.pickerDot}
                    style={{ background: calendarColor(cal.entity_id) }}
                  />
                  {cal.name}
                </label>
              </li>
            ))}
          </ul>
        )}
        <button class={styles.pickerDone} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
