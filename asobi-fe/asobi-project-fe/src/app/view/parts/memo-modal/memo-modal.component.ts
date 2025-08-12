import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-memo-modal',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './memo-modal.component.html',
  styleUrl: './memo-modal.component.scss'
})
export class MemoModalComponent {
  text = '';
  @Output() confirm = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();
}
