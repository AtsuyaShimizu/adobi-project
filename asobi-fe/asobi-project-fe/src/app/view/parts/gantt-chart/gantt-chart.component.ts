import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Task } from '../../../domain/model/task';

@Component({
  selector: 'app-gantt-chart',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gantt-chart.component.html',
  styleUrl: './gantt-chart.component.scss'
})
export class GanttChartComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) tasks: Task[] = [];
  @ViewChild('chartArea') private chartArea?: ElementRef<HTMLDivElement>;
  @ViewChild('taskArea') private taskArea?: ElementRef<HTMLDivElement>;

  protected readonly emptyRows = Array.from({ length: 100 });

  private readonly today: Date = new Date();

  protected dateRange: Date[] = [];
  private rangeStart: Date;
  private rangeEnd: Date;

  constructor(private cdr: ChangeDetectorRef) {
    const start = new Date(this.today);
    start.setHours(0, 0, 0, 0);
    this.rangeStart = this.addDays(start, -365);
    this.rangeEnd = this.addDays(start, 365);
    this.buildDateRange();
  }

  get months(): { label: string; days: number }[] {
    const result: { label: string; days: number }[] = [];
    this.dateRange.forEach(d => {
      const label = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      const last = result[result.length - 1];
      if (last && last.label === label) {
        last.days++;
      } else {
        result.push({ label, days: 1 });
      }
    });
    return result;
  }

  isProgress(task: Task, date: Date): boolean {
    const start = new Date(task.start);
    const end = new Date(task.end);
    if (date < start || date > end) {
      return false;
    }
    const total = this.diffDays(start, end) + 1;
    const progressDays = Math.round(total * (task.progress / 100));
    const progressEnd = this.addDays(start, progressDays - 1);
    return date <= progressEnd;
  }

  ngAfterViewInit(): void {
    this.scrollToToday();
    this.setupScrollSync();
  }

  ngOnChanges(): void {
    this.ensureTaskRange();
    this.scrollToToday();
  }

  private scrollToToday(): void {
    if (!this.chartArea) {
      return;
    }
    const index = this.dateRange.findIndex(d => this.isSameDay(d, this.today));
    if (index < 0) {
      return;
    }
    const dayWidth = 38; // cell width + border
    this.chartArea.nativeElement.scrollLeft = index * dayWidth;
  }

  private setupScrollSync(): void {
    if (!this.chartArea || !this.taskArea) {
      return;
    }
    const chartEl = this.chartArea.nativeElement;
    const taskEl = this.taskArea.nativeElement;
    chartEl.addEventListener('scroll', () => {
      taskEl.scrollTop = chartEl.scrollTop;

      if (chartEl.scrollLeft + chartEl.clientWidth >= chartEl.scrollWidth - 100) {
        this.extendRight(365);
      } else if (chartEl.scrollLeft <= 100) {
        const prevWidth = chartEl.scrollWidth;
        this.extendLeft(365);
        chartEl.scrollLeft += chartEl.scrollWidth - prevWidth;
      }
    });
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  isPlanned(task: Task, date: Date): boolean {
    const start = new Date(task.start);
    const end = new Date(task.end);
    if (date < start || date > end) {
      return false;
    }
    const total = this.diffDays(start, end) + 1;
    const progressDays = Math.round(total * (task.progress / 100));
    const progressEnd = this.addDays(start, progressDays - 1);
    return date > progressEnd && date <= end;
  }

  private diffDays(a: Date, b: Date): number {
    return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
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
    if (this.tasks.length === 0) {
      return;
    }
    const taskStart = new Date(Math.min(...this.tasks.map(t => t.start.getTime())));
    const taskEnd = new Date(Math.max(...this.tasks.map(t => t.end.getTime())));
    if (taskStart < this.rangeStart) {
      this.extendLeft(this.diffDays(taskStart, this.rangeStart));
    }
    if (taskEnd > this.rangeEnd) {
      this.extendRight(this.diffDays(this.rangeEnd, taskEnd));
    }
  }
}
