import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import { useAuth } from '../../context/AuthContext';
import { listenMessages, roomIdFor, sendMessage } from '../../services/chatService';

export default function ChatRoom() {
  const { roomId } = useLocalSearchParams();
  const { user } = useAuth(); // expects user.uid
  const [messages, setMessages] = useState([]);

  const effectiveRoomId = useMemo(() => {
    if (!roomId) return null;
    // If param looks like a composed id (contains "_"), use as-is; else treat it as otherUid
    if (String(roomId).includes('_')) return String(roomId);
    if (user?.uid) return roomIdFor(user.uid, String(roomId));
    return null;
  }, [roomId, user?.uid]);

  useEffect(() => {
    if (!effectiveRoomId) return;
    const unsub = listenMessages(effectiveRoomId, (rows) => {
      setMessages(
        rows.map((m) => ({
          _id: m.id,
          text: m.text,
          createdAt:
            m?.createdAt && typeof m.createdAt?.toDate === 'function'
              ? m.createdAt.toDate()
              : m?.createdAt instanceof Date
              ? m.createdAt
              : new Date(),
          user: { _id: m.fromUid },
        }))
      );
    });
    return () => unsub?.();
  }, [effectiveRoomId]);

  const onSend = useCallback(async (newMessages = []) => {
    if (!effectiveRoomId || !user?.uid) return;
    for (const m of newMessages) {
      await sendMessage(effectiveRoomId, user.uid, m.text);
    }
  }, [effectiveRoomId, user?.uid]);

  return (
    <GiftedChat
      messages={messages}
      onSend={onSend}
      user={{ _id: user?.uid }}
      renderUsernameOnMessage={false}
      showUserAvatar={false}
      alwaysShowSend
    />
  );
}
