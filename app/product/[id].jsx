import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import ProductCard from '../../components/product/ProductCard';
import { db } from '../../services/firebaseConfig';
import formatPrice from '../../utils/formatPrice';
// 🔗 chat helpers + auth
import { useAuth } from '../../context/AuthContext';
import { ensureConversation } from '../../services/chatService';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth(); // expects user?.uid
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedItems, setRelatedItems] = useState([]);
  const [swapGuidelinesVisible, setSwapGuidelinesVisible] = useState(false);

  const mockTags = product?.tags || [];

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setProduct(data);
          fetchRelatedItems(data.category, data.id);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchRelatedItems = async (category, excludeId) => {
      try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, where('category', '==', category), limit(10));
        const snapshot = await getDocs(q);
        const items = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((item) => item.id !== excludeId)
          .sort(() => Math.random() - 0.5);
        setRelatedItems(items.slice(0, 5));
      } catch (err) {
        console.error('Error fetching related items:', err);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading || !product) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-500">Loading...</Text>
      </View>
    );
  }

  const handleSwap = () => product && router.push(`/swap/${product.id}`);
  const handlePay = () => product && router.push(`/product/payment/${product.id}`);
  const handleChat = async () => {
    if (!product || !user?.uid || !product.ownerId) return;
    try {
      const { id: roomId } = await ensureConversation(user.uid, product.ownerId, product.id);
      router.push(`/chat/${roomId}`);
    } catch (e) {
      console.error('Failed to open chat:', e);
    }
  };
  const handleFavorite = () => Alert.alert('Favorite', `${product.name} added to favorites.`);

  return (
    <View className="flex-1 bg-white">
      {/* Transparent Header */}
      <View className="absolute top-12 left-4 right-4 z-20 flex-row justify-between items-center">
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.push('/');
          }}
          className="bg-black/40 p-2 rounded-full"
        >
          <Ionicons name="arrow-back" size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSwapGuidelinesVisible(true)}
          className="bg-black/40 p-2 rounded-full"
        >
          <Ionicons name="information-circle-outline" size={22} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView className="pt-0">
        {/* Product Image */}
        <View className="relative">
          <Image
            source={
              product.imageUrl ? { uri: product.imageUrl } : { uri: 'https://placehold.co/400' }
            }
            className="w-full h-80 bg-gray-200"
            resizeMode="cover"
          />

          {/* Tags */}
          <View className="absolute bottom-3 left-3 flex-row space-x-2">
            {mockTags.map((tag) => {
              const randomColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
              return (
                <View
                  key={tag}
                  style={{ backgroundColor: randomColor }}
                  className="px-3 py-1 rounded-full shadow-md"
                >
                  <Text className="text-xs font-semibold text-white">{tag}</Text>
                </View>
              );
            })}
          </View>

          {/* Like Button */}
          <TouchableOpacity
            onPress={handleFavorite}
            className="absolute bottom-3 right-3 bg-pink-500 p-3 rounded-full shadow-md"
          >
            <Ionicons name="heart-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Product Info */}
        <View className="p-4 space-y-4">
          <Text className="text-2xl font-bold text-gray-900">{product.name}</Text>

          {/* Info Chips */}
          <View className="flex-row flex-wrap gap-2 mt-2">
            <View className="flex-row items-center bg-gray-100 px-3 py-1 rounded-full shadow-sm">
              <Ionicons name="pricetag-outline" size={16} color="#4B5563" />
              <Text className="ml-1 text-xs font-medium text-gray-700">{product.category}</Text>
            </View>

            <View className="flex-row items-center bg-gray-100 px-3 py-1 rounded-full shadow-sm">
              <Ionicons name="cube-outline" size={16} color="#4B5563" />
              <Text className="ml-1 text-xs font-medium text-gray-700">
                Stock: {product.stock}
              </Text>
            </View>

            {product.condition && (
              <View className="flex-row items-center bg-gray-100 px-3 py-1 rounded-full shadow-sm">
                <Ionicons name="alert-circle-outline" size={16} color="#4B5563" />
                <Text className="ml-1 text-xs font-medium text-gray-700">{product.condition}</Text>
              </View>
            )}

            {product.swapOnly && (
              <View className="bg-red-500 px-3 py-1 rounded-full">
                <Text className="text-xs font-bold text-white">SWAP ONLY</Text>
              </View>
            )}
          </View>

          {/* Price */}
          {!product.swapOnly && (
            <Text className="text-2xl font-semibold text-blue-600">
              {product.price ? formatPrice(product.price, product.currency) : 'Free'}
            </Text>
          )}

          {/* Description */}
          <View className="bg-gray-50 p-4 rounded-xl shadow-sm mt-4">
            <Text className="text-gray-800 leading-6">{product.description}</Text>
          </View>

          {/* Owner Details Card */}
          <View className="bg-white p-4 rounded-xl shadow-md mt-4 border border-gray-200">
            <Text className="text-lg font-semibold mb-2">Owner Details</Text>

            <View className="flex-row items-center mb-2">
              <Ionicons name="person-circle-outline" size={40} color="#4B5563" />
              <View className="ml-3">
                <Text className="text-base font-medium text-gray-900">
                  {product.ownerName || 'John Doe'}
                </Text>
                <Text className="text-sm text-gray-600">User Rating: ⭐⭐⭐⭐☆</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleChat}
              className="mt-2 bg-blue-600 py-2 rounded-lg flex-row items-center justify-center"
            >
              <Ionicons name="chatbubble-outline" size={18} color="white" />
              <Text className="text-white font-semibold ml-2">Chat with Owner</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row justify-between px-4 py-3 space-x-3 items-center">
          {product.swapOnly ? (
            <TouchableOpacity
              onPress={handleSwap}
              className="flex-1 bg-green-600 py-3 rounded-lg flex-row items-center justify-center"
            >
              <Ionicons name="swap-horizontal-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Swap</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                onPress={handleSwap}
                className="flex-1 bg-green-600 py-3 rounded-lg flex-row items-center justify-center"
              >
                <Ionicons name="swap-horizontal-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Swap</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePay}
                className="flex-1 bg-yellow-500 py-3 rounded-lg flex-row items-center justify-center"
              >
                <Ionicons name="card-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Pay</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Related Items */}
        {relatedItems.length > 0 && (
          <View className="px-4 py-3 border-t border-gray-200">
            <Text className="font-semibold text-gray-900 mb-2">Related Items</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {relatedItems.map((item) => (
                <ProductCard
                  key={item.id}
                  name={item.name}
                  price={item.price}
                  currency={item.currency}
                  imageUrl={item.imageUrl}
                  swapOnly={item.swapOnly}
                  condition={item.condition}
                  onPress={() => router.push(`/product/${item.id}`)}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Swap Guidelines Modal */}
      <Modal
        visible={swapGuidelinesVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSwapGuidelinesVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white w-11/12 p-6 rounded-2xl">
            <Text className="text-lg font-bold mb-4">Swap Guidelines</Text>
            <Text className="text-gray-700 mb-6">
              • Ensure your item matches the listed condition.{"\n"}
              • Communicate clearly with the other user.{"\n"}
              • Meet in safe, public places for swaps.{"\n"}
              • Report any suspicious activity.
            </Text>
            <TouchableOpacity
              onPress={() => setSwapGuidelinesVisible(false)}
              className="bg-purple-600 py-3 rounded-xl"
            >
              <Text className="text-white text-center font-semibold">Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}