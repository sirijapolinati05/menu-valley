import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA-z4EZqjV7HQF8NY3DygBS25xX-CKKgBI",
  authDomain: "hostelapp-6b14e.firebaseapp.com",
  projectId: "hostelapp-6b14e",
  storageBucket: "hostelapp-6b14e.appspot.com",
  messagingSenderId: "85557403111",
  appId: "1:85557403111:web:118edffb34f83db71cf142",
  measurementId: "G-07LN0SXKX6",
};

// Initialize Firebase app only if it hasn't been initialized
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };