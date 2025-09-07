import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import language resources
import en from './locales/en.json';
import si from './locales/si.json';
import ta from './locales/ta.json';

// Language detector for React Native
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      // Check if we're in a web environment
      if (typeof window !== 'undefined' && window.localStorage) {
        // Web environment - use localStorage
        const savedLanguage = window.localStorage.getItem('app_language_preference');
        if (savedLanguage) {
          callback(savedLanguage);
          return;
        }
      } else {
        // React Native environment - use AsyncStorage
        const savedLanguage = await AsyncStorage.getItem('app_language_preference');
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
  cacheUserLanguage: async (language) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Web environment - use localStorage
        window.localStorage.setItem('app_language_preference', language);
      } else {
        // React Native environment - use AsyncStorage
        await AsyncStorage.setItem('app_language_preference', language);
      }
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