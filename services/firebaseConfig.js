import { getAI, GoogleAIBackend } from 'firebase/ai';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { CACHE_SIZE_UNLIMITED, getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase app
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  // Firestore with unlimited cache (recommended for React Native)
  initializeFirestore(app, { cacheSizeBytes: CACHE_SIZE_UNLIMITED });
} else {
  app = getApps()[0];
}

// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export const ai = getAI(app, { backend: new GoogleAIBackend() });

export default app;
