import { createBuyerConfirmationPayload, createSellerNotificationPayload, validateEmailPayload } from './emailPayloads';

// Backend email service URL - replace with your actual backend URL
const EMAIL_SERVICE_URL = process.env.EXPO_PUBLIC_EMAIL_SERVICE_URL || 'https://maaru-stripe-api.vercel.app/api/send-email';

/**
 * Sends order confirmation email to the buyer
 */
export const sendOrderConfirmationEmail = async (orderData, productData, userData) => {
  try {
    console.log('🔄 Preparing buyer confirmation email...');
    console.log('📤 User data:', userData);
    console.log('📦 Order data:', orderData);
    
    const payload = createBuyerConfirmationPayload(orderData, productData, userData);
    console.log('📧 Email payload to send:', JSON.stringify(payload, null, 2));
    
    validateEmailPayload(payload);
    
    console.log('📧 Sending buyer confirmation email to:', payload.to);
    console.log('🔗 API URL:', EMAIL_SERVICE_URL);
    
    const response = await fetch(EMAIL_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      timeout: 30000, // 30 second timeout
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Email API error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      throw new Error(`Email service error (${response.status}): ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Buyer confirmation email sent successfully:', result);
    return { 
      success: true, 
      messageId: result.messageId,
      recipient: payload.to,
      type: 'buyer_confirmation'
    };
  } catch (error) {
    console.error('❌ Failed to send buyer confirmation email:', error);
    return { 
      success: false, 
      error: error.message,
      type: 'buyer_confirmation'
    };
  }
};

/**
 * Sends sale notification email to the seller
 */
export const sendSellerNotificationEmail = async (orderData, productData, buyerData, sellerData) => {
  try {
    console.log('🔄 Preparing seller notification email...');
    console.log('👤 Seller data:', sellerData);
    console.log('👤 Buyer data:', buyerData);
    
    const payload = createSellerNotificationPayload(orderData, productData, buyerData, sellerData);
    console.log('📧 Seller email payload:', JSON.stringify(payload, null, 2));
    
    validateEmailPayload(payload);
    
    console.log('📧 Sending seller notification email to:', payload.to);
    
    const response = await fetch(EMAIL_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      timeout: 30000, // 30 second timeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Email service error (${response.status}): ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Seller notification email sent successfully:', result);
    return { 
      success: true, 
      messageId: result.messageId,
      recipient: payload.to,
      type: 'seller_notification'
    };
  } catch (error) {
    console.error('❌ Failed to send seller notification email:', error);
    return { 
      success: false, 
      error: error.message,
      type: 'seller_notification'
    };
  }
};

/**
 * Sends both buyer and seller emails in parallel
 */
export const sendOrderEmails = async (orderData, productData, buyerData, sellerData) => {
  try {
    console.log('📨 Sending order completion emails...');
    
    // Send both emails in parallel for better performance
    const [buyerResult, sellerResult] = await Promise.allSettled([
      sendOrderConfirmationEmail(orderData, productData, buyerData),
      sendSellerNotificationEmail(orderData, productData, buyerData, sellerData)
    ]);
    
    const results = {
      buyer: buyerResult.status === 'fulfilled' ? buyerResult.value : { success: false, error: buyerResult.reason.message },
      seller: sellerResult.status === 'fulfilled' ? sellerResult.value : { success: false, error: sellerResult.reason.message }
    };
    
    // Log results
    if (results.buyer.success) {
      console.log('✅ Buyer email sent successfully');
    } else {
      console.error('❌ Buyer email failed:', results.buyer.error);
    }
    
    if (results.seller.success) {
      console.log('✅ Seller email sent successfully');  
    } else {
      console.error('❌ Seller email failed:', results.seller.error);
    }
    
    return {
      success: results.buyer.success || results.seller.success, // Success if at least one email sent
      results
    };
    
  } catch (error) {
    console.error('❌ Failed to send order emails:', error);
    return {
      success: false,
      error: error.message,
      results: {
        buyer: { success: false, error: error.message },
        seller: { success: false, error: error.message }
      }
    };
  }
};