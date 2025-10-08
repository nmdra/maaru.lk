import React from 'react';
import { Platform } from 'react-native';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';

// Initialize i18n
import '../i18n';

// Conditionally import StripeProvider only on native platforms
let StripeProvider;
if (Platform.OS !== 'web') {
  StripeProvider = require('@stripe/stripe-react-native').StripeProvider;
}

export default function ContextWrapper({ children }) {
  const content = (
    <LanguageProvider>
      <AuthProvider>{children}</AuthProvider>
    </LanguageProvider>
  );

  // Only wrap with StripeProvider on native platforms
  if (Platform.OS !== 'web' && StripeProvider) {
    return (
      <StripeProvider
        publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}
        urlScheme="maarulk"
      >
        {content}
      </StripeProvider>
    );
  }

  return content;
}
