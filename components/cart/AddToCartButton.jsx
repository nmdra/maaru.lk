import React, { useContext, useState } from 'react';
import { TouchableOpacity, Text, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../../context/CartContext';

export default function AddToCartButton({ 
  product, 
  quantity = 1, 
  style = 'primary',
  size = 'medium',
  showQuantity = false,
  onAdd,
}) {
  const { addToCart, isInCart, getCartItem, updateQuantity } = useContext(CartContext);
  const [isAdding, setIsAdding] = useState(false);

  const cartItem = getCartItem(product.id);
  const isProductInCart = isInCart(product.id);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      addToCart(product, quantity);
      
      if (onAdd) {
        onAdd(product, quantity);
      }

      // Show success feedback
      Alert.alert(
        'Added to Cart',
        `${product.name} has been added to your cart`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateQuantity = (newQuantity) => {
    if (newQuantity <= 0) {
      updateQuantity(product.id, 0);
    } else {
      updateQuantity(product.id, newQuantity);
    }
  };

  // Style variants
  const getButtonStyles = () => {
    const baseStyles = 'flex-row items-center justify-center rounded-lg';
    const sizeStyles = {
      small: 'px-3 py-2',
      medium: 'px-4 py-3',
      large: 'px-6 py-4',
    };
    
    const styleVariants = {
      primary: 'bg-blue-600',
      secondary: 'bg-gray-200 border border-gray-300',
      success: 'bg-green-600',
      outline: 'border-2 border-blue-600 bg-transparent',
    };

    return `${baseStyles} ${sizeStyles[size]} ${styleVariants[style]}`;
  };

  const getTextStyles = () => {
    const baseStyles = 'font-semibold';
    const sizeStyles = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
    };

    const textColors = {
      primary: 'text-white',
      secondary: 'text-gray-700',
      success: 'text-white',
      outline: 'text-blue-600',
    };

    return `${baseStyles} ${sizeStyles[size]} ${textColors[style]}`;
  };

  const getIconColor = () => {
    const colors = {
      primary: 'white',
      secondary: '#374151',
      success: 'white',
      outline: '#2563eb',
    };
    return colors[style];
  };

  // If product is swap only, show different button
  if (product.swapOnly) {
    return (
      <TouchableOpacity
        className={getButtonStyles().replace('bg-blue-600', 'bg-yellow-500')}
        onPress={handleAddToCart}
        disabled={isAdding}
      >
        <Ionicons name="swap-horizontal" size={16} color="white" />
        <Text className={`${getTextStyles().replace('text-blue-600', 'text-white')} ml-2`}>
          {isAdding ? 'Adding...' : 'Add for Swap'}
        </Text>
      </TouchableOpacity>
    );
  }

  // If item is already in cart and showQuantity is true, show quantity controls
  if (isProductInCart && showQuantity && cartItem) {
    return (
      <View className="flex-row items-center bg-gray-100 rounded-lg">
        <TouchableOpacity
          onPress={() => handleUpdateQuantity(cartItem.quantity - 1)}
          className="p-2"
        >
          <Ionicons name="remove" size={16} color="#374151" />
        </TouchableOpacity>
        
        <View className="px-3 py-1 min-w-[40px] items-center">
          <Text className="text-base font-semibold text-gray-900">
            {cartItem.quantity}
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={() => handleUpdateQuantity(cartItem.quantity + 1)}
          className="p-2"
        >
          <Ionicons name="add" size={16} color="#374151" />
        </TouchableOpacity>
      </View>
    );
  }

  // Standard add to cart button
  return (
    <TouchableOpacity
      className={getButtonStyles()}
      onPress={handleAddToCart}
      disabled={isAdding}
    >
      <Ionicons 
        name={isProductInCart ? "checkmark-circle" : "cart"} 
        size={16} 
        color={getIconColor()} 
      />
      <Text className={`${getTextStyles()} ml-2`}>
        {isAdding 
          ? 'Adding...' 
          : isProductInCart 
            ? 'In Cart' 
            : 'Add to Cart'
        }
      </Text>
    </TouchableOpacity>
  );
}