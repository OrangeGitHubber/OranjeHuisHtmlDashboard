import { signal } from '@preact/signals';

/**
 * One shared minute tick for the whole app: components that render relative
 * times ("for 2 h") read this signal so a single timer updates them all.
 */
export const minuteTick = signal(Date.now());

setInterval(() => {
  minuteTick.value = Date.now();
}, 60_000);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) minuteTick.value = Date.now();
});

export function relativeSince(iso: string, now: number): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return '';
  const mins = Math.floor((now - then) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `for ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `for ${hours} h`;
  return `for ${Math.floor(hours / 24)} d`;
}
