import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Task } from '../../../domain/model/task';
import { GanttChartComponent } from '../../parts/gantt-chart/gantt-chart.component';
import { TaskFormComponent } from '../../parts/task-form/task-form.component';

@Component({
  selector: 'app-schedule-layout',
  standalone: true,
  imports: [GanttChartComponent, TaskFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './schedule-layout.component.html',
  styleUrl: './schedule-layout.component.scss'
})
export class ScheduleLayoutComponent {
  @Input({ required: true }) tasks: Task[] = [];
  @Input() formVisible = false;
  @Output() create = new EventEmitter<Task>();
  @Output() openForm = new EventEmitter<void>();
  @Output() closeForm = new EventEmitter<void>();
}
