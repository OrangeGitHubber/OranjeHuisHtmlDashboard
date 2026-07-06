import { Modal } from '../../components/Modal';
import { pageIcons } from '../../lib/icons';
import styles from './settings.module.css';

export function IconPickerModal({
  current,
  onPick,
  onClose,
}: {
  current: string;
  onPick: (name: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose} maxWidth={340}>
      <div class={styles.iconGrid}>
        {Object.entries(pageIcons).map(([name, path]) => (
          <button
            key={name}
            class={`${styles.iconChoice}${name === current ? ` ${styles.iconChoiceActive}` : ''}`}
            onClick={() => {
              onPick(name);
              onClose();
            }}
            aria-label={`Icon: ${name}`}
          >
            <svg viewBox="0 0 24 24">
              <path d={path} fill="currentColor" />
            </svg>
          </button>
        ))}
      </div>
    </Modal>
  );
}
