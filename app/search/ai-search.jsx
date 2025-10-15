import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from '../../components/BottomNavigation';
import Header from '../../components/Header';
import { generateProductDetails } from '../../services/aiService';
import formatPrice from '../../utils/formatPrice';
import { useAppI18n } from '../../utils/i18n';

export default function AISearchScreen() {
  const router = useRouter();
  const { t } = useAppI18n();
  const [searchDescription, setSearchDescription] = useState('');
  const [matchedProducts, setMatchedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleAISearch = async () => {
    if (!searchDescription.trim()) {
      Alert.alert(
        t('common.error'),
        'Please describe what you are looking for'
      );
      return;
    }

    setLoading(true);
    setShowResults(true);

    try {
      console.log('🤖 Starting intelligent AI product analysis...');
      console.log('📝 User description:', searchDescription);

      // Import productService functions
      const { fetchAllProductsWithKeywords, fetchProductsByIds } = require('../../services/productService');

      // Step 1: Fetch ALL products with their keywords
      console.log('📦 Step 1: Fetching all products with keywords...');
      const allProductsWithKeywords = await fetchAllProductsWithKeywords();
      
      if (allProductsWithKeywords.length === 0) {
        Alert.alert(t('search.noResults'), 'No products available at the moment');
        setMatchedProducts([]);
        return;
      }

      console.log(`✅ Retrieved ${allProductsWithKeywords.length} products for AI analysis`);

      // Step 2: Send to AI for intelligent analysis
      console.log('🧠 Step 2: Sending to AI for analysis...');
      const aiResult = await generateProductDetails(null, JSON.stringify({
        task: 'analyze_product_suitability',
        description: searchDescription,
        products: allProductsWithKeywords,
        userProductPrice: null, // No price comparison for general search
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
          t('search.noResults'),
          `AI couldn't find suitable products matching "${searchDescription}".\n\nTry describing differently or be more specific.`
        );
        setMatchedProducts([]);
        return;
      }

      // Step 4: Fetch full product details for top matches
      console.log('🔍 Step 4: Fetching full product details...');
      const productIds = matches.map(m => m.productId);
      const matchedProductsList = await fetchProductsByIds(productIds);

      // Step 5: Sort by AI score and add AI metadata
      console.log('🏆 Step 5: Sorting by AI scores...');
      const productsWithScores = matchedProductsList.map(product => {
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

      setMatchedProducts(productsWithScores);

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
      Alert.alert(t('common.error'), 'AI analysis failed. Please try again.');
      setMatchedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchDescription('');
    setMatchedProducts([]);
    setShowResults(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Header />

      <ScrollView className="flex-1">
        {/* Header Section */}
        <View className="bg-white p-6 mb-2">
          <View className="flex-row items-center mb-3">
            <Ionicons name="sparkles" size={24} color="#ECBE8C" />
            <Text className="text-xl font-bold text-gray-900 ml-2">
              {t('search.aiSearch') || 'AI Search'}
            </Text>
          </View>
          <Text className="text-sm text-gray-600">
            {t('search.aiSearchDesc') || 'Describe what you\'re looking for and let AI find matching products for you'}
          </Text>
        </View>

        {/* Search Input Section */}
        <View className="bg-white p-6 mb-2">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            {t('search.whatAreYouLookingFor') || 'What are you looking for?'}
          </Text>
          <Text className="text-xs text-gray-500 mb-3">
            {t('search.describeProduct') || 'Describe the product in detail - color, brand, size, condition, features, etc.'}
          </Text>
          <TextInput
            value={searchDescription}
            onChangeText={setSearchDescription}
            placeholder={t('search.aiSearchPlaceholder') || 'E.g., "Red Nike running shoes size 42, good condition" or "iPhone 13 Pro Max 256GB, unlocked"'}
            multiline
            numberOfLines={6}
            className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900 border border-gray-200"
            textAlignVertical="top"
          />
          <View className="flex-row mt-4 space-x-3">
            <TouchableOpacity
              onPress={handleAISearch}
              disabled={loading || !searchDescription.trim()}
              className={`flex-1 py-4 rounded-xl flex-row items-center justify-center ${
                loading || !searchDescription.trim() ? 'bg-gray-300' : 'bg-[#ECBE8C]'
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="search" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2 text-base">
                    {t('search.searchWithAI') || 'Search with AI'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {showResults && (
              <TouchableOpacity
                onPress={handleClearSearch}
                className="px-4 py-4 rounded-xl bg-gray-200 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Tips */}
        {!showResults && (
          <View className="bg-white p-6 mb-2">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              💡 {t('search.searchTips') || 'Search Tips'}
            </Text>
            <View className="space-y-2">
              {[
                t('search.tip1') || 'Be specific about brand, model, or features',
                t('search.tip2') || 'Mention color, size, or condition preferences',
                t('search.tip3') || 'Include price range if you have one in mind',
                t('search.tip4') || 'Use natural language - write as you would speak',
              ].map((tip, index) => (
                <View key={index} className="flex-row items-start mb-2">
                  <Text className="text-[#ECBE8C] mr-2">•</Text>
                  <Text className="text-sm text-gray-600 flex-1">{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Search Results */}
        {showResults && matchedProducts.length > 0 && (
          <View className="bg-white p-6 mb-2">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              ✨ {t('search.foundProducts') || 'Found Products'} ({matchedProducts.length})
            </Text>
            <ScrollView horizontal={false} className="space-y-3">
              {matchedProducts.map((product) => {
                const hasAIScore = product.aiScore !== undefined;
                
                return (
                  <TouchableOpacity
                    key={product.id}
                    onPress={() => router.push(`/product/${product.id}`)}
                    className="flex-row bg-gray-50 rounded-xl p-3 mb-3 border border-gray-200"
                  >
                    <View className="relative">
                      <Image
                        source={{ uri: product.imageUrl || 'https://placehold.co/100' }}
                        className="w-24 h-24 rounded-lg"
                        resizeMode="cover"
                      />
                      {hasAIScore && (
                        <View className="absolute top-1 left-1 bg-purple-600 px-2 py-1 rounded-full">
                          <Text className="text-white text-xs font-bold">
                            🤖 {Math.round(product.aiScore)}%
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-semibold text-gray-900" numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        {product.category}
                      </Text>
                      <Text className="text-base font-bold text-[#ECBE8C] mt-2">
                        {formatPrice(product.price, product.currency)}
                      </Text>
                      {hasAIScore && product.aiReason && (
                        <View className="mt-2 bg-purple-50 rounded px-2 py-1">
                          <Text className="text-xs text-purple-700 italic" numberOfLines={2}>
                            💡 {product.aiReason}
                          </Text>
                        </View>
                      )}
                      {product.tags && product.tags.length > 0 && (
                        <View className="flex-row flex-wrap mt-2">
                          {product.tags.slice(0, 2).map((tag, idx) => (
                            <View key={idx} className="bg-gray-200 rounded px-2 py-1 mr-1 mb-1">
                              <Text className="text-xs text-gray-700">{tag}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* No Results State */}
        {showResults && matchedProducts.length === 0 && !loading && (
          <View className="bg-white p-6 mb-2">
            <View className="items-center py-8">
              <Ionicons name="search-outline" size={64} color="#D1D5DB" />
              <Text className="text-lg font-semibold text-gray-900 mt-4">
                {t('search.noProductsFound') || 'No Products Found'}
              </Text>
              <Text className="text-sm text-gray-500 text-center mt-2 px-4">
                {t('search.tryDifferentKeywords') || 'Try using different keywords or be more specific in your description'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <BottomNavigation currentRoute="/search/ai-search" />
    </SafeAreaView>
  );
}
