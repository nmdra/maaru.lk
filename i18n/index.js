import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// Import language resources
import en from './locales/en.json';
import si from './locales/si.json';
import ta from './locales/ta.json';

// Language detector for React Native
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: (callback) => {
    // Try to get language from AsyncStorage
    // For now, using localStorage fallback for web compatibility
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Web environment
        const savedLanguage = window.localStorage.getItem('app_language_preference');
        if (savedLanguage) {
          callback(savedLanguage);
          return;
        }
      }
      // Default to English if no saved preference
      callback('en');
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: (language) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Web environment
        window.localStorage.setItem('app_language_preference', language);
      }
      // For React Native, this would use AsyncStorage:
      // AsyncStorage.setItem('app_language_preference', language);
    } catch (error) {
      console.error('Error caching language:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: en },
      si: { translation: si },
      ta: { translation: ta },
    },
    fallbackLng: 'en',
    debug: __DEV__, // Enable debug in development
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

export default i18n;