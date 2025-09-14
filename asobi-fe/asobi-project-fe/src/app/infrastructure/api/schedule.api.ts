import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Task } from '../../domain/model/task';

interface ApiTask {
  id: number;
  title: string;
  detail: string;
  phase: string;
  assignee: string;
  startDate: string;
  endDate: string;
}

@Injectable({ providedIn: 'root' })
export class ScheduleApi {
  #http = inject(HttpClient);
  readonly #baseUrl = 'http://localhost:3000/tasks';

  private parseLocalYMD(s: string): Date {
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return new Date(s);
  }

  private formatLocalYMD(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  async list(): Promise<Task[]> {
    const apiTasks = await firstValueFrom(this.#http.get<ApiTask[]>(this.#baseUrl));
    return apiTasks.map(t => ({
      id: String(t.id),
      type: t.phase,
      name: t.title,
      detail: t.detail,
      assignee: t.assignee,
      start: this.parseLocalYMD(t.startDate),
      end: this.parseLocalYMD(t.endDate),
      progress: 0
    }));
  }

  async create(task: Task): Promise<void> {
    const body: ApiTask = {
      id: Number(task.id),
      title: task.name,
      detail: task.detail,
      phase: task.type,
      assignee: task.assignee,
      startDate: this.formatLocalYMD(task.start),
      endDate: this.formatLocalYMD(task.end)
    };
    await firstValueFrom(this.#http.post<ApiTask>(this.#baseUrl, body));
  }

  async update(task: Task): Promise<void> {
    const body: ApiTask = {
      id: Number(task.id),
      title: task.name,
      detail: task.detail,
      phase: task.type,
      assignee: task.assignee,
      startDate: this.formatLocalYMD(task.start),
      endDate: this.formatLocalYMD(task.end)
    };
    await firstValueFrom(this.#http.put<ApiTask>(`${this.#baseUrl}/${task.id}`, body));
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.#http.delete(`${this.#baseUrl}/${id}`));
  }
}
