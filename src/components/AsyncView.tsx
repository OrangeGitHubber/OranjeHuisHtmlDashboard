import { useEffect, useState } from 'preact/hooks';
import type { FunctionComponent } from 'preact';
import { Spinner } from './Spinner';

// <any>: loaders return components with heterogeneous props
type AnyComponent = FunctionComponent<any>;
type Loader = () => Promise<{ default: AnyComponent }>;

const moduleCache = new Map<Loader, AnyComponent>();

/**
 * Route-level code splitting: renders a lazily imported view.
 * `load` must be a module-level constant — the cache is keyed on its identity.
 */
export function AsyncView({ load, props }: { load: Loader; props?: Record<string, unknown> }) {
  const [Comp, setComp] = useState<AnyComponent | null>(() => moduleCache.get(load) ?? null);

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
    <Comp {...props} />
  ) : (
    <div class="view-loading">
      <Spinner />
    </div>
  );
}
