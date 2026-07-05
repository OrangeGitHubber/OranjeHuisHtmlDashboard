# Oranjehuis

A fast, self-hosted dashboard for Home Assistant — built for wall-mounted displays and
phones. Static Preact + TypeScript app that talks directly to HA's WebSocket and REST
APIs; no backend.

## Features (v1)

- **Agenda** — 7-day view of all HA calendars
- **Cameras** — auto-refreshing UniFi camera grid, tap for full-screen live stream (HLS)
- **People** — who's home, which zone, since when (live, no polling)

Dark theme by default (light follows the OS setting), bottom tabs on phones, sidebar on
wide screens. Auto-reconnects forever — built to survive HA restarts and network drops
without a reload.

## Development

```bash
npm install
npm run dev        # serves on all interfaces so phones on the LAN can test
```

First launch shows a setup screen: enter your HA URL and a long-lived access token.
**See [docs/ha-setup.md](docs/ha-setup.md) for the required Home Assistant configuration
(token + CORS).** Settings live in the browser's localStorage only.

## Deploy (GitHub → unraid)

Every push to `main` runs [the CI workflow](.github/workflows/build.yml): it type-checks,
builds, and publishes a ready-to-run image to GitHub Container Registry as
`ghcr.io/<owner>/<repo>:latest`.

On unraid, add a container from that image (Docker tab → Add Container):

- **Repository**: `ghcr.io/<owner>/<repo>:latest`
- **Port**: host `8090` → container `80`

Updating = push to GitHub, then re-pull the image on unraid. If the GitHub repo is
private, add a registry login on unraid (`docker login ghcr.io` with a token that has
`read:packages`), or make the package public in the repo's package settings.

Alternatively, build from source on any Docker host:

```bash
docker compose -f deploy/docker-compose.yml up -d --build
```

Serves on port `8090` either way.

## Adding a view

1. Create a folder under `src/views/<name>/` with a default-exported component.
2. Add one entry to `src/views/registry.ts` (id, title, icon path, `load` import).

Navigation and code splitting follow automatically. Use the data layer in `src/lib/ha/`:

- `useEntity(id)` / `useEntitiesByDomain(domain)` — live entity signals (fine-grained;
  only components reading a changed entity re-render)
- `haFetch(path)` — authenticated REST
- `getSignedUrl(path)` — signed URLs for authenticated media (`<img>`-safe)

## Architecture notes

- `src/lib/ha/connection.ts` — single WebSocket connection, retries forever, exposes a
  `connectionStatus` signal
- No router library: `location.hash` ↔ `currentViewId` signal
- `hls.js` is only loaded (as its own chunk) when a stream is opened
- Camera snapshots are staggered and pause while the tab is hidden or HA is unreachable
