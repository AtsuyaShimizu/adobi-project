import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup-form',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './signup-form.component.html',
  styleUrl: './signup-form.component.scss'
})
export class SignupFormComponent {
  email = '';
  password = '';

  @Output() signup = new EventEmitter<{ email: string; password: string }>();
  @Output() moveToLogin = new EventEmitter<void>();

  onSubmit(): void {
    this.signup.emit({ email: this.email, password: this.password });
  }

  onMoveToLogin(): void {
    this.moveToLogin.emit();
  }
}
