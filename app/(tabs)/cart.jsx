import React, { useContext } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../../context/CartContext';
import CartItem from '../../components/cart/CartItem';
import CartSummary from '../../components/cart/CartSummary';

export default function CartScreen() {
  const { cartItems, clearCart, getCartTotal, getCartItemCount } = useContext(CartContext);

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearCart,
        },
      ]
    );
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before checkout.');
      return;
    }
    
    Alert.alert(
      'Checkout',
      `Proceed to checkout with ${getCartItemCount()} items?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Checkout',
          onPress: () => {
            // Navigate to checkout screen or payment process
            Alert.alert('Success', 'Checkout functionality will be implemented here!');
          },
        },
      ]
    );
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
        
        {/* Header */}
        <View className="bg-white px-4 py-3 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold text-gray-900">Shopping Cart</Text>
            <View className="bg-blue-100 px-2 py-1 rounded-full">
              <Text className="text-blue-600 font-semibold text-sm">0 items</Text>
            </View>
          </View>
        </View>

        {/* Empty Cart State */}
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-gray-100 w-24 h-24 rounded-full items-center justify-center mb-4">
            <Ionicons name="cart-outline" size={40} color="#6b7280" />
          </View>
          <Text className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</Text>
          <Text className="text-gray-600 text-center mb-6">
            Browse our products and add items to your cart to get started
          </Text>
          <TouchableOpacity className="bg-blue-600 px-6 py-3 rounded-lg">
            <Text className="text-white font-semibold">Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-gray-900">Shopping Cart</Text>
          <View className="flex-row items-center space-x-3">
            <View className="bg-blue-100 px-2 py-1 rounded-full">
              <Text className="text-blue-600 font-semibold text-sm">
                {getCartItemCount()} items
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClearCart}
              className="p-2"
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View className="flex-1">
        {/* Cart Items */}
        <ScrollView className="flex-1 px-4 py-4">
          {cartItems.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
          
          {/* Spacer for better scrolling */}
          <View className="h-32" />
        </ScrollView>

        {/* Cart Summary - Fixed at bottom */}
        <CartSummary onCheckout={handleCheckout} />
      </View>
    </SafeAreaView>
  );
}