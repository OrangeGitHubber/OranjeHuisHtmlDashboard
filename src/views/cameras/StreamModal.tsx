import { useEffect, useRef, useState } from 'preact/hooks';
import type { HassEntity } from 'home-assistant-js-websocket';
import type HlsType from 'hls.js';
import { getConnection } from '../../lib/ha/connection';
import { loadConfig } from '../../lib/config';
import { Spinner } from '../../components/Spinner';
import styles from './cameras.module.css';

export function StreamModal({ entity, onClose }: { entity: HassEntity; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const name = (entity.attributes.friendly_name as string | undefined) ?? entity.entity_id;

  useEffect(() => {
    let cancelled = false;
    let hls: HlsType | null = null;

    (async () => {
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
              setError('The live stream failed. Check that the stream integration is enabled in Home Assistant.');
            }
          });
        }
      } catch {
        if (!cancelled) {
          setError('Could not start the live stream. Check that the stream integration is enabled in Home Assistant.');
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

  return (
    <div class={styles.modal} onClick={onClose}>
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
          {error && <div class={styles.videoOverlay}>{error}</div>}
        </div>
      </div>
    </div>
  );
}
