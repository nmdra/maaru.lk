import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LANGUAGE_OPTIONS, getLanguageName, useAppI18n } from '../utils/i18n';

const BottomNavigation = ({ currentRoute }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { t, currentLanguage, changeLanguage } = useAppI18n();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const tabs = [
    {
      name: 'Home',
      route: '/(tabs)/Home',
      icon: 'home-outline',
      activeIcon: 'home',
    },
    {
      name: 'Search',
      route: '/(tabs)/search',
      icon: 'search-outline',
      activeIcon: 'search',
    },
    {
      name: 'Swap',
      route: '/(tabs)/swap',
      icon: 'swap-horizontal-outline',
      activeIcon: 'swap-horizontal',
    },
    {
      name: 'Reviews',
      route: '/(tabs)/Reviews',
      icon: 'star-outline',
      activeIcon: 'star',
    },
    // {
    //   name: 'Language',
    //   route: '/(tabs)/language',
    //   icon: 'language-outline',
    //   activeIcon: 'language',
    // },
  ];

  const isActive = (route) => {
    return pathname === route || currentRoute === route;
  };

  const handleNavigation = (route, tabName) => {
    if (tabName === 'Language') {
      setLanguageModalVisible(true);
    } else {
      router.push(route);
    }
  };

  const handleLanguageSelect = (languageCode) => {
    changeLanguage(languageCode);
    setLanguageModalVisible(false);
  };

  return (
    <View className="bg-white border-t border-gray-200 px-2 py-1">
      <View 
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 8,
          height: 60,
        }}
      >
        {tabs.map((tab) => {
          const active = isActive(tab.route);
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => handleNavigation(tab.route, tab.name)}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 4,
              }}
            >
              <Ionicons
                name={active ? tab.activeIcon : tab.icon}
                size={24}
                color={active ? '#2f6feb' : '#555'}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: active ? '#2f6feb' : '#555',
                  marginTop: 2,
                }}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Language Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={languageModalVisible}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', flex: 1 }}>{t('language.settings')}</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            Current Language
            <View style={{ paddingHorizontal: 20, paddingBottom: 15 }}>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
                {t('language.currentLanguage')}: {getLanguageName(currentLanguage, true)}
              </Text>
            </View>

            {/* Language Options */}
            <ScrollView style={{ maxHeight: 300 }}>
              {LANGUAGE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.code}
                  onPress={() => handleLanguageSelect(option.code)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 15,
                    backgroundColor: currentLanguage === option.code ? '#f0f8ff' : 'white',
                    borderLeftWidth: currentLanguage === option.code ? 4 : 0,
                    borderLeftColor: '#2f6feb',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: currentLanguage === option.code ? 'bold' : 'normal',
                      color: currentLanguage === option.code ? '#2f6feb' : '#333'
                    }}>
                      {option.nativeName}
                    </Text>
                    <Text style={{ 
                      fontSize: 14, 
                      color: '#666', 
                      marginTop: 2 
                    }}>
                      {option.englishName}
                    </Text>
                  </View>
                  {currentLanguage === option.code && (
                    <Ionicons name="checkmark-circle" size={20} color="#2f6feb" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Bottom spacing for safe area */}
            <View style={{ height: 30 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BottomNavigation;