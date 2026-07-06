/** Grid geometry shared by the settings schema and the grid engine. */

export interface GridRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GridElement extends GridRect {
  /** unique within its page */
  id: string;
  /** key into elementDefs (src/grid/elements.ts) */
  type: string;
  options?: Record<string, unknown>;
}

export const GRID_COLS = 12;
