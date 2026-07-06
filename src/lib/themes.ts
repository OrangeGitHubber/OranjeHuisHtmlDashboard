/**
 * Color themes. Each theme only swaps the accent family (see theme.css);
 * the warm neutral palette is shared so every component keeps working.
 * 'orange' is the default and matches the base :root tokens — no override
 * block exists for it.
 */

export interface ThemeDef {
  id: string;
  name: string;
  /** Dark-mode accent, used for the swatch in the theme picker. */
  swatch: string;
}

export const themes: ThemeDef[] = [
  { id: 'orange', name: 'Oranje', swatch: '#f28c28' },
  { id: 'ember', name: 'Ember', swatch: '#e0654a' },
  { id: 'forest', name: 'Forest', swatch: '#7cb567' },
  { id: 'ocean', name: 'Ocean', swatch: '#54a6c9' },
  { id: 'plum', name: 'Plum', swatch: '#b98ad9' },
];

export function applyTheme(id: string): void {
  document.documentElement.dataset.theme = id;
}

/** 'auto' follows the OS; 'light'/'dark' force via [data-mode] on <html>. */
export function applyColorMode(mode: string): void {
  if (mode === 'light' || mode === 'dark') {
    document.documentElement.dataset.mode = mode;
  } else {
    delete document.documentElement.dataset.mode;
  }
}
