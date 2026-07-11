import { useEffect, useState } from 'preact/hooks';

/** pointermove deltas below this (px) are ignored as phantom events. Some
 *  TV/kiosk browsers emit pointermove with unchanged (or barely-changed)
 *  coordinates when a virtual cursor auto-hides/reveals, or fire a synthetic
 *  mousemove when an overlay's stacking changes — those would otherwise lift
 *  night dimming a few seconds after it starts. Real cursor motion clears
 *  this within a move or two; a physically stationary mouse never emits it. */
const MOVE_THRESHOLD_PX = 12;

/**
 * True when there has been no user input (pointer/touch/key/scroll) for
 * `timeoutMs`. Starts idle so a wall display dims immediately at boot.
 * Bumps are throttled to one timer reset per second.
 *
 * pointermove is special-cased: it only counts as activity when the pointer
 * has genuinely moved past MOVE_THRESHOLD_PX, so phantom moves (see above)
 * don't keep an always-on screen awake. Deliberate inputs (pointerdown,
 * touchstart, keydown, wheel) always count.
 */
export function useIdle(timeoutMs: number): boolean {
  const [idle, setIdle] = useState(true);

  useEffect(() => {
    let timer: number | undefined;
    let lastBump = 0;
    let lastX: number | null = null;
    let lastY: number | null = null;

    const wake = () => {
      const now = Date.now();
      if (now - lastBump < 1000) return; // throttle timer resets
      lastBump = now;
      setIdle(false);
      if (timer !== undefined) clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), timeoutMs);
    };

    const onMove = (e: PointerEvent) => {
      // the first move only establishes a baseline; a phantom move can't be
      // told from real motion without a previous position to measure against
      if (lastX === null || lastY === null) {
        lastX = e.clientX;
        lastY = e.clientY;
        return;
      }
      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      lastX = e.clientX;
      lastY = e.clientY;
      if (dist < MOVE_THRESHOLD_PX) return; // phantom / jitter — not activity
      wake();
    };

    const discrete = ['pointerdown', 'touchstart', 'keydown', 'wheel'];
    for (const ev of discrete) window.addEventListener(ev, wake, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      for (const ev of discrete) window.removeEventListener(ev, wake);
      window.removeEventListener('pointermove', onMove);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [timeoutMs]);

  return idle;
}
