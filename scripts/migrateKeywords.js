/**
 * Migration Script: Move Search Keywords to Separate Collection
 * 
 * This script migrates existing products with searchKeywords array field
 * to the new separate searchKeywords collection.
 * 
 * Run: node scripts/migrateKeywords.js
 */

import { collection, deleteField, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig.js';
import { generateSearchKeywords, saveKeywordsToCollection } from '../services/searchKeywordService.js';

async function migrateKeywordsToSeparateCollection() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Starting Search Keywords Migration');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    
    console.log(`📦 Found ${snapshot.size} products to process\n`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const docSnapshot of snapshot.docs) {
      try {
        const product = docSnapshot.data();
        const productId = docSnapshot.id;
        
        console.log(`\n📝 Processing: ${product.name || 'Unnamed Product'}`);
        console.log(`   ID: ${productId}`);
        
        // Generate keywords from product data
        const keywords = generateSearchKeywords({
          name: product.name || '',
          description: product.description || '',
          category: product.category || '',
          condition: product.condition || '',
          tags: product.tags || []
        });
        
        if (keywords.length === 0) {
          console.log('   ⚠️  No keywords generated (empty product data)');
          skippedCount++;
          continue;
        }
        
        console.log(`   🔑 Generated ${keywords.length} keywords: ${keywords.slice(0, 5).join(', ')}${keywords.length > 5 ? '...' : ''}`);
        
        // Save to separate keywords collection (ONE document per product with keywords array)
        await saveKeywordsToCollection(productId, keywords);
        console.log(`   ✅ Saved to searchKeywords collection`);
        
        // Optional: Remove searchKeywords field from product document
        // Uncomment the following if you want to clean up the old field
        /*
        if (product.searchKeywords) {
          await updateDoc(doc(db, 'products', productId), {
            searchKeywords: deleteField()
          });
          console.log(`   🧹 Removed old searchKeywords field from product`);
        }
        */
        
        migratedCount++;
        
      } catch (error) {
        errorCount++;
        const errorMsg = `Product ${docSnapshot.id}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`   ❌ Error: ${error.message}`);
      }
    }
    
    // Print summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Migration Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`   Total products:     ${snapshot.size}`);
    console.log(`   ✅ Migrated:        ${migratedCount}`);
    console.log(`   ⚠️  Skipped:         ${skippedCount}`);
    console.log(`   ❌ Errors:          ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ Error Details:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err}`);
      });
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Migration Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Next steps
    console.log('📋 Next Steps:');
    console.log('   1. Check Firestore Console to verify searchKeywords collection');
    console.log('   2. Test search functionality in the app');
    console.log('   3. Create required Firestore composite indexes when prompted');
    console.log('   4. (Optional) Uncomment code to remove old searchKeywords field\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed with critical error:', error);
    process.exit(1);
  }
}

// Run migration
migrateKeywordsToSeparateCollection()
  .then(() => {
    console.log('👋 Exiting migration script...\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
