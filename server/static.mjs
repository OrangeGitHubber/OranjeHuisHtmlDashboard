import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

/** Whether a path ends in a known static-asset extension (the same set
 * MIME serves), single-sourcing "what counts as an asset" for callers
 * outside this module (e.g. server.mjs's unauthenticated-request routing). */
export function isKnownAssetExtension(path) {
  return Object.prototype.hasOwnProperty.call(MIME, extname(path).toLowerCase());
}

/** Serve the built SPA with an index.html fallback (client-side routing). */
export async function serveStatic(req, res) {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  let filePath = normalize(join(DIST, urlPath));
  // block path traversal outside the dist dir
  if (filePath !== DIST && !filePath.startsWith(DIST + '/') && !filePath.startsWith(DIST + '\\')) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  let isFile = false;
  try {
    isFile = (await stat(filePath)).isFile();
  } catch {
    isFile = false;
  }
  if (!isFile) filePath = join(DIST, 'index.html'); // SPA fallback

  let body;
  try {
    body = await readFile(filePath);
  } catch {
    res.writeHead(404).end('Not found');
    return;
  }

  const type = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
  const headers = { 'Content-Type': type };
  if (urlPath.startsWith('/assets/')) {
    headers['Cache-Control'] = 'public, max-age=31536000, immutable';
  } else if (filePath.endsWith('index.html')) {
    headers['Cache-Control'] = 'no-cache';
  }
  res.writeHead(200, headers);
  res.end(body);
}
