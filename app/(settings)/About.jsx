import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    Linking,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from '../../components/BottomNavigation';
import Colors from '../../constants/Colors';
import { useAppI18n } from '../../utils/i18n';

export default function About() {
  const router = useRouter();
  const { t } = useAppI18n();

  const appInfo = {
    name: 'Maaru.lk',
    version: '1.0.0',
    buildNumber: '100',
    tagline: 'Your Trusted Marketplace for Buying & Selling',
    description: 'Maaru.lk is Sri Lanka\'s premier online marketplace where you can buy and sell products with confidence. Our platform connects buyers and sellers across the country, making it easy to find great deals or sell your items quickly.',
  };

  const features = [
    {
      icon: 'shield-checkmark',
      title: 'Secure Transactions',
      description: 'Protected payments and verified users for safe trading',
      color: Colors.success,
    },
    {
      icon: 'globe',
      title: 'Island-wide Reach',
      description: 'Connect with buyers and sellers across Sri Lanka',
      color: Colors.info,
    },
    {
      icon: 'chatbubbles',
      title: 'Direct Messaging',
      description: 'Chat with sellers and buyers in real-time',
      color: Colors.accent,
    },
    {
      icon: 'star',
      title: 'Ratings & Reviews',
      description: 'Build trust with transparent feedback system',
      color: '#F59E0B',
    },
  ];

  const teamMembers = [
    { name: 'Development Team', role: 'Engineering & Design' },
    { name: 'Support Team', role: 'Customer Success' },
    { name: 'Security Team', role: 'Platform Security' },
  ];

  const socialLinks = [
    {
      icon: 'logo-facebook',
      name: 'Facebook',
      url: 'https://facebook.com/maaru.lk',
      color: '#1877F2',
    },
    {
      icon: 'logo-instagram',
      name: 'Instagram',
      url: 'https://instagram.com/maaru.lk',
      color: '#E4405F',
    },
    {
      icon: 'logo-twitter',
      name: 'Twitter',
      url: 'https://twitter.com/maarulk',
      color: '#1DA1F2',
    },
    {
      icon: 'logo-linkedin',
      name: 'LinkedIn',
      url: 'https://linkedin.com/company/maaru-lk',
      color: '#0A66C2',
    },
  ];

  const legalLinks = [
    { title: 'Terms of Service', url: 'https://maaru.lk/terms' },
    { title: 'Privacy Policy', url: 'https://maaru.lk/privacy' },
    { title: 'Community Guidelines', url: 'https://maaru.lk/guidelines' },
    { title: 'Cookie Policy', url: 'https://maaru.lk/cookies' },
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
            <Text className="text-white text-xl font-bold">About Maaru.lk</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="px-6 py-4">
          {/* App Logo & Name */}
          <View className="items-center py-8">
            <View
              className="w-24 h-24 rounded-3xl items-center justify-center mb-4"
              style={{ backgroundColor: Colors.accent }}
            >
              <Ionicons name="swap-horizontal" size={48} color="white" />
            </View>
            <Text className="text-3xl font-bold mb-2" style={{ color: Colors.text.primary }}>
              {appInfo.name}
            </Text>
            <Text className="text-base text-center mb-2" style={{ color: Colors.text.secondary }}>
              {appInfo.tagline}
            </Text>
            <View className="flex-row items-center">
              <Text className="text-sm" style={{ color: Colors.text.tertiary }}>
                Version {appInfo.version} ({appInfo.buildNumber})
              </Text>
            </View>
          </View>

          {/* About Description */}
          <View className="rounded-xl p-6 mb-6" style={{ backgroundColor: Colors.card.background }}>
            <Text className="text-lg font-bold mb-4" style={{ color: Colors.text.primary }}>
              About Us
            </Text>
            <Text className="text-base leading-6" style={{ color: Colors.text.secondary }}>
              {appInfo.description}
            </Text>
          </View>

          {/* Key Features */}
          <View className="rounded-xl p-6 mb-6" style={{ backgroundColor: Colors.card.background }}>
            <Text className="text-lg font-bold mb-4" style={{ color: Colors.text.primary }}>
              Why Choose Maaru.lk?
            </Text>
            {features.map((feature, index) => (
              <View
                key={index}
                className="flex-row items-start mb-4"
                style={{ paddingBottom: index < features.length - 1 ? 16 : 0 }}
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mr-4"
                  style={{ backgroundColor: feature.color + '20' }}
                >
                  <Ionicons name={feature.icon} size={24} color={feature.color} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold mb-1" style={{ color: Colors.text.primary }}>
                    {feature.title}
                  </Text>
                  <Text className="text-sm" style={{ color: Colors.text.secondary }}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Our Team */}
          <View className="rounded-xl p-6 mb-6" style={{ backgroundColor: Colors.card.background }}>
            <Text className="text-lg font-bold mb-4" style={{ color: Colors.text.primary }}>
              Our Team
            </Text>
            {teamMembers.map((member, index) => (
              <View
                key={index}
                className="py-3"
                style={{
                  borderBottomWidth: index < teamMembers.length - 1 ? 1 : 0,
                  borderBottomColor: Colors.border.light,
                }}
              >
                <Text className="font-semibold mb-1" style={{ color: Colors.text.primary }}>
                  {member.name}
                </Text>
                <Text className="text-sm" style={{ color: Colors.text.secondary }}>
                  {member.role}
                </Text>
              </View>
            ))}
          </View>

          {/* Social Media */}
          <View className="rounded-xl p-6 mb-6" style={{ backgroundColor: Colors.card.background }}>
            <Text className="text-lg font-bold mb-4" style={{ color: Colors.text.primary }}>
              Connect With Us
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {socialLinks.map((link, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => Linking.openURL(link.url)}
                  className="items-center mb-4"
                  style={{ width: '48%' }}
                >
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: link.color + '20' }}
                  >
                    <Ionicons name={link.icon} size={32} color={link.color} />
                  </View>
                  <Text className="text-sm font-medium" style={{ color: Colors.text.primary }}>
                    {link.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Legal Links */}
          <View className="rounded-xl p-6 mb-6" style={{ backgroundColor: Colors.card.background }}>
            <Text className="text-lg font-bold mb-4" style={{ color: Colors.text.primary }}>
              Legal & Policies
            </Text>
            {legalLinks.map((link, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => Linking.openURL(link.url)}
                className="flex-row items-center justify-between py-3"
                style={{
                  borderBottomWidth: index < legalLinks.length - 1 ? 1 : 0,
                  borderBottomColor: Colors.border.light,
                }}
              >
                <Text className="font-medium" style={{ color: Colors.text.primary }}>
                  {link.title}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Contact Information */}
          <View className="rounded-xl p-6 mb-6" style={{ backgroundColor: Colors.card.background }}>
            <Text className="text-lg font-bold mb-4" style={{ color: Colors.text.primary }}>
              Contact Us
            </Text>
            
            <TouchableOpacity
              onPress={() => Linking.openURL('mailto:info@maaru.lk')}
              className="flex-row items-center py-3"
            >
              <Ionicons name="mail-outline" size={20} color={Colors.accent} style={{ marginRight: 12 }} />
              <Text className="font-medium" style={{ color: Colors.text.primary }}>
                info@maaru.lk
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Linking.openURL('tel:+94112345678')}
              className="flex-row items-center py-3"
            >
              <Ionicons name="call-outline" size={20} color={Colors.accent} style={{ marginRight: 12 }} />
              <Text className="font-medium" style={{ color: Colors.text.primary }}>
                +94 76 041 5855
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-start py-3">
              <Ionicons name="location-outline" size={20} color={Colors.accent} style={{ marginRight: 12, marginTop: 2 }} />
              <View className="flex-1">
                <Text className="font-medium" style={{ color: Colors.text.primary }}>
                  Colombo, Sri Lanka
                </Text>
              </View>
            </View>
          </View>

          {/* Copyright */}
          <View className="items-center py-6">
            <Text className="text-sm mb-2" style={{ color: Colors.text.tertiary }}>
              © 2025 Maaru.lk. All rights reserved.
            </Text>
            <Text className="text-xs text-center" style={{ color: Colors.text.tertiary }}>
              Made with ❤️ in Sri Lanka
            </Text>
          </View>
        </View>

        {/* Bottom spacing for navigation */}
        <View className="h-20" />
      </ScrollView>

      <BottomNavigation currentRoute="/(auth)/Profile" />
    </SafeAreaView>
  );
}
