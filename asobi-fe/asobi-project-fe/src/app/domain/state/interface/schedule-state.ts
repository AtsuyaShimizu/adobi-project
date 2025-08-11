import { Signal } from '@angular/core';
import { Task } from '../../model/task';

export interface ScheduleStateInterface {
  readonly tasks: Signal<Task[]>;
  add(task: Task): void;
  update(task: Task): void;
  remove(id: string): void;
}
