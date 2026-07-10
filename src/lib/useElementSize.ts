import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { Ref } from 'preact';

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * Live width/height of a DOM element via ResizeObserver. Attach the
 * returned `ref` to the element to measure; `size` starts at {0,0} until
 * the first observation fires (synchronous on mount in practice).
 *
 * Used for discrete size-preset widgets (see weather/presence/calendar):
 * each widget buckets these raw pixel dimensions into a small, named set
 * of layouts with hand-tuned fixed CSS per bucket, instead of one
 * continuous cqi/cqb formula trying to hold for every possible size.
 */
export function useElementSize<T extends HTMLElement>(): { ref: Ref<T>; size: ElementSize } {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, size };
}
