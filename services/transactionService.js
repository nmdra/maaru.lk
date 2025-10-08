import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';

const TRANSACTIONS_COLLECTION = 'transactions';

/**
 * Create a new transaction record
 * @param {Object} transactionData - The transaction data
 * @param {string} transactionData.orderId - Associated order ID
 * @param {string} transactionData.productId - Product ID
 * @param {string} transactionData.buyerId - Buyer user ID
 * @param {string} transactionData.sellerId - Seller user ID
 * @param {number} transactionData.amount - Transaction amount
 * @param {string} transactionData.currency - Currency code
 * @param {string} transactionData.paymentMethod - Payment method used
 * @param {string} transactionData.stripePaymentIntentId - Stripe payment intent ID (if applicable)
 * @param {Object} transactionData.paymentDetails - Additional payment details
 * @returns {Promise<string>} - The created transaction ID
 */
export async function createTransaction(transactionData) {
  try {
    const transaction = {
      orderId: transactionData.orderId,
      productId: transactionData.productId,
      buyerId: transactionData.buyerId,
      sellerId: transactionData.sellerId,
      amount: transactionData.amount,
      currency: transactionData.currency,
      paymentMethod: transactionData.paymentMethod,
      stripePaymentIntentId: transactionData.stripePaymentIntentId || null,
      paymentDetails: transactionData.paymentDetails || {},
      status: 'completed', // completed, pending, failed, refunded
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), transaction);
    return docRef.id;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

/**
 * Get transactions for a specific user
 * @param {string} userId - User ID
 * @param {string} role - 'buyer' or 'seller'
 * @returns {Promise<Array>} - Array of transactions
 */
export async function getUserTransactions(userId, role = 'buyer') {
  try {
    const fieldName = role === 'buyer' ? 'buyerId' : 'sellerId';
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where(fieldName, '==', userId)
    );
    
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return transactions.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    throw error;
  }
}

/**
 * Get transactions for a specific order
 * @param {string} orderId - Order ID
 * @returns {Promise<Array>} - Array of transactions
 */
export async function getOrderTransactions(orderId) {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where('orderId', '==', orderId)
    );
    
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return transactions.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
  } catch (error) {
    console.error('Error fetching order transactions:', error);
    throw error;
  }
}

/**
 * Get transactions for a specific product
 * @param {string} productId - Product ID
 * @returns {Promise<Array>} - Array of transactions
 */
export async function getProductTransactions(productId) {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where('productId', '==', productId)
    );
    
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return transactions.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
  } catch (error) {
    console.error('Error fetching product transactions:', error);
    throw error;
  }
}