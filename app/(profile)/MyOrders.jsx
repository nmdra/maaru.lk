// app/(auth)/MyOrders.jsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from '../../components/BottomNavigation';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { getUserOrders } from '../../services/orderService';
import formatPrice from '../../utils/formatPrice';
import { useAppI18n } from '../../utils/i18n';

export default function MyOrders() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useAppI18n();
  const [activeTab, setActiveTab] = useState('purchases'); // 'purchases' or 'sales'
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/Login');
      return;
    }

    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Fetch purchase orders (where user is buyer)
      const purchases = await getUserOrders(user.uid, 'buyer');
      setPurchaseOrders(purchases);
      
      // Fetch sales orders (where user is seller)
      const sales = await getUserOrders(user.uid, 'seller');
      setSalesOrders(sales);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'processing':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'shipped':
        return { bg: '#E0E7FF', text: '#4338CA' };
      case 'delivered':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#DC2626' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderOrder = ({ item }) => {
    const statusColors = getStatusColor(item.status);
    
    return (
      <TouchableOpacity
        onPress={() => {
          // Navigate to order details (to be implemented)
          console.log('Order clicked:', item.id);
        }}
        style={{
          backgroundColor: Colors.white,
          marginHorizontal: 16,
          marginBottom: 12,
          borderRadius: 12,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        {/* Order Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <View>
            <Text style={{ fontSize: 12, color: Colors.text.tertiary, marginBottom: 2 }}>
              Order #{item.orderNumber}
            </Text>
            <Text style={{ fontSize: 14, color: Colors.text.secondary }}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
          
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: statusColors.bg,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: statusColors.text,
                textTransform: 'capitalize',
              }}
            >
              {item.status}
            </Text>
          </View>
        </View>

        {/* Product Name */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: Colors.text.primary,
            marginBottom: 8,
          }}
          numberOfLines={2}
        >
          {item.productName}
        </Text>

        {/* Order Details */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 12, color: Colors.text.secondary }}>
              Quantity: {item.quantity}
            </Text>
            <Text style={{ fontSize: 12, color: Colors.text.secondary, marginTop: 2 }}>
              Payment: {item.paymentMethod || 'Card'}
            </Text>
          </View>
          
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: Colors.accent,
            }}
          >
            {formatPrice(item.total, item.currency)}
          </Text>
        </View>

        {/* Estimated Delivery (for purchases) */}
        {activeTab === 'purchases' && item.estimatedDelivery && (
          <View
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: Colors.border.light,
            }}
          >
            <Text style={{ fontSize: 12, color: Colors.text.secondary }}>
              📦 Estimated Delivery: {formatDate(item.estimatedDelivery)}
            </Text>
          </View>
        )}

        {/* Buyer Info (for sales) */}
        {activeTab === 'sales' && item.buyerEmail && (
          <View
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: Colors.border.light,
            }}
          >
            <Text style={{ fontSize: 12, color: Colors.text.secondary }}>
              👤 Buyer: {item.buyerEmail}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const currentOrders = activeTab === 'purchases' ? purchaseOrders : salesOrders;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background.primary }}>
        {/* Custom Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 16,
            backgroundColor: Colors.accent,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 4,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: 12, padding: 4 }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: 'white',
              flex: 1,
            }}
          >
            My Orders
          </Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={{ marginTop: 12, color: Colors.text.secondary }}>
            {t('common.loading')}
          </Text>
        </View>
        <BottomNavigation currentRoute="/(profile)/MyOrders" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background.primary }}>
      {/* Custom Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 16,
          backgroundColor: Colors.accent,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 4,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 12, padding: 4 }}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: 'white',
            flex: 1,
          }}
        >
          My Orders
        </Text>
      </View>
      
      {/* Tabs */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: Colors.white,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border.light,
        }}
      >
        <TouchableOpacity
          onPress={() => setActiveTab('purchases')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderBottomWidth: 3,
            borderBottomColor: activeTab === 'purchases' ? Colors.accent : 'transparent',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: activeTab === 'purchases' ? '700' : '500',
              color: activeTab === 'purchases' ? Colors.accent : Colors.text.secondary,
            }}
          >
            My Purchases ({purchaseOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('sales')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderBottomWidth: 3,
            borderBottomColor: activeTab === 'sales' ? Colors.accent : 'transparent',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: activeTab === 'sales' ? '700' : '500',
              color: activeTab === 'sales' ? Colors.accent : Colors.text.secondary,
            }}
          >
            My Sales ({salesOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <FlatList
        data={currentOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 100,
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Ionicons
              name={activeTab === 'purchases' ? 'cart-outline' : 'cash-outline'}
              size={64}
              color={Colors.text.tertiary}
            />
            <Text
              style={{
                fontSize: 16,
                color: Colors.text.secondary,
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              {activeTab === 'purchases'
                ? 'No purchase orders yet'
                : 'No sales yet'}
            </Text>
            {activeTab === 'purchases' && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/Home')}
                style={{
                  marginTop: 24,
                  backgroundColor: Colors.accent,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                  Start Shopping
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
      
      <BottomNavigation currentRoute="/(profile)/MyOrders" />
    </SafeAreaView>
  );
}
