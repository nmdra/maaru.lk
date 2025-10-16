import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import BottomNavigation from '../../components/BottomNavigation';
import Colors from '../../constants/Colors';
import { useAppI18n } from '../../utils/i18n';

export default function PrivacySettings() {
  const router = useRouter();
  const { t } = useAppI18n();
  const [settings, setSettings] = useState({
    profileVisibility: true,
    showEmail: false,
    showPhone: false,
    allowMessages: true,
    showOnlineStatus: true,
    shareActivity: false,
    allowReviews: true,
    dataCollection: false,
  });

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const privacyOptions = [
    {
      section: 'Profile Privacy',
      items: [
        { key: 'profileVisibility', title: 'Profile Visible to Others', description: 'Allow other users to view your profile' },
        { key: 'showEmail', title: 'Show Email Address', description: 'Display your email on your public profile' },
        { key: 'showPhone', title: 'Show Phone Number', description: 'Display your phone number on your public profile' },
      ]
    },
    {
      section: 'Communication',
      items: [
        { key: 'allowMessages', title: 'Allow Direct Messages', description: 'Let other users send you messages' },
        { key: 'showOnlineStatus', title: 'Show Online Status', description: 'Display when you are online' },
      ]
    },
    {
      section: 'Activity & Data',
      items: [
        { key: 'shareActivity', title: 'Share Activity', description: 'Share your browsing and purchase activity' },
        { key: 'allowReviews', title: 'Allow Reviews', description: 'Let buyers leave reviews on your products' },
        { key: 'dataCollection', title: 'Data Collection', description: 'Allow collection of usage data for improvements' },
      ]
    }
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.background.primary }}>
      {/* Custom Header */}
      <View style={{ backgroundColor: Colors.accent }} className="px-6 py-4">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">Privacy Settings</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="px-6 py-4">
          {/* Info Card */}
          <View className="rounded-xl p-4 mb-6" style={{ backgroundColor: Colors.background.accent }}>
            <View className="flex-row items-start">
              <Ionicons name="shield-checkmark" size={24} color={Colors.accent} style={{ marginRight: 12 }} />
              <View className="flex-1">
                <Text className="font-semibold mb-1" style={{ color: Colors.text.primary }}>
                  Your Privacy Matters
                </Text>
                <Text className="text-sm" style={{ color: Colors.text.secondary }}>
                  Control who can see your information and how your data is used. Changes are saved automatically.
                </Text>
              </View>
            </View>
          </View>

          {/* Privacy Options */}
          {privacyOptions.map((section, sectionIndex) => (
            <View key={sectionIndex} className="mb-6">
              <Text className="text-lg font-bold mb-4" style={{ color: Colors.text.primary }}>
                {section.section}
              </Text>
              
              <View className="rounded-xl overflow-hidden" style={{ backgroundColor: Colors.card.background }}>
                {section.items.map((item, itemIndex) => (
                  <View 
                    key={item.key}
                    className="px-4 py-4"
                    style={{
                      borderBottomWidth: itemIndex < section.items.length - 1 ? 1 : 0,
                      borderBottomColor: Colors.border.light
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="font-semibold flex-1" style={{ color: Colors.text.primary }}>
                        {item.title}
                      </Text>
                      <Switch
                        value={settings[item.key]}
                        onValueChange={() => toggleSetting(item.key)}
                        trackColor={{ false: Colors.border.default, true: Colors.accent + '80' }}
                        thumbColor={settings[item.key] ? Colors.accent : Colors.background.secondary}
                      />
                    </View>
                    <Text className="text-sm" style={{ color: Colors.text.secondary }}>
                      {item.description}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* Additional Options */}
          <View className="rounded-xl p-4 mb-6" style={{ backgroundColor: Colors.card.background }}>
            <TouchableOpacity className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center flex-1">
                <Ionicons name="document-text-outline" size={20} color={Colors.text.secondary} style={{ marginRight: 12 }} />
                <Text className="font-medium" style={{ color: Colors.text.primary }}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>

            <View className="h-px my-2" style={{ backgroundColor: Colors.border.light }} />

            <TouchableOpacity className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center flex-1">
                <Ionicons name="trash-outline" size={20} color={Colors.error} style={{ marginRight: 12 }} />
                <Text className="font-medium" style={{ color: Colors.error }}>Delete My Account</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom spacing for navigation */}
        <View className="h-20" />
      </ScrollView>

      <BottomNavigation currentRoute="/(auth)/Profile" />
    </SafeAreaView>
  );
}
