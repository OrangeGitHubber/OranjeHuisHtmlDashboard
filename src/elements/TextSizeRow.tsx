import opt from '../components/options.module.css';
import { DEFAULT_FONT_SCALE } from '../lib/fontSizePresets';

/** Single per-widget text-size knob (replaces the old four per-bucket
    inputs). The widget still auto-fits its text to its rendered size via its
    size buckets; this scales all of those sizes up or down together. */
export function TextSizeRow({
  scale,
  onChange,
}: {
  scale: number;
  onChange: (pct: number) => void;
}) {
  return (
    <label class={opt.row}>
      Text size · {scale}%
      <input
        type="range"
        min={50}
        max={200}
        step={5}
        value={scale}
        onInput={(e) => onChange(Number((e.target as HTMLInputElement).value))}
      />
      <span class={opt.dim}>
        The widget auto-fits its text to its size; this scales everything up or down together
        ({DEFAULT_FONT_SCALE}% = default).
      </span>
    </label>
  );
}
