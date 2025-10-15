import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

export default function ConfirmationScreen() {
  const router = useRouter();
  const { name, itemId } = useLocalSearchParams();

  return (
    <View className="flex-1 bg-white justify-center items-center p-6">
      <Ionicons name="checkmark-circle-outline" size={100} color="green" />
      <Text className="text-2xl font-bold text-gray-900 mt-4">Item Added!</Text>
      <Text className="text-lg text-gray-600 mt-2 text-center">
        {name} has been successfully added.
      </Text>
      <Text className="text-sm text-gray-400 mt-1">Item ID: {itemId}</Text>

      <TouchableOpacity
        onPress={() => router.push('/Home')}
        className="bg-blue-600 mt-6 px-6 py-3 rounded-xl"
      >
        <Text className="text-white text-lg font-semibold">Go Home</Text>
      </TouchableOpacity>
    </View>
  );
}
