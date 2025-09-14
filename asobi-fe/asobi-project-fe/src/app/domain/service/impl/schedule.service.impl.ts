import { Injectable, inject } from '@angular/core';
import { ScheduleServiceInterface } from '../interface/schedule.service';
import { Task } from '../../model/task';
import { ScheduleRepository } from '../../../infrastructure/repository/schedule.repository';
import { ScheduleState } from '../../state/local/schedule.state';

@Injectable({ providedIn: 'root' })
export class ScheduleService implements ScheduleServiceInterface {
  #repository = inject(ScheduleRepository);
  #state = inject(ScheduleState);
  readonly tasks = this.#state.tasks;

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

  /**
   * 指定日の実績を登録し、任意に進捗値も加算します。
   * 進捗（%）はUI表示のため現仕様では維持/加算しますが、
   * 実績バー表示は `actualDates` を参照します。
   */
  async addProgressAtDate(id: string, value: number, date: Date): Promise<void> {
    const tasks = this.#state.tasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // 実績日を日単位で追加（重複排除）。UTCベースではなくローカル日付キーで管理する
    const toLocalKey = (d: Date) => {
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const dd = d.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const key = toLocalKey(d);
    const existing = new Set((task.actualDates ?? []).map(x => {
      if (typeof x === 'string' && /^(\d{4}-\d{2}-\d{2})$/.test(x)) return x;
      const asDate = typeof x === 'string' ? new Date(x) : x;
      return toLocalKey(new Date(asDate.getFullYear(), asDate.getMonth(), asDate.getDate()));
    }));
    if (!existing.has(key)) existing.add(key);
    const actualDates = Array.from(existing.values());

    // 進捗%は従来通り加算（仕様により無視/維持でも可）
    const progress = Math.min(task.progress + value, 100);
    const updated: Task = { ...task, progress, actualDates };

    // バックエンドAPIは実績を未対応のため、まずはフロント側の状態を即時反映
    this.#state.update(updated);
    // 併せて既存APIへは基本項目のみ更新（actualDatesは送られない）
    await this.#repository.update(updated);
  }

  // 互換API: 旧インターフェース用（当日付で実績扱いにする）
  async addProgress(id: string, value: number): Promise<void> {
    const today = new Date();
    await this.addProgressAtDate(id, value, today);
  }
}
