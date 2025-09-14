import { Injectable, computed, signal } from '@angular/core';
import { User } from 'firebase/auth';
import { AuthStateInterface } from '../interface/auth-state';

@Injectable({ providedIn: 'root' })
export class AuthState implements AuthStateInterface {
  #user = signal<User | null>(null);
  readonly user = this.#user.asReadonly();
  readonly isAuthenticated = computed(() => this.#user() !== null);

  setUser(user: User | null): void {
    this.#user.set(user);
  }
}
