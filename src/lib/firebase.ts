import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyAq2xknZWgdTjIakUie8jAeJ4SQmXXHVGs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "rodrigo-dvision.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "rodrigo-dvision",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "rodrigo-dvision.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "474328399629",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:474328399629:web:716e43cb5a7f40616fba44",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-NJ153MYMYN",
};

// Prevent re-initializing on HMR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
