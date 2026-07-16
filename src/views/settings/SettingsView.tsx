import { settings, updateSettings } from '../../lib/settings';
import { themes } from '../../lib/themes';
import { serverConfig, setupRequested } from '../../lib/config';
import { PagesEditor } from './PagesEditor';
import { ProfilesEditor } from './ProfilesEditor';
import { ExportImport } from './ExportImport';
import styles from './settings.module.css';

export default function SettingsView() {
  const s = settings.value;
  const cfg = serverConfig.value;

  // night dimming and the screensaver are mutually exclusive (a screensaver
  // fully covers the dashboard, so a dim layer under it would do nothing) —
  // present them as one either/or choice. Derived from the two underlying
  // flags; screensaver wins if a legacy config somehow has both set.
  const nightMode: 'off' | 'dim' | 'saver' = s.screensaver
    ? 'saver'
    : s.nightDim
      ? 'dim'
      : 'off';
  const setNightMode = (m: 'off' | 'dim' | 'saver') =>
    updateSettings({ nightDim: m === 'dim', screensaver: m === 'saver' });

  return (
    <div class={styles.page}>
      <h1 class={`view-title ${styles.pageTitle}`}>Settings</h1>

      <p class={styles.groupLabel}>General</p>
      <section class={styles.section}>
        <h2>Dashboard</h2>
        <label class={styles.field}>
          Title
          <input
            type="text"
            value={s.title}
            onInput={(e) => updateSettings({ title: (e.target as HTMLInputElement).value })}
          />
        </label>
        <label class={styles.field}>
          Subtitle
          <input
            type="text"
            value={s.subtitle}
            onInput={(e) => updateSettings({ subtitle: (e.target as HTMLInputElement).value })}
          />
        </label>
      </section>

      <p class={styles.groupLabel}>Appearance</p>
      <section class={styles.section}>
        <h2>Theme</h2>
        <div class={styles.field}>
          Mode
          <div class={styles.modeRow}>
            {(['auto', 'dark', 'light'] as const).map((m) => (
              <button
                key={m}
                class={`${styles.modeBtn}${s.colorMode === m ? ` ${styles.modeActive}` : ''}`}
                onClick={() => updateSettings({ colorMode: m })}
              >
                {m === 'auto' ? 'Auto' : m === 'dark' ? 'Dark' : 'Light'}
              </button>
            ))}
          </div>
        </div>
        <div class={styles.field}>
          Accent color
          <div class={styles.swatchRow}>
            {themes.map((t) => {
              const active = !s.accentColor && s.theme === t.id;
              return (
                <button
                  key={t.id}
                  class={`${styles.swatchChip}${active ? ` ${styles.swatchActive}` : ''}`}
                  style={{ background: t.swatch }}
                  onClick={() => updateSettings({ theme: t.id, accentColor: '' })}
                  aria-label={`Accent: ${t.name}`}
                  aria-pressed={active}
                  title={t.name}
                />
              );
            })}
            <label
              class={`${styles.swatchChip} ${styles.swatchCustom}${
                s.accentColor ? ` ${styles.swatchActive}` : ''
              }`}
              style={s.accentColor ? { background: s.accentColor } : undefined}
              title="Custom color"
            >
              {!s.accentColor && <span class={styles.swatchPlus} aria-hidden="true">+</span>}
              <input
                type="color"
                value={s.accentColor || '#f28c28'}
                onInput={(e) => updateSettings({ accentColor: (e.target as HTMLInputElement).value })}
                aria-label="Custom accent color"
              />
            </label>
          </div>
        </div>
      </section>

      <section class={styles.section}>
        <h2>Card titles</h2>
        <label class={styles.checkItem}>
          <input
            type="checkbox"
            checked={s.showTitles}
            onChange={(e) =>
              updateSettings({ showTitles: (e.target as HTMLInputElement).checked })
            }
          />
          Show card titles (each card can override this)
        </label>
        <div class={styles.field}>
          Title color
          <div class={styles.modeRow}>
            <input
              type="color"
              value={s.titleColor || '#f28c28'}
              onChange={(e) =>
                updateSettings({ titleColor: (e.target as HTMLInputElement).value })
              }
              aria-label="Title color"
            />
            <button
              class={`${styles.modeBtn}${!s.titleColor ? ` ${styles.modeActive}` : ''}`}
              onClick={() => updateSettings({ titleColor: '' })}
            >
              Theme accent
            </button>
          </div>
        </div>
      </section>

      <section class={styles.section}>
        <h2>Sizing</h2>
        <div class={styles.fieldRow}>
          <label class={styles.field}>
            Card opacity · {s.cardOpacity}%
            <input
              type="range"
              min={0}
              max={100}
              value={s.cardOpacity}
              onInput={(e) =>
                updateSettings({ cardOpacity: Number((e.target as HTMLInputElement).value) })
              }
            />
          </label>
          <label class={styles.field}>
            Display scale · {s.uiScale}%
            <input
              type="range"
              min={70}
              max={200}
              step={5}
              value={s.uiScale}
              onInput={(e) =>
                updateSettings({ uiScale: Number((e.target as HTMLInputElement).value) })
              }
            />
          </label>
        </div>
        <p class={styles.dim}>
          Text size. Large screens scale up automatically; nudge this if a wall display still
          looks too small or too big.
        </p>
      </section>

      <section class={styles.section}>
        <h2>Night dimming &amp; screensaver</h2>
        <div class={styles.modeRow}>
          {(
            [
              ['off', 'Off'],
              ['dim', 'Dim display'],
              ['saver', 'Screensaver'],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              class={`${styles.modeBtn}${nightMode === m ? ` ${styles.modeActive}` : ''}`}
              onClick={() => setNightMode(m)}
            >
              {label}
            </button>
          ))}
        </div>
        <p class={styles.dim}>
          At night you can either <strong>dim</strong> the dashboard (darkened but still visible)
          or show a <strong>swirling screensaver</strong> that fully covers it — the screensaver
          keeps bright pixels moving to protect an always-on screen from burn-in. They can't both
          run at once, so this is one either/or choice.
        </p>
        {nightMode !== 'off' && (
          <>
            <div class={styles.fieldRow}>
              <label class={styles.field}>
                From
                <input
                  type="time"
                  value={s.nightDimStart}
                  onChange={(e) =>
                    updateSettings({ nightDimStart: (e.target as HTMLInputElement).value })
                  }
                />
              </label>
              <label class={styles.field}>
                Until
                <input
                  type="time"
                  value={s.nightDimEnd}
                  onChange={(e) =>
                    updateSettings({ nightDimEnd: (e.target as HTMLInputElement).value })
                  }
                />
              </label>
              <label class={styles.field}>
                Resume after (min)
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={s.nightDimResume}
                  onChange={(e) => {
                    const n = Math.round(Number((e.target as HTMLInputElement).value));
                    updateSettings({
                      nightDimResume: Number.isFinite(n) ? Math.min(Math.max(n, 1), 60) : 2,
                    });
                  }}
                />
              </label>
            </div>
            {nightMode === 'dim' && (
              <div class={styles.fieldRow}>
                <label class={styles.field}>
                  Dim %
                  <input
                    type="number"
                    min={10}
                    max={90}
                    value={s.nightDimAmount}
                    onChange={(e) => {
                      const n = Math.round(Number((e.target as HTMLInputElement).value));
                      updateSettings({
                        nightDimAmount: Number.isFinite(n) ? Math.min(Math.max(n, 10), 90) : 40,
                      });
                    }}
                  />
                </label>
              </div>
            )}
            {nightMode === 'saver' && (
              <div class={styles.fieldRow}>
                <label class={styles.field}>
                  Screensaver brightness %
                  <input
                    type="number"
                    min={5}
                    max={80}
                    value={s.screensaverBrightness}
                    onChange={(e) => {
                      const n = Math.round(Number((e.target as HTMLInputElement).value));
                      updateSettings({
                        screensaverBrightness: Number.isFinite(n)
                          ? Math.min(Math.max(n, 5), 80)
                          : 35,
                      });
                    }}
                  />
                </label>
                <label class={styles.field}>
                  Screensaver speed (1–10)
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={s.screensaverSpeed}
                    onChange={(e) => {
                      const n = Math.round(Number((e.target as HTMLInputElement).value));
                      updateSettings({
                        screensaverSpeed: Number.isFinite(n) ? Math.min(Math.max(n, 1), 10) : 3,
                      });
                    }}
                  />
                </label>
              </div>
            )}
            {nightMode === 'saver' && (
              <div class={styles.field}>
                Intensity
                <div class={styles.modeRow}>
                  {(
                    [
                      ['low', 'Low'],
                      ['medium', 'Medium'],
                      ['high', 'High'],
                    ] as const
                  ).map(([v, label]) => (
                    <button
                      key={v}
                      class={`${styles.modeBtn}${s.screensaverIntensity === v ? ` ${styles.modeActive}` : ''}`}
                      onClick={() => updateSettings({ screensaverIntensity: v })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <span class={styles.dim}>
                  Lower intensity is much lighter on the GPU — use Low on a Raspberry Pi or any
                  display where the swirl looks choppy.
                </span>
              </div>
            )}
            <p class={styles.dim}>
              Runs during the window above and clears on any touch, mouse or keyboard activity,
              returning after the inactivity timeout.
            </p>
          </>
        )}
        <label class={styles.checkItem}>
          <input
            type="checkbox"
            checked={s.idleDebug}
            onChange={(e) => updateSettings({ idleDebug: (e.target as HTMLInputElement).checked })}
          />
          Show input-activity debug overlay (troubleshooting)
        </label>
        {s.idleDebug && (
          <p class={styles.dim}>
            Shows a small on-screen log of the input events (taps, keys, pointer moves) that lift
            night dimming. If the display won't stay dimmed, leave this on and note which event
            appears the instant the dim clears. Turn it off when done.
          </p>
        )}
      </section>

      <section class={styles.section}>
        <h2>On-screen elements</h2>
        <label class={styles.checkItem}>
          <input
            type="checkbox"
            checked={s.showRefresh}
            onChange={(e) =>
              updateSettings({ showRefresh: (e.target as HTMLInputElement).checked })
            }
          />
          Show the refresh button (lower-left corner)
        </label>
        <label class={styles.checkItem}>
          <input
            type="checkbox"
            checked={s.checkUpdates}
            onChange={(e) =>
              updateSettings({ checkUpdates: (e.target as HTMLInputElement).checked })
            }
          />
          Show a banner when a new version is deployed
        </label>
      </section>

      <p class={styles.groupLabel}>Content</p>
      <section class={styles.section}>
        <h2>Pages</h2>
        <p class={styles.dim}>
          Add and arrange the pages in the navigation. Edit a page's layout with the ✎ button on
          the page itself.
        </p>
        <PagesEditor />
      </section>

      <section class={styles.section}>
        <h2>Profiles</h2>
        <ProfilesEditor />
      </section>

      <p class={styles.groupLabel}>System</p>
      <section class={styles.section}>
        <h2>Export / Import</h2>
        <ExportImport />
      </section>

      <section class={styles.section}>
        <h2>Connection</h2>
        <p class={styles.dim}>
          Connected to <code>{cfg?.hassUrl ?? 'not configured'}</code>
        </p>
        <button class={styles.primaryBtn} onClick={() => (setupRequested.value = true)}>
          Change connection…
        </button>
      </section>
    </div>
  );
}
