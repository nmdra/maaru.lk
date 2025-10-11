import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchProducts } from '../../services/productService';
import formatPrice from '../../utils/formatPrice';
import { useAppI18n } from '../../utils/i18n';

const CATEGORIES = ['All', 'Shoes', 'Clothes', 'Accessories', 'Electronics', 'Books', 'Others'];

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useAppI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const loadItems = async () => {
      try {
        const { items } = await fetchProducts({});
        setItems(items);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  const filteredItems =
    selectedCategory === 'All' ? items : items.filter((item) => item.category === selectedCategory);

  if (loading)
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );

  // Header + Search + Category Chips as FlatList header
  const renderHeader = () => (
    <View className="bg-white px-4 pt-4 pb-2">
      {/* Search Bar */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-2xl font-bold text-gray-900">Maaru.LK</Text>

        {/* Add profile button  */}
        <Pressable
          onPress={() => router.push('/(auth)/Profile')}
          className="bg-blue-600 p-2 rounded-full"
          accessibilityLabel="Go to Profile"
        >
         <Ionicons name="person" size={24} color="white" />
       </Pressable>
     </View>
      <TouchableOpacity
        onPress={() => router.push('/search')}
        className="flex-row items-center bg-gray-100 rounded-lg p-3 mb-3"
      >
        <Ionicons name="search" size={20} color="#666" />
        <Text className="ml-2 text-gray-500">{t('products.searchItems')}</Text>
      </TouchableOpacity>

      {/* Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="py-2"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {CATEGORIES.map((category) => {
          const categoryKey = category.toLowerCase().replace(' ', '');
          const translatedCategory = category === 'All' 
            ? t('products.allCategories') 
            : t(`products.categories.${categoryKey}`, category);
          
          return (
            <TouchableOpacity
              key={category}
              onPress={() => setSelectedCategory(category)}
              className={`mr-3 px-4 h-10 min-w-[70px] flex-row items-center justify-center rounded-full border ${
                selectedCategory === category ? 'bg-black border-black' : 'bg-white border-gray-300'
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  selectedCategory === category ? 'text-white' : 'text-gray-800'
                }`}
              >
                {translatedCategory}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/product/${item.id}`)}
              className="mb-4 bg-white rounded-xl shadow-md overflow-hidden"
            >
              <Image source={{ uri: item.imageUrl }} className="w-full h-48" resizeMode="cover" />
              <View className="p-4">
                <Text className="text-lg font-semibold text-gray-800">{item.name}</Text>
                <Text className="text-gray-600 mt-1" numberOfLines={2}>
                  {item.description}
                </Text>
                <Text className="mt-2 font-bold text-blue-600">
                  {formatPrice(item.price, item.currency)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* Floating Add New Item Button (shifted left so it doesn't overlap the chat bubble) */}
        <TouchableOpacity
          onPress={() => router.push('/AddProduct')}
          className="absolute bottom-6 right-6 bg-blue-600 w-16 h-16 rounded-full items-center justify-center shadow-lg"
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
