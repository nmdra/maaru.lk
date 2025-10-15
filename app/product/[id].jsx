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
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNavigation from '../../components/BottomNavigation';
import Header from '../../components/Header';
import ProductCard from '../../components/product/ProductCard';
import { db } from '../../services/firebaseConfig';
import formatPrice from '../../utils/formatPrice';
import { useAppI18n } from '../../utils/i18n';

// 🔗 chat helpers + auth
import { useAuth } from '../../context/AuthContext';
import { generateProductDetails } from '../../services/aiService';
import { ensureConversation, roomIdFor } from '../../services/chatService';

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

  // Market analysis states
  const [analyzingMarket, setAnalyzingMarket] = useState(false);
  const [marketAnalysis, setMarketAnalysis] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

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

  // AI Market Analysis Function
  const handleCheckMarket = async () => {
    if (!product || !originalData) return;

    setAnalyzingMarket(true);
    try {
      // Get language name for AI
      const languageNames = {
        en: 'English',
        si: 'Sinhala',
        ta: 'Tamil'
      };
      const targetLanguage = languageNames[currentLanguage] || 'English';
      
      const analysisPrompt = JSON.stringify({
        task: 'analyze_product_market',
        targetLanguage: targetLanguage,
        product: {
          name: originalData.name,
          category: originalData.category,
          price: originalData.price || 0,
          currency: originalData.currency || 'LKR',
          condition: originalData.condition || 'Used',
          description: originalData.description || '',
          tags: originalData.tags || [],
          stock: originalData.stock || 1,
        }
      });

      console.log('🔍 Analyzing market for product...');
      const result = await generateProductDetails(null, analysisPrompt);

      if (!result) {
        Alert.alert('Error', 'AI market analysis returned no data.');
        return;
      }

      let analysis;
      if (typeof result === 'string') {
        try {
          analysis = JSON.parse(result);
        } catch (err) {
          console.error('Failed to parse AI analysis:', err);
          Alert.alert('Error', 'Failed to parse market analysis.');
          return;
        }
      } else {
        analysis = result;
      }

      console.log('✅ Market analysis completed:', analysis);
      setMarketAnalysis(analysis);
      
      // Navigate to dedicated analysis page
      router.push({
        pathname: `/product/analysis/${product.id}`,
        params: {
          analysisData: JSON.stringify({
            ...analysis,
            productInfo: {
              name: product.name,
              price: product.price,
              currency: product.currency || 'LKR',
            }
          })
        }
      });
      
    } catch (err) {
      console.error('Error analyzing market:', err);
      Alert.alert('Error', 'Failed to analyze product market. Please try again.');
    } finally {
      setAnalyzingMarket(false);
    }
  };

  // Get price verdict color and icon
  const getPriceVerdictStyle = (verdict) => {
    switch (verdict) {
      case 'excellent_deal':
        return { color: '#10B981', icon: 'trending-down', text: 'Excellent Deal!' };
      case 'fair_price':
        return { color: '#3B82F6', icon: 'checkmark-circle', text: 'Fair Price' };
      case 'slightly_high':
        return { color: '#F59E0B', icon: 'alert-circle', text: 'Slightly High' };
      case 'overpriced':
        return { color: '#EF4444', icon: 'trending-up', text: 'Overpriced' };
      case 'underpriced':
        return { color: '#8B5CF6', icon: 'warning', text: 'Unusually Low' };
      default:
        return { color: '#6B7280', icon: 'help-circle', text: 'Unknown' };
    }
  };

  // Get market demand style
  const getMarketDemandStyle = (demand) => {
    switch (demand) {
      case 'very_high':
        return { color: '#10B981', text: '🔥 Very High Demand' };
      case 'high':
        return { color: '#3B82F6', text: '📈 High Demand' };
      case 'moderate':
        return { color: '#F59E0B', text: '📊 Moderate Demand' };
      case 'low':
        return { color: '#EF4444', text: '📉 Low Demand' };
      case 'very_low':
        return { color: '#6B7280', text: '💤 Very Low Demand' };
      default:
        return { color: '#6B7280', text: 'Unknown' };
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

  // Check if product is available
  if (product.availability === false) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <Ionicons name="alert-circle-outline" size={80} color="#EF4444" />
        <Text className="text-2xl font-bold text-gray-900 mt-4 text-center">Product Not Available</Text>
        <Text className="text-gray-600 mt-2 text-center">
          This product is no longer available for purchase or swap.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 bg-blue-600 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSwap = () => {
    if (!user) {
      Alert.alert(
        t('common.loginRequired', 'Login Required'),
        t('common.loginToSwap', 'Please login to swap items'),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          { 
            text: t('common.login', 'Login'), 
            onPress: () => router.push('/(auth)/Login')
          }
        ]
      );
      return;
    }
    if (product) router.push(`/swap/${product.id}`);
  };
  
  const handlePay = () => {
    if (!user) {
      Alert.alert(
        t('common.loginRequired', 'Login Required'),
        t('common.loginToBuy', 'Please login to buy items'),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          { 
            text: t('common.login', 'Login'), 
            onPress: () => router.push('/(auth)/Login')
          }
        ]
      );
      return;
    }
    if (product) router.push(`/product/payment/${product.id}`);
  };

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
    <SafeAreaView className="flex-1 bg-white">
      <Header />
      
      <View className="flex-1 bg-white">
        {/* Transparent Header - Back button overlay */}
        <View className="absolute top-4 left-4 right-4 z-20 flex-row justify-between items-center">
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
            
            <View className="flex-row gap-2">
              {/* AI Market Check Button */}
              <TouchableOpacity
                onPress={handleCheckMarket}
                disabled={analyzingMarket}
                className={`flex-row items-center px-3 py-2 rounded-full shadow-md ${
                  analyzingMarket 
                    ? 'bg-gray-300' 
                    : 'bg-blue-600'
                }`}
                style={{ minWidth: 80 }}
              >
                {analyzingMarket ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="analytics-outline" size={18} color="white" />
                    <Text className="text-white text-xs font-semibold ml-1">Check It</Text>
                  </>
                )}
              </TouchableOpacity>

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
          {/* Show buttons based on product status */}
          {product.swapStatus && product.payStatus ? (
            // Both swap and pay enabled
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
          ) : product.swapStatus && !product.payStatus ? (
            // Only swap enabled
            <TouchableOpacity
              onPress={handleSwap}
              className="flex-1 bg-green-600 py-3 rounded-lg flex-row items-center justify-center"
            >
              <Ionicons name="swap-horizontal-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">{t('productDetail.swap')}</Text>
            </TouchableOpacity>
          ) : !product.swapStatus && product.payStatus ? (
            // Only pay enabled
            <TouchableOpacity
              onPress={handlePay}
              className="flex-1 bg-yellow-500 py-3 rounded-lg flex-row items-center justify-center"
            >
              <Ionicons name="card-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">{t('productDetail.buyNow')}</Text>
            </TouchableOpacity>
          ) : (
            // Neither enabled - show unavailable message
            <View className="flex-1 bg-gray-300 py-3 rounded-lg items-center justify-center">
              <Text className="text-gray-700 font-semibold">Product Not Available for Purchase</Text>
            </View>
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

      {/* Market Analysis Modal */}
      <Modal
        visible={showAnalysisModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAnalysisModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-5/6">
            <ScrollView className="p-6">
              {/* Header */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-2xl font-bold text-gray-900">🔍 Market Analysis</Text>
                <TouchableOpacity
                  onPress={() => setShowAnalysisModal(false)}
                  className="bg-gray-200 p-2 rounded-full"
                >
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              {marketAnalysis && (
                <>
                  {/* Price Verdict */}
                  <View className="bg-blue-50 p-4 rounded-xl mb-4">
                    <View className="flex-row items-center mb-2">
                      <Ionicons 
                        name={getPriceVerdictStyle(marketAnalysis.priceVerdict).icon} 
                        size={24} 
                        color={getPriceVerdictStyle(marketAnalysis.priceVerdict).color} 
                      />
                      <Text className="text-lg font-bold ml-2" style={{ color: getPriceVerdictStyle(marketAnalysis.priceVerdict).color }}>
                        {getPriceVerdictStyle(marketAnalysis.priceVerdict).text}
                      </Text>
                    </View>
                    <Text className="text-gray-700">
                      Listed Price: {formatPrice(product.price, product.currency)}
                    </Text>
                  </View>

                  {/* Market Price Range */}
                  <View className="bg-white border border-gray-200 p-4 rounded-xl mb-4">
                    <Text className="text-lg font-semibold mb-3">💰 Market Price Range</Text>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-600">Minimum:</Text>
                      <Text className="font-semibold">{formatPrice(marketAnalysis.marketPrice.min, marketAnalysis.marketPrice.currency)}</Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-600">Average:</Text>
                      <Text className="font-bold text-blue-600">{formatPrice(marketAnalysis.marketPrice.average, marketAnalysis.marketPrice.currency)}</Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600">Maximum:</Text>
                      <Text className="font-semibold">{formatPrice(marketAnalysis.marketPrice.max, marketAnalysis.marketPrice.currency)}</Text>
                    </View>
                  </View>

                  {/* Market Demand */}
                  <View className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl mb-4">
                    <Text 
                      className="text-base font-semibold mb-1" 
                      style={{ color: getMarketDemandStyle(marketAnalysis.marketDemand).color }}
                    >
                      {getMarketDemandStyle(marketAnalysis.marketDemand).text}
                    </Text>
                    <Text className="text-sm text-gray-600">Current market demand for this type of product</Text>
                  </View>

                  {/* Trust Score */}
                  <View className="bg-white border border-gray-200 p-4 rounded-xl mb-4">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-lg font-semibold">🛡️ Trust Score</Text>
                      <Text className="text-2xl font-bold" style={{ 
                        color: marketAnalysis.trustScore >= 70 ? '#10B981' : marketAnalysis.trustScore >= 50 ? '#F59E0B' : '#EF4444' 
                      }}>
                        {marketAnalysis.trustScore}/100
                      </Text>
                    </View>
                    <View className="bg-gray-200 h-2 rounded-full overflow-hidden">
                      <View 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${marketAnalysis.trustScore}%`,
                          backgroundColor: marketAnalysis.trustScore >= 70 ? '#10B981' : marketAnalysis.trustScore >= 50 ? '#F59E0B' : '#EF4444'
                        }} 
                      />
                    </View>
                  </View>

                  {/* Condition Assessment */}
                  {marketAnalysis.condition && (
                    <View className="bg-yellow-50 p-4 rounded-xl mb-4">
                      <Text className="text-lg font-semibold mb-2">🔧 Condition Impact</Text>
                      <Text className="text-gray-700 mb-2">{marketAnalysis.condition.assessment}</Text>
                      {marketAnalysis.condition.affectsPrice && (
                        <Text className="text-sm text-orange-600 font-medium">⚠️ Condition significantly affects price</Text>
                      )}
                    </View>
                  )}

                  {/* Similar Products */}
                  {marketAnalysis.similarProducts && marketAnalysis.similarProducts.length > 0 && (
                    <View className="bg-white border border-gray-200 p-4 rounded-xl mb-4">
                      <Text className="text-lg font-semibold mb-3">📦 Similar Products</Text>
                      {marketAnalysis.similarProducts.map((item, index) => (
                        <View key={index} className="flex-row justify-between items-center py-2 border-b border-gray-100">
                          <View className="flex-1">
                            <Text className="font-medium text-gray-900">{item.name}</Text>
                            <Text className="text-xs text-gray-500">{item.source}</Text>
                          </View>
                          <Text className="font-semibold text-blue-600">
                            {formatPrice(item.estimatedPrice, marketAnalysis.marketPrice.currency)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Key Insights */}
                  {marketAnalysis.insights && marketAnalysis.insights.length > 0 && (
                    <View className="bg-white border border-gray-200 p-4 rounded-xl mb-4">
                      <Text className="text-lg font-semibold mb-3">💡 Key Insights</Text>
                      {marketAnalysis.insights.map((insight, index) => (
                        <View key={index} className="flex-row items-start mb-2">
                          <Text className="text-blue-600 mr-2">•</Text>
                          <Text className="flex-1 text-gray-700">{insight}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Recommendation */}
                  {marketAnalysis.recommendation && (
                    <View className="bg-green-50 p-4 rounded-xl mb-4">
                      <Text className="text-lg font-semibold mb-2">✅ Recommendation</Text>
                      <Text className="text-gray-700 leading-6">{marketAnalysis.recommendation}</Text>
                    </View>
                  )}

                  {/* Disclaimer */}
                  <View className="bg-gray-50 p-3 rounded-lg mb-4">
                    <Text className="text-xs text-gray-600 text-center">
                      ⓘ This analysis is AI-generated based on market patterns and may not reflect real-time prices. Always verify details with the seller.
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      </View>
      
      <BottomNavigation currentRoute={`/product/${id}`} />
    </SafeAreaView>
  );
}
