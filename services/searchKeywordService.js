import { addDoc, collection, deleteDoc, doc, getDocs, query, setDoc, Timestamp, where } from 'firebase/firestore';
import { db } from './firebaseConfig';

const SEARCH_KEYWORDS_COLLECTION = 'searchKeywords';

/**
 * Generate searchable keywords from product data
 * Extracts words from name, description, category, condition, tags
 * Filters out short words (< 2 chars) and converts to lowercase
 * 
 * @param {Object} productData - Product information
 * @returns {Array<string>} - Array of unique lowercase keywords
 */
export const generateSearchKeywords = (productData) => {
  const { name = '', description = '', category = '', condition = '', tags = [] } = productData;
  
  const keywords = new Set();

  // Extract words from name
  if (name) {
    name.split(/\s+/).forEach(word => {
      const cleaned = word.toLowerCase().trim();
      if (cleaned.length >= 2) keywords.add(cleaned);
    });
  }

  // Extract words from description
  if (description) {
    description.split(/\s+/).forEach(word => {
      const cleaned = word.toLowerCase().trim();
      if (cleaned.length >= 2) keywords.add(cleaned);
    });
  }

  // Add category as keyword
  if (category && category !== 'All') {
    const cleaned = category.toLowerCase().trim();
    if (cleaned.length >= 2) keywords.add(cleaned);
  }

  // Add condition words
  if (condition) {
    condition.split(/\s+/).forEach(word => {
      const cleaned = word.toLowerCase().trim();
      if (cleaned.length >= 2) keywords.add(cleaned);
    });
  }

  // Add tags (both whole tag and individual words)
  if (Array.isArray(tags)) {
    tags.forEach(tag => {
      if (typeof tag === 'string') {
        const cleaned = tag.toLowerCase().trim();
        
        // Add the whole tag as a keyword
        if (cleaned.length >= 2) {
          keywords.add(cleaned);
        }
        
        // Also add individual words from multi-word tags
        cleaned.split(/\s+/).forEach(word => {
          const wordCleaned = word.trim();
          if (wordCleaned.length >= 2) {
            keywords.add(wordCleaned);
          }
        });
      }
    });
  }

  return Array.from(keywords);
};

/**
 * Save keywords to separate collection
 * Creates ONE document with productId as the document ID
 * 
 * @param {string} productId - The product ID (used as document ID)
 * @param {Array<string>} keywords - Array of keywords
 * @param {Array<string>} tags - Optional array of original tags
 * @returns {Promise<void>}
 */
export const saveKeywordsToCollection = async (productId, keywords, tags = []) => {
  try {
    if (!productId || !Array.isArray(keywords) || keywords.length === 0) {
      console.log('No keywords to save for product:', productId);
      return;
    }

    // Use productId as the document ID (not auto-generated)
    await setDoc(doc(db, SEARCH_KEYWORDS_COLLECTION, productId), {
      productId: productId,
      keywords: keywords.map(k => k.toLowerCase()), // Array of all keywords
      tags: tags || [], // Store original tags for reference
      createdAt: Timestamp.now(),
    });

    console.log(`✅ Saved ${keywords.length} keywords and ${tags.length} tags for product ${productId}`);
  } catch (error) {
    console.error('Error saving keywords to collection:', error);
    throw error;
  }
};

/**
 * Delete all keywords associated with a product
 * Used when product is deleted or needs keyword refresh
 * 
 * @param {string} productId - The product ID (also the document ID)
 * @returns {Promise<void>}
 */
export const deleteKeywordsForProduct = async (productId) => {
  try {
    // Delete the document with productId as the document ID
    await deleteDoc(doc(db, SEARCH_KEYWORDS_COLLECTION, productId));
    
    console.log(`✅ Deleted keywords for product ${productId}`);
  } catch (error) {
    console.error('Error deleting keywords for product:', error);
    throw error;
  }
};

/**
 * Update keywords for a product
 * Deletes old keyword document and creates new one with updated keywords array
 * 
 * @param {string} productId - The product ID
 * @param {Object} productData - Updated product data
 * @returns {Promise<void>}
 */
export const updateKeywordsForProduct = async (productId, productData) => {
  try {
    // Delete old keyword document
    await deleteKeywordsForProduct(productId);
    
    // Generate new keywords
    const keywords = generateSearchKeywords(productData);
    
    // Save new keywords
    await saveKeywordsToCollection(productId, keywords);
    
    console.log(`✅ Updated keywords for product ${productId}`);
  } catch (error) {
    console.error('Error updating keywords for product:', error);
    throw error;
  }
};

/**
 * Get all product IDs that match a search keyword
 * Uses array-contains query on keywords array
 * 
 * @param {string} searchTerm - The search term
 * @returns {Promise<Array<string>>} - Array of product IDs
 */
export const getProductIdsByKeyword = async (searchTerm) => {
  try {
    const keyword = searchTerm.trim().toLowerCase();
    
    if (!keyword || keyword.length < 2) {
      return [];
    }

    // Query documents where keywords array contains the search term
    const q = query(
      collection(db, SEARCH_KEYWORDS_COLLECTION),
      where('keywords', 'array-contains', keyword)
    );
    
    const snapshot = await getDocs(q);
    
    // Get unique product IDs
    const productIds = [...new Set(snapshot.docs.map(doc => doc.data().productId))];
    
    console.log(`🔍 Found ${productIds.length} products matching keyword: ${keyword}`);
    return productIds;
  } catch (error) {
    console.error('Error getting products by keyword:', error);
    throw error;
  }
};

/**
 * Search products by multiple keywords (OR logic)
 * Returns product IDs that match any of the provided keywords
 * 
 * @param {string} searchText - The search text (will be split into words)
 * @returns {Promise<Array<string>>} - Array of unique product IDs
 */
export const searchProductsByKeywords = async (searchText) => {
  try {
    const words = searchText.trim().toLowerCase().split(/\s+/)
      .filter(word => word.length >= 2);
    
    if (words.length === 0) {
      return [];
    }

    // Search for each word
    const searchPromises = words.map(word => getProductIdsByKeyword(word));
    const results = await Promise.all(searchPromises);
    
    // Combine all results and remove duplicates
    const allProductIds = results.flat();
    const uniqueProductIds = [...new Set(allProductIds)];
    
    console.log(`🔍 Search "${searchText}" found ${uniqueProductIds.length} unique products`);
    return uniqueProductIds;
  } catch (error) {
    console.error('Error searching products by keywords:', error);
    throw error;
  }
};
