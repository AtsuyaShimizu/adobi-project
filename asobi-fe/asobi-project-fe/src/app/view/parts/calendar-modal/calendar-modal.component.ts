import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-calendar-modal',
  standalone: true,
  imports: [CommonModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar-modal.component.html',
  styleUrl: './calendar-modal.component.scss'
})
export class CalendarModalComponent {
  protected displayDate = new Date();
  protected selectedDate = new Date();
  protected weeks: Date[][] = [];

  @Output() confirm = new EventEmitter<Date>();
  @Output() close = new EventEmitter<void>();

  constructor() {
    this.generateCalendar();
  }

  protected prevMonth(): void {
    this.displayDate = new Date(
      this.displayDate.getFullYear(),
      this.displayDate.getMonth() - 1,
      1
    );
    this.generateCalendar();
  }

  protected nextMonth(): void {
    this.displayDate = new Date(
      this.displayDate.getFullYear(),
      this.displayDate.getMonth() + 1,
      1
    );
    this.generateCalendar();
  }

  protected select(day: Date): void {
    this.selectedDate = day;
  }

  protected isCurrentMonth(day: Date): boolean {
    return day.getMonth() === this.displayDate.getMonth();
  }

  protected isSelected(day: Date): boolean {
    return day.toDateString() === this.selectedDate.toDateString();
  }

  protected submit(): void {
    this.confirm.emit(new Date(this.selectedDate));
  }

  private generateCalendar(): void {
    const first = new Date(
      this.displayDate.getFullYear(),
      this.displayDate.getMonth(),
      1
    );
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    this.weeks = [];
    for (let i = 0; i < 6; i++) {
      const week: Date[] = [];
      for (let j = 0; j < 7; j++) {
        week.push(new Date(start));
        start.setDate(start.getDate() + 1);
      }
      this.weeks.push(week);
    }
  }
}

