import { useEffect, useState } from 'preact/hooks';
import type { HassEntity } from 'home-assistant-js-websocket';
import { getSignedUrl } from '../../lib/ha/signedPath';
import { loadConfig } from '../../lib/config';
import { minuteTick, relativeSince } from '../../lib/clock';
import styles from './people.module.css';

function usePersonAvatar(entity: HassEntity): string | null {
  const picture = entity.attributes.entity_picture as string | undefined;
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setUrl(null);
    if (!picture) return;
    if (picture.startsWith('/api/')) {
      // authenticated path — needs a signed URL
      getSignedUrl(picture, 30 * 60)
        .then((u) => alive && setUrl(u))
        .catch(() => {});
    } else if (picture.startsWith('/')) {
      const cfg = loadConfig();
      if (cfg) setUrl(cfg.hassUrl + picture);
    } else {
      setUrl(picture);
    }
    return () => {
      alive = false;
    };
  }, [picture]);

  return url;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function PersonCard({ entity }: { entity: HassEntity }) {
  const name = (entity.attributes.friendly_name as string | undefined) ?? entity.entity_id;
  const avatar = usePersonAvatar(entity);
  const now = minuteTick.value;

  const state = entity.state;
  const isHome = state === 'home';
  const isAway = state === 'not_home';
  // any other state is the name of the zone the person is in
  const label = isHome ? 'Home' : isAway ? 'Away' : state;
  const chipClass = isHome ? styles.chipHome : isAway ? styles.chipAway : styles.chipZone;

  return (
    <div class={styles.card}>
      {avatar ? (
        <img class={styles.avatar} src={avatar} alt={name} />
      ) : (
        <div class={styles.avatarFallback}>{initials(name)}</div>
      )}
      <div class={styles.info}>
        <span class={styles.name}>{name}</span>
        <span class={styles.since}>{relativeSince(entity.last_changed, now)}</span>
      </div>
      <span class={`${styles.chip} ${chipClass}`}>{label}</span>
    </div>
  );
}
