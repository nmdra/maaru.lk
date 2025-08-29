import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import debounce from 'lodash.debounce';
import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native';
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
    <View className="flex-1 bg-white">
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
      ) : (
        <FlashList
          data={items}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              name={item.name}
              priceCents={item.priceCents}
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
          <Text className="text-red-500">{String(error)}</Text>
        </View>
      )}
    </View>
  );
}
