import type { GridElement, GridRect } from './types';
import { GRID_COLS } from './types';

export function rectsOverlap(a: GridRect, b: GridRect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

export function collides(rect: GridRect, elements: GridElement[], excludeId?: string): boolean {
  return elements.some((e) => e.id !== excludeId && rectsOverlap(rect, e));
}

export function clampRect(rect: GridRect, minW: number, minH: number): GridRect {
  const w = Math.min(Math.max(Math.round(rect.w), minW), GRID_COLS);
  return {
    w,
    h: Math.max(Math.round(rect.h), minH),
    x: Math.min(Math.max(Math.round(rect.x), 0), GRID_COLS - w),
    y: Math.max(Math.round(rect.y), 0),
  };
}

/** First free slot for a w×h element, scanning row-major. */
export function findFreeSlot(elements: GridElement[], w: number, h: number): { x: number; y: number } {
  const cw = Math.min(w, GRID_COLS);
  const maxY = elements.reduce((m, e) => Math.max(m, e.y + e.h), 0);
  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x <= GRID_COLS - cw; x++) {
      if (!collides({ x, y, w: cw, h }, elements)) return { x, y };
    }
  }
  return { x: 0, y: maxY };
}

/** Narrow-screen stacking order: top-to-bottom, then left-to-right. */
export function stackOrder(elements: GridElement[]): GridElement[] {
  return [...elements].sort((a, b) => a.y - b.y || a.x - b.x);
}
