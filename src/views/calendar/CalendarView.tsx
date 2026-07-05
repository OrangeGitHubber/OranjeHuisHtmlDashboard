import { useCalendarEvents } from './useCalendarEvents';
import { EmptyState } from '../../components/EmptyState';
import type { CalendarEvent } from '../../lib/types';
import styles from './calendar.module.css';

interface DayGroup {
  key: string;
  label: string;
  sub: string;
  events: CalendarEvent[];
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(d: Date, today: Date): { label: string; sub: string } {
  const diffDays = Math.round((startOfDay(d).getTime() - startOfDay(today).getTime()) / 86_400_000);
  const sub = d.toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
  if (diffDays === 0) return { label: 'Today', sub };
  if (diffDays === 1) return { label: 'Tomorrow', sub };
  return { label: d.toLocaleDateString(undefined, { weekday: 'long' }), sub };
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function groupByDay(events: CalendarEvent[]): DayGroup[] {
  const today = new Date();
  const todayStart = startOfDay(today);
  const groups = new Map<string, DayGroup>();
  for (const ev of events) {
    // ongoing events (started before today) appear under Today
    const day = ev.start < todayStart && ev.end > todayStart ? todayStart : startOfDay(ev.start);
    if (ev.end.getTime() <= todayStart.getTime()) continue; // fully in the past
    const key = dayKey(day);
    let group = groups.get(key);
    if (!group) {
      const { label, sub } = dayLabel(day, today);
      group = { key, label, sub, events: [] };
      groups.set(key, group);
    }
    group.events.push(ev);
  }
  return [...groups.values()];
}

function calendarColor(calendarId: string): string {
  let hash = 0;
  for (let i = 0; i < calendarId.length; i++) hash = (hash * 31 + calendarId.charCodeAt(i)) | 0;
  return `hsl(${((hash % 360) + 360) % 360} 60% 62%)`;
}

function timeRange(ev: CalendarEvent): string {
  if (ev.allDay) return 'All day';
  const fmt: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  return `${ev.start.toLocaleTimeString(undefined, fmt)} – ${ev.end.toLocaleTimeString(undefined, fmt)}`;
}

function agoLabel(lastFetched: number): string {
  const m = Math.floor((Date.now() - lastFetched) / 60_000);
  return m <= 0 ? 'just now' : `${m}m ago`;
}

export default function CalendarView() {
  const { events, loading, error, lastFetched, refresh } = useCalendarEvents(7);

  if (loading) {
    return (
      <div>
        <h1 class="view-title">Agenda</h1>
        <div class={styles.skeletonList}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} class={styles.skeleton} />
          ))}
        </div>
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div>
        <h1 class="view-title">Agenda</h1>
        <EmptyState
          message={
            error.isLikelyCors
              ? `Could not reach the Home Assistant REST API. This is usually missing CORS config: add "${location.origin}" to http: cors_allowed_origins in configuration.yaml and restart HA.`
              : `Could not load calendars (${error.message}).`
          }
        >
          <button onClick={refresh}>Retry</button>
        </EmptyState>
      </div>
    );
  }

  const groups = groupByDay(events);

  return (
    <div>
      <div class={styles.header}>
        <h1 class="view-title">Agenda</h1>
        {lastFetched !== null && (
          <span class={styles.updated} title="Last refreshed">
            {error ? 'offline · ' : ''}updated {agoLabel(lastFetched)}
          </span>
        )}
      </div>

      {groups.length === 0 ? (
        <EmptyState message="No events in the next 7 days." />
      ) : (
        groups.map((g) => (
          <section key={g.key} class={styles.day}>
            <header class={styles.dayHeader}>
              <span class={styles.dayLabel}>{g.label}</span>
              <span class={styles.daySub}>{g.sub}</span>
            </header>
            <ul class={styles.eventList}>
              {g.events.map((ev, i) => (
                <li key={i} class={styles.event}>
                  <span class={styles.dot} style={{ background: calendarColor(ev.calendarId) }} />
                  <div class={styles.eventBody}>
                    <span class={styles.summary}>{ev.summary}</span>
                    {ev.location && <span class={styles.location}>{ev.location}</span>}
                  </div>
                  <span class={styles.time}>{timeRange(ev)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
