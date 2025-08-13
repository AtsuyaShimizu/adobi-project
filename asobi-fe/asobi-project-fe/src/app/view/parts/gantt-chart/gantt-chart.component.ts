import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Task } from '../../../domain/model/task';
import { Memo } from '../../../domain/model/memo';
import { MemoComponent } from '../memo/memo.component';

@Component({
  selector: 'app-gantt-chart',
  standalone: true,
  imports: [DatePipe, MemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gantt-chart.component.html',
  styleUrl: './gantt-chart.component.scss',
})
export class GanttChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) tasks: Task[] = [];
  @Input({ required: true }) memos: Memo[] = [];
  @Output() memoChange = new EventEmitter<Memo>();
  @ViewChild('scrollHost') private scrollHost?: ElementRef<HTMLDivElement>;

  protected readonly emptyRows = Array.from({ length: 100 });
  protected dateRange: Date[] = [];
  private rangeStart: Date;
  private rangeEnd: Date;
  private static readonly INITIAL_RANGE_DAYS = 90;
  private static readonly EXTEND_DAYS = 30;
  private dragData?: { memo: Memo; el: HTMLElement; offsetX: number; offsetY: number };
  private onMove = (e: MouseEvent) => this.handleDrag(e);
  private onUp = () => this.endDrag();
  private resizeData?: {
    memo: Memo;
    el: HTMLElement;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  };
  private onResizeMove = (e: MouseEvent) => this.handleResize(e);
  private onResizeUp = () => this.endResize();
  private focusedCell?: { x: number; y: number };
  protected editingMemoId: string | null = null;

  constructor(private cdr: ChangeDetectorRef) {
    const start = this.getToday();
    this.rangeStart = this.addDays(
      start,
      -GanttChartComponent.INITIAL_RANGE_DAYS,
    );
    this.rangeEnd = this.addDays(
      start,
      GanttChartComponent.INITIAL_RANGE_DAYS,
    );
    this.buildDateRange();
  }

  get months(): { label: string; days: number }[] {
    const result: { label: string; days: number }[] = [];
    this.dateRange.forEach((d) => {
      const label = `${d.getFullYear()}-${(d.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
      const last = result[result.length - 1];
      if (last && last.label === label) last.days++;
      else result.push({ label, days: 1 });
    });
    return result;
  }

  isProgress(task: Task, date: Date): boolean {
    const start = this.toStartOfDay(task.start);
    const end = this.toStartOfDay(task.end);
    if (date < start || date > end) return false;
    const total = this.diffDays(start, end) + 1;
    const progressDays = Math.round(total * (task.progress / 100));
    const progressEnd = this.addDays(start, progressDays - 1);
    return date <= progressEnd;
  }

  isPlanned(task: Task, date: Date): boolean {
    const start = this.toStartOfDay(task.start);
    const end = this.toStartOfDay(task.end);
    if (date < start || date > end) return false;
    const total = this.diffDays(start, end) + 1;
    const progressDays = Math.round(total * (task.progress / 100));
    const progressEnd = this.addDays(start, progressDays - 1);
    return date > progressEnd && date <= end;
  }

  isProgressStart(task: Task, date: Date): boolean {
    return (
      this.isProgress(task, date) &&
      !this.isProgress(task, this.addDays(date, -1))
    );
  }

  isProgressEnd(task: Task, date: Date): boolean {
    return (
      this.isProgress(task, date) &&
      !this.isProgress(task, this.addDays(date, 1))
    );
  }

  isPlannedStart(task: Task, date: Date): boolean {
    return (
      this.isPlanned(task, date) &&
      !this.isPlanned(task, this.addDays(date, -1))
    );
  }

  isPlannedEnd(task: Task, date: Date): boolean {
    return (
      this.isPlanned(task, date) &&
      !this.isPlanned(task, this.addDays(date, 1))
    );
  }

  protected isMonthStart(date: Date): boolean {
    return date.getDate() === 1;
  }

  ngAfterViewInit(): void {
    this.scrollToToday();
    this.setupScrollHandling();
  }

  ngOnDestroy(): void {
    const host = this.scrollHost?.nativeElement;
    if (host) host.removeEventListener('scroll', this.onHostScroll);
    // 念のためドラッグ中に破棄された場合にもリスナ解除
    document.removeEventListener('mousemove', this.onMove);
    document.removeEventListener('mouseup', this.onUp);
    document.removeEventListener('mousemove', this.onResizeMove);
    document.removeEventListener('mouseup', this.onResizeUp);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks']) {
      this.ensureTaskRange();
      this.scrollToToday();
    }
  }

  public scrollToDate(date: Date): void {
    const host = this.scrollHost?.nativeElement;
    if (!host) return;

    const target = this.toStartOfDay(date);
    while (target < this.rangeStart)
      this.extendLeft(GanttChartComponent.EXTEND_DAYS);
    while (target > this.rangeEnd)
      this.extendRight(GanttChartComponent.EXTEND_DAYS);

    const idx = this.dateRange.findIndex((d) => this.isSameDay(d, target));
    if (idx < 0) return;

    requestAnimationFrame(() => {
      const th = host.querySelector<HTMLElement>(`.head-2 th[data-idx="${idx}"]`);
      const stickyCols = host.querySelectorAll<HTMLElement>(
        '.head-1 .sticky-left'
      );
      const stickyWidth = Array.from(stickyCols).reduce(
        (sum, el) => sum + el.offsetWidth,
        0
      );
      if (th) host.scrollLeft = Math.max(th.offsetLeft - stickyWidth, 0);
    });
  }

  public scrollToToday(): void {
    this.scrollToDate(this.getToday());
  }

  private setupScrollHandling(): void {
    const host = this.scrollHost?.nativeElement;
    if (!host) return;

    host.addEventListener('scroll', () => {
      if (host.scrollLeft + host.clientWidth >= host.scrollWidth - 100) {
        this.extendRight(GanttChartComponent.EXTEND_DAYS);
      } else if (host.scrollLeft <= 100) {
        const prevWidth = host.scrollWidth;
        this.extendLeft(GanttChartComponent.EXTEND_DAYS);
        host.scrollLeft += host.scrollWidth - prevWidth;
      }
    });
  }

  onCellMouseDown(event: MouseEvent): void {
    const host = this.scrollHost?.nativeElement;
    const cell = event.currentTarget as HTMLElement | null;
    if (!host || !cell) return;
    const hostRect = host.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();
    this.focusedCell = {
      x: cellRect.left - hostRect.left + host.scrollLeft,
      y: cellRect.top - hostRect.top + host.scrollTop,
    };
  }

  getFocusedCellPosition(): { x: number; y: number } | null {
    return this.focusedCell ?? null;
  }

  getTodayColumnPosition(): { x: number; y: number } {
    const host = this.scrollHost?.nativeElement;
    if (!host) return { x: 0, y: 0 };
    const headerHeight = this.getHeaderHeight(host);
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
    this.dragData = { memo, el, offsetX, offsetY };
    document.addEventListener('mousemove', this.onMove);
    document.addEventListener('mouseup', this.onUp);
    event.preventDefault();
  }

  onMemoResizeMouseDown(event: MouseEvent, memo: Memo): void {
    event.stopPropagation();
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement | null;
    const el = handle?.parentElement as HTMLElement | null;
    if (!el) return;
    this.resizeData = {
      memo,
      el,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: el.offsetWidth,
      startHeight: el.offsetHeight,
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

  protected toggleEdit(
    memo: Memo,
    el: HTMLElement,
    event: MouseEvent,
  ): void {
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
    const stickyWidth = this.getStickyWidth(host);
    const headerHeight = this.getHeaderHeight(host);
    const x =
      event.clientX - rect.left + host.scrollLeft - this.dragData.offsetX;
    const y =
      event.clientY - rect.top + host.scrollTop - this.dragData.offsetY;
    const maxX = host.scrollWidth - this.dragData.el.offsetWidth;
    const maxY = host.scrollHeight - this.dragData.el.offsetHeight;
    this.dragData.memo.x = Math.min(Math.max(x, stickyWidth), maxX);
    this.dragData.memo.y = Math.min(Math.max(y, headerHeight), maxY);
    this.cdr.detectChanges();
  }

  private handleResize(event: MouseEvent): void {
    if (!this.resizeData) return;
    const { el, memo, startX, startY, startWidth, startHeight } = this.resizeData;
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

  private getStickyWidth(host: HTMLElement): number {
    const stickyCols = host.querySelectorAll<HTMLElement>('.head-1 .sticky-left');
    return Array.from(stickyCols).reduce((sum, el) => sum + el.offsetWidth, 0);
  }

  private getHeaderHeight(host: HTMLElement): number {
    const head1 = host.querySelector<HTMLElement>('.head-1');
    const head2 = host.querySelector<HTMLElement>('.head-2');
    return (head1?.offsetHeight ?? 0) + (head2?.offsetHeight ?? 0);
  }

  private diffDays(a: Date, b: Date): number {
    return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  }
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  private getToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
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
    for (let d = new Date(this.rangeStart); d <= this.rangeEnd; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    this.dateRange = dates;
  }

  private extendRight(days: number): void {
    for (let i = 1; i <= days; i++) {
      this.dateRange.push(this.addDays(this.rangeEnd, i));
    }
    this.rangeEnd = this.addDays(this.rangeEnd, days);
    this.cdr.markForCheck();
  }

  private extendLeft(days: number): void {
    const newDates: Date[] = [];
    for (let i = days; i >= 1; i--) {
      newDates.push(this.addDays(this.rangeStart, -i));
    }
    this.dateRange = [...newDates, ...this.dateRange];
    this.rangeStart = this.addDays(this.rangeStart, -days);
    this.cdr.markForCheck();
  }

  private ensureTaskRange(): void {
    if (this.tasks.length === 0) return;
    const taskStart = new Date(Math.min(...this.tasks.map((t) => t.start.getTime())));
    const taskEnd = new Date(Math.max(...this.tasks.map((t) => t.end.getTime())));
    if (taskStart < this.rangeStart) this.extendLeft(this.diffDays(taskStart, this.rangeStart));
    if (taskEnd > this.rangeEnd) this.extendRight(this.diffDays(this.rangeEnd, taskEnd));
  }
}
