# Home Assistant setup for Oranjehuis

Three one-time steps on the Home Assistant side.

## 1. Create a long-lived access token

1. In Home Assistant, click your user (bottom left) → **Security** tab.
2. Scroll to **Long-lived access tokens** → **Create token**, name it e.g. `oranjehuis`.
3. Copy the token and paste it into the dashboard's setup screen. Do this once per device
   (each browser stores its own copy).

Tip: consider creating a dedicated HA user for wall displays so a leaked token can be
revoked without affecting your own account.

## 2. Allow CORS for the REST API

The WebSocket connection works from any origin, but REST calls (used for calendars) are
blocked unless the dashboard's origin is allow-listed. In `configuration.yaml`:

```yaml
http:
  cors_allowed_origins:
    - http://YOUR-UNRAID-IP:8090        # the deployed dashboard
    - https://dash.your-domain.example   # if served remotely
    - http://YOUR-DEV-PC-IP:5173         # vite dev server, during development
```

Restart Home Assistant afterwards. List **every** origin the dashboard is opened from —
the setup screen tests this and tells you the exact origin string to add.

Note: if the dashboard is served over **https**, the HA URL must also be https (browsers
block mixed content).

## 3. Camera streaming

- Live streams use HLS via the `stream` integration, which is part of HA's default
  config. If you have removed `default_config:`, add `stream:` back.
- UniFi Protect cameras need no extra configuration — the dashboard uses their HA camera
  entities for both snapshots and streams.

## Wall displays / kiosk

Point a kiosk browser at the dashboard URL, e.g.:

- **Android tablets**: Fully Kiosk Browser or WallPanel
- **Old iPads**: Guided Access + Safari

The app reconnects automatically after HA restarts or network drops, so displays never
need a manual reload. New deploys are picked up on the next page reload.
