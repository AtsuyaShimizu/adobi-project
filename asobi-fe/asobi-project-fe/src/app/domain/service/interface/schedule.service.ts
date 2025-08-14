import { Task } from '../../model/task';
import { Signal } from '@angular/core';

export interface ScheduleServiceInterface {
  readonly tasks: Signal<Task[]>;
  load(): Promise<void>;
  add(task: Task): Promise<void>;
  update(task: Task): Promise<void>;
  remove(id: string): Promise<void>;
  addProgress(id: string, value: number): Promise<void>;
}
