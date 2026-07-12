/** Default per-widget text-size multiplier, as a percent (100 = the
    hand-calibrated bucket defaults, unscaled). */
export const DEFAULT_FONT_SCALE = 100;

/** Per-widget text-size option (a percent, 50–200) → a multiplier applied to
    a discrete-preset widget's calibrated bucket sizes. One knob scales every
    bucket together, so text still auto-fits the widget's rendered size (the
    bucket picks the base) while the user nudges it all bigger/smaller. Shared
    by weather / presence / calendar. */
export function fontScaleOf(v: unknown): number {
  const pct =
    typeof v === 'number' && Number.isFinite(v)
      ? Math.min(Math.max(Math.round(v), 50), 200)
      : DEFAULT_FONT_SCALE;
  return pct / 100;
}
