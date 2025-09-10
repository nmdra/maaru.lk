import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const BottomNavigation = ({ currentRoute }) => {
  const router = useRouter();
  const pathname = usePathname();

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
      name: 'Reviews',
      route: '/(tabs)/Reviews',
      icon: 'star-outline',
      activeIcon: 'star',
    },
    {
      name: 'Language',
      route: '/(tabs)/language',
      icon: 'language-outline',
      activeIcon: 'language',
    },
  ];

  const isActive = (route) => {
    return pathname === route || currentRoute === route;
  };

  const handleNavigation = (route) => {
    router.push(route);
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
              onPress={() => handleNavigation(tab.route)}
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
    </View>
  );
};

export default BottomNavigation;