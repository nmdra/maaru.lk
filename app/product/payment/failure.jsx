import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNavigation from '../../../components/BottomNavigation';
import { useAppI18n } from '../../../utils/i18n';

export default function PaymentFailureScreen() {
  const router = useRouter();
  const { t, common } = useAppI18n();

  const handleTryAgain = () => {
    router.back(); // Go back to payment page
  };

  const handleContactSupport = () => {
    // In a real app, this would open support chat or email
    router.push('/(tabs)/Reviews'); // For now, redirect to reviews/support section
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Failure Header */}
      <View className="bg-red-600 px-4 py-8 items-center">
        <View className="bg-white rounded-full p-4 mb-4">
          <Ionicons name="close" size={48} color="#dc2626" />
        </View>
        <Text className="text-white text-2xl font-bold mb-2">{t('paymentFailure.title')}</Text>
        <Text className="text-red-100 text-center">
          {t('paymentFailure.subtitle')}
        </Text>
      </View>

      <ScrollView className="flex-1">
        {/* Failure Details */}
        <View className="bg-white mx-4 mt-6 p-6 rounded-lg shadow-sm">
          <View className="flex-row items-center mb-4">
            <Ionicons name="alert-circle-outline" size={24} color="#dc2626" />
            <Text className="text-lg font-bold ml-2">{t('paymentFailure.whatHappened')}</Text>
          </View>

          <View className="space-y-4">
            <Text className="text-gray-700 leading-6">
              {t('paymentFailure.explanation')}
            </Text>

            <View className="bg-gray-50 p-4 rounded-lg">
              <Text className="font-semibold text-gray-800 mb-2">{t('paymentFailure.commonReasons.title')}</Text>
              <View className="space-y-2">
                <View className="flex-row">
                  <Text className="text-gray-600">• </Text>
                  <Text className="text-gray-600 flex-1">{t('paymentFailure.commonReasons.incorrectDetails')}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-gray-600">• </Text>
                  <Text className="text-gray-600 flex-1">{t('paymentFailure.commonReasons.insufficientFunds')}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-gray-600">• </Text>
                  <Text className="text-gray-600 flex-1">{t('paymentFailure.commonReasons.expiredCard')}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-gray-600">• </Text>
                  <Text className="text-gray-600 flex-1">{t('paymentFailure.commonReasons.limitExceeded')}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Sample Card Info */}
        <View className="bg-white mx-4 mt-4 p-6 rounded-lg shadow-sm">
          <View className="flex-row items-center mb-4">
            <Ionicons name="card-outline" size={24} color="#2563eb" />
            <Text className="text-lg font-bold ml-2">{t('paymentFailure.sampleCard.title')}</Text>
          </View>

          <Text className="text-gray-700 mb-3">{t('paymentFailure.sampleCard.description')}</Text>

          <View className="bg-blue-50 p-4 rounded-lg">
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="font-medium text-gray-700">{t('payment.cardNumber')}:</Text>
                <Text className="font-mono text-blue-600">4444 4444 4444 4444</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="font-medium text-gray-700">{t('payment.expiryDate')}:</Text>
                <Text className="font-mono text-blue-600">25/25</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="font-medium text-gray-700">{t('payment.cvv')}:</Text>
                <Text className="font-mono text-blue-600">444</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Next Steps */}
        <View className="bg-white mx-4 mt-4 p-6 rounded-lg shadow-sm">
          <View className="flex-row items-center mb-4">
            <Ionicons name="bulb-outline" size={24} color="#f59e0b" />
            <Text className="text-lg font-bold ml-2">{t('paymentFailure.whatCanYouDo')}</Text>
          </View>

          <View className="space-y-3">
            <View className="flex-row">
              <View className="bg-blue-100 rounded-full p-2 mr-3">
                <Ionicons name="refresh-outline" size={16} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="font-medium">{t('paymentFailure.options.tryAgain.title')}</Text>
                <Text className="text-sm text-gray-600">{t('paymentFailure.options.tryAgain.description')}</Text>
              </View>
            </View>

            <View className="flex-row">
              <View className="bg-green-100 rounded-full p-2 mr-3">
                <Ionicons name="card-outline" size={16} color="#16a34a" />
              </View>
              <View className="flex-1">
                <Text className="font-medium">{t('paymentFailure.options.differentMethod.title')}</Text>
                <Text className="text-sm text-gray-600">{t('paymentFailure.options.differentMethod.description')}</Text>
              </View>
            </View>

            <View className="flex-row">
              <View className="bg-purple-100 rounded-full p-2 mr-3">
                <Ionicons name="call-outline" size={16} color="#8b5cf6" />
              </View>
              <View className="flex-1">
                <Text className="font-medium">{t('paymentFailure.options.contactSupport.title')}</Text>
                <Text className="text-sm text-gray-600">{t('paymentFailure.options.contactSupport.description')}</Text>
              </View>
            </View>

            <View className="flex-row">
              <View className="bg-orange-100 rounded-full p-2 mr-3">
                <Ionicons name="time-outline" size={16} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="font-medium">{t('paymentFailure.options.tryLater.title')}</Text>
                <Text className="text-sm text-gray-600">{t('paymentFailure.options.tryLater.description')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mx-4 mt-6 mb-6 space-y-3">
          <TouchableOpacity
            onPress={handleTryAgain}
            className="bg-blue-600 py-4 rounded-lg items-center justify-center flex-row"
          >
            <Ionicons name="refresh-outline" size={20} color="white" className="mr-2" />
            <Text className="text-white font-bold text-lg">{t('paymentFailure.actions.tryAgain')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleContactSupport}
            className="bg-purple-600 py-4 rounded-lg items-center justify-center flex-row"
          >
            <Ionicons name="chatbubble-outline" size={20} color="white" className="mr-2" />
            <Text className="text-white font-bold text-lg">{t('paymentFailure.actions.contactSupport')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/Home')}
            className="bg-gray-200 py-4 rounded-lg items-center justify-center flex-row"
          >
            <Ionicons name="home-outline" size={20} color="#374151" className="mr-2" />
            <Text className="text-gray-700 font-bold text-lg">{t('paymentFailure.actions.backToHome')}</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing for navigation */}
        <View className="h-20" />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </View>
  );
}