// app/chat/[roomId].jsx
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Actions, GiftedChat } from 'react-native-gifted-chat';
import { useAuth } from '../../context/AuthContext';

import {
  listenMessages,
} from '../../services/chatService';

import { uploadChatImageAsync } from '../../services/uploadService';

import {
  getSocket,
  // wsMarkSeen,           // ⬅️ keep disabled for now
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

// stable signature for a single Firestore message doc
function docKey(d) {
  const delivered = Array.isArray(d.deliveredTo) ? [...d.deliveredTo].sort().join(',') : '';
  const read = Array.isArray(d.readBy) ? [...d.readBy].sort().join(',') : '';
  const created = tsToMillis(d.createdAt);
  const type = d.type || '';
  const text = (d.text || '').replace(/\s+/g, ' ').trim();
  const media = d.mediaUrl || '';
  const from = d.senderId || '';
  return `${d.id}|${from}|${type}|${text}|${media}|${created}|${delivered}|${read}`;
}

// stable signature for the full snapshot + optimistic list
function mergedKey(rows, optimistic) {
  const a = rows.map(docKey).join('||');
  const b = optimistic.map((m) =>
    `${m._id}|${m.user?._id || ''}|${m.text || ''}|${m.image || ''}|${m.createdAt instanceof Date ? m.createdAt.getTime() : 0}`
  ).join('||');
  return `${a}<<<OPT>>>${b}`;
}

export default function ChatRoom() {
  const { roomId } = useLocalSearchParams();
  const { user } = useAuth();
  const uid = user?.uid || null;

  const [rows, setRows] = useState([]);
  const [optimistic, setOptimistic] = useState([]);
  const [sendingImage, setSendingImage] = useState(false);

  const lastSentTempId = useRef(null);
  const typingTimer = useRef(null);

  // keep last snapshot key to avoid redundant setRows
  const lastRowsKeyRef = useRef('');

  // 💡 keep a STABLE messages array reference for GiftedChat
  const messagesRef = useRef([]);            // <-- the array we pass to GiftedChat
  const messagesKeyRef = useRef('');         // <-- last content key we used

  const conversationId = useMemo(() => (roomId ? String(roomId) : null), [roomId]);

  /* ---------- Firestore listener ---------- */
  useEffect(() => {
    if (!conversationId) return;
    const unsub = listenMessages(
      conversationId,
      async (docs) => {
        const snapKey = rowsKey(docs);
        if (snapKey !== lastRowsKeyRef.current) {
          setRows(docs);
          lastRowsKeyRef.current = snapKey;
        }

        // remove optimistic bubble when the real one appears
        if (lastSentTempId.current && docs.some((m) => m.type === 'image' && m.senderId === uid)) {
          setOptimistic((prev) => prev.filter((m) => m._id !== lastSentTempId.current));
          lastSentTempId.current = null;
        }

        // ⚠️ keep delivered/read disabled during stabilization
        // (uncomment only after backend seen/delivered are idempotent)
      },
      (err) => console.error('listenMessages error:', err),
      { pageSize: 30 }
    );
    return () => unsub && unsub();
  }, [conversationId, uid]);

  function rowsKey(docs) {
    return docs.map(docKey).join('||');
  }

  /* ---------- Build serverMessages (stable dates) ---------- */
  const serverMessages = useMemo(() => {
    return [...rows]
      .map((m) => {
        const createdMillis = tsToMillis(m.createdAt);
        const created = createdMillis ? new Date(createdMillis) : new Date(0); // stable fallback
        return {
          _id: m.id,
          text: m.type === 'image' ? '' : m.text || '',
          createdAt: created,
          user: { _id: m.senderId },
          image: m.type === 'image' ? m.mediaUrl : undefined,
          deliveredTo: m.deliveredTo || [],
          readBy: m.readBy || [],
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [rows]);

  /* ---------- Merge optimistic + server into a SINGLE STABLE ARRAY ---------- */
  const buildMergedMessages = useCallback(() => {
    const merged = [...optimistic, ...serverMessages].sort(
      (a, b) => {
        const at = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bt = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return bt - at;
      }
    );
    return merged;
  }, [optimistic, serverMessages]);

  // Only update messagesRef when the *content* key changes
  const currentMergedKey = useMemo(() => mergedKey(rows, optimistic), [rows, optimistic]);
  useEffect(() => {
    if (currentMergedKey !== messagesKeyRef.current) {
      messagesRef.current = buildMergedMessages();
      messagesKeyRef.current = currentMergedKey;
    }
  }, [currentMergedKey, buildMergedMessages]);

  /* ---------- Send text via WebSocket ---------- */
  const onSend = useCallback(
    async (newMessages = []) => {
      if (!conversationId || !uid || newMessages.length === 0) return;
      const m = newMessages[0];
      const text = (m.text || '').trim();
      if (!text) return;

      wsSendMessage(
        { conversationId, type: 'text', text },
        (res) => {
          if (!res?.ok) console.log('send error:', res?.error);
        }
      );
    },
    [conversationId, uid]
  );

  /* ---------- Typing indicator (debounced) ---------- */
  const handleInputTextChanged = useCallback(
    (_text) => {
      if (!conversationId) return;
      wsTypingStart(conversationId);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => wsTypingStop(conversationId), 1200);
    },
    [conversationId]
  );

  /* ---------- Pick & send image (optimistic) ---------- */
  const pickAndSendImage = useCallback(async () => {
    try {
      if (!uid || !conversationId) return;

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

      const tempId = `local-${Date.now()}`;
      lastSentTempId.current = tempId;
      setOptimistic((prev) => [
        {
          _id: tempId,
          text: '',
          createdAt: new Date(), // fixed at creation time
          user: { _id: uid },
          image: asset.uri,
          deliveredTo: [],
          readBy: [],
          _optimistic: true,
        },
        ...prev,
      ]);

      setSendingImage(true);

      const downloadUrl = await uploadChatImageAsync({
        uri: asset.uri,
        conversationId,
        uid,
      });

      wsSendMessage(
        { conversationId, type: 'image', mediaUrl: downloadUrl, text: '' },
        (res) => {
          if (!res?.ok) console.log('image send error:', res?.error);
        }
      );
    } catch (e) {
      console.error('Image send failed:', e);
      alert('Could not send image. Please try again.');
      if (lastSentTempId.current) {
        setOptimistic((prev) => prev.filter((m) => m._id !== lastSentTempId.current));
        lastSentTempId.current = null;
      }
    } finally {
      setSendingImage(false);
    }
  }, [conversationId, uid]);

  /* ---------- Optional socket listeners ---------- */
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onTyping = () => {};
    const onSeen = () => {};
    socket.on('typing', onTyping);
    socket.on('message:seen', onSeen);
    return () => {
      socket.off('typing', onTyping);
      socket.off('message:seen', onSeen);
    };
  }, [conversationId]);

  function renderTicks(currentMessage) {
    if (currentMessage?._optimistic) return null;
    if (!uid || currentMessage?.user?._id !== uid) return null;

    const delivered = Array.isArray(currentMessage.deliveredTo) && currentMessage.deliveredTo.length > 0;
    const read = Array.isArray(currentMessage.readBy) && currentMessage.readBy.length > 0;

    const baseStyle = { marginLeft: 4, fontSize: 13, fontWeight: '600' };
    if (read) return <Text style={[baseStyle, { color: '#3B82F6' }]}>✓✓</Text>;
    if (delivered) return <Text style={[baseStyle, { color: '#1E3A8A' }]}>✓✓</Text>;
    return <Text style={[baseStyle, { color: '#9CA3AF' }]}>✓</Text>;
  }

  function renderActions(props) {
    return (
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
  }

  if (!conversationId) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>No conversationId</Text>
      </View>
    );
  }

  // 👇 pass the STABLE ARRAY reference
  return (
    <View style={{ flex: 1 }}>
      <GiftedChat
        messages={messagesRef.current}
        onSend={onSend}
        user={useMemo(() => ({ _id: uid || 'anonymous' }), [uid])}
        placeholder="Type a message"
        alwaysShowSend
        scrollToBottom
        renderUsernameOnMessage={false}
        showUserAvatar={false}
        renderTicks={renderTicks}
        renderActions={renderActions}
        onInputTextChanged={handleInputTextChanged}
      />
    </View>
  );
}
