import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { CartContext } from '../../context/CartContext';

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
  return (
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
      />
    </Tabs>
  );
}
