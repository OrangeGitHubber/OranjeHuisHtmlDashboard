import type { UnsubscribeFunc } from 'home-assistant-js-websocket';
import { getConnection } from './connection';

export interface ForecastItem {
  datetime: string;
  condition?: string;
  temperature?: number;
  templow?: number;
  precipitation_probability?: number;
  precipitation?: number;
  wind_speed?: number;
  humidity?: number;
}

/**
 * Live forecast subscription (HA 2024.4+ removed forecast attributes).
 * `resubscribe: true` makes the library replay the subscription after any
 * reconnect, so a wall display's forecast heals itself across HA restarts.
 */
export function subscribeForecast(
  entityId: string,
  forecastType: 'daily' | 'hourly',
  cb: (forecast: ForecastItem[]) => void,
  onError?: (err: unknown) => void,
): () => void {
  let unsub: UnsubscribeFunc | null = null;
  let dead = false;

  getConnection()
    .then((conn) =>
      conn.subscribeMessage<{ forecast: ForecastItem[] | null }>(
        (msg) => cb(msg.forecast ?? []),
        { type: 'weather/subscribe_forecast', entity_id: entityId, forecast_type: forecastType },
        { resubscribe: true },
      ),
    )
    .then((u) => {
      if (dead) u();
      else unsub = u;
    })
    .catch((err) => {
      if (!dead) onError?.(err);
    });

  return () => {
    dead = true;
    if (unsub) {
      unsub();
      unsub = null;
    }
  };
}
