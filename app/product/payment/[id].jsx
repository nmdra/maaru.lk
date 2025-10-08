import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNavigation from '../../../components/BottomNavigation';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../services/firebaseConfig';
import formatPrice from '../../../utils/formatPrice';
import { useAppI18n } from '../../../utils/i18n';

import { useStripe } from '../../../utils/stripe';

const STRIPE_API_BASE = 'https://maaru-stripe-api.vercel.app';

export default function PaymentScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t, common } = useAppI18n();
  const { user, loading: authLoading } = useAuth();
  
  // Get Stripe hooks (will return null on web)
  const stripeHooks = useStripe();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    Platform.OS === 'web' ? 'paypal' : 'stripe'
  );
  const [quantity, setQuantity] = useState(1);
  const [paymentDetails, setPaymentDetails] = useState({
    email: '',
    cardholderName: '',
    billingAddress: '',
    phoneNumber: '',
  });

  const paymentMethods = [
    { 
      id: 'stripe', 
      name: Platform.OS === 'web' 
        ? 'Stripe (Mobile Only)' 
        : 'Stripe (Card/Apple Pay/Google Pay)', 
      icon: 'card-outline',
      disabled: Platform.OS === 'web'
    },
    { id: 'paypal', name: t('payment.paymentMethods.paypal'), icon: 'logo-paypal' },
    { id: 'bank', name: t('payment.paymentMethods.bank'), icon: 'business-outline' },
    { id: 'cash', name: t('payment.paymentMethods.cash'), icon: 'cash-outline' },
  ];

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setProduct(data);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        Alert.alert('Error', 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const calculateTotal = () => {
    if (!product?.price) return 0;
    const subtotal = product.price * quantity;
    const shipping = 200; // Fixed shipping cost
    const tax = subtotal * 0.1; // 10% tax
    return subtotal + shipping + tax;
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 1)) {
      setQuantity(newQuantity);
    }
  };

  const handlePayment = () => {
    // Check if user is logged in
    if (!user) {
      Alert.alert(
        'Login Required',
        'You must be logged in to make a purchase. Please login to continue.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Login',
            onPress: () => router.push('/(auth)/login')
          }
        ]
      );
      return;
    }

    if (!selectedPaymentMethod) {
      Alert.alert(common('error'), t('payment.validation.selectPaymentMethod'));
      return;
    }

    if (!paymentDetails.phoneNumber || !paymentDetails.billingAddress) {
      Alert.alert(common('error'), t('payment.validation.fillBillingInfo'));
      return;
    }

    if (selectedPaymentMethod === 'stripe') {
      if (!paymentDetails.cardholderName) {
        Alert.alert(common('error'), 'Please enter cardholder name');
        return;
      }
    }

    Alert.alert(
      t('payment.confirmation.title'),
      `${t('payment.confirmation.message')} ${formatPrice(calculateTotal(), product?.currency || 'LKR')}?`,
      [
        { text: common('cancel'), style: 'cancel' },
        {
          text: common('confirm'),
          onPress: processPayment
        }
      ]
    );
  };

  const processPayment = async () => {
    if (processingPayment) return;
    setProcessingPayment(true);

    try {
      if (selectedPaymentMethod === 'stripe') {
        // Check if we're on web or if Stripe is not available
        if (Platform.OS === 'web' || !stripeHooks) {
          Alert.alert(
            'Payment Not Available',
            'Stripe payments are only available on mobile apps. Please use the mobile version or choose another payment method.',
            [{ text: 'OK' }]
          );
          return;
        }

        const { initPaymentSheet, presentPaymentSheet } = stripeHooks;

        // 1) Amount in the smallest currency unit (USD cents for now)
        const total = calculateTotal();
        const amountInCents = Math.round(Number(total) * 100);

        // 2) Ask your Vercel backend to create a PaymentIntent
        const r = await fetch(`${STRIPE_API_BASE}/api/create-payment-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amountInCents,
            currency: 'usd',
            description: `Order • ${product?.name} × ${quantity}`,
            receipt_email: paymentDetails?.email,
            metadata: {
              order_id: `${product?.id}-${Date.now()}`,
              productId: product?.id,
              productName: product?.name
            }
          })
        });

        const { clientSecret, error } = await r.json();
        if (error || !clientSecret) throw new Error(error || 'No client secret');

        // 3) Initialize PaymentSheet
        const { error: initErr } = await initPaymentSheet({
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: 'maaru.lk',
          defaultBillingDetails: { name: paymentDetails?.cardholderName || 'Customer' }
        });
        if (initErr) throw new Error(initErr.message);

        // 4) Present PaymentSheet
        const { error: payErr } = await presentPaymentSheet();
        if (payErr) {
          Alert.alert('Payment failed', payErr.message);
          return;
        }

        // 5) Success: navigate to your success screen
        navigateToSuccess();
      } else {
        // For non-Stripe payments, simulate success
        navigateToSuccess();
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Payment Error', e.message);
      navigateToFailure('stripe_error', e.message);
    } finally {
      setProcessingPayment(false);
    }
  };

  const navigateToSuccess = () => {
    const orderData = {
      productId: product.id,
      productOwnerId: product.ownerId,
      productName: product.name,
      quantity,
      price: product.price,
      currency: product.currency,
      total: calculateTotal(),
      paymentMethod: selectedPaymentMethod,
      orderDate: new Date().toISOString(),
      buyerId: user.uid,
      buyerEmail: user.email,
      shippingAddress: paymentDetails.billingAddress,
      phoneNumber: paymentDetails.phoneNumber,
    };
    
    router.push({
      pathname: '/product/payment/success',
      params: orderData
    });
  };

  const navigateToFailure = (errorType, errorMessage) => {
    router.push({
      pathname: '/product/payment/failure',
      params: { errorType, errorMessage }
    });
  };

  if (loading || authLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-500">{common('loading')}</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-500">Product not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-blue-600 px-6 py-2 rounded-lg"
        >
          <Text className="text-white font-semibold">{common('back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">{t('payment.title')}</Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Product Summary */}
        <View className="bg-white mx-4 mt-4 p-4 rounded-lg shadow-sm">
          <Text className="text-lg font-bold mb-3">{t('payment.orderSummary')}</Text>
          <View className="flex-row">
            <Image
              source={product.imageUrl ? { uri: product.imageUrl } : { uri: 'https://placehold.co/80' }}
              className="w-20 h-20 rounded-lg bg-gray-200"
            />
            <View className="flex-1 ml-3">
              <Text className="font-semibold text-gray-900">{product.name}</Text>
              <Text className="text-sm text-gray-600 mt-1">{product.category}</Text>
              <Text className="text-lg font-bold text-blue-600 mt-2">
                {formatPrice(product.price, product.currency)}
              </Text>
            </View>
          </View>

          {/* Quantity Selector */}
          <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <Text className="font-semibold">{t('payment.quantity')}:</Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => handleQuantityChange(-1)}
                className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center"
                disabled={quantity <= 1}
              >
                <Ionicons name="remove" size={20} color={quantity <= 1 ? "#ccc" : "#333"} />
              </TouchableOpacity>
              <Text className="mx-4 text-lg font-bold">{quantity}</Text>
              <TouchableOpacity
                onPress={() => handleQuantityChange(1)}
                className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center"
                disabled={quantity >= (product.stock || 1)}
              >
                <Ionicons name="add" size={20} color={quantity >= (product.stock || 1) ? "#ccc" : "#333"} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Payment Method Selection */}
        <View className="bg-white mx-4 mt-4 p-4 rounded-lg shadow-sm">
          <Text className="text-lg font-bold mb-3">{t('payment.paymentMethod')}</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              onPress={() => !method.disabled && setSelectedPaymentMethod(method.id)}
              disabled={method.disabled}
              className={`flex-row items-center p-3 rounded-lg mb-2 ${
                method.disabled 
                  ? 'bg-gray-100 border border-gray-300 opacity-50'
                  : selectedPaymentMethod === method.id 
                    ? 'bg-blue-50 border-2 border-blue-500' 
                    : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <Ionicons 
                name={method.icon} 
                size={24} 
                color={
                  method.disabled 
                    ? '#ccc' 
                    : selectedPaymentMethod === method.id 
                      ? '#2563eb' 
                      : '#666'
                } 
              />
              <Text className={`ml-3 font-medium ${
                method.disabled
                  ? 'text-gray-400'
                  : selectedPaymentMethod === method.id 
                    ? 'text-blue-600' 
                    : 'text-gray-700'
              }`}>
                {method.name}
              </Text>
              {selectedPaymentMethod === method.id && !method.disabled && (
                <Ionicons name="checkmark-circle" size={20} color="#2563eb" className="ml-auto" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Details Form */}
        {selectedPaymentMethod === 'stripe' && (
          <View className="bg-white mx-4 mt-4 p-4 rounded-lg shadow-sm">
            <Text className="text-lg font-bold mb-3">Payment Details</Text>
            <Text className="text-sm text-gray-600 mb-3">Stripe will securely collect your payment information in the next step</Text>
            
            <View className="space-y-3">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">{t('payment.cardholderName')}</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                  placeholder={t('payment.placeholders.cardholderName')}
                  value={paymentDetails.cardholderName}
                  onChangeText={(text) => setPaymentDetails({...paymentDetails, cardholderName: text})}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Email (optional - for receipt)</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                  placeholder="your-email@example.com"
                  value={paymentDetails.email}
                  onChangeText={(text) => setPaymentDetails({...paymentDetails, email: text})}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>
        )}

        {/* Billing Information */}
        <View className="bg-white mx-4 mt-4 p-4 rounded-lg shadow-sm">
          <Text className="text-lg font-bold mb-3">{t('payment.billingInfo')}</Text>
          
          <View className="space-y-3">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">{t('payment.phoneNumber')}</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                placeholder={t('payment.placeholders.phoneNumber')}
                value={paymentDetails.phoneNumber}
                onChangeText={(text) => setPaymentDetails({...paymentDetails, phoneNumber: text})}
                keyboardType="phone-pad"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">{t('payment.billingAddress')}</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-3 bg-white"
                placeholder={t('payment.placeholders.billingAddress')}
                value={paymentDetails.billingAddress}
                onChangeText={(text) => setPaymentDetails({...paymentDetails, billingAddress: text})}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Price Breakdown */}
        <View className="bg-white mx-4 mt-4 p-4 rounded-lg shadow-sm">
          <Text className="text-lg font-bold mb-3">{t('payment.priceBreakdown')}</Text>
          
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-700">{t('payment.subtotal')} ({quantity} item{quantity > 1 ? 's' : ''})</Text>
              <Text className="font-medium">{formatPrice(product.price * quantity, product.currency)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-700">{t('payment.shipping')}</Text>
              <Text className="font-medium">{formatPrice(200, product.currency)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-700">{t('payment.tax')} (10%)</Text>
              <Text className="font-medium">{formatPrice(product.price * quantity * 0.1, product.currency)}</Text>
            </View>
            <View className="border-t border-gray-200 pt-2 flex-row justify-between">
              <Text className="text-lg font-bold">{t('payment.total')}</Text>
              <Text className="text-lg font-bold text-blue-600">{formatPrice(calculateTotal(), product.currency)}</Text>
            </View>
          </View>
        </View>

        {/* Bottom spacing for fixed button */}
        <View className="h-24" />
      </ScrollView>

      {/* Fixed Pay Button */}
      <View className="bg-white px-4 py-3 border-t border-gray-200">
        <TouchableOpacity
          onPress={handlePayment}
          disabled={processingPayment}
          className={`py-4 rounded-lg items-center justify-center flex-row ${
            processingPayment ? 'bg-gray-400' : 'bg-blue-600'
          }`}
        >
          <Ionicons 
            name={processingPayment ? "hourglass-outline" : "card-outline"} 
            size={20} 
            color="white" 
            className="mr-2" 
          />
          <Text className="text-white font-bold text-lg">
            {processingPayment 
              ? 'Processing...' 
              : `${t('payment.payButton')} ${formatPrice(calculateTotal(), product.currency)}`
            }
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </View>
  );
}