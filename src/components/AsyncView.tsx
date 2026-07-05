import { useEffect, useState } from 'preact/hooks';
import type { FunctionComponent } from 'preact';
import { Spinner } from './Spinner';

type Loader = () => Promise<{ default: FunctionComponent }>;

const moduleCache = new Map<Loader, FunctionComponent>();

/** Route-level code splitting: renders a lazily imported view. */
export function AsyncView({ load }: { load: Loader }) {
  const [Comp, setComp] = useState<FunctionComponent | null>(() => moduleCache.get(load) ?? null);

  useEffect(() => {
    if (moduleCache.has(load)) {
      setComp(() => moduleCache.get(load)!);
      return;
    }
    let alive = true;
    load().then((mod) => {
      moduleCache.set(load, mod.default);
      if (alive) setComp(() => mod.default);
    });
    return () => {
      alive = false;
    };
  }, [load]);

  return Comp ? (
    <Comp />
  ) : (
    <div class="view-loading">
      <Spinner />
    </div>
  );
}
