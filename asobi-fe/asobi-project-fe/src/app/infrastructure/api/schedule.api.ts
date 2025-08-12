import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Task } from '../../domain/model/task';

interface ApiTask {
  id: number;
  title: string;
  phase: string;
  startDate: string;
  endDate: string;
}

@Injectable({ providedIn: 'root' })
export class ScheduleApi {
  #http = inject(HttpClient);
  readonly #baseUrl = 'http://localhost:3000/tasks';

  async list(): Promise<Task[]> {
    const apiTasks = await firstValueFrom(this.#http.get<ApiTask[]>(this.#baseUrl));
    return apiTasks.map(t => ({
      id: String(t.id),
      type: t.phase,
      name: t.title,
      detail: '',
      assignee: '',
      start: new Date(t.startDate),
      end: new Date(t.endDate),
      progress: 0
    }));
  }

  async create(task: Task): Promise<void> {
    const body: ApiTask = {
      id: Number(task.id),
      title: task.name,
      phase: task.type,
      startDate: task.start.toISOString().split('T')[0],
      endDate: task.end.toISOString().split('T')[0]
    };
    await firstValueFrom(this.#http.post<ApiTask>(this.#baseUrl, body));
  }

  async update(task: Task): Promise<void> {
    const body: ApiTask = {
      id: Number(task.id),
      title: task.name,
      phase: task.type,
      startDate: task.start.toISOString().split('T')[0],
      endDate: task.end.toISOString().split('T')[0]
    };
    await firstValueFrom(this.#http.put<ApiTask>(`${this.#baseUrl}/${task.id}`, body));
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.#http.delete(`${this.#baseUrl}/${id}`));
  }
}
