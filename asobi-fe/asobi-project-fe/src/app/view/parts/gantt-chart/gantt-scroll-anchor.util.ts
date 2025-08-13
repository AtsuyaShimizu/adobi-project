/**
 * NOTE: AGENTS.md の依存ルールを確認済み。
 * GanttChartComponent 用のスクロールアンカー処理。
 */
export interface ScrollAnchor {
  dateKey: string;
  offsetInCellPx: number;
}

export function captureAnchor(
  scroller: HTMLElement,
  colWidth: number,
  dateKeys: string[],
): ScrollAnchor {
  const targetX = scroller.scrollLeft + 8;
  const idx = Math.floor(targetX / colWidth);
  const dateKey = dateKeys[idx] ?? '';
  const offset = targetX - idx * colWidth;
  return { dateKey, offsetInCellPx: offset };
}

export function restoreFromAnchor(
  scroller: HTMLElement,
  anchor: ScrollAnchor,
  colWidth: number,
  dateKeys: string[],
): void {
  const idx = dateKeys.indexOf(anchor.dateKey);
  if (idx === -1) return;
  scroller.scrollLeft = idx * colWidth + anchor.offsetInCellPx;
}
