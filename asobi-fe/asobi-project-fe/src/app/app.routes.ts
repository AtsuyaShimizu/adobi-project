import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthState } from './domain/state/global/auth.state';
import { HomeComponent } from './page/home/home';
import { LoginPageComponent } from './page/login/login-page.component';
import { SchedulePageComponent } from './page/schedule/schedule-page.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginPageComponent },
  {
    path: 'schedule',
    component: SchedulePageComponent,
    canActivate: [() => {
      const authState = inject(AuthState);
      const router = inject(Router);
      if (!authState.isAuthenticated()) {
        router.navigate(['/login']);
        return false;
      }
      return true;
    }]
  }
];
