import { useEffect, useState } from 'preact/hooks';
import styles from './elements.module.css';

/** System-time clock, aligned to the minute boundary so it never lags. */
export default function ClockCard() {
  const [now, setNow] = useState(() => new Date());

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

  return (
    <div class={`${styles.card} ${styles.clockCard}`}>
      <span class={styles.clockTime}>
        {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
      </span>
      <span class={styles.clockDate}>
        {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
      </span>
    </div>
  );
}
