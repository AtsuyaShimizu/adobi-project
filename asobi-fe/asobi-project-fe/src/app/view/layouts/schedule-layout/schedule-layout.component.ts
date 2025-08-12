import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { Task } from '../../../domain/model/task';
import { Memo } from '../../../domain/model/memo';
import { GanttChartComponent } from '../../parts/gantt-chart/gantt-chart.component';
import { TaskFormComponent } from '../../parts/task-form/task-form.component';
import { HeaderComponent } from '../../parts/header/header.component';
import { FooterComponent } from '../../parts/footer/footer.component';
import { CalendarModalComponent } from '../../parts/calendar-modal/calendar-modal.component';
import { MemoModalComponent } from '../../parts/memo-modal/memo-modal.component';

@Component({
  selector: 'app-schedule-layout',
  standalone: true,
  imports: [
    HeaderComponent,
    GanttChartComponent,
    TaskFormComponent,
    FooterComponent,
    CalendarModalComponent,
    MemoModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './schedule-layout.component.html',
  styleUrl: './schedule-layout.component.scss'
})
export class ScheduleLayoutComponent {
  @ViewChild('ganttChart') private ganttChart?: GanttChartComponent;

  @Input({ required: true }) tasks: Task[] = [];
  @Input({ required: true }) memos: Memo[] = [];
  @Input() formVisible = false;
  @Input() memoVisible = false;
  @Input() dateTime = '';
  @Input() calendarVisible = false;
  @Output() create = new EventEmitter<Task>();
  @Output() openForm = new EventEmitter<void>();
  @Output() closeForm = new EventEmitter<void>();
  @Output() openMemo = new EventEmitter<void>();
  @Output() closeMemo = new EventEmitter<void>();
  @Output() memoCreate = new EventEmitter<string>();
  @Output() memoChange = new EventEmitter<Memo>();
  @Output() openCalendar = new EventEmitter<void>();
  @Output() closeCalendar = new EventEmitter<void>();

  onCalendarConfirm(date: Date): void {
    this.ganttChart?.scrollToDate(date);
    this.closeCalendar.emit();
  }
}
