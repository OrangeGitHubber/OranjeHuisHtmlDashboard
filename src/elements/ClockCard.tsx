import { useEffect, useRef, useState } from 'preact/hooks';
import type { ElementProps } from '../grid/elements';
import type { ClockOptions } from './ClockOptionsEditor';
import styles from './elements.module.css';

const FONT_SIZES: Record<string, string> = {
  s: '1.5rem',
  m: '2.4rem',
  l: '3.8rem',
  xl: '5.5rem',
};

/** System-time clock, aligned to the minute boundary so it never lags. */
export default function ClockCard({ element }: ElementProps) {
  const o = (element.options ?? {}) as ClockOptions;
  const [now, setNow] = useState(() => new Date());
  const cardRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    let interval: number | undefined;
    const align = setTimeout(() => {
      setNow(new Date());
      interval = window.setInterval(() => setNow(new Date()), 60_000);
    }, 60_000 - (Date.now() % 60_000));
    const onVis = () => {
      if (!document.hidden) setNow(new Date());
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearTimeout(align);
      if (interval !== undefined) clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // measure the card for auto font scaling (container-query units proved
  // unreliable on some kiosk browsers)
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const autoPx = Math.min(Math.max(width * 0.17, 20), 120);
  const timeStyle: Record<string, string> = {
    fontSize: o.size && FONT_SIZES[o.size] ? FONT_SIZES[o.size] : `${Math.round(autoPx)}px`,
  };
  if (typeof o.color === 'string' && o.color) timeStyle.color = o.color;

  return (
    <div ref={cardRef} class={`${styles.card} ${styles.clockCard}`}>
      <span class={styles.clockTime} style={timeStyle}>
        {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
      </span>
      <span class={styles.clockDate}>
        {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
      </span>
    </div>
  );
}
