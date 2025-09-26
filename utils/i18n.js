import { useTranslation } from 'react-i18next';
import { useAppTranslation } from '../context/LanguageContext';
import i18n from '../i18n';

// Simple translation function for use outside React components
export const translate = (key, options = {}) => {
  return i18n.t(key, options);
};

// Language options for dropdowns and selectors
export const LANGUAGE_OPTIONS = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'si',
    name: 'Sinhala',
    nativeName: 'සිංහල',
    flag: '🇱🇰',
  },
  {
    code: 'ta',
    name: 'Tamil', 
    nativeName: 'தமிழ்',
    flag: '🇱🇰',
  },
];

// Helper function to get language display name
export const getLanguageName = (code, returnNative = false) => {
  const language = LANGUAGE_OPTIONS.find(lang => lang.code === code);
  if (!language) return code;
  return returnNative ? language.nativeName : language.name;
};

// Hook for components that need translation
export const useAppI18n = () => {
  const { t, i18n } = useTranslation();
  const { currentLanguage, changeLanguage } = useAppTranslation();
  
  return {
    t,
    currentLanguage,
    changeLanguage,
    isRTL: currentLanguage === 'ar',
    languageOptions: LANGUAGE_OPTIONS,
    getLanguageName,
    // Convenience methods for common translations
    common: (key) => t(`common.${key}`),
    nav: (key) => t(`navigation.${key}`), 
    auth: (key) => t(`auth.${key}`),
    product: (key) => t(`products.${key}`),
    review: (key) => t(`reviews.${key}`),
    error: (key) => t(`errors.${key}`),
    message: (key) => t(`messages.${key}`),
  };
};

export default useAppI18n;