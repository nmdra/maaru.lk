import { collection, getDocs, limit, orderBy, query, startAfter, where } from 'firebase/firestore';
import { db } from './firebaseConfig';

const PRODUCTS_COLLECTION = 'products';

/**
 * Fetch products with search, category, price range, and pagination.
 */
export async function fetchProducts({
  search = '',
  category = 'All',
  minPrice = null,
  maxPrice = null,
  cursor = null,
  limit: pageSize = 10,
}) {
  try {
    let q = collection(db, PRODUCTS_COLLECTION);
    const conditions = [];

    // Search by name
    const searchTerm = search.trim();
    if (searchTerm) {
      conditions.push(where('name', '>=', searchTerm));
      conditions.push(where('name', '<=', searchTerm + '\uf8ff'));
    }

    // Category filter
    if (category && category !== 'All') {
      conditions.push(where('category', '==', category));
    }

    // Price filters
    if (minPrice != null) conditions.push(where('price', '>=', minPrice));
    if (maxPrice != null) conditions.push(where('price', '<=', maxPrice));

    // Build query
    q = query(q, ...conditions, orderBy('name'), limit(pageSize));

    if (cursor) {
      q = query(q, startAfter(cursor));
    }

    const snapshot = await getDocs(q);

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const newCursor = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { items, cursor: newCursor };
  } catch (err) {
    console.error('fetchProducts error:', err);
    throw err;
  }
}
