// app/chat/[roomId].jsx
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Actions, GiftedChat } from 'react-native-gifted-chat';
import { useAuth } from '../../context/AuthContext';
import {
  listenMessages,
  markMessagesDelivered,
  markThreadRead,
  sendMessage,
} from '../../services/chatService';
import { uploadChatImageAsync } from '../../services/uploadService';

export default function ChatRoom() {
  const { roomId } = useLocalSearchParams();
  const { user } = useAuth(); // expects user?.uid
  const uid = user?.uid || null;

  const [rows, setRows] = useState([]);
  const [optimistic, setOptimistic] = useState([]); // local, not yet in Firestore
  const [sendingImage, setSendingImage] = useState(false);
  const lastSentTempId = useRef(null);

  const conversationId = useMemo(() => (roomId ? String(roomId) : null), [roomId]);

  // Live messages (service returns oldest -> newest; GiftedChat wants newest first)
  useEffect(() => {
    if (!conversationId) return;
    const unsub = listenMessages(
      conversationId,
      async (docs) => {
        setRows(docs);

        // Remove any optimistic bubble we just inserted once real Firestore message arrives
        if (lastSentTempId.current && docs.some((m) => m.type === 'image' && m.senderId === uid)) {
          setOptimistic((prev) => prev.filter((m) => m._id !== lastSentTempId.current));
          lastSentTempId.current = null;
        }

        // Mark as DELIVERED messages from the other user
        if (!uid) return;
        const toDeliver = docs
          .filter(
            (m) =>
              m.senderId !== uid &&
              (!Array.isArray(m.deliveredTo) || !m.deliveredTo.includes(uid))
          )
          .map((m) => m.id);
        if (toDeliver.length) {
          try {
            await markMessagesDelivered({ conversationId, uid, messageIds: toDeliver });
          } catch (e) {
            console.warn('markMessagesDelivered failed:', e?.message || e);
          }
        }
      },
      (err) => console.error('listenMessages error:', err),
      { pageSize: 30 }
    );
    return () => unsub && unsub();
  }, [conversationId, uid]);

  // Clear unread + mark READ on focus
  useFocusEffect(
    useCallback(() => {
      if (!conversationId || !uid) return;
      markThreadRead({ conversationId, uid }).catch(() => {});
    }, [conversationId, uid])
  );

  // Map Firestore docs -> GiftedChat messages (newest first)
  const serverMessages = useMemo(() => {
    return [...rows]
      .map((m) => ({
        _id: m.id,
        text: m.type === 'image' ? '' : m.text || '',
        createdAt:
          m?.createdAt && typeof m.createdAt?.toDate === 'function'
            ? m.createdAt.toDate()
            : m?.createdAt instanceof Date
            ? m.createdAt
            : new Date(),
        user: { _id: m.senderId },
        image: m.type === 'image' ? m.mediaUrl : undefined,
        deliveredTo: m.deliveredTo || [],
        readBy: m.readBy || [],
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [rows]);

  // Merge optimistic + server (keep newest first)
  const messages = useMemo(() => {
    // optimistic messages already have createdAt set
    return [...optimistic, ...serverMessages].sort((a, b) => b.createdAt - a.createdAt);
  }, [optimistic, serverMessages]);

  // Send text
  const onSend = useCallback(
    async (newMessages = []) => {
      if (!conversationId || !uid || newMessages.length === 0) return;
      const m = newMessages[0];
      if (!m.text?.trim()) return; // prevent empty text sends
      await sendMessage({
        conversationId,
        senderId: uid,
        kind: 'text',
        text: m.text.trim(),
      });
    },
    [conversationId, uid]
  );

  // Pick & send image with optimistic preview
  const pickAndSendImage = useCallback(async () => {
    try {
      if (!uid || !conversationId) return;

      // Ask gallery permission (native); web ignores
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted' && status !== 'undetermined') {
        alert('We need access to your photos to send images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      const cancelled = result?.cancelled ?? result?.canceled;
      const asset = !cancelled && result?.assets?.length ? result.assets[0] : null;
      if (!asset?.uri) return;

      // Show optimistic bubble
      const tempId = `local-${Date.now()}`;
      lastSentTempId.current = tempId;
      setOptimistic((prev) => [
        {
          _id: tempId,
          text: '',
          createdAt: new Date(),
          user: { _id: uid },
          image: asset.uri,
          deliveredTo: [],
          readBy: [],
          _optimistic: true,
        },
        ...prev,
      ]);

      setSendingImage(true);

      // Upload → get URL → send real message
      const downloadUrl = await uploadChatImageAsync({
        uri: asset.uri,
        conversationId,
        uid,
      });

      await sendMessage({
        conversationId,
        senderId: uid,
        kind: 'image',
        mediaUrl: downloadUrl,
      });

      // We don't manually remove the optimistic bubble here;
      // it’s removed in the listener when Firestore message appears.
    } catch (e) {
      console.error('Image send failed:', e);
      alert('Could not send image. Please try again.');
      // remove optimistic if something failed
      if (lastSentTempId.current) {
        setOptimistic((prev) => prev.filter((m) => m._id !== lastSentTempId.current));
        lastSentTempId.current = null;
      }
    } finally {
      setSendingImage(false);
    }
  }, [conversationId, uid]);

  // Custom ticks: ✓ (sent), ✓✓ (delivered), blue ✓✓ (read)
  const renderTicks = (currentMessage) => {
    // no ticks for optimistic preview yet
    if (currentMessage?._optimistic) return null;
    if (!uid || currentMessage?.user?._id !== uid) return null;

    const delivered =
      Array.isArray(currentMessage.deliveredTo) &&
      currentMessage.deliveredTo.length > 0;
    const read =
      Array.isArray(currentMessage.readBy) &&
      currentMessage.readBy.length > 0;

    const baseStyle = { marginLeft: 4, fontSize: 13, fontWeight: '600' };
    if (read) return <Text style={[baseStyle, { color: '#3B82F6' }]}>✓✓</Text>;      // blue-500
    if (delivered) return <Text style={[baseStyle, { color: '#1E3A8A' }]}>✓✓</Text>;  // indigo-800
    return <Text style={[baseStyle, { color: '#9CA3AF' }]}>✓</Text>;                  // gray-400
  };

  // 📎 button in the composer
  const renderActions = (props) => (
    <Actions
      {...props}
      containerStyle={{ marginLeft: 4, marginBottom: 4 }}
      icon={() => (
        <Text style={{ fontSize: 22, paddingHorizontal: 6 }}>
          {sendingImage ? '…' : '📎'}
        </Text>
      )}
      onPressActionButton={pickAndSendImage}
    />
  );

  return (
    <View style={{ flex: 1 }}>
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{ _id: uid || 'anonymous' }}
        placeholder="Type a message"
        alwaysShowSend
        scrollToBottom
        renderUsernameOnMessage={false}
        showUserAvatar={false}
        renderTicks={renderTicks}
        renderActions={renderActions}
      />
    </View>
  );
}
