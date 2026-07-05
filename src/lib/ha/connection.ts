import {
  createConnection,
  createLongLivedTokenAuth,
  ERR_INVALID_AUTH,
  type Connection,
} from 'home-assistant-js-websocket';
import { signal } from '@preact/signals';
import { loadConfig } from '../config';

export type ConnectionStatus =
  | 'unconfigured'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'auth-failed';

export const connectionStatus = signal<ConnectionStatus>(
  loadConfig() ? 'connecting' : 'unconfigured',
);
export const disconnectedSince = signal<number | null>(null);

let connPromise: Promise<Connection> | null = null;
let activeConn: Connection | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Lazily connects to Home Assistant. The returned promise only rejects on
 * invalid auth or missing config; connection failures are retried forever
 * (wall displays must self-heal without a reload).
 */
export function getConnection(): Promise<Connection> {
  if (!connPromise) connPromise = connect();
  return connPromise;
}

async function connect(): Promise<Connection> {
  const cfg = loadConfig();
  if (!cfg) {
    connectionStatus.value = 'unconfigured';
    throw new Error('Home Assistant is not configured');
  }
  const auth = createLongLivedTokenAuth(cfg.hassUrl, cfg.token);
  connectionStatus.value = 'connecting';

  // createConnection only auto-retries once it has connected at least once;
  // this loop covers the initial connect (e.g. dashboard boots before HA).
  let delay = 2000;
  for (;;) {
    try {
      const conn = await createConnection({ auth });
      activeConn = conn;
      connectionStatus.value = 'connected';
      disconnectedSince.value = null;

      conn.addEventListener('ready', () => {
        connectionStatus.value = 'connected';
        disconnectedSince.value = null;
      });
      conn.addEventListener('disconnected', () => {
        connectionStatus.value = 'reconnecting';
        if (disconnectedSince.peek() === null) disconnectedSince.value = Date.now();
      });
      conn.addEventListener('reconnect-error', (_conn, err) => {
        if (err === ERR_INVALID_AUTH) connectionStatus.value = 'auth-failed';
      });
      return conn;
    } catch (err) {
      if (err === ERR_INVALID_AUTH) {
        connectionStatus.value = 'auth-failed';
        connPromise = null;
        throw err;
      }
      connectionStatus.value = 'reconnecting';
      if (disconnectedSince.peek() === null) disconnectedSince.value = Date.now();
      await sleep(delay);
      delay = Math.min(delay * 1.5, 30_000);
      connectionStatus.value = 'connecting';
    }
  }
}

// Kiosk browsers throttle timers in background tabs; when the display wakes
// up while disconnected, force an immediate reconnect attempt.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && activeConn && connectionStatus.peek() === 'reconnecting') {
      activeConn.reconnect();
    }
  });
}
