import { callService } from 'home-assistant-js-websocket';
import { getConnection } from './connection';

/**
 * Fire a HA service call from a card. Failures are swallowed: on a wall
 * display the StatusBanner already communicates disconnects, and the card's
 * state simply won't change.
 */
export async function callSvc(
  domain: string,
  service: string,
  data?: Record<string, unknown>,
  target?: { entity_id: string },
): Promise<void> {
  try {
    const conn = await getConnection();
    await callService(conn, domain, service, data, target);
  } catch {
    /* not connected / rejected — visible via StatusBanner + unchanged state */
  }
}
