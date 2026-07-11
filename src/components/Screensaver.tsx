import styles from './screensaver.module.css';

/**
 * Full-screen swirling screensaver shown during the night window (see Shell).
 * Purpose is burn-in protection for always-on wall displays: an opaque black
 * field fully covers the static dashboard, and slowly-moving, blurred colour
 * layers keep the only lit pixels drifting so nothing stays lit in place.
 *
 * Pure CSS animation (compositor-driven, no rAF loop) so it can run all night
 * on a TV without spinning the CPU. `brightness` and `speed` come from global
 * settings and feed CSS custom properties consumed by screensaver.module.css.
 */
export function Screensaver({ brightness, speed }: { brightness: number; speed: number }) {
  const vars = {
    // 5–80 (%) → 0.05–0.80 opacity on the swirl layers
    '--ss-bright': String(Math.min(Math.max(brightness, 5), 80) / 100),
    // 1–10 → animation-duration divisor (higher = shorter durations = faster)
    '--ss-speed': String(Math.min(Math.max(speed, 1), 10)),
  } as Record<string, string>;

  return (
    <div class={styles.screensaver} style={vars} aria-hidden="true">
      <div class={styles.swirl}>
        <div class={styles.disc} />
        <div class={`${styles.blob} ${styles.blob1}`} />
        <div class={`${styles.blob} ${styles.blob2}`} />
        <div class={`${styles.blob} ${styles.blob3}`} />
      </div>
    </div>
  );
}
