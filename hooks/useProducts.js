import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, limit, query, startAfter, where } from 'firebase/firestore';
import { useState } from 'react';
import { db } from '../services/firebaseConfig';

export default function useProducts(filters) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [search, setSearch] = useState('');

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

  const buildQuery = (startAfterDoc = null) => {
    let q = collection(db, 'products');

    // Category filter
    if (filters.category && filters.category !== 'All') {
      if (filters.category === 'Swap Only') {
        q = query(q, where('swapOnly', '==', true));
      } else {
        q = query(q, where('category', '==', filters.category));
      }
    }

    // Price filters
    if (filters.minPrice != null) q = query(q, where('price', '>=', filters.minPrice));
    if (filters.maxPrice != null) q = query(q, where('price', '<=', filters.maxPrice));

    // Search filter
    if (search) {
      q = query(q, where('name', '>=', search), where('name', '<=', search + '\uf8ff'));
    }

    // Pagination
    if (startAfterDoc) q = query(q, startAfter(startAfterDoc));

    // Limit
    q = query(q, limit(20));

    return q;
  };

  // --- Fetch first page with cache ---
  const fetchFirstPage = async (searchText = '') => {
    setLoading(true);
    setSearch(searchText);

    const key = cacheKey(searchText);

    // Load cached data first
    const cached = await loadFromCache(key);
    if (cached) setItems(cached);

    try {
      const q = buildQuery();
      const snapshot = await getDocs(q);
      const fetchedItems = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setItems(fetchedItems);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(fetchedItems.length > 0);

      // Save fresh data to cache
      await saveToCache(key, fetchedItems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch next page ---
  const fetchNextPage = async () => {
    if (!lastDoc || !hasMore) return;
    setLoading(true);
    try {
      const q = buildQuery(lastDoc);
      const snapshot = await getDocs(q);
      const fetchedItems = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setItems((prev) => [...prev, ...fetchedItems]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(fetchedItems.length > 0);

      // Update cache with merged data
      const key = cacheKey(search);
      await saveToCache(key, [...items, ...fetchedItems]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => fetchFirstPage(search);

  return {
    items,
    loading,
    hasMore,
    fetchFirstPage,
    fetchNextPage,
    refresh,
    setSearch,
    search,
  };
}