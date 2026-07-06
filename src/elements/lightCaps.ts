import type { HassEntity } from '../lib/types';

/**
 * What a light can do, derived from attributes.supported_color_modes.
 * https://developers.home-assistant.io/docs/core/entity/light/#color-modes
 */
export interface LightCaps {
  brightness: boolean;
  colorTemp: boolean;
  color: boolean;
}

const COLOR_MODES = ['hs', 'rgb', 'rgbw', 'rgbww', 'xy'];

export function lightCaps(entity: HassEntity): LightCaps {
  const raw = entity.attributes.supported_color_modes;
  const modes: string[] = Array.isArray(raw) ? raw.filter((m) => typeof m === 'string') : [];
  const color = modes.some((m) => COLOR_MODES.includes(m));
  const colorTemp = modes.includes('color_temp');
  // any color mode implies dimmable
  const brightness = color || colorTemp || modes.includes('brightness');
  return { brightness, colorTemp, color };
}

/** True when the light offers more than plain on/off. */
export function hasExtraControls(entity: HassEntity): boolean {
  const c = lightCaps(entity);
  return c.brightness || c.colorTemp || c.color;
}
