import { Component, OnInit } from '@angular/core';
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
export class LoginPageComponent implements OnInit {
  constructor(private router: Router, private authService: AuthService) {}

  async onLogin(event: { email: string }): Promise<void> {
    await this.authService.sendEmailLink(event.email);
  }

  async ngOnInit(): Promise<void> {
    const signedIn = await this.authService.completeSignIn(window.location.href);
    if (signedIn) {
      this.router.navigate(['/schedule']);
    }
  }
}
