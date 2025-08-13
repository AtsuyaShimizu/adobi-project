export interface ScrollAnchor { dateKey: string; offsetInCellPx: number; }

export function captureAnchor(
  scroller: HTMLElement,
  colWidth: number,
  dateKeys: string[],
): ScrollAnchor {
  const targetX = scroller.scrollLeft + 8;
  const idx = Math.floor(targetX / colWidth);
  const dateKey = dateKeys[idx];
  const offset = targetX - idx * colWidth;
  return { dateKey, offsetInCellPx: offset };
}

export function restoreFromAnchor(
  scroller: HTMLElement,
  colWidth: number,
  dateKeys: string[],
  anchor: ScrollAnchor,
): void {
  const idx = dateKeys.indexOf(anchor.dateKey);
  if (idx < 0) return;
  // TODO: Infinite Scroll Smoothness - Scroll position correction
  scroller.scrollLeft = idx * colWidth + anchor.offsetInCellPx;
}
