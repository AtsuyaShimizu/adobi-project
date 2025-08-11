import { Injectable } from '@angular/core';
import { Task } from '../../domain/model/task';

@Injectable({ providedIn: 'root' })
export class ScheduleApi {
  #tasks: Task[] = [];

  async list(): Promise<Task[]> {
    return this.#tasks;
  }

  async create(task: Task): Promise<void> {
    this.#tasks.push(task);
  }

  async update(task: Task): Promise<void> {
    this.#tasks = this.#tasks.map(t => (t.id === task.id ? task : t));
  }

  async delete(id: string): Promise<void> {
    this.#tasks = this.#tasks.filter(t => t.id !== id);
  }
}
