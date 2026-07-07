import { useEffect, useState } from 'preact/hooks';
import {
  listProfiles,
  currentProfileName,
  type ProfileInfo,
} from '../../lib/profiles';
import { switchProfile, saveCurrentAs, cloneProfile, removeProfile } from '../../lib/settings';
import styles from './settings.module.css';

export function ProfilesEditor() {
  const [list, setList] = useState<ProfileInfo[]>([]);
  const [current, setCurrent] = useState(currentProfileName());
  const [busy, setBusy] = useState(false);

  const refresh = () => listProfiles().then(setList);
  useEffect(() => {
    refresh();
  }, []);

  const userProfiles = list.filter((p) => !p.template);
  const templates = list.filter((p) => p.template);
  const [tpl, setTpl] = useState('');

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    await fn();
    await refresh();
    setCurrent(currentProfileName());
    setBusy(false);
  };

  return (
    <div class={styles.exportImport}>
      <label class={styles.field}>
        Active profile (this screen)
        <select
          class={styles.select}
          value={current}
          disabled={busy}
          onChange={(e) => run(() => switchProfile((e.target as HTMLSelectElement).value))}
        >
          {userProfiles.length === 0 && <option value={current}>{current}</option>}
          {userProfiles.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <div class={styles.buttonRow}>
        <button
          class={styles.fileBtn}
          disabled={busy}
          onClick={() =>
            run(async () => {
              const name = prompt('Name for the new profile (saved from the current layout):');
              if (name) await saveCurrentAs(name);
            })
          }
        >
          Save as new…
        </button>
        <button
          class={styles.fileBtn}
          disabled={busy || userProfiles.length <= 1}
          onClick={() =>
            run(async () => {
              if (!confirm(`Delete profile “${current}”? This cannot be undone.`)) return;
              const others = userProfiles.filter((p) => p.name !== current);
              await removeProfile(current);
              if (others[0]) await switchProfile(others[0].name);
            })
          }
        >
          Delete “{current}”
        </button>
      </div>

      {templates.length > 0 && (
        <div class={styles.buttonRow}>
          <select
            class={styles.select}
            value={tpl}
            disabled={busy}
            onChange={(e) => setTpl((e.target as HTMLSelectElement).value)}
          >
            <option value="">New from template…</option>
            {templates.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            class={styles.fileBtn}
            disabled={busy || !tpl}
            onClick={() =>
              run(async () => {
                const name = prompt(`Name for the new profile (from “${tpl}” template):`);
                if (name) await cloneProfile(tpl, name);
                setTpl('');
              })
            }
          >
            Create
          </button>
        </div>
      )}

      <p class={styles.dim}>
        Profiles are stored in the dashboard container and shared by every screen. Each screen
        remembers which profile it shows; edits auto-save to the active profile.
      </p>
    </div>
  );
}
