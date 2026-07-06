import { useEffect, useRef, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import type { HassEntity } from 'home-assistant-js-websocket';
import type HlsType from 'hls.js';
import { getConnection } from '../../lib/ha/connection';
import { loadConfig } from '../../lib/config';
import { Spinner } from '../../components/Spinner';
import { useSnapshot } from './useSnapshot';
import styles from './cameras.module.css';

export function StreamModal({ entity, onClose }: { entity: HassEntity; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pressedBackdrop = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const name = (entity.attributes.friendly_name as string | undefined) ?? entity.entity_id;
  // fallback for cameras that can't stream: keep showing fresh snapshots
  const { src: snapshotSrc } = useSnapshot(
    entity.entity_id,
    0,
    entity.attributes.entity_picture as string | undefined,
  );

  useEffect(() => {
    let cancelled = false;
    let hls: HlsType | null = null;

    // CameraEntityFeature.STREAM = 2; without it a camera/stream request
    // can only fail ("does not support play stream service")
    const features =
      typeof entity.attributes.supported_features === 'number'
        ? entity.attributes.supported_features
        : 0;
    const canStream = (features & 2) !== 0;
    if (!canStream) {
      setError(
        'This camera entity does not offer a live stream (in UniFi Protect, enable RTSPS for this channel, then reload the integration — or pick a streamable channel entity for this card).',
      );
      setStarting(false);
    }

    canStream && (async () => {
      try {
        const conn = await getConnection();
        const { url } = await conn.sendMessagePromise<{ url: string }>({
          type: 'camera/stream',
          entity_id: entity.entity_id,
        });
        const cfg = loadConfig();
        if (!cfg) throw new Error('not configured');
        const streamUrl = cfg.hassUrl + url;
        const video = videoRef.current;
        if (!video || cancelled) return;

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // iOS / Safari: native HLS
          video.src = streamUrl;
          await video.play().catch(() => {});
          if (!cancelled) setStarting(false);
        } else {
          // everyone else: hls.js, loaded on demand (its own chunk)
          const { default: Hls } = await import('hls.js');
          if (cancelled) return;
          if (!Hls.isSupported()) throw new Error('HLS unsupported');
          hls = new Hls({ liveSyncDurationCount: 3, enableWorker: true });
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setStarting(false);
            video.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (_ev, data) => {
            if (data.fatal && !cancelled) {
              setError(
                `The live stream failed (${data.type}: ${data.details}). If this is a network error, the HLS segments may not be reachable through your proxy.`,
              );
            }
          });
        }
      } catch (err) {
        if (!cancelled) {
          // surface HA's actual error (e.g. "stream component not loaded")
          const msg =
            err instanceof Error
              ? err.message
              : err && typeof err === 'object' && 'message' in err
                ? String((err as { message: unknown }).message)
                : '';
          setError(
            `Could not start the live stream${msg ? ` — ${msg}` : ''}. Check that the stream integration is enabled in Home Assistant.`,
          );
          setStarting(false);
        }
      }
    })();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      cancelled = true;
      window.removeEventListener('keydown', onKey);
      if (hls) hls.destroy();
      const video = videoRef.current;
      if (video) {
        video.pause();
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
              <div class={styles.fallbackNote}>Snapshots only — {error}</div>
            </>
          )}
          {error && !snapshotSrc && <div class={styles.videoOverlay}>{error}</div>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
