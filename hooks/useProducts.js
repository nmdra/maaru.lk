// hooks/useProducts.js
import { useCallback, useRef, useState } from 'react';
import { PAGE_SIZE } from '../constants/firebase';
import { fetchProducts } from '../services/productService';

export default function useProducts() {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchingRef = useRef(false);

  // Load first page (reset on new search)
  const fetchFirstPage = useCallback(async (searchTerm = '') => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const { items: page, cursor: cur } = await fetchProducts({
        search: searchTerm,
        pageSize: PAGE_SIZE,
      });
      setItems(page);
      setCursor(cur);
      setHasMore(!!cur);
      setSearch(searchTerm);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  // Load next page (infinite scroll)
  const fetchNextPage = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return;
    fetchingRef.current = true;
    setLoading(true);

    try {
      const { items: page, cursor: cur } = await fetchProducts({
        cursor,
        search,
        pageSize: PAGE_SIZE,
      });
      setItems((prev) => [...prev, ...page]);
      setCursor(cur);
      setHasMore(!!cur);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [cursor, hasMore, search]);

  // Refresh list (pull-to-refresh)
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFirstPage(search);
    setRefreshing(false);
  }, [fetchFirstPage, search]);

  return {
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
  };
}
