/** Clamps a user-supplied font-size option to a sane px range, falling back
    when missing/invalid (e.g. corrupted JSON, a stray string). Shared by
    every discrete-size-preset widget's options (weather/presence/calendar). */
export function sanitizeFontSize(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(Math.max(Math.round(v), 6), 72) : fallback;
}
