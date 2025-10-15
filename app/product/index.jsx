import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import debounce from 'lodash.debounce';
import { useEffect } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomNavigation from '../../components/BottomNavigation';
import Header from '../../components/Header';
import Loader from '../../components/product/Loader';
import ProductCard from '../../components/product/ProductCard';
import SearchBar from '../../components/product/SearchBar';
import useProducts from '../../hooks/useProducts';

export default function ProductsScreen() {
  const router = useRouter();
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
  } = useProducts();

  useEffect(() => {
    fetchFirstPage();
  }, []);

  const onChangeText = debounce((text) => {
    setSearch(text);
    fetchFirstPage(text);
  }, 300);

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      
      <View style={{ flex: 1 }}>
        <SearchBar
          defaultValue={search}
          onChangeText={onChangeText}
          onClear={() => {
            setSearch('');
            fetchFirstPage('');
          }}
        />

      {loading && items.length === 0 ? (
        <Loader />
      ) : (
        <FlashList
          data={items}
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
          estimatedItemSize={120}
          contentContainerStyle={styles.listContent}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasMore && !loading) fetchNextPage();
          }}
          ListFooterComponent={
            loading && items.length > 0 ? (
              <ActivityIndicator style={{ marginVertical: 16 }} />
            ) : null
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        />
      )}

      {error && (
        <View style={{ padding: 12 }}>
          <Text style={{ color: 'red' }}>{String(error)}</Text>
        </View>
      )}
      </View>
      
      <BottomNavigation currentRoute="/product" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  listContent: { padding: 12, paddingBottom: 24 },
});
