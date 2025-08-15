import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss'
})
export class LoginFormComponent {
  identifier = '';
  password = '';

  @Output() login = new EventEmitter<{ identifier: string; password: string }>();

  onSubmit(): void {
    this.login.emit({ identifier: this.identifier, password: this.password });
  }
}
