import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNavigation from '../../../components/BottomNavigation';
import formatPrice from '../../../utils/formatPrice';
import { useAppI18n } from '../../../utils/i18n';

export default function PaymentSuccessScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t, common } = useAppI18n();

  // Generate order ID
  const orderNumber = `MR-${Date.now().toString().slice(-8)}`;
  const estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

  const orderDetails = {
    orderNumber,
    productName: params.productName || 'Product',
    quantity: parseInt(params.quantity) || 1,
    price: parseFloat(params.price) || 0,
    currency: params.currency || 'LKR',
    total: parseFloat(params.total) || 0,
    paymentMethod: params.paymentMethod || 'card',
    orderDate: params.orderDate ? new Date(params.orderDate) : new Date(),
  };

  const getPaymentMethodName = (method) => {
    switch (method) {
      case 'card':
        return 'Credit/Debit Card';
      case 'paypal':
        return 'PayPal';
      case 'bank':
        return 'Bank Transfer';
      case 'cash':
        return 'Cash on Delivery';
      default:
        return 'Unknown';
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Success Header */}
      <View className="bg-green-600 px-4 py-8 items-center">
        <View className="bg-white rounded-full p-4 mb-4">
          <Ionicons name="checkmark" size={48} color="#16a34a" />
        </View>
        <Text className="text-white text-2xl font-bold mb-2">Payment Successful!</Text>
        <Text className="text-green-100 text-center">
          Your order has been confirmed and will be processed shortly.
        </Text>
      </View>

      <ScrollView className="flex-1">
        {/* Order Summary Card */}
        <View className="bg-white mx-4 mt-6 p-6 rounded-lg shadow-sm">
          <View className="flex-row items-center mb-4">
            <Ionicons name="receipt-outline" size={24} color="#2563eb" />
            <Text className="text-lg font-bold ml-2">Order Summary</Text>
          </View>

          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Order Number</Text>
              <Text className="font-semibold text-blue-600">{orderDetails.orderNumber}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">Product</Text>
              <Text className="font-medium flex-1 text-right">{orderDetails.productName}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">Quantity</Text>
              <Text className="font-medium">{orderDetails.quantity}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">Unit Price</Text>
              <Text className="font-medium">{formatPrice(orderDetails.price, orderDetails.currency)}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">Payment Method</Text>
              <Text className="font-medium">{getPaymentMethodName(orderDetails.paymentMethod)}</Text>
            </View>

            <View className="border-t border-gray-200 pt-3 flex-row justify-between">
              <Text className="text-lg font-bold">Total Paid</Text>
              <Text className="text-lg font-bold text-green-600">
                {formatPrice(orderDetails.total, orderDetails.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery Information */}
        <View className="bg-white mx-4 mt-4 p-6 rounded-lg shadow-sm">
          <View className="flex-row items-center mb-4">
            <Ionicons name="truck-outline" size={24} color="#f59e0b" />
            <Text className="text-lg font-bold ml-2">Delivery Information</Text>
          </View>

          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Order Date</Text>
              <Text className="font-medium">{orderDetails.orderDate.toLocaleDateString()}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">Estimated Delivery</Text>
              <Text className="font-medium text-orange-600">{estimatedDelivery.toLocaleDateString()}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">Status</Text>
              <View className="bg-yellow-100 px-3 py-1 rounded-full">
                <Text className="text-yellow-800 text-sm font-medium">Processing</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Next Steps */}
        <View className="bg-white mx-4 mt-4 p-6 rounded-lg shadow-sm">
          <View className="flex-row items-center mb-4">
            <Ionicons name="list-outline" size={24} color="#8b5cf6" />
            <Text className="text-lg font-bold ml-2">What's Next?</Text>
          </View>

          <View className="space-y-3">
            <View className="flex-row">
              <View className="bg-blue-100 rounded-full p-2 mr-3">
                <Ionicons name="mail-outline" size={16} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="font-medium">Order Confirmation</Text>
                <Text className="text-sm text-gray-600">You'll receive an email confirmation shortly</Text>
              </View>
            </View>

            <View className="flex-row">
              <View className="bg-orange-100 rounded-full p-2 mr-3">
                <Ionicons name="cube-outline" size={16} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="font-medium">Packaging & Dispatch</Text>
                <Text className="text-sm text-gray-600">Your order will be packed and dispatched within 24 hours</Text>
              </View>
            </View>

            <View className="flex-row">
              <View className="bg-green-100 rounded-full p-2 mr-3">
                <Ionicons name="location-outline" size={16} color="#16a34a" />
              </View>
              <View className="flex-1">
                <Text className="font-medium">Track Your Order</Text>
                <Text className="text-sm text-gray-600">You'll receive tracking information via SMS/email</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mx-4 mt-6 mb-6 space-y-3">
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/Home')}
            className="bg-blue-600 py-4 rounded-lg items-center justify-center flex-row"
          >
            <Ionicons name="home-outline" size={20} color="white" className="mr-2" />
            <Text className="text-white font-bold text-lg">Continue Shopping</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/Reviews')}
            className="bg-gray-200 py-4 rounded-lg items-center justify-center flex-row"
          >
            <Ionicons name="receipt-outline" size={20} color="#374151" className="mr-2" />
            <Text className="text-gray-700 font-bold text-lg">View My Orders</Text>
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