// app/chat/index.jsx
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, orderBy, limit as qlimit, query } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import BottomNavigation from '../../components/BottomNavigation';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { listenConversations } from '../../services/chatService';
import { db } from '../../services/firebaseConfig';

/** tiny time-ago helper (minutes/hours/days) */
const timeAgo = (d) => {
  const ts = d instanceof Date ? d.getTime() : (d?.toDate?.() ? d.toDate().getTime() : Date.now());
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const dys = Math.floor(h / 24);
  return `${dys}d`;
};

/** ticks used in preview (only when last sender is current user) */
const Ticks = ({ delivered, read }) => {
  const base = { marginRight: 4, fontSize: 12, fontWeight: '700' };
  if (read) return <Text style={[base, { color: '#3B82F6' }]}>✓✓</Text>;         // blue-500
  if (delivered) return <Text style={[base, { color: '#1E3A8A' }]}>✓✓</Text>;     // indigo-800
  return <Text style={[base, { color: '#9CA3AF' }]}>✓</Text>;                      // gray-400
};

export default function ChatList() {
  const router = useRouter();
  const { user } = useAuth(); // must expose user?.uid
  const uid = user?.uid;

  const [convs, setConvs] = useState([]);
  const [counterparts, setCounterparts] = useState({});  // uid -> { displayName, avatarUrl }
  const [lastMeta, setLastMeta] = useState({});          // convId -> { senderId, deliveredTo[], readBy[] }

  // live conversations for current user (ordered by lastAt desc in service)
  useEffect(() => {
    if (!uid) return;
    const unsub = listenConversations(
      uid,
      (rows) => setConvs(rows),
      (err) => console.error('listenConversations error:', err)
    );
    return () => unsub?.();
  }, [uid]);

  // fetch counterpart user docs for display names/avatars
  useEffect(() => {
    if (!uid || convs.length === 0) return;
    (async () => {
      const needed = new Set();
      convs.forEach((c) => (c.participants || []).forEach((p) => { if (p !== uid && !counterparts[p]) needed.add(p); }));
      if (!needed.size) return;
      const updates = {};
      await Promise.all(Array.from(needed).map(async (otherUid) => {
        try {
          const snap = await getDoc(doc(db, 'users', otherUid));
          updates[otherUid] = snap.exists() ? snap.data() : { displayName: 'User', avatarUrl: null };
        } catch {
          updates[otherUid] = { displayName: 'User', avatarUrl: null };
        }
      }));
      if (Object.keys(updates).length) setCounterparts((prev) => ({ ...prev, ...updates }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convs, uid]);

  // fetch the latest message doc per conversation to read delivered/read status for ticks
  useEffect(() => {
    if (!uid || convs.length === 0) return;
    (async () => {
      const updates = {};
      await Promise.all(convs.map(async (c) => {
        try {
          const q = query(
            collection(db, 'conversations', c.id, 'messages'),
            orderBy('createdAt', 'desc'),
            qlimit(1)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const d = snap.docs[0];
            const m = d.data();
            updates[c.id] = {
              senderId: m.senderId,
              deliveredTo: Array.isArray(m.deliveredTo) ? m.deliveredTo : [],
              readBy: Array.isArray(m.readBy) ? m.readBy : [],
            };
          }
        } catch (e) {
          // ignore per-conversation errors
        }
      }));
      if (Object.keys(updates).length) setLastMeta((prev) => ({ ...prev, ...updates }));
    })();
  }, [convs, uid]);

  const data = useMemo(() => convs, [convs]);

  const renderItem = ({ item }) => {
    const other = (item.participants || []).find((p) => p !== uid);
    const cp = counterparts[other] || {};
    const preview =
      item?.lastMessage?.type === 'image' ? '📷 Photo' : (item?.lastMessage?.text || 'No messages yet');

    // lastAt may be a Firestore Timestamp
    const lastAt = item?.lastAt?.toDate?.() ? item.lastAt.toDate()
                  : (item?.lastAt instanceof Date ? item.lastAt : null);

    const unread = item?.unread?.[uid] || 0;
    const thumb = item?.productCard?.thumbnailUrl;

    // receipt info (only if YOU sent the last message)
    const meta = lastMeta[item.id] || null;
    const youSentLast = meta?.senderId === uid;
    const delivered = youSentLast && meta?.deliveredTo?.length > 0;
    const read = youSentLast && meta?.readBy?.length > 0;

    return (
      <Pressable
        onPress={() => router.push({ pathname: '/chat/[roomId]', params: { roomId: item.id } })}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <Image
          source={{ uri: cp.avatarUrl || 'https://placehold.co/60x60?text=U' }}
          style={styles.avatar}
        />
        <View style={styles.mid}>
          <View style={styles.topLine}>
            <Text style={styles.name} numberOfLines={1}>{cp.displayName || 'User'}</Text>
            <Text style={styles.time}>{lastAt ? timeAgo(lastAt) : ''}</Text>
          </View>

          <View style={styles.bottomLine}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {youSentLast ? <Ticks delivered={delivered} read={read} /> : null}
              <Text style={styles.preview} numberOfLines={1}>{preview}</Text>
            </View>

            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeTxt}>{unread}</Text>
              </View>
            )}
          </View>
        </View>
        {thumb ? <Image source={{ uri: thumb }} style={styles.thumb} /> : null}
      </Pressable>
    );
  };

  if (!uid) {
    return (
      <SafeAreaView style={styles.wrap}>
        <Header />
        <View style={styles.emptyWrap}>
          <Text style={styles.empty}>Please login to view your inbox.</Text>
        </View>
        <BottomNavigation currentRoute="/chat" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.wrap}>
      <Header />
      
      <View style={{ flex: 1 }}>
        <FlatList
          data={data}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.empty}>No conversations yet</Text>
            </View>
          }
          contentContainerStyle={data.length === 0 ? { flex: 1 } : null}
        />
      </View>
      
      <BottomNavigation currentRoute="/chat" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fff' },
  sep: { height: 1, backgroundColor: '#eee' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  rowPressed: { backgroundColor: '#f8f8f8' },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: '#e5e7eb' },
  mid: { flex: 1, justifyContent: 'center' },
  topLine: { flexDirection: 'row', alignItems: 'center' },
  name: { flex: 1, fontWeight: '700', fontSize: 15, color: '#111827' },
  time: { marginLeft: 8, fontSize: 12, color: '#6b7280' },
  bottomLine: { marginTop: 3, flexDirection: 'row', alignItems: 'center' },
  preview: { flex: 1, color: '#6b7280' },
  badge: { marginLeft: 8, minWidth: 20, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#2563eb', borderRadius: 999, alignItems: 'center' },
  badgeTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  thumb: { width: 42, height: 42, borderRadius: 6, marginLeft: 10, backgroundColor: '#e5e7eb' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: '#6b7280' },
});
