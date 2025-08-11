export interface Task {
  id: string;
  type: string; // classification
  name: string;
  detail: string;
  assignee: string;
  start: Date;
  end: Date;
  progress: number; // 0-100
}
