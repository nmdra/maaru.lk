import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { auth, db } from '../../services/firebaseConfig';
import { ensureMinimalUserFields } from '../../services/userService';
import { LANGUAGE_OPTIONS, getLanguageName, useAppI18n } from '../../utils/i18n';
import { saveUserData } from '../../utils/storage';

export default function Login() {
  const router = useRouter();
  const { t, auth: authT, common, error, message, currentLanguage, changeLanguage } = useAppI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  // ✅ Email/Password login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await ensureMinimalUserFields(user.uid, {
        displayName: user.displayName || undefined,
        avatarUrl: undefined,
      });

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : {};

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

      Alert.alert('Success', 'Logged in');
      router.replace('/Home');
    } catch (err) {
      console.error('Login error:', err);
      Alert.alert('Login failed', err?.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Google login
  const handleGoogleLogin = async () => {
    setIsGoogleSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists() || !userDoc.data().firstName || !userDoc.data().lastName || !userDoc.data().phone) {
        router.push({
          pathname: '/(auth)/CompleteProfile',
          params: {
            userId: user.uid,
            email: user.email,
            displayName: user.displayName || '',
          },
        });
        return;
      }

      const userData = userDoc.data();

      await ensureMinimalUserFields(user.uid, {
        displayName: userData.displayName || user.displayName || undefined,
        avatarUrl: undefined,
      });

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

      Alert.alert('Success', 'Signed in with Google');
      router.replace('/Home');
    } catch (err) {
      console.error('Google sign-in error:', err);
      Alert.alert('Google Sign-In Failed', err?.message || 'An error occurred during Google authentication');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.background.primary }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* 🌈 Header with Brand Accent */}
        <View 
          className="px-6 pt-8 pb-16 rounded-b-3xl shadow-sm"
          style={{ backgroundColor: Colors.accent }}
        >
          <View className="flex-row items-center justify-end mb-6">
            {/* Language Selector Button */}
            <TouchableOpacity 
              onPress={() => setLanguageModalVisible(true)}
              className="flex-row items-center px-3 py-2 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              activeOpacity={0.7}
            >
              <Ionicons name="language" size={18} color="white" />
              <Text className="text-white text-sm font-medium ml-2">
                {getLanguageName(currentLanguage, true)}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="items-center justify-center">
            <Text className="text-white text-3xl font-bold mb-2 text-center">{t('auth.welcomeBack')} 👋</Text>
            <Text className="text-sm text-center text-white opacity-90">
              {t('auth.signInToContinue')}
            </Text>
          </View>
        </View>

        {/* 💳 Login Card */}
        <View className="mx-6 -mt-8 rounded-3xl shadow-lg p-6 border" style={{ backgroundColor: Colors.card.background, borderColor: Colors.border.light }}>
          {/* Logo */}
          <View className="items-center -mt-12 mb-6">
            <View className="w-24 h-24 rounded-full shadow-md items-center justify-center border overflow-hidden" style={{ backgroundColor: Colors.white, borderColor: Colors.border.default }}>
              <Image
                source={require('../../assets/images/logo_int.png')}
                style={{ width: 70, height: 70 }}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Form Fields */}
          <View className="space-y-4">
            {/* Email Field */}
            <View className="mb-4">
              <Text className="font-medium mb-2 text-base" style={{ color: Colors.text.primary }}>Email</Text>
              <View className="flex-row items-center border rounded-xl px-4 py-3" style={{ borderColor: Colors.input.border, backgroundColor: Colors.input.background }}>
                <Ionicons name="mail-outline" size={20} color={Colors.gray[500]} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="flex-1 ml-3 text-base"
                  style={{ color: Colors.input.text }}
                  placeholderTextColor={Colors.input.placeholder}
                />
              </View>
            </View>

            {/* Password Field */}
            <View className="mb-6">
              <Text className="font-medium mb-2 text-base" style={{ color: Colors.text.primary }}>Password</Text>
              <View className="flex-row items-center border rounded-xl px-4 py-3" style={{ borderColor: Colors.input.border, backgroundColor: Colors.input.background }}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.gray[500]} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  className="flex-1 ml-3 text-base"
                  style={{ color: Colors.input.text }}
                  placeholderTextColor={Colors.input.placeholder}
                />
              </View>
            </View>

            {/* Sign In Button - Brand Orange Accent */}
            <Pressable
              onPress={handleLogin}
              disabled={isSubmitting}
              className="py-4 rounded-xl shadow-sm active:opacity-80"
              style={{ backgroundColor: Colors.button.primary }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">Sign In</Text>
              )}
            </Pressable>

            {/* Divider */}
            <View className="flex-row items-center my-5">
              <View className="flex-1 h-px" style={{ backgroundColor: Colors.border.default }} />
              <Text className="mx-4 text-sm font-medium" style={{ color: Colors.text.tertiary }}>OR</Text>
              <View className="flex-1 h-px" style={{ backgroundColor: Colors.border.default }} />
            </View>

            {/* Google Login */}
            <Pressable
              onPress={handleGoogleLogin}
              disabled={isGoogleSubmitting}
              className="border py-4 rounded-xl flex-row items-center justify-center shadow-sm active:opacity-80"
              style={{ backgroundColor: Colors.button.secondary, borderColor: Colors.button.secondaryBorder }}
            >
              {isGoogleSubmitting ? (
                <ActivityIndicator color={Colors.accent} />
              ) : (
                <>
                  <Image
                    source={require('../../assets/images/google.png')}
                    style={{ width: 22, height: 22, marginRight: 10 }}
                  />
                  <Text className="font-semibold text-base" style={{ color: Colors.text.primary }}>Continue with Google</Text>
                </>
              )}
            </Pressable>

            {/* Forgot Password */}
            <TouchableOpacity onPress={() => router.push('/forgotPassword')} className="mt-4 items-center">
              <Text className="font-medium text-base" style={{ color: Colors.text.accent }}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Create Account */}
            <View className="items-center mt-5 mb-2">
              <Text className="text-base" style={{ color: Colors.text.secondary }}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/SignUp')} className="mt-2">
                <Text className="font-semibold text-lg" style={{ color: Colors.text.accent }}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Guest Option */}
        <View className="mx-6 mt-8 mb-10 items-center">
          <Pressable onPress={() => router.push('/Home')} className="active:opacity-70">
            <Text className="font-medium text-base" style={{ color: Colors.text.secondary }}>{t('auth.continueAsGuest')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={languageModalVisible}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.background.overlay }}>
          <View style={{ backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', flex: 1, color: Colors.text.primary }}>
                {t('auth.selectLanguage')}
              </Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Current Language */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 15 }}>
              <Text style={{ fontSize: 14, color: Colors.text.secondary, marginBottom: 5 }}>
                {t('auth.currentLanguage')}: {getLanguageName(currentLanguage, true)}
              </Text>
            </View>

            {/* Language Options */}
            <ScrollView style={{ maxHeight: 300 }}>
              {LANGUAGE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.code}
                  onPress={() => {
                    changeLanguage(option.code);
                    setLanguageModalVisible(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 15,
                    backgroundColor: currentLanguage === option.code ? Colors.background.accent : Colors.white,
                    borderLeftWidth: currentLanguage === option.code ? 4 : 0,
                    borderLeftColor: Colors.accent,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: currentLanguage === option.code ? 'bold' : 'normal',
                      color: currentLanguage === option.code ? Colors.text.accent : Colors.text.primary
                    }}>
                      {option.nativeName}
                    </Text>
                    <Text style={{ 
                      fontSize: 14, 
                      color: Colors.text.secondary, 
                      marginTop: 2 
                    }}>
                      {option.englishName}
                    </Text>
                  </View>
                  {currentLanguage === option.code && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Bottom spacing for safe area */}
            <View style={{ height: 30 }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}