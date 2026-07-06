import type { JSX } from 'preact';

/**
 * Inline icons for HA weather condition strings. One shared set of ~9 glyphs;
 * colors come from theme tokens so they follow light/dark.
 */

const SUN = '#e9b949';
const CLOUD = 'var(--text-dim)';
const DROP = '#6aa9e0';
const SNOW = '#9fc6e8';
const BOLT = '#e9b949';

type G = () => JSX.Element;

const Sun: G = () => (
  <g>
    <circle cx="12" cy="12" r="4.5" fill={SUN} />
    <g stroke={SUN} stroke-width="1.8" stroke-linecap="round">
      <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6" />
    </g>
  </g>
);

const Moon: G = () => (
  <path
    d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"
    fill={SUN}
    opacity="0.9"
  />
);

const cloudPath = 'M7 18a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17 8.6 4.2 4.2 0 0 1 16.8 17H7z';

const Cloud: G = () => <path d={cloudPath} fill={CLOUD} />;

const PartlyCloudy: G = () => (
  <g>
    <circle cx="16.5" cy="7.5" r="3.4" fill={SUN} />
    <path d={cloudPath} fill={CLOUD} transform="translate(-1 2) scale(0.92)" />
  </g>
);

const drops = (heavy: boolean) => (
  <g stroke={DROP} stroke-width="1.8" stroke-linecap="round">
    <path d="M8.5 19.5l-.8 2M12.5 19.5l-.8 2M16.5 19.5l-.8 2" />
    {heavy && <path d="M10.5 22l-.5 1.4M14.5 22l-.5 1.4" />}
  </g>
);

const Rainy: G = () => (
  <g transform="translate(0 -2)">
    <path d={cloudPath} fill={CLOUD} />
    {drops(false)}
  </g>
);

const Pouring: G = () => (
  <g transform="translate(0 -2)">
    <path d={cloudPath} fill={CLOUD} />
    {drops(true)}
  </g>
);

const Snowy: G = () => (
  <g transform="translate(0 -2)">
    <path d={cloudPath} fill={CLOUD} />
    <g fill={SNOW}>
      <circle cx="8.5" cy="20.3" r="1.15" />
      <circle cx="12.5" cy="21.6" r="1.15" />
      <circle cx="16.5" cy="20.3" r="1.15" />
    </g>
  </g>
);

const Storm: G = () => (
  <g transform="translate(0 -2)">
    <path d={cloudPath} fill={CLOUD} />
    <path d="M12.6 18l-2.8 4h2l-1 3.4 3.6-4.6h-2.1l1.6-2.8z" fill={BOLT} />
  </g>
);

const Fog: G = () => (
  <g>
    <path d={cloudPath} fill={CLOUD} opacity="0.7" transform="translate(0 -3) scale(0.9)" />
    <g stroke={CLOUD} stroke-width="1.8" stroke-linecap="round">
      <path d="M5 17.5h14M7 20.5h10" />
    </g>
  </g>
);

const Windy: G = () => (
  <g stroke={CLOUD} stroke-width="1.9" stroke-linecap="round" fill="none">
    <path d="M3 9h10.5a2.6 2.6 0 1 0-2.6-2.6" />
    <path d="M3 13.5h15a2.6 2.6 0 1 1-2.6 2.6" />
    <path d="M3 18h8" />
  </g>
);

const GLYPHS: Record<string, G> = {
  'sunny': Sun,
  'clear-night': Moon,
  'partlycloudy': PartlyCloudy,
  'cloudy': Cloud,
  'rainy': Rainy,
  'pouring': Pouring,
  'lightning': Storm,
  'lightning-rainy': Storm,
  'snowy': Snowy,
  'snowy-rainy': Snowy,
  'hail': Snowy,
  'fog': Fog,
  'windy': Windy,
  'windy-variant': Windy,
  'exceptional': Cloud,
};

const LABELS: Record<string, string> = {
  'sunny': 'Sunny',
  'clear-night': 'Clear',
  'partlycloudy': 'Partly cloudy',
  'cloudy': 'Cloudy',
  'rainy': 'Rain',
  'pouring': 'Heavy rain',
  'lightning': 'Thunderstorm',
  'lightning-rainy': 'Thunderstorm',
  'snowy': 'Snow',
  'snowy-rainy': 'Sleet',
  'hail': 'Hail',
  'fog': 'Fog',
  'windy': 'Windy',
  'windy-variant': 'Windy',
  'exceptional': 'Alert',
};

export function conditionIcon(condition: string | undefined, size = 24): JSX.Element {
  const Glyph = GLYPHS[condition ?? ''] ?? Cloud;
  return (
    <svg viewBox="0 0 24 26" width={size} height={size} aria-hidden="true">
      <Glyph />
    </svg>
  );
}

export function conditionLabel(condition: string | undefined): string {
  if (!condition) return '';
  return LABELS[condition] ?? condition.replace(/-/g, ' ');
}
