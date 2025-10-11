// app/chat/[roomId].jsx
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Actions, GiftedChat, InputToolbar } from 'react-native-gifted-chat';
import { useAuth } from '../../context/AuthContext';
import { listenMessages, markThreadRead, sendMessage } from '../../services/chatService';
import { uploadChatImageToCloudinary } from '../../services/cloudinaryService';
import {
  getSocket,
  wsSendMessage,
  wsTypingStart,
  wsTypingStop,
} from '../../services/socket';

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

  const typingTimer = useRef(null);
  
  // Move all hooks before any conditional returns
  const conversationId = useMemo(() => (roomId ? String(roomId) : null), [roomId]);
  // Ensure uid is a string for comparison with message senderIds
  const giftedChatUser = useMemo(() => ({ _id: String(uid || 'anonymous') }), [uid]);

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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>No conversation ID provided</Text>
      </View>
    );
  }

  // Main chat UI
  return (
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
          <Text style={{ fontSize: 12, color: '#92400E' }}>
            ⚠️ WebSocket disconnected - using Firestore mode
          </Text>
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
      />
    </View>
  );
}

