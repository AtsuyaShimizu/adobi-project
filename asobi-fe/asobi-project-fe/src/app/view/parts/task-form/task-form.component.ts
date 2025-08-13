import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task } from '../../../domain/model/task';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss'
})
export class TaskFormComponent {
  protected task: {
    id?: string;
    type: string;
    name: string;
    detail: string;
    assignee: string;
    start: string;
    end: string;
    progress: number;
  } = {
    id: undefined,
    type: '',
    name: '',
    detail: '',
    assignee: '',
    start: '',
    end: '',
    progress: 0,
  };

  @Input()
  set initialTask(value: Task | null) {
    if (value) {
      this.task = {
        id: value.id,
        type: value.type,
        name: value.name,
        detail: value.detail,
        assignee: value.assignee,
        start: this.formatDate(value.start),
        end: this.formatDate(value.end),
        progress: value.progress,
      };
    } else {
      this.reset();
    }
  }

  @Output() save = new EventEmitter<Task>();

  submit(): void {
    this.save.emit({
      id: this.task.id ?? crypto.randomUUID(),
      type: this.task.type,
      name: this.task.name,
      detail: this.task.detail,
      assignee: this.task.assignee,
      start: new Date(this.task.start),
      end: new Date(this.task.end),
      progress: Number(this.task.progress),
    });
    this.reset();
  }

  private reset(): void {
    this.task = {
      id: undefined,
      type: '',
      name: '',
      detail: '',
      assignee: '',
      start: '',
      end: '',
      progress: 0,
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().substring(0, 10);
  }
}
