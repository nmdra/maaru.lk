import { db } from './firebaseConfig';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  limit,
} from 'firebase/firestore';

export const roomIdFor = (a, b) => [a, b].sort().join('_');

export async function ensureConversation(currentUid, otherUid, productId = null) {
  const id = roomIdFor(currentUid, otherUid);
  const ref = doc(db, 'conversations', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      id,
      participants: [currentUid, otherUid],
      productId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: null,
    });
  }
  return { id, ref };
}

export function listenConversations(uid, cb) {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', uid),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function listenMessages(roomId, cb, count = 50) {
  const q = query(
    collection(db, 'conversations', roomId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(count)
  );
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export async function sendMessage(roomId, fromUid, text) {
  const msgs = collection(db, 'conversations', roomId, 'messages');
  await addDoc(msgs, {
    text,
    fromUid,
    createdAt: serverTimestamp(),
    status: 'sent',
  });
  await updateDoc(doc(db, 'conversations', roomId), {
    updatedAt: serverTimestamp(),
    lastMessage: { text, fromUid, at: serverTimestamp() },
  });
}
