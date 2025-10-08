// services/chatService.js
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Stable, canonical conversation ID:
 * exactly ONE thread per (buyerUid × sellerUid × productId)
 * Keep buyer first to simplify analytics (not sorted alphabetically).
 */

export function roomIdFor(buyerUid, sellerUid, productId) {
  if (!buyerUid || !sellerUid || !productId) {
    throw new Error('roomIdFor: missing buyerUid/sellerUid/productId');
  }
  return `${buyerUid}_${sellerUid}_${productId}`;
}

/**
 * Ensure the conversation document exists with the core fields.
 * - Creates if missing, idempotent if exists.
 * - productCard is a small object used for list previews: { title, price, thumbnailUrl }
 *
 * Returns the canonical conversationId (string).
 */
export async function ensureConversation({
  buyerUid,
  sellerUid,
  productId,
  productCard,
}) {
  if (!buyerUid || !sellerUid || !productId) {
    throw new Error('ensureConversation: missing buyerUid/sellerUid/productId');
  }

  const conversationId = roomIdFor(buyerUid, sellerUid, productId);
  const ref = doc(db, 'conversations', conversationId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const now = serverTimestamp();
    await setDoc(ref, {
      // identity
      participants: [buyerUid, sellerUid],
      productId,
      productCard: productCard || null,

      // order & summary
      lastMessage: null,                // { text, type: 'text'|'image'|'system', at }
      lastAt: now,                      // used for inbox sort
      createdAt: now,

      // notification state per user
      unread: { [buyerUid]: 0, [sellerUid]: 0 },
      muted: { [buyerUid]: false, [sellerUid]: false },

      // lifecycle
      orderId: null,
      status: 'active', // 'active' | 'blocked' | 'archived'
    });
  }

  return conversationId;
}

/**
 * Real-time stream of conversations for the current user, ordered by last activity (desc).
 * onData receives an array of { id, ...conversationDoc }.
 */
export function listenConversations(currentUid, onData, onError) {
  if (!currentUid) throw new Error('listenConversations: missing currentUid');

  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', currentUid),
    orderBy('lastAt', 'desc'),
  );

  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(rows);
    },
    (err) => onError && onError(err),
  );
}

/**
 * Real-time stream of messages in a conversation, oldest → newest.
 * onData receives an array of { id, ...messageDoc }.
 * Use opts.pageSize for initial page (default 30).
 */
export function listenMessages(conversationId, onData, onError, opts = { pageSize: 30 }) {
  if (!conversationId) throw new Error('listenMessages: missing conversationId');

  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(opts.pageSize || 30),
  );

  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(rows);
    },
    (err) => onError && onError(err),
  );
}

/**
 * Send a message (text or image).
 * - Writes the message to /conversations/{id}/messages
 * - Updates parent conversation: lastMessage, lastAt
 * - Increments unread for the *other* participant
 *
 * kind: 'text' | 'image' | 'system'
 * If kind==='image', provide mediaUrl (Step 5 will handle upload).
 */
export async function sendMessage({ conversationId, senderId, kind, text, mediaUrl }) {
  if (!conversationId || !senderId || !kind) {
    throw new Error('sendMessage: missing conversationId/senderId/kind');
  }

  const convRef = doc(db, 'conversations', conversationId);
  const convSnap = await getDoc(convRef);
  if (!convSnap.exists()) {
    throw new Error('sendMessage: conversation does not exist');
  }

  const conv = convSnap.data();
  const [p0, p1] = conv.participants || [];
  const otherUid = senderId === p0 ? p1 : p0;

  const message = {
    senderId,
    type: kind,                        // 'text' | 'image' | 'system'
    text: kind === 'text' ? (text || '').trim() : null,
    mediaUrl: kind === 'image' ? (mediaUrl || null) : null,
    createdAt: serverTimestamp(),
    deliveredTo: [],                   // Step 4: delivery receipts
    readBy: [],                        // Step 4: read receipts
  };

  // 1) Write message
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), message);

  // 2) Update conversation meta + unread for the other user
  const previewText = kind === 'image' ? '📷 Photo' : (message.text || '');
  const nextUnread = (conv.unread?.[otherUid] ?? 0) + 1;

  await updateDoc(convRef, {
    lastMessage: { text: previewText, type: kind, at: serverTimestamp() },
    lastAt: serverTimestamp(),
    [`unread.${otherUid}`]: nextUnread,
  });
}

/**
 * Mark a set of messages as DELIVERED for a viewer (adds uid to deliveredTo[]).
 * Use arrayUnion for race-safety.
 */
export async function markMessagesDelivered({ conversationId, uid, messageIds }) {
  if (!conversationId || !uid || !Array.isArray(messageIds) || messageIds.length === 0) return;

  const batch = writeBatch(db);
  messageIds.forEach((mid) => {
    const mref = doc(db, 'conversations', conversationId, 'messages', mid);
    batch.update(mref, { deliveredTo: arrayUnion(uid) });
  });
  await batch.commit();
}

/**
 * Mark conversation READ for a user:
 * - sets unread[currentUid] = 0
 * - ALSO adds uid to readBy[] (and deliveredTo[]) for a recent slice of the most-recent messages
 *   that were sent by the other participant.
 */
export async function markThreadRead({ conversationId, uid, recentCount = 40 }) {
  if (!conversationId || !uid) {
    throw new Error('markThreadRead: missing conversationId/uid');
  }

  const convRef = doc(db, 'conversations', conversationId);
  const convSnap = await getDoc(convRef);
  if (!convSnap.exists()) return;

  const conv = convSnap.data();
  const otherUid = (conv.participants || []).find((p) => p !== uid);

  // 1) Clear unread for current user
  await updateDoc(convRef, { [`unread.${uid}`]: 0 });

  // 2) Mark a window of recent messages as read (and delivered) when viewing the thread
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(recentCount)
  );
  const snap = await getDocs(q);

  const toRead = [];
  snap.forEach((d) => {
    const m = d.data();
    if (m.senderId === otherUid) {
      // If we haven't read it yet, mark read & delivered
      const alreadyRead = Array.isArray(m.readBy) && m.readBy.includes(uid);
      if (!alreadyRead) toRead.push(d.id);
    }
  });

  if (toRead.length) {
    const batch = writeBatch(db);
    toRead.forEach((mid) => {
      const mref = doc(db, 'conversations', conversationId, 'messages', mid);
      batch.update(mref, {
        readBy: arrayUnion(uid),
        deliveredTo: arrayUnion(uid),
      });
    });
    await batch.commit();
  }
}
