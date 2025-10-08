// Mock Stripe module for web platform
// This prevents native Stripe modules from being imported on web

export const StripeProvider = ({ children }) => {
  // Return children without Stripe wrapper on web
  return children;
};

export const useStripe = () => {
  // Return mock Stripe hooks for web
  return {
    initPaymentSheet: () => Promise.resolve({ error: null }),
    presentPaymentSheet: () => Promise.resolve({ error: null }),
    confirmPayment: () => Promise.resolve({ error: null }),
    createPaymentMethod: () => Promise.resolve({ error: null }),
  };
};

export default {
  StripeProvider,
  useStripe,
};