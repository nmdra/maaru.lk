import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Linking,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from '../../components/BottomNavigation';
import Colors from '../../constants/Colors';
import { useAppI18n } from '../../utils/i18n';

export default function HelpSupport() {
  const router = useRouter();
  const { t } = useAppI18n();
  const [expandedFaq, setExpandedFaq] = useState(null);

  const contactOptions = [
    {
      icon: 'mail-outline',
      title: 'Email Support',
      description: 'support@maaru.lk',
      action: () => Linking.openURL('mailto:support@maaru.lk'),
      color: Colors.info,
    },
    {
      icon: 'call-outline',
      title: 'Phone Support',
      description: '+94 76 041 5855',
      action: () => Linking.openURL('tel:+94112345678'),
      color: Colors.success,
    },
    {
      icon: 'chatbubble-ellipses-outline',
      title: 'Live Chat',
      description: 'Chat with our support team',
      action: () => router.push('/chat'),
      color: Colors.accent,
    },
    {
      icon: 'logo-whatsapp',
      title: 'WhatsApp',
      description: '+94 77 123 4567',
      action: () => Linking.openURL('https://wa.me/94771234567'),
      color: '#25D366',
    },
  ];

  const faqItems = [
    {
      question: 'How do I create a listing?',
      answer: 'To create a listing, go to the Home tab and tap the "+" button. Fill in the product details, add photos, set a price, and publish. Your listing will be visible to buyers immediately.',
    },
    {
      question: 'How does the payment process work?',
      answer: 'When a buyer purchases your item, payment is processed securely through our platform. Once the transaction is complete, the funds will be held until the buyer confirms receipt of the item.',
    },
    {
      question: 'What if I have an issue with an order?',
      answer: 'If you encounter any issues, you can contact the seller/buyer through our chat system. If the issue persists, please contact our support team, and we will help resolve the matter.',
    },
    {
      question: 'How do I track my order?',
      answer: 'Go to "My Orders" in your profile to view all your purchases and sales. You can track the status of each order and communicate with the other party.',
    },
    {
      question: 'Can I edit or delete my listing?',
      answer: 'Yes, go to "My Products" in your profile, select the item you want to edit, and make the necessary changes. You can also mark items as sold or delete them.',
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept credit/debit cards, PayPal, bank transfers, and cash on delivery (where available). Choose your preferred payment method during checkout.',
    },
  ];

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

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
            <Text className="text-white text-xl font-bold">Help & Support</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="px-6 py-4">
          {/* Welcome Card */}
          <View className="rounded-xl p-4 mb-6" style={{ backgroundColor: Colors.background.accent }}>
            <View className="flex-row items-start">
              <Ionicons name="help-circle" size={24} color={Colors.accent} style={{ marginRight: 12 }} />
              <View className="flex-1">
                <Text className="font-semibold mb-1" style={{ color: Colors.text.primary }}>
                  How can we help you?
                </Text>
                <Text className="text-sm" style={{ color: Colors.text.secondary }}>
                  Browse FAQs or contact our support team. We're here to assist you 24/7.
                </Text>
              </View>
            </View>
          </View>

          {/* Contact Options */}
          <Text className="text-lg font-bold mb-4" style={{ color: Colors.text.primary }}>
            Contact Us
          </Text>
          
          <View className="rounded-xl overflow-hidden mb-6" style={{ backgroundColor: Colors.card.background }}>
            {contactOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                onPress={option.action}
                className="px-4 py-4 flex-row items-center"
                style={{
                  borderBottomWidth: index < contactOptions.length - 1 ? 1 : 0,
                  borderBottomColor: Colors.border.light
                }}
              >
                <View 
                  className="w-12 h-12 rounded-full items-center justify-center mr-4"
                  style={{ backgroundColor: option.color + '20' }}
                >
                  <Ionicons name={option.icon} size={24} color={option.color} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold mb-1" style={{ color: Colors.text.primary }}>
                    {option.title}
                  </Text>
                  <Text className="text-sm" style={{ color: Colors.text.secondary }}>
                    {option.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* FAQ Section */}
          <Text className="text-lg font-bold mb-4" style={{ color: Colors.text.primary }}>
            Frequently Asked Questions
          </Text>

          <View className="rounded-xl overflow-hidden mb-6" style={{ backgroundColor: Colors.card.background }}>
            {faqItems.map((item, index) => (
              <View
                key={index}
                style={{
                  borderBottomWidth: index < faqItems.length - 1 ? 1 : 0,
                  borderBottomColor: Colors.border.light
                }}
              >
                <TouchableOpacity
                  onPress={() => toggleFaq(index)}
                  className="px-4 py-4 flex-row items-center justify-between"
                >
                  <Text className="font-semibold flex-1 pr-4" style={{ color: Colors.text.primary }}>
                    {item.question}
                  </Text>
                  <Ionicons 
                    name={expandedFaq === index ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={Colors.text.tertiary} 
                  />
                </TouchableOpacity>
                
                {expandedFaq === index && (
                  <View className="px-4 pb-4">
                    <Text className="text-sm leading-6" style={{ color: Colors.text.secondary }}>
                      {item.answer}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Additional Resources */}
          <Text className="text-lg font-bold mb-4" style={{ color: Colors.text.primary }}>
            Additional Resources
          </Text>

          <View className="rounded-xl overflow-hidden mb-6" style={{ backgroundColor: Colors.card.background }}>
            <TouchableOpacity className="px-4 py-4 flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <Ionicons name="document-text-outline" size={20} color={Colors.text.secondary} style={{ marginRight: 12 }} />
                <Text className="font-medium" style={{ color: Colors.text.primary }}>User Guide</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>

            <View className="h-px" style={{ backgroundColor: Colors.border.light }} />

            <TouchableOpacity className="px-4 py-4 flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.text.secondary} style={{ marginRight: 12 }} />
                <Text className="font-medium" style={{ color: Colors.text.primary }}>Safety Tips</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>

            <View className="h-px" style={{ backgroundColor: Colors.border.light }} />

            <TouchableOpacity className="px-4 py-4 flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <Ionicons name="information-circle-outline" size={20} color={Colors.text.secondary} style={{ marginRight: 12 }} />
                <Text className="font-medium" style={{ color: Colors.text.primary }}>Terms & Conditions</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          {/* App Version */}
          <View className="items-center py-4">
            <Text className="text-sm" style={{ color: Colors.text.tertiary }}>
              Maaru.lk v1.0.0
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
