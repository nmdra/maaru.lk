// app/product/analysis/[id].jsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNavigation from '../../../components/BottomNavigation';
import Header from '../../../components/Header';
import Colors from '../../../constants/Colors';
import formatPrice from '../../../utils/formatPrice';
import { useAppI18n } from '../../../utils/i18n';

export default function ProductAnalysisScreen() {
  const params = useLocalSearchParams();
  const { id, analysisData: analysisParam } = params;
  const router = useRouter();
  const { t, currentLanguage } = useAppI18n();
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get analysis data from route params
    const loadAnalysisData = () => {
      try {
        console.log('📊 Loading analysis data, params:', params);
        
        if (analysisParam) {
          console.log('✅ Found analysisData param');
          const data = typeof analysisParam === 'string' ? JSON.parse(analysisParam) : analysisParam;
          console.log('📈 Parsed analysis data:', data);
          setAnalysisData(data);
        } else {
          console.warn('⚠️ No analysis data found in params');
        }
      } catch (error) {
        console.error('❌ Error loading analysis data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalysisData();
  }, [analysisParam]);

  // Get price verdict color and icon
  const getPriceVerdictStyle = (verdict) => {
    switch (verdict) {
      case 'excellent_deal':
        return { 
          color: Colors.success, 
          icon: 'trending-down', 
          text: t('analysis.excellentDeal', 'Excellent Deal!'),
          bg: '#ECFDF5'
        };
      case 'fair_price':
        return { 
          color: Colors.info, 
          icon: 'checkmark-circle', 
          text: t('analysis.fairPrice', 'Fair Price'),
          bg: '#EFF6FF'
        };
      case 'slightly_high':
        return { 
          color: Colors.warning, 
          icon: 'alert-circle', 
          text: t('analysis.slightlyHigh', 'Slightly High'),
          bg: '#FFFBEB'
        };
      case 'overpriced':
        return { 
          color: Colors.error, 
          icon: 'trending-up', 
          text: t('analysis.overpriced', 'Overpriced'),
          bg: '#FEF2F2'
        };
      case 'underpriced':
        return { 
          color: '#8B5CF6', 
          icon: 'warning', 
          text: t('analysis.unusuallyLow', 'Unusually Low'),
          bg: '#F5F3FF'
        };
      default:
        return { 
          color: Colors.gray[600], 
          icon: 'help-circle', 
          text: t('analysis.unknown', 'Unknown'),
          bg: Colors.background.tertiary
        };
    }
  };

  // Get market demand style
  const getMarketDemandStyle = (demand) => {
    const demandMap = {
      very_high: { 
        color: Colors.success, 
        text: `🔥 ${t('analysis.veryHighDemand', 'Very High Demand')}`,
        bg: '#ECFDF5'
      },
      high: { 
        color: Colors.info, 
        text: `📈 ${t('analysis.highDemand', 'High Demand')}`,
        bg: '#EFF6FF'
      },
      moderate: { 
        color: Colors.warning, 
        text: `📊 ${t('analysis.moderateDemand', 'Moderate Demand')}`,
        bg: '#FFFBEB'
      },
      low: { 
        color: Colors.error, 
        text: `📉 ${t('analysis.lowDemand', 'Low Demand')}`,
        bg: '#FEF2F2'
      },
      very_low: { 
        color: Colors.gray[600], 
        text: `💤 ${t('analysis.veryLowDemand', 'Very Low Demand')}`,
        bg: Colors.background.tertiary
      },
    };
    return demandMap[demand] || { 
      color: Colors.gray[600], 
      text: t('analysis.unknown', 'Unknown'),
      bg: Colors.background.tertiary
    };
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background.primary }}>
        <Header />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text className="mt-4" style={{ color: Colors.text.secondary }}>
            {t('common.loading', 'Loading...')}
          </Text>
        </View>
        <BottomNavigation currentRoute={`/product/analysis/${id}`} />
      </SafeAreaView>
    );
  }

  if (!analysisData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background.primary }}>
        <Header />
        <View className="flex-1 justify-center items-center p-6">
          <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
          <Text className="text-xl font-bold mt-4" style={{ color: Colors.text.primary }}>
            {t('analysis.noData', 'No Analysis Data')}
          </Text>
          <Text className="text-center mt-2" style={{ color: Colors.text.secondary }}>
            {t('analysis.noDataDesc', 'Analysis data could not be loaded.')}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 px-6 py-3 rounded-lg"
            style={{ backgroundColor: Colors.accent }}
          >
            <Text className="text-white font-semibold">{t('common.goBack', 'Go Back')}</Text>
          </TouchableOpacity>
        </View>
        <BottomNavigation currentRoute={`/product/analysis/${id}`} />
      </SafeAreaView>
    );
  }

  const verdictStyle = getPriceVerdictStyle(analysisData.priceVerdict);
  const demandStyle = getMarketDemandStyle(analysisData.marketDemand);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background.primary }}>
      <Header />
      
      <View style={{ flex: 1, backgroundColor: Colors.background.primary }}>
        {/* Custom Header with Back Button */}
        <View className="px-4 py-3 border-b" style={{ 
          backgroundColor: Colors.card.background,
          borderBottomColor: Colors.border.default
        }}>
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => router.back()} 
              className="mr-3 p-2 rounded-full"
              style={{ backgroundColor: Colors.background.tertiary }}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-lg font-bold" style={{ color: Colors.text.primary }}>
                🔍 {t('analysis.title', 'Market Analysis')}
              </Text>
              <Text className="text-xs" style={{ color: Colors.text.secondary }}>
                {t('analysis.subtitle', 'AI-powered product insights')}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Price Verdict Card */}
          <View 
            className="p-5 rounded-2xl mb-4 shadow-md"
            style={{ backgroundColor: verdictStyle.bg }}
          >
            <View className="flex-row items-center mb-3">
              <View 
                className="w-12 h-12 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: Colors.white }}
              >
                <Ionicons 
                  name={verdictStyle.icon} 
                  size={28} 
                  color={verdictStyle.color} 
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium mb-1" style={{ color: Colors.text.secondary }}>
                  {t('analysis.priceVerdict', 'Price Verdict')}
                </Text>
                <Text className="text-xl font-bold" style={{ color: verdictStyle.color }}>
                  {verdictStyle.text}
                </Text>
              </View>
            </View>
            {analysisData.productInfo && (
              <View className="pt-3 border-t" style={{ borderTopColor: verdictStyle.color + '30' }}>
                <Text className="text-sm font-semibold mb-1" style={{ color: Colors.text.primary }}>
                  {t('analysis.listedPrice', 'Listed Price')}:
                </Text>
                <Text className="text-2xl font-bold" style={{ color: verdictStyle.color }}>
                  {formatPrice(analysisData.productInfo.price, analysisData.productInfo.currency)}
                </Text>
              </View>
            )}
          </View>

          {/* Market Price Range Card */}
          <View 
            className="p-5 rounded-2xl mb-4 shadow-md"
            style={{ backgroundColor: Colors.card.background }}
          >
            <View className="flex-row items-center mb-4">
              <Ionicons name="pricetag" size={24} color={Colors.accent} />
              <Text className="text-lg font-bold ml-2" style={{ color: Colors.text.primary }}>
                {t('analysis.marketPriceRange', 'Market Price Range')}
              </Text>
            </View>

            <View className="space-y-3">
              <View className="flex-row justify-between items-center pb-3 border-b" style={{ borderBottomColor: Colors.border.light }}>
                <Text className="font-medium" style={{ color: Colors.text.secondary }}>
                  {t('analysis.minimum', 'Minimum')}:
                </Text>
                <Text className="font-bold text-lg" style={{ color: Colors.text.primary }}>
                  {formatPrice(analysisData.marketPrice.min, analysisData.marketPrice.currency)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center pb-3 border-b" style={{ borderBottomColor: Colors.border.light }}>
                <Text className="font-medium" style={{ color: Colors.text.secondary }}>
                  {t('analysis.average', 'Average')}:
                </Text>
                <Text className="font-bold text-xl" style={{ color: Colors.info }}>
                  {formatPrice(analysisData.marketPrice.average, analysisData.marketPrice.currency)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="font-medium" style={{ color: Colors.text.secondary }}>
                  {t('analysis.maximum', 'Maximum')}:
                </Text>
                <Text className="font-bold text-lg" style={{ color: Colors.text.primary }}>
                  {formatPrice(analysisData.marketPrice.max, analysisData.marketPrice.currency)}
                </Text>
              </View>
            </View>
          </View>

          {/* Market Demand & Trust Score Row */}
          <View className="flex-row gap-3 mb-4">
            {/* Market Demand */}
            <View 
              className="flex-1 p-4 rounded-2xl shadow-md"
              style={{ backgroundColor: demandStyle.bg }}
            >
              <Text className="text-xs font-medium mb-2" style={{ color: Colors.text.secondary }}>
                {t('analysis.marketDemand', 'Market Demand')}
              </Text>
              <Text className="text-sm font-bold" style={{ color: demandStyle.color }}>
                {demandStyle.text}
              </Text>
            </View>

            {/* Trust Score */}
            <View 
              className="flex-1 p-4 rounded-2xl shadow-md"
              style={{ backgroundColor: Colors.card.background }}
            >
              <Text className="text-xs font-medium mb-2" style={{ color: Colors.text.secondary }}>
                {t('analysis.trustScore', 'Trust Score')}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-2xl font-bold mr-2" style={{ 
                  color: analysisData.trustScore >= 70 ? Colors.success : 
                         analysisData.trustScore >= 50 ? Colors.warning : Colors.error 
                }}>
                  {analysisData.trustScore}
                </Text>
                <Text className="text-sm" style={{ color: Colors.text.tertiary }}>/100</Text>
              </View>
              <View className="mt-2 h-2 rounded-full overflow-hidden" style={{ backgroundColor: Colors.gray[200] }}>
                <View 
                  className="h-full rounded-full" 
                  style={{ 
                    width: `${analysisData.trustScore}%`,
                    backgroundColor: analysisData.trustScore >= 70 ? Colors.success : 
                                    analysisData.trustScore >= 50 ? Colors.warning : Colors.error
                  }} 
                />
              </View>
            </View>
          </View>

          {/* Condition Assessment */}
          {analysisData.condition && (
            <View 
              className="p-5 rounded-2xl mb-4 shadow-md"
              style={{ backgroundColor: Colors.card.background }}
            >
              <View className="flex-row items-center mb-3">
                <Ionicons name="construct" size={24} color={Colors.accent} />
                <Text className="text-lg font-bold ml-2" style={{ color: Colors.text.primary }}>
                  {t('analysis.conditionImpact', 'Condition Impact')}
                </Text>
              </View>
              <Text className="leading-6 mb-2" style={{ color: Colors.text.secondary }}>
                {analysisData.condition.assessment}
              </Text>
              {analysisData.condition.affectsPrice && (
                <View className="flex-row items-center mt-2 p-2 rounded-lg" style={{ backgroundColor: Colors.warning + '20' }}>
                  <Ionicons name="alert-circle" size={16} color={Colors.warning} />
                  <Text className="text-xs font-medium ml-2" style={{ color: Colors.warning }}>
                    {t('analysis.conditionAffectsPrice', 'Condition significantly affects price')}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Similar Products */}
          {analysisData.similarProducts && analysisData.similarProducts.length > 0 && (
            <View 
              className="p-5 rounded-2xl mb-4 shadow-md"
              style={{ backgroundColor: Colors.card.background }}
            >
              <View className="flex-row items-center mb-4">
                <Ionicons name="albums" size={24} color={Colors.accent} />
                <Text className="text-lg font-bold ml-2" style={{ color: Colors.text.primary }}>
                  {t('analysis.similarProducts', 'Similar Products')}
                </Text>
              </View>
              {analysisData.similarProducts.map((item, index) => (
                <View 
                  key={index} 
                  className="flex-row justify-between items-center py-3 border-b"
                  style={{ borderBottomColor: index === analysisData.similarProducts.length - 1 ? 'transparent' : Colors.border.light }}
                >
                  <View className="flex-1 mr-3">
                    <Text className="font-semibold mb-1" style={{ color: Colors.text.primary }}>
                      {item.name}
                    </Text>
                    <Text className="text-xs" style={{ color: Colors.text.tertiary }}>
                      {item.source}
                    </Text>
                  </View>
                  <Text className="font-bold" style={{ color: Colors.info }}>
                    {formatPrice(item.estimatedPrice, analysisData.marketPrice.currency)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Key Insights */}
          {analysisData.insights && analysisData.insights.length > 0 && (
            <View 
              className="p-5 rounded-2xl mb-4 shadow-md"
              style={{ backgroundColor: Colors.card.background }}
            >
              <View className="flex-row items-center mb-4">
                <Ionicons name="bulb" size={24} color={Colors.accent} />
                <Text className="text-lg font-bold ml-2" style={{ color: Colors.text.primary }}>
                  {t('analysis.keyInsights', 'Key Insights')}
                </Text>
              </View>
              {analysisData.insights.map((insight, index) => (
                <View key={index} className="flex-row items-start mb-3">
                  <View 
                    className="w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5"
                    style={{ backgroundColor: Colors.accent + '20' }}
                  >
                    <Text className="text-xs font-bold" style={{ color: Colors.accent }}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text className="flex-1 leading-6" style={{ color: Colors.text.secondary }}>
                    {insight}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Recommendation */}
          {analysisData.recommendation && (
            <View 
              className="p-5 rounded-2xl mb-4 shadow-md"
              style={{ backgroundColor: Colors.success + '15' }}
            >
              <View className="flex-row items-center mb-3">
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                <Text className="text-lg font-bold ml-2" style={{ color: Colors.success }}>
                  {t('analysis.recommendation', 'Recommendation')}
                </Text>
              </View>
              <Text className="leading-7" style={{ color: Colors.text.primary }}>
                {analysisData.recommendation}
              </Text>
            </View>
          )}

          {/* Disclaimer */}
          <View 
            className="p-4 rounded-xl mb-6"
            style={{ backgroundColor: Colors.background.tertiary }}
          >
            <View className="flex-row items-start">
              <Ionicons name="information-circle-outline" size={18} color={Colors.text.tertiary} style={{ marginTop: 2 }} />
              <Text className="flex-1 text-xs leading-5 ml-2" style={{ color: Colors.text.tertiary }}>
                {t('analysis.disclaimer', 'This analysis is AI-generated based on market patterns and may not reflect real-time prices. Always verify details with the seller and conduct your own research before making a purchase decision.')}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
      
      <BottomNavigation currentRoute={`/product/analysis/${id}`} />
    </SafeAreaView>
  );
}
