import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BottomNavigation from '../components/BottomNavigation';
import Header from '../components/Header';
import Colors from '../constants/Colors';
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.background.primary }}>
      {/* Fixed Header */}
      <Header />
      
      {/* Scrollable Content */}
      <ScrollView className="flex-1 p-5">
        
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.push('/(tabs)/Home')} className="mr-3 p-2">
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text className="text-3xl font-extrabold flex-1" style={{ color: Colors.text.primary }}>Add New Item</Text>
        </View>

      <View className="mb-6 items-center">
        <Image
          source={imageUri ? { uri: imageUri } : { uri: 'https://placehold.co/200x200' }}
          className="w-48 h-48 rounded-2xl shadow-lg mb-4"
          style={{ borderWidth: 1, borderColor: Colors.border.default }}
        />
        <View className="flex-row space-x-4 mb-3">
          <TouchableOpacity
            onPress={() => handlePickImage(true)}
            className="px-6 py-3 rounded-full flex-row items-center shadow-lg"
            style={{ backgroundColor: Colors.accent }}
          >
            <Ionicons name="camera-outline" size={22} color="white" />
            <Text className="text-white font-semibold text-base ml-2">Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handlePickImage(false)}
            className="px-6 py-3 rounded-full flex-row items-center shadow-lg"
            style={{ backgroundColor: Colors.success }}
          >
            <Ionicons name="images-outline" size={22} color="white" />
            <Text className="text-white font-semibold text-base ml-2">Gallery</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleAIAutofill}
          disabled={aiLoading}
          className="flex-row items-center justify-center rounded-full px-6 py-3 shadow-lg"
          style={{ 
            backgroundColor: aiLoading ? Colors.text.tertiary : Colors.info,
            opacity: aiLoading ? 0.7 : 1
          }}
        >
          <Ionicons name="hardware-chip-outline" size={22} color="white" style={{ marginRight: 8 }} />
          <Text className="text-white font-semibold text-base">
            {aiLoading ? 'Generating...' : 'AI Autofill'}
          </Text>
        </TouchableOpacity>
      </View>

      {!imageUri && (
        <Text className="mb-5 text-center font-medium" style={{ color: Colors.error }}>
          Select an image to enable AI autofill.
        </Text>
      )}

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Item Name*"
        placeholderTextColor={Colors.text.tertiary}
        className="rounded-2xl px-5 py-4 mb-5 shadow-sm"
        style={{
          backgroundColor: Colors.card.background,
          borderWidth: 1,
          borderColor: Colors.border.default,
          color: Colors.text.primary
        }}
      />

      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Description*"
        placeholderTextColor={Colors.text.tertiary}
        multiline
        className="rounded-2xl px-5 py-4 mb-5 shadow-sm h-28"
        style={{
          backgroundColor: Colors.card.background,
          borderWidth: 1,
          borderColor: Colors.border.default,
          color: Colors.text.primary
        }}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5 space-x-3">
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setCategory(cat)}
            className="px-5 py-2.5 rounded-full shadow-sm"
            style={{
              backgroundColor: category === cat ? Colors.accent : Colors.card.background,
              borderWidth: 1,
              borderColor: category === cat ? Colors.accent : Colors.border.default
            }}
          >
            <Text 
              className="font-semibold"
              style={{ color: category === cat ? Colors.white : Colors.text.primary }}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View className="flex-row justify-between items-center mb-5 px-2">
        <Text className="font-semibold text-lg" style={{ color: Colors.text.primary }}>Swap Only</Text>
        <Switch
          value={swapOnly}
          onValueChange={setSwapOnly}
          trackColor={{ false: Colors.border.default, true: Colors.accent + '80' }}
          thumbColor={swapOnly ? Colors.accent : Colors.background.secondary}
        />
      </View>

      {/* New Status Fields */}
      <View className="p-4 rounded-2xl mb-5 shadow-sm" style={{ backgroundColor: Colors.background.tertiary }}>
        <Text className="font-bold text-lg mb-3" style={{ color: Colors.text.primary }}>Product Status</Text>
        
        <View className="flex-row justify-between items-center mb-3 px-2">
          <Text className="font-medium" style={{ color: Colors.text.primary }}>Allow Swap</Text>
          <Switch
            value={swapStatus}
            onValueChange={setSwapStatus}
            trackColor={{ false: Colors.border.default, true: Colors.success + '80' }}
            thumbColor={swapStatus ? Colors.success : Colors.background.secondary}
          />
        </View>

        <View className="flex-row justify-between items-center mb-3 px-2">
          <Text className="font-medium" style={{ color: Colors.text.primary }}>Allow Payment</Text>
          <Switch
            value={payStatus}
            onValueChange={setPayStatus}
            trackColor={{ false: Colors.border.default, true: Colors.accent + '80' }}
            thumbColor={payStatus ? Colors.accent : Colors.background.secondary}
          />
        </View>

        <View className="flex-row justify-between items-center px-2">
          <Text className="font-medium" style={{ color: Colors.text.primary }}>Available for Sale</Text>
          <Switch
            value={availability}
            onValueChange={setAvailability}
            trackColor={{ false: Colors.border.default, true: Colors.accent + '80' }}
            thumbColor={availability ? Colors.accent : Colors.background.secondary}
          />
        </View>
      </View>

      {!swapOnly && (
        <TextInput
          value={price}
          onChangeText={setPrice}
          placeholder="Price (optional)"
          placeholderTextColor={Colors.text.tertiary}
          keyboardType="numeric"
          className="rounded-2xl px-5 py-4 mb-5 shadow-sm"
          style={{
            backgroundColor: Colors.card.background,
            borderWidth: 1,
            borderColor: Colors.border.default,
            color: Colors.text.primary
          }}
        />
      )}

      <TextInput
        value={condition}
        onChangeText={setCondition}
        placeholder="Condition"
        placeholderTextColor={Colors.text.tertiary}
        className="rounded-2xl px-5 py-4 mb-5 shadow-sm"
        style={{
          backgroundColor: Colors.card.background,
          borderWidth: 1,
          borderColor: Colors.border.default,
          color: Colors.text.primary
        }}
      />

      <TextInput
        value={String(stock)}
        onChangeText={(val) => setStock(Number(val))}
        placeholder="Stock"
        placeholderTextColor={Colors.text.tertiary}
        keyboardType="numeric"
        className="rounded-2xl px-5 py-4 mb-5 shadow-sm"
        style={{
          backgroundColor: Colors.card.background,
          borderWidth: 1,
          borderColor: Colors.border.default,
          color: Colors.text.primary
        }}
      />

      <View className="flex-row flex-wrap mb-5 space-x-2">
        {[...MOCK_TAGS, ...tags.filter((tag) => !MOCK_TAGS.includes(tag))].map((tag) => (
          <TouchableOpacity
            key={tag}
            onPress={() => toggleTag(tag)}
            className="px-4 py-2 rounded-full mb-2 shadow-sm"
            style={{
              backgroundColor: tags.includes(tag) ? Colors.success : Colors.card.background,
              borderWidth: 1,
              borderColor: tags.includes(tag) ? Colors.success : Colors.border.default
            }}
          >
            <Text 
              className="font-medium"
              style={{ color: tags.includes(tag) ? Colors.white : Colors.text.primary }}
            >
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
          placeholderTextColor={Colors.text.tertiary}
          className="flex-1 rounded-l-2xl px-5 py-4 shadow-sm"
          style={{
            backgroundColor: Colors.card.background,
            borderWidth: 1,
            borderColor: Colors.border.default,
            color: Colors.text.primary
          }}
        />
        <TouchableOpacity
          onPress={handleAddCustomTag}
          className="px-5 py-4 rounded-r-2xl flex-row items-center shadow-lg"
          style={{ backgroundColor: Colors.accent }}
        >
          <Ionicons name="add-outline" size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* Other Images Section */}
      <View className="mb-6">
        <Text className="font-bold text-lg mb-3" style={{ color: Colors.text.primary }}>Additional Images (Optional)</Text>
        
        <TouchableOpacity
          onPress={handlePickOtherImages}
          className="py-3 rounded-full flex-row items-center justify-center shadow-lg mb-3"
          style={{ backgroundColor: Colors.info }}
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
                  style={{ borderWidth: 1, borderColor: Colors.border.default }}
                />
                <TouchableOpacity
                  onPress={() => handleRemoveOtherImage(index)}
                  className="absolute -top-2 -right-2 rounded-full p-1"
                  style={{ backgroundColor: Colors.error }}
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
        className="py-4 rounded-full items-center justify-center flex-row shadow-lg mb-10"
        style={{ 
          backgroundColor: Colors.success,
          opacity: loading ? 0.5 : 1
        }}
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