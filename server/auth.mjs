import { randomBytes, createHmac, timingSafeEqual } from 'node:crypto';
import { readFile, writeFile, mkdir, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { OAuth2Client } from 'google-auth-library';
import { DATA } from './config-store.mjs';

const SESSION_COOKIE = 'haview_session';
const STATE_COOKIE = 'haview_oauth_state';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days, in seconds
const STATE_MAX_AGE = 5 * 60; // 5 minutes, in seconds
const SECRET_FILE = join(DATA, 'session-secret');

let secretPromise; // Promise<string> | undefined (undefined = not started)

/**
 * The HMAC secret used to sign session cookies. Uses SESSION_SECRET if set,
 * otherwise generates one on first use and persists it to DATA_DIR so
 * sessions survive restarts. Memoizes the in-flight promise (not just the
 * resolved value) so concurrent first-boot callers all await the same
 * execution instead of racing to independently generate+write a secret.
 *
 * This intentionally mirrors config-store.mjs's DATA-relative persistence
 * convention (cache + try-read-file + mkdir+writeFile-with-mode-0600), but
 * uses promise-memoization instead of a plain value cache, specifically
 * because this function (unlike getConnection()) can generate and write a
 * new file on a cache miss and must not do that twice concurrently.
 */
function getSessionSecret() {
  if (!secretPromise) {
    secretPromise = (async () => {
      if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
      try {
        const existing = (await readFile(SECRET_FILE, 'utf8')).trim();
        if (existing) return existing;
      } catch {
        /* not generated yet */
      }
      const generated = randomBytes(32).toString('hex');
      await mkdir(DATA, { recursive: true });
      await writeFile(SECRET_FILE, generated, { mode: 0o600 });
      // mode on writeFile only applies when the file is newly created; chmod
      // explicitly so permissions are tightened even if the file pre-existed.
      await chmod(SECRET_FILE, 0o600);
      return generated;
    })();
  }
  return secretPromise;
}

/**
 * Whether OAuth is fully configured. The app fails closed: if any of these
 * are missing, every route (including /login) must refuse to serve instead
 * of running open.
 */
export function isAuthConfigured() {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.ALLOWED_GOOGLE_EMAILS &&
    process.env.PUBLIC_URL
  );
}

let allowedEmailsCache; // string[] | undefined (undefined = not parsed)

function allowedEmails() {
  if (allowedEmailsCache === undefined) {
    allowedEmailsCache = String(process.env.ALLOWED_GOOGLE_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }
  return allowedEmailsCache;
}

export function isEmailAllowed(email) {
  return allowedEmails().includes(String(email || '').trim().toLowerCase());
}

function redirectUri() {
  return `${String(process.env.PUBLIC_URL).replace(/\/+$/, '')}/auth/google/callback`;
}

/* ---------- cookies ---------- */

/** Parse `Cookie` header into a plain object. */
export function parseCookies(req) {
  const header = req.headers && req.headers.cookie;
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
  }
  return out;
}

/** Whether cookies should carry the Secure flag, derived from PUBLIC_URL's
 * scheme (the same trusted, non-request-derived source redirectUri() uses)
 * so plain-HTTP deployments (e.g. LAN testing before TLS is fronted) don't
 * have their Set-Cookie silently dropped by the browser. */
function cookieSecure() {
  return String(process.env.PUBLIC_URL || '').toLowerCase().startsWith('https://');
}

/** Build a Set-Cookie header value. */
function serializeCookie(name, value, { maxAge, httpOnly = true, path = '/' } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${path}`, 'SameSite=Lax'];
  if (httpOnly) parts.push('HttpOnly');
  if (cookieSecure()) parts.push('Secure');
  if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`);
  return parts.join('; ');
}

/** Append a Set-Cookie header to a response (preserving any already set). */
function appendSetCookie(res, cookie) {
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', cookie);
  } else if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookie]);
  } else {
    res.setHeader('Set-Cookie', [existing, cookie]);
  }
}

/* ---------- session signing ---------- */

