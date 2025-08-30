import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ProductCard from '../../components/product/ProductCard';
import { db } from '../../services/firebaseConfig';

export default function SwapScreen() {
  const { id: targetProductId } = useLocalSearchParams();
  const router = useRouter();
  const [targetProduct, setTargetProduct] = useState(null);
  const [userItems, setUserItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTargetProduct = async () => {
      const docRef = doc(db, 'products', targetProductId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTargetProduct({ id: docSnap.id, ...docSnap.data() });
      }
    };

    const fetchUserItems = async () => {
      // Mock user items
      const mockItems = [
        {
          id: '1',
          name: 'Laptop Bag',
          priceCents: 2500,
          currency: 'USD',
          imageUrl: 'https://placehold.co/200x200?text=Laptop+Bag',
        },
        {
          id: '2',
          name: 'Headphones',
          priceCents: 5000,
          currency: 'USD',
          imageUrl: 'https://placehold.co/200x200?text=Headphone',
        },
        {
          id: '3',
          name: 'Smart Watch',
          priceCents: 15000,
          currency: 'USD',
          imageUrl: 'https://placehold.co/200x200?text=Smart+watch',
        },
        {
          id: '4',
          name: 'Backpack',
          priceCents: 3000,
          currency: 'USD',
          imageUrl: 'https://placehold.co/200x200?text=Backpack',
        },
        {
          id: '5',
          name: 'Shoes',
          priceCents: 6000,
          currency: 'USD',
          imageUrl: 'https://placehold.co/200x200?text=Shoes',
        },
      ];
      setUserItems(mockItems);
    };

    Promise.all([fetchTargetProduct(), fetchUserItems()]).finally(() => setLoading(false));
  }, [targetProductId]);

  const toggleSelectItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    );
  };

  const handleOfferSwap = () => {
    if (selectedItems.length === 0) {
      Alert.alert('Select items', 'Please select at least one item to offer for swap.');
      return;
    }
    Alert.alert(
      'Swap Offered',
      `You offered ${selectedItems.length} item(s) for ${targetProduct.name}.`,
    );
    router.back();
  };

  const handleAddNewItem = () => {
    Alert.alert('Add New Item', 'Redirect to Add New Item screen.');
    router.push('/AddProduct');
  };

  const handleChatOwner = () => {
    Alert.alert('Chat', `Start chat with ${targetProduct.ownerName || 'Owner'}`);
    // router.push(`/chat/${targetProduct.ownerId}`);
  };

  if (loading || !targetProduct) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-500">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Sticky Header with Chat */}
      <View className="flex-row justify-between items-center px-4 py-3 bg-white border-b border-gray-200">
        <View>
          <Text className="text-lg font-semibold text-gray-900">{targetProduct.name}</Text>
          <Text className="text-sm text-gray-600">
            Selected: {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={handleChatOwner} className="bg-blue-600 p-2 rounded-full">
          <Ionicons name="chatbubble-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView className="p-4">
        {/* Target Product */}
        <View className="mb-6">
          <ProductCard
            name={targetProduct.name}
            priceCents={targetProduct.priceCents}
            currency={targetProduct.currency}
            imageUrl={targetProduct.imageUrl}
            onPress={() => {}}
          />
        </View>

        {/* User Items Header with Add Item */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-semibold text-gray-900">Your Items</Text>
          <TouchableOpacity
            onPress={handleAddNewItem}
            className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons name="add-circle-outline" size={18} color="white" className="mr-1" />
            <Text className="text-white font-semibold text-sm">Add Item</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Carousel for User Items */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-3 mb-6">
          {userItems.map((item) => {
            const isSelected = selectedItems.includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => toggleSelectItem(item.id)}
                className={`${isSelected ? 'opacity-70 border-2 border-green-600 rounded-lg' : ''}`}
              >
                <ProductCard
                  name={item.name}
                  priceCents={item.price}
                  currency={item.currency}
                  imageUrl={item.imageUrl}
                  onPress={() => toggleSelectItem(item.id)}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Offer Swap Button */}
        <TouchableOpacity
          onPress={handleOfferSwap}
          className="bg-green-600 py-3 rounded-lg items-center justify-center flex-row mb-8"
        >
          <Ionicons name="swap-horizontal-outline" size={20} color="white" className="mr-2" />
          <Text className="text-white font-semibold">Offer Swap</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
