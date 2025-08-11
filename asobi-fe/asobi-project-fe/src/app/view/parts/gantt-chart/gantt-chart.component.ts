import {
  AfterViewInit,
  ChangeDetectionStrategy,
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

  private readonly today: Date = new Date();

  get dateRange(): Date[] {
    const start = new Date(this.today);
    start.setHours(0, 0, 0, 0);

    let startTime = start.getTime();
    let endTime = this.addDays(start, 30).getTime();

    if (this.tasks.length > 0) {
      const taskStart = Math.min(...this.tasks.map(t => t.start.getTime()));
      const taskEnd = Math.max(...this.tasks.map(t => t.end.getTime()));
      startTime = Math.min(startTime, taskStart);
      endTime = Math.max(endTime, taskEnd);
    }

    const end = new Date(endTime);
    const dates: Date[] = [];
    for (let d = new Date(startTime); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
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
  }

  ngOnChanges(): void {
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
}
