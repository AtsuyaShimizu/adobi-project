/**
 * NOTE: AGENTS.md の依存ルールを確認済み。
 * GanttChartComponent 内でのみ使用されるユーティリティです。
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
  if (idx === -1) return;
  const el = scroller.querySelector<HTMLElement>(`th[data-idx="${idx}"]`);
  if (el) scroller.scrollLeft = el.offsetLeft + anchor.offsetInCellPx;
  else scroller.scrollLeft = idx * colWidth + anchor.offsetInCellPx;
}
