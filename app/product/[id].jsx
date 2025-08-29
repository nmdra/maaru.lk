import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
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

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedItems, setRelatedItems] = useState([]);
  const [swapGuidelinesVisible, setSwapGuidelinesVisible] = useState(false);

  // Tooltip animation
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressInInfo = () =>
    Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }).start();
  const pressOutInfo = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  const openGuidelines = () => setSwapGuidelinesVisible(true);

  // Mock tags (temporary)
  const mockTags = ['Emergency', 'Good Condition', 'Limited Time'];

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
          .map((doc) => ({ id: doc.id, ...doc.data() }))
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
  const handleChat = () => product && router.push(`/chat/${product.ownerId}`);
  const handleFavorite = () => Alert.alert('Favorite', `${product.name} added to favorites.`);

  return (
    <View className="flex-1 bg-white">
      {/* Info Tooltip Top-Right */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <TouchableOpacity
          onPress={openGuidelines}
          onPressIn={pressInInfo}
          onPressOut={pressOutInfo}
          className="bg-gray-300 bg-opacity-80 p-2 rounded-full shadow-md"
        >
          <Ionicons name="information-circle-outline" size={20} color="#333" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView>
        {/* Product Image */}
        <View className="relative">
          <Image
            source={
              product.imageUrl ? { uri: product.imageUrl } : { uri: 'https://placehold.co/400' }
            }
            className="w-full h-80 bg-gray-200"
            resizeMode="cover"
          />
          {/* Floating Tags */}
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
        </View>

        {/* Product Info */}
        <View className="p-4 space-y-2">
          <Text className="text-2xl font-bold text-gray-900">{product.name}</Text>
          {product.swapOnly && (
            <View className="bg-red-500 px-2 py-1 rounded-full w-28">
              <Text className="text-xs font-bold text-white text-center">SWAP ONLY</Text>
            </View>
          )}
          {product.condition && (
            <Text className="text-sm text-gray-500">Condition: {product.condition}</Text>
          )}
          {product.priceCents && !product.swapOnly && (
            <Text className="text-blue-600 font-semibold text-lg">
              {formatPrice(product.priceCents, product.currency)}
            </Text>
          )}
          <Text className="text-gray-700 text-sm">Category: {product.category}</Text>
          <Text className="text-gray-700 text-sm">Stock: {product.stock}</Text>
          <Text className="text-gray-800 mt-2">{product.description}</Text>
          {product.ownerName && (
            <Text className="text-gray-600 text-sm mt-2">Owner: {product.ownerName}</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View className="flex-row justify-between px-4 py-3 space-x-3 items-center">
          <TouchableOpacity
            onPress={handleSwap}
            className="flex-1 bg-green-600 py-3 rounded-lg flex-row items-center justify-center"
          >
            <Ionicons name="swap-horizontal-outline" size={20} color="white" className="mr-2" />
            <Text className="text-white font-semibold">Swap</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleChat}
            className="flex-1 bg-blue-600 py-3 rounded-lg flex-row items-center justify-center"
          >
            <Ionicons name="chatbubble-outline" size={20} color="white" className="mr-2" />
            <Text className="text-white font-semibold">Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleFavorite}
            className="bg-pink-500 p-3 rounded-lg items-center justify-center"
          >
            <Ionicons name="heart-outline" size={20} color="white" />
          </TouchableOpacity>
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
                  priceCents={item.priceCents}
                  currency={item.currency}
                  imageUrl={item.imageUrl}
                  onPress={() => router.push(`/product/${item.id}`)}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Swap Guidelines Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={swapGuidelinesVisible}
        onRequestClose={() => setSwapGuidelinesVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-40 p-4">
          <View className="bg-white rounded-lg p-6 w-full">
            <Text className="text-lg font-bold mb-4">Swap Guidelines</Text>
            <Text className="text-gray-700 mb-2">
              1. Use chat to negotiate swap terms with the owner.
            </Text>
            <Text className="text-gray-700 mb-2">
              2. Make sure your item is in good condition before offering it.
            </Text>
            <Text className="text-gray-700 mb-2">
              3. Confirm meeting place and time before finalizing swap.
            </Text>
            <Text className="text-gray-700 mb-2">4. Be polite and clear in communication.</Text>
            <TouchableOpacity
              onPress={() => setSwapGuidelinesVisible(false)}
              className="mt-4 bg-blue-600 py-3 rounded-lg items-center justify-center"
            >
              <Text className="text-white font-semibold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
