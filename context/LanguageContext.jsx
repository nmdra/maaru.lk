import React, { createContext, useState, useEffect } from 'react';

export const LanguageContext = createContext();

const LANGUAGE_STORAGE_KEY = 'app_language_preference';

// Simple storage implementation for demo purposes
// In production, you would use AsyncStorage or expo-secure-store
const storage = {
  async getItem(key) {
    // For now, return null to use default language
    // This can be replaced with actual AsyncStorage when properly installed
    return null;
  },
  async setItem(key, value) {
    // For now, just log the action
    console.log(`Saving ${key}: ${value}`);
    return Promise.resolve();
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en'); // Default to English
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language preference on app start
  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await storage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage) {
        setCurrentLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (languageCode) => {
    try {
      setCurrentLanguage(languageCode);
      await storage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

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

// Translation helper - can be expanded with actual translation files
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