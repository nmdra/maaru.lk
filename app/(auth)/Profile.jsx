import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import BottomNavigation from '../../components/BottomNavigation';
import ChatBubble from '../../components/chat/ChatBubble';
import Header from '../../components/Header';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebaseConfig';
import { LANGUAGE_OPTIONS, getLanguageName, useAppI18n } from '../../utils/i18n';

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, currentLanguage, changeLanguage } = useAppI18n();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signingOut, setSigningOut] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      router.replace('/(auth)/Login');
      return;
    }

    const fetchProfile = async () => {
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
    };

    fetchProfile();
  }, [user]);

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
          setSigningOut(true);
          try {
            await logout(); // Use logout from AuthContext - this handles both Firebase signOut and clearUserData
            console.log('User signed out and data cleared');
            // Navigation will be handled by the useEffect when user becomes null
          } catch (error) {
            console.error('Sign out error:', error);
            Alert.alert(t('common.error'), "Failed to sign out. Please try again.");
            setSigningOut(false);
          }
        }
      }
    ]
  );
};

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.background.primary }}>
        <Header />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text className="mt-4 text-base" style={{ color: Colors.text.secondary }}>{t('common.loading')}</Text>
        </View>
        <BottomNavigation currentRoute="/(auth)/Profile" />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.background.primary }}>
        <Header />
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-lg font-semibold mb-2" style={{ color: Colors.error }}>Error loading profile</Text>
          <Text className="text-center mb-6" style={{ color: Colors.text.secondary }}>Could not load profile information</Text>
          <Pressable 
            onPress={() => router.replace('/(auth)/Login')}
            className="px-8 py-3 rounded-lg"
            style={{ backgroundColor: Colors.button.primary }}
          >
            <Text className="text-white font-semibold">Back to Login</Text>
          </Pressable>
        </View>
        <BottomNavigation currentRoute="/(auth)/Profile" />
      </SafeAreaView>
    );
  }

  const fullName = `${profile.firstName || profile.first || ''} ${profile.lastName || profile.last || ''}`.trim();
  const avatarUri = profile.profilePic || profile.photoURL || null;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.background.primary }}>
      <Header />
      
      <ScrollView className="flex-1">
        
        {/* Header Section - Removed back button since Header already has navigation */}
        <View className="px-6 pt-4 pb-20" style={{ backgroundColor: Colors.accent }}>
          <View className="flex-row justify-end items-center">
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
        <View className="mx-6 -mt-16 rounded-2xl shadow-lg p-6" style={{ backgroundColor: Colors.card.background }}>
          
          {/* Avatar Section */}
          <View className="items-center -mt-16 mb-6">
            <View className="relative">
              <View className="w-32 h-32 rounded-full p-1 shadow-lg" style={{ backgroundColor: Colors.white }}>
                {avatarUri ? (
                  <Image 
                    source={{ uri: avatarUri }} 
                    className="w-full h-full rounded-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full rounded-full items-center justify-center" style={{ backgroundColor: Colors.accent }}>
                    <Text className="text-white text-4xl font-bold">
                      {fullName.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
              </View>
              <Pressable
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full items-center justify-center shadow-lg"
                style={{ backgroundColor: Colors.accent }}
                onPress={() => router.push("/updateProfile")}
              >
                <Ionicons name="pencil" size={16} color="white" />
              </Pressable>
            </View>
            
            <View className="items-center mt-4">
              <Text className="text-xl font-bold" style={{ color: Colors.text.primary }}>
                {fullName || 'User Name'}
              </Text>
              <Text className="text-base" style={{ color: Colors.text.secondary }}>
                {profile.email}
              </Text>
            </View>
          </View>

          {/* Stats Section */}
          <View className="flex-row justify-around py-6 rounded-xl mb-6" style={{ backgroundColor: Colors.background.tertiary }}>
            <View className="items-center">
              <Text className="text-2xl font-bold" style={{ color: Colors.info }}>15</Text>
              <Text className="text-sm" style={{ color: Colors.text.secondary }}>{t('profile.orders')}</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold" style={{ color: Colors.success }}>4.8</Text>
              <Text className="text-sm" style={{ color: Colors.text.secondary }}>{t('profile.rating')}</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold" style={{ color: Colors.accent }}>2</Text>
              <Text className="text-sm" style={{ color: Colors.text.secondary }}>{t('profile.years')}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            <Pressable className="border py-4 rounded-xl" style={{ borderColor: Colors.border.default }}>
              <Text className="font-semibold text-base text-center" style={{ color: Colors.text.primary }}>{t('profile.settings')}</Text>
            </Pressable>
          </View>
        </View>

        {/* Personal Information */}
        <View className="mx-6 mt-6 rounded-2xl shadow-lg p-6" style={{ backgroundColor: Colors.card.background }}>
          <Text className="text-xl font-bold mb-6" style={{ color: Colors.text.primary }}>{t('profile.personalInfo')}</Text>
          
          <View className="space-y-4">
            {[
              { label: t('auth.firstName'), value: profile.firstName || profile.first || 'Not provided' },
              { label: t('auth.lastName'), value: profile.lastName || profile.last || 'Not provided' },
              { label: t('auth.emailAddress'), value: profile.email || 'Not provided' },
              { label: t('auth.phoneNumber'), value: profile.phone || 'Not provided' },
              { label: t('auth.address'), value: profile.address || 'Not provided' },
              { label: t('auth.age'), value: profile.born || profile.age || 'Not provided' },
            ].map((item, index) => (
              <View key={index} className="flex-row justify-between items-center py-3 border-b" style={{ borderBottomColor: Colors.border.light }}>
                <Text className="font-medium" style={{ color: Colors.text.secondary }}>{item.label}</Text>
                <Text className="font-semibold flex-1 text-right" numberOfLines={1} style={{ color: Colors.text.primary }}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu Options */}
        <View className="mx-6 mt-6 rounded-2xl shadow-lg p-6 mb-8" style={{ backgroundColor: Colors.card.background }}>
          <Text className="text-xl font-bold mb-6" style={{ color: Colors.text.primary }}>{t('profile.account')}</Text>
          
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
                <Text className="font-medium" style={{ color: Colors.text.primary }}>{item.title}</Text>
                <Text className="text-xl" style={{ color: Colors.text.tertiary }}>›</Text>
              </Pressable>
            ))}
            
            {/* Language Selection */}
            <Pressable 
              className="flex-row items-center justify-between py-4 px-2 rounded-lg"
              onPress={() => setLanguageModalVisible(true)}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="language-outline" size={20} color={Colors.text.secondary} style={{ marginRight: 8 }} />
                <Text className="font-medium" style={{ color: Colors.text.primary }}>{t('profile.language')}</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-sm mr-2" style={{ color: Colors.text.secondary }}>
                  {getLanguageName(currentLanguage, true)}
                </Text>
                <Text className="text-xl" style={{ color: Colors.text.tertiary }}>›</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Floating Chat Bubble - Fixed position in bottom right, above footer */}
      <View className="absolute bottom-24 right-6">
        <ChatBubble to="/chat" />
      </View>

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
                {t('language.settings')}
              </Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Current Language */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 15 }}>
              <Text style={{ fontSize: 14, color: Colors.text.secondary, marginBottom: 5 }}>
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
      
      <BottomNavigation currentRoute="/(auth)/Profile" />
    </SafeAreaView>
  );
}