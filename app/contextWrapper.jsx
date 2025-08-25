import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { CartProvider } from '../context/CartContext';

export default function ContextWrapper({ children }) {
  return (
    <LanguageProvider>
      <CartProvider>
        <AuthProvider>{children}</AuthProvider>
      </CartProvider>
    </LanguageProvider>
  );
}
