import React from 'react';
import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Chats' }} />
      <Stack.Screen name="[roomId]" options={{ title: 'Chat' }} />
    </Stack>
  );
}
