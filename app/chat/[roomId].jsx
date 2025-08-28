import React, { useEffect, useState, useCallback } from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import { useLocalSearchParams } from 'expo-router';
import { listenMessages, sendMessage } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';

export default function ChatRoom() {
  const { roomId } = useLocalSearchParams();
  const { user } = useAuth(); // expects user.uid
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!roomId) return;
    const unsub = listenMessages(roomId, (rows) => {
      setMessages(
        rows.map((m) => ({
          _id: m.id,
          text: m.text,
          createdAt: m.createdAt?.toDate?.() ?? new Date(),
          user: { _id: m.fromUid },
        }))
      );
    });
    return () => unsub?.();
  }, [roomId]);

  const onSend = useCallback(async (newMessages = []) => {
    for (const m of newMessages) {
      await sendMessage(roomId, user.uid, m.text);
    }
  }, [roomId, user?.uid]);

  return (
    <GiftedChat
      messages={messages}
      onSend={onSend}
      user={{ _id: user.uid }}
      renderUsernameOnMessage={false}
      showUserAvatar={false}
      alwaysShowSend
    />
  );
}
