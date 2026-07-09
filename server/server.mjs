import { createServer } from 'node:http';
import { serveStatic, isKnownAssetExtension } from './static.mjs';
import { handleConfig } from './api.mjs';
import { handleVersion } from './version.mjs';
import { proxyRest, attachWsProxy } from './ha-proxy.mjs';
import {
  AUTH_PATHS,
  isAuthConfigured,
  isAuthed,
  handleLogin,
  handleAuthGoogle,
  handleAuthGoogleCallback,
  handleAuthLogout,
} from './auth.mjs';

const PORT = Number(process.env.PORT) || 80;

/** Requests that "look like" API/asset fetches get a plain 401 instead of a
 * redirect when unauthenticated, since redirecting a fetch()/XHR to an HTML
 * login page just produces a confusing opaque response for the caller. */
function looksLikeApiOrAsset(path) {
  return (
    path.startsWith('/config/') ||
    path.startsWith('/ha/') ||
    path === '/version' ||
    isKnownAssetExtension(path)
  );
}

const server = createServer((req, res) => {
  const path = (req.url || '/').split('?')[0];

  const handled = (async () => {
    // Single central fail-closed gate: every route below (including /login
    // and the other auth routes) assumes this has already run, so their own
    // per-handler isAuthConfigured() checks were removed as redundant.
    if (!isAuthConfigured()) return handleLogin(req, res); // serves the "not configured" page

    if (AUTH_PATHS.has(path)) {
      if (path === '/login') return handleLogin(req, res);
      if (path === '/auth/google') return handleAuthGoogle(req, res);
      if (path === '/auth/google/callback') return handleAuthGoogleCallback(req, res);
      if (path === '/auth/logout') return handleAuthLogout(req, res);
    }

    if (!(await isAuthed(req))) {
      if (looksLikeApiOrAsset(path)) {
        res.writeHead(401, { 'Content-Type': 'text/plain' }).end('Unauthorized');
        return;
      }
      res.writeHead(302, { Location: '/login' });
      res.end();
      return;
    }

    return path === '/version'
      ? handleVersion(req, res)
      : path.startsWith('/config/')
        ? handleConfig(req, res)
        : path.startsWith('/ha/')
          ? proxyRest(req, res)
          : serveStatic(req, res);
  })();

  Promise.resolve(handled).catch((err) => {
    console.error('request failed', err);
    if (!res.headersSent) res.writeHead(500);
    res.end('Server error');
  });
});

// /ha/api/websocket upgrades are handled here
attachWsProxy(server);

server.listen(PORT, () => {
  console.log(`haview server listening on :${PORT}`);
});
