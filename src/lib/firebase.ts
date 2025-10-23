// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import {
  getAuth, GoogleAuthProvider,
  signInWithPopup, signOut as fbSignOut
} from "firebase/auth";

const app = initializeApp({
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  measurementId: import.meta.env.VITE_FB_MEASUREMENT_ID,
});

export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export async function signIn() {
  return signInWithPopup(auth, provider);
}
export async function signOut() {
  return fbSignOut(auth);
}

