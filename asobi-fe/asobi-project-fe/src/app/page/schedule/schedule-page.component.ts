import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ScheduleLayoutComponent } from '../../view/layouts/schedule-layout/schedule-layout.component';
import { ScheduleService } from '../../domain/service/impl/schedule.service.impl';
import { Task } from '../../domain/model/task';
import { ClockService } from '../../domain/service/impl/clock.service.impl';
import { MemoService } from '../../domain/service/impl/memo.service.impl';
import { Memo } from '../../domain/model/memo';

@Component({
  selector: 'app-schedule-page',
  standalone: true,
  imports: [ScheduleLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './schedule-page.component.html'
})
export class SchedulePageComponent implements OnInit {
  #scheduleService = inject(ScheduleService);
  #clockService = inject(ClockService);
  #memoService = inject(MemoService);
  protected tasks = this.#scheduleService.tasks;
  protected memos = this.#memoService.memos;
  protected isFormVisible = signal(false);
  protected isCalendarVisible = signal(false);
  protected isMemoVisible = signal(false);
  protected isTaskDetailVisible = signal(false);
  protected selectedTask = signal<Task | null>(null);
  protected editingTask = signal<Task | null>(null);
  protected dateTime = this.#clockService.now;

  ngOnInit(): void {
    this.#scheduleService.load();
    this.#clockService.start();
  }

  openForm(): void {
    this.editingTask.set(null);
    this.isFormVisible.set(true);
  }

  closeForm(): void {
    this.isFormVisible.set(false);
  }

  openCalendar(): void {
    this.isCalendarVisible.set(true);
  }

  closeCalendar(): void {
    this.isCalendarVisible.set(false);
  }

  openMemo(): void {
    this.isMemoVisible.set(true);
  }

  closeMemo(): void {
    this.isMemoVisible.set(false);
  }

  onSave(task: Task): void {
    if (this.editingTask()) {
      this.#scheduleService.update(task);
    } else {
      this.#scheduleService.add(task);
    }
    this.closeForm();
    this.editingTask.set(null);
  }

  onMemoCreate(event: { text: string; x: number; y: number }): void {
    const memo: Memo = {
      id: crypto.randomUUID(),
      text: event.text,
      x: event.x,
      y: event.y,
      width: 120,
      height: 80,
    };
    this.#memoService.add(memo);
    this.closeMemo();
  }

  onMemoChange(memo: Memo): void {
    this.#memoService.update(memo);
  }

  openTaskDetail(task: Task): void {
    this.selectedTask.set(task);
    this.isTaskDetailVisible.set(true);
  }

  closeTaskDetail(): void {
    this.isTaskDetailVisible.set(false);
    this.selectedTask.set(null);
  }

  onEdit(task: Task): void {
    this.editingTask.set(task);
    this.isFormVisible.set(true);
    this.closeTaskDetail();
  }

  onDelete(id: string): void {
    this.#scheduleService.remove(id);
    this.closeTaskDetail();
  }

  onProgressInput(event: { task: Task; value: number }): void {
    this.#scheduleService.addProgress(event.task.id, event.value);
  }
}
