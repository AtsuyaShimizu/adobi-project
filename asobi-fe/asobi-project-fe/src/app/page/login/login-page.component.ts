import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginFormComponent } from '../../view/parts/login-form/login-form.component';
import { AuthService } from '../../domain/service/impl/auth.service.impl';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [LoginFormComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  constructor(private router: Router, private authService: AuthService) {}

  async onLogin(event: { email: string; password: string }): Promise<void> {
    try {
      await this.authService.signIn(event.email, event.password);
      this.router.navigate(['/schedule']);
    } catch {
      alert('認証に失敗しました');
    }
  }

  onMoveToSignup(): void {
    this.router.navigate(['/signup']);
  }
}
