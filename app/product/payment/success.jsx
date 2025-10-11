import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNavigation from '../../../components/BottomNavigation';
import { useAuth } from '../../../context/AuthContext';
import { updateProductAvailability } from '../../../services/itemService';
import { createOrder } from '../../../services/orderService';
import { createTransaction } from '../../../services/transactionService';
import { getUserById } from '../../../services/userService';
import { sendOrderConfirmationEmail, sendSellerNotificationEmail } from '../../../utils/emailService';
import formatPrice from '../../../utils/formatPrice';
import { useAppI18n } from '../../../utils/i18n';

export default function PaymentSuccessScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t, common } = useAppI18n();
  const { user } = useAuth(); // Get logged-in user
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(true);

  const estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

  const orderDetails = {
    productName: params.productName || 'Product',
    quantity: parseInt(params.quantity) || 1,
    price: parseFloat(params.price) || 0,
    currency: params.currency || 'LKR',
    total: parseFloat(params.total) || 0,
    paymentMethod: params.paymentMethod || 'card',
    orderDate: params.orderDate ? new Date(params.orderDate) : new Date(),
  };

  // Create order and transaction on component mount
  useEffect(() => {
    const createOrderAndTransaction = async () => {
      try {
        setLoading(true);
        
        // Ensure user is logged in
        if (!user?.uid) {
          console.error('❌ No logged-in user found');
          Alert.alert(
            'Authentication Error',
            'Please log in to complete your order.',
            [{ text: 'OK', onPress: () => router.push('/(auth)/Login') }]
          );
          return;
        }
        
        console.log('👤 Current Firebase Auth user:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        });

        // Create order
        const orderData = {
          productId: params.productId,
          productOwnerId: params.productOwnerId,
          buyerId: params.buyerId || user?.uid,
          buyerEmail: user?.email || params.buyerEmail, // Use logged-in user's email
          productName: params.productName,
          quantity: parseInt(params.quantity) || 1,
          price: parseFloat(params.price) || 0,
          currency: params.currency || 'LKR',
          total: parseFloat(params.total) || 0,
          paymentMethod: params.paymentMethod || 'card',
          shippingAddress: params.shippingAddress,
          phoneNumber: params.phoneNumber,
        };

        const orderId = await createOrder(orderData);
        
        // Create transaction
        const transactionData = {
          orderId: orderId,
          productId: params.productId,
          buyerId: params.buyerId || user?.uid,
          sellerId: params.productOwnerId,
          amount: parseFloat(params.total) || 0,
          currency: params.currency || 'LKR',
          paymentMethod: params.paymentMethod || 'card',
          paymentDetails: {
            shippingAddress: params.shippingAddress,
            phoneNumber: params.phoneNumber,
            buyerEmail: user?.email || params.buyerEmail, // Use logged-in user's email
          },
        };

        await createTransaction(transactionData);

        // Update product availability to false
        await updateProductAvailability(params.productId, false);

        // Generate order number for display
        const generatedOrderNumber = `MR-${Date.now().toString().slice(-8)}`;
        setOrderNumber(generatedOrderNumber);
        
        // Send order confirmation emails
        try {
          console.log('📧 Preparing to send order emails...');
          
          // Get seller information and use logged-in user as buyer
          const sellerData = await getUserById(params.productOwnerId);
          
          // Validate logged-in user email
          if (!user?.email || user.email.includes('@example.com')) {
            console.error('❌ Invalid or missing user email:', user?.email);
            Alert.alert(
              'Email Required',
              'Please ensure you have a valid email address in your profile to receive order confirmations.',
              [{ text: 'OK' }]
            );
            setLoading(false);
            return;
          }
          
          // Use logged-in user data for buyer
          const buyerData = {
            uid: user.uid,
            email: user.email, // Only use the logged-in user's real email
            displayName: user.displayName || user.email.split('@')[0],
            name: user.displayName || user.email.split('@')[0]
          };
          
          console.log('📧 Buyer email for confirmation:', buyerData.email);
          console.log('👤 Logged-in user email:', user?.email);
          console.log('✅ Email validation passed - using real email');
          console.log('🔗 Email service URL:', 'https://maaru-stripe-api.vercel.app/api/send-email');
          console.log('📦 Order data for email:', completeOrderData);
          console.log('🛍️ Product data for email:', productData);
          
          // Create complete order data for email
          const completeOrderData = {
            ...orderData,
            orderNumber: generatedOrderNumber,
            orderId: orderId
          };
          
          // Create product data for email
          const productData = {
            id: params.productId,
            name: params.productName,
            imageUrl: params.productImage,
            category: params.productCategory || 'Others',
            condition: params.productCondition || 'Good',
            price: parseFloat(params.price) || 0,
            ownerId: params.productOwnerId
          };
          
          // Send buyer email first
          console.log('📧 Sending buyer confirmation email to:', buyerData.email);
          const buyerEmailResult = await sendOrderConfirmationEmail(
            completeOrderData,
            productData, 
            buyerData
          );
          
          if (buyerEmailResult.success) {
            console.log('✅ Buyer confirmation email sent successfully');
          } else {
            console.error('❌ Buyer email failed:', buyerEmailResult.error);
          }
          
          // Send seller email second
          console.log('📧 Sending seller notification email to:', sellerData?.email);
          const sellerEmailResult = await sendSellerNotificationEmail(
            completeOrderData,
            productData, 
            buyerData,
            sellerData
          );
          
          if (sellerEmailResult.success) {
            console.log('✅ Seller notification email sent successfully');
          } else {
            console.error('❌ Seller email failed:', sellerEmailResult.error);
          }
          
        } catch (emailError) {
          console.error('❌ Failed to send order emails (non-critical):', emailError);
          // Email failure shouldn't break the order process
        }
        
        setOrderCreated(true);

      } catch (error) {
        console.error('Error creating order and transaction:', error);
        Alert.alert(
          'Error',
          'There was an issue processing your order. Please contact support.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/(tabs)/Home')
            }
          ]
        );
      } finally {
        setLoading(false);
      }
    };

    // Only create order if we have the required parameters and haven't created it yet
    if (params.productId && params.buyerId && !orderCreated) {
      createOrderAndTransaction();
    } else if (!params.productId || !params.buyerId) {
      setLoading(false);
    }
  }, [params, orderCreated]);

  const getPaymentMethodName = (method) => {
    switch (method) {
      case 'card':
        return t('payment.paymentMethods.card');
      case 'paypal':
        return t('payment.paymentMethods.paypal');
      case 'bank':
        return t('payment.paymentMethods.bank');
      case 'cash':
        return t('payment.paymentMethods.cash');
      default:
        return 'Unknown';
    }
  };

  // Show loading state while processing order
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Ionicons name="hourglass-outline" size={48} color="#2563eb" />
        <Text className="text-lg font-semibold mt-4 mb-2">Processing your order...</Text>
        <Text className="text-gray-600 text-center px-8">
          Please wait while we create your order and process the payment.
        </Text>
      </View>
    );
  }

  // Show error state if required parameters are missing
  if (!params.productId || !params.buyerId) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="text-lg font-semibold mt-4 mb-2">Invalid Order</Text>
        <Text className="text-gray-600 text-center px-8 mb-6">
          There was an issue with your order. Please try again.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/Home')}
          className="bg-blue-600 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Return to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Success Header */}
      <View className="bg-green-600 px-4 py-8 items-center">
        <View className="bg-white rounded-full p-4 mb-4">
          <Ionicons name="checkmark" size={48} color="#16a34a" />
        </View>
        <Text className="text-white text-2xl font-bold mb-2">{t('paymentSuccess.title')}</Text>
        <Text className="text-green-100 text-center">
          {t('paymentSuccess.subtitle')}
        </Text>
      </View>

      <ScrollView className="flex-1">
        {/* Order Summary Card */}
        <View className="bg-white mx-4 mt-6 p-6 rounded-lg shadow-sm">
          <View className="flex-row items-center mb-4">
            <Ionicons name="receipt-outline" size={24} color="#2563eb" />
            <Text className="text-lg font-bold ml-2">{t('paymentSuccess.orderSummary')}</Text>
          </View>

          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">{t('paymentSuccess.orderNumber')}</Text>
              <Text className="font-semibold text-blue-600">{orderNumber}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">{t('paymentSuccess.product')}</Text>
              <Text className="font-medium flex-1 text-right">{orderDetails.productName}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">{t('payment.quantity')}</Text>
              <Text className="font-medium">{orderDetails.quantity}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">{t('paymentSuccess.unitPrice')}</Text>
              <Text className="font-medium">{formatPrice(orderDetails.price, orderDetails.currency)}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">{t('payment.paymentMethod')}</Text>
              <Text className="font-medium">{getPaymentMethodName(orderDetails.paymentMethod)}</Text>
            </View>

            <View className="border-t border-gray-200 pt-3 flex-row justify-between">
              <Text className="text-lg font-bold">{t('paymentSuccess.totalPaid')}</Text>
              <Text className="text-lg font-bold text-green-600">
                {formatPrice(orderDetails.total, orderDetails.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery Information */}
        <View className="bg-white mx-4 mt-4 p-6 rounded-lg shadow-sm">
          <View className="flex-row items-center mb-4">
            <Ionicons name="truck-outline" size={24} color="#f59e0b" />
            <Text className="text-lg font-bold ml-2">{t('paymentSuccess.deliveryInfo')}</Text>
          </View>

          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">{t('paymentSuccess.orderDate')}</Text>
              <Text className="font-medium">{orderDetails.orderDate.toLocaleDateString()}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">{t('paymentSuccess.estimatedDelivery')}</Text>
              <Text className="font-medium text-orange-600">{estimatedDelivery.toLocaleDateString()}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">{t('paymentSuccess.status')}</Text>
              <View className="bg-yellow-100 px-3 py-1 rounded-full">
                <Text className="text-yellow-800 text-sm font-medium">{t('paymentSuccess.processing')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Next Steps */}
        <View className="bg-white mx-4 mt-4 p-6 rounded-lg shadow-sm">
          <View className="flex-row items-center mb-4">
            <Ionicons name="list-outline" size={24} color="#8b5cf6" />
            <Text className="text-lg font-bold ml-2">{t('paymentSuccess.whatsNext')}</Text>
          </View>

          <View className="space-y-3">
            <View className="flex-row">
              <View className="bg-blue-100 rounded-full p-2 mr-3">
                <Ionicons name="mail-outline" size={16} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="font-medium">{t('paymentSuccess.steps.confirmation.title')}</Text>
                <Text className="text-sm text-gray-600">{t('paymentSuccess.steps.confirmation.description')}</Text>
              </View>
            </View>

            <View className="flex-row">
              <View className="bg-orange-100 rounded-full p-2 mr-3">
                <Ionicons name="cube-outline" size={16} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="font-medium">{t('paymentSuccess.steps.packaging.title')}</Text>
                <Text className="text-sm text-gray-600">{t('paymentSuccess.steps.packaging.description')}</Text>
              </View>
            </View>

            <View className="flex-row">
              <View className="bg-green-100 rounded-full p-2 mr-3">
                <Ionicons name="location-outline" size={16} color="#16a34a" />
              </View>
              <View className="flex-1">
                <Text className="font-medium">{t('paymentSuccess.steps.tracking.title')}</Text>
                <Text className="text-sm text-gray-600">{t('paymentSuccess.steps.tracking.description')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mx-4 mt-6 mb-6 space-y-3">
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/Home')}
            className="bg-blue-600 py-4 rounded-lg items-center justify-center flex-row"
          >
            <Ionicons name="home-outline" size={20} color="white" className="mr-2" />
            <Text className="text-white font-bold text-lg">{t('paymentSuccess.actions.continueShopping')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/Reviews')}
            className="bg-gray-200 py-4 rounded-lg items-center justify-center flex-row"
          >
            <Ionicons name="receipt-outline" size={20} color="#374151" className="mr-2" />
            <Text className="text-gray-700 font-bold text-lg">{t('paymentSuccess.actions.viewOrders')}</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing for navigation */}
        <View className="h-20" />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </View>
  );
}