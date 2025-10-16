// app/(auth)/MyProducts.jsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from '../../components/BottomNavigation';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebaseConfig';
import formatPrice from '../../utils/formatPrice';
import { useAppI18n } from '../../utils/i18n';

export default function MyProducts() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useAppI18n();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/Login');
      return;
    }

    fetchMyProducts();
  }, [user]);

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'products'),
        where('ownerId', '==', user.uid)
      );
      
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by creation date (newest first)
      items.sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(0);
        const bDate = b.createdAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      });
      
      setProducts(items);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderProduct = ({ item }) => (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: Colors.white,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <TouchableOpacity onPress={() => router.push(`/product/${item.id}`)}>
        <Image
          source={{ uri: item.imageUrl || 'https://placehold.co/100x100' }}
          style={{
            width: 80,
            height: 80,
            borderRadius: 8,
            backgroundColor: Colors.background.secondary,
          }}
        />
      </TouchableOpacity>
      
      <View style={{ flex: 1, marginLeft: 12, justifyContent: 'space-between' }}>
        <View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: Colors.text.primary,
              marginBottom: 4,
            }}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          
          <Text
            style={{
              fontSize: 14,
              color: Colors.text.secondary,
              marginBottom: 6,
            }}
            numberOfLines={1}
          >
            {item.category}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: Colors.accent,
            }}
          >
            {formatPrice(item.price, item.currency || 'LKR')}
          </Text>
          
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: item.availability ? '#D1FAE5' : '#FEE2E2',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: item.availability ? '#059669' : '#DC2626',
              }}
            >
              {item.availability ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      {/* Edit Button */}
      <TouchableOpacity
        onPress={() => router.push(`/(profile)/EditProduct?productId=${item.id}`)}
        style={{
          marginLeft: 8,
          justifyContent: 'center',
          alignItems: 'center',
          width: 40,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: Colors.background.accent,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="pencil" size={18} color={Colors.accent} />
        </View>
      </TouchableOpacity>
    </View>
  );

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
            My Products
          </Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={{ marginTop: 12, color: Colors.text.secondary }}>
            {t('common.loading')}
          </Text>
        </View>
        <BottomNavigation currentRoute="/(profile)/MyProducts" />
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
          My Products
        </Text>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: 'white',
          }}
        >
          {products.length}
        </Text>
      </View>

      {/* Products List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 100,
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Ionicons name="cube-outline" size={64} color={Colors.text.tertiary} />
            <Text
              style={{
                fontSize: 16,
                color: Colors.text.secondary,
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              No products yet
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/AddProduct')}
              style={{
                marginTop: 24,
                backgroundColor: Colors.accent,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                Add Your First Product
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
      
      <BottomNavigation currentRoute="/(profile)/MyProducts" />
    </SafeAreaView>
  );
}
