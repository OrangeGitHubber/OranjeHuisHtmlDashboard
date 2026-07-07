# Home Assistant setup for HAView

The dashboard container connects to Home Assistant on your behalf (it reverse-proxies HA),
so there are only two one-time steps — **no CORS configuration is needed** anymore.

## 1. Create a long-lived access token

1. In Home Assistant, click your user (bottom left) → **Security** tab.
2. Scroll to **Long-lived access tokens** → **Create token**, name it e.g. `haview`.
3. Paste it into the dashboard's setup screen **once**. It is stored in the container
   (the `/data` volume) and used by the server — it is never sent to any browser, so you
   never enter it per device.

Tip: create a dedicated HA user for the dashboard so a token can be revoked without
affecting your own account.

## 2. Camera streaming

- Live streams use WebRTC (the same path HA's own UI uses for UniFi Protect / go2rtc),
  falling back to HLS via the `stream` integration (part of HA's `default_config:`).
- WebRTC media is peer-to-peer between the viewing device and go2rtc on your LAN, so the
  viewing device must be able to reach Home Assistant on the network. For UniFi Protect,
  enable **RTSPS** on the camera channel if a stream fails to start.

## Reachability

The **dashboard container** must be able to reach the Home Assistant URL you enter (it
makes the connection, not the browser). Browsers only need to reach the dashboard. If the
dashboard is served over https, use an https HA URL (the container still connects directly,
but WebRTC media between the device and HA should not be mixed-content-blocked).

## Wall displays / kiosk

Point a kiosk browser at the dashboard URL, e.g.:

- **Android tablets**: Fully Kiosk Browser or WallPanel
- **Old iPads**: Guided Access + Safari

The app reconnects automatically after HA restarts or network drops, so displays never need
a manual reload. Each screen can show a different **profile** (Settings → Profiles); the
selection is remembered per device.
