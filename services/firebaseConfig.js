import { getApps, initializeApp } from 'firebase/app';
import { CACHE_SIZE_UNLIMITED, getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log(firebaseConfig.apiKey)

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  // Recommended for RN: increase cache, compat with suspense
  initializeFirestore(app, { cacheSizeBytes: CACHE_SIZE_UNLIMITED });
} else {
  app = getApps()[0];
}

export const db = getFirestore(app);
