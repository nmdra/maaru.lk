import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { listenConversations } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext'; // must expose user.uid

export default function ChatList() {
  const router = useRouter();
  const { user } = useAuth(); // { uid, displayName? }
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = listenConversations(user.uid, setRows);
    return () => unsub?.();
  }, [user?.uid]);

  return (
    <View style={styles.wrap}>
      <FlatList
        data={rows}
        keyExtractor={(it) => it.id}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/chat/${item.id}`)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <Text style={styles.title}>{item.lastMessage?.text ?? 'No messages yet'}</Text>
            <Text style={styles.sub}>
              Room: {item.id}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No chats yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fff' },
  sep: { height: 1, backgroundColor: '#eee' },
  row: { padding: 16 },
  rowPressed: { backgroundColor: '#f8f8f8' },
  title: { fontWeight: '600', fontSize: 16 },
  sub: { marginTop: 4, color: '#666' },
  empty: { padding: 16, color: '#777' },
});
