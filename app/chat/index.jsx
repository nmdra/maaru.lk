import React, { useMemo } from 'react';
import { View, FlatList, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const DUMMY_CONVERSATIONS = [
  { id: 'buyer123_sellerABC', title: 'Seller ABC', lastMessage: 'Hi! Is this available?' },
  { id: 'buyer123_sellerXYZ', title: 'Seller XYZ', lastMessage: 'Price is negotiable.' },
];

export default function ChatList() {
  const router = useRouter();
  const data = useMemo(() => DUMMY_CONVERSATIONS, []);

  return (
    <View style={styles.wrap}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/chat/${item.id}`)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.sub}>{item.lastMessage}</Text>
          </Pressable>
        )}
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
});
