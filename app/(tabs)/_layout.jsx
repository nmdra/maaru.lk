import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useContext, useState } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { useAppI18n, LANGUAGE_OPTIONS, getLanguageName } from '../../utils/i18n';
// import { CartContext } from '../../context/CartContext';

function CartTabIcon({ color, size }) {
  const { getCartItemCount } = useContext(CartContext);
  const itemCount = getCartItemCount();

  return (
    <View className="relative">
      <Ionicons name="cart-outline" size={size ?? 24} color={color} />
      {itemCount > 0 && (
        <View className="absolute -top-1 -right-2 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center">
          <Text className="text-white text-[10px] font-bold">
            {itemCount > 99 ? '99+' : itemCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { t, currentLanguage, changeLanguage } = useAppI18n();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const handleLanguageSelect = (languageCode) => {
    changeLanguage(languageCode);
    setLanguageModalVisible(false);
  };

  return (
    <>
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', flex: 1 }}>{t('language.settings')}</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Current Language */}
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
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2f6feb',
        tabBarInactiveTintColor: '#555',
        tabBarStyle: {
          backgroundColor: '#fff',
          height: 60,
          paddingBottom: 6,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Reviews"
        options={{
          title: 'Reviews',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="star-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="language"
        options={{
          title: 'Language',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="language-outline" size={size ?? 24} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            setLanguageModalVisible(true);
          },
        }}
      />
    </Tabs>
    </>
  );
}
