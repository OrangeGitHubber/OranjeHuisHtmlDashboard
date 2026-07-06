# Oranjehuis

A fast, self-hosted dashboard for Home Assistant — built for wall-mounted displays and
phones. Static Preact + TypeScript app that talks directly to HA's WebSocket and REST
APIs; no backend.

## Features

- **User-defined pages** — the navigation is yours: add, rename, re-icon, and reorder
  pages in Settings. Each page is a 12-column grid you lay out yourself: tap the ✎
  button, then drag, resize (snap-to-grid), and delete elements freely. Layouts persist
  per device and travel via Settings → Export/Import.
- **Any HA entity as a card** — the Add dialog browses every entity grouped by HA Area,
  searchable by name/id and filterable by HA Labels. Cards adapt to capabilities:
  on/off-only lights toggle, dimmable/color lights get brightness, color-temperature and
  color controls; climate gets target temp + HVAC modes; media players get transport +
  volume; scenes/scripts/buttons fire on tap; sensors display live values.
- **Widgets** — 7-day week calendar (configurable HA calendars), weather, and family
  presence, placeable on any page like any other element
- **Cameras** — auto-refreshing UniFi camera grid, tap for full-screen live stream (HLS)
- **Themes** — five accent themes (Oranje default), switchable in Settings

Dark theme by default (light follows the OS setting), bottom tabs on phones, sidebar on
wide screens (pages stack single-column on narrow screens). Auto-reconnects forever —
built to survive HA restarts and network drops without a reload.

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

## Adding an element type

Pages and navigation are user data (settings v2, localStorage `oranjehuis.settings.v2`),
so there is nothing to code for a new page. To add a new placeable element type:

1. Create the component (see `src/elements/EntityCard.tsx` for the entity card, or the
   widgets under `src/views/main/`). It receives `{ pageId, element, editing }` props
   (`element.options` holds per-instance config) — or no props at all.
2. Add one entry to `elementDefs` in `src/grid/elements.ts` (type, title, module-level
   `load` import, default/min size).

Code splitting follows automatically. Use the data layer in `src/lib/ha/`:

- `useEntity(id)` / `useEntitiesByDomain(domain)` — live entity signals (fine-grained;
  only components reading a changed entity re-render)
- `callSvc(domain, service, data, target)` — fire HA service calls
- `ensureRegistries()` + `areas/devices/entityEntries/labels` signals — HA registries,
  loaded lazily (only the Add-element picker needs them)
- `haFetch(path)` — authenticated REST
- `getSignedUrl(path)` — signed URLs for authenticated media (`<img>`-safe)

## Architecture notes

- `src/lib/ha/connection.ts` — single WebSocket connection, retries forever, exposes a
  `connectionStatus` signal
- No router library: `location.hash` ↔ `currentRoute` signal; Shell resolves the route
  against `settings.pages` (unknown routes fall back to the first page)
- No grid library: drag/resize is hand-rolled on pointer events with pointer capture;
  positions are `{x, y, w, h}` grid cells (12 columns, 56px rows), free placement with
  collision-blocked drops
- `hls.js` is only loaded (as its own chunk) when a stream is opened
- Camera snapshots are staggered and pause while the tab is hidden or HA is unreachable
