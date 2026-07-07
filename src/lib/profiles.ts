/**
 * Client for the container's config-profile API. Profiles (the full settings
 * object) are stored server-side and shared across devices; which profile a
 * given screen shows is remembered per device in localStorage.
 */

export interface ProfileInfo {
  name: string;
  template: boolean;
}

const SEL_KEY = 'haview.profile';

export function currentProfileName(): string {
  try {
    return localStorage.getItem(SEL_KEY) || 'Default';
  } catch {
    return 'Default';
  }
}

export function setCurrentProfileName(name: string): void {
  try {
    localStorage.setItem(SEL_KEY, name);
  } catch {
    /* ignore */
  }
}

export async function listProfiles(): Promise<ProfileInfo[]> {
  try {
    const r = await fetch('/config/profiles');
    if (r.ok) return (await r.json()) as ProfileInfo[];
  } catch {
    /* server offline */
  }
  return [];
}

export async function loadProfile(name: string): Promise<unknown | null> {
  try {
    const r = await fetch('/config/profiles/' + encodeURIComponent(name));
    if (r.ok) return await r.json();
  } catch {
    /* server offline */
  }
  return null;
}

export async function saveProfile(name: string, data: unknown): Promise<boolean> {
  try {
    const r = await fetch('/config/profiles/' + encodeURIComponent(name), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function deleteProfile(name: string): Promise<boolean> {
  try {
    const r = await fetch('/config/profiles/' + encodeURIComponent(name), { method: 'DELETE' });
    return r.ok;
  } catch {
    return false;
  }
}
