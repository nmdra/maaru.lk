// context/AuthContext.jsx
import { getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { firebaseConfig } from '../services/firebaseConfig';
import { initSocket, cleanupSocket } from '../services/socket';
import { clearUserData } from '../utils/storage';

if (!getApps().length) initializeApp(firebaseConfig);
const auth = getAuth();

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    initSocket();         // socket will connect after login via onIdTokenChanged
    return () => cleanupSocket();
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const register = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  const logout = async () => {
    await clearUserData(); // Clear AsyncStorage on logout
    return signOut(auth);
  };

  // Optional: gate children until auth is ready
  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
