import React, { createContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

export const LanguageContext = createContext();

const LANGUAGE_STORAGE_KEY = 'app_language_preference';

// Storage implementation with AsyncStorage for React Native and localStorage for web
const storage = {
  async getItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Web environment - use localStorage
        return window.localStorage.getItem(key);
      } else {
        // React Native environment - use AsyncStorage
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },
  async setItem(key, value) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Web environment - use localStorage
        window.localStorage.setItem(key, value);
      } else {
        // React Native environment - use AsyncStorage
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error saving item to storage:', error);
    }
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language preference on app start
  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await storage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && savedLanguage !== currentLanguage) {
        await changeLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (languageCode) => {
    try {
      // Change language in i18next
      await i18n.changeLanguage(languageCode);
      setCurrentLanguage(languageCode);
      await storage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // Legacy support for old translation format
  const getLocalizedText = (translations) => {
    return translations[currentLanguage] || translations['en'] || '';
  };

  const contextValue = {
    currentLanguage,
    changeLanguage,
    getLocalizedText,
    isLoading,
    // Language-specific utilities
    isRTL: currentLanguage === 'ar', // Add RTL support if needed
    languageDirection: currentLanguage === 'ar' ? 'rtl' : 'ltr',
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook for using language context
export const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Enhanced hook that combines language context with i18next
export const useAppTranslation = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const languageContext = useLanguage();
  
  return {
    t, // i18next translation function
    ...languageContext, // language context functions
    i18n: i18nInstance, // i18next instance
  };
};

// Legacy translation helper for backward compatibility
// Deprecated: Use useAppTranslation hook instead
export const translations = {
  // Common UI elements
  save: {
    en: 'Save',
    si: 'සුරකින්න',
  },
  cancel: {
    en: 'Cancel',
    si: 'අවලංගු කරන්න',
  },
  loading: {
    en: 'Loading...',
    si: 'පූරණය වෙමින්...',
  },
  // Navigation labels
  home: {
    en: 'Home',
    si: 'මුල් පිටුව',
  },
  search: {
    en: 'Search',
    si: 'සොයන්න',
  },
  profile: {
    en: 'Profile',
    si: 'පැතිකඩ',
  },
  language: {
    en: 'Language',
    si: 'භාෂාව',
  },
  // Language screen specific
  languageSettings: {
    en: 'Language Settings',
    si: 'භාෂා සැකසුම්',
  },
  selectLanguage: {
    en: 'Select your preferred language for the app interface',
    si: 'යෙදුම් අතුරුමුහුණත සඳහා ඔබගේ කැමති භාෂාව තෝරන්න',
  },
};