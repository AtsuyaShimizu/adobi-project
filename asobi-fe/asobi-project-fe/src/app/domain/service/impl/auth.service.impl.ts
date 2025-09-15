import { Injectable } from '@angular/core';
import { AuthServiceInterface } from '../interface/auth.service';
import { firebaseApp } from '../../../infrastructure/firebase/firebase';
import {
  Auth,
  User,
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { AuthState } from '../../state/global/auth.state';

@Injectable({ providedIn: 'root' })
export class AuthService implements AuthServiceInterface {
  #auth: Auth;

  constructor(private authState: AuthState) {
    this.#auth = getAuth(firebaseApp);
    onAuthStateChanged(this.#auth, (user: User | null) => {
      this.authState.setUser(user);
    });
  }

  async signUp(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(this.#auth, email, password);
  }

  async signIn(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.#auth, email, password);
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(this.#auth);
  }
}
