/**
 * Utility functions to capture and restore scroll positions when pruning
 * date ranges in the GanttChartComponent. These are used by the component
 * to maintain the user's scroll position when the underlying date array
 * changes (e.g., when removing leading or trailing days).
 */
export interface ScrollAnchor {
  dateKey: string;
  offsetInCellPx: number;
}

/**
 * Capture an anchor point in the scroll host. It uses the current scrollLeft
 * offset to compute the nearest column index and stores the date key along
 * with the offset within that cell. This allows restoring the scroll
 * position after modifying the date range.
 *
 * @param scroller The scrolling element (scroll host)
 * @param colWidth Width of each date column in pixels
 * @param dateKeys Array of date keys representing the current date range
 */
export function captureAnchor(
  scroller: HTMLElement,
  colWidth: number,
  dateKeys: string[],
): ScrollAnchor {
  // Slight offset to avoid rounding errors at column boundaries
  const targetX = scroller.scrollLeft + 8;
  const idx = Math.floor(targetX / colWidth);
  const dateKey = dateKeys[idx];
  const offset = targetX - idx * colWidth;
  return { dateKey, offsetInCellPx: offset };
}

/**
 * Restore the scroll position using a previously captured anchor. It finds the
 * matching date column index and computes the scrollLeft required to place
 * the same cell and offset back in view. If the element cannot be found
 * directly, it falls back to computing the offset from the index and column
 * width.
 *
 * @param scroller The scrolling element (scroll host)
 * @param colWidth Width of each date column in pixels
  * @param dateKeys Updated array of date keys representing the current date range
 * @param anchor The ScrollAnchor captured before modifying the date range
 */
export function restoreFromAnchor(
  scroller: HTMLElement,
  colWidth: number,
  dateKeys: string[],
  anchor: ScrollAnchor,
): void {
  const idx = dateKeys.indexOf(anchor.dateKey);
  if (idx === -1) return;
  // Try to find the header cell element for the date
  const el = scroller.querySelector<HTMLElement>(`th[data-idx="${idx}"]`);
  if (el) scroller.scrollLeft = el.offsetLeft + anchor.offsetInCellPx;
  else scroller.scrollLeft = idx * colWidth + anchor.offsetInCellPx;
}