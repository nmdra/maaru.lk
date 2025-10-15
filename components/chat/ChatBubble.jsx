// components/chat/ChatBubble.jsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

export default function ChatBubble({ to = '/chat' }) {
  const router = useRouter();

  const handlePress = () => {
    router.push(to); // always open the inbox
  };

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        accessibilityRole="button"
        accessibilityLabel="Open chat inbox"
      >
        <Ionicons name="chatbubble-ellipses-outline" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 20,
    bottom: 30,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECBE8C',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  fabPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
});
