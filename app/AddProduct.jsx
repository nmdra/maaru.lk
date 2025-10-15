import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BottomNavigation from '../components/BottomNavigation';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { generateProductDetails } from '../services/aiService';
import { uploadImageToCloudinary } from '../services/cloudinaryService'; // <-- Import Cloudinary upload function
import { addItemToFirestore } from '../services/itemService';
import { generateSearchKeywords, saveKeywordsToCollection } from '../services/searchKeywordService';
import { getUserId } from '../utils/storage';

const CATEGORIES = ['Electronics', 'Furniture', 'Books', 'Clothing', 'Others'];
const MOCK_TAGS = ['Emergency', 'Good Condition', 'Limited Time', 'New Arrival'];

export default function AddItemScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [swapOnly, setSwapOnly] = useState(false);
  const [condition, setCondition] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [tags, setTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [stock, setStock] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  
  // New fields
  const [swapStatus, setSwapStatus] = useState(true); // Allow swap by default
  const [payStatus, setPayStatus] = useState(true); // Allow payment by default
  const [availability, setAvailability] = useState(true); // Available by default
  const [otherImages, setOtherImages] = useState([]); // Array of additional image URIs

  // Check authentication on mount
  useEffect(() => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'You must be logged in to add a product. Please login first.',
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => router.push('/(tabs)/Home')
          },
          { 
            text: 'Login', 
            onPress: () => router.push('/(auth)/Login') 
          }
        ]
      );
    }
  }, [user]);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const id = await getUserId();
        if (id) setUserId(id);
      } catch (error) {
        console.error('Error loading user ID:', error);
      }
    };
    loadUserId();
  }, []);

  const handlePickImage = async (fromCamera = true) => {
    try {
      const permissionStatus = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionStatus.status !== 'granted') {
        Alert.alert('Permission Required', 'Permission required to select an image.');
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7, aspect: [4, 4] })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7, aspect: [4, 4] });

      if (!result.canceled) setImageUri(result.assets[0].uri);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle picking multiple additional images
  const handlePickOtherImages = async () => {
    try {
      const permissionStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionStatus.status !== 'granted') {
        Alert.alert('Permission Required', 'Permission required to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        quality: 0.7,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => asset.uri);
        setOtherImages([...otherImages, ...newImages]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Remove an image from other images array
  const handleRemoveOtherImage = (index) => {
    setOtherImages(otherImages.filter((_, i) => i !== index));
  };

  const toggleTag = (tag) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleAddCustomTag = () => {
    if (customTag && !tags.includes(customTag)) {
      setTags([...tags, customTag]);
      setCustomTag('');
    }
  };

  const handleAIAutofill = async () => {
    if (!imageUri) {
      Alert.alert('Image Required', 'Please select an image first to use AI autofill.');
      return;
    }

    setAiLoading(true);
    try {
      const result = await generateProductDetails(imageUri);

      if (!result) {
        Alert.alert('Error', 'AI returned no data.');
        return;
      }

      let details;

      if (typeof result === 'string') {
        try {
          details = JSON.parse(result);
        } catch (err) {
          console.error('Failed to parse AI response as JSON:', err);
          Alert.alert('Error', 'Failed to parse AI response.');
          return;
        }
      } else {
        details = result;
      }

      setName(details.name || '');
      setDescription(details.description || '');
      setCategory(CATEGORIES.includes(details.category) ? details.category : CATEGORIES[0]);
      setPrice(details.price != null ? String(details.price) : '');
      setCondition(details.condition || '');
      setSwapOnly(details.swapOnly || false);
      setTags(Array.isArray(details.tags) ? details.tags.filter((t) => typeof t === 'string') : []);
      setStock(details.stock != null ? String(details.stock) : '1');
    } catch (err) {
      console.error('Error generating AI details:', err);
      Alert.alert('Error', 'Error generating AI details.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!name || !description) {
      Alert.alert('Error', 'Please fill all required fields.');
      return;
    }

    // Double-check authentication before submitting
    if (!user || !userId) {
      Alert.alert(
        'Login Required',
        'You must be logged in to add a product. Please login first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/(auth)/Login') }
        ]
      );
      return;
    }

    setLoading(true);
    try {
      let uploadedImageUrl = 'https://placehold.co/600x400'; // default placeholder

      if (imageUri) {
        Alert.alert('Uploading Image', 'Please wait while we upload your image...');
        uploadedImageUrl = await uploadImageToCloudinary(imageUri, 'products');
      }

      // Upload other images
      const uploadedOtherImages = [];
      if (otherImages.length > 0) {
        Alert.alert('Uploading Images', `Uploading ${otherImages.length} additional images...`);
        for (const uri of otherImages) {
          const uploadedUrl = await uploadImageToCloudinary(uri, 'products');
          uploadedOtherImages.push(uploadedUrl);
        }
      }

      const newItem = {
        name,
        description,
        category,
        price: Number(price) || 0,
        swapOnly,
        condition,
        imageUrl: uploadedImageUrl,
        tags,
        stock: Number(stock) || 1,
        ownerId: userId,
        createdAt: serverTimestamp(),
        // New fields
        swapStatus,
        payStatus,
        availability,
        otherImages: uploadedOtherImages,
      };

      // Add product to Firestore first to get the productId
      const itemId = await addItemToFirestore(newItem);

      // Generate and save search keywords to separate collection
      const keywords = generateSearchKeywords(newItem);
      await saveKeywordsToCollection(itemId, keywords, tags); // Pass tags array

      router.push({
        pathname: '/AddProductConfirmation',
        params: { name, itemId },
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to add item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Fixed Header */}
      <Header />
      
      {/* Scrollable Content */}
      <ScrollView className="flex-1 bg-gradient-to-b from-white to-gray-100 p-5">
        
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.push('/(tabs)/Home')} className="mr-3 p-2">
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text className="text-3xl font-extrabold text-gray-900 flex-1">Add New Item</Text>
        </View>

      <View className="mb-6 items-center">
        <Image
          source={imageUri ? { uri: imageUri } : { uri: 'https://placehold.co/200x200' }}
          className="w-48 h-48 rounded-2xl shadow-lg mb-4"
          style={{ borderWidth: 1, borderColor: '#e5e7eb' }}
        />
        <View className="flex-row space-x-4 mb-3">
          <TouchableOpacity
            onPress={() => handlePickImage(true)}
            className="bg-blue-500 px-6 py-3 rounded-full flex-row items-center shadow-lg hover:bg-blue-600 transition-all"
          >
            <Ionicons name="camera-outline" size={22} color="white" />
            <Text className="text-white font-semibold text-base ml-2">Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handlePickImage(false)}
            className="bg-green-500 px-6 py-3 rounded-full flex-row items-center shadow-lg hover:bg-green-600 transition-all"
          >
            <Ionicons name="images-outline" size={22} color="white" />
            <Text className="text-white font-semibold text-base ml-2">Gallery</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleAIAutofill}
          disabled={aiLoading}
          className={`flex-row items-center justify-center rounded-full px-6 py-3 shadow-lg transition-all
            ${aiLoading ? 'bg-purple-400 opacity-70' : 'bg-purple-500 hover:bg-purple-600'}`}
        >
          <Ionicons name="hardware-chip-outline" size={22} color="white" style={{ marginRight: 8 }} />
          <Text className="text-white font-semibold text-base">
            {aiLoading ? 'Generating...' : 'AI Autofill'}
          </Text>
        </TouchableOpacity>
      </View>

      {!imageUri && (
        <Text className="text-red-500 mb-5 text-center font-medium">
          Select an image to enable AI autofill.
        </Text>
      )}

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Item Name*"
        className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-5 shadow-sm text-gray-900 placeholder-gray-400"
      />

      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Description*"
        multiline
        className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-5 shadow-sm text-gray-900 placeholder-gray-400 h-28"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5 space-x-3">
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setCategory(cat)}
            className={`px-5 py-2.5 rounded-full border transition-all ${
              category === cat ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-200'
            } shadow-sm`}
          >
            <Text className={`font-semibold ${category === cat ? 'text-white' : 'text-gray-700'}`}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View className="flex-row justify-between items-center mb-5 px-2">
        <Text className="text-gray-800 font-semibold text-lg">Swap Only</Text>
        <Switch
          value={swapOnly}
          onValueChange={setSwapOnly}
          trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
          thumbColor={swapOnly ? '#ffffff' : '#f3f4f6'}
        />
      </View>

      {/* New Status Fields */}
      <View className="bg-gray-50 p-4 rounded-2xl mb-5 shadow-sm">
        <Text className="text-gray-900 font-bold text-lg mb-3">Product Status</Text>
        
        <View className="flex-row justify-between items-center mb-3 px-2">
          <Text className="text-gray-700 font-medium">Allow Swap</Text>
          <Switch
            value={swapStatus}
            onValueChange={setSwapStatus}
            trackColor={{ false: '#d1d5db', true: '#10b981' }}
            thumbColor={swapStatus ? '#ffffff' : '#f3f4f6'}
          />
        </View>

        <View className="flex-row justify-between items-center mb-3 px-2">
          <Text className="text-gray-700 font-medium">Allow Payment</Text>
          <Switch
            value={payStatus}
            onValueChange={setPayStatus}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
            thumbColor={payStatus ? '#ffffff' : '#f3f4f6'}
          />
        </View>

        <View className="flex-row justify-between items-center px-2">
          <Text className="text-gray-700 font-medium">Available for Sale</Text>
          <Switch
            value={availability}
            onValueChange={setAvailability}
            trackColor={{ false: '#d1d5db', true: '#f59e0b' }}
            thumbColor={availability ? '#ffffff' : '#f3f4f6'}
          />
        </View>
      </View>

      {!swapOnly && (
        <TextInput
          value={price}
          onChangeText={setPrice}
          placeholder="Price (optional)"
          keyboardType="numeric"
          className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-5 shadow-sm text-gray-900 placeholder-gray-400"
        />
      )}

      <TextInput
        value={condition}
        onChangeText={setCondition}
        placeholder="Condition"
        className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-5 shadow-sm text-gray-900 placeholder-gray-400"
      />

      <TextInput
        value={String(stock)}
        onChangeText={(val) => setStock(Number(val))}
        placeholder="Stock"
        keyboardType="numeric"
        className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-5 shadow-sm text-gray-900 placeholder-gray-400"
      />

      <View className="flex-row flex-wrap mb-5 space-x-2">
        {[...MOCK_TAGS, ...tags.filter((tag) => !MOCK_TAGS.includes(tag))].map((tag) => (
          <TouchableOpacity
            key={tag}
            onPress={() => toggleTag(tag)}
            className={`px-4 py-2 rounded-full border transition-all ${
              tags.includes(tag) ? 'bg-green-500 border-green-500' : 'bg-white border-gray-200'
            } mb-2 shadow-sm`}
          >
            <Text className={`font-medium ${tags.includes(tag) ? 'text-white' : 'text-gray-700'}`}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="flex-row mb-6">
        <TextInput
          value={customTag}
          onChangeText={setCustomTag}
          placeholder="Add custom tag"
          className="flex-1 bg-white border border-gray-200 rounded-l-2xl px-5 py-4 shadow-sm text-gray-900 placeholder-gray-400"
        />
        <TouchableOpacity
          onPress={handleAddCustomTag}
          className="bg-blue-500 px-5 py-4 rounded-r-2xl flex-row items-center shadow-lg hover:bg-blue-600 transition-all"
        >
          <Ionicons name="add-outline" size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* Other Images Section */}
      <View className="mb-6">
        <Text className="text-gray-900 font-bold text-lg mb-3">Additional Images (Optional)</Text>
        
        <TouchableOpacity
          onPress={handlePickOtherImages}
          className="bg-indigo-500 py-3 rounded-full flex-row items-center justify-center shadow-lg mb-3"
        >
          <Ionicons name="images" size={22} color="white" />
          <Text className="text-white font-semibold text-base ml-2">
            Add More Images ({otherImages.length})
          </Text>
        </TouchableOpacity>

        {otherImages.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-3">
            {otherImages.map((uri, index) => (
              <View key={index} className="relative">
                <Image
                  source={{ uri }}
                  className="w-24 h-24 rounded-xl"
                  style={{ borderWidth: 1, borderColor: '#e5e7eb' }}
                />
                <TouchableOpacity
                  onPress={() => handleRemoveOtherImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <TouchableOpacity
        onPress={handleAddItem}
        disabled={loading}
        className={`bg-green-500 py-4 rounded-full items-center justify-center flex-row shadow-lg mb-10 transition-all ${
          loading ? 'opacity-50' : 'hover:bg-green-600'
        }`}
      >
        <Ionicons name="add-circle-outline" size={24} color="white" className="mr-2" />
        <Text className="text-white font-semibold text-lg">
          {loading ? 'Adding...' : 'Add Item'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
    
    {/* Fixed Bottom Navigation */}
    <BottomNavigation currentRoute="/AddProduct" />
  </SafeAreaView>
  );
}