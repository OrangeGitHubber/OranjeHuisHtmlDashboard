import { useEntitiesByDomain } from '../../../lib/ha/entities';
import { settings } from '../../../lib/settings';
import { navigate } from '../../../lib/router';
import { PersonCard } from '../../people/PersonCard';
import styles from './presence.module.css';

export default function PresenceWidget() {
  const people = useEntitiesByDomain('person').value;
  const ids = settings.value.presence.personIds;
  const shown = ids === null ? people : people.filter((p) => ids.includes(p.entity_id));
  const home = shown.filter((p) => p.state === 'home').length;

  return (
    <div class={styles.card}>
      <h2 class={styles.title}>
        Family
        {shown.length > 0 && (
          <span class={styles.count}>
            {home}/{shown.length} home
          </span>
        )}
      </h2>
      {shown.length === 0 ? (
        <div class={styles.hint}>
          <p>
            {people.length === 0
              ? 'No person entities found in Home Assistant.'
              : 'No people selected for this display.'}
          </p>
          {people.length > 0 && <button onClick={() => navigate('settings')}>Open Settings</button>}
        </div>
      ) : (
        <div class={styles.list}>
          {shown.map((p) => (
            <PersonCard key={p.entity_id} entity={p} />
          ))}
        </div>
      )}
    </div>
  );
}
