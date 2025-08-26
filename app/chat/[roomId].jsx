import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ChatRoom() {
  const { roomId } = useLocalSearchParams();

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Chat Room</Text>
      <Text style={styles.sub}>Room ID: {String(roomId)}</Text>
      <View style={styles.box}>
        <Text style={styles.note}>
          Frontend shell ready. We’ll wire real-time messages next.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700' },
  sub: { marginTop: 6, color: '#666' },
  box: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
  },
  note: { color: '#444' },
});
