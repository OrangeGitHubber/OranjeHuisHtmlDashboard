import { useEffect, useRef, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import type { HassEntity } from 'home-assistant-js-websocket';
import type HlsType from 'hls.js';
import { getConnection } from '../../lib/ha/connection';
import { loadConfig } from '../../lib/config';
import { Spinner } from '../../components/Spinner';
import { useSnapshot } from './useSnapshot';
import styles from './cameras.module.css';

const START_TIMEOUT_MS = 15_000;

/**
 * Live camera view. Tries WebRTC first (this is what HA's own UI uses for
 * UniFi Protect / go2rtc), falling back to HLS. Playback is detected from
 * the <video> element's own events, and a hard timeout guarantees the user
 * always gets feedback instead of an endless spinner.
 */
export function StreamModal({ entity, onClose }: { entity: HassEntity; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pressedBackdrop = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const name = (entity.attributes.friendly_name as string | undefined) ?? entity.entity_id;
  const { src: snapshotSrc } = useSnapshot(
    entity.entity_id,
    0,
    entity.attributes.entity_picture as string | undefined,
  );

  useEffect(() => {
    let cancelled = false;
    let started = false;
    let hls: HlsType | null = null;
    let pc: RTCPeerConnection | null = null;
    let unsub: (() => void) | null = null;
    const video = videoRef.current;

    const markPlaying = () => {
      if (cancelled) return;
      started = true;
      window.clearTimeout(timeout);
      setStarting(false);
    };

    const timeout = window.setTimeout(() => {
      if (cancelled || started) return;
      setError(
        'Timed out starting the live stream. This camera may only stream over WebRTC that could not connect, or the stream is not reachable through your reverse proxy. Snapshots still update below.',
      );
      setStarting(false);
    }, START_TIMEOUT_MS);

    if (video) {
      video.addEventListener('playing', markPlaying);
      video.addEventListener('loadeddata', markPlaying);
    }

    const features =
      typeof entity.attributes.supported_features === 'number'
        ? entity.attributes.supported_features
        : 0;
    const canStream = (features & 2) !== 0;

    // ---- WebRTC (matches HA's frontend) ----
    // Uses local refs and cleans up after itself on failure, handing the
    // connection off to the effect-scope pc/unsub only on success.
    async function tryWebRTC(): Promise<boolean> {
      if (!video || typeof RTCPeerConnection === 'undefined') return false;
      const localPc = new RTCPeerConnection({ iceServers: [] });
      let localUnsub: (() => void) | null = null;
      const giveUp = (): false => {
        if (localUnsub) localUnsub();
        localPc.close();
        return false;
      };
      try {
        const conn = await getConnection();
        localPc.addTransceiver('video', { direction: 'recvonly' });
        localPc.addTransceiver('audio', { direction: 'recvonly' });
        localPc.addEventListener('track', (ev) => {
          if (cancelled) return;
          if (video.srcObject !== ev.streams[0]) {
            video.srcObject = ev.streams[0];
            video.play().catch(() => {});
          }
        });

        const offer = await localPc.createOffer();
        await localPc.setLocalDescription(offer);
        // non-trickle: give ICE a moment to gather host candidates
        await new Promise<void>((res) => {
          if (localPc.iceGatheringState === 'complete') return res();
          const t = window.setTimeout(res, 2000);
          localPc.addEventListener('icegatheringstatechange', () => {
            if (localPc.iceGatheringState === 'complete') {
              window.clearTimeout(t);
              res();
            }
          });
        });
        const sdp = localPc.localDescription?.sdp;
        if (cancelled || !sdp) return giveUp();

        const answered = await new Promise<boolean>((resolve) => {
          let settled = false;
          const finish = (ok: boolean) => {
            if (!settled) {
              settled = true;
              resolve(ok);
            }
          };
          conn
            .subscribeMessage<{ type: string; answer?: string; candidate?: string }>(
              (msg) => {
                if (cancelled) return;
                if (msg.type === 'answer' && msg.answer) {
                  localPc.setRemoteDescription({ type: 'answer', sdp: msg.answer }).catch(() => {});
                  finish(true);
                } else if (msg.type === 'candidate' && msg.candidate) {
                  localPc
                    .addIceCandidate({ candidate: msg.candidate, sdpMLineIndex: 0 })
                    .catch(() => {});
                } else if (msg.type === 'error') {
                  finish(false);
                }
              },
              { type: 'camera/webrtc/offer', entity_id: entity.entity_id, offer: sdp },
            )
            .then((u) => {
              localUnsub = u;
            })
            .catch(() => finish(false)); // command unknown on old HA → fall back
          // no answer in time → abandon WebRTC, let HLS try
          window.setTimeout(() => finish(false), 6000);
        });

        if (!answered || cancelled) return giveUp();
        // success: hand off so the effect cleanup tears it down
        pc = localPc;
        unsub = localUnsub;
        return true;
      } catch {
        return giveUp();
      }
    }

    // ---- HLS fallback ----
    async function tryHLS(): Promise<void> {
      if (!video) return;
      try {
        const conn = await getConnection();
        const { url } = await conn.sendMessagePromise<{ url: string }>({
          type: 'camera/stream',
          entity_id: entity.entity_id,
        });
        const cfg = loadConfig();
        if (!cfg) throw new Error('not configured');
        const streamUrl = cfg.hassUrl + url;
        if (cancelled) return;

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl; // iOS / Safari native HLS
          video.play().catch(() => {});
        } else {
          const { default: Hls } = await import('hls.js');
          if (cancelled) return;
          if (!Hls.isSupported()) throw new Error('HLS unsupported in this browser');
          hls = new Hls({ liveSyncDurationCount: 3, enableWorker: true });
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
          hls.on(Hls.Events.ERROR, (_ev, data) => {
            if (data.fatal && !cancelled && !started) {
              setError(
                `The live stream failed (${data.type}: ${data.details}). WebRTC also did not connect — snapshots still update below.`,
              );
              setStarting(false);
              window.clearTimeout(timeout);
            }
          });
        }
      } catch (err) {
        if (cancelled || started) return;
        const msg =
          err instanceof Error
            ? err.message
            : err && typeof err === 'object' && 'message' in err
              ? String((err as { message: unknown }).message)
              : '';
        setError(
          `Could not start the live stream${msg ? ` — ${msg}` : ''}. Snapshots still update below.`,
        );
        setStarting(false);
        window.clearTimeout(timeout);
      }
    }

    (async () => {
      if (!canStream) {
        setError(
          'This camera entity does not offer a live stream (in UniFi Protect, enable RTSPS for this channel and reload the integration, or point this card at a streamable channel entity). Snapshots still update below.',
        );
        setStarting(false);
        window.clearTimeout(timeout);
        return;
      }
      const rtcOk = await tryWebRTC();
      if (cancelled || started) return;
      // tryWebRTC cleaned up after itself on failure; just fall back
      if (!rtcOk) await tryHLS();
    })();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      window.removeEventListener('keydown', onKey);
      if (unsub) unsub();
      if (pc) pc.close();
      if (hls) hls.destroy();
      if (video) {
        video.removeEventListener('playing', markPlaying);
        video.removeEventListener('loadeddata', markPlaying);
        video.pause();
        video.srcObject = null;
        video.removeAttribute('src');
        video.load();
      }
    };
  }, [entity.entity_id, onClose]);

  // portal: must paint above grid items regardless of where it's rendered
  return createPortal(
    <div
      class={styles.modal}
      onPointerDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (pressedBackdrop.current && e.target === e.currentTarget) onClose();
      }}
    >
      <div class={styles.modalInner} onClick={(e) => e.stopPropagation()}>
        <header class={styles.modalHeader}>
          <span>{name}</span>
          <button class={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div class={styles.videoWrap}>
          <video ref={videoRef} playsInline muted autoPlay controls={false} />
          {starting && !error && (
            <div class={styles.videoOverlay}>
              <Spinner />
            </div>
          )}
          {error && snapshotSrc && (
            <>
              <img class={styles.fallbackSnap} src={snapshotSrc} alt={name} />
              <div class={styles.fallbackNote}>{error}</div>
            </>
          )}
          {error && !snapshotSrc && <div class={styles.videoOverlay}>{error}</div>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
