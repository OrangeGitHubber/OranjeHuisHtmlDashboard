import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = process.env.DATA_DIR || '/data';
const CONN_FILE = join(DATA, 'connection.json');
const PROFILES_DIR = join(DATA, 'profiles');
const TEMPLATES_DIR = fileURLToPath(new URL('./templates', import.meta.url));

let connCache; // { hassUrl, token } | null | undefined (undefined = not loaded)

export function normalizeHassUrl(url) {
  let u = String(url || '').trim();
  if (u === '') return '';
  if (!/^https?:\/\//i.test(u)) u = `http://${u}`;
  return u.replace(/\/+$/, '');
}

/** The stored HA connection { hassUrl, token }, or null if unconfigured. */
export async function getConnection() {
  if (connCache !== undefined) return connCache;
  try {
    const parsed = JSON.parse(await readFile(CONN_FILE, 'utf8'));
    connCache = parsed && parsed.hassUrl && parsed.token ? parsed : null;
  } catch {
    connCache = null;
  }
  return connCache;
}

export async function setConnection(hassUrl, token) {
  await mkdir(DATA, { recursive: true });
  connCache = { hassUrl: normalizeHassUrl(hassUrl), token: String(token).trim() };
  await writeFile(CONN_FILE, JSON.stringify(connCache), { mode: 0o600 });
  return connCache;
}

/* ---------- config profiles ---------- */

/** Restrict a profile name to a safe filename stem. */
export function safeName(name) {
  return String(name || '')
    .replace(/[^A-Za-z0-9 _-]/g, '')
    .trim()
    .slice(0, 60);
}

/** User profiles (from /data) + built-in templates (shipped, read-only). */
export async function listProfiles() {
  const out = [];
  const seen = new Set();
  try {
    for (const f of await readdir(PROFILES_DIR)) {
      if (f.endsWith('.json')) {
        const name = f.slice(0, -5);
        out.push({ name, template: false });
        seen.add(name.toLowerCase());
      }
    }
  } catch {
    /* no profiles dir yet */
  }
  try {
    for (const f of await readdir(TEMPLATES_DIR)) {
      if (f.endsWith('.json')) {
        const name = f.slice(0, -5);
        if (!seen.has(name.toLowerCase())) out.push({ name, template: true });
      }
    }
  } catch {
    /* no templates */
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

/** Reads a profile — a user profile shadows a template of the same name. */
export async function readProfile(name) {
  const safe = safeName(name);
  if (!safe) return null;
  try {
    return JSON.parse(await readFile(join(PROFILES_DIR, safe + '.json'), 'utf8'));
  } catch {
    /* not a user profile — try templates */
  }
  try {
    return JSON.parse(await readFile(join(TEMPLATES_DIR, safe + '.json'), 'utf8'));
  } catch {
    return null;
  }
}

export async function writeProfile(name, data) {
  const safe = safeName(name);
  if (!safe) throw new Error('invalid profile name');
  await mkdir(PROFILES_DIR, { recursive: true });
  await writeFile(join(PROFILES_DIR, safe + '.json'), JSON.stringify(data), { mode: 0o644 });
  return safe;
}

export async function deleteProfile(name) {
  const safe = safeName(name);
  if (!safe) return;
  try {
    await unlink(join(PROFILES_DIR, safe + '.json'));
  } catch {
    /* already gone */
  }
}

export { DATA };
