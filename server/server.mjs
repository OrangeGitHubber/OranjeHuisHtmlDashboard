import { createServer } from 'node:http';
import { serveStatic } from './static.mjs';

const PORT = Number(process.env.PORT) || 80;

const server = createServer((req, res) => {
  // (config API and HA reverse proxy are added in later commits)
  serveStatic(req, res).catch((err) => {
    console.error('request failed', err);
    if (!res.headersSent) res.writeHead(500);
    res.end('Server error');
  });
});

server.listen(PORT, () => {
  console.log(`oranjehuis server listening on :${PORT}`);
});
