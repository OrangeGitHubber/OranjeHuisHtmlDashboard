import { useEffect, useState } from 'preact/hooks';
import { ensureMdi, mdiReady, mdiPath } from '../lib/mdi';

/**
 * Renders the first resolvable mdi: name from `names`; falls back to
 * `fallbackPath` (raw path data) until the mdi chunk has loaded or when
 * no name matches.
 */
export function MdiIcon({
  names,
  fallbackPath,
  class: cls,
  style,
}: {
  names: string[];
  fallbackPath?: string;
  class?: string;
  style?: Record<string, string>;
}) {
  const [, setReady] = useState(mdiReady());

  useEffect(() => {
    let alive = true;
    ensureMdi().then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  let d: string | undefined;
  for (const n of names) {
    d = mdiPath(n);
    if (d) break;
  }
  d = d ?? fallbackPath;
  if (!d) return null;

  return (
    <svg class={cls} style={style} viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} fill="currentColor" />
    </svg>
  );
}
