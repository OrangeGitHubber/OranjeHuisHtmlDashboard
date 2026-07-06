import { useEffect, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import type { ComponentChildren } from 'preact';

/**
 * Shared modal primitive: fixed overlay, Esc and backdrop-click close.
 * The panel is an empty shell — callers bring their own padding/layout.
 * Rendered into document.body via a portal so it always paints above the
 * grid (grid items are positioned stacking contexts that would otherwise
 * trap a fixed modal underneath later siblings).
 */
export function Modal({
  onClose,
  maxWidth = 480,
  children,
}: {
  onClose: () => void;
  /** initial panel width (px); the user can resize beyond it */
  maxWidth?: number;
  children: ComponentChildren;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Close only when the press STARTED on the backdrop. Releasing a drag
  // (e.g. the panel's resize handle) over the backdrop also fires a click
  // there — that must not close the dialog.
  const pressedBackdrop = useRef(false);

  return createPortal(
    // stopPropagation on the overlay too: a modal may logically belong to a
    // clickable card, and its clicks must never reach that card's handlers
    <div
      class="modal-overlay"
      onPointerDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (pressedBackdrop.current && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        class="modal-panel"
        style={{ width: `min(${maxWidth}px, 100%)` }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
