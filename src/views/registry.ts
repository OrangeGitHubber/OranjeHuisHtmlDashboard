import type { FunctionComponent } from 'preact';

export interface ViewDef {
  /** hash route: #/<id> */
  id: string;
  title: string;
  /** 24x24 SVG path data, rendered with fill: currentColor */
  icon: string;
  load: () => Promise<{ default: FunctionComponent }>;
}

/**
 * Adding a view = one folder under src/views/ + one entry here.
 * Navigation and code splitting (each load() becomes its own chunk)
 * follow automatically.
 */
export const views: ViewDef[] = [
  {
    id: 'calendar',
    title: 'Agenda',
    icon: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zM5 7V5h14v2H5zm2 4h5v5H7v-5z',
    load: () => import('./calendar/CalendarView'),
  },
  {
    id: 'cameras',
    title: 'Cameras',
    icon: 'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z',
    load: () => import('./cameras/CamerasView'),
  },
  {
    id: 'people',
    title: 'People',
    icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    load: () => import('./people/PeopleView'),
  },
  // future views: rooms, automations, energy, weather, ...
];
