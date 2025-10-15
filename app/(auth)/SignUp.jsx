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
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { db } from '../../services/firebaseConfig';
import { ensureMinimalUserFields } from '../../services/userService';
import { LANGUAGE_OPTIONS, getLanguageName, useAppI18n } from '../../utils/i18n';
import { saveUserData } from '../../utils/storage';

export default function SignUp() {
  const router = useRouter();
  const { t, currentLanguage, changeLanguage, common } = useAppI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

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
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.background.primary }}>
      <ScrollView className="flex-1">
        {/* Header Section with Brand Orange */}
        <View className="px-6 pt-8 pb-20" style={{ backgroundColor: Colors.accent }}>
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/Home')} 
              className="p-2 -ml-2"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
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
          <View className="items-center">
            <Text className="text-white text-3xl font-bold mb-5">{t('auth.joinMaaruLK')}</Text>

          </View>
        </View>

        {/* Registration Card */}
        <View className="mx-6 -mt-12 rounded-2xl shadow-lg p-6" style={{ backgroundColor: Colors.card.background }}>
          {/* Logo Section (No Photo Upload) */}
          <View className="items-center -mt-16 mb-8">
            <View className="w-32 h-32 rounded-full p-1 shadow-lg" style={{ backgroundColor: Colors.white }}>
              <View className="w-full h-full rounded-full items-center justify-center" style={{ backgroundColor: Colors.accent }}>
                <Text className="text-white text-4xl font-bold">M</Text>
              </View>
            </View>
          </View>

          {/* Form Section */}
          <View className="space-y-4">
            {/* Name Fields */}
            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Text className="font-medium mb-2" style={{ color: Colors.text.primary }}>
                  {t('auth.firstName')} <Text style={{ color: Colors.error }}>*</Text>
                </Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder={t('auth.enterFirstName')}
                  autoCapitalize="words"
                  className="w-full rounded-xl px-4 py-3 text-base"
                  style={{ 
                    backgroundColor: Colors.input.background, 
                    borderWidth: 1, 
                    borderColor: Colors.input.border,
                    color: Colors.input.text
                  }}
                  placeholderTextColor={Colors.input.placeholder}
                />
                <Text className="text-xs mt-1" style={{ color: Colors.text.tertiary }}>{t('auth.enterFirstName')}</Text>
              </View>

              <View className="flex-1">
                <Text className="font-medium mb-2" style={{ color: Colors.text.primary }}>{t('auth.lastName')}</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder={t('auth.enterLastName')}
                  autoCapitalize="words"
                  className="w-full rounded-xl px-4 py-3 text-base"
                  style={{ 
                    backgroundColor: Colors.input.background, 
                    borderWidth: 1, 
                    borderColor: Colors.input.border,
                    color: Colors.input.text
                  }}
                  placeholderTextColor={Colors.input.placeholder}
                />
              </View>
            </View>

            {/* Email */}
            <View>
              <Text className="font-medium mb-2" style={{ color: Colors.text.primary }}>
                {t('auth.emailAddress')} <Text style={{ color: Colors.error }}>*</Text>
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.emailPlaceholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                className="w-full rounded-xl px-4 py-3 text-base"
                style={{ 
                  backgroundColor: Colors.input.background, 
                  borderWidth: 1, 
                  borderColor: Colors.input.border,
                  color: Colors.input.text
                }}
                placeholderTextColor={Colors.input.placeholder}
              />
              <Text className="text-xs mt-1" style={{ color: Colors.text.tertiary }}>{t('auth.emailAddress')}</Text>
            </View>

            {/* Phone and Age */}
            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Text className="font-medium mb-2" style={{ color: Colors.text.primary }}>
                  {t('auth.phoneNumber')} <Text style={{ color: Colors.error }}>*</Text>
                </Text>
                <TextInput
                  value={phone}
                  onChangeText={handlePhoneChange}
                  placeholder={t('auth.enterPhone')}
                  keyboardType="phone-pad"
                  className="w-full rounded-xl px-4 py-3 text-base"
                  style={{ 
                    backgroundColor: Colors.input.background, 
                    borderWidth: 1, 
                    borderColor: Colors.input.border,
                    color: Colors.input.text
                  }}
                  placeholderTextColor={Colors.input.placeholder}
                />
                <Text className="text-xs mt-1" style={{ color: Colors.text.tertiary }}>{t('auth.phoneDigits')}</Text>
              </View>

              <View className="flex-1">
                <Text className="font-medium mb-2" style={{ color: Colors.text.primary }}>
                  {t('auth.age')} <Text style={{ color: Colors.error }}>*</Text>
                </Text>
                <TextInput
                  value={age}
                  onChangeText={handleAgeChange}
                  placeholder={t('auth.enterAge')}
                  keyboardType="numeric"
                  className="w-full rounded-xl px-4 py-3 text-base"
                  style={{ 
                    backgroundColor: Colors.input.background, 
                    borderWidth: 1, 
                    borderColor: Colors.input.border,
                    color: Colors.input.text
                  }}
                  placeholderTextColor={Colors.input.placeholder}
                />
                <Text className="text-xs mt-1" style={{ color: Colors.text.tertiary }}>{t('auth.ageRange')}</Text>
              </View>
            </View>

            {/* Address */}
            <View>
              <Text className="font-medium mb-2" style={{ color: Colors.text.primary }}>{t('auth.address')}</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder={t('auth.enterAddress')}
                className="w-full rounded-xl px-4 py-3 text-base"
                style={{ 
                  backgroundColor: Colors.input.background, 
                  borderWidth: 1, 
                  borderColor: Colors.input.border,
                  color: Colors.input.text
                }}
                placeholderTextColor={Colors.input.placeholder}
              />
            </View>

            {/* Password */}
            <View>
              <Text className="font-medium mb-2" style={{ color: Colors.text.primary }}>
                {t('auth.password')} <Text style={{ color: Colors.error }}>*</Text>
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t('auth.choosePassword')}
                secureTextEntry
                className="w-full rounded-xl px-4 py-3 text-base"
                style={{ 
                  backgroundColor: Colors.input.background, 
                  borderWidth: 1, 
                  borderColor: Colors.input.border,
                  color: Colors.input.text
                }}
                placeholderTextColor={Colors.input.placeholder}
              />
              <Text className="text-xs mt-1" style={{ color: Colors.text.tertiary }}>{t('auth.passwordMinLength')}</Text>
            </View>

            {/* Register Button - Brand Orange */}
            <Pressable
              onPress={handleRegister}
              className="py-4 rounded-xl mt-6"
              style={{ backgroundColor: Colors.button.primary }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-center text-base">{t('auth.createAccount')}</Text>
              )}
            </Pressable>

            {/* moved bottom actions up into the card */}
            <View className="mt-4 space-y-3">
              <Pressable 
                onPress={() => router.replace('/(auth)/Login')} 
                className="border py-4 rounded-xl"
                style={{ borderColor: Colors.border.default }}
              >
                <Text className="font-semibold text-center" style={{ color: Colors.text.primary }}>{t('auth.alreadyHaveAccount')}</Text>
              </Pressable>

              <Pressable onPress={() => router.push('/Home')} className="py-3 items-center">
                <Text style={{ color: Colors.text.secondary }}>{t('auth.continueAsGuest')}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* removed bottom section */}
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
