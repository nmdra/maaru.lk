import { Stack } from 'expo-router';
import ContextWrapper from './contextWrapper';

import '../global.css';

export default function RootLayout() {
  return (
    <ContextWrapper>
      <Stack screenOptions={{ headerShown: false }} />
    </ContextWrapper>
  );
}
