import { loadConfig } from '../config';

export class HaRestError extends Error {
  /** status 0 means the fetch itself failed — usually a CORS or network problem */
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HaRestError';
  }

  get isLikelyCors(): boolean {
    return this.status === 0;
  }
}

export async function haFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cfg = loadConfig();
  if (!cfg) throw new HaRestError(0, 'Home Assistant is not configured');

  let res: Response;
  try {
    res = await fetch(cfg.hassUrl + path, {
      ...init,
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  } catch {
    throw new HaRestError(
      0,
      'Could not reach the Home Assistant REST API (network error or missing cors_allowed_origins)',
    );
  }
  if (!res.ok) {
    throw new HaRestError(res.status, `Home Assistant API returned ${res.status} for ${path}`);
  }
  return res.json() as Promise<T>;
}
