import styles from './screensaver.module.css';

/**
 * Full-screen swirling screensaver shown during the night window (see Shell).
 * Purpose is burn-in protection for always-on wall displays: an opaque black
 * field fully covers the static dashboard, and slowly-moving, blurred colour
 * layers keep the only lit pixels drifting so nothing stays lit in place.
 *
 * Pure CSS animation (compositor-driven, no rAF loop) so it can run all night
 * on a TV without spinning the CPU. `brightness`/`speed` feed CSS custom
 * properties; `intensity` trades visual richness for GPU cost — the two
 * heaviest effects (large blur radii and mix-blend-mode) are the ones a weak
 * GPU like a Raspberry Pi's chokes on, so lower levels render fewer, smaller,
 * less-blurred layers and drop the blend mode entirely (see
 * screensaver.module.css). Layer count is reduced here (not just hidden in
 * CSS) so the compositor never allocates the extra layers at all.
 */
export function Screensaver({
  brightness,
  speed,
  intensity,
}: {
  brightness: number;
  speed: number;
  intensity: 'low' | 'medium' | 'high';
}) {
  const vars = {
    // 5–80 (%) → 0.05–0.80 opacity on the swirl layers
    '--ss-bright': String(Math.min(Math.max(brightness, 5), 80) / 100),
    // 1–10 → animation-duration divisor (higher = shorter durations = faster)
    '--ss-speed': String(Math.min(Math.max(speed, 1), 10)),
  } as Record<string, string>;

  return (
    <div class={styles.screensaver} style={vars} data-intensity={intensity} aria-hidden="true">
      <div class={styles.swirl}>
        <div class={styles.disc} />
        {intensity !== 'low' && <div class={`${styles.blob} ${styles.blob1}`} />}
        {intensity !== 'low' && <div class={`${styles.blob} ${styles.blob2}`} />}
        {intensity === 'high' && <div class={`${styles.blob} ${styles.blob3}`} />}
      </div>
    </div>
  );
}
