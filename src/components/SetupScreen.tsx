import { useState } from 'preact/hooks';
import {
  createConnection,
  createLongLivedTokenAuth,
  ERR_INVALID_AUTH,
  ERR_INVALID_HTTPS_TO_HTTP,
} from 'home-assistant-js-websocket';
import { loadConfig, normalizeHassUrl, saveConfig } from '../lib/config';

export function SetupScreen({
  authFailed,
  onCancel,
}: {
  authFailed?: boolean;
  onCancel?: () => void;
}) {
  const existing = loadConfig();
  const [url, setUrl] = useState(existing?.hassUrl ?? '');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    authFailed
      ? 'Home Assistant rejected the saved access token (it may have been revoked). Enter a new one.'
      : null,
  );

  async function testAndSave(e: Event) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const hassUrl = normalizeHassUrl(url);
    const trimmedToken = token.trim();

    // 1. WebSocket + auth check
    try {
      const auth = createLongLivedTokenAuth(hassUrl, trimmedToken);
      const conn = await createConnection({ auth, setupRetry: 0 });
      conn.close();
    } catch (err) {
      if (err === ERR_INVALID_AUTH) {
        setError('Home Assistant rejected the access token. Create a fresh long-lived token in your HA profile (Security tab) and paste it exactly.');
      } else if (err === ERR_INVALID_HTTPS_TO_HTTP) {
        setError('This page is served over https, so the browser blocks a plain http connection to Home Assistant. Use your https HA URL (remote/proxy address).');
      } else {
        setError(`Could not open a WebSocket to ${hassUrl}. Check the URL (including http/https and port, e.g. http://192.168.1.10:8123) and that HA is reachable from this device.`);
      }
      setBusy(false);
      return;
    }

    // 2. REST/CORS check — the most common real-world failure when the
    // dashboard is served from its own origin.
    try {
      const res = await fetch(`${hassUrl}/api/`, {
        headers: { Authorization: `Bearer ${trimmedToken}` },
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      setError(
        `WebSocket connected, but the REST API is blocked — almost certainly CORS. Add this origin to configuration.yaml under http: → cors_allowed_origins: "${location.origin}", restart Home Assistant, then try again.`,
      );
      setBusy(false);
      return;
    }

    saveConfig({ hassUrl, token: trimmedToken });
    location.reload();
  }

  return (
    <div class="setup">
      <form class="setup-card" onSubmit={testAndSave}>
        <h1>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M16 6 L27 15 H24 V25 H19 V18 H13 V25 H8 V15 H5 Z" fill="var(--accent)" />
          </svg>
          Oranjehuis
        </h1>
        <p class="setup-hint">
          Connect this device to your Home Assistant instance. The settings are stored only in this
          browser.
        </p>
        <label>
          Home Assistant URL
          <input
            type="text"
            value={url}
            onInput={(e) => setUrl((e.target as HTMLInputElement).value)}
            placeholder="http://192.168.1.10:8123"
            required
            autocomplete="url"
            inputMode="url"
          />
        </label>
        <label>
          Long-lived access token
          <input
            type="password"
            value={token}
            onInput={(e) => setToken((e.target as HTMLInputElement).value)}
            placeholder="Paste token"
            required
          />
        </label>
        {error && <div class="setup-error">{error}</div>}
        <button type="submit" disabled={busy}>
          {busy ? 'Testing connection…' : 'Test & save'}
        </button>
        {onCancel && (
          <button type="button" class="setup-cancel" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        )}
        <p class="setup-hint">
          Create a token in HA: <strong>Profile → Security → Long-lived access tokens</strong>. The
          REST API also needs this origin in <code>cors_allowed_origins</code> — see{' '}
          <code>docs/ha-setup.md</code>.
        </p>
      </form>
    </div>
  );
}
