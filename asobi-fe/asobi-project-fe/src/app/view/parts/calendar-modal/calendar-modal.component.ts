import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-calendar-modal',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar-modal.component.html',
  styleUrl: './calendar-modal.component.scss'
})
export class CalendarModalComponent {
  protected selected = this.toInputValue(new Date());

  @Output() confirm = new EventEmitter<Date>();
  @Output() close = new EventEmitter<void>();

  protected submit(): void {
    this.confirm.emit(new Date(this.selected));
  }

  private toInputValue(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

