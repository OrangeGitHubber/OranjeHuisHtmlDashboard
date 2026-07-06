import { useEffect, useState } from 'preact/hooks';
import { haFetch, HaRestError } from '../lib/ha/rest';
import { connectionStatus } from '../lib/ha/connection';

export interface HistoryPoint {
  t: number;
  v: number;
}

interface HistoryState {
  points: HistoryPoint[];
  loading: boolean;
  error: string | null;
}

interface RawHistoryItem {
  state: string;
  last_changed?: string;
}

const REFRESH_MS = 5 * 60_000;
const MAX_POINTS = 240;

/** Numeric state history of one sensor over the last `hours` hours. */
export function useHistory(entityId: string, hours: number): HistoryState {
  const [state, setState] = useState<HistoryState>({ points: [], loading: true, error: null });

  useEffect(() => {
    if (!entityId) {
      setState({ points: [], loading: false, error: null });
      return;
    }
    let disposed = false;
    setState((p) => ({ ...p, loading: true }));

    const fetchIt = async () => {
      try {
        const start = new Date(Date.now() - hours * 3_600_000).toISOString();
        const data = await haFetch<RawHistoryItem[][]>(
          `/api/history/period/${encodeURIComponent(start)}?filter_entity_id=${encodeURIComponent(entityId)}&minimal_response&no_attributes`,
        );
        const pts: HistoryPoint[] = [];
        for (const item of data[0] ?? []) {
          const v = Number(item.state);
          const t = item.last_changed ? Date.parse(item.last_changed) : NaN;
          if (Number.isFinite(v) && Number.isFinite(t)) pts.push({ t, v });
        }
        const step = Math.ceil(pts.length / MAX_POINTS);
        const out = step > 1 ? pts.filter((_, i) => i % step === 0) : pts;
        if (!disposed) setState({ points: out, loading: false, error: null });
      } catch (err) {
        if (!disposed) {
          setState((p) => ({
            ...p,
            loading: false,
            error: err instanceof HaRestError ? err.message : String(err),
          }));
        }
      }
    };

    fetchIt();
    const timer = setInterval(() => {
      if (!document.hidden && connectionStatus.peek() === 'connected') fetchIt();
    }, REFRESH_MS);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [entityId, hours]);

  return state;
}
