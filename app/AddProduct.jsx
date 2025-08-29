import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { Image, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { generateProductDetails } from '../services/aiService';
import { addItemToFirestore } from '../services/itemService';

const CATEGORIES = ['Electronics', 'Furniture', 'Books', 'Clothing', 'Others'];
const MOCK_TAGS = ['Emergency', 'Good Condition', 'Limited Time', 'New Arrival'];

export default function AddItemScreen() {
  const router = useRouter();

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

  // Pick image
  const handlePickImage = async (fromCamera = true) => {
    try {
      const permissionStatus = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionStatus.status !== 'granted') {
        alert('Permission required to select an image.');
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7, aspect: [4, 4] })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            quality: 0.7,
            aspect: [4, 4],
          });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle tag selection
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
      alert('Please select an image first to use AI autofill.');
      return;
    }

    setAiLoading(true);
    try {
      const result = await generateProductDetails(imageUri);

      if (!result) {
        alert('AI returned no data.');
        return;
      }

      let details;

      // If AI returns text, try to parse it as JSON
      if (typeof result === 'string') {
        try {
          details = JSON.parse(result);
        } catch (err) {
          console.error('Failed to parse AI response as JSON:', err);
          alert('Failed to parse AI response.');
          return;
        }
      } else {
        // Already JSON object
        details = result;
      }

      console.log('Parsed AI Details:', details);

      // Update form fields
      setName(details.name || '');
      setDescription(details.description || '');
      setCategory(CATEGORIES.includes(details.category) ? details.category : CATEGORIES[0]);
      setPrice(details.price != null ? String(details.price) : '');
      setCondition(details.condition || '');
      setSwapOnly(details.swapOnly || false);
      setTags(
        Array.isArray(details.tags) ? details.tags.filter((tag) => typeof tag === 'string') : [],
      );
      setStock(details.stock != null ? String(details.stock) : '1');
    } catch (err) {
      console.error('Error generating AI details:', err);
      alert('Error generating AI details.');
    } finally {
      setAiLoading(false);
    }
  };

  // Add item to Firestore
  const handleAddItem = async () => {
    if (!name || !description) {
      alert('Please fill all required fields.');
      return;
    }

    setLoading(true);
    try {
      const newItem = {
        name,
        description,
        category,
        price: Number(price) || 0,
        swapOnly,
        condition,
        imageUrl: imageUri || 'https://placehold.co/600x400',
        tags,
        stock: Number(stock) || 1,
        ownerId: 'mockUserId2', // Replace with actual user ID
        createdAt: serverTimestamp(),
      };

      const itemId = await addItemToFirestore(newItem);

      router.push({
        pathname: '/AddProductConfirmation',
        params: { name, itemId },
      });
    } catch (err) {
      console.error(err);
      alert('Failed to add item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-900 mb-4">Add New Item</Text>

      {/* Image Picker */}
      <View className="mb-4 items-center">
        <Image
          source={imageUri ? { uri: imageUri } : { uri: 'https://placehold.co/200x200' }}
          className="w-44 h-44 rounded-xl shadow-md mb-3"
        />
        <View className="flex-row space-x-3 mb-2">
          <TouchableOpacity
            onPress={() => handlePickImage(true)}
            className="bg-blue-600 px-5 py-3 rounded-xl flex-row items-center shadow-md"
          >
            <Ionicons name="camera-outline" size={20} color="white" />
            <Text className="text-white font-semibold text-base ml-2">Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handlePickImage(false)}
            className="bg-green-600 px-5 py-3 rounded-xl flex-row items-center shadow-md"
          >
            <Ionicons name="images-outline" size={20} color="white" />
            <Text className="text-white font-semibold text-base ml-2">Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* AI Autofill */}
       
<TouchableOpacity
  onPress={handleAIAutofill}
  disabled={aiLoading}
  className={`flex-row items-center justify-center rounded-2xl px-6 py-3 shadow-lg
    ${aiLoading ? 'bg-purple-400 opacity-70' : 'bg-purple-600 active:bg-purple-700'}`}
>
  <Ionicons
    name="hardware-chip-outline"
    size={22}
    color="white"
    style={{ marginRight: 8 }}
  />
  <Text className="text-white text-base font-semibold">
    {aiLoading ? 'Generating...' : 'AI Autofill'}
  </Text>
</TouchableOpacity>
      </View>

      {!imageUri && (
        <Text className="text-red-500 mb-4 text-center">
          Select an image first to use AI autofill.
        </Text>
      )}

      {/* Name */}
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Item Name*"
        className="bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4 shadow-sm"
      />

      {/* Description */}
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Description*"
        multiline
        className="bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4 shadow-sm h-24"
      />

      {/* Category */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 space-x-2">
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full border ${
              category === cat ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
            }`}
          >
            <Text className={`${category === cat ? 'text-white font-semibold' : 'text-gray-700'}`}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Swap Only */}
      <View className="flex-row justify-between items-center mb-4 px-1">
        <Text className="text-gray-700 font-medium">Swap Only</Text>
        <Switch value={swapOnly} onValueChange={setSwapOnly} />
      </View>

      {/* Price */}
      {!swapOnly && (
        <TextInput
          value={price}
          onChangeText={setPrice}
          placeholder="Price (optional)"
          keyboardType="numeric"
          className="bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4 shadow-sm"
        />
      )}

      {/* Condition */}
      <TextInput
        value={condition}
        onChangeText={setCondition}
        placeholder="Condition"
        className="bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4 shadow-sm"
      />

      {/* Stock */}
      <TextInput
        value={String(stock)}
        onChangeText={(val) => setStock(Number(val))}
        placeholder="Stock"
        keyboardType="numeric"
        className="bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4 shadow-sm"
      />

{/* Tags */}
<View className="flex-row flex-wrap mb-4 space-x-2">
  {[...MOCK_TAGS, ...tags.filter((tag) => !MOCK_TAGS.includes(tag))].map((tag) => (
    <TouchableOpacity
      key={tag}
      onPress={() => toggleTag(tag)}
      className={`px-3 py-1 rounded-full border ${
        tags.includes(tag) ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'
      } mb-2`}
    >
      <Text className={`${tags.includes(tag) ? 'text-white' : 'text-gray-700'}`}>{tag}</Text>
    </TouchableOpacity>
  ))}
</View>

      {/* Custom Tag */}
      <View className="flex-row mb-6">
        <TextInput
          value={customTag}
          onChangeText={setCustomTag}
          placeholder="Add custom tag"
          className="flex-1 bg-white border border-gray-300 rounded-l-xl px-4 py-3 shadow-sm"
        />
        <TouchableOpacity
          onPress={handleAddCustomTag}
          className="bg-blue-600 px-4 py-3 rounded-r-xl flex-row items-center"
        >
          <Ionicons name="add-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Submit */}
      <TouchableOpacity
        onPress={handleAddItem}
        disabled={loading}
        className={`bg-green-600 py-4 rounded-2xl items-center justify-center flex-row shadow-md mb-8 ${
          loading ? 'opacity-50' : ''
        }`}
      >
        <Ionicons name="add-circle-outline" size={22} color="white" className="mr-2" />
        <Text className="text-white font-semibold text-lg">
          {loading ? 'Adding...' : 'Add Item'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
