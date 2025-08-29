import { Image, Text, TouchableOpacity, View } from 'react-native';
import formatPrice from '../../utils/formatPrice';

export default function ProductCard({
  name,
  priceCents,
  currency,
  imageUrl,
  onPress,
  condition, // e.g., "Used", "Like New"
  swapOnly, // boolean
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 bg-white rounded-xl shadow-sm p-3 m-1 border border-gray-200"
    >
      <View className="relative">
        <Image
          source={imageUrl ? { uri: imageUrl } : { uri: 'https://placehold.co/400' }}
          className="w-full h-36 rounded-lg bg-gray-100"
          resizeMode="cover"
        />
        {swapOnly && (
          <View className="absolute top-2 left-2 bg-yellow-400 px-2 py-1 rounded-full">
            <Text className="text-xs font-bold text-white">SWAP</Text>
          </View>
        )}
      </View>

      <View className="mt-2">
        <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
          {name}
        </Text>

        {condition && <Text className="text-xs text-gray-500 mt-0.5">{condition}</Text>}

        <Text className={`mt-1 font-medium ${swapOnly ? 'text-gray-600' : 'text-blue-600'}`}>
          {swapOnly ? 'Swap Only' : priceCents ? formatPrice(priceCents, currency) : 'Free'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
