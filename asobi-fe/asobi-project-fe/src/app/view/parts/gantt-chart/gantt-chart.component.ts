import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Task } from '../../../domain/model/task';

@Component({
  selector: 'app-gantt-chart',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gantt-chart.component.html',
  styleUrl: './gantt-chart.component.scss',
})
export class GanttChartComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) tasks: Task[] = [];
  @ViewChild('scrollHost') private scrollHost?: ElementRef<HTMLDivElement>;

  protected readonly emptyRows = Array.from({ length: 100 });
  protected dateRange: Date[] = [];
  private rangeStart: Date;
  private rangeEnd: Date;

  constructor(private cdr: ChangeDetectorRef) {
    const start = this.getToday();
    this.rangeStart = this.addDays(start, -365);
    this.rangeEnd = this.addDays(start, 365);
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

  ngOnChanges(): void {
    this.ensureTaskRange();
    this.scrollToToday();
  }

  public scrollToDate(date: Date): void {
    const host = this.scrollHost?.nativeElement;
    if (!host) return;

    const target = this.toStartOfDay(date);
    while (target < this.rangeStart) this.extendLeft(365);
    while (target > this.rangeEnd) this.extendRight(365);

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
        this.extendRight(365);
      } else if (host.scrollLeft <= 100) {
        const prevWidth = host.scrollWidth;
        this.extendLeft(365);
        host.scrollLeft += host.scrollWidth - prevWidth;
      }
    });
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
