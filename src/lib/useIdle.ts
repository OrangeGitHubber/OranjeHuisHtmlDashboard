import { useEffect, useState } from 'preact/hooks';

/*
 * pointermove is the ambiguous input: TV/kiosk browsers emit *phantom* moves
 * — a virtual cursor auto-hiding/revealing, a synthetic mousemove when an
 * overlay's stacking changes, or a mechanical cursor flicker between two
 * positions — none of which mean a person is there. A physically stationary
 * mouse on a laptop never emits them, which is why dimming only broke on the
 * TV. Filtering by a single-move distance wasn't enough (a flicker jumps far
 * enough to look like real movement), so we require *sustained* movement:
 * real human motion is a stream of many events spread over time, whereas a
 * phantom is an isolated blip or a tight single-frame burst.
 */
const MOVE_MIN_PX = 5; // per-event delta below this doesn't count as movement
// Human movement is a *dense, unbroken* stream of events; a phantom is a
// burst (or a few bursts) separated by gaps. So track one continuous run:
// any gap longer than RUN_MAX_GAP_MS starts a new run, and only a run that
// stays unbroken for RUN_MIN_MS with RUN_MIN_COUNT events counts as real.
// This rejects both a single tight burst (span ~0) and repeated spaced
// bursts (each gap resets the run), which count-over-a-window did not.
const RUN_MAX_GAP_MS = 150; // a gap larger than this breaks the run
const RUN_MIN_MS = 300; // a run must stay unbroken at least this long…
const RUN_MIN_COUNT = 6; // …and carry at least this many movement events

/**
 * True when there has been no genuine user input for `timeoutMs`. Starts idle
 * so a wall display dims immediately at boot. Bumps are throttled to one timer
 * reset per second.
 *
 * Deliberate inputs (pointerdown, touchstart, keydown, wheel) wake it
 * instantly. pointermove only wakes it on sustained movement (see above), so
 * phantom pointer events on an always-on screen can't keep it awake.
 */
export function useIdle(timeoutMs: number): boolean {
  const [idle, setIdle] = useState(true);

  useEffect(() => {
    let timer: number | undefined;
    let lastBump = 0;
    let lastX: number | null = null;
    let lastY: number | null = null;
    let runStart = 0; // when the current unbroken movement run began
    let runCount = 0; // movement events in the current run
    let lastMove = 0; // timestamp of the previous movement event

    const wake = () => {
      const now = Date.now();
      if (now - lastBump < 1000) return; // throttle timer resets
      lastBump = now;
      setIdle(false);
      if (timer !== undefined) clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), timeoutMs);
    };

    const onMove = (e: PointerEvent) => {
      const now = Date.now();
      // first move only establishes a baseline; a phantom can't be told from
      // real motion without a previous position to measure against
      if (lastX === null || lastY === null) {
        lastX = e.clientX;
        lastY = e.clientY;
        return;
      }
      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      lastX = e.clientX;
      lastY = e.clientY;
      if (dist < MOVE_MIN_PX) return; // too small to be deliberate movement

      // a gap since the last movement event breaks the run (bursts don't chain)
      if (now - lastMove > RUN_MAX_GAP_MS) {
        runStart = now;
        runCount = 1;
      } else {
        runCount += 1;
      }
      lastMove = now;
      // only an unbroken run of real length + density counts as a person
      if (now - runStart >= RUN_MIN_MS && runCount >= RUN_MIN_COUNT) wake();
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
