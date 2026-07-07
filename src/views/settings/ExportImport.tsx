import { useState } from 'preact/hooks';
import { exportSettings, importSettings } from '../../lib/settings';
import styles from './settings.module.css';

export function ExportImport() {
  const [pasted, setPasted] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function download() {
    const blob = new Blob([exportSettings()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'haview-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function apply(json: string) {
    const res = importSettings(json);
    setMsg(
      res.ok
        ? { ok: true, text: 'Imported — settings applied on this device.' }
        : { ok: false, text: res.error },
    );
    if (res.ok) setPasted('');
  }

  async function onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    apply(await file.text());
    input.value = '';
  }

  return (
    <div class={styles.exportImport}>
      <p class={styles.dim}>
        Copies the whole dashboard setup (widgets, entities, calendars, title) between devices or
        households. Your Home Assistant URL and token are <strong>not</strong> included — each
        device connects with its own.
      </p>
      <div class={styles.buttonRow}>
        <button class={styles.primaryBtn} onClick={download}>
          Export settings…
        </button>
        <label class={styles.fileBtn}>
          Import file…
          <input type="file" accept=".json,application/json" onChange={onFile} hidden />
        </label>
      </div>
      <textarea
        class={styles.pasteBox}
        placeholder="…or paste exported JSON here"
        value={pasted}
        onInput={(e) => setPasted((e.target as HTMLTextAreaElement).value)}
        rows={3}
      />
      {pasted.trim() !== '' && (
        <button class={styles.primaryBtn} onClick={() => apply(pasted)}>
          Import pasted JSON
        </button>
      )}
      {msg && <p class={msg.ok ? styles.msgOk : styles.msgErr}>{msg.text}</p>}
    </div>
  );
}
