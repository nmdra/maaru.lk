import { collection, getDocs, limit, orderBy, query, startAfter, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { searchProductsByKeywords } from './searchKeywordService';

const PRODUCTS_COLLECTION = 'products';

/**
 * Fetch products with search, category, price range, and pagination.
 * Only returns available products (availability === true)
 * Search results are ranked by relevance
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
    const searchTerm = search.trim().toLowerCase();
    
    // If search term is provided, use optimized ranked search
    if (searchTerm) {
      return await fetchProductsWithRankedSearch({
        search: searchTerm,
        category,
        minPrice,
        maxPrice,
        cursor,
        pageSize,
      });
    }
    
    // No search - regular query
    let q = collection(db, PRODUCTS_COLLECTION);
    const conditions = [];

    // Always filter for available products
    conditions.push(where('availability', '==', true));

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

/**
 * Fetch products with ranked search results
 * Maintains relevance order from keyword search
 * 
 * @param {Object} params - Search parameters
 * @returns {Promise<Object>} - Products with cursor
 */
async function fetchProductsWithRankedSearch({
  search,
  category,
  minPrice,
  maxPrice,
  cursor,
  pageSize,
}) {
  try {
    // Get ranked product IDs from keyword search
    const rankedProductIds = await searchProductsByKeywords(search);
    
    // If no products found, return empty
    if (rankedProductIds.length === 0) {
      console.log('🔍 No products found for search:', search);
      return { items: [], cursor: null };
    }
    
    console.log(`🔍 Found ${rankedProductIds.length} products, fetching details...`);
    
    // Fetch all matching products (we need to maintain order)
    // Split into batches of 30 (Firestore 'in' query limit)
    const allProducts = [];
    for (let i = 0; i < rankedProductIds.length; i += 30) {
      const batch = rankedProductIds.slice(i, i + 30);
      
      let q = query(
        collection(db, PRODUCTS_COLLECTION),
        where('__name__', 'in', batch),
        where('availability', '==', true)
      );
      
      // Apply additional filters
      if (category && category !== 'All') {
        q = query(q, where('category', '==', category));
      }
      if (minPrice != null) {
        q = query(q, where('price', '>=', minPrice));
      }
      if (maxPrice != null) {
        q = query(q, where('price', '<=', maxPrice));
      }
      
      const snapshot = await getDocs(q);
      const batchProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      allProducts.push(...batchProducts);
    }
    
    // Sort products by original ranking (relevance order)
    const sortedProducts = allProducts.sort((a, b) => {
      const indexA = rankedProductIds.indexOf(a.id);
      const indexB = rankedProductIds.indexOf(b.id);
      return indexA - indexB;
    });
    
    console.log(`✅ Fetched ${sortedProducts.length} products (filtered and ranked)`);
    
    // Handle pagination manually since we're maintaining custom order
    const startIndex = cursor || 0;
    const endIndex = startIndex + pageSize;
    const paginatedItems = sortedProducts.slice(startIndex, endIndex);
    
    const newCursor = endIndex < sortedProducts.length ? endIndex : null;
    
    return { 
      items: paginatedItems, 
      cursor: newCursor,
      totalResults: sortedProducts.length,
    };
  } catch (err) {
    console.error('fetchProductsWithRankedSearch error:', err);
    throw err;
  }
}
