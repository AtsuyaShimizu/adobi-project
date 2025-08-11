import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ScheduleLayoutComponent } from '../../view/layouts/schedule-layout/schedule-layout.component';
import { ScheduleService } from '../../domain/service/impl/schedule.service.impl';
import { ScheduleState } from '../../domain/state/local/schedule.state';
import { Task } from '../../domain/model/task';

@Component({
  selector: 'app-schedule-page',
  standalone: true,
  imports: [ScheduleLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './schedule-page.component.html'
})
export class SchedulePageComponent implements OnInit {
  #service = inject(ScheduleService);
  #state = inject(ScheduleState);
  protected tasks = this.#state.tasks;
  protected isFormVisible = signal(false);

  ngOnInit(): void {
    this.#service.load();
  }

  openForm(): void {
    this.isFormVisible.set(true);
  }

  closeForm(): void {
    this.isFormVisible.set(false);
  }

  onCreate(task: Task): void {
    this.#service.add(task);
    this.closeForm();
  }
}
