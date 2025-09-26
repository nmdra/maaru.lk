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

      if (typeof result === 'string') {
        try {
          details = JSON.parse(result);
        } catch (err) {
          console.error('Failed to parse AI response as JSON:', err);
          alert('Failed to parse AI response.');
          return;
        }
      } else {
        details = result;
      }

      console.log('Parsed AI Details:', details);

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
        ownerId: 'mockUserId2',
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
    <ScrollView className="flex-1 bg-gradient-to-b from-white to-gray-100 p-5">
      <Text className="text-3xl font-extrabold text-gray-900 mb-6">Add New Item</Text>

      {/* Image Picker */}
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

        {/* AI Autofill */}
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

      {/* Name */}
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Item Name*"
        className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-5 shadow-sm text-gray-900 placeholder-gray-400"
      />

      {/* Description */}
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Description*"
        multiline
        className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-5 shadow-sm text-gray-900 placeholder-gray-400 h-28"
      />

      {/* Category */}
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

      {/* Swap Only */}
      <View className="flex-row justify-between items-center mb-5 px-2">
        <Text className="text-gray-800 font-semibold text-lg">Swap Only</Text>
        <Switch
          value={swapOnly}
          onValueChange={setSwapOnly}
          trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
          thumbColor={swapOnly ? '#ffffff' : '#f3f4f6'}
        />
      </View>

      {/* Price */}
      {!swapOnly && (
        <TextInput
          value={price}
          onChangeText={setPrice}
          placeholder="Price (optional)"
          keyboardType="numeric"
          className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-5 shadow-sm text-gray-900 placeholder-gray-400"
        />
      )}

      {/* Condition */}
      <TextInput
        value={condition}
        onChangeText={setCondition}
        placeholder="Condition"
        className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-5 shadow-sm text-gray-900 placeholder-gray-400"
      />

      {/* Stock */}
      <TextInput
        value={String(stock)}
        onChangeText={(val) => setStock(Number(val))}
        placeholder="Stock"
        keyboardType="numeric"
        className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-5 shadow-sm text-gray-900 placeholder-gray-400"
      />

      {/* Tags */}
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

      {/* Custom Tag */}
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

      {/* Submit */}
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
  );
}