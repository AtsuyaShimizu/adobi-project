/**
 * NOTE: AGENTS.md の依存ルールを確認済み。
 * この変更は GanttChartComponent 内に限定しており、層を跨いでいません。
 */
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { fromEvent, Subscription, debounceTime } from 'rxjs';
import { Task } from '../../../domain/model/task';
import { Memo } from '../../../domain/model/memo';
import { MemoComponent } from '../memo/memo.component';
import {
  ScrollAnchor,
  captureAnchor,
  restoreFromAnchor,
} from './gantt-scroll-anchor.util';

interface TaskView {
  task: Task;
  start: Date;
  end: Date;
  progressEnd: Date;
}

interface FilterState {
  options: string[];
  keyword: string;
  selected: Set<string>;
}

type FilterName = 'type' | 'name' | 'assignee';

@Component({
  selector: 'app-gantt-chart',
  standalone: true,
  imports: [DatePipe, MemoComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gantt-chart.component.html',
  styleUrl: './gantt-chart.component.scss',
})
export class GanttChartComponent
  implements AfterViewInit, OnChanges, OnDestroy, OnInit
{
  @Input({ required: true }) tasks: Task[] = [];
  @Input({ required: true }) memos: Memo[] = [];
  @Output() memoChange = new EventEmitter<Memo>();
  @Output() taskClick = new EventEmitter<Task>();
  @Output() rangeChange = new EventEmitter<{ start: Date; end: Date }>();
  @ViewChild('scrollHost') private scrollHost?: ElementRef<HTMLDivElement>;
  @ViewChild('hScrollbar') private hScrollbar?: ElementRef<HTMLDivElement>;
  @ViewChild('hScrollbarThumb')
  private hScrollbarThumb?: ElementRef<HTMLDivElement>;

  protected readonly emptyRows = Array.from({ length: 100 });
  protected dateRange: Date[] = [];
  protected dateKeys: string[] = [];
  protected taskViews: TaskView[] = [];
  protected filterPopup: FilterName | null = null;
  protected filters: Record<FilterName, FilterState> = {
    type: { options: [], keyword: '', selected: new Set<string>() },
    name: { options: [], keyword: '', selected: new Set<string>() },
    assignee: { options: [], keyword: '', selected: new Set<string>() },
  };
  private rangeStart: Date;
  private rangeEnd: Date;
  private static readonly INITIAL_MONTHS = 6;
  private static readonly EXTEND_THRESHOLD_DAYS = 60;
  private static readonly EXTEND_CHUNK_DAYS = 30;
  private static readonly PRUNE_THRESHOLD_DAYS = 120;
  private static readonly PRUNE_CHUNK_DAYS = 30;
  private static readonly MAX_WINDOW_DAYS = 240;
  private static readonly CELL_WIDTH = 36;
  private barDrag?: { startX: number; startThumbPos: number };
  private dragData?: {
    memo: Memo;
    el: HTMLElement;
    offsetX: number;
    offsetY: number;
    stickyWidth: number;
    headerHeight: number;
  };
  private onMove = (e: MouseEvent) => this.handleDrag(e);
  private onUp = () => this.endDrag();
  private resizeData?: {
    memo: Memo;
    el: HTMLElement;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    stickyWidth: number;
    headerHeight: number;
  };
  private onResizeMove = (e: MouseEvent) => this.handleResize(e);
  private onResizeUp = () => this.endResize();
  private focusedCell?: { x: number; y: number };
  private focusedCellIdx?: { row: number; col: number };
  protected hoveredColIdx: number | null = null;
  protected editingMemoId: string | null = null;
  private isScrolling = false;
  private scrollSub?: Subscription;
  private scrollStopSub?: Subscription;
  private pendingPruneLeftDays = 0;
  private pendingPruneRightDays = 0;
  private idleHandle: number | null = null;
  private onScrollBound = () => {
    if (this.isScrolling) return;
    this.isScrolling = true;
    requestAnimationFrame(() => {
      this.handleScrollRaf();
      this.isScrolling = false;
    });
  };
  protected readonly monthColors = [
    '#e0f4ff', // Jan: icy blue
    '#e0eaff', // Feb: pale sky
    '#ffe6f0', // Mar: blossom pink
    '#fff0f6', // Apr: cherry pink
    '#e6ffe6', // May: fresh green
    '#fff5e6', // Jun: early summer cream
    '#ffeccc', // Jul: soft orange
    '#fffde6', // Aug: mellow yellow
    '#ffe6cc', // Sep: light ochre
    '#f9f2e6', // Oct: gentle beige
    '#f6ffe6', // Nov: pale leaf
    '#e0f2ff', // Dec: winter blue
  ];

  constructor(private cdr: ChangeDetectorRef) {
    const start = this.getToday();
    this.rangeStart = this.addMonths(
      start,
      -GanttChartComponent.INITIAL_MONTHS,
    );
    this.rangeEnd = this.addMonths(start, GanttChartComponent.INITIAL_MONTHS);
    this.buildDateRange();
  }

  ngOnInit(): void {
    this.emitRangeChange();
  }

  get months(): { label: string; days: number; month: number }[] {
    const result: { label: string; days: number; month: number }[] = [];
    this.dateRange.forEach((d) => {
      const m = d.getMonth() + 1;
      const label = `${d.getFullYear()}-${m.toString().padStart(2, '0')}`;
      const last = result[result.length - 1];
      if (last && last.label === label) last.days++;
      else result.push({ label, days: 1, month: m });
    });
    return result;
  }

  isProgress(view: TaskView, date: Date): boolean {
    if (date < view.start || date > view.end) return false;
    return date <= view.progressEnd;
  }

  isPlanned(view: TaskView, date: Date): boolean {
    if (date < view.start || date > view.end) return false;
    return date > view.progressEnd && date <= view.end;
  }

  isProgressStart(view: TaskView, date: Date): boolean {
    return (
      this.isProgress(view, date) &&
      !this.isProgress(view, this.addDays(date, -1))
    );
  }

  isProgressEnd(view: TaskView, date: Date): boolean {
    return (
      this.isProgress(view, date) &&
      !this.isProgress(view, this.addDays(date, 1))
    );
  }

  isPlannedStart(view: TaskView, date: Date): boolean {
    return (
      this.isPlanned(view, date) &&
      !this.isPlanned(view, this.addDays(date, -1))
    );
  }

  isPlannedEnd(view: TaskView, date: Date): boolean {
    return (
      this.isPlanned(view, date) && !this.isPlanned(view, this.addDays(date, 1))
    );
  }

  protected isMonthStart(date: Date): boolean {
    return date.getDate() === 1;
  }

  ngAfterViewInit(): void {
    this.scrollToToday();
    const host = this.scrollHost?.nativeElement;
    if (host) {
      // TODO: Infinite Scroll Smoothness - Scroll detection
      this.scrollSub = fromEvent(host, 'scroll', {
        passive: true,
      }).subscribe(this.onScrollBound);
      this.scrollStopSub = fromEvent(host, 'scroll', {
        passive: true,
      })
        .pipe(debounceTime(300))
        .subscribe(() => this.flushPrune());
    }
    this.updateScrollbarThumb();
    this.onScrollBound();
  }

  ngOnDestroy(): void {
    this.scrollSub?.unsubscribe();
    this.scrollStopSub?.unsubscribe();
    if (this.idleHandle !== null) {
      const w = window as any;
      if (w.cancelIdleCallback) w.cancelIdleCallback(this.idleHandle);
      else clearTimeout(this.idleHandle);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks']) {
      this.buildFilters();
      this.updateTaskViews();
      this.scrollToToday();
    }
  }

  private buildFilters(): void {
    const typeSet = new Set(this.tasks.map((t) => t.type));
    const nameSet = new Set(this.tasks.map((t) => t.name));
    const assigneeSet = new Set(this.tasks.map((t) => t.assignee));
    this.filters.type.options = Array.from(typeSet);
    this.filters.name.options = Array.from(nameSet);
    this.filters.assignee.options = Array.from(assigneeSet);
    this.filters.type.selected = new Set(this.filters.type.options);
    this.filters.name.selected = new Set(this.filters.name.options);
    this.filters.assignee.selected = new Set(this.filters.assignee.options);
    this.filters.type.keyword = '';
    this.filters.name.keyword = '';
    this.filters.assignee.keyword = '';
  }

  private updateTaskViews(): void {
    const filtered = this.tasks.filter(
      (t) =>
        this.filters.type.selected.has(t.type) &&
        this.filters.name.selected.has(t.name) &&
        this.filters.assignee.selected.has(t.assignee),
    );
    this.taskViews = filtered.map((t) => {
      const start = this.toStartOfDay(t.start);
      const end = this.toStartOfDay(t.end);
      const total = this.diffDays(start, end) + 1;
      const progressDays = Math.round(total * (t.progress / 100));
      const progressEnd = this.addDays(start, progressDays - 1);
      return { task: t, start, end, progressEnd };
    });
  }

  toggleFilterPopup(name: FilterName, event: MouseEvent): void {
    event.stopPropagation();
    this.filterPopup = this.filterPopup === name ? null : name;
  }

  closeFilterPopup(): void {
    this.filterPopup = null;
  }

  onFilterChange(name: FilterName, option: string, checked: boolean): void {
    const selected = this.filters[name].selected;
    if (checked) selected.add(option);
    else selected.delete(option);
    this.updateTaskViews();
  }

  getFilteredOptions(name: FilterName): string[] {
    const { options, keyword } = this.filters[name];
    return options.filter((o) => o.startsWith(keyword));
  }

  public scrollToDate(date: Date): void {
    const host = this.scrollHost?.nativeElement;
    if (!host) return;

    const target = this.toStartOfDay(date);
    while (target < this.rangeStart)
      this.extendLeftDays(GanttChartComponent.EXTEND_CHUNK_DAYS);
    while (target > this.rangeEnd)
      this.extendRightDays(GanttChartComponent.EXTEND_CHUNK_DAYS);

    const idx = this.dateRange.findIndex((d) => this.isSameDay(d, target));
    if (idx < 0) return;

    requestAnimationFrame(() => {
      const th = host.querySelector<HTMLElement>(
        `.head-2 th[data-idx="${idx}"]`,
      );
      const stickyWidth = this.getStickyWidth();
      if (th)
        host.scrollTo({
          left: Math.max(th.offsetLeft - stickyWidth, 0),
          behavior: 'smooth',
        });
      this.updateScrollbarThumb();
    });
  }

    public scrollToToday(): void {
      this.scrollToDate(this.getToday());
    }

  private handleScrollRaf(): void {
    const host = this.scrollHost?.nativeElement;
    if (!host) return;
    this.updateScrollbarThumb();
    const stickyWidth = this.getStickyWidth();
    const scrollLeft = host.scrollLeft;
    const firstVisibleIdx = Math.floor(
      scrollLeft / GanttChartComponent.CELL_WIDTH,
    );
    const visibleCols = Math.ceil(
      (host.clientWidth - stickyWidth) / GanttChartComponent.CELL_WIDTH,
    );
    const rightOffscreenDays =
      this.dateRange.length - (firstVisibleIdx + visibleCols);
    const leftOffscreenDays = firstVisibleIdx;

    if (rightOffscreenDays <= GanttChartComponent.EXTEND_THRESHOLD_DAYS)
      this.extendRightDays(GanttChartComponent.EXTEND_CHUNK_DAYS); // TODO: Infinite Scroll Smoothness - Range extension
    if (leftOffscreenDays <= GanttChartComponent.EXTEND_THRESHOLD_DAYS)
      this.extendLeftDays(GanttChartComponent.EXTEND_CHUNK_DAYS); // TODO: Infinite Scroll Smoothness - Range extension
    if (this.dateRange.length > GanttChartComponent.MAX_WINDOW_DAYS) {
      if (leftOffscreenDays >= GanttChartComponent.PRUNE_THRESHOLD_DAYS) {
        this.pendingPruneLeftDays = Math.max(
          this.pendingPruneLeftDays,
          leftOffscreenDays - GanttChartComponent.PRUNE_THRESHOLD_DAYS,
        );
        this.schedulePrune(); // TODO: Infinite Scroll Smoothness - Range prune
      }
      if (rightOffscreenDays >= GanttChartComponent.PRUNE_THRESHOLD_DAYS) {
        this.pendingPruneRightDays = Math.max(
          this.pendingPruneRightDays,
          rightOffscreenDays - GanttChartComponent.PRUNE_THRESHOLD_DAYS,
        );
        this.schedulePrune(); // TODO: Infinite Scroll Smoothness - Range prune
      }
    }
  }

  onCellMouseDown(event: MouseEvent, rowIdx: number, colIdx: number): void {
    const host = this.scrollHost?.nativeElement;
    const cell = event.currentTarget as HTMLElement | null;
    if (!host || !cell) return;
    const hostRect = host.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();
    this.focusedCell = {
      x: cellRect.left - hostRect.left + host.scrollLeft,
      y: cellRect.top - hostRect.top + host.scrollTop,
    };
    this.focusedCellIdx = { row: rowIdx, col: colIdx };
  }

  getFocusedCellPosition(): { x: number; y: number } | null {
    return this.focusedCell ?? null;
  }

  getTodayColumnPosition(): { x: number; y: number } {
    const host = this.scrollHost?.nativeElement;
    if (!host) return { x: 0, y: 0 };
    const headerHeight = this.getHeaderHeight();
    const today = this.getToday();
    const idx = this.dateRange.findIndex((d) => this.isSameDay(d, today));
    const th = host.querySelector<HTMLElement>(`.head-2 th[data-idx="${idx}"]`);
    const x = th ? th.offsetLeft : 0;
    return { x, y: headerHeight };
  }

  onMemoMouseDown(event: MouseEvent, memo: Memo): void {
    if (this.editingMemoId === memo.id) return;
    const el = event.currentTarget as HTMLElement | null;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const stickyWidth = this.getStickyWidth();
    const headerHeight = this.getHeaderHeight();
    this.dragData = {
      memo,
      el,
      offsetX,
      offsetY,
      stickyWidth,
      headerHeight,
    };
    document.addEventListener('mousemove', this.onMove);
    document.addEventListener('mouseup', this.onUp);
    event.preventDefault();
  }

  onColumnMouseEnter(colIdx: number): void {
    if (this.hoveredColIdx === colIdx) return;
    this.hoveredColIdx = colIdx;
  }

  onColumnMouseLeave(): void {
    if (this.hoveredColIdx === null) return;
    this.hoveredColIdx = null;
  }

  protected isFocusedCell(row: number, col: number): boolean {
    return this.focusedCellIdx?.row === row && this.focusedCellIdx?.col === col;
  }

  onMemoResizeMouseDown(event: MouseEvent, memo: Memo): void {
    event.stopPropagation();
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement | null;
    const el = handle?.parentElement as HTMLElement | null;
    if (!el) return;
    const stickyWidth = this.getStickyWidth();
    const headerHeight = this.getHeaderHeight();
    this.resizeData = {
      memo,
      el,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: el.offsetWidth,
      startHeight: el.offsetHeight,
      stickyWidth,
      headerHeight,
    };
    document.addEventListener('mousemove', this.onResizeMove);
    document.addEventListener('mouseup', this.onResizeUp);
  }

  onMemoBlur(event: FocusEvent, memo: Memo): void {
    const el = event.target as HTMLElement | null;
    if (!el) return;
    memo.text = el.innerText;
    memo.width = el.offsetWidth;
    memo.height = el.offsetHeight;
    this.memoChange.emit({ ...memo });
    this.editingMemoId = null;
  }

  onMemoMouseUp(event: MouseEvent, memo: Memo): void {
    if (this.dragData) return;
    const el = event.currentTarget as HTMLElement | null;
    if (!el) return;
    memo.width = el.offsetWidth;
    memo.height = el.offsetHeight;
    memo.text = this.getMemoBodyText(el);
    this.memoChange.emit({ ...memo });
  }

  protected toggleEdit(memo: Memo, el: HTMLElement, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.editingMemoId === memo.id) {
      el.blur();
      return;
    }
    this.editingMemoId = memo.id;
    setTimeout(() => el.focus());
  }

  private handleDrag(event: MouseEvent): void {
    if (!this.dragData) return;
    const host = this.scrollHost?.nativeElement;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const {
      offsetX,
      offsetY,
      stickyWidth,
      headerHeight,
      el,
      memo,
    } = this.dragData;
    const x = event.clientX - rect.left + host.scrollLeft - offsetX;
    const y = event.clientY - rect.top + host.scrollTop - offsetY;
    const maxX = host.scrollWidth - el.offsetWidth;
    const maxY = host.scrollHeight - el.offsetHeight;
    memo.x = Math.min(Math.max(x, stickyWidth), maxX);
    memo.y = Math.min(Math.max(y, headerHeight), maxY);
    this.cdr.detectChanges();
  }

  private handleResize(event: MouseEvent): void {
    if (!this.resizeData) return;
    const { el, memo, startX, startY, startWidth, startHeight } =
      this.resizeData;
    const width = startWidth + (event.clientX - startX);
    const height = startHeight + (event.clientY - startY);
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    memo.width = el.offsetWidth;
    memo.height = el.offsetHeight;
    this.cdr.detectChanges();
  }

  private endDrag(): void {
    if (!this.dragData) return;
    const { memo, el } = this.dragData;
    memo.width = el.offsetWidth;
    memo.height = el.offsetHeight;
    memo.text = this.getMemoBodyText(el);
    this.memoChange.emit({ ...memo });
    this.dragData = undefined;
    document.removeEventListener('mousemove', this.onMove);
    document.removeEventListener('mouseup', this.onUp);
  }

  private endResize(): void {
    if (!this.resizeData) return;
    const { memo, el } = this.resizeData;
    memo.width = el.offsetWidth;
    memo.height = el.offsetHeight;
    memo.text = this.getMemoBodyText(el);
    this.memoChange.emit({ ...memo });
    this.resizeData = undefined;
    document.removeEventListener('mousemove', this.onResizeMove);
    document.removeEventListener('mouseup', this.onResizeUp);
  }

  private getMemoBodyText(el: HTMLElement): string {
    return el.querySelector<HTMLElement>('.memo-body')?.innerText ?? '';
  }

  onRowClick(view: TaskView): void {
    this.taskClick.emit(view.task);
  }

  private getStickyWidth(): number {
    const host = this.scrollHost?.nativeElement;
    if (!host) return 0;
    const stickyCols = host.querySelectorAll<HTMLElement>(
      '.head-1 .sticky-left',
    );
    return Array.from(stickyCols).reduce((sum, el) => sum + el.offsetWidth, 0);
  }

  private getHeaderHeight(): number {
    const host = this.scrollHost?.nativeElement;
    const header = host?.querySelector('thead');
    return header?.offsetHeight ?? 0;
  }

  private diffDays(a: Date, b: Date): number {
    return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  }
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  private getDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
  private getToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
  private addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }
  private toStartOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }
  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private buildDateRange(): void {
    const dates: Date[] = [];
    for (
      let d = new Date(this.rangeStart);
      d <= this.rangeEnd;
      d.setDate(d.getDate() + 1)
    ) {
      dates.push(new Date(d));
    }
    this.dateRange = dates;
    this.dateKeys = dates.map((d) => this.getDateKey(d));
  }

  private extendRightDays(days: number): void {
    // TODO: Infinite Scroll Smoothness - Range extension
    this.rangeEnd = this.addDays(this.rangeEnd, days);
    this.buildDateRange();
    this.emitRangeChange();
    this.cdr.markForCheck();
    this.updateScrollbarThumb();
  }

  private extendLeftDays(days: number): void {
    // TODO: Infinite Scroll Smoothness - Range extension
    const host = this.scrollHost?.nativeElement;
    this.rangeStart = this.addDays(this.rangeStart, -days);
    this.buildDateRange();
    this.emitRangeChange();
    this.cdr.markForCheck();
    if (host) {
      const addedDays = days;
      // TODO: Infinite Scroll Smoothness - Scroll position correction
      host.scrollLeft += addedDays * GanttChartComponent.CELL_WIDTH;
    }
    this.updateScrollbarThumb();
  }

  private pruneLeftDays(days: number): void {
    const host = this.scrollHost?.nativeElement;
    if (!host) return;
    const anchor: ScrollAnchor = captureAnchor(
      host,
      GanttChartComponent.CELL_WIDTH,
      this.dateKeys,
    );
    this.rangeStart = this.addDays(this.rangeStart, days);
    this.buildDateRange();
    this.emitRangeChange();
    this.cdr.markForCheck();
    setTimeout(() => {
      // TODO: Infinite Scroll Smoothness - Scroll position correction
      restoreFromAnchor(
        host,
        anchor,
        GanttChartComponent.CELL_WIDTH,
        this.dateKeys,
      );
    });
    this.updateScrollbarThumb();
  }

  private pruneRightDays(days: number): void {
    const host = this.scrollHost?.nativeElement;
    if (!host) return;
    const anchor: ScrollAnchor = captureAnchor(
      host,
      GanttChartComponent.CELL_WIDTH,
      this.dateKeys,
    );
    this.rangeEnd = this.addDays(this.rangeEnd, -days);
    this.buildDateRange();
    this.emitRangeChange();
    this.cdr.markForCheck();
    setTimeout(() => {
      // TODO: Infinite Scroll Smoothness - Scroll position correction
      restoreFromAnchor(
        host,
        anchor,
        GanttChartComponent.CELL_WIDTH,
        this.dateKeys,
      );
    });
    this.updateScrollbarThumb();
  }

  private schedulePrune(): void {
    if (this.idleHandle !== null) return;
    const callback = () => {
      this.idleHandle = null;
      this.flushPrune();
    };
    const w = window as any;
    if (w.requestIdleCallback) this.idleHandle = w.requestIdleCallback(callback);
    else this.idleHandle = window.setTimeout(callback, 0);
  }

  private flushPrune(): void {
    const chunk = GanttChartComponent.PRUNE_CHUNK_DAYS;
    while (this.pendingPruneLeftDays >= chunk) {
      this.pruneLeftDays(chunk);
      this.pendingPruneLeftDays -= chunk;
    }
    while (this.pendingPruneRightDays >= chunk) {
      this.pruneRightDays(chunk);
      this.pendingPruneRightDays -= chunk;
    }
    if (
      this.pendingPruneLeftDays >= chunk ||
      this.pendingPruneRightDays >= chunk
    ) {
      this.schedulePrune();
    }
  }

  onScrollbarMouseDown(event: MouseEvent): void {
    const host = this.scrollHost?.nativeElement;
    const bar = this.hScrollbar?.nativeElement;
    const thumb = this.hScrollbarThumb?.nativeElement;
    if (!host || !bar || !thumb) return;
    const barRect = bar.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const clickX = event.clientX - barRect.left;
    if (event.target !== thumb) {
      const pos = clickX - thumbRect.width / 2;
      host.scrollLeft = this.positionToScroll(pos);
      this.updateScrollbarThumb();
    }
    const thumbPos = thumbRect.left - barRect.left;
    this.barDrag = { startX: event.clientX, startThumbPos: thumbPos };
    document.addEventListener('mousemove', this.onScrollbarMouseMove);
    document.addEventListener('mouseup', this.onScrollbarMouseUp);
    event.preventDefault();
    event.stopPropagation();
  }

  private onScrollbarMouseMove = (e: MouseEvent): void => {
    if (!this.barDrag) return;
    const host = this.scrollHost?.nativeElement;
    const bar = this.hScrollbar?.nativeElement;
    const thumb = this.hScrollbarThumb?.nativeElement;
    if (!host || !bar || !thumb) return;
    const barRect = bar.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const track = barRect.width - thumbRect.width;
    const deltaX = e.clientX - this.barDrag.startX;
    const pos = Math.min(
      Math.max(this.barDrag.startThumbPos + deltaX, 0),
      track,
    );
    host.scrollLeft = this.positionToScroll(pos);
    this.updateScrollbarThumb();
  };

  private onScrollbarMouseUp = (): void => {
    document.removeEventListener('mousemove', this.onScrollbarMouseMove);
    document.removeEventListener('mouseup', this.onScrollbarMouseUp);
    this.barDrag = undefined;
  };

  private positionToScroll(pos: number): number {
    const host = this.scrollHost?.nativeElement;
    const bar = this.hScrollbar?.nativeElement;
    const thumb = this.hScrollbarThumb?.nativeElement;
    if (!host || !bar || !thumb) return 0;
    const track = bar.clientWidth - thumb.clientWidth;
    const maxScroll = host.scrollWidth - host.clientWidth;
    const ratio = track === 0 ? 0 : pos / track;
    return maxScroll * ratio;
  }

  private updateScrollbarThumb(): void {
    const host = this.scrollHost?.nativeElement;
    const bar = this.hScrollbar?.nativeElement;
    const thumb = this.hScrollbarThumb?.nativeElement;
    if (!host || !bar || !thumb) return;
    const stickyWidth = this.getStickyWidth();
    const visible = host.clientWidth - stickyWidth;
    const total = host.scrollWidth - stickyWidth;
    const barWidth = bar.clientWidth;
    const thumbWidth = total === 0 ? barWidth : (visible / total) * barWidth;
    thumb.style.width = `${thumbWidth}px`;
    const maxScroll = host.scrollWidth - host.clientWidth;
    const track = barWidth - thumbWidth;
    const pos = maxScroll === 0 ? 0 : (host.scrollLeft / maxScroll) * track;
    thumb.style.transform = `translateX(${pos}px)`;
  }

  private emitRangeChange(): void {
    this.rangeChange.emit({
      start: new Date(this.rangeStart),
      end: new Date(this.rangeEnd),
    });
  }
}