function sign(secret, payload) {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

function safeEqual(a, b) {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Set the signed session cookie for a verified, allow-listed email.
 * Stateless: the cookie itself carries the email + expiry, HMAC-signed.
 */
export async function setSessionCookie(res, email) {
  const secret = await getSessionSecret();
  const expires = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${email}:${expires}`;
  const sig = sign(secret, payload);
  const token = Buffer.from(`${payload}:${sig}`, 'utf8').toString('base64url');
  appendSetCookie(res, serializeCookie(SESSION_COOKIE, token, { maxAge: SESSION_MAX_AGE }));
}

/** Clear the session cookie. */
export function clearSessionCookie(res) {
  appendSetCookie(res, serializeCookie(SESSION_COOKIE, '', { maxAge: 0 }));
}

/**
 * Verify the session cookie on a request. Returns the verified session
 * { email } if valid and not expired, otherwise null.
 */
export async function getSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  let decoded;
  try {
    decoded = Buffer.from(token, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  const lastColon = decoded.lastIndexOf(':');
  if (lastColon === -1) return null;
  const payload = decoded.slice(0, lastColon);
  const sig = decoded.slice(lastColon + 1);
  const parts = payload.split(':');
  if (parts.length !== 2) return null;
  const [email, expiresStr] = parts;
  const expires = Number(expiresStr);
  if (!email || !Number.isFinite(expires)) return null;

  const secret = await getSessionSecret();
  const expectedSig = sign(secret, payload);
  if (!safeEqual(sig, expectedSig)) return null;
  if (Date.now() > expires) return null;
  if (!isEmailAllowed(email)) return null; // allow-list can shrink after issue

  return { email, expires };
}

/** Whether the request carries a valid session for an allow-listed email. */
export async function isAuthed(req) {
  return (await getSession(req)) !== null;
}

/* ---------- OAuth state (CSRF) ---------- */

function setStateCookie(res, state) {
  appendSetCookie(res, serializeCookie(STATE_COOKIE, state, { maxAge: STATE_MAX_AGE }));
}

function clearStateCookie(res) {
  appendSetCookie(res, serializeCookie(STATE_COOKIE, '', { maxAge: 0 }));
}

/* ---------- routes ---------- */

const COLORS = {
  bg: '#151312',
  surface: '#201d1b',
  border: '#383330',
  text: '#f2ede8',
  textDim: '#a89e95',
  accent: '#f28c28',
  accentText: '#1d1206',
};

const NOT_CONFIGURED_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Not configured</title></head>
<body style="background:${COLORS.bg};color:${COLORS.text};font-family:system-ui,sans-serif;
display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
<div style="text-align:center;max-width:32rem;padding:2rem;">
<h1 style="color:${COLORS.accent};">Google auth is not configured</h1>
<p>This dashboard requires Google sign-in to be configured before it can be reached.
Set <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code>,
<code>ALLOWED_GOOGLE_EMAILS</code>, and <code>PUBLIC_URL</code> on the server, then
restart it.</p>
</div></body></html>`;

function serveNotConfigured(res) {
  res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(NOT_CONFIGURED_HTML);
}

const LOGIN_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Sign in — Oranjehuis</title>
<meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="background:${COLORS.bg};color:${COLORS.text};font-family:system-ui,sans-serif;
display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
<div style="background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:12px;
padding:2.5rem 3rem;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.4);
max-width:22rem;">
<h1 style="margin:0 0 0.5rem;font-size:1.4rem;">Oranjehuis</h1>
<p style="margin:0 0 1.75rem;color:${COLORS.textDim};font-size:0.95rem;">
Sign in to view the dashboard.</p>
<a href="/auth/google" style="display:inline-block;background:${COLORS.accent};color:${COLORS.accentText};
text-decoration:none;font-weight:600;padding:0.7rem 1.5rem;border-radius:8px;
font-size:0.95rem;">Continue with Google</a>
</div></body></html>`;

/** GET /login — unauthenticated, self-contained HTML page. Also serves the
 * "not configured" page when auth isn't set up (the router's central
 * isAuthConfigured() gate routes here in that case, rather than this
 * checking it independently). */
export function handleLogin(req, res) {
  if (!isAuthConfigured()) {
    serveNotConfigured(res);
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(LOGIN_HTML);
}

/** GET /auth/google — redirect to Google's OAuth consent screen. Assumes the
 * router's central isAuthConfigured() gate has already run. */
export function handleAuthGoogle(req, res) {
  const state = randomBytes(16).toString('hex');
  setStateCookie(res, state);

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: 'openid email',
    state,
    prompt: 'select_account',
  });
  res.writeHead(302, { Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  res.end();
}

/** GET /auth/google/callback — exchange code, verify id_token, check allow-list.
 * Assumes the router's central isAuthConfigured() gate has already run. */
export async function handleAuthGoogleCallback(req, res) {
  const url = new URL(req.url, 'http://internal');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookies = parseCookies(req);
  const expectedState = cookies[STATE_COOKIE];

  clearStateCookie(res);

  if (!code || !state || !expectedState || !safeEqual(state, expectedState)) {
    res.writeHead(400, { 'Content-Type': 'text/plain' }).end('Invalid OAuth state.');
    return;
  }

  let tokenRes;
  try {
    tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri(),
        grant_type: 'authorization_code',
      }),
    });
  } catch {
    res.writeHead(502, { 'Content-Type': 'text/plain' }).end('Could not reach Google.');
    return;
  }

  if (!tokenRes.ok) {
    res.writeHead(401, { 'Content-Type': 'text/plain' }).end('Google sign-in failed.');
    return;
  }

  const tokens = await tokenRes.json();
  if (!tokens.id_token) {
    res.writeHead(401, { 'Content-Type': 'text/plain' }).end('Google sign-in failed.');
    return;
  }

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    res.writeHead(401, { 'Content-Type': 'text/plain' }).end('Could not verify Google identity.');
    return;
  }

  const email = payload && payload.email && payload.email_verified ? payload.email : null;
  if (!email || !isEmailAllowed(email)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' }).end('Not authorized.');
    return;
  }

  await setSessionCookie(res, email);
  res.writeHead(302, { Location: '/' });
  res.end();
}

/** GET /auth/logout — clear the session cookie and redirect to /login.
 * SameSite=Lax cookies are still sent on cross-site top-level GET
 * navigations, so a malicious page could force-navigate a signed-in victim
 * here to silently clear their session. Sec-Fetch-Site is sent by all modern
 * browsers on every navigation; refuse only when it explicitly says
 * cross-site. Direct address-bar/manual navigation (the documented sign-out
 * flow) sends 'none', a same-app link sends 'same-origin', and older
 * browsers that send no Sec-Fetch-Site at all are let through unchanged so
 * this doesn't regress for them. */
export function handleAuthLogout(req, res) {
  if (req.headers['sec-fetch-site'] === 'cross-site') {
    res.writeHead(400, { 'Content-Type': 'text/plain' }).end('Refused.');
    return;
  }
  clearSessionCookie(res);
  res.writeHead(302, { Location: '/login' });
  res.end();
}

export const AUTH_PATHS = new Set([
  '/login',
  '/auth/google',
  '/auth/google/callback',
  '/auth/logout',
]);
