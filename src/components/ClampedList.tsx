import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';

/**
 * Renders `items` inside a height-clamped box instead of letting whatever
 * doesn't fit visually spill past it. Every item stays mounted at all times
 * (nothing is removed from the DOM) — only a trailing "+N more" pill is
 * added or removed — so re-measuring on resize (grow or shrink) is always
 * accurate against the full set, not just whatever happened to be rendered
 * last time.
 *
 * Tapping the pill reveals everything with an internal scroll (the box
 * itself never grows past its own allotted space) and swaps to a "show
 * fewer" pill to collapse back.
 */
export function ClampedList({
  items,
  moreLabel,
  fewerLabel,
  class: className,
  pillClass,
  bucket,
  onResize,
}: {
  /** one element per item, in render order (each needs its own `key`) */
  items: JSX.Element[];
  /** label for the "show more" pill, given how many items are hidden */
  moreLabel: (hiddenCount: number) => string;
  fewerLabel: string;
  class: string;
  pillClass: string;
  /** discrete size-preset bucket (see dayBucket() in WeekCalendar.tsx),
      rendered as a `data-bucket` attribute for CSS to key off — this
      component owns the only ref on its root, so a caller that needs its
      rendered width for bucketing has no other way to measure it */
  bucket?: string;
  /** fires whenever the root element's size changes; independent of the
      item-fit ResizeObserver below since that one skips measuring while
      expanded, but width (what bucketing needs) doesn't change with it */
  onResize?: (width: number, height: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [expanded, setExpanded] = useState(false);
  const count = items.length;

  // a changed item list (new day, refreshed events) starts collapsed again
  useLayoutEffect(() => {
    setExpanded(false);
  }, [count]);

  // overflow:hidden clips from the current scroll offset, not from the top —
  // without this, collapsing after having scrolled down would show whatever
  // was last scrolled to instead of the first items
  useLayoutEffect(() => {
    if (!expanded && ref.current) ref.current.scrollTop = 0;
  }, [expanded]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;

    const measure = () => {
      const nodes = Array.from(el.children).slice(0, count) as HTMLElement[];
      if (nodes.length === 0) {
        setVisibleCount(0);
        return;
      }
      const available = el.clientHeight;
      const gap = parseFloat(getComputedStyle(el).rowGap) || 0;

      const fitting = (budget: number) => {
        let used = 0;
        let n = 0;
        for (const node of nodes) {
          const next = used + (n > 0 ? gap : 0) + node.offsetHeight;
          if (n > 0 && next > budget) break;
          used = next;
          n++;
        }
        return n;
      };

      let n = fitting(available);
      if (n < nodes.length) {
        // won't all fit — reserve room for the pill and recount, so it
        // never overlaps the last fully-visible item
        n = Math.max(fitting(available - gap - PILL_HEIGHT_PX), 1);
      }
      setVisibleCount(n);
    };

    measure();
    const ro = new ResizeObserver(measure);
    // watch the container (it resizing is the common case — e.g. the widget
    // being resized in the page editor) AND every item (covers the case
    // where the container's own size doesn't change but an item's rendered
    // height does, e.g. the Display Scale slider changing font size without
    // changing the fixed grid-cell box around it)
    ro.observe(el);
    for (const node of Array.from(el.children).slice(0, count)) ro.observe(node);
    return () => ro.disconnect();
  }, [items, count, expanded]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !onResize) return;
    const report = () => onResize(el.clientWidth, el.clientHeight);
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onResize]);

  const hidden = count - visibleCount;

  return (
    <div
      ref={ref}
      class={className}
      data-bucket={bucket}
      style={{ position: 'relative', overflowY: expanded ? 'auto' : 'hidden' }}
    >
      {items}
      {!expanded && hidden > 0 && (
        <button type="button" class={pillClass} onClick={() => setExpanded(true)}>
          {moreLabel(hidden)}
        </button>
      )}
      {expanded && hidden > 0 && (
        <button type="button" class={pillClass} onClick={() => setExpanded(false)}>
          {fewerLabel}
        </button>
      )}
    </div>
  );
}

/** must stay in sync with the pill's CSS (padding + line-height) */
const PILL_HEIGHT_PX = 28;
