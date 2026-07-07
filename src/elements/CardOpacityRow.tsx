import { settings, updateElementOptions } from '../lib/settings';
import type { GridElement } from '../grid/types';
import opt from '../components/options.module.css';

/**
 * Shared per-element card-opacity control for options editors. Undefined
 * option = follow Settings → Theme → Card opacity.
 */
export function CardOpacityRow({ pageId, element }: { pageId: string; element: GridElement }) {
  const raw = element.options?.opacity;
  const own = typeof raw === 'number' && Number.isFinite(raw) ? raw : null;

  return (
    <div class={opt.row}>
      Card opacity {own !== null ? `· ${own}%` : '· system setting'}
      <div class={opt.seg}>
        <button
          class={`${opt.segBtn}${own === null ? ` ${opt.segActive}` : ''}`}
          onClick={() => updateElementOptions(pageId, element.id, { opacity: undefined })}
        >
          System
        </button>
        <input
          type="range"
          min={30}
          max={100}
          value={own ?? settings.peek().cardOpacity}
          onInput={(e) =>
            updateElementOptions(pageId, element.id, {
              opacity: Number((e.target as HTMLInputElement).value),
            })
          }
          style={{ flex: '1', minWidth: '120px' }}
        />
      </div>
    </div>
  );
}
