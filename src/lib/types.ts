export type { HassEntity, HassEntities } from 'home-assistant-js-websocket';

export interface CalendarInfo {
  entity_id: string;
  name: string;
}

export interface CalendarEvent {
  start: Date;
  end: Date;
  allDay: boolean;
  summary: string;
  description?: string;
  location?: string;
  calendarId: string;
  calendarName: string;
}
