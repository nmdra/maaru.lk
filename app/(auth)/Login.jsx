import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../services/firebaseConfig';
import { ensureMinimalUserFields } from '../../services/userService';
import { useAppI18n } from '../../utils/i18n';
import { saveUserData } from '../../utils/storage';

export default function Login() {
  const router = useRouter();
  const { t, auth: authT, common, error, message } = useAppI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  // Email/Password login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 👇 ensure minimal fields used by chat (safe merge, won't break your schema)
      await ensureMinimalUserFields(user.uid, {
        displayName: user.displayName || undefined,
        avatarUrl: undefined, // Don't store profile photo
        // role left default ('buyer') unless you want to pass one here
      });

      // Get additional user data from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : {};

      // Save user data to AsyncStorage (without profile photo)
      await saveUserData({
        userId: user.uid,
        email: user.email,
        name: user.displayName || userData.displayName || userData.firstName || 'User',
        role: userData.role || 'buyer',
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        address: userData.address || '',
        createdAt: userData.createdAt || new Date().toISOString(),
      });

      console.log('User signed in:', user.uid);
      Alert.alert('Success', 'Logged in');
      router.replace('/Home');
    } catch (err) {
      console.error('Login error:', err);
      Alert.alert('Login failed', err?.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google login (note: signInWithPopup works on web; use Expo AuthSession for native)
  const handleGoogleLogin = async () => {
    setIsGoogleSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user profile exists and is complete
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists() || !userDoc.data().firstName || !userDoc.data().lastName || !userDoc.data().phone) {
        // Profile incomplete - redirect to complete profile page
        console.log('Profile incomplete, redirecting to complete profile');
        router.push({
          pathname: '/(auth)/CompleteProfile',
          params: {
            userId: user.uid,
            email: user.email,
            displayName: user.displayName || '',
          }
        });
        return;
      }

      // Profile exists and is complete
      const userData = userDoc.data();

      await ensureMinimalUserFields(user.uid, {
        displayName: userData.displayName || user.displayName || undefined,
        avatarUrl: undefined, // Don't use profile photo from Google
      });

      // Save user data to AsyncStorage (without profile photo)
      await saveUserData({
        userId: user.uid,
        email: user.email,
        name: userData.displayName || `${userData.firstName} ${userData.lastName}`.trim(),
        role: userData.role || 'buyer',
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        address: userData.address || '',
        createdAt: userData.createdAt || new Date().toISOString(),
      });

      console.log('Google sign-in successful:', user.uid);
      Alert.alert('Success', 'Signed in with Google');
      router.replace('/Home');
    } catch (err) {
      console.error('Google sign-in error:', err);
      const errorMessage = err?.message;
      Alert.alert('Google Sign-In Failed', errorMessage || 'An error occurred during Google authentication');
    } finally {
      setIsGoogleSubmitting(false);
    }
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
            <Text className="text-white text-3xl font-bold">Welcome Back</Text>
            <Text className="text-white text-opacity-80 text-base mb-2">Sign in to continue to Maaru.LK</Text>
          </View>
        </View>

        {/* Login Card */}
        <View className="mx-6 -mt-12 bg-white rounded-2xl shadow-lg p-6">
          {/* Logo/Icon Section */}
          <View className="items-center -mt-16 mb-8">
            <View className="w-32 h-32 rounded-full bg-white p-1 shadow-lg">
              <View className="w-full h-full rounded-full bg-blue-500 items-center justify-center">
                <Text className="text-white text-4xl font-bold">M</Text>
              </View>
            </View>
          </View>

          {/* Form Section */}
          <View className="space-y-5">
            <View>
              <Text className="text-gray-700 font-medium mb-2">Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base"
              />
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base"
              />
            </View>

            {/* Login Button */}
            <Pressable
              onPress={handleLogin}
              className="bg-blue-600 py-4 rounded-xl mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-center text-base">Sign In</Text>
              )}
            </Pressable>

            {/* divide */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="mx-4 text-gray-500 text-sm">or</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* Google Login Button */}
            <Pressable
              onPress={handleGoogleLogin}
              className="bg-white border border-gray-300 py-4 rounded-xl flex-row items-center justify-center"
              disabled={isGoogleSubmitting}
            >
              {isGoogleSubmitting ? (
                <ActivityIndicator color="#4285F4" />
              ) : (
                <>
                  <Image
                    source={require('../../assets/images/google.png')}
                    style={{ width: 20, height: 20, marginRight: 12, resizeMode: 'contain' }}
                  />
                  <Text className="text-gray-700 font-semibold text-base">Continue with Google</Text>
                </>
              )}
            </Pressable>

            {/* Forgot Password */}
            <Pressable onPress={() => router.push('/forgotPassword')} className="py-2 items-center">
              <Text className="text-gray-500">Forgot Password?</Text>
            </Pressable>

            {/* Create account */}
            <View className="items-center mt-3">
              <Text className="text-sm text-gray-500">Don't have an account?</Text>
              <Pressable onPress={() => router.push('/(auth)/SignUp')} className="mt-2">
                <Text className="text-blue-600 font-semibold">Create Account</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Continue as Guest */}
        <View className="mx-6 mt-6 mb-8 items-center">
          <Pressable onPress={() => router.push('/Home')}>
            <Text className="text-gray-500">Continue as Guest</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
