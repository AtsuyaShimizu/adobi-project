import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
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
  protected task = {
    type: '',
    name: '',
    detail: '',
    assignee: '',
    start: '',
    end: '',
    progress: 0
  };

  @Output() save = new EventEmitter<Task>();

  submit(): void {
    this.save.emit({
      id: crypto.randomUUID(),
      type: this.task.type,
      name: this.task.name,
      detail: this.task.detail,
      assignee: this.task.assignee,
      start: new Date(this.task.start),
      end: new Date(this.task.end),
      progress: Number(this.task.progress)
    });
    this.task = { type: '', name: '', detail: '', assignee: '', start: '', end: '', progress: 0 };
  }
}
