import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
import { saveUserData } from '../../utils/storage';

export default function CompleteProfile() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get user data from params (passed from Google sign-in)
  const userId = params.userId;
  const email = params.email;
  const displayName = params.displayName || '';
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePhone = (val) => /^(\+?\d{10,15})$/.test(val);

  const handleCompleteProfile = async () => {
    if (!firstName || !lastName || !phone) {
      Alert.alert('Error', 'Please fill in all required fields (First Name, Last Name, Phone).');
      return;
    }

    if (!validatePhone(phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number (10-15 digits).');
      return;
    }

    setIsSubmitting(true);
    try {
      // Save complete profile to Firestore
      const userDocRef = doc(db, 'users', userId);
      await setDoc(
        userDocRef,
        {
          firstName,
          lastName,
          email,
          phone,
          address: address || '',
          displayName: `${firstName} ${lastName}`.trim(),
          role: 'buyer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Note: Not saving photoURL from Google to avoid using Firebase Storage
        },
        { merge: true }
      );

      // Save to AsyncStorage
      await saveUserData({
        userId: userId,
        email: email,
        name: `${firstName} ${lastName}`.trim(),
        role: 'buyer',
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        address: address || '',
        createdAt: new Date().toISOString(),
      });

      console.log('Profile completed for user:', userId);
      Alert.alert('Success', 'Profile completed successfully!');
      router.replace('/Home');
    } catch (error) {
      console.error('Error completing profile:', error);
      Alert.alert('Error', error?.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header Section */}
        <View className="bg-blue-600 px-6 pt-8 pb-20">
          <View className="items-center">
            <Ionicons name="person-add" size={60} color="white" />
            <Text className="text-white text-3xl font-bold mt-4">Complete Your Profile</Text>
            <Text className="text-white text-opacity-80 text-base mt-2 text-center">
              Please provide additional information to complete your account
            </Text>
          </View>
        </View>

        {/* Form Card */}
        <View className="mx-6 -mt-12 bg-white rounded-2xl shadow-lg p-6">
          <View className="space-y-5">
            {/* Email (Read-only) */}
            <View>
              <Text className="text-gray-700 font-medium mb-2">Email</Text>
              <View className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-4">
                <Text className="text-gray-600">{email}</Text>
              </View>
            </View>

            {/* First Name */}
            <View>
              <Text className="text-gray-700 font-medium mb-2">
                First Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your first name"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base"
              />
            </View>

            {/* Last Name */}
            <View>
              <Text className="text-gray-700 font-medium mb-2">
                Last Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter your last name"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base"
              />
            </View>

            {/* Phone */}
            <View>
              <Text className="text-gray-700 font-medium mb-2">
                Phone Number <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+1234567890"
                keyboardType="phone-pad"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base"
              />
              <Text className="text-gray-500 text-sm mt-1">Format: +1234567890 (10-15 digits)</Text>
            </View>

            {/* Address (Optional) */}
            <View>
              <Text className="text-gray-700 font-medium mb-2">Address (Optional)</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your address"
                multiline
                numberOfLines={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleCompleteProfile}
              className="bg-blue-600 py-4 rounded-xl mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-center text-base">
                  Complete Profile
                </Text>
              )}
            </Pressable>

            <Text className="text-gray-500 text-sm text-center mt-4">
              <Text className="text-red-500">*</Text> Required fields
            </Text>
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
