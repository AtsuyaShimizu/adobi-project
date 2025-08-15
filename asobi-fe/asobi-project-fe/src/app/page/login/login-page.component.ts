import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginFormComponent } from '../../view/parts/login-form/login-form.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [LoginFormComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  constructor(private router: Router) {}

  onLogin(_: { identifier: string; password: string }): void {
    this.router.navigate(['/schedule']);
  }
}
