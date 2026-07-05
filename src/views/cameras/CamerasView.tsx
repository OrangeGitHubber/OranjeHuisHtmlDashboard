import { useState } from 'preact/hooks';
import type { HassEntity } from 'home-assistant-js-websocket';
import { useEntitiesByDomain } from '../../lib/ha/entities';
import { EmptyState } from '../../components/EmptyState';
import { CameraTile } from './CameraTile';
import { StreamModal } from './StreamModal';
import styles from './cameras.module.css';

export default function CamerasView() {
  const cameras = useEntitiesByDomain('camera').value;
  const [open, setOpen] = useState<HassEntity | null>(null);

  return (
    <div>
      <h1 class="view-title">Cameras</h1>
      {cameras.length === 0 ? (
        <EmptyState message="No camera entities found in Home Assistant." />
      ) : (
        <div class={styles.grid}>
          {cameras.map((cam, i) => (
            <CameraTile
              key={cam.entity_id}
              entity={cam}
              staggerMs={Math.round((i * 10_000) / cameras.length)}
              onOpen={() => setOpen(cam)}
            />
          ))}
        </div>
      )}
      {open && <StreamModal entity={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
