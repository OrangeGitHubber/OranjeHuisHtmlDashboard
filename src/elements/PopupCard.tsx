import { useState } from 'preact/hooks';
import { settings } from '../lib/settings';
import { iconPath } from '../lib/icons';
import { Modal } from '../components/Modal';
import GridPage from '../grid/GridPage';
import type { ElementProps } from '../grid/elements';
import elementStyles from './elements.module.css';
import styles from './popup.module.css';

/**
 * Groups a room's devices behind one tile: tapping it opens a modal showing
 * another page's full grid (the "room" page — normally flagged `hidden` via
 * PopupOptionsEditor so it doesn't also clutter the nav sidebar). The modal
 * content is read-only (GridPage readOnly) — a second fixed-position edit
 * FAB inside the modal would visually overlap the outer page's own, since
 * neither is actually scoped to the modal panel. Edit a room's contents via
 * Settings → Pages → Open, which lands on it as a normal top-level page.
 */
export interface PopupOptions {
  /** id of the page shown when this tile is tapped */
  targetPageId?: string;
  /** overrides the target page's own title on the trigger tile */
  title?: string;
  /** overrides the target page's own icon on the trigger tile */
  icon?: string;
}

export default function PopupCard({ element }: ElementProps) {
  const o = (element.options ?? {}) as PopupOptions;
  const [open, setOpen] = useState(false);
  const target = o.targetPageId
    ? settings.value.pages.find((p) => p.id === o.targetPageId)
    : undefined;
  const title = o.title?.trim() || target?.title || 'Room';
  const icon = o.icon || target?.icon || 'home';

  if (!target) {
    return (
      <div class={elementStyles.card}>
        <p class={styles.hint}>No room selected — tap this card in page edit mode to pick one.</p>
      </div>
    );
  }

  return (
    <>
      <button class={`${elementStyles.card} ${styles.trigger}`} onClick={() => setOpen(true)}>
        <svg class={styles.triggerIcon} viewBox="0 0 24 24" aria-hidden="true">
          <path d={iconPath(icon)} fill="currentColor" />
        </svg>
        <span class={styles.triggerLabel}>{title}</span>
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)} maxWidth={1100}>
          <header class={styles.popupHeader}>
            <svg class={styles.popupHeaderIcon} viewBox="0 0 24 24" aria-hidden="true">
              <path d={iconPath(icon)} fill="currentColor" />
            </svg>
            <span class={styles.popupHeaderTitle}>{title}</span>
            <button class={styles.popupClose} onClick={() => setOpen(false)} aria-label="Close">
              ✕
            </button>
          </header>
          <div class={styles.popupBody}>
            <GridPage pageId={target.id} readOnly />
          </div>
        </Modal>
      )}
    </>
  );
}
