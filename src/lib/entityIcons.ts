/**
 * State-independent icon name chains per domain, used for picker rows and
 * as the final fallback on entity cards — every entity gets SOME icon,
 * including integrations that ship no icon attribute (e.g. unraid sensors).
 */

const DOMAIN_ICONS: Record<string, string[]> = {
  light: ['mdi:lightbulb'],
  switch: ['mdi:toggle-switch-variant', 'mdi:toggle-switch'],
  input_boolean: ['mdi:toggle-switch-variant', 'mdi:toggle-switch'],
  lock: ['mdi:lock'],
  sensor: ['mdi:gauge'],
  binary_sensor: ['mdi:radiobox-marked'],
  camera: ['mdi:cctv'],
  media_player: ['mdi:speaker'],
  climate: ['mdi:thermostat'],
  person: ['mdi:account'],
  cover: ['mdi:window-shutter'],
  fan: ['mdi:fan'],
  vacuum: ['mdi:robot-vacuum'],
  weather: ['mdi:weather-partly-cloudy'],
  calendar: ['mdi:calendar'],
  scene: ['mdi:palette'],
  script: ['mdi:script-text'],
  button: ['mdi:gesture-tap-button'],
  automation: ['mdi:robot'],
  device_tracker: ['mdi:cellphone'],
  update: ['mdi:package-up'],
};

/** Icon chain for an entity id, optionally led by a registry/user icon. */
export function domainIconNames(entityId: string, regIcon?: string | null): string[] {
  const domain = entityId.split('.')[0];
  const names: string[] = [];
  if (regIcon && regIcon.startsWith('mdi:')) names.push(regIcon);
  names.push(...(DOMAIN_ICONS[domain] ?? []));
  names.push('mdi:shape');
  return names;
}
