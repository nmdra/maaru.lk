import React from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import LanguageDropdown from '../../components/LanguageDropdown';
import { useAppI18n, getLanguageName } from '../../utils/i18n';

export default function LanguageScreen() {
  const { t, currentLanguage, changeLanguage } = useAppI18n();

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <ScrollView className="flex-1 px-4 py-6">
        <View className="bg-white rounded-xl shadow-md p-6 mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {t('language.settings')}
          </Text>
          <Text className="text-gray-600 mb-6">
            {t('language.selectLanguage')}
          </Text>
          
          <View className="mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              {t('language.currentLanguage')}: {getLanguageName(currentLanguage, true)}
            </Text>
            
            <LanguageDropdown
              selectedLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
            />
          </View>
        </View>

        <View className="bg-white rounded-xl shadow-md p-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            About Language Support
          </Text>
          <Text className="text-gray-600 leading-6">
            • {t('language.english')}: Full app support with all features{'\n'}
            • {t('language.sinhala')}: Native language support{'\n'}
            • {t('language.tamil')}: Native language support{'\n'}
            • Changes are saved automatically{'\n'}
            • Restart may be required for some changes
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}