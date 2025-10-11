import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChatBubble from '../../components/chat/ChatBubble';
import { auth, db } from '../../services/firebaseConfig';
import { clearUserData } from '../../utils/storage';
import { LANGUAGE_OPTIONS, getLanguageName, useAppI18n } from '../../utils/i18n';

export default function Profile() {
  const router = useRouter();
  const { t, currentLanguage, changeLanguage } = useAppI18n();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signingOut, setSigningOut] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        router.push('/(auth)/Login');
        return;
      }

      setLoading(true);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userDocRef);

        if (snap.exists()) {
          setProfile({ id: snap.id, ...snap.data() });
        } else {
          setProfile({
            uid: user.uid,
            email: user.email,
            profilePic: user.photoURL || null,
            firstName: user.displayName || '',
            lastName: '',
          });
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

const handleSignOut = async () => {
    console.log('Sign out initiated');
  Alert.alert(
    t('profile.signOut'),
    t('profile.signOut') + "?",
    [
      {
        text: t('common.cancel'),
        style: "cancel"
      },
      {
        text: t('profile.signOut'),
        style: "destructive",
        onPress: async () => {
            console.log('Sign out confirmed');
          try {
            setSigningOut(true);
            await signOut(auth);
            await clearUserData(); // Clear AsyncStorage
            console.log('User signed out and data cleared');
            router.replace('/(auth)/Login');
          } catch (error) {
            console.error('Sign out error:', error);
            Alert.alert(t('common.error'), "Failed to sign out. Please try again.");
          } finally {
            setSigningOut(false);
          }
        }
      }
    ]
  );
};

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-600 mt-4 text-base">{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-red-600 text-lg font-semibold mb-2">Error loading profile</Text>
          <Text className="text-gray-600 text-center mb-6">Could not load profile information</Text>
          <Pressable 
            onPress={() => router.replace('/(auth)/Login')}
            className="bg-blue-600 px-8 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Back to Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const fullName = `${profile.firstName || profile.first || ''} ${profile.lastName || profile.last || ''}`.trim();
  const avatarUri = profile.profilePic || profile.photoURL || null;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        
        {/* Header Section */}
        <View className="bg-blue-600 px-6 pt-4 pb-20">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/Home')} 
                className="p-2 -ml-2 mr-2"
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
            </View>
<TouchableOpacity 
    onPress={() => {
        console.log("Signout button pressed");
        handleSignOut();
    }}
    className="p-2"
    disabled={signingOut}
    activeOpacity={0.7}
>
    <Ionicons 
        name="log-out-outline" 
        size={24} 
        color={signingOut ? "#94A3B8" : "white"} 
    />
</TouchableOpacity>
          </View>
        </View>

        {/* Profile Card */}
        <View className="mx-6 -mt-16 bg-white rounded-2xl shadow-lg p-6">
          
          {/* Avatar Section */}
          <View className="items-center -mt-16 mb-6">
            <View className="relative">
              <View className="w-32 h-32 rounded-full bg-white p-1 shadow-lg">
                {avatarUri ? (
                  <Image 
                    source={{ uri: avatarUri }} 
                    className="w-full h-full rounded-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full rounded-full bg-blue-500 items-center justify-center">
                    <Text className="text-white text-4xl font-bold">
                      {fullName.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
              </View>
              <Pressable
                className="absolute bottom-0 right-0 bg-blue-600 w-10 h-10 rounded-full items-center justify-center shadow-lg"
                onPress={() => router.push("/updateProfile")}
              >
                <Ionicons name="pencil" size={16} color="white" />
              </Pressable>
            </View>
            
            <View className="items-center mt-4">
              <Text className="text-gray-900 text-xl font-bold">
                {fullName || 'User Name'}
              </Text>
              <Text className="text-gray-500 text-base">
                {profile.email}
              </Text>
            </View>
          </View>

          {/* Stats Section */}
          <View className="flex-row justify-around py-6 bg-gray-50 rounded-xl mb-6">
            <View className="items-center">
              <Text className="text-2xl font-bold text-blue-600">15</Text>
              <Text className="text-gray-600 text-sm">{t('profile.orders')}</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-600">4.8</Text>
              <Text className="text-gray-600 text-sm">{t('profile.rating')}</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-purple-600">2</Text>
              <Text className="text-gray-600 text-sm">{t('profile.years')}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            <Pressable className="border border-gray-200 py-4 rounded-xl">
              <Text className="text-gray-700 font-semibold text-base text-center">{t('profile.settings')}</Text>
            </Pressable>
          </View>
        </View>

        {/* Personal Information */}
        <View className="mx-6 mt-6 bg-white rounded-2xl shadow-lg p-6">
          <Text className="text-xl font-bold text-gray-900 mb-6">{t('profile.personalInfo')}</Text>
          
          <View className="space-y-4">
            {[
              { label: t('auth.firstName'), value: profile.firstName || profile.first || 'Not provided' },
              { label: t('auth.lastName'), value: profile.lastName || profile.last || 'Not provided' },
              { label: t('auth.emailAddress'), value: profile.email || 'Not provided' },
              { label: t('auth.phoneNumber'), value: profile.phone || 'Not provided' },
              { label: t('auth.address'), value: profile.address || 'Not provided' },
              { label: t('auth.age'), value: profile.born || profile.age || 'Not provided' },
            ].map((item, index) => (
              <View key={index} className="flex-row justify-between items-center py-3 border-b border-gray-100">
                <Text className="text-gray-600 font-medium">{item.label}</Text>
                <Text className="text-gray-900 font-semibold flex-1 text-right" numberOfLines={1}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu Options */}
        <View className="mx-6 mt-6 bg-white rounded-2xl shadow-lg p-6 mb-8">
          <Text className="text-xl font-bold text-gray-900 mb-6">{t('profile.account')}</Text>
          
          <View className="space-y-1">
            {[
              { title: 'Order History', action: null },
              { title: 'Payment Methods', action: null },
              { title: 'Notifications', action: null },
              { title: 'Privacy Settings', action: null },
              { title: 'Help Support', action: null },
            ].map((item, index) => (
              <Pressable 
                key={index} 
                className="flex-row items-center justify-between py-4 px-2 rounded-lg"
                onPress={item.action}
              >
                <Text className="text-gray-900 font-medium">{item.title}</Text>
                <Text className="text-gray-400 text-xl">›</Text>
              </Pressable>
            ))}
            
            {/* Language Selection */}
            <Pressable 
              className="flex-row items-center justify-between py-4 px-2 rounded-lg"
              onPress={() => setLanguageModalVisible(true)}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="language-outline" size={20} color="#4B5563" style={{ marginRight: 8 }} />
                <Text className="text-gray-900 font-medium">{t('profile.language')}</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-gray-500 text-sm mr-2">
                  {getLanguageName(currentLanguage, true)}
                </Text>
                <Text className="text-gray-400 text-xl">›</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Floating Chat Bubble - Fixed position in bottom right */}
      <View className="absolute bottom-6 right-6">
        <ChatBubble to="/chat" />
      </View>

      {/* Language Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={languageModalVisible}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', flex: 1 }}>
                {t('language.settings')}
              </Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Current Language */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 15 }}>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
                {t('language.currentLanguage')}: {getLanguageName(currentLanguage, true)}
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
                    backgroundColor: currentLanguage === option.code ? '#f0f8ff' : 'white',
                    borderLeftWidth: currentLanguage === option.code ? 4 : 0,
                    borderLeftColor: '#2f6feb',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: currentLanguage === option.code ? 'bold' : 'normal',
                      color: currentLanguage === option.code ? '#2f6feb' : '#333'
                    }}>
                      {option.nativeName}
                    </Text>
                    <Text style={{ 
                      fontSize: 14, 
                      color: '#666', 
                      marginTop: 2 
                    }}>
                      {option.englishName}
                    </Text>
                  </View>
                  {currentLanguage === option.code && (
                    <Ionicons name="checkmark-circle" size={20} color="#2f6feb" />
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