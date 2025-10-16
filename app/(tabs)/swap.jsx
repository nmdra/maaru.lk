import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../../components/Header';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { generateProductDetails } from '../../services/aiService';
import { ensureConversation, roomIdFor } from '../../services/chatService';
import { db } from '../../services/firebaseConfig';
import formatPrice from '../../utils/formatPrice';
import { useAppI18n } from '../../utils/i18n';
import { saveSwapDraft } from '../../utils/storage';

export default function SwapTab() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useAppI18n();

  const [step, setStep] = useState(1); // 1: Select your products, 2: Select target product
  const [myProducts, setMyProducts] = useState([]);
  const [selectedMyProducts, setSelectedMyProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedTargetProduct, setSelectedTargetProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchDescription, setSearchDescription] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [generatingSwap, setGeneratingSwap] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetchMyProducts();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (step === 2) {
      fetchAllProducts();
    }
  }, [step]);

  // Auto-trigger AI search if description exists when entering step 2
  useEffect(() => {
    if (step === 2 && searchDescription.trim() && allProducts.length > 0 && filteredProducts.length === 0) {
      handleAISearch();
    }
  }, [step, allProducts]);

  const fetchMyProducts = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'products'),
        where('ownerId', '==', user.uid),
        where('availability', '==', true),
        where('swapStatus', '==', true)
      );

      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMyProducts(products);
    } catch (error) {
      console.error('Error fetching my products:', error);
      Alert.alert(t('common.error'), 'Failed to load your products');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'products'),
        where('availability', '==', true),
        where('swapStatus', '==', true)
      );

      const snapshot = await getDocs(q);
      const products = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(p => p.ownerId !== user.uid); // Exclude own products

      setAllProducts(products);
      setFilteredProducts(products);
    } catch (error) {
      console.error('Error fetching all products:', error);
      Alert.alert(t('common.error'), 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectMyProduct = (productId) => {
    setSelectedMyProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleContinue = () => {
    if (selectedMyProducts.length === 0) {
      Alert.alert(t('swap.selectProduct'), 'Please select at least one product to swap');
      return;
    }
    setStep(2);
  };

  const handleAISearch = async () => {
    if (!searchDescription.trim()) {
      setFilteredProducts(allProducts);
      return;
    }

    setLoadingAI(true);
    try {
      console.log('🤖 Starting intelligent AI product analysis...');
      console.log('📝 User description:', searchDescription);

      // Import productService functions
      const { fetchAllProductsWithKeywords, fetchProductsByIds } = require('../../services/productService');

      // Step 1: Fetch ALL products with their keywords
      console.log('📦 Step 1: Fetching all products with keywords...');
      const allProductsWithKeywords = await fetchAllProductsWithKeywords();
      
      if (allProductsWithKeywords.length === 0) {
        Alert.alert(t('swap.noMatches'), 'No products available at the moment');
        setFilteredProducts([]);
        return;
      }

      console.log(`✅ Retrieved ${allProductsWithKeywords.length} products for AI analysis`);

      // Get user's first selected product price for value matching
      const firstSelected = myProducts.find(p => p.id === selectedMyProducts[0]);
      const userProductPrice = firstSelected?.price;

      // Step 2: Send to AI for intelligent analysis
      console.log('🧠 Step 2: Sending to AI for analysis...');
      const aiResult = await generateProductDetails(null, JSON.stringify({
        task: 'analyze_product_suitability',
        description: searchDescription,
        products: allProductsWithKeywords,
        userProductPrice: userProductPrice,
      }));

      if (!aiResult) {
        throw new Error('AI analysis failed');
      }

      // Step 3: Parse AI results
      console.log('📊 Step 3: Parsing AI analysis results...');
      const parsed = JSON.parse(aiResult);
      const matches = parsed.matches || [];

      console.log(`🎯 AI found ${matches.length} suitable products`);
      
      if (matches.length === 0) {
        Alert.alert(
          t('swap.noMatches'),
          `AI couldn't find suitable products matching "${searchDescription}".\n\nTry describing differently or be more specific.`
        );
        setFilteredProducts([]);
        return;
      }

      // Step 4: Fetch full product details for top matches
      console.log('🔍 Step 4: Fetching full product details...');
      const productIds = matches.map(m => m.productId);
      const matchedProducts = await fetchProductsByIds(productIds);

      // Filter out own products
      const filteredMatches = matchedProducts.filter(p => p.userId !== user.uid);

      // Step 5: Sort by AI score and add AI metadata
      console.log('🏆 Step 5: Sorting by AI scores...');
      const productsWithScores = filteredMatches.map(product => {
        const match = matches.find(m => m.productId === product.id);
        return {
          ...product,
          aiScore: match?.score || 0,
          aiReason: match?.reason || 'AI matched this product',
        };
      }).sort((a, b) => b.aiScore - a.aiScore);

      console.log('✅ Top matches:', productsWithScores.slice(0, 3).map(p => ({
        name: p.name,
        score: p.aiScore,
        reason: p.aiReason,
      })));

      setFilteredProducts(productsWithScores);

      // Show transparent AI results
      const topMatches = productsWithScores.slice(0, 3);
      const matchSummary = topMatches.map((p, i) => 
        `${i + 1}. ${p.name} (${p.aiScore}% match)\n   ${p.aiReason}`
      ).join('\n\n');

      Alert.alert(
        '🤖 AI Analysis Complete',
        `Found ${productsWithScores.length} suitable products for "${searchDescription}".\n\nTop matches:\n${matchSummary}`,
        [{ text: 'Great!', style: 'default' }]
      );

    } catch (error) {
      console.error('AI search error:', error);
      Alert.alert(t('common.error'), 'AI analysis failed. Showing all products.');
      setFilteredProducts(allProducts);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSelectTargetProduct = (product) => {
    setSelectedTargetProduct(product);
  };

  const handleCreateSwapRequest = async () => {
    if (!selectedTargetProduct) {
      Alert.alert(t('swap.selectProduct'), 'Please select a product to swap for');
      return;
    }

    setGeneratingSwap(true);
    try {
      // Get selected products details
      const mySelectedProducts = myProducts.filter(p =>
        selectedMyProducts.includes(p.id)
      );

      // Validate mySelectedProducts
      if (mySelectedProducts.length === 0) {
        throw new Error('No products selected');
      }

      // Validate fields
      if (!selectedTargetProduct.name) {
        throw new Error('Target product name is missing');
      }

      const targetCurrency = selectedTargetProduct.currency || 'LKR';
      const targetPrice = selectedTargetProduct.price || 0;

      // Generate AI swap message with validation
      const productsDescription = mySelectedProducts
        .map(p => `${p?.name || 'Unknown'} (${formatPrice(p?.price || 0, p?.currency || 'LKR')})`)
        .join(', ');

      const totalPrice = mySelectedProducts.reduce((sum, p) => sum + (p?.price || 0), 0);
      const firstCurrency = mySelectedProducts[0]?.currency || 'LKR';

      const aiPrompt = JSON.stringify({
        task: 'generate_swap_message',
        userProduct: {
          name: productsDescription || 'Multiple products',
          price: totalPrice,
          currency: firstCurrency,
          count: mySelectedProducts.length,
        },
        targetProduct: {
          name: selectedTargetProduct.name || 'Unknown Product',
          price: targetPrice,
          currency: targetCurrency,
          condition: selectedTargetProduct.condition || 'Used',
        },
        userDescription: searchDescription || 'I am interested in swapping',
      });

      console.log('🔍 AI Prompt for swap:', aiPrompt);

      let aiMessage;
      try {
        aiMessage = await generateProductDetails(null, aiPrompt);
      } catch (aiError) {
        console.error('AI generation error:', aiError);
        // Use fallback message if AI fails
        aiMessage = null;
      }

      let swapMessage = aiMessage || `Hello! I'm interested in swapping my products for your "${selectedTargetProduct?.name || 'product'}". Are you interested?`;

      // Try to clean up AI message
      try {
        const parsed = JSON.parse(swapMessage);
        if (parsed.message) {
          swapMessage = parsed.message;
        }
      } catch (e) {
        // Use as-is if not JSON
        console.log('Using AI message as-is');
      }

      // Create/get conversation
      const buyerUid = user.uid;
      const sellerUid = selectedTargetProduct.ownerId;
      const productId = selectedTargetProduct.id;

      if (!sellerUid || !productId) {
        throw new Error('Invalid product owner or product ID');
      }

      const productCard = {
        id: selectedTargetProduct.id,
        name: selectedTargetProduct.name || 'Unknown Product',
        imageUrl: selectedTargetProduct.imageUrl || 'https://placehold.co/400',
        price: targetPrice,
        currency: targetCurrency,
      };

      await ensureConversation({
        buyerUid,
        sellerUid,
        productId,
        productCard,
      });

      const roomId = roomIdFor(buyerUid, sellerUid, productId);

      // Format message with all product details
      let myProductsText = mySelectedProducts
        .map(
          (p, idx) =>
            `   ${idx + 1}. ${p?.name || 'Unknown'}\n   💰 ${formatPrice(p?.price || 0, p?.currency || 'LKR')}`
        )
        .join('\n\n');

      const messageContent = `🔄 SWAP REQUEST\n\n${swapMessage}\n\n📦 My Products (${mySelectedProducts.length}):\n${myProductsText}\n\n📦 Your Product:\n   ${selectedTargetProduct?.name || 'Unknown'}\n   💰 ${formatPrice(targetPrice, targetCurrency)}`;

      // Save to cache
      await saveSwapDraft({
        roomId,
        message: messageContent,
        selectedProduct: {
          id: mySelectedProducts[0]?.id || 'unknown',
          name: mySelectedProducts.length > 1 ? `${mySelectedProducts.length} products` : (mySelectedProducts[0]?.name || 'Unknown'),
          price: mySelectedProducts.reduce((sum, p) => sum + (p?.price || 0), 0),
          currency: mySelectedProducts[0]?.currency || 'LKR',
          imageUrl: mySelectedProducts[0]?.imageUrl || 'https://placehold.co/400',
        },
        targetProduct: {
          id: selectedTargetProduct.id,
          name: selectedTargetProduct.name || 'Unknown',
          price: targetPrice,
          currency: targetCurrency,
          imageUrl: selectedTargetProduct.imageUrl || 'https://placehold.co/400',
        },
        timestamp: new Date().toISOString(),
      });

      // Redirect to chat
      router.push({ pathname: '/chat/[roomId]', params: { roomId } });
    } catch (error) {
      console.error('Error creating swap request:', error);
      Alert.alert(t('common.error'), 'Failed to create swap request');
    } finally {
      setGeneratingSwap(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.background.primary }}>
        <Header />
        <View className="flex-1 justify-center items-center p-6" style={{ backgroundColor: Colors.background.primary }}>
          <Ionicons name="log-in-outline" size={80} color={Colors.accent} />
          <Text className="text-2xl font-bold mt-4 mb-2" style={{ color: Colors.text.primary }}>
            {t('auth.loginRequired')}
          </Text>
          <Text className="text-center mb-6" style={{ color: Colors.text.secondary }}>
            Please login to use the swap feature
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/Login')}
            className="px-8 py-3 rounded-lg"
            style={{ backgroundColor: Colors.accent }}
          >
            <Text className="text-white font-semibold text-lg">{t('auth.login')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.background.primary }}>
        <Header />
        <View className="flex-1 justify-center items-center" style={{ backgroundColor: Colors.background.primary }}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text className="mt-4" style={{ color: Colors.text.secondary }}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Step 1: Select your products
  if (step === 1) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.background.primary }}>
        <Header />
        
        <View className="flex-1" style={{ backgroundColor: Colors.background.primary }}>
          {/* Header */}
          <View className="px-4 py-3" style={{ backgroundColor: Colors.card.background, borderBottomWidth: 1, borderBottomColor: Colors.border.default }}>
            <Text className="text-xl font-bold" style={{ color: Colors.text.primary }}>
              {t('swap.selectYourItem')}
            </Text>
            <Text className="text-sm mt-1" style={{ color: Colors.text.secondary }}>
              Select one or more products you want to swap
            </Text>
          </View>

        <ScrollView className="flex-1 p-4">
          {myProducts.length === 0 ? (
            <View className="items-center py-12">
              <Ionicons name="cube-outline" size={80} color={Colors.text.tertiary} />
              <Text className="mt-4 mb-6 text-center" style={{ color: Colors.text.secondary }}>
                {t('swap.noProductsDesc')}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/AddProduct')}
                className="px-6 py-3 rounded-lg"
                style={{ backgroundColor: Colors.accent }}
              >
                <Text className="text-white font-semibold">{t('swap.addProduct')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row flex-wrap -mx-2">
              {myProducts.map(product => {
                const isSelected = selectedMyProducts.includes(product.id);
                return (
                  <TouchableOpacity
                    key={product.id}
                    onPress={() => toggleSelectMyProduct(product.id)}
                    className="w-1/2 p-2"
                  >
                    <View
                      className="rounded-xl overflow-hidden"
                      style={{
                        backgroundColor: Colors.card.background,
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? Colors.success : Colors.border.default
                      }}
                    >
                      <Image
                        source={{ uri: product.imageUrl || 'https://placehold.co/300' }}
                        className="w-full h-40"
                        resizeMode="cover"
                      />
                      {isSelected && (
                        <View className="absolute top-2 right-2 rounded-full p-1" style={{ backgroundColor: Colors.success }}>
                          <Ionicons name="checkmark" size={20} color="white" />
                        </View>
                      )}
                      <View className="p-3">
                        <Text className="text-sm font-semibold" style={{ color: Colors.text.primary }} numberOfLines={2}>
                            {product.name}
                          </Text>
                          <Text className="text-xs font-semibold mt-1 text-blue-600">
                              {formatPrice(product.price || 0, product.currency || 'LKR')}
                            </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Continue Button */}
        {myProducts.length > 0 && (
          <View className="p-4" style={{ backgroundColor: Colors.card.background, borderTopWidth: 1, borderTopColor: Colors.border.default }}>
            <TouchableOpacity
              onPress={handleContinue}
              disabled={selectedMyProducts.length === 0}
              className="py-4 rounded-xl"
              style={{
                backgroundColor: selectedMyProducts.length === 0 ? Colors.border.default : Colors.accent
              }}
            >
              <Text className="text-white text-center font-bold text-lg">
                Continue ({selectedMyProducts.length} selected)
              </Text>
            </TouchableOpacity>
          </View>
        )}
        </View>
      </SafeAreaView>
    );
  }

  // Step 2: Select target product
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.background.primary }}>
      <Header />
      
      <View className="flex-1" style={{ backgroundColor: Colors.background.primary }}>
      {/* Header */}
      <View className="px-4 py-3" style={{ backgroundColor: Colors.card.background, borderBottomWidth: 1, borderBottomColor: Colors.border.default }}>
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => setStep(1)} className="p-2">
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text className="text-lg font-bold" style={{ color: Colors.text.primary }}>Select Product to Get</Text>
          <View className="w-10" />
        </View>
      </View>

      {/* AI Search Section */}
      <View className="p-4" style={{ backgroundColor: Colors.card.background, borderBottomWidth: 1, borderBottomColor: Colors.border.default }}>
        <Text className="text-sm font-semibold mb-2" style={{ color: Colors.text.primary }}>
          🤖 {t('swap.aiDescription')}
        </Text>
        <Text className="text-xs mb-2" style={{ color: Colors.text.secondary }}>
          AI will analyze your description and find matching products
        </Text>
        <TextInput
          value={searchDescription}
          onChangeText={setSearchDescription}
          placeholder={t('swap.aiDescriptionPlaceholder')}
          placeholderTextColor={Colors.text.tertiary}
          className="rounded-lg p-3 text-sm mb-3"
          style={{
            backgroundColor: Colors.background.secondary,
            borderWidth: 1,
            borderColor: Colors.border.default,
            color: Colors.text.primary
          }}
          multiline
          numberOfLines={2}
        />
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={handleAISearch}
            disabled={loadingAI || !searchDescription.trim()}
            className="flex-1 py-3 rounded-lg flex-row items-center justify-center"
            style={{
              backgroundColor: loadingAI || !searchDescription.trim() ? Colors.border.default : Colors.accent
            }}
          >
            {loadingAI ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-semibold ml-2 text-sm">Searching...</Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="white" />
                <Text className="text-white font-semibold ml-2 text-sm">
                  AI {t('swap.findMatches')}
                </Text>
              </>
            )}
          </TouchableOpacity>
          {searchDescription.trim() && (
            <TouchableOpacity
              onPress={() => {
                setSearchDescription('');
                setFilteredProducts(allProducts);
              }}
              className="px-4 py-3 rounded-lg"
              style={{ backgroundColor: Colors.background.secondary }}
            >
              <Ionicons name="close" size={18} color={Colors.text.primary} />
            </TouchableOpacity>
          )}
        </View>
        {filteredProducts.length > 0 && filteredProducts.length < allProducts.length && (
          <View className="mt-3 rounded-lg p-2" style={{ backgroundColor: Colors.info + '20' }}>
            <Text className="text-xs text-center" style={{ color: Colors.info }}>
              ✨ Showing {filteredProducts.length} AI-matched products
            </Text>
          </View>
        )}
      </View>

      <ScrollView className="flex-1 p-4">
        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text className="mt-4" style={{ color: Colors.text.secondary }}>Loading products...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons name="search-outline" size={80} color={Colors.text.tertiary} />
            <Text className="mt-4 text-center mb-2" style={{ color: Colors.text.secondary }}>
              {searchDescription.trim() ? t('swap.noMatchesDesc') : 'No products available'}
            </Text>
            {searchDescription.trim() && (
              <TouchableOpacity
                onPress={() => {
                  setSearchDescription('');
                  setFilteredProducts(allProducts);
                }}
                className="mt-4 px-6 py-2 rounded-lg"
                style={{ backgroundColor: Colors.accent }}
              >
                <Text className="text-white font-semibold">Show All Products</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="flex-row flex-wrap -mx-2">
            {filteredProducts.map(product => {
              const isSelected = selectedTargetProduct?.id === product.id;
              const firstSelected = myProducts.find(p => p.id === selectedMyProducts[0]);
              const priceDiff = firstSelected?.price
                ? Math.abs(product.price - firstSelected.price)
                : 0;
              const isClosePrice = firstSelected?.price
                ? priceDiff <= firstSelected.price * 0.2
                : false;
              const hasAIScore = product.aiScore !== undefined;

              return (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => handleSelectTargetProduct(product)}
                  className="w-1/2 p-2"
                >
                  <View
                    className="rounded-xl overflow-hidden"
                    style={{
                      backgroundColor: Colors.card.background,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? Colors.accent : Colors.border.default
                    }}
                  >
                    <Image
                      source={{ uri: product.imageUrl || 'https://placehold.co/300' }}
                      className="w-full h-40"
                      resizeMode="cover"
                    />
                    {hasAIScore && (
                      <View className="absolute top-2 left-2 px-2 py-1 rounded-full" style={{ backgroundColor: Colors.info }}>
                        <Text className="text-white text-xs font-bold">
                          🤖 {Math.round(product.aiScore)}%
                        </Text>
                      </View>
                    )}
                    {isClosePrice && (
                      <View className="absolute top-2 right-2 rounded-full px-2 py-1" style={{ backgroundColor: Colors.success }}>
                        <Text className="text-white text-xs font-bold">
                          {t('swap.match')}
                        </Text>
                      </View>
                    )}
                    {isSelected && (
                      <View className="absolute bottom-2 right-2 rounded-full p-1" style={{ backgroundColor: Colors.accent }}>
                        <Ionicons name="checkmark" size={20} color="white" />
                      </View>
                    )}
                    <View className="p-3">
                      <Text className="text-sm font-semibold" style={{ color: Colors.text.primary }} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text className="text-xs mt-1" style={{ color: Colors.text.secondary }}>
                        {product.category}
                      </Text>
                      <Text className="text-xs font-semibold mt-1 text-blue-600">
                          {formatPrice(product.price || 0, product.currency || 'LKR')}
                        </Text>
                      {hasAIScore && product.aiReason && (
                        <Text className="text-xs mt-1 italic" style={{ color: Colors.info }} numberOfLines={2}>
                          💡 {product.aiReason}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Create Swap Request Button */}
      {selectedTargetProduct && (
        <View className="p-4" style={{ backgroundColor: Colors.card.background, borderTopWidth: 1, borderTopColor: Colors.border.default }}>
          <TouchableOpacity
            onPress={handleCreateSwapRequest}
            disabled={generatingSwap}
            className="py-4 rounded-xl flex-row items-center justify-center"
            style={{
              backgroundColor: generatingSwap ? Colors.border.default : Colors.success
            }}
          >
            {generatingSwap ? (
              <>
                <ActivityIndicator color="white" />
                <Text className="text-white font-semibold ml-2">
                  {t('swap.generatingMessage')}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="swap-horizontal" size={24} color="white" />
                <Text className="text-white text-lg font-bold ml-2">
                  {t('swap.sendRequest')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
      </View>
    </SafeAreaView>
  );
}
