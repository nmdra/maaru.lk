import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../../context/CartContext';
import formatPrice from '../../utils/formatPrice';

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useContext(CartContext);

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem();
      return;
    }
    updateQuantity(item.id, newQuantity);
  };

  const handleRemoveItem = () => {
    Alert.alert(
      'Remove Item',
      `Remove "${item.name}" from your cart?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFromCart(item.id),
        },
      ]
    );
  };

  const totalPrice = item.price * item.quantity;

  return (
    <View className="bg-white rounded-xl shadow-sm p-4 mb-3 border border-gray-100">
      <View className="flex-row">
        {/* Product Image */}
        <Image
          source={item.imageUrl ? { uri: item.imageUrl } : { uri: 'https://placehold.co/400x400' }}
          className="w-20 h-20 rounded-lg bg-gray-100"
          resizeMode="cover"
        />
        
        {/* Product Details */}
        <View className="flex-1 ml-3">
          <View className="flex-row justify-between items-start mb-1">
            <Text className="text-base font-semibold text-gray-900 flex-1 pr-2" numberOfLines={2}>
              {item.name}
            </Text>
            <TouchableOpacity
              onPress={handleRemoveItem}
              className="p-1"
            >
              <Ionicons name="close-circle" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
          
          {/* Condition/Category */}
          {item.condition && (
            <Text className="text-sm text-gray-500 mb-2">{item.condition}</Text>
          )}
          
          {/* Price and Quantity Controls */}
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-lg font-bold text-blue-600">
                {formatPrice(totalPrice, item.currency || 'LKR')}
              </Text>
              {item.quantity > 1 && (
                <Text className="text-sm text-gray-500">
                  {formatPrice(item.price, item.currency || 'LKR')} each
                </Text>
              )}
            </View>
            
            {/* Quantity Controls */}
            <View className="flex-row items-center bg-gray-100 rounded-lg">
              <TouchableOpacity
                onPress={() => handleQuantityChange(item.quantity - 1)}
                className="p-2"
                disabled={item.quantity <= 1}
              >
                <Ionicons 
                  name="remove" 
                  size={16} 
                  color={item.quantity <= 1 ? "#d1d5db" : "#374151"} 
                />
              </TouchableOpacity>
              
              <View className="px-3 py-1">
                <Text className="text-base font-semibold text-gray-900">
                  {item.quantity}
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={() => handleQuantityChange(item.quantity + 1)}
                className="p-2"
              >
                <Ionicons name="add" size={16} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Swap Only Badge */}
          {item.swapOnly && (
            <View className="mt-2">
              <View className="bg-yellow-100 px-2 py-1 rounded-full self-start">
                <Text className="text-xs font-bold text-yellow-800">SWAP ONLY</Text>
              </View>
            </View>
          )}
          
          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <View className="flex-row flex-wrap mt-2">
              {item.tags.slice(0, 2).map((tag) => (
                <View key={tag} className="bg-green-100 px-2 py-0.5 mr-1 mb-1 rounded-full">
                  <Text className="text-xs text-green-800">{tag}</Text>
                </View>
              ))}
              {item.tags.length > 2 && (
                <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                  <Text className="text-xs text-gray-600">+{item.tags.length - 2}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}