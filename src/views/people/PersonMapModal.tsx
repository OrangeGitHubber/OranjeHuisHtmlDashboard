import type { HassEntity } from '../../lib/types';
import { Modal } from '../../components/Modal';
import styles from './people.module.css';

/**
 * Current location of a person on an embedded OpenStreetMap (needs internet
 * access on the viewing device). Person entities carry latitude/longitude
 * when a GPS-capable tracker (companion app) is attached.
 */
export function PersonMapModal({
  entity,
  address,
  onClose,
}: {
  entity: HassEntity;
  address?: string | null;
  onClose: () => void;
}) {
  const name = (entity.attributes.friendly_name as string | undefined) ?? entity.entity_id;
  const lat = entity.attributes.latitude;
  const lon = entity.attributes.longitude;
  const hasGps = typeof lat === 'number' && typeof lon === 'number';
  const d = 0.004;
  const src = hasGps
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lon - d}%2C${lat - d}%2C${lon + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lon}`
    : '';

  return (
    <Modal onClose={onClose} maxWidth={560}>
      <header class={styles.mapHeader}>
        <span>{name}</span>
        <button class={styles.mapClose} onClick={onClose} aria-label="Close">
          ✕
        </button>
      </header>
      {hasGps ? (
        <>
          <iframe class={styles.mapFrame} src={src} title={`Map: ${name}`} loading="lazy" />
          <div class={styles.mapFooter}>
            <span class={styles.mapAddress}>{address ?? ''}</span>
            <a
              class={styles.mapLink}
              href={`https://maps.google.com/?q=${lat},${lon}`}
              target="_blank"
              rel="noreferrer"
            >
              Open in Google Maps
            </a>
          </div>
        </>
      ) : (
        <p class={styles.mapNone}>
          No GPS location available for {name} — their tracker doesn't report coordinates.
        </p>
      )}
    </Modal>
  );
}
