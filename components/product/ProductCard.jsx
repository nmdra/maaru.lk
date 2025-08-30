import { Image, Text, TouchableOpacity, View } from 'react-native';
import formatPrice from '../../utils/formatPrice';

export default function ProductCard({
  name,
  price,
  currency = 'LKR',
  imageUrl,
  onPress,
  condition,
  swapOnly,
  tags = [],
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 bg-white rounded-xl shadow-md p-3 m-1 border border-gray-200"
    >
      <View className="relative">
        <Image
          source={imageUrl ? { uri: imageUrl } : { uri: 'https://placehold.co/400x400' }}
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

        {tags.length > 0 && (
          <View className="flex-row flex-wrap mt-1">
            {tags.map((tag) => (
              <View key={tag} className="bg-green-100 px-2 py-0.5 mr-1 mb-1 rounded-full">
                <Text className="text-xs text-green-800">{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <Text className={`mt-1 font-medium ${swapOnly ? 'text-gray-600' : 'text-blue-600'}`}>
          {swapOnly ? 'Swap Only' : price ? formatPrice(price, currency) : 'Free'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
