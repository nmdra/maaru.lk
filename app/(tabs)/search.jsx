import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import debounce from 'lodash.debounce';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SafeAreaView, Text, View } from 'react-native';
import BottomNavigation from '../../components/BottomNavigation';
import Header from '../../components/Header';
import Colors from '../../constants/Colors';
import FilterBar from '../../components/product/FilterBar';
import Loader from '../../components/product/Loader';
import ProductCard from '../../components/product/ProductCard';
import SearchBar from '../../components/product/SearchBar';
import useProducts from '../../hooks/useProducts';

export default function ProductsScreen() {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ category: 'All', minPrice: null, maxPrice: null });

  const {
    items,
    loading,
    refreshing,
    hasMore,
    error,
    search,
    setSearch,
    fetchFirstPage,
    fetchNextPage,
    refresh,
  } = useProducts(filters);

  useEffect(() => {
    fetchFirstPage();
  }, [filters]);

  const onChangeText = debounce((text) => {
    setSearch(text);
    fetchFirstPage(text);
  }, 300);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.background.primary }}>
      <Header />
      
      <View className="flex-1" style={{ backgroundColor: Colors.background.primary }}>
        <SearchBar
          value={search}
          onChangeText={onChangeText}
          onClear={() => {
            setSearch('');
            fetchFirstPage('');
          }}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />

      {showFilters && (
        <FilterBar
          selectedCategory={filters.category}
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onApply={(newFilters) => {
            setFilters(newFilters);
            setShowFilters(false); // auto-hide filters on apply
          }}
        />
      )}

      {loading && items.length === 0 ? (
        <Loader />
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <Ionicons name="search-outline" size={64} color={Colors.gray[300]} />
          <Text className="text-lg font-semibold mt-4" style={{ color: Colors.text.secondary }}>
            No products found
          </Text>
          {search ? (
            <Text className="text-center mt-2" style={{ color: Colors.text.tertiary }}>
              Try different keywords or adjust filters
            </Text>
          ) : (
            <Text className="text-center mt-2" style={{ color: Colors.text.tertiary }}>
              Start searching to find products
            </Text>
          )}
        </View>
      ) : (
        <FlashList
          data={items}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              name={item.name}
              price={item.price}
              currency={item.currency}
              imageUrl={item.imageUrl}
              onPress={() => router.push(`/product/${item.id}`)}
            />
          )}
          estimatedItemSize={200}
          contentContainerStyle={{ padding: 8 }}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasMore && !loading) fetchNextPage();
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListFooterComponent={
            loading && items.length > 0 ? <ActivityIndicator className="my-4" /> : null
          }
        />
      )}

      {error && (
        <View className="p-3">
          <Text style={{ color: Colors.error }}>{String(error)}</Text>
        </View>
      )}
      </View>

      {/* Floating AI Search Button - Fixed position in bottom right, above footer */}
      <View className="absolute bottom-24 right-6">
        <Pressable
          onPress={() => router.push('/search/ai-search')}
          className="w-16 h-16 rounded-full items-center justify-center shadow-lg active:opacity-80"
          style={{
            backgroundColor: Colors.accent,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 5,
          }}
        >
          <Ionicons name="sparkles" size={28} color="#fff" />
        </Pressable>
      </View>

      {/* <BottomNavigation currentRoute="/(tabs)/search" /> */}
    </SafeAreaView>
  );
}
