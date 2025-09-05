import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { LANGUAGE_OPTIONS, useAppI18n } from '../utils/i18n';

export default function LanguageDropdown({ selectedLanguage, onLanguageChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const { t, common } = useAppI18n();
  
  const selectedLang = LANGUAGE_OPTIONS.find(lang => lang.code === selectedLanguage) || LANGUAGE_OPTIONS[0];

  const handleLanguageSelect = (languageCode) => {
    onLanguageChange(languageCode);
    setIsOpen(false);
  };

  const renderLanguageItem = ({ item }) => (
    <TouchableOpacity
      className={`p-4 border-b border-gray-100 flex-row justify-between items-center ${
        item.code === selectedLanguage ? 'bg-blue-50' : 'bg-white'
      }`}
      onPress={() => handleLanguageSelect(item.code)}
    >
      <View>
        <Text className={`text-base font-medium ${
          item.code === selectedLanguage ? 'text-blue-600' : 'text-gray-900'
        }`}>
          {item.name}
        </Text>
        <Text className={`text-sm ${
          item.code === selectedLanguage ? 'text-blue-500' : 'text-gray-500'
        }`}>
          {item.nativeName}
        </Text>
      </View>
      {item.code === selectedLanguage && (
        <Ionicons name="checkmark-circle" size={24} color="#2563eb" />
      )}
    </TouchableOpacity>
  );

  return (
    <View className="relative">
      <TouchableOpacity
        className="bg-white border border-gray-300 rounded-lg p-4 flex-row justify-between items-center shadow-sm"
        onPress={() => setIsOpen(true)}
      >
        <View>
          <Text className="text-base font-medium text-gray-900">
            {selectedLang.name}
          </Text>
          <Text className="text-sm text-gray-500">
            {selectedLang.nativeName}
          </Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#6b7280" 
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity 
          className="flex-1 bg-black bg-opacity-50 justify-center items-center"
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View className="bg-white rounded-xl mx-4 max-w-sm w-full shadow-xl">
            <View className="p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-900 text-center">
                {t('language.selectLanguage')}
              </Text>
            </View>
            
            <FlatList
              data={LANGUAGE_OPTIONS}
              renderItem={renderLanguageItem}
              keyExtractor={(item) => item.code}
              className="max-h-64"
            />
            
            <TouchableOpacity
              className="p-4 border-t border-gray-200"
              onPress={() => setIsOpen(false)}
            >
              <Text className="text-center text-gray-600 font-medium">
                {common('cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}