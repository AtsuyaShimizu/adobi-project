import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Task } from '../../../domain/model/task';

@Component({
  selector: 'app-task-detail-modal',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './task-detail-modal.component.html',
  styleUrl: './task-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailModalComponent {
  @Input({ required: true }) task!: Task;
  @Output() edit = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  onEdit(): void {
    this.edit.emit(this.task);
  }

  onDelete(): void {
    this.delete.emit(this.task.id);
  }
}
