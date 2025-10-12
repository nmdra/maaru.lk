import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, View } from 'react-native';

export default function Header() {
  const router = useRouter();

  return (
    <View className="bg-white px-8 py-2 flex-row justify-between items-center border-b border-gray-200">
      {/* Logo on the left */}
      <View className="w-20 h-20 items-center justify-center">
        <Image
          source={require('../assets/images/logo_int.png')}
          style={{ width: 56, height: 56 }}
          resizeMode="contain"
        />
      </View>

      {/* Profile button on the right */}
      <Pressable
        onPress={() => router.push('/(auth)/Profile')}
        className="bg-blue-600 p-2 rounded-full"
        accessibilityLabel="Go to Profile"
      >
        <Ionicons name="person" size={24} color="white" />
      </Pressable>
    </View>
  );
}
