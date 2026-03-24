import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDMFIfOI-K3EQqS-0bVEUidaC0OQz77O-Q',
  authDomain: 'chanceof36.firebaseapp.com',
  projectId: 'chanceof36',
  storageBucket: 'chanceof36.firebasestorage.app',
  messagingSenderId: '598590788318',
  appId: '1:598590788318:web:4566b6f4a4faf5c017a84f',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
