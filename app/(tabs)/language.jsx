import React, { useContext } from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import LanguageDropdown from '../../components/LanguageDropdown';
import { LanguageContext } from '../../context/LanguageContext';

export default function LanguageScreen() {
  const { currentLanguage, changeLanguage } = useContext(LanguageContext);

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <ScrollView className="flex-1 px-4 py-6">
        <View className="bg-white rounded-xl shadow-md p-6 mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Language Settings
          </Text>
          <Text className="text-gray-600 mb-6">
            Select your preferred language for the app interface
          </Text>
          
          <View className="mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              Current Language: {currentLanguage === 'en' ? 'English' : 'Sinhala'}
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
            • English: Full app support with all features{'\n'}
            • Sinhala (සිංහල): Native language support{'\n'}
            • Changes are saved automatically{'\n'}
            • Restart may be required for some changes
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}