import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors';

export default function ChatBubble({ to = '/chat' }) {
  const router = useRouter();

  const handlePress = () => {
    console.log('Chat bubble pressed - navigating to:', to);
    router.push(to);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.accent, // Brand orange color #d3854d
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8, // For Android shadow
      }}
    >
      <Ionicons name="chatbubble" size={26} color="white" />
    </TouchableOpacity>
  );
}