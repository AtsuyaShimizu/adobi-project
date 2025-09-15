import { Injectable } from '@angular/core';
import { AuthServiceInterface } from '../interface/auth.service';
import { firebaseApp } from '../../../infrastructure/firebase/firebase';
import {
  Auth,
  User,
  getAuth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
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

  async sendEmailLink(email: string): Promise<void> {
    const actionCodeSettings = {
      url: `${location.origin}/login`,
      handleCodeInApp: true
    };
    await sendSignInLinkToEmail(this.#auth, email, actionCodeSettings);
    window.localStorage.setItem('signInEmail', email);
  }

  async completeSignIn(url: string): Promise<boolean> {
    if (isSignInWithEmailLink(this.#auth, url)) {
      const email = window.localStorage.getItem('signInEmail');
      if (!email) {
        return false;
      }
      await signInWithEmailLink(this.#auth, email, url);
      window.localStorage.removeItem('signInEmail');
      return true;
    }
    return false;
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(this.#auth);
  }
}
