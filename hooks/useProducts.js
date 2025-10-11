import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { fetchProducts } from '../services/productService';

export default function useProducts(filters) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  const cacheKey = (searchText = '') =>
    `products_${JSON.stringify(filters)}_${searchText}`;

  // --- AsyncStorage helpers ---
  const saveToCache = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save cache', e);
    }
  };

  const loadFromCache = async (key) => {
    try {
      const json = await AsyncStorage.getItem(key);
      return json ? JSON.parse(json) : null;
    } catch (e) {
      console.error('Failed to load cache', e);
      return null;
    }
  };

  // --- Fetch first page with cache ---
  const fetchFirstPage = async (searchText = '') => {
    setLoading(true);
    setError(null);
    setSearch(searchText);
    setCursor(null); // Reset cursor

    const key = cacheKey(searchText);

    // Load cached data first for instant display
    const cached = await loadFromCache(key);
    if (cached) {
      setItems(cached);
    }

    try {
      const result = await fetchProducts({
        search: searchText,
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        cursor: null, // First page
        limit: 20,
      });

      setItems(result.items);
      setCursor(result.cursor);
      setHasMore(result.cursor !== null);

      // Save fresh data to cache
      await saveToCache(key, result.items);
      
      console.log(`✅ Fetched ${result.items.length} products (first page)`);
    } catch (err) {
      console.error('Error fetching first page:', err);
      setError(err.message || 'Failed to load products');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch next page ---
  const fetchNextPage = async () => {
    if (!cursor || !hasMore || loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await fetchProducts({
        search: search,
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        cursor: cursor, // Continue from last cursor
        limit: 20,
      });

      const newItems = [...items, ...result.items];
      setItems(newItems);
      setCursor(result.cursor);
      setHasMore(result.cursor !== null);

      // Update cache with merged data
      const key = cacheKey(search);
      await saveToCache(key, newItems);
      
      console.log(`✅ Fetched ${result.items.length} more products (page)`);
    } catch (err) {
      console.error('Error fetching next page:', err);
      setError(err.message || 'Failed to load more products');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // --- Refresh (pull to refresh) ---
  const refresh = async () => {
    setRefreshing(true);
    await fetchFirstPage(search);
    setRefreshing(false);
  };

  return {
    items,
    loading,
    refreshing,
    hasMore,
    error,
    fetchFirstPage,
    fetchNextPage,
    refresh,
    setSearch,
    search,
  };
}