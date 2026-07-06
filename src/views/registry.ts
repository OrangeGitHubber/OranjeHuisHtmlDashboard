import type { FunctionComponent } from 'preact';

export interface ViewDef {
  /** hash route: #/<id> */
  id: string;
  title: string;
  /** 24x24 SVG path data, rendered with fill: currentColor */
  icon: string;
  load: () => Promise<{ default: FunctionComponent }>;
  /** routable but not shown in the main nav list (e.g. settings) */
  hidden?: boolean;
}

export const GEAR_ICON =
  'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z';

const stub = (title: string) => () =>
  import('./StubView').then((m) => ({ default: m.makeStub(title) }));

/**
 * Adding a view = one folder under src/views/ + one entry here.
 * Navigation and code splitting (each load() becomes its own chunk)
 * follow automatically.
 */
export const views: ViewDef[] = [
  {
    id: 'main',
    title: 'Main',
    icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    load: () => import('./main/MainView'),
  },
  {
    id: 'floor1',
    title: '1st Floor',
    icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2V9h-2V7h4v10z',
    load: stub('1st Floor'),
  },
  {
    id: 'floor2',
    title: '2nd Floor',
    icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4 8c0 1.1-.9 2-2 2h-2v2h4v2H9v-4c0-1.1.9-2 2-2h2V9H9V7h4c1.1 0 2 .9 2 2v2z',
    load: stub('2nd Floor'),
  },
  {
    id: 'outside',
    title: 'Outside',
    icon: 'M13 16.12c3.47-.41 6.17-3.36 6.17-6.95 0-3.87-3.13-7-7-7s-7 3.13-7 7c0 3.47 2.52 6.34 5.83 6.89V20H5v2h14v-2h-6v-3.88z',
    load: stub('Outside'),
  },
  {
    id: 'cameras',
    title: 'Cameras',
    icon: 'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z',
    load: () => import('./cameras/CamerasView'),
  },
  {
    id: 'automations',
    title: 'Automations',
    icon: 'M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z',
    load: stub('Automations'),
  },
  {
    id: 'stats',
    title: 'Stats',
    icon: 'M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z',
    load: stub('Stats'),
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: GEAR_ICON,
    hidden: true,
    load: () => import('./settings/SettingsView'),
  },
];
