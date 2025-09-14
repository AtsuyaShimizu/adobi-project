import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../../../environments/firebase-config';

export const firebaseApp = initializeApp(firebaseConfig);
