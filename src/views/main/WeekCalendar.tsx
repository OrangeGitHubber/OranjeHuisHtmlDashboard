import { useState } from 'preact/hooks';
import { useCalendarEvents, calendarColor } from './useCalendarEvents';
import { settings } from '../../lib/settings';
import { CalendarPicker } from './CalendarPicker';
import type { CalendarEvent } from '../../lib/types';
import styles from './main.module.css';

import { GEAR_ICON } from '../../lib/icons';

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

  const sel = settings.value.calendars.selected;
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
