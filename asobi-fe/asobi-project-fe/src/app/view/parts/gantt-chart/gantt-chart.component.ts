import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Task } from '../../../domain/model/task';

@Component({
  selector: 'app-gantt-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gantt-chart.component.html',
  styleUrl: './gantt-chart.component.scss'
})
export class GanttChartComponent {
  @Input({ required: true }) tasks: Task[] = [];
}
