import { Task } from '../../model/task';

export interface ScheduleServiceInterface {
  load(): Promise<void>;
  add(task: Task): Promise<void>;
  update(task: Task): Promise<void>;
  remove(id: string): Promise<void>;
}
