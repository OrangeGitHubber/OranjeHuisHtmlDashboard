import { useState } from 'preact/hooks';
import { useCalendarEvents, calendarColor } from './useCalendarEvents';
import { selectedCalendars } from '../../lib/prefs';
import { CalendarPicker } from './CalendarPicker';
import type { CalendarEvent } from '../../lib/types';
import styles from './main.module.css';

const GEAR_ICON =
  'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z';

interface Day {
  start: Date;
  end: Date;
  isToday: boolean;
  weekday: string;
  dateLabel: string;
  events: CalendarEvent[];
}

function buildDays(events: CalendarEvent[]): Day[] {
  const days: Day[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const start = new Date(today.getTime());
    start.setDate(start.getDate() + i);
    const end = new Date(start.getTime());
    end.setDate(end.getDate() + 1);
    const dayEvents = events
      .filter((ev) => ev.start < end && ev.end > start)
      .sort((a, b) =>
        a.allDay !== b.allDay ? (a.allDay ? -1 : 1) : a.start.getTime() - b.start.getTime(),
      );
    days.push({
      start,
      end,
      isToday: i === 0,
      weekday:
        i === 0
          ? 'Today'
          : i === 1
            ? 'Tomorrow'
            : start.toLocaleDateString(undefined, { weekday: 'long' }),
      dateLabel: start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      events: dayEvents,
    });
  }
  return days;
}

function timeLabel(ev: CalendarEvent, day: Day): string {
  if (ev.allDay) return 'All day';
  if (ev.start < day.start) return '…'; // continues from a previous day
  return ev.start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function agoLabel(lastFetched: number): string {
  const m = Math.floor((Date.now() - lastFetched) / 60_000);
  return m <= 0 ? 'just now' : `${m}m ago`;
}

export function WeekCalendar() {
  const { events, calendars, loading, error, lastFetched, refresh } = useCalendarEvents(7);
  const [pickerOpen, setPickerOpen] = useState(false);

  const sel = selectedCalendars.value;
  const active = sel === null ? null : new Set(sel);
  const filtered = active === null ? events : events.filter((ev) => active.has(ev.calendarId));
  const days = buildDays(filtered);

  return (
    <section class={styles.week}>
      <header class={styles.weekHeader}>
        <h2 class={styles.weekTitle}>This week</h2>
        <div class={styles.weekTools}>
          {error && lastFetched !== null && <span class={styles.offline}>offline</span>}
          {lastFetched !== null && (
            <span class={styles.updated}>updated {agoLabel(lastFetched)}</span>
          )}
          <button
            class={styles.gearBtn}
            onClick={() => setPickerOpen(true)}
            aria-label="Choose calendars"
            title="Choose calendars"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={GEAR_ICON} />
            </svg>
          </button>
        </div>
      </header>

      {error && events.length === 0 && !loading ? (
        <div class={styles.weekError}>
          {error.isLikelyCors
            ? `Could not reach the Home Assistant REST API — usually missing CORS config. Add "${location.origin}" to http: cors_allowed_origins in configuration.yaml and restart HA.`
            : `Could not load calendars (${error.message}).`}{' '}
          <button onClick={refresh}>Retry</button>
        </div>
      ) : (
        <div class={styles.weekScroll}>
          <div class={styles.weekGrid}>
            {days.map((day) => (
              <div key={day.start.getTime()} class={`${styles.day}${day.isToday ? ` ${styles.today}` : ''}`}>
                <header class={styles.dayHeader}>
                  <span class={styles.dayName}>{day.weekday}</span>
                  <span class={styles.dayDate}>{day.dateLabel}</span>
                </header>
                <div class={styles.dayEvents}>
                  {loading && events.length === 0 ? (
                    <>
                      <div class={styles.eventSkeleton} />
                      <div class={styles.eventSkeleton} />
                    </>
                  ) : (
                    day.events.map((ev, i) => (
                      <div class={styles.event} key={i} title={ev.calendarName}>
                        <span
                          class={styles.eventDot}
                          style={{ background: calendarColor(ev.calendarId) }}
                        />
                        <div class={styles.eventText}>
                          <span class={styles.eventTime}>{timeLabel(ev, day)}</span>
                          <span class={styles.eventSummary}>{ev.summary}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pickerOpen && <CalendarPicker calendars={calendars} onClose={() => setPickerOpen(false)} />}
    </section>
  );
}
