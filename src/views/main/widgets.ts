import type { FunctionComponent } from 'preact';

export interface WidgetDef {
  type: string;
  /** label shown in the Settings widget list */
  title: string;
  /** spans the whole grid width */
  fullWidth: boolean;
  load: () => Promise<{ default: FunctionComponent }>;
}

/**
 * Main-screen widget registry. A new widget = one entry here + a component
 * folder; users enable/order it in Settings. Future types (clock, favorite
 * cameras, birthdays, holidays, stats) plug in the same way.
 */
export const widgetDefs: Record<string, WidgetDef> = {
  calendar: {
    type: 'calendar',
    title: 'Week calendar',
    fullWidth: true,
    load: () => import('./WeekCalendar').then((m) => ({ default: m.WeekCalendar })),
  },
  weather: {
    type: 'weather',
    title: 'Weather',
    fullWidth: false,
    load: () => import('./weather/WeatherWidget'),
  },
  presence: {
    type: 'presence',
    title: 'Family presence',
    fullWidth: false,
    load: () => import('./presence/PresenceWidget'),
  },
};
