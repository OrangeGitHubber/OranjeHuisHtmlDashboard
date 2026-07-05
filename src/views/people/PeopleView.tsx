import { useEntitiesByDomain } from '../../lib/ha/entities';
import { EmptyState } from '../../components/EmptyState';
import { PersonCard } from './PersonCard';
import styles from './people.module.css';

export default function PeopleView() {
  const people = useEntitiesByDomain('person').value;
  const home = people.filter((p) => p.state === 'home').length;

  return (
    <div>
      <h1 class="view-title">
        People
        {people.length > 0 && (
          <span class={styles.homeCount}>
            {home}/{people.length} home
          </span>
        )}
      </h1>
      {people.length === 0 ? (
        <EmptyState message="No person entities found in Home Assistant." />
      ) : (
        <div class={styles.list}>
          {people.map((p) => (
            <PersonCard key={p.entity_id} entity={p} />
          ))}
        </div>
      )}
    </div>
  );
}
