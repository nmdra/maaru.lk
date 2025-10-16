import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from '../../components/BottomNavigation';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebaseConfig';
import { useAppI18n } from '../../utils/i18n';

const CATEGORIES = [
  'Electronics',
  'Furniture',
  'Clothing',
  'Books',
  'Sports',
  'Toys',
  'Home & Garden',
  'Others',
];

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

export default function EditProduct() {
  const router = useRouter();
  const { productId } = useLocalSearchParams();
  const { user } = useAuth();
  const { t } = useAppI18n();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Electronics',
    condition: 'Good',
    availability: true,
  });

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/Login');
      return;
    }

    if (!productId) {
      Alert.alert('Error', 'Product ID is missing');
      router.back();
      return;
    }

    fetchProduct();
  }, [user, productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'products', productId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Check if current user is the owner
        if (data.ownerId !== user.uid) {
          Alert.alert('Error', 'You do not have permission to edit this product');
          router.back();
          return;
        }

        setProduct({
          name: data.name || '',
          description: data.description || '',
          price: data.price?.toString() || '',
          category: data.category || 'Electronics',
          condition: data.condition || 'Good',
          availability: data.availability ?? true,
          imageUrl: data.imageUrl || '',
        });
      } else {
        Alert.alert('Error', 'Product not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!product.name.trim()) {
      Alert.alert('Validation Error', 'Please enter a product name');
      return;
    }

    if (!product.price || isNaN(parseFloat(product.price)) || parseFloat(product.price) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price');
      return;
    }

    try {
      setSaving(true);
      const docRef = doc(db, 'products', productId);
      
      await updateDoc(docRef, {
        name: product.name.trim(),
        description: product.description.trim(),
        price: parseFloat(product.price),
        category: product.category,
        condition: product.condition,
        availability: product.availability,
        updatedAt: new Date(),
      });

      Alert.alert(
        'Success',
        'Product updated successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background.primary }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 16,
            backgroundColor: Colors.accent,
          }}
        >
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '700', color: 'white' }}>
            Edit Product
          </Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={{ marginTop: 12, color: Colors.text.secondary }}>
            Loading product...
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
        <Text style={{ fontSize: 20, fontWeight: '700', color: 'white', flex: 1 }}>
          Edit Product
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: 'white',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.accent} />
          ) : (
            <Text style={{ color: Colors.accent, fontWeight: '600' }}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={{ padding: 16 }}>
            {/* Product Image */}
            {product.imageUrl && (
              <View style={{ marginBottom: 20, alignItems: 'center' }}>
                <Image
                  source={{ uri: product.imageUrl }}
                  style={{
                    width: '100%',
                    height: 200,
                    borderRadius: 12,
                    backgroundColor: Colors.background.secondary,
                  }}
                  resizeMode="cover"
                />
                <Text style={{ marginTop: 8, color: Colors.text.tertiary, fontSize: 12 }}>
                  Image cannot be changed
                </Text>
              </View>
            )}

            {/* Product Name */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text.primary, marginBottom: 8 }}>
                Product Name *
              </Text>
              <TextInput
                value={product.name}
                onChangeText={(text) => setProduct({ ...product, name: text })}
                placeholder="Enter product name"
                placeholderTextColor={Colors.text.tertiary}
                style={{
                  backgroundColor: Colors.white,
                  borderWidth: 1,
                  borderColor: Colors.border.default,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: Colors.text.primary,
                }}
              />
            </View>

            {/* Description */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text.primary, marginBottom: 8 }}>
                Description
              </Text>
              <TextInput
                value={product.description}
                onChangeText={(text) => setProduct({ ...product, description: text })}
                placeholder="Enter product description"
                placeholderTextColor={Colors.text.tertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{
                  backgroundColor: Colors.white,
                  borderWidth: 1,
                  borderColor: Colors.border.default,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: Colors.text.primary,
                  minHeight: 100,
                }}
              />
            </View>

            {/* Price */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text.primary, marginBottom: 8 }}>
                Price (LKR) *
              </Text>
              <TextInput
                value={product.price}
                onChangeText={(text) => setProduct({ ...product, price: text })}
                placeholder="Enter price"
                placeholderTextColor={Colors.text.tertiary}
                keyboardType="decimal-pad"
                style={{
                  backgroundColor: Colors.white,
                  borderWidth: 1,
                  borderColor: Colors.border.default,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: Colors.text.primary,
                }}
              />
            </View>

            {/* Category */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text.primary, marginBottom: 8 }}>
                Category
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setProduct({ ...product, category: cat })}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      marginRight: 8,
                      backgroundColor: product.category === cat ? Colors.accent : Colors.white,
                      borderWidth: 1,
                      borderColor: product.category === cat ? Colors.accent : Colors.border.default,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: product.category === cat ? 'white' : Colors.text.primary,
                        fontWeight: product.category === cat ? '600' : '400',
                      }}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Condition */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text.primary, marginBottom: 8 }}>
                Condition
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CONDITIONS.map((cond) => (
                  <TouchableOpacity
                    key={cond}
                    onPress={() => setProduct({ ...product, condition: cond })}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      marginRight: 8,
                      backgroundColor: product.condition === cond ? Colors.accent : Colors.white,
                      borderWidth: 1,
                      borderColor: product.condition === cond ? Colors.accent : Colors.border.default,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: product.condition === cond ? 'white' : Colors.text.primary,
                        fontWeight: product.condition === cond ? '600' : '400',
                      }}
                    >
                      {cond}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Availability Toggle */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: Colors.white,
                borderWidth: 1,
                borderColor: Colors.border.default,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 16,
              }}
            >
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text.primary, marginBottom: 4 }}>
                  Product Available
                </Text>
                <Text style={{ fontSize: 12, color: Colors.text.secondary }}>
                  {product.availability ? 'Visible to buyers' : 'Hidden from buyers'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setProduct({ ...product, availability: !product.availability })}
                style={{
                  width: 50,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: product.availability ? Colors.accent : Colors.border.default,
                  justifyContent: 'center',
                  paddingHorizontal: 2,
                }}
              >
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: 'white',
                    transform: [{ translateX: product.availability ? 20 : 0 }],
                  }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomNavigation currentRoute="/(profile)/MyProducts" />
    </SafeAreaView>
  );
}
