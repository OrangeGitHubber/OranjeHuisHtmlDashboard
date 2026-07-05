import { subscribeEntities, type HassEntities, type HassEntity } from 'home-assistant-js-websocket';
import { signal, type Signal, type ReadonlySignal } from '@preact/signals';
import { getConnection } from './connection';

/**
 * Per-entity signal store. One subscribeEntities handler feeds fine-grained
 * signals; a signal only updates when its entity object's identity changed
 * (home-assistant-js-websocket reuses objects for unchanged entities), so a
 * light toggling in the hallway never re-renders the calendar.
 */

const entitySignals = new Map<string, Signal<HassEntity | undefined>>();
const domainSignals = new Map<string, Signal<HassEntity[]>>();

let lastStates: HassEntities = {};
let subscribed = false;

function ensureSubscribed(): void {
  if (subscribed) return;
  subscribed = true;
  getConnection()
    .then((conn) => {
      subscribeEntities(conn, onStates);
    })
    .catch(() => {
      subscribed = false; // unconfigured/auth-failed; retried after setup
    });
}

function onStates(states: HassEntities): void {
  lastStates = states;
  for (const [id, sig] of entitySignals) {
    const next = states[id];
    if (sig.peek() !== next) sig.value = next;
  }
  for (const [domain, sig] of domainSignals) {
    const next = collectDomain(domain);
    if (!sameEntityList(sig.peek(), next)) sig.value = next;
  }
}

function collectDomain(domain: string): HassEntity[] {
  const prefix = `${domain}.`;
  const list: HassEntity[] = [];
  for (const id in lastStates) {
    if (id.startsWith(prefix)) list.push(lastStates[id]);
  }
  list.sort((a, b) => a.entity_id.localeCompare(b.entity_id));
  return list;
}

function sameEntityList(a: HassEntity[], b: HassEntity[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function useEntity(entityId: string): ReadonlySignal<HassEntity | undefined> {
  let sig = entitySignals.get(entityId);
  if (!sig) {
    sig = signal<HassEntity | undefined>(lastStates[entityId]);
    entitySignals.set(entityId, sig);
  }
  ensureSubscribed();
  return sig;
}

export function useEntitiesByDomain(domain: string): ReadonlySignal<HassEntity[]> {
  let sig = domainSignals.get(domain);
  if (!sig) {
    sig = signal<HassEntity[]>(collectDomain(domain));
    domainSignals.set(domain, sig);
  }
  ensureSubscribed();
  return sig;
}
