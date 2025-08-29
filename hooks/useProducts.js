import { collection, getDocs, limit, query, startAfter, where } from 'firebase/firestore';
import { useState } from 'react';
import { db } from '../services/firebaseConfig';

export default function useProducts(filters) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [search, setSearch] = useState('');

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

  const fetchFirstPage = async (searchText = '') => {
    setLoading(true);
    setSearch(searchText);
    try {
      const q = buildQuery();
      const snapshot = await getDocs(q);
      const fetchedItems = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setItems(fetchedItems);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(fetchedItems.length > 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
    refreshing,
    fetchFirstPage,
    fetchNextPage,
    refresh,
    setSearch,
    search,
  };
}
