/**
 * Lazy access to the full Material Design Icons set (@mdi/js) — the same
 * icon library Home Assistant uses, so cards can show exactly the icon
 * configured in HA (entity attributes.icon, e.g. "mdi:sofa-single").
 * The set is large, so it loads as its own chunk on first use and is
 * cached by the browser afterwards.
 */

let icons: Record<string, unknown> | null = null;
let loading: Promise<void> | null = null;

export function mdiReady(): boolean {
  return icons !== null;
}

export function ensureMdi(): Promise<void> {
  if (!loading) {
    loading = import('@mdi/js').then((m) => {
      icons = m as unknown as Record<string, unknown>;
    });
  }
  return loading;
}

/** 'mdi:lightbulb-outline' → path data, once loaded; undefined otherwise. */
export function mdiPath(name: string): string | undefined {
  if (!icons || !name.startsWith('mdi:')) return undefined;
  const key =
    'mdi' +
    name
      .slice(4)
      .split(/[-_]/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('');
  const path = icons[key];
  return typeof path === 'string' ? path : undefined;
}
