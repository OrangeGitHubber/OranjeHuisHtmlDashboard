import { useEffect, useState } from 'preact/hooks';
import { subscribeForecast, type ForecastItem } from '../../../lib/ha/forecast';

export function useForecast(
  entityId: string | null,
  type: 'daily' | 'hourly',
  enabled: boolean,
): { forecast: ForecastItem[]; error: boolean } {
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    setForecast([]);
    setError(false);
    if (!entityId || !enabled) return;
    return subscribeForecast(
      entityId,
      type,
      (items) => {
        setForecast(items);
        setError(false);
      },
      () => setError(true),
    );
  }, [entityId, type, enabled]);

  return { forecast, error };
}
