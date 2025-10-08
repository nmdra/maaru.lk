import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function ChatBubble({ to = '/chat' }) {
  const router = useRouter();

  const handlePress = () => {
    // Navigate to chat or show coming soon message
    console.log('Chat bubble pressed');
    // You can implement navigation to chat screen here
    // router.push(to);
    
    // For now, just log - you can implement actual chat navigation later
    alert('Chat feature coming soon!');
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      activeOpacity={0.8}
      style={{
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
      <Ionicons name="chatbubble-outline" size={24} color="white" />
    </TouchableOpacity>
  );
}