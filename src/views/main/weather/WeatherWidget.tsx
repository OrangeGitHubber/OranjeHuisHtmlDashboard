import { useEntity } from '../../../lib/ha/entities';
import { settings } from '../../../lib/settings';
import { useForecast } from './useForecast';
import { conditionIcon, conditionLabel } from './weatherIcons';
import type { ForecastItem } from '../../../lib/ha/forecast';
import type { ElementProps } from '../../../grid/elements';
import styles from './weather.module.css';

const SUPPORTS_DAILY = 1;
const SUPPORTS_HOURLY = 2;

function fmt(n: number | undefined, digits = 0): string {
  return n === undefined || n === null || isNaN(n) ? '–' : n.toFixed(digits);
}

function hourLabel(item: ForecastItem): string {
  const d = new Date(item.datetime);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString(undefined, { hour: 'numeric' });
}

function dayLabel(item: ForecastItem, index: number): string {
  if (index === 0) return 'Today';
  const d = new Date(item.datetime);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { weekday: 'short' });
}

export default function WeatherWidget({ element }: ElementProps) {
  // per-instance entity, falling back to the legacy global setting
  const own = element.options?.entityId;
  const entityId =
    typeof own === 'string' && own ? own : settings.value.weather.entityId;
  const entitySig = useEntity(entityId ?? '__none__');
  const entity = entityId ? entitySig.value : undefined;

  const features = (entity?.attributes.supported_features as number | undefined) ?? 0;
  const available = !!entity && entity.state !== 'unavailable';
  const { forecast: daily } = useForecast(
    entityId,
    'daily',
    available && (features & SUPPORTS_DAILY) !== 0,
  );
  const { forecast: hourly } = useForecast(
    entityId,
    'hourly',
    available && (features & SUPPORTS_HOURLY) !== 0,
  );

  if (!entityId) {
    return (
      <div class={styles.card}>
        <h2 class={styles.title}>Weather</h2>
        <div class={styles.hint}>
          <p>No weather entity selected — tap this card in page edit mode to pick one.</p>
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div class={styles.card}>
        <h2 class={styles.title}>Weather</h2>
        <p class={styles.hintText}>
          Entity <code>{entityId}</code> was not found in Home Assistant.
        </p>
      </div>
    );
  }

  const a = entity.attributes;
  const unit = (a.temperature_unit as string | undefined) ?? '°';
  const windUnit = (a.wind_speed_unit as string | undefined) ?? '';

  return (
    <div class={styles.card}>
      <h2 class={styles.title}>Weather</h2>

      <div class={styles.current}>
        <div class={styles.currentIcon}>{conditionIcon(entity.state, 54)}</div>
        <div class={styles.currentMain}>
          <span class={styles.temp}>
            {fmt(a.temperature as number | undefined)}
            <span class={styles.tempUnit}>{unit}</span>
          </span>
          <span class={styles.condition}>
            {a.apparent_temperature !== undefined &&
              `Feels like ${fmt(a.apparent_temperature as number)}${unit} · `}
            {conditionLabel(entity.state)}
          </span>
        </div>
        <dl class={styles.details}>
          {a.humidity !== undefined && (
            <div>
              <dt>Humidity</dt>
              <dd>{fmt(a.humidity as number)}%</dd>
            </div>
          )}
          {a.wind_speed !== undefined && (
            <div>
              <dt>Wind</dt>
              <dd>
                {fmt(a.wind_speed as number)} {windUnit}
              </dd>
            </div>
          )}
          {a.pressure !== undefined && (
            <div>
              <dt>Pressure</dt>
              <dd>
                {fmt(a.pressure as number)} {(a.pressure_unit as string | undefined) ?? ''}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {daily.length > 0 && (
        <div class={styles.dailyRow}>
          {daily.slice(0, 7).map((d, i) => (
            <div key={d.datetime} class={styles.dailyItem}>
              <span class={styles.dailyDay}>{dayLabel(d, i)}</span>
              {conditionIcon(d.condition, 26)}
              <span class={styles.dailyTemp}>
                {fmt(d.temperature)}°<span class={styles.dailyLow}> {fmt(d.templow)}°</span>
              </span>
              {d.precipitation_probability !== undefined && d.precipitation_probability > 0 ? (
                <span class={styles.precip}>💧{fmt(d.precipitation_probability)}%</span>
              ) : (
                <span class={styles.precip}>{' '}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {hourly.length > 0 && (
        <div class={styles.hourlyScroll}>
          <div class={styles.hourlyRow}>
            {hourly.slice(0, 12).map((h) => (
              <div key={h.datetime} class={styles.hourlyItem}>
                <span class={styles.hourlyHour}>{hourLabel(h)}</span>
                {conditionIcon(h.condition, 20)}
                <span class={styles.hourlyTemp}>{fmt(h.temperature)}°</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
