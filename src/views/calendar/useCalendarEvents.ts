import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { haFetch, HaRestError } from '../../lib/ha/rest';
import { connectionStatus } from '../../lib/ha/connection';
import type { CalendarEvent, CalendarInfo } from '../../lib/types';

interface RawCalendarEvent {
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  description?: string | null;
  location?: string | null;
}

export interface CalendarState {
  events: CalendarEvent[];
  loading: boolean;
  error: HaRestError | null;
  lastFetched: number | null;
}

const REFRESH_MS = 5 * 60_000;
const STALE_MS = 2 * 60_000;

function parseEvent(raw: RawCalendarEvent, cal: CalendarInfo): CalendarEvent | null {
  const allDay = !!raw.start.date;
  const start = new Date(raw.start.dateTime ?? raw.start.date ?? '');
  const end = new Date(raw.end.dateTime ?? raw.end.date ?? '');
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  return {
    start,
    end,
    allDay,
    summary: raw.summary || '(untitled)',
    description: raw.description ?? undefined,
    location: raw.location ?? undefined,
    calendarId: cal.entity_id,
    calendarName: cal.name,
  };
}

export function useCalendarEvents(days = 7): CalendarState & { refresh: () => void } {
  const [state, setState] = useState<CalendarState>({
    events: [],
    loading: true,
    error: null,
    lastFetched: null,
  });
  const lastFetchedRef = useRef<number | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const calendars = await haFetch<CalendarInfo[]>('/api/calendars');
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + days * 86_400_000);
      const q = `?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`;

      const perCalendar = await Promise.all(
        calendars.map(async (cal) => {
          try {
            const raw = await haFetch<RawCalendarEvent[]>(
              `/api/calendars/${encodeURIComponent(cal.entity_id)}${q}`,
            );
            return raw
              .map((r) => parseEvent(r, cal))
              .filter((ev): ev is CalendarEvent => ev !== null);
          } catch {
            return []; // one broken calendar shouldn't blank the agenda
          }
        }),
      );

      const events = perCalendar.flat().sort((a, b) => a.start.getTime() - b.start.getTime());
      lastFetchedRef.current = Date.now();
      setState({ events, loading: false, error: null, lastFetched: lastFetchedRef.current });
    } catch (err) {
      const error = err instanceof HaRestError ? err : new HaRestError(0, String(err));
      // keep showing stale events if we have them; only surface a blocking error when empty
      setState((prev) => ({
        ...prev,
        loading: false,
        error,
      }));
    } finally {
      inFlight.current = false;
    }
  }, [days]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);

    const onVisible = () => {
      const last = lastFetchedRef.current;
      if (!document.hidden && (last === null || Date.now() - last > STALE_MS)) refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    // refetch when the WS connection comes back (HA restart, wifi drop)
    let prevStatus = connectionStatus.peek();
    const unsub = connectionStatus.subscribe((status) => {
      if (status === 'connected' && prevStatus !== 'connected' && lastFetchedRef.current !== null) {
        refresh();
      }
      prevStatus = status;
    });

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      unsub();
    };
  }, [refresh]);

  return { ...state, refresh };
}
