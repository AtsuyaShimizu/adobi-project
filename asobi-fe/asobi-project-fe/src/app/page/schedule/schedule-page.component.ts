import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ScheduleLayoutComponent } from '../../view/layouts/schedule-layout/schedule-layout.component';
import { ScheduleService } from '../../domain/service/impl/schedule.service.impl';
import { Task } from '../../domain/model/task';
import { ClockService } from '../../domain/service/impl/clock.service.impl';

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
  protected tasks = this.#scheduleService.tasks;
  protected isFormVisible = signal(false);
  protected isCalendarVisible = signal(false);
  protected dateTime = this.#clockService.now;

  ngOnInit(): void {
    this.#scheduleService.load();
    this.#clockService.start();
  }

  openForm(): void {
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

  onCreate(task: Task): void {
    this.#scheduleService.add(task);
    this.closeForm();
  }
}
