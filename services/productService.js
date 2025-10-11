import { collection, doc, getDoc, getDocs, limit, orderBy, query, startAfter, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { searchProductsByKeywords } from './searchKeywordService';

const PRODUCTS_COLLECTION = 'products';

/**
 * Fetch products with search, category, price range, and pagination.
 * Only returns available products (availability === true)
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

    // Always filter for available products
    conditions.push(where('availability', '==', true));

    // If search term is provided, first get matching product IDs from keywords collection
    let productIdsFromSearch = null;
    const searchTerm = search.trim().toLowerCase();
    if (searchTerm) {
      productIdsFromSearch = await searchProductsByKeywords(searchTerm);
      
      // If no products found with keywords, return empty result
      if (productIdsFromSearch.length === 0) {
        return { items: [], cursor: null };
      }
      
      // Firestore 'in' query supports max 30 items at a time
      // For more results, we'll need to batch queries
      if (productIdsFromSearch.length > 30) {
        productIdsFromSearch = productIdsFromSearch.slice(0, 30);
      }
      
      // Filter by product IDs from keyword search
      conditions.push(where('__name__', 'in', productIdsFromSearch));
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
