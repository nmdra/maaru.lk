import { addDoc, collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from './firebaseConfig';

const ORDERS_COLLECTION = 'orders';

/**
 * Create a new order
 * @param {Object} orderData - The order data
 * @param {string} orderData.productId - ID of the product being ordered
 * @param {string} orderData.productOwnerId - ID of the product owner
 * @param {string} orderData.buyerId - ID of the buyer (logged in user)
 * @param {string} orderData.buyerEmail - Email of the buyer
 * @param {string} orderData.productName - Name of the product
 * @param {number} orderData.quantity - Quantity ordered
 * @param {number} orderData.price - Unit price
 * @param {string} orderData.currency - Currency code
 * @param {number} orderData.total - Total amount
 * @param {string} orderData.paymentMethod - Payment method used
 * @param {Object} orderData.shippingAddress - Shipping address
 * @param {string} orderData.phoneNumber - Contact phone number
 * @returns {Promise<string>} - The created order ID
 */
export async function createOrder(orderData) {
  try {
    const order = {
      productId: orderData.productId,
      productOwnerId: orderData.productOwnerId,
      buyerId: orderData.buyerId,
      buyerEmail: orderData.buyerEmail,
      productName: orderData.productName,
      quantity: orderData.quantity,
      price: orderData.price,
      currency: orderData.currency,
      total: orderData.total,
      paymentMethod: orderData.paymentMethod,
      shippingAddress: orderData.shippingAddress,
      phoneNumber: orderData.phoneNumber,
      status: 'confirmed', // confirmed, processing, shipped, delivered, cancelled
      orderNumber: `MR-${Date.now().toString().slice(-8)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    };

    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), order);
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Update order status
 * @param {string} orderId - The order ID
 * @param {string} status - New status (confirmed, processing, shipped, delivered, cancelled)
 * @returns {Promise<void>}
 */
export async function updateOrderStatus(orderId, status) {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

/**
 * Get orders for a specific user
 * @param {string} userId - User ID
 * @param {string} role - 'buyer' or 'seller'
 * @returns {Promise<Array>} - Array of orders
 */
export async function getUserOrders(userId, role = 'buyer') {
  try {
    const fieldName = role === 'buyer' ? 'buyerId' : 'productOwnerId';
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where(fieldName, '==', userId)
    );
    
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return orders.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
}

/**
 * Get orders for a specific product
 * @param {string} productId - Product ID
 * @returns {Promise<Array>} - Array of orders
 */
export async function getProductOrders(productId) {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('productId', '==', productId)
    );
    
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return orders.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
  } catch (error) {
    console.error('Error fetching product orders:', error);
    throw error;
  }
}