import opt from '../components/options.module.css';

/** Shared per-bucket font-size control for discrete-size-preset widgets'
    options editors (weather/presence/calendar) — one number input per
    bucket, plus a "Reset to defaults" button that appears once any value
    diverges from its default. */
export function FontSizeRow<B extends string>({
  label,
  buckets,
  sizes,
  defaults,
  onChange,
  onReset,
  hint,
}: {
  label: string;
  buckets: { key: B; label: string }[];
  sizes: Record<B, number>;
  defaults: Record<B, number>;
  onChange: (bucket: B, v: number) => void;
  onReset: () => void;
  hint?: string;
}) {
  const isDefault = buckets.every(({ key }) => sizes[key] === defaults[key]);
  return (
    <div class={opt.row}>
      {label}
      <div class={opt.seg}>
        {buckets.map(({ key, label: bLabel }) => (
          <label
            key={key}
            title={bLabel}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
          >
            <span style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>{key}</span>
            <input
              type="number"
              class={opt.num}
              style={{ width: 56 }}
              min={6}
              max={72}
              value={sizes[key]}
              onChange={(e) => {
                const v = Number((e.target as HTMLInputElement).value);
                onChange(key, Number.isFinite(v) ? v : defaults[key]);
              }}
            />
          </label>
        ))}
      </div>
      {!isDefault && (
        <button class={opt.segBtn} style={{ justifySelf: 'start' }} onClick={onReset}>
          Reset to defaults
        </button>
      )}
      {hint && <span class={opt.dim}>{hint}</span>}
    </div>
  );
}
