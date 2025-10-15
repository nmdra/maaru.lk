import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import Colors from '../../constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: Colors.navigation.active,
        tabBarInactiveTintColor: Colors.navigation.inactive,
        tabBarStyle: {
          backgroundColor: Colors.navigation.background,
          borderTopColor: Colors.navigation.border,
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
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="swap"
        options={{
          title: 'Swap',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="swap-horizontal-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Reviews"
        options={{
          title: 'Reviews',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="star-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
