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
        <Text className="text-white text-2xl font-bold mb-2">Payment Failed</Text>
        <Text className="text-red-100 text-center">
          We couldn't process your payment after multiple attempts.
        </Text>
      </View>

      <ScrollView className="flex-1">
        {/* Failure Details */}
        <View className="bg-white mx-4 mt-6 p-6 rounded-lg shadow-sm">
          <View className="flex-row items-center mb-4">
            <Ionicons name="alert-circle-outline" size={24} color="#dc2626" />
            <Text className="text-lg font-bold ml-2">What Happened?</Text>
          </View>

          <View className="space-y-4">
            <Text className="text-gray-700 leading-6">
              Your payment could not be processed due to incorrect card details. You attempted to pay 2 times with invalid information.
            </Text>

            <View className="bg-gray-50 p-4 rounded-lg">
              <Text className="font-semibold text-gray-800 mb-2">Common reasons for payment failure:</Text>
              <View className="space-y-2">
                <View className="flex-row">
                  <Text className="text-gray-600">• </Text>
                  <Text className="text-gray-600 flex-1">Incorrect card number, expiry date, or CVV</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-gray-600">• </Text>
                  <Text className="text-gray-600 flex-1">Insufficient funds in your account</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-gray-600">• </Text>
                  <Text className="text-gray-600 flex-1">Card expired or blocked by bank</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-gray-600">• </Text>
                  <Text className="text-gray-600 flex-1">Daily transaction limit exceeded</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Sample Card Info */}
        <View className="bg-white mx-4 mt-4 p-6 rounded-lg shadow-sm">
          <View className="flex-row items-center mb-4">
            <Ionicons name="card-outline" size={24} color="#2563eb" />
            <Text className="text-lg font-bold ml-2">Sample Test Card</Text>
          </View>

          <Text className="text-gray-700 mb-3">For testing purposes, use these card details:</Text>

          <View className="bg-blue-50 p-4 rounded-lg">
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="font-medium text-gray-700">Card Number:</Text>
                <Text className="font-mono text-blue-600">4444 4444 4444 4444</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="font-medium text-gray-700">Expiry Date:</Text>
                <Text className="font-mono text-blue-600">25/25</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="font-medium text-gray-700">CVV:</Text>
                <Text className="font-mono text-blue-600">444</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Next Steps */}
        <View className="bg-white mx-4 mt-4 p-6 rounded-lg shadow-sm">
          <View className="flex-row items-center mb-4">
            <Ionicons name="bulb-outline" size={24} color="#f59e0b" />
            <Text className="text-lg font-bold ml-2">What Can You Do?</Text>
          </View>

          <View className="space-y-3">
            <View className="flex-row">
              <View className="bg-blue-100 rounded-full p-2 mr-3">
                <Ionicons name="refresh-outline" size={16} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="font-medium">Try Again</Text>
                <Text className="text-sm text-gray-600">Go back and verify your payment details</Text>
              </View>
            </View>

            <View className="flex-row">
              <View className="bg-green-100 rounded-full p-2 mr-3">
                <Ionicons name="card-outline" size={16} color="#16a34a" />
              </View>
              <View className="flex-1">
                <Text className="font-medium">Use Different Payment Method</Text>
                <Text className="text-sm text-gray-600">Try PayPal, bank transfer, or cash on delivery</Text>
              </View>
            </View>

            <View className="flex-row">
              <View className="bg-purple-100 rounded-full p-2 mr-3">
                <Ionicons name="call-outline" size={16} color="#8b5cf6" />
              </View>
              <View className="flex-1">
                <Text className="font-medium">Contact Support</Text>
                <Text className="text-sm text-gray-600">Get help from our customer service team</Text>
              </View>
            </View>

            <View className="flex-row">
              <View className="bg-orange-100 rounded-full p-2 mr-3">
                <Ionicons name="time-outline" size={16} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="font-medium">Try Later</Text>
                <Text className="text-sm text-gray-600">Your item will be saved for later purchase</Text>
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
            <Text className="text-white font-bold text-lg">Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleContactSupport}
            className="bg-purple-600 py-4 rounded-lg items-center justify-center flex-row"
          >
            <Ionicons name="chatbubble-outline" size={20} color="white" className="mr-2" />
            <Text className="text-white font-bold text-lg">Contact Support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/Home')}
            className="bg-gray-200 py-4 rounded-lg items-center justify-center flex-row"
          >
            <Ionicons name="home-outline" size={20} color="#374151" className="mr-2" />
            <Text className="text-gray-700 font-bold text-lg">Back to Home</Text>
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