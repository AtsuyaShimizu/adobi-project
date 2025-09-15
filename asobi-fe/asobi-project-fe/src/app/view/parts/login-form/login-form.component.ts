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
  email = '';
  password = '';

  @Output() login = new EventEmitter<{ email: string; password: string }>();
  @Output() moveToSignup = new EventEmitter<void>();

  onSubmit(): void {
    this.login.emit({ email: this.email, password: this.password });
  }

  onMoveToSignup(): void {
    this.moveToSignup.emit();
  }
}
