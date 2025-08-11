import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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
export class GanttChartComponent {
  @Input({ required: true }) tasks: Task[] = [];

  get dateRange(): Date[] {
    if (this.tasks.length === 0) {
      return [];
    }
    const start = new Date(Math.min(...this.tasks.map(t => t.start.getTime())));
    const end = new Date(Math.max(...this.tasks.map(t => t.end.getTime())));
    const dates: Date[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
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
