import { Routes } from '@angular/router';
import { HomeComponent } from './page/home/home';
import { LoginPageComponent } from './page/login/login-page.component';
import { SchedulePageComponent } from './page/schedule/schedule-page.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'schedule', component: SchedulePageComponent }
];
