// items.js
import { collection, getDocs, limit, orderBy, query, startAfter, where } from 'firebase/firestore';
import { db } from './firebaseConfig';

const PRODUCTS_COLLECTION = 'products';

/**
 * Fetch products from Firestore
 * @param {Object} params
 * @param {string} params.search - Search term (optional)
 * @param {Object|null} params.cursor - Firestore document snapshot for pagination
 * @param {number} params.pageSize - Number of items to fetch
 * @returns {Promise<{items: Array, cursor: Object|null}>}
 */
export async function fetchProducts({ search = '', cursor = null, pageSize = 10 }) {
  try {
    console.log('Fetching products...', {
      search,
      cursorId: cursor?.id || null,
      pageSize,
    });

    let q;

    // 🔍 Search Query
    if (search.trim()) {
      const searchTerm = search.trim();
      q = query(
        collection(db, PRODUCTS_COLLECTION),
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff'),
        orderBy('name'),
        limit(pageSize),
      );
    } else {
      // 📜 Default Query (sorted by name)
      q = query(collection(db, PRODUCTS_COLLECTION), orderBy('name'), limit(pageSize));

      // ⏩ Pagination
      if (cursor) {
        q = query(
          collection(db, PRODUCTS_COLLECTION),
          orderBy('name'),
          startAfter(cursor),
          limit(pageSize),
        );
      }
    }

    // 🔥 Fetch from Firestore
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const newCursor = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { items, cursor: newCursor };
  } catch (err) {
    console.error('❌ fetchProducts error:', err);
    throw err;
  }
}
