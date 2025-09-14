import { Signal } from '@angular/core';
import { User } from 'firebase/auth';

export interface AuthStateInterface {
  readonly user: Signal<User | null>;
  readonly isAuthenticated: Signal<boolean>;
  setUser(user: User | null): void;
}
