import React from 'react';
import { AuthProvider } from '../context/AuthContext';

export default function ContextWrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
