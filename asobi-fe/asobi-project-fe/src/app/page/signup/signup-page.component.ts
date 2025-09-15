import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SignupFormComponent } from '../../view/parts/signup-form/signup-form.component';
import { AuthService } from '../../domain/service/impl/auth.service.impl';

@Component({
  selector: 'app-signup-page',
  standalone: true,
  imports: [SignupFormComponent],
  templateUrl: './signup-page.component.html',
  styleUrl: './signup-page.component.scss'
})
export class SignupPageComponent {
  constructor(private router: Router, private authService: AuthService) {}

  async onSignup(event: { email: string; password: string }): Promise<void> {
    try {
      await this.authService.signUp(event.email, event.password);
      this.router.navigate(['/login']);
    } catch {
      alert('サインアップに失敗しました');
    }
  }

  onMoveToLogin(): void {
    this.router.navigate(['/login']);
  }
}
