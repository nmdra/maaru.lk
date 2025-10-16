// app/chat/[roomId].jsx
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import { Actions, GiftedChat, InputToolbar } from 'react-native-gifted-chat';
import BottomNavigation from '../../components/BottomNavigation';
import Header from '../../components/Header';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { generateProductDetails } from '../../services/aiService';
import { listenMessages, markThreadRead, sendMessage } from '../../services/chatService';
import { uploadChatImageToCloudinary } from '../../services/cloudinaryService';
import {
  getSocket,
  wsSendMessage,
  wsTypingStart,
  wsTypingStop,
} from '../../services/socket';
import { clearSwapDraft, getSwapDraft } from '../../utils/storage';

/* ---------- helpers ---------- */
function tsToMillis(ts) {
  try {
    if (!ts) return 0;
    if (typeof ts.toDate === 'function') return ts.toDate().getTime();
    if (ts instanceof Date) return ts.getTime();
    if (typeof ts.seconds === 'number') {
      return ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6);
    }
    return 0;
  } catch {
    return 0;
  }
}

export default function ChatRoom() {
  const router = useRouter();
  const { roomId } = useLocalSearchParams();
  const { user } = useAuth();
  const uid = user?.uid || null;

  const [messages, setMessages] = useState([]);
  const [sendingImage, setSendingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [swapDraft, setSwapDraft] = useState(null);
  const [sendingSwap, setSendingSwap] = useState(false);
  const [generatingReply, setGeneratingReply] = useState(false);
  const [aiSuggestedReply, setAiSuggestedReply] = useState(null);

  const typingTimer = useRef(null);
  const inputRef = useRef(null);
  
  // Move all hooks before any conditional returns
  const conversationId = useMemo(() => (roomId ? String(roomId) : null), [roomId]);
  // Ensure uid is a string for comparison with message senderIds
  const giftedChatUser = useMemo(() => ({ _id: String(uid || 'anonymous') }), [uid]);

  /* ---------- Check for swap draft ---------- */
  useEffect(() => {
    const checkSwapDraft = async () => {
      try {
        const draft = await getSwapDraft();
        if (draft && draft.roomId === conversationId) {
          setSwapDraft(draft);
        }
      } catch (error) {
        console.error('Error checking swap draft:', error);
      }
    };

    if (conversationId) {
      checkSwapDraft();
    }
  }, [conversationId]);

  /* ---------- Firestore listener ---------- */
  useEffect(() => {
    if (!conversationId) {
      setError('No conversation ID provided');
      setLoading(false);
      return;
    }

    if (!uid) {
      setError('Please login to view this conversation');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsub = listenMessages(
      conversationId,
      (docs) => {
        // Convert Firestore messages to GiftedChat format
        const formattedMessages = docs
          .map((m) => {
            const createdMillis = tsToMillis(m.createdAt);
            const created = createdMillis ? new Date(createdMillis) : new Date();
            
            // Ensure senderId is a string for comparison
            const senderId = String(m.senderId || '');
            
            return {
              _id: m.id,
              text: m.type === 'image' ? '' : m.text || '',
              createdAt: created,
              user: { _id: senderId },
              image: m.type === 'image' ? m.mediaUrl : undefined,
              deliveredTo: m.deliveredTo || [],
              readBy: m.readBy || [],
            };
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // Debug: log first message to check user IDs
        if (formattedMessages.length > 0) {
          console.log('🔍 First message user._id:', formattedMessages[0].user._id);
          console.log('🔍 Current user uid:', uid);
          console.log('🔍 Match:', formattedMessages[0].user._id === uid);
        }

        setMessages(formattedMessages);
        setLoading(false);
      },
      (err) => {
        console.error('listenMessages error:', err);
        setError('Failed to load messages');
        setLoading(false);
      },
      { pageSize: 50 }
    );

    // Mark thread as read when entering
    markThreadRead({ conversationId, uid }).catch(console.error);

    return () => unsub && unsub();
  }, [conversationId, uid]);

  /* ---------- Send text via WebSocket (with Firestore fallback) ---------- */
  const onSend = useCallback(
    async (newMessages = []) => {
      if (!conversationId || !uid || newMessages.length === 0) return;
      const m = newMessages[0];
      const text = (m.text || '').trim();
      if (!text) return;

      const socket = getSocket();
      
      // Try WebSocket first
      if (socket && socket.connected) {
        wsSendMessage(
          { conversationId, type: 'text', text },
          (res) => {
            if (!res?.ok) {
              console.log('WebSocket send error:', res?.error);
              // Fallback to Firestore
              sendMessage({ 
                conversationId, 
                senderId: uid, 
                kind: 'text', 
                text 
              }).catch((err) => {
                console.error('Firestore fallback error:', err);
                alert('Failed to send message. Please try again.');
              });
            }
          }
        );
      } else {
        // No WebSocket connection - use Firestore directly
        console.log('⚠️ WebSocket not connected, using Firestore directly');
        try {
          await sendMessage({ 
            conversationId, 
            senderId: uid, 
            kind: 'text', 
            text 
          });
        } catch (err) {
          console.error('Firestore send error:', err);
          alert('Failed to send message. Please try again.');
        }
      }
    },
    [conversationId, uid]
  );

  /* ---------- Typing indicator (debounced) ---------- */
  const handleInputTextChanged = useCallback(
    (text) => {
      if (!conversationId || !text?.trim()) return;
      wsTypingStart(conversationId);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => wsTypingStop(conversationId), 1200);
    },
    [conversationId]
  );

  /* ---------- Pick & send image ---------- */
  const pickAndSendImage = useCallback(async () => {
    try {
      if (!uid || !conversationId) return;

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('We need access to your photos to send images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) return;
      
      const asset = result.assets[0];
      if (!asset?.uri) return;

      setSendingImage(true);

      // Upload to Cloudinary
      const downloadUrl = await uploadChatImageToCloudinary({
        uri: asset.uri,
        conversationId,
        uid,
      });

      const socket = getSocket();
      
      // Send via WebSocket (with Firestore fallback)
      if (socket && socket.connected) {
        wsSendMessage(
          { conversationId, type: 'image', mediaUrl: downloadUrl, text: '' },
          (res) => {
            if (!res?.ok) {
              console.log('WebSocket image send error:', res?.error);
              // Fallback to Firestore
              sendMessage({ 
                conversationId, 
                senderId: uid, 
                kind: 'image', 
                mediaUrl: downloadUrl 
              }).catch((err) => {
                console.error('Firestore image fallback error:', err);
                alert('Failed to send image. Please try again.');
              });
            }
          }
        );
      } else {
        // No WebSocket - use Firestore directly
        console.log('⚠️ WebSocket not connected, using Firestore for image');
        await sendMessage({ 
          conversationId, 
          senderId: uid, 
          kind: 'image', 
          mediaUrl: downloadUrl 
        });
      }
    } catch (e) {
      console.error('Image send failed:', e);
      
      const errorMessage = e.message?.includes('Upload preset')
        ? 'Cloudinary setup incomplete.\n\nPlease create the "chat_images" upload preset in Cloudinary Dashboard.\n\nSee console for instructions.'
        : 'Could not send image. Please try again.';
      
      alert(errorMessage);
    } finally {
      setSendingImage(false);
    }
  }, [conversationId, uid]);

  /* ---------- Send Swap Draft ---------- */
  const handleSendSwapDraft = useCallback(async () => {
    if (!swapDraft || !conversationId || !uid) return;

    setSendingSwap(true);
    try {
      const socket = getSocket();
      
      // Try WebSocket first
      if (socket && socket.connected) {
        wsSendMessage(
          { conversationId, type: 'text', text: swapDraft.message },
          (res) => {
            if (!res?.ok) {
              console.log('WebSocket send error:', res?.error);
              // Fallback to Firestore
              sendMessage({ 
                conversationId, 
                senderId: uid, 
                kind: 'text', 
                text: swapDraft.message 
              }).catch((err) => {
                console.error('Firestore fallback error:', err);
                Alert.alert('Error', 'Failed to send swap request. Please try again.');
              });
            }
          }
        );
      } else {
        // No WebSocket connection - use Firestore directly
        await sendMessage({ 
          conversationId, 
          senderId: uid, 
          kind: 'text', 
          text: swapDraft.message 
        });
      }

      // Clear the draft
      await clearSwapDraft();
      setSwapDraft(null);
      
      Alert.alert('Success', 'Swap request sent successfully!');
    } catch (error) {
      console.error('Error sending swap draft:', error);
      Alert.alert('Error', 'Failed to send swap request. Please try again.');
    } finally {
      setSendingSwap(false);
    }
  }, [swapDraft, conversationId, uid]);

  /* ---------- Cancel Swap Draft ---------- */
  const handleCancelSwapDraft = useCallback(async () => {
    Alert.alert(
      'Cancel Swap Request',
      'Are you sure you want to cancel this swap request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            await clearSwapDraft();
            setSwapDraft(null);
          }
        }
      ]
    );
  }, []);

  /* ---------- Generate AI Reply ---------- */
  const handleGenerateAiReply = useCallback(async () => {
    if (!conversationId || !uid || messages.length === 0) {
      Alert.alert('Info', 'Need some conversation history to generate a reply');
      return;
    }

    setGeneratingReply(true);
    setAiSuggestedReply(null);

    try {
      // Prepare message history for AI
      const messageHistory = messages
        .slice(0, 10) // Get last 10 messages (already sorted newest first)
        .map(msg => ({
          senderId: msg.user._id,
          text: msg.text || '',
          hasImage: !!msg.image,
          timestamp: msg.createdAt.toISOString(),
        }));

      const requestData = JSON.stringify({
        task: 'generate_chat_reply',
        currentUserId: String(uid),
        messages: messageHistory,
      });

      console.log('🤖 Generating AI reply...');
      const result = await generateProductDetails(null, requestData);

      if (result) {
        const parsed = JSON.parse(result);
        console.log('✅ AI reply generated:', parsed);
        setAiSuggestedReply(parsed.reply);
        
        // Show success feedback
        Alert.alert(
          '✨ AI Reply Ready',
          'Review the suggested reply below. You can edit it before sending.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('No reply generated');
      }
    } catch (error) {
      console.error('❌ Error generating AI reply:', error);
      Alert.alert(
        'Generation Failed',
        'Could not generate a reply. Please try again or type your own message.',
        [{ text: 'OK' }]
      );
    } finally {
      setGeneratingReply(false);
    }
  }, [conversationId, uid, messages]);

  /* ---------- Use AI Suggested Reply ---------- */
  const handleUseAiReply = useCallback(() => {
    if (!aiSuggestedReply) return;
    
    // Send the AI reply
    onSend([{ text: aiSuggestedReply, user: giftedChatUser }]);
    setAiSuggestedReply(null);
  }, [aiSuggestedReply, onSend, giftedChatUser]);

  /* ---------- Dismiss AI Suggestion ---------- */
  const handleDismissAiReply = useCallback(() => {
    setAiSuggestedReply(null);
  }, []);

  /* ---------- Socket listeners ---------- */
  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      setWsConnected(false);
      return;
    }

    const onConnect = () => {
      console.log('✅ WebSocket connected');
      setWsConnected(true);
    };

    const onDisconnect = () => {
      console.log('❌ WebSocket disconnected');
      setWsConnected(false);
    };

    const onNewMessage = (message) => {
      console.log('New message via socket:', message);
      // Firestore listener will pick this up automatically
    };

    const onTyping = ({ conversationId: convId, uid: typingUid, on }) => {
      if (convId === conversationId && typingUid !== uid) {
        console.log(`User ${typingUid} is ${on ? 'typing' : 'stopped typing'}`);
        // You can show typing indicator here
      }
    };

    const onSeen = ({ conversationId: convId, by, messageIds }) => {
      if (convId === conversationId && by !== uid) {
        console.log(`User ${by} read ${messageIds.length} messages`);
        // Firestore listener will update read receipts automatically
      }
    };

    // Set initial connection state
    setWsConnected(socket.connected);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message:new', onNewMessage);
    socket.on('typing', onTyping);
    socket.on('message:seen', onSeen);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message:new', onNewMessage);
      socket.off('typing', onTyping);
      socket.off('message:seen', onSeen);
    };
  }, [conversationId, uid]);

  /* ---------- Render read receipts ---------- */
  function renderTicks(currentMessage) {
    if (!uid || currentMessage?.user?._id !== uid) return null;

    const delivered = Array.isArray(currentMessage.deliveredTo) && currentMessage.deliveredTo.length > 0;
    const read = Array.isArray(currentMessage.readBy) && currentMessage.readBy.length > 0;

    const baseStyle = { marginLeft: 4, fontSize: 13, fontWeight: '600' };
    if (read) return <Text style={[baseStyle, { color: '#3B82F6' }]}>✓✓</Text>;
    if (delivered) return <Text style={[baseStyle, { color: '#1E3A8A' }]}>✓✓</Text>;
    return <Text style={[baseStyle, { color: '#9CA3AF' }]}>✓</Text>;
  }

  /* ---------- Render attachment button ---------- */
  function renderActions(props) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* AI Reply Button */}
        <TouchableOpacity
          onPress={handleGenerateAiReply}
          disabled={generatingReply || messages.length === 0}
          style={{
            marginLeft: 8,
            marginBottom: 4,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: generatingReply ? Colors.gray[300] : Colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: messages.length === 0 ? 0.5 : 1,
          }}
        >
          {generatingReply ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={{ fontSize: 18 }}>✨</Text>
          )}
        </TouchableOpacity>
        
        {/* Attachment Button */}
        <Actions
          {...props}
          containerStyle={{ marginLeft: 4, marginBottom: 4 }}
          icon={() => (
            <Text style={{ fontSize: 22, paddingHorizontal: 6 }}>
              {sendingImage ? '⏳' : '📎'}
            </Text>
          )}
          onPressActionButton={pickAndSendImage}
          disabled={sendingImage}
        />
      </View>
    );
  }

  /* ---------- Custom input toolbar ---------- */
  function renderInputToolbar(props) {
    return (
      <InputToolbar
        {...props}
        containerStyle={{
          backgroundColor: '#fff',
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
          paddingTop: 6,
        }}
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 10, color: '#6b7280' }}>Loading conversation...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 20 }}>
        <Text style={{ fontSize: 40, marginBottom: 10 }}>💬</Text>
        <Text style={{ fontSize: 16, color: '#ef4444', textAlign: 'center', marginBottom: 20 }}>
          {error}
        </Text>
        <Text
          style={{ color: '#3B82F6', fontSize: 16 }}
          onPress={() => router.back()}
        >
          Go Back
        </Text>
      </View>
    );
  }

  // No conversation ID
  if (!conversationId) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <Header />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>No conversation ID provided</Text>
        </View>
        <BottomNavigation currentRoute={`/chat/${roomId}`} />
      </View>
    );
  }

  // Main chat UI
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header />
      
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Connection Status Banner */}
      {!wsConnected && (
        <View style={{ 
          backgroundColor: '#FEF3C7', 
          paddingVertical: 6, 
          paddingHorizontal: 12,
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: '#FDE68A'
        }}>
          {/* <Text style={{ fontSize: 12, color: '#92400E' }}>
            ⚠️ WebSocket disconnected - using Firestore mode
          </Text> */}
        </View>
      )}
      
      {/* Swap Draft Banner */}
      {swapDraft && (
        <View style={{ 
          backgroundColor: '#EFF6FF', 
          padding: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#BFDBFE'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 20, marginRight: 8 }}>🔄</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E3A8A', marginBottom: 4 }}>
                Swap Request Ready
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                {swapDraft.selectedProduct?.imageUrl && (
                  <Image 
                    source={{ uri: swapDraft.selectedProduct.imageUrl }}
                    style={{ width: 40, height: 40, borderRadius: 6, marginRight: 8 }}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#374151' }} numberOfLines={1}>
                    Your: {swapDraft.selectedProduct?.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#374151' }} numberOfLines={1}>
                    For: {swapDraft.targetProduct?.name}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={handleSendSwapDraft}
                  disabled={sendingSwap}
                  style={{
                    flex: 1,
                    backgroundColor: sendingSwap ? '#9CA3AF' : '#10B981',
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    alignItems: 'center'
                  }}
                >
                  {sendingSwap ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                      Send Request
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCancelSwapDraft}
                  disabled={sendingSwap}
                  style={{
                    flex: 1,
                    backgroundColor: '#EF4444',
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
      
      {/* AI Suggested Reply Banner */}
      {aiSuggestedReply && (
        <View style={{ 
          backgroundColor: Colors.background.accent,
          padding: 12,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border.accent,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 20, marginRight: 8 }}>✨</Text>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text.accent }}>
                  AI Suggested Reply
                </Text>
                <TouchableOpacity
                  onPress={handleDismissAiReply}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{
                    padding: 4,
                  }}
                >
                  <Text style={{ fontSize: 18, color: Colors.text.secondary }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ 
                fontSize: 14, 
                color: Colors.text.primary, 
                marginBottom: 8,
                fontStyle: 'italic',
                backgroundColor: Colors.white,
                padding: 8,
                borderRadius: 6,
              }}>
                "{aiSuggestedReply}"
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={handleUseAiReply}
                  style={{
                    flex: 1,
                    backgroundColor: Colors.accent,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                    Use This Reply
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDismissAiReply}
                  style={{
                    flex: 1,
                    backgroundColor: Colors.gray[400],
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                    Dismiss
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
      
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={giftedChatUser}
        placeholder="Type a message..."
        alwaysShowSend
        scrollToBottom
        renderUsernameOnMessage={false}
        showUserAvatar={false}
        renderTicks={renderTicks}
        renderActions={renderActions}
        renderInputToolbar={renderInputToolbar}
        onInputTextChanged={handleInputTextChanged}
        listViewProps={{
          contentContainerStyle: { paddingTop: 10 },
        }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={0}
        minInputToolbarHeight={44}
        text={aiSuggestedReply || undefined}
      />
      </View>
      
      <BottomNavigation currentRoute={`/chat/${roomId}`} />
    </View>
  );
}

