import React, { useContext } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../../context/CartContext';
import formatPrice from '../../utils/formatPrice';

export default function CartSummary({ onCheckout }) {
  const { cartItems, getCartTotal, getCartItemCount } = useContext(CartContext);

  const subtotal = getCartTotal();
  const shipping = subtotal > 5000 ? 0 : 250; // Free shipping over LKR 5000
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  const itemCount = getCartItemCount();
  const swapOnlyItems = cartItems.filter(item => item.swapOnly).length;
  const purchaseItems = cartItems.filter(item => !item.swapOnly).length;

  return (
    <View className="bg-white border-t border-gray-200 shadow-lg">
      {/* Summary Details */}
      <View className="px-4 py-4">
        {/* Items Summary */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-base font-semibold text-gray-900">Order Summary</Text>
          <Text className="text-sm text-gray-600">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Text>
        </View>

        {/* Price Breakdown */}
        <View className="space-y-2 mb-4">
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Subtotal ({purchaseItems} items)</Text>
            <Text className="text-gray-900 font-medium">
              {formatPrice(subtotal, 'LKR')}
            </Text>
          </View>
          
          {swapOnlyItems > 0 && (
            <View className="flex-row justify-between">
              <Text className="text-yellow-600">Swap Only Items ({swapOnlyItems})</Text>
              <Text className="text-yellow-600 font-medium">No charge</Text>
            </View>
          )}
          
          <View className="flex-row justify-between">
            <View className="flex-row items-center">
              <Text className="text-gray-600">Shipping</Text>
              {shipping === 0 && (
                <View className="ml-2 bg-green-100 px-2 py-0.5 rounded-full">
                  <Text className="text-xs text-green-800 font-bold">FREE</Text>
                </View>
              )}
            </View>
            <Text className="text-gray-900 font-medium">
              {formatPrice(shipping, 'LKR')}
            </Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Tax (8%)</Text>
            <Text className="text-gray-900 font-medium">
              {formatPrice(tax, 'LKR')}
            </Text>
          </View>
          
          <View className="border-t border-gray-200 pt-2">
            <View className="flex-row justify-between">
              <Text className="text-lg font-bold text-gray-900">Total</Text>
              <Text className="text-lg font-bold text-blue-600">
                {formatPrice(total, 'LKR')}
              </Text>
            </View>
          </View>
        </View>

        {/* Free Shipping Notice */}
        {shipping > 0 && (
          <View className="bg-blue-50 p-3 rounded-lg mb-4">
            <View className="flex-row items-center">
              <Ionicons name="information-circle" size={16} color="#2563eb" />
              <Text className="text-sm text-blue-700 ml-2 flex-1">
                Add {formatPrice(5000 - subtotal, 'LKR')} more for free shipping!
              </Text>
            </View>
          </View>
        )}

        {/* Checkout Button */}
        <TouchableOpacity
          onPress={onCheckout}
          className="bg-blue-600 py-4 rounded-xl flex-row items-center justify-center"
          disabled={itemCount === 0}
        >
          <Ionicons name="card" size={20} color="white" />
          <Text className="text-white font-bold text-lg ml-2">
            Proceed to Checkout
          </Text>
        </TouchableOpacity>

        {/* Payment Methods */}
        <View className="flex-row justify-center items-center mt-3 space-x-4">
          <Text className="text-xs text-gray-500">Secure payment with</Text>
          <View className="flex-row space-x-2">
            <View className="bg-gray-100 px-2 py-1 rounded">
              <Text className="text-xs font-semibold text-gray-700">VISA</Text>
            </View>
            <View className="bg-gray-100 px-2 py-1 rounded">
              <Text className="text-xs font-semibold text-gray-700">MC</Text>
            </View>
            <View className="bg-gray-100 px-2 py-1 rounded">
              <Text className="text-xs font-semibold text-gray-700">PayPal</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}