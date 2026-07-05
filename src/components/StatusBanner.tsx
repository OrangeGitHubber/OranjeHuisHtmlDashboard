import { useEffect, useState } from 'preact/hooks';
import { connectionStatus, disconnectedSince } from '../lib/ha/connection';

function formatElapsed(sinceMs: number): string {
  const s = Math.max(0, Math.floor((Date.now() - sinceMs) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function StatusBanner() {
  const status = connectionStatus.value;
  const [, setTick] = useState(0);

  useEffect(() => {
    if (status !== 'reconnecting') return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  if (status === 'reconnecting') {
    const since = disconnectedSince.value;
    return (
      <div class="banner banner-warn" role="status">
        Reconnecting to Home Assistant…{since !== null ? ` (${formatElapsed(since)})` : ''}
      </div>
    );
  }
  if (status === 'connecting') {
    return (
      <div class="banner banner-info" role="status">
        Connecting to Home Assistant…
      </div>
    );
  }
  return null;
}
