import { Modal } from '../components/Modal';
import { updateElementOptions, removeElement } from '../lib/settings';
import { EntityPicker } from '../grid/EntityPicker';
import { CardOpacityRow, CardTitleRow } from './CardOpacityRow';
import type { EditorProps } from './domainOptionsEditor';
import opt from '../components/options.module.css';

/** Change which entity this card shows, or remove the card. */
export default function EntityOptionsEditor({ pageId, element, onClose }: EditorProps) {
  const rawId = element.options?.entityId;
  const current = typeof rawId === 'string' ? rawId : '';

  return (
    <Modal onClose={onClose} maxWidth={520}>
      <header class={opt.header}>
        <span>Entity card settings</span>
        <button class={opt.close} onClick={onClose} aria-label="Close">
          ✕
        </button>
      </header>
      <div class={opt.form}>
        <p class={opt.dim}>
          Currently showing <code>{current || 'nothing'}</code>
        </p>
        <div class={opt.row}>
          Change entity
          <EntityPicker
            onPick={(entityId) => updateElementOptions(pageId, element.id, { entityId })}
          />
        </div>
        <CardTitleRow pageId={pageId} element={element} />
        <CardOpacityRow pageId={pageId} element={element} />
        <div class={opt.footerRow}>
          <button
            class={opt.removeBtn}
            onClick={() => {
              removeElement(pageId, element.id);
              onClose();
            }}
          >
            Remove element
          </button>
          <button class={opt.doneBtn} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
