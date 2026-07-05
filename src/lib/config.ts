export interface AppConfig {
  hassUrl: string;
  token: string;
}

const STORAGE_KEY = 'oranjehuis.config.v1';

export function normalizeHassUrl(url: string): string {
  let u = url.trim();
  if (u === '') return '';
  if (!/^https?:\/\//i.test(u)) u = `http://${u}`;
  return u.replace(/\/+$/, '');
}

export function loadConfig(): AppConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw) as AppConfig;
    if (!cfg.hassUrl || !cfg.token) return null;
    return cfg;
  } catch {
    return null;
  }
}

export function saveConfig(cfg: AppConfig): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ hassUrl: normalizeHassUrl(cfg.hassUrl), token: cfg.token.trim() }),
  );
}

export function clearConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}
