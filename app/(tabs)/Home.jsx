import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../../components/Header';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { fetchProducts } from '../../services/productService';
import formatPrice from '../../utils/formatPrice';
import { useAppI18n } from '../../utils/i18n';

const CATEGORIES = ['All', 'Shoes', 'Clothes', 'Accessories', 'Electronics', 'Books', 'Others'];

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useAppI18n();
  const { user } = useAuth();
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

  // Handler for Add Product button - check authentication
  const handleAddProduct = () => {
    if (!user) {
      Alert.alert(
        t('common.loginRequired', 'Login Required'),
        t('common.loginToAddProduct', 'Please login to add products'),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          { 
            text: t('common.login', 'Login'), 
            onPress: () => router.push('/(auth)/Login')
          }
        ]
      );
      return;
    }
    router.push('/AddProduct');
  };

  if (loading)
    return (
      <SafeAreaView className="flex-1 justify-center items-center" style={{ backgroundColor: Colors.background.primary }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </SafeAreaView>
    );

  // Header + Search + Category Chips as FlatList header
  const renderHeader = () => (
    <View className="px-4 pt-4 pb-2" style={{ backgroundColor: Colors.white }}>
      {/* Search Bar */}
      <TouchableOpacity
        onPress={() => router.push('/search')}
        className="flex-row items-center rounded-lg p-3 mb-3"
        style={{ backgroundColor: Colors.background.tertiary }}
      >
        <Ionicons name="search" size={20} color={Colors.text.secondary} />
        <Text className="ml-2" style={{ color: Colors.text.secondary }}>{t('products.searchItems')}</Text>
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
              className="mr-3 px-4 h-10 min-w-[70px] flex-row items-center justify-center rounded-full border"
              style={{
                backgroundColor: selectedCategory === category ? Colors.accent : Colors.white,
                borderColor: selectedCategory === category ? Colors.accent : Colors.border.default,
              }}
            >
              <Text
                className="text-center font-medium"
                style={{
                  color: selectedCategory === category ? Colors.white : Colors.text.primary,
                }}
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.background.primary }}>
      {/* Fixed Header - Not scrollable */}
      <Header />
      
      <View className="flex-1">
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/product/${item.id}`)}
              className="mb-4 rounded-xl shadow-md overflow-hidden"
              style={{ backgroundColor: Colors.card.background }}
            >
              <Image source={{ uri: item.imageUrl }} className="w-full h-48" resizeMode="cover" />
              <View className="p-4">
                <Text className="text-lg font-semibold" style={{ color: Colors.text.primary }}>{item.name}</Text>
                <Text className="mt-1" numberOfLines={2} style={{ color: Colors.text.secondary }}>
                  {item.description}
                </Text>
                <Text className="mt-2 font-bold" style={{ color: Colors.info }}>
                  {formatPrice(item.price, item.currency)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* Floating Add New Item Button (shifted left so it doesn't overlap the chat bubble) */}
        <TouchableOpacity
          onPress={handleAddProduct}
          className="absolute bottom-6 right-6 w-16 h-16 rounded-full items-center justify-center shadow-lg"
          style={{ backgroundColor: Colors.button.primary }}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
