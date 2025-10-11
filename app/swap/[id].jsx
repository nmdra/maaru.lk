import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { 
  ActivityIndicator,
  Alert, 
  Image,
  ScrollView, 
  Text, 
  TextInput,
  TouchableOpacity, 
  View 
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { generateProductDetails } from '../../services/aiService';
import { ensureConversation, roomIdFor } from '../../services/chatService';
import { db } from '../../services/firebaseConfig';
import { searchProductsByKeywords } from '../../services/searchKeywordService';
import formatPrice from '../../utils/formatPrice';
import { useAppI18n } from '../../utils/i18n';
import { saveSwapDraft } from '../../utils/storage';

export default function SwapScreen() {
  const { id: targetProductId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useAppI18n();
  
  const [targetProduct, setTargetProduct] = useState(null);
  const [userProducts, setUserProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [swapDescription, setSwapDescription] = useState('');
  const [aiMatchedProducts, setAiMatchedProducts] = useState([]);
  const [loadingAiMatch, setLoadingAiMatch] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState(false);

  useEffect(() => {
    fetchData();
  }, [targetProductId, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch target product
      const targetRef = doc(db, 'products', targetProductId);
      const targetSnap = await getDoc(targetRef);
      
      if (targetSnap.exists()) {
        const targetData = { id: targetSnap.id, ...targetSnap.data() };
        setTargetProduct(targetData);
        
        // Fetch user's own products
        if (user?.uid) {
          await fetchUserProducts();
        }
      } else {
        Alert.alert(t('common.error'), 'Product not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert(t('common.error'), 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProducts = async () => {
    try {
      const productsRef = collection(db, 'products');
      const q = query(
        productsRef,
        where('ownerId', '==', user.uid),
        where('availability', '==', true),
        where('swapStatus', '==', true)
      );
      
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUserProducts(products);
    } catch (error) {
      console.error('Error fetching user products:', error);
    }
  };

  const handleAiMatchProducts = async () => {
    if (!swapDescription.trim()) {
      Alert.alert(
        t('common.error'),
        t('swap.aiDescriptionPlaceholder')
      );
      return;
    }

    setLoadingAiMatch(true);
    setShowSuggestions(true);
    
    try {
      // Use AI to extract keywords from description
      const aiPrompt = JSON.stringify({
        task: 'extract_swap_keywords',
        description: swapDescription,
        targetProduct: {
          name: targetProduct.name,
          category: targetProduct.category,
          price: targetProduct.price
        }
      });

      const aiResult = await generateProductDetails(null, aiPrompt);
      
      let searchTerms = swapDescription.toLowerCase();
      
      // Try to parse AI result for better keywords
      if (aiResult) {
        try {
          const parsed = JSON.parse(aiResult);
          if (parsed.keywords) {
            searchTerms = parsed.keywords.join(' ');
          }
        } catch (e) {
          console.log('Using original description for search');
        }
      }

      // Search products using keywords
      const productIds = await searchProductsByKeywords(searchTerms);
      
      if (productIds.length === 0) {
        setAiMatchedProducts([]);
        Alert.alert(
          t('swap.noMatches'),
          t('swap.noMatchesDesc')
        );
        return;
      }

      // Fetch matched products
      const matchedProducts = [];
      for (let i = 0; i < Math.min(productIds.length, 30); i += 10) {
        const batch = productIds.slice(i, i + 10);
        const q = query(
          collection(db, 'products'),
          where('__name__', 'in', batch),
          where('availability', '==', true),
          where('swapStatus', '==', true)
        );
        
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(doc => {
          const product = { id: doc.id, ...doc.data() };
          // Exclude own products and target product
          if (product.ownerId !== user.uid && product.id !== targetProductId) {
            matchedProducts.push(product);
          }
        });
      }

      // Sort by price similarity to target product
      const sortedProducts = matchedProducts.sort((a, b) => {
        const aDiff = Math.abs(a.price - targetProduct.price);
        const bDiff = Math.abs(b.price - targetProduct.price);
        return aDiff - bDiff;
      });

      setAiMatchedProducts(sortedProducts);
      
      if (sortedProducts.length === 0) {
        Alert.alert(
          t('swap.noMatches'),
          t('swap.noMatchesDesc')
        );
      }
    } catch (error) {
      console.error('Error matching products:', error);
      Alert.alert(t('common.error'), 'Failed to match products');
    } finally {
      setLoadingAiMatch(false);
    }
  };

  const handleSendSwapRequest = async () => {
    if (!selectedProduct) {
      Alert.alert(
        t('swap.selectProduct'),
        t('swap.selectProductFirst')
      );
      return;
    }

    if (!targetProduct.ownerId) {
      Alert.alert(t('common.error'), 'Product owner not found');
      return;
    }

    setGeneratingMessage(true);
    
    try {
      // Validate required fields
      if (!selectedProduct.name || !targetProduct.name) {
        throw new Error('Product name is missing');
      }

      // Ensure currency and price have default values
      const selectedCurrency = selectedProduct.currency || 'LKR';
      const targetCurrency = targetProduct.currency || 'LKR';
      const selectedPrice = selectedProduct.price || 0;
      const targetPrice = targetProduct.price || 0;

      // Generate AI swap message
      const aiPrompt = JSON.stringify({
        task: 'generate_swap_message',
        userProduct: {
          name: selectedProduct.name,
          price: selectedPrice,
          currency: selectedCurrency,
          condition: selectedProduct.condition || 'Used'
        },
        targetProduct: {
          name: targetProduct.name,
          price: targetPrice,
          currency: targetCurrency,
          condition: targetProduct.condition || 'Used'
        },
        userDescription: swapDescription || 'I am interested in swapping'
      });

      const aiMessage = await generateProductDetails(null, aiPrompt);
      
      let swapMessage = aiMessage || 
        `Hello! I'm interested in swapping my "${selectedProduct.name}" (${formatPrice(selectedPrice, selectedCurrency)}) for your "${targetProduct.name}" (${formatPrice(targetPrice, targetCurrency)}). Are you interested?`;

      // Try to clean up AI message
      try {
        const parsed = JSON.parse(swapMessage);
        if (parsed.message) {
          swapMessage = parsed.message;
        }
      } catch (e) {
        // Use as-is
      }

      // Create/get conversation
      const buyerUid = user.uid;
      const sellerUid = targetProduct.ownerId;
      const productId = targetProduct.id;

      const productCard = {
        id: targetProduct.id,
        name: targetProduct.name || 'Unknown Product',
        imageUrl: targetProduct.imageUrl || 'https://placehold.co/400',
        price: targetPrice,
        currency: targetCurrency
      };

      await ensureConversation({ 
        buyerUid, 
        sellerUid, 
        productId, 
        productCard 
      });

      const roomId = roomIdFor(buyerUid, sellerUid, productId);

      // Format message with product details
      const messageContent = `🔄 SWAP REQUEST\n\n${swapMessage}\n\n📦 My Product: ${selectedProduct.name}\n💰 Value: ${formatPrice(selectedPrice, selectedCurrency)}\n\n📦 Your Product: ${targetProduct.name}\n💰 Value: ${formatPrice(targetPrice, targetCurrency)}`;

      // Save to cache instead of sending
      await saveSwapDraft({
        roomId,
        message: messageContent,
        selectedProduct: {
          id: selectedProduct.id,
          name: selectedProduct.name,
          price: selectedPrice,
          currency: selectedCurrency,
          imageUrl: selectedProduct.imageUrl || 'https://placehold.co/400'
        },
        targetProduct: {
          id: targetProduct.id,
          name: targetProduct.name,
          price: targetPrice,
          currency: targetCurrency,
          imageUrl: targetProduct.imageUrl || 'https://placehold.co/400'
        },
        timestamp: new Date().toISOString()
      });

      // Redirect to chat
      router.push({ pathname: '/chat/[roomId]', params: { roomId } });

    } catch (error) {
      console.error('Error creating swap request:', error);
      Alert.alert(t('common.error'), 'Failed to create swap request');
    } finally {
      setGeneratingMessage(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-500 mt-4">{t('common.loading')}</Text>
      </View>
    );
  }

  if (!targetProduct) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-6">
        <Ionicons name="alert-circle-outline" size={80} color="#EF4444" />
        <Text className="text-2xl font-bold text-gray-900 mt-4">Product Not Found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 bg-blue-600 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900">{t('swap.title')}</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Target Product */}
        <View className="bg-white p-4 mb-2">
          <Text className="text-sm text-gray-500 mb-2">{t('swap.targetProduct')}:</Text>
          <View className="flex-row bg-gray-50 rounded-xl p-3">
            <Image
              source={{ uri: targetProduct.imageUrl || 'https://placehold.co/100' }}
              className="w-20 h-20 rounded-lg"
            />
            <View className="ml-3 flex-1">
              <Text className="text-base font-semibold text-gray-900">
                {targetProduct.name}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                {targetProduct.category}
              </Text>
              <Text className="text-base font-bold text-blue-600 mt-1">
                {formatPrice(targetProduct.price, targetProduct.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* User's Products Section */}
        <View className="bg-white p-4 mb-2">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-semibold text-gray-900">
              {t('swap.selectYourItem')}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/AddProduct')}
              className="bg-blue-600 px-3 py-1.5 rounded-lg"
            >
              <Text className="text-white text-xs font-semibold">+ {t('swap.addProduct')}</Text>
            </TouchableOpacity>
          </View>

          {userProducts.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="cube-outline" size={60} color="#9CA3AF" />
              <Text className="text-gray-500 mt-3 mb-4 text-center">
                {t('swap.noProductsDesc')}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/AddProduct')}
                className="bg-blue-600 px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold">{t('swap.addProduct')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2">
              {userProducts.map((product) => {
                const isSelected = selectedProduct?.id === product.id;
                return (
                  <TouchableOpacity
                    key={product.id}
                    onPress={() => setSelectedProduct(product)}
                    className={`mx-2 ${isSelected ? 'opacity-100' : 'opacity-70'}`}
                  >
                    <View className={`w-36 bg-white rounded-xl shadow-sm ${isSelected ? 'border-2 border-green-500' : 'border border-gray-200'}`}>
                      <Image
                        source={{ uri: product.imageUrl || 'https://placehold.co/150' }}
                        className="w-full h-32 rounded-t-xl"
                        resizeMode="cover"
                      />
                      <View className="p-2">
                        <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
                          {product.name}
                        </Text>
                        <Text className="text-xs text-blue-600 font-semibold mt-1">
                          {formatPrice(product.price, product.currency)}
                        </Text>
                      </View>
                      {isSelected && (
                        <View className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                          <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* AI Description Section */}
        <View className="bg-white p-4 mb-2">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            🤖 {t('swap.aiDescription')}
          </Text>
          <Text className="text-xs text-gray-500 mb-3">
            {t('swap.aiSuggestions')}
          </Text>
          <TextInput
            value={swapDescription}
            onChangeText={setSwapDescription}
            placeholder={t('swap.aiDescriptionPlaceholder')}
            multiline
            numberOfLines={4}
            className="bg-gray-50 rounded-lg p-3 text-sm text-gray-900 border border-gray-200"
            textAlignVertical="top"
          />
          <TouchableOpacity
            onPress={handleAiMatchProducts}
            disabled={loadingAiMatch || !swapDescription.trim()}
            className={`mt-3 py-3 rounded-lg flex-row items-center justify-center ${
              loadingAiMatch || !swapDescription.trim() ? 'bg-gray-300' : 'bg-purple-600'
            }`}
          >
            {loadingAiMatch ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="white" />
                <Text className="text-white font-semibold ml-2">{t('swap.findMatches')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* AI Matched Products */}
        {showSuggestions && aiMatchedProducts.length > 0 && (
          <View className="bg-white p-4 mb-2">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              ✨ {t('swap.aiSuggestions')} ({aiMatchedProducts.length})
            </Text>
            <Text className="text-xs text-gray-500 mb-3">
              {t('swap.selectProductDesc')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2">
              {aiMatchedProducts.map((product) => {
                const priceDiff = Math.abs(product.price - targetProduct.price);
                const isClosePrice = priceDiff <= targetProduct.price * 0.2; // Within 20%
                
                return (
                  <TouchableOpacity
                    key={product.id}
                    onPress={() => router.push(`/product/${product.id}`)}
                    className="mx-2"
                  >
                    <View className="w-40 bg-white rounded-xl shadow-sm border border-gray-200">
                      <Image
                        source={{ uri: product.imageUrl || 'https://placehold.co/150' }}
                        className="w-full h-36 rounded-t-xl"
                        resizeMode="cover"
                      />
                      {isClosePrice && (
                        <View className="absolute top-2 right-2 bg-green-500 rounded-full px-2 py-1">
                          <Text className="text-white text-xs font-bold">{t('swap.match')}</Text>
                        </View>
                      )}
                      <View className="p-3">
                        <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
                          {product.name}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-1">
                          {product.category}
                        </Text>
                        <Text className="text-sm text-blue-600 font-semibold mt-1">
                          {formatPrice(product.price, product.currency)}
                        </Text>
                        {product.tags && product.tags.length > 0 && (
                          <View className="flex-row flex-wrap mt-1">
                            {product.tags.slice(0, 2).map((tag, idx) => (
                              <View key={idx} className="bg-gray-100 rounded px-1.5 py-0.5 mr-1 mb-1">
                                <Text className="text-xs text-gray-600">{tag}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Send Swap Request Button */}
        {selectedProduct && (
          <View className="bg-white p-4 mb-4">
            <TouchableOpacity
              onPress={handleSendSwapRequest}
              disabled={generatingMessage}
              className={`py-4 rounded-xl flex-row items-center justify-center ${
                generatingMessage ? 'bg-gray-300' : 'bg-green-600'
              }`}
            >
              {generatingMessage ? (
                <>
                  <ActivityIndicator color="white" />
                  <Text className="text-white font-semibold ml-2">{t('swap.generatingMessage')}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="swap-horizontal" size={24} color="white" />
                  <Text className="text-white text-lg font-bold ml-2">{t('swap.sendRequest')}</Text>
                </>
              )}
            </TouchableOpacity>
            
            <View className="mt-3 bg-blue-50 rounded-lg p-3">
              <Text className="text-xs text-blue-800">
                💬 {t('swap.requestSentDesc')}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
