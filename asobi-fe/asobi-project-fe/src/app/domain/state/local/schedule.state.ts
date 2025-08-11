import { Injectable, signal } from '@angular/core';
import { ScheduleStateInterface } from '../interface/schedule-state';
import { Task } from '../../model/task';

@Injectable({ providedIn: 'root' })
export class ScheduleState implements ScheduleStateInterface {
  #tasks = signal<Task[]>([]);
  readonly tasks = this.#tasks.asReadonly();

  add(task: Task): void {
    this.#tasks.update(tasks => [...tasks, task]);
  }

  update(task: Task): void {
    this.#tasks.update(tasks => tasks.map(t => t.id === task.id ? task : t));
  }

  remove(id: string): void {
    this.#tasks.update(tasks => tasks.filter(t => t.id !== id));
  }
}
