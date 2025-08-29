import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { db, storage } from '../../services/firebaseConfig';

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
  const [loading, setLoading] = useState(false);

  // Pick image from camera or gallery
  const handlePickImage = async (fromCamera = true) => {
    try {
      let permissionStatus;
      if (fromCamera) {
        permissionStatus = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (permissionStatus.status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission is required to select an image.');
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

  const toggleTag = (tag) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleAddCustomTag = () => {
    if (customTag && !tags.includes(customTag)) {
      setTags([...tags, customTag]);
      setCustomTag('');
    }
  };

  // Upload image to Firebase Storage
  const uploadImage = async (uri) => {
    if (!uri) return null;

    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `products/${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const storageRef = ref(storage, filename);

    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  };

  const handleAddItem = async () => {
    if (!name || !description || !category) {
      Alert.alert('Validation Error', 'Please fill all required fields.');
      return;
    }

    setLoading(true);

    try {
      const uploadedImageUrl = await uploadImage(imageUri);

      const newItem = {
        name,
        description,
        category,
        priceCents: price ? parseFloat(price) * 100 : null,
        swapOnly,
        condition,
        imageUrl: uploadedImageUrl || 'https://placehold.co/200x200',
        tags,
        ownerId: 'mockUserId', // TODO: Replace with actual user id
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'products'), newItem);
      Alert.alert('Item Added', `${name} has been added successfully!`);
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to add item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-900 mb-4">Add New Item</Text>

      {/* Image Picker */}
      <View className="mb-6 items-center">
        <Image
          source={imageUri ? { uri: imageUri } : { uri: 'https://placehold.co/200x200' }}
          className="w-44 h-44 rounded-xl shadow-md mb-3"
        />
        <View className="flex-row space-x-3">
          <TouchableOpacity
            onPress={() => handlePickImage(true)}
            className="bg-blue-600 px-5 py-3 rounded-xl flex-row items-center shadow-md"
          >
            <Ionicons name="camera-outline" size={20} color="white" className="mr-2" />
            <Text className="text-white font-semibold text-base">Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handlePickImage(false)}
            className="bg-green-600 px-5 py-3 rounded-xl flex-row items-center shadow-md"
          >
            <Ionicons name="images-outline" size={20} color="white" className="mr-2" />
            <Text className="text-white font-semibold text-base">Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Name */}
      <Text className="text-gray-700 mb-1 font-medium">Name*</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Enter item name"
        className="bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4 shadow-sm"
      />

      {/* Description */}
      <Text className="text-gray-700 mb-1 font-medium">Description*</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Enter item description"
        multiline
        className="bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4 shadow-sm h-24"
      />

      {/* Category */}
      <Text className="text-gray-700 mb-2 font-medium">Category*</Text>
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

      {/* Swap Only Toggle */}
      <View className="flex-row justify-between items-center mb-4 px-1">
        <Text className="text-gray-700 font-medium">Swap Only</Text>
        <Switch value={swapOnly} onValueChange={setSwapOnly} />
      </View>

      {/* Price */}
      {!swapOnly && (
        <>
          <Text className="text-gray-700 mb-1 font-medium">Price (optional)</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="Enter price in USD"
            keyboardType="numeric"
            className="bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4 shadow-sm"
          />
        </>
      )}

      {/* Condition */}
      <Text className="text-gray-700 mb-1 font-medium">Condition</Text>
      <TextInput
        value={condition}
        onChangeText={setCondition}
        placeholder="e.g., New, Like New, Used"
        className="bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4 shadow-sm"
      />

      {/* Tags Selection */}
      <Text className="text-gray-700 mb-2 font-medium">Tags</Text>
      <View className="flex-row flex-wrap mb-4 space-x-2">
        {MOCK_TAGS.map((tag) => (
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

      {/* Add Custom Tag */}
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

      {/* Add Button */}
      <TouchableOpacity
        onPress={handleAddItem}
        className={`bg-green-600 py-4 rounded-2xl items-center justify-center flex-row shadow-md mb-8 ${loading ? 'opacity-50' : ''}`}
        disabled={loading}
      >
        <Ionicons name="add-circle-outline" size={22} color="white" className="mr-2" />
        <Text className="text-white font-semibold text-lg">
          {loading ? 'Adding...' : 'Add Item'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
