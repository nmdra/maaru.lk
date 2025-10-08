// Web-specific Stripe provider (no-op)
import React from 'react';

export const StripeProvider = ({ children }) => {
  return children; // Just return children without Stripe wrapper
};

export const useStripe = () => {
  return null; // Return null on web
};

export default {
  StripeProvider,
  useStripe,
};