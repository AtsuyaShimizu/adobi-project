import { Injectable, inject } from '@angular/core';
import { ScheduleServiceInterface } from '../interface/schedule.service';
import { Task } from '../../model/task';
import { ScheduleRepository } from '../../../infrastructure/repository/schedule.repository';
import { ScheduleState } from '../../state/local/schedule.state';

@Injectable({ providedIn: 'root' })
export class ScheduleService implements ScheduleServiceInterface {
  #repository = inject(ScheduleRepository);
  #state = inject(ScheduleState);

  async load(): Promise<void> {
    const tasks = await this.#repository.findAll();
    tasks.forEach(task => this.#state.add(task));
  }

  async add(task: Task): Promise<void> {
    await this.#repository.save(task);
    this.#state.add(task);
  }

  async update(task: Task): Promise<void> {
    await this.#repository.update(task);
    this.#state.update(task);
  }

  async remove(id: string): Promise<void> {
    await this.#repository.delete(id);
    this.#state.remove(id);
  }
}
