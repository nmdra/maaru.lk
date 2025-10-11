import { collection, deleteDoc, doc, getDocs, query, setDoc, Timestamp, where } from 'firebase/firestore';
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
 * Get all keyword documents to search with advanced matching
 * Returns documents with their keywords and tags for scoring
 * 
 * @returns {Promise<Array<Object>>} - Array of keyword documents
 */
export const getAllKeywordDocuments = async () => {
  try {
    const snapshot = await getDocs(collection(db, SEARCH_KEYWORDS_COLLECTION));
    return snapshot.docs.map(doc => ({
      productId: doc.data().productId,
      keywords: doc.data().keywords || [],
      tags: doc.data().tags || [],
    }));
  } catch (error) {
    console.error('Error getting keyword documents:', error);
    throw error;
  }
};

/**
 * Calculate relevance score for a product based on search terms
 * Higher score = better match
 * 
 * @param {Object} keywordDoc - Keyword document with productId, keywords, tags
 * @param {Array<string>} searchTerms - Search terms from user
 * @param {string} originalSearchText - Original search text (for phrase matching)
 * @returns {number} - Relevance score
 */
export const calculateRelevanceScore = (keywordDoc, searchTerms, originalSearchText) => {
  let score = 0;
  const { keywords = [], tags = [] } = keywordDoc;
  
  // Convert to lowercase for comparison
  const lowerKeywords = keywords.map(k => k.toLowerCase());
  const lowerTags = tags.map(t => t.toLowerCase());
  const lowerSearchText = originalSearchText.toLowerCase();
  
  // 1. Exact phrase match in keywords (highest priority) +100
  if (lowerKeywords.includes(lowerSearchText)) {
    score += 100;
  }
  
  // 2. Exact tag match (very high priority) +80
  if (lowerTags.includes(lowerSearchText)) {
    score += 80;
  }
  
  // 3. Each search term exact match in keywords +20
  searchTerms.forEach(term => {
    if (lowerKeywords.includes(term)) {
      score += 20;
    }
  });
  
  // 4. Each search term exact match in tags +15
  searchTerms.forEach(term => {
    if (lowerTags.some(tag => tag === term)) {
      score += 15;
    }
  });
  
  // 5. Partial match in keywords +10
  searchTerms.forEach(term => {
    if (lowerKeywords.some(k => k.includes(term))) {
      score += 10;
    }
  });
  
  // 6. Partial match in tags +8
  searchTerms.forEach(term => {
    if (lowerTags.some(tag => tag.includes(term))) {
      score += 8;
    }
  });
  
  // 7. All search terms found (bonus) +30
  const allTermsFound = searchTerms.every(term =>
    lowerKeywords.some(k => k.includes(term)) || 
    lowerTags.some(t => t.includes(term))
  );
  if (allTermsFound && searchTerms.length > 1) {
    score += 30;
  }
  
  return score;
};

/**
 * Search products by multiple keywords with relevance scoring
 * Returns ranked product IDs based on match quality
 * 
 * @param {string} searchText - The search text (will be split into words)
 * @returns {Promise<Array<string>>} - Array of product IDs sorted by relevance
 */
export const searchProductsByKeywords = async (searchText) => {
  try {
    const trimmedSearch = searchText.trim().toLowerCase();
    
    if (!trimmedSearch || trimmedSearch.length < 2) {
      return [];
    }
    
    // Split into individual search terms
    const searchTerms = trimmedSearch.split(/\s+/).filter(word => word.length >= 2);
    
    if (searchTerms.length === 0) {
      return [];
    }

    // Get all keyword documents
    const allDocs = await getAllKeywordDocuments();
    
    if (allDocs.length === 0) {
      console.log('🔍 No keyword documents found');
      return [];
    }
    
    // Calculate relevance score for each product
    const scoredProducts = allDocs
      .map(doc => ({
        productId: doc.productId,
        score: calculateRelevanceScore(doc, searchTerms, trimmedSearch),
      }))
      .filter(item => item.score > 0) // Only include products with matches
      .sort((a, b) => b.score - a.score); // Sort by score descending
    
    const rankedProductIds = scoredProducts.map(item => item.productId);
    
    console.log(`🔍 Search "${searchText}" found ${rankedProductIds.length} products (ranked by relevance)`);
    if (rankedProductIds.length > 0) {
      console.log(`   Top match score: ${scoredProducts[0].score}`);
    }
    
    return rankedProductIds;
  } catch (error) {
    console.error('Error searching products by keywords:', error);
    throw error;
  }
};

/**
 * Get popular tags across all products
 * Useful for search suggestions and filters
 * 
 * @param {number} limit - Maximum number of tags to return
 * @returns {Promise<Array<Object>>} - Array of {tag, count} sorted by frequency
 */
export const getPopularTags = async (limit = 20) => {
  try {
    const snapshot = await getDocs(collection(db, SEARCH_KEYWORDS_COLLECTION));
    const tagCounts = new Map();
    
    snapshot.docs.forEach(doc => {
      const tags = doc.data().tags || [];
      tags.forEach(tag => {
        const lowerTag = tag.toLowerCase();
        tagCounts.set(lowerTag, (tagCounts.get(lowerTag) || 0) + 1);
      });
    });
    
    // Convert to array and sort by count
    const sortedTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    console.log(`📊 Found ${sortedTags.length} popular tags`);
    return sortedTags;
  } catch (error) {
    console.error('Error getting popular tags:', error);
    throw error;
  }
};

/**
 * Get search suggestions based on partial input
 * Returns matching keywords and tags
 * 
 * @param {string} partialText - Partial search text
 * @param {number} limit - Maximum suggestions to return
 * @returns {Promise<Array<string>>} - Array of suggestions
 */
export const getSearchSuggestions = async (partialText, limit = 10) => {
  try {
    const partial = partialText.trim().toLowerCase();
    
    if (!partial || partial.length < 2) {
      return [];
    }
    
    const allDocs = await getAllKeywordDocuments();
    const suggestions = new Set();
    
    allDocs.forEach(doc => {
      // Check keywords
      doc.keywords.forEach(keyword => {
        if (keyword.startsWith(partial) && suggestions.size < limit) {
          suggestions.add(keyword);
        }
      });
      
      // Check tags (higher priority)
      doc.tags.forEach(tag => {
        const lowerTag = tag.toLowerCase();
        if (lowerTag.startsWith(partial) && suggestions.size < limit) {
          suggestions.add(tag); // Keep original case for tags
        }
      });
    });
    
    console.log(`💡 Found ${suggestions.size} suggestions for "${partialText}"`);
    return Array.from(suggestions).slice(0, limit);
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
};
