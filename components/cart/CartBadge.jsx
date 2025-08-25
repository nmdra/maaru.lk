import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { CartContext } from '../../context/CartContext';

export default function CartBadge() {
  const { getCartItemCount } = useContext(CartContext);
  const itemCount = getCartItemCount();

  if (itemCount === 0) return null;

  return (
    <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center">
      <Text className="text-white text-xs font-bold">
        {itemCount > 99 ? '99+' : itemCount}
      </Text>
    </View>
  );
}