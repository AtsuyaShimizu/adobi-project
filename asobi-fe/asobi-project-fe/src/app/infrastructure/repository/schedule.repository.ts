import { Injectable } from '@angular/core';
import { Task } from '../../domain/model/task';
import { ScheduleApi } from '../api/schedule.api';

@Injectable({ providedIn: 'root' })
export class ScheduleRepository {
  constructor(private api: ScheduleApi) {}

  findAll(): Promise<Task[]> {
    return this.api.list();
  }

  save(task: Task): Promise<void> {
    return this.api.create(task);
  }

  update(task: Task): Promise<void> {
    return this.api.update(task);
  }

  delete(id: string): Promise<void> {
    return this.api.delete(id);
  }
}
