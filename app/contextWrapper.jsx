import React from 'react';
import { Platform } from 'react-native';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { StripeProvider } from '../utils/stripe';

// Initialize i18n
import '../i18n';

export default function ContextWrapper({ children }) {
  const content = (
    <LanguageProvider>
      <AuthProvider>{children}</AuthProvider>
    </LanguageProvider>
  );

  // Always use StripeProvider (it will be a no-op on web)
  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}
      urlScheme="maarulk"
    >
      {content}
    </StripeProvider>
  );
}
