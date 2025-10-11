// app/SignUp.jsx
// ...existing code...
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, getAuth, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../services/firebaseConfig';
import { ensureMinimalUserFields } from '../../services/userService';
import { saveUserData } from '../../utils/storage';

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

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const validatePhone = (val) => /^(\+?\d{10,15})$/.test(val);
  const validateAge = (val) => {
    const n = Number(val);
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

    setIsSubmitting(true);
    try {
      // 1) Create auth user first (so we have user.uid)
      const auth = getAuth();
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // optional: set display name in Auth profile
      const displayName = `${firstName} ${lastName}`.trim();
      await updateProfile(user, { displayName }).catch(() => {});

      // 2) Save your extended profile schema (merge safe) - NO PHOTO UPLOAD
      await setDoc(
        doc(db, 'users', user.uid),
        {
          firstName,
          lastName,
          email,
          address,
          born: age,
          phone,
          uid: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          displayName,
          // No photoURL - not using Firebase Storage
        },
        { merge: true }
      );

      // 3) Ensure minimal fields for chat UI (name/avatar/role) — merge, won't conflict
      await ensureMinimalUserFields(user.uid, {
        displayName,
        avatarUrl: undefined, // No profile photo
        role: 'buyer', // change if this sign-up is for sellers
      });

      // 4) Save user data to AsyncStorage (without profile photo)
      await saveUserData({
        userId: user.uid,
        email: email,
        name: displayName,
        role: 'buyer',
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        address: address,
        createdAt: new Date().toISOString(),
      });

      Alert.alert('Success', `User registered (id: ${user.uid})`);

      // Clear form
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setAddress('');
      setAge('');
      setPhone('');

      router.replace('/Home');
    } catch (error) {
      console.error('Error adding document: ', error);
      Alert.alert('Error saving user', error?.message || String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // For Age: allow only digits
  const handleAgeChange = (text) => setAge(text.replace(/[^0-9]/g, ''));

  // For Phone: allow only digits and +
  const handlePhoneChange = (text) => setPhone(text.replace(/[^0-9+]/g, ''));

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
          {/* Logo Section (No Photo Upload) */}
          <View className="items-center -mt-16 mb-8">
            <View className="w-32 h-32 rounded-full bg-white p-1 shadow-lg">
              <View className="w-full h-full rounded-full bg-blue-500 items-center justify-center">
                <Text className="text-white text-4xl font-bold">M</Text>
              </View>
            </View>
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
              <Pressable onPress={() => router.replace('/(auth)/Login')} className="border border-gray-200 py-4 rounded-xl">
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
