import { useEffect, useState } from 'preact/hooks';
import { Modal } from '../components/Modal';
import {
  ensureRegistries,
  registriesLoaded,
  areas,
  labels,
  entitiesByArea,
  effectiveLabels,
  deviceOf,
  deviceName,
  type EntityEntry,
} from '../lib/ha/registries';
import { settings, addElement, newId } from '../lib/settings';
import { elementDefs } from './elements';
import { findFreeSlot } from './layout';
import styles from './grid.module.css';

function entryName(en: EntityEntry): string {
  return en.name ?? en.original_name ?? en.entity_id;
}

function placeElement(
  pageId: string,
  type: string,
  options?: Record<string, unknown>,
): string | null {
  const def = elementDefs[type];
  const page = settings.peek().pages.find((p) => p.id === pageId);
  if (!def || !page) return null;
  const slot = findFreeSlot(page.elements, def.defaultSize.w, def.defaultSize.h);
  const id = newId('e');
  addElement(pageId, {
    id,
    type,
    ...slot,
    ...def.defaultSize,
    ...(options ? { options } : {}),
  });
  return id;
}

export function AddElementModal({
  pageId,
  onClose,
  onPlaced,
}: {
  pageId: string;
  onClose: () => void;
  /** called with the new element id when a just-added element should open its options */
  onPlaced?: (elementId: string) => void;
}) {
  const [tab, setTab] = useState<'entities' | 'widgets'>('entities');
  const [query, setQuery] = useState('');
  const [labelFilter, setLabelFilter] = useState<ReadonlySet<string>>(new Set());
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    ensureRegistries();
  }, []);

  const loaded = registriesLoaded.value;
  const q = query.trim().toLowerCase();
  const filtering = q !== '' || labelFilter.size > 0;

  const toggleSet = (set: ReadonlySet<string>, id: string): Set<string> => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  const areaNames = new Map(areas.value.map((a) => [a.area_id, a.name]));

  const groups: { areaId: string; name: string; list: EntityEntry[] }[] = [];
  if (loaded) {
    for (const [areaId, list] of entitiesByArea.value) {
      const filtered = list.filter((en) => {
        if (labelFilter.size > 0) {
          const els = effectiveLabels(en);
          for (const l of labelFilter) if (!els.includes(l)) return false;
        }
        if (q) {
          if (
            !entryName(en).toLowerCase().includes(q) &&
            !en.entity_id.toLowerCase().includes(q)
          ) {
            return false;
          }
        }
        return true;
      });
      if (filtered.length > 0) {
        groups.push({
          areaId,
          name: areaId ? (areaNames.get(areaId) ?? areaId) : 'No area',
          list: filtered,
        });
      }
    }
  }

  const submit = () => {
    const placed: string[] = [];
    for (const entityId of checked) {
      const id = placeElement(pageId, 'entity', { entityId });
      if (id) placed.push(id);
    }
    onClose();
    // a single added card goes straight to its settings, like widgets do
    if (placed.length === 1 && onPlaced) onPlaced(placed[0]);
  };

  return (
    <Modal onClose={onClose} maxWidth={560}>
      <div class={styles.tabRow}>
        <button
          class={`${styles.tab}${tab === 'entities' ? ` ${styles.tabActive}` : ''}`}
          onClick={() => setTab('entities')}
        >
          Entities
        </button>
        <button
          class={`${styles.tab}${tab === 'widgets' ? ` ${styles.tabActive}` : ''}`}
          onClick={() => setTab('widgets')}
        >
          Widgets
        </button>
      </div>

      {tab === 'entities' && (
        <>
          <div class={styles.pickerBody}>
            <input
              class={styles.searchInput}
              type="search"
              placeholder="Search devices and entities…"
              value={query}
              onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            />
            {labels.value.length > 0 && (
              <div class={styles.labelChips}>
                {labels.value.map((l) => (
                  <button
                    key={l.label_id}
                    class={`${styles.chip}${labelFilter.has(l.label_id) ? ` ${styles.chipActive}` : ''}`}
                    onClick={() => setLabelFilter(toggleSet(labelFilter, l.label_id))}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            )}

            {!loaded && (
              <>
                <div class={styles.skeletonRow} />
                <div class={styles.skeletonRow} />
                <div class={styles.skeletonRow} />
              </>
            )}

            {loaded && groups.length === 0 && (
              <p class={styles.noResults}>No entities match.</p>
            )}

            {groups.map((g) => {
              const open = filtering || expanded.has(g.areaId);
              return (
                <div key={g.areaId} class={styles.areaGroup}>
                  <button
                    class={styles.areaHeader}
                    onClick={() => setExpanded(toggleSet(expanded, g.areaId))}
                  >
                    <span>{g.name}</span>
                    <span class={styles.areaCount}>
                      {g.list.length} {open ? '▾' : '▸'}
                    </span>
                  </button>
                  {open && (
                    <ul class={styles.entityList}>
                      {g.list.map((en, i) => {
                        const dev = deviceOf(en);
                        const dn = dev ? deviceName(dev) : '';
                        const prev = i > 0 ? g.list[i - 1] : undefined;
                        const prevDev = prev ? deviceOf(prev) : undefined;
                        const showDevice =
                          dn !== '' && (!prevDev || deviceName(prevDev) !== dn);
                        return (
                          <li key={en.entity_id}>
                            {showDevice && <div class={styles.deviceHeading}>{dn}</div>}
                            <label class={styles.entityRow}>
                              <input
                                type="checkbox"
                                checked={checked.has(en.entity_id)}
                                onChange={() => setChecked(toggleSet(checked, en.entity_id))}
                              />
                              <span class={styles.entityName}>{entryName(en)}</span>
                              <span class={styles.entityId}>{en.entity_id}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
          <div class={styles.pickerFooter}>
            <button class={styles.addManyBtn} disabled={checked.size === 0} onClick={submit}>
              Add {checked.size || ''} element{checked.size === 1 ? '' : 's'}
            </button>
          </div>
        </>
      )}

      {tab === 'widgets' && (
        <div class={styles.pickerBody}>
          {Object.values(elementDefs)
            .filter((d) => d.type !== 'entity')
            .map((d) => (
              <div key={d.type} class={styles.widgetAddRow}>
                <span>{d.title}</span>
                <button
                  onClick={() => {
                    const id = placeElement(pageId, d.type);
                    onClose();
                    // jump straight into the new element's settings
                    if (id && d.optionsLoader && onPlaced) onPlaced(id);
                  }}
                >
                  Add
                </button>
              </div>
            ))}
        </div>
      )}
    </Modal>
  );
}
