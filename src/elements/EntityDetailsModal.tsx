import type { HassEntity } from '../lib/types';
import { Modal } from '../components/Modal';
import { useEntity } from '../lib/ha/entities';
import { callSvc } from '../lib/ha/service';
import { lightCaps } from './lightCaps';
import styles from './elements.module.css';

/**
 * Rich controls for entities whose card can't fit them: light brightness /
 * color temp / color, climate target + mode, media volume + transport.
 * Sliders commit on change (not input) to avoid flooding HA with calls.
 */
export function EntityDetailsModal({
  entityId,
  onClose,
}: {
  entityId: string;
  onClose: () => void;
}) {
  const entity = useEntity(entityId).value;
  const domain = entityId.split('.')[0];

  return (
    <Modal onClose={onClose} maxWidth={420}>
      <header class={styles.detailHeader}>
        <span>
          {entity && typeof entity.attributes.friendly_name === 'string'
            ? entity.attributes.friendly_name
            : entityId}
        </span>
        <button class={styles.closeBtn} onClick={onClose} aria-label="Close">
          ✕
        </button>
      </header>
      <div class={styles.detailBody}>
        {!entity && <p class={styles.detailDim}>Entity unavailable.</p>}
        {entity && domain === 'light' && <LightControls entity={entity} />}
        {entity && domain === 'climate' && <ClimateControls entity={entity} />}
        {entity && domain === 'media_player' && <MediaControls entity={entity} />}
      </div>
    </Modal>
  );
}

/** 10 hue/saturation presets for color lights. */
const SWATCHES: [number, number][] = [
  [0, 100],
  [30, 100],
  [60, 100],
  [120, 100],
  [160, 100],
  [190, 100],
  [220, 100],
  [260, 100],
  [300, 100],
  [330, 55],
];

function LightControls({ entity }: { entity: HassEntity }) {
  const id = entity.entity_id;
  const caps = lightCaps(entity);
  const isOn = entity.state === 'on';
  const brightness = entity.attributes.brightness;
  const pct = typeof brightness === 'number' ? Math.round((brightness / 255) * 100) : 0;
  const minK =
    typeof entity.attributes.min_color_temp_kelvin === 'number'
      ? entity.attributes.min_color_temp_kelvin
      : 2000;
  const maxK =
    typeof entity.attributes.max_color_temp_kelvin === 'number'
      ? entity.attributes.max_color_temp_kelvin
      : 6500;
  const curK =
    typeof entity.attributes.color_temp_kelvin === 'number'
      ? entity.attributes.color_temp_kelvin
      : Math.round((minK + maxK) / 2);

  return (
    <>
      <button
        class={`${styles.toggleBtn}${isOn ? ` ${styles.toggleOn}` : ''}`}
        onClick={() => callSvc('homeassistant', 'toggle', undefined, { entity_id: id })}
      >
        {isOn ? 'On — tap to turn off' : 'Off — tap to turn on'}
      </button>
      {caps.brightness && (
        <label class={styles.sliderRow}>
          <span>Brightness{isOn ? ` · ${pct}%` : ''}</span>
          <input
            type="range"
            min={1}
            max={100}
            value={pct}
            disabled={!isOn}
            onChange={(e) =>
              callSvc(
                'light',
                'turn_on',
                { brightness_pct: Number((e.target as HTMLInputElement).value) },
                { entity_id: id },
              )
            }
          />
        </label>
      )}
      {caps.colorTemp && (
        <label class={styles.sliderRow}>
          <span>Color temperature</span>
          <input
            class={styles.tempSlider}
            type="range"
            min={minK}
            max={maxK}
            step={50}
            value={curK}
            disabled={!isOn}
            onChange={(e) =>
              callSvc(
                'light',
                'turn_on',
                { color_temp_kelvin: Number((e.target as HTMLInputElement).value) },
                { entity_id: id },
              )
            }
          />
        </label>
      )}
      {caps.color && (
        <div class={styles.swatchSection}>
          <span class={styles.detailDim}>Color</span>
          <div class={styles.swatchRow}>
            {SWATCHES.map(([h, s]) => (
              <button
                key={h}
                class={styles.swatch}
                style={{ background: `hsl(${h}, ${s}%, 55%)` }}
                disabled={!isOn}
                onClick={() =>
                  callSvc('light', 'turn_on', { hs_color: [h, s] }, { entity_id: id })
                }
                aria-label={`Set color hue ${h}`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function ClimateControls({ entity }: { entity: HassEntity }) {
  const id = entity.entity_id;
  const target = typeof entity.attributes.temperature === 'number' ? entity.attributes.temperature : null;
  const current =
    typeof entity.attributes.current_temperature === 'number'
      ? entity.attributes.current_temperature
      : null;
  const step =
    typeof entity.attributes.target_temp_step === 'number'
      ? entity.attributes.target_temp_step
      : 0.5;
  const modes: string[] = Array.isArray(entity.attributes.hvac_modes)
    ? entity.attributes.hvac_modes.filter((m: unknown) => typeof m === 'string')
    : [];

  const setTarget = (t: number) =>
    callSvc('climate', 'set_temperature', { temperature: t }, { entity_id: id });

  return (
    <>
      {current !== null && (
        <p class={styles.detailDim}>
          Currently <strong>{current}°</strong>
        </p>
      )}
      {target !== null && (
        <div class={styles.tempRow}>
          <button class={styles.tempBtn} onClick={() => setTarget(target - step)}>
            −
          </button>
          <span class={styles.tempTarget}>{target}°</span>
          <button class={styles.tempBtn} onClick={() => setTarget(target + step)}>
            +
          </button>
        </div>
      )}
      {modes.length > 0 && (
        <div class={styles.modeRow}>
          {modes.map((m) => (
            <button
              key={m}
              class={`${styles.modeBtn}${entity.state === m ? ` ${styles.modeActive}` : ''}`}
              onClick={() => callSvc('climate', 'set_hvac_mode', { hvac_mode: m }, { entity_id: id })}
            >
              {m.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function MediaControls({ entity }: { entity: HassEntity }) {
  const id = entity.entity_id;
  const title = typeof entity.attributes.media_title === 'string' ? entity.attributes.media_title : null;
  const artist =
    typeof entity.attributes.media_artist === 'string' ? entity.attributes.media_artist : null;
  const vol =
    typeof entity.attributes.volume_level === 'number'
      ? Math.round(entity.attributes.volume_level * 100)
      : null;
  const playing = entity.state === 'playing';

  const svc = (service: string, data?: Record<string, unknown>) =>
    callSvc('media_player', service, data, { entity_id: id });

  return (
    <>
      {(title || artist) && (
        <p class={styles.nowPlaying}>
          {title}
          {artist && <span class={styles.detailDim}> — {artist}</span>}
        </p>
      )}
      <div class={styles.transportRow}>
        <button class={styles.tempBtn} onClick={() => svc('media_previous_track')} aria-label="Previous">
          ⏮
        </button>
        <button class={styles.tempBtn} onClick={() => svc('media_play_pause')} aria-label="Play/pause">
          {playing ? '⏸' : '▶'}
        </button>
        <button class={styles.tempBtn} onClick={() => svc('media_next_track')} aria-label="Next">
          ⏭
        </button>
      </div>
      {vol !== null && (
        <label class={styles.sliderRow}>
          <span>Volume · {vol}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={vol}
            onChange={(e) =>
              svc('volume_set', { volume_level: Number((e.target as HTMLInputElement).value) / 100 })
            }
          />
        </label>
      )}
    </>
  );
}
