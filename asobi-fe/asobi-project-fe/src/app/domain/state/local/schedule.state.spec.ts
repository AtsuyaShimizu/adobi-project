import { ScheduleState } from './schedule.state';
import { Task } from '../../model/task';

describe('ScheduleState', () => {
  it('should manage tasks', () => {
    const state = new ScheduleState();
    const task: Task = {
      id: '1',
      type: '',
      name: 'task',
      detail: '',
      assignee: '',
      start: new Date(),
      end: new Date(),
      progress: 0
    };

    state.add(task);
    expect(state.tasks().length).toBe(1);

    const updated: Task = { ...task, name: 'updated' };
    state.update(updated);
    expect(state.tasks()[0].name).toBe('updated');

    state.remove('1');
    expect(state.tasks().length).toBe(0);
  });
});
