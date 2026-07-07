import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const INDEX = fileURLToPath(new URL('../dist/index.html', import.meta.url));

// Compute once at startup: a short hash of index.html. Each build rewrites
// index.html with new hashed asset filenames, so the hash changes only when a
// new image is deployed — the browser polls /version to detect that.
let version;
try {
  const buf = await readFile(INDEX);
  version = createHash('sha1').update(buf).digest('hex').slice(0, 12);
} catch {
  version = String(Date.now());
}

export function handleVersion(req, res) {
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify({ version }));
}
