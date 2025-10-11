// app/product/[id].jsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useAppI18n } from '../../utils/i18n';

// 🔗 chat helpers + auth
import { useAuth } from '../../context/AuthContext';
import { ensureConversation, roomIdFor } from '../../services/chatService';
import { generateProductDetails } from '../../services/aiService';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth(); // expects user?.uid
  const { t, currentLanguage } = useAppI18n();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedItems, setRelatedItems] = useState([]);
  const [swapGuidelinesVisible, setSwapGuidelinesVisible] = useState(false);
  const [ownerData, setOwnerData] = useState(null);
  const [loadingOwner, setLoadingOwner] = useState(false);
  
  // Translation states
  const [translating, setTranslating] = useState(false);
  const [translatedData, setTranslatedData] = useState(null);
  const [originalData, setOriginalData] = useState(null);

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
          setOriginalData(data); // Store original data for translation toggle
          fetchRelatedItems(data.category, data.id);
          
          // Fetch owner data if ownerId exists
          if (data.ownerId) {
            fetchOwnerData(data.ownerId);
          }
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchOwnerData = async (ownerId) => {
      setLoadingOwner(true);
      try {
        const ownerRef = doc(db, 'users', ownerId);
        const ownerSnap = await getDoc(ownerRef);
        if (ownerSnap.exists()) {
          const ownerInfo = ownerSnap.data();
          setOwnerData({
            name: ownerInfo.displayName || `${ownerInfo.firstName || ''} ${ownerInfo.lastName || ''}`.trim() || 'Unknown User',
            email: ownerInfo.email || '',
            phone: ownerInfo.phone || '',
            rating: ownerInfo.rating || 0,
          });
          console.log('Owner data fetched:', ownerInfo);
        } else {
          console.warn('Owner not found in database');
          setOwnerData({ name: 'Unknown User', email: '', phone: '', rating: 0 });
        }
      } catch (err) {
        console.error('Error fetching owner data:', err);
        setOwnerData({ name: 'Unknown User', email: '', phone: '', rating: 0 });
      } finally {
        setLoadingOwner(false);
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

  // AI Translation Function
  const handleTranslateProduct = async () => {
    if (!product || !originalData) return;

    // If already translated, toggle back to original
    if (translatedData) {
      setProduct(originalData);
      setTranslatedData(null);
      return;
    }

    setTranslating(true);
    try {
      const languageNames = {
        en: 'English',
        si: 'Sinhala',
        ta: 'Tamil'
      };
      
      const targetLanguage = languageNames[currentLanguage] || 'English';
      
      // Create a translation prompt for the AI
      const translationPrompt = JSON.stringify({
        task: 'translate',
        targetLanguage: targetLanguage,
        content: {
          name: originalData.name,
          description: originalData.description,
          condition: originalData.condition || '',
          tags: originalData.tags || []
        }
      });

      // Use the AI service to translate
      // We'll pass the translation prompt as if it's generating product details
      const result = await generateProductDetails(null, translationPrompt);

      if (!result) {
        Alert.alert(t('common.error'), 'AI translation returned no data.');
        return;
      }

      let translatedContent;
      if (typeof result === 'string') {
        try {
          translatedContent = JSON.parse(result);
        } catch (err) {
          console.error('Failed to parse AI translation:', err);
          Alert.alert(t('common.error'), 'Failed to parse translation.');
          return;
        }
      } else {
        translatedContent = result;
      }

      // Create translated product data
      const translated = {
        ...originalData,
        name: translatedContent.name || originalData.name,
        description: translatedContent.description || originalData.description,
        condition: translatedContent.condition || originalData.condition,
        tags: translatedContent.tags || originalData.tags
      };

      setTranslatedData(translated);
      setProduct(translated);
      
    } catch (err) {
      console.error('Error translating product:', err);
      Alert.alert(t('common.error'), 'Failed to translate product details.');
    } finally {
      setTranslating(false);
    }
  };

  const productCard = useMemo(() => {
    if (!product) return null;
    return {
      title: product.name || product.title || 'Item',
      price: product.price ?? null,
      thumbnailUrl: product.imageUrl || null,
    };
  }, [product]);

  if (loading || !product) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-500 mt-4">{t('productDetail.loading')}</Text>
      </View>
    );
  }

  const handleSwap = () => product && router.push(`/swap/${product.id}`);
  const handlePay = () => product && router.push(`/product/payment/${product.id}`);

  const handleChat = async () => {
    if (!product) return;

    if (!user?.uid) {
      Alert.alert('Please sign in', 'You need to login to chat with the owner.');
      router.push('/(auth)/Login');
      return;
    }
    if (!product.ownerId) {
      Alert.alert('Unavailable', 'Owner not found for this product.');
      return;
    }
    if (product.ownerId === user.uid) {
      Alert.alert('Heads up', 'You are the owner of this listing.');
      return;
    }

    try {
      const buyerUid = user.uid;
      const sellerUid = product.ownerId;
      const productId = product.id;

      // Ensure the canonical conversation exists (buyer × seller × product)
      await ensureConversation({ buyerUid, sellerUid, productId, productCard });

      // Compute the stable room id and navigate
      const roomId = roomIdFor(buyerUid, sellerUid, productId);
      router.push({ pathname: '/chat/[roomId]', params: { roomId } });
    } catch (e) {
      console.error('Failed to open chat:', e);
      Alert.alert('Could not open chat', e?.message || 'Unexpected error');
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
            source={product.imageUrl ? { uri: product.imageUrl } : { uri: 'https://placehold.co/400' }}
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
          {/* Product Title with Translation Button */}
          <View className="flex-row items-start justify-between">
            <Text className="text-2xl font-bold text-gray-900 flex-1 pr-2">{product.name}</Text>
            
            {/* AI Translation Button */}
            <TouchableOpacity
              onPress={handleTranslateProduct}
              disabled={translating}
              className={`flex-row items-center px-3 py-2 rounded-full shadow-md ${
                translating 
                  ? 'bg-gray-300' 
                  : translatedData 
                  ? 'bg-green-500' 
                  : 'bg-purple-500'
              }`}
              style={{ minWidth: 70 }}
            >
              {translating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons 
                    name={translatedData ? "language" : "language-outline"} 
                    size={18} 
                    color="white" 
                  />
                  <Text className="text-white text-xs font-semibold ml-1">
                    {translatedData ? 'Original' : 'Translate'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Translation indicator */}
          {translatedData && (
            <View className="flex-row items-center bg-green-50 px-3 py-2 rounded-lg">
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text className="text-green-700 text-xs ml-2">
                {t('productDetail.translatedTo')} {currentLanguage === 'si' ? 'සිංහල' : currentLanguage === 'ta' ? 'தமிழ்' : 'English'} • {t('productDetail.tapToSeeOriginal')}
              </Text>
            </View>
          )}

          {/* Info Chips */}
          <View className="flex-row flex-wrap gap-2 mt-2">
            <View className="flex-row items-center bg-gray-100 px-3 py-1 rounded-full shadow-sm">
              <Ionicons name="pricetag-outline" size={16} color="#4B5563" />
              <Text className="ml-1 text-xs font-medium text-gray-700">{product.category}</Text>
            </View>

            <View className="flex-row items-center bg-gray-100 px-3 py-1 rounded-full shadow-sm">
              <Ionicons name="cube-outline" size={16} color="#4B5563" />
              <Text className="ml-1 text-xs font-medium text-gray-700">
                {t('productDetail.stock')}: {product.stock}
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
                <Text className="text-xs font-bold text-white">{t('productDetail.swapOnly').toUpperCase()}</Text>
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
            <Text className="text-lg font-semibold mb-2">{t('productDetail.ownerDetails')}</Text>

            {loadingOwner ? (
              <View className="flex-row items-center mb-2">
                <Ionicons name="person-circle-outline" size={40} color="#4B5563" />
                <View className="ml-3">
                  <Text className="text-sm text-gray-500">{t('productDetail.loadingOwnerInfo')}</Text>
                </View>
              </View>
            ) : (
              <View className="flex-row items-center mb-2">
                <Ionicons name="person-circle-outline" size={40} color="#4B5563" />
                <View className="ml-3">
                  <Text className="text-base font-medium text-gray-900">
                    {ownerData?.name || t('productDetail.unknownUser')}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {ownerData?.rating > 0 
                      ? `${t('productDetail.userRating')}: ${'⭐'.repeat(Math.round(ownerData.rating))}${'☆'.repeat(5 - Math.round(ownerData.rating))}`
                      : t('productDetail.noRatings')}
                  </Text>
                  {ownerData?.email && (
                    <Text className="text-xs text-gray-500 mt-1">
                      {ownerData.email}
                    </Text>
                  )}
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={handleChat}
              className="mt-2 bg-blue-600 py-2 rounded-lg flex-row items-center justify-center"
            >
              <Ionicons name="chatbubble-outline" size={18} color="white" />
              <Text className="text-white font-semibold ml-2">{t('productDetail.chatWithOwner')}</Text>
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
              <Text className="text-white font-semibold ml-2">{t('productDetail.swap')}</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                onPress={handleSwap}
                className="flex-1 bg-green-600 py-3 rounded-lg flex-row items-center justify-center"
              >
                <Ionicons name="swap-horizontal-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">{t('productDetail.swap')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePay}
                className="flex-1 bg-yellow-500 py-3 rounded-lg flex-row items-center justify-center"
              >
                <Ionicons name="card-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">{t('productDetail.buyNow')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Related Items */}
        {relatedItems.length > 0 && (
          <View className="px-4 py-3 border-t border-gray-200">
            <Text className="font-semibold text-gray-900 mb-2">{t('productDetail.relatedItems')}</Text>
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
            <Text className="text-lg font-bold mb-4">{t('productDetail.swapGuidelines')}</Text>
            <Text className="text-gray-700 mb-6">
              {t('productDetail.guidelinesContent')}
            </Text>
            <TouchableOpacity
              onPress={() => setSwapGuidelinesVisible(false)}
              className="bg-purple-600 py-3 rounded-xl"
            >
              <Text className="text-white text-center font-semibold">{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
