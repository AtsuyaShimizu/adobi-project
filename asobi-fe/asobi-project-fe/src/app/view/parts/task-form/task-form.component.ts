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
  private _task: Task | null = null;
  protected form = {
    type: '',
    name: '',
    detail: '',
    assignee: '',
    start: '',
    end: '',
    progress: 0,
  };

  @Input()
  set task(value: Task | null) {
    this._task = value;
    if (value) {
      this.form = {
        type: value.type,
        name: value.name,
        detail: value.detail,
        assignee: value.assignee,
        start: value.start.toISOString().split('T')[0],
        end: value.end.toISOString().split('T')[0],
        progress: value.progress,
      };
    } else {
      this.reset();
    }
  }
  get task(): Task | null {
    return this._task;
  }

  @Output() save = new EventEmitter<Task>();

  submit(): void {
    const id = this._task?.id ?? crypto.randomUUID();
    this.save.emit({
      id,
      type: this.form.type,
      name: this.form.name,
      detail: this.form.detail,
      assignee: this.form.assignee,
      start: new Date(this.form.start),
      end: new Date(this.form.end),
      progress: Number(this.form.progress),
    });
    this.reset();
    this._task = null;
  }

  private reset(): void {
    this.form = {
      type: '',
      name: '',
      detail: '',
      assignee: '',
      start: '',
      end: '',
      progress: 0,
    };
  }
}
