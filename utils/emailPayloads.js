/**
 * Email payload utilities for Maaru marketplace
 * Creates standardized payloads for buyer confirmations and seller notifications
 */

export const createBuyerConfirmationPayload = (orderData, productData, userData) => {
  return {
    emailType: 'buyer_confirmation',
    to: userData.email || orderData.buyerEmail,
    subject: `Order Confirmation - ${orderData.orderNumber} | Maaru`,
    templateData: {
      buyerName: userData.displayName || userData.name || userData.email?.split('@')[0] || 'Valued Customer',
      orderNumber: orderData.orderNumber,
      productName: productData.name,
      productImage: productData.imageUrl,
      productCategory: productData.category || 'Others',
      productCondition: productData.condition || 'Good',
      quantity: orderData.quantity,
      price: orderData.price,
      total: orderData.total,
      currency: orderData.currency || 'LKR',
      paymentMethod: orderData.paymentMethod,
      shippingAddress: orderData.shippingAddress,
      phoneNumber: orderData.phoneNumber,
      orderDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      trackingLink: `https://maaru.lk/orders/${orderData.orderNumber}`,
      supportEmail: 'support@maaru.lk'
    }
  };
};

export const createSellerNotificationPayload = (orderData, productData, buyerData, sellerData) => {
  return {
    emailType: 'seller_notification',
    to: sellerData.email,
    subject: `New Sale - ${productData.name} | Maaru`,
    templateData: {
      sellerName: sellerData.displayName || sellerData.name || sellerData.email?.split('@')[0] || 'Seller',
      orderNumber: orderData.orderNumber,
      productName: productData.name,
      productImage: productData.imageUrl,
      productCategory: productData.category || 'Others',
      productCondition: productData.condition || 'Good',
      buyerName: buyerData.displayName || buyerData.name || buyerData.email?.split('@')[0] || 'Buyer',
      buyerEmail: buyerData.email || orderData.buyerEmail,
      buyerPhone: orderData.phoneNumber,
      quantity: orderData.quantity,
      price: orderData.price,
      total: orderData.total,
      currency: orderData.currency || 'LKR',
      paymentMethod: orderData.paymentMethod,
      shippingAddress: orderData.shippingAddress,
      orderDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      orderDetailsLink: `https://maaru.lk/seller/orders/${orderData.orderNumber}`,
      supportEmail: 'support@maaru.lk'
    }
  };
};

/**
 * Validates email payload data to ensure all required fields are present
 */
export const validateEmailPayload = (payload) => {
  const requiredFields = ['emailType', 'to', 'subject', 'templateData'];
  const missingFields = requiredFields.filter(field => !payload[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required email fields: ${missingFields.join(', ')}`);
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payload.to)) {
    throw new Error('Invalid email address format');
  }
  
  // Prevent sending to fake/example domains
  const forbiddenDomains = ['example.com', 'test.com', 'fake.com', 'dummy.com'];
  const emailDomain = payload.to.split('@')[1];
  if (forbiddenDomains.includes(emailDomain)) {
    throw new Error(`Cannot send email to test domain: ${emailDomain}`);
  }
  
  return true;
};

/**
 * Formats currency for display in emails
 */
export const formatCurrencyForEmail = (amount, currency = 'LKR') => {
  return `${currency} ${amount.toLocaleString()}`;
};