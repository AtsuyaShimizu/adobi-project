export interface AuthServiceInterface {
  sendEmailLink(email: string): Promise<void>;
  completeSignIn(url: string): Promise<boolean>;
  signOut(): Promise<void>;
}
