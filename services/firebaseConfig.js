import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAI, GoogleAIBackend } from 'firebase/ai';
import { getApps, initializeApp } from 'firebase/app';
import {
  getAuth, // native
  getReactNativePersistence,
  GoogleAuthProvider, // web
  initializeAuth, // native
} from 'firebase/auth';
import {
  CACHE_SIZE_UNLIMITED,
  getFirestore,
  initializeFirestore,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

// ---- Firebase config (envs via app.json / eas.json) ----
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// ---- App init ----
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  // Firestore with unlimited cache (good for RN)
  initializeFirestore(app, { cacheSizeBytes: CACHE_SIZE_UNLIMITED });
} else {
  app = getApps()[0];
}

// ---- Auth init (platform-safe) ----
// Web uses getAuth(); Native uses initializeAuth() with AsyncStorage persistence
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

// ---- Services ----
export const db = getFirestore(app);
export const storage = getStorage(app);
export { auth };
export const googleAuthProvider = new GoogleAuthProvider();
export const ai = getAI(app, { backend: new GoogleAIBackend() });

export default app;
