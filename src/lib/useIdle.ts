import { useEffect, useState } from 'preact/hooks';

/**
 * True when there has been no user input (pointer/touch/key/scroll) for
 * `timeoutMs`. Starts idle so a wall display dims immediately at boot.
 * Events are throttled to one timer reset per second.
 */
export function useIdle(timeoutMs: number): boolean {
  const [idle, setIdle] = useState(true);

  useEffect(() => {
    let timer: number | undefined;
    let lastBump = 0;
    const bump = () => {
      const now = Date.now();
      if (now - lastBump < 1000) return;
      lastBump = now;
      setIdle(false);
      if (timer !== undefined) clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), timeoutMs);
    };
    const events = ['pointerdown', 'pointermove', 'touchstart', 'keydown', 'wheel'];
    for (const e of events) window.addEventListener(e, bump, { passive: true });
    return () => {
      for (const e of events) window.removeEventListener(e, bump);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [timeoutMs]);

  return idle;
}
