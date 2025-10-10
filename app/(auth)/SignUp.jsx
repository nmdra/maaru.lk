// ...existing code...
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../services/firebaseConfig';

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoURL, setPhotoURL] = useState('');

  const validateEmail = (email) => {
  // Simple email regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePhone = (phone) => {
  // Accepts 10-15 digits, can start with +, no spaces
  return /^(\+?\d{10,15})$/.test(phone);
};

const validateAge = (age) => {
  const n = Number(age);
  return Number.isInteger(n) && n >= 10 && n <= 120;
};


  const handleRegister = async () => {
    if (!email || !password || !firstName || !lastName || !address || !age || !phone) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
      if (!validateEmail(email)) {
    Alert.alert('Invalid Email', 'Please enter a valid email address.');
    return;
  }
  if (!validatePhone(phone)) {
    Alert.alert('Invalid Phone', 'Please enter a valid phone number (10-15 digits, numbers only).');
    return;
  }
  if (!validateAge(age)) {
    Alert.alert('Invalid Age', 'Please enter a valid age (between 10 and 120).');
    return;
  }
let uploadedPhotoURL = '';
if (photo) {
  const response = await fetch(photo.uri);
  const blob = await response.blob();
  const storage = getStorage();
  const storageRef = ref(storage, `profilePictures/${user.uid}.jpg`);
  await uploadBytes(storageRef, blob);
  uploadedPhotoURL = await getDownloadURL(storageRef);
}
    setIsSubmitting(true);
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('Sending to Firestore, db present?', !!db);
      await setDoc(doc(db, 'users', user.uid), {
        firstName: firstName,
        lastName: lastName,
        email,
        address,
        born: age,
        phone,
        uid: user.uid,
        createdAt: new Date().toISOString(),
        photoURL: uploadedPhotoURL,
      });
      console.log('Document written with ID: ', user.uid);
      Alert.alert('Success', `User registered (id: ${user.uid})`);

      // Clear form
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setAddress('');
      setAge('');
      setPhone('');
      setPhoto(null);
      setPhotoURL('');

      router.replace('/Home');
    } catch (error) {
      console.error('Error adding document: ', error);
      Alert.alert('Error saving user', error?.message || String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickPhoto = async () => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) {
    Alert.alert("Permission required", "Camera roll permissions are required!");
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (!result.canceled && result.assets?.length > 0) {
    setPhoto(result.assets[0]);
  }
};

// For Age: allow only digits
const handleAgeChange = (text) => {
  // Remove any non-digit characters
  const filtered = text.replace(/[^0-9]/g, '');
  setAge(filtered);
};

// For Phone: allow only digits and +
const handlePhoneChange = (text) => {
  // Remove any character that's not a digit or +
  const filtered = text.replace(/[^0-9+]/g, '');
  setPhone(filtered);
};

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        
        {/* Header Section */}
        <View className="bg-blue-600 px-6 pt-8 pb-20">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/Home')} 
              className="p-2 -ml-2"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View className="items-center">
            <Text className="text-white text-3xl font-bold mb-5">Join Maaru.LK</Text>

          </View>
        </View>

        {/* Registration Card */}
        <View className="mx-6 -mt-12 bg-white rounded-2xl shadow-lg p-6">
          
<View className="items-center -mt-16 mb-8">
  <Pressable onPress={handlePickPhoto}>
    <View className="w-32 h-32 rounded-full bg-white p-1 shadow-lg">
      {photo ? (
        <Image source={{ uri: photo.uri }} className="w-full h-full rounded-full" />
      ) : (
        <View className="w-full h-full rounded-full bg-blue-500 items-center justify-center">
          <Text className="text-white text-4xl font-bold">+</Text>
        </View>
      )}
    </View>
    <View className="items-center mt-2">
      <Text className="text-blue-600">Add Photo</Text>
    </View>
  </Pressable>
</View>

          {/* Form Section */}
          <View className="space-y-4">
            
            {/* Name Fields */}
            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-2">
                  First Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  autoCapitalize="words"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                />
                <Text className="text-xs text-gray-400 mt-1">Enter your first name</Text>
              </View>

              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-2">Last Name</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  autoCapitalize="words"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                />
              </View>
            </View>

            {/* Email */}
            <View>
              <Text className="text-gray-700 font-medium mb-2">
                Email Address <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
              />
              <Text className="text-xs text-gray-400 mt-1">Enter a valid email address</Text>
            </View>

            {/* Phone and Age */}
            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-2">
                  Phone <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={phone}
                  onChangeText={handlePhoneChange}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                />
                <Text className="text-xs text-gray-400 mt-1">0-15 digits</Text>
              </View>

              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-2">
                  Age <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={age}
                  onChangeText={handleAgeChange}
                  placeholder="Age"
                  keyboardType="numeric"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                />
                <Text className="text-xs text-gray-400 mt-1">Enter your age (10-120)</Text>
              </View>
            </View>

            {/* Address */}
            <View>
              <Text className="text-gray-700 font-medium mb-2">Address</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Your address"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
              />
            </View>

            {/* Password */}
            <View>
              <Text className="text-gray-700 font-medium mb-2">
                Password <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Choose a password"
                secureTextEntry
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
              />
              <Text className="text-xs text-gray-400 mt-1">At least 6 characters</Text>
            </View>

            {/* Register Button */}
            <Pressable
              onPress={handleRegister}
              className="bg-blue-600 py-4 rounded-xl mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-center text-base">Create Account</Text>
              )}
            </Pressable>

            {/* moved bottom actions up into the card */}
            <View className="mt-4 space-y-3">
              <Pressable onPress={() => router.replace('/login')} className="border border-gray-200 py-4 rounded-xl">
                <Text className="text-gray-700 font-semibold text-center">Already have an account? Sign In</Text>
              </Pressable>

              <Pressable onPress={() => router.push('/Home')} className="py-3 items-center">
                <Text className="text-gray-500">Continue as Guest</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* removed bottom section */}
      </ScrollView>
    </SafeAreaView>
  );
}