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

// Toggle mock chats (true = in-memory mock with auto-replies)
const USE_MOCK_CHATS = true;

// ---------------- Mock store + helpers ----------------
const mockStore = { byUser: new Map() }; // uid -> { convs, messagesByRoom, convSubs, msgSubsByRoom, initialized }

function ensureUserStore(uid) {
  if (mockStore.byUser.has(uid)) return mockStore.byUser.get(uid);
  const store = {
    convs: [],
    messagesByRoom: new Map(), // roomId -> [{ id, text, fromUid, createdAt, status }]
    convSubs: new Set(),       // Set<cb(convs[])>
    msgSubsByRoom: new Map(),  // roomId -> Set<cb(msgs[])>
    initialized: false,
  };
  mockStore.byUser.set(uid, store);
  return store;
}

function seedMockDataFor(uid) {
  const store = ensureUserStore(uid);
  if (store.initialized) return;

  const sellers = [
    { uid: 'seller_1', name: 'Alice' },
    { uid: 'seller_2', name: 'Bob' },
    { uid: 'seller_3', name: 'Carol' },
  ];
  const items = ['iPhone 15 Pro Max', 'Nike Air Max 270', 'MacBook Air M2'];
  const now = Date.now();

  sellers.forEach((seller, idx) => {
    const rid = roomIdFor(uid, seller.uid);
    const itemName = items[idx % items.length];
    const msgsAsc = [
      { id: `${rid}-m1`, text: 'Hi', fromUid: uid, createdAt: new Date(now - 5 * 60 * 1000), status: 'sent' },
      { id: `${rid}-m2`, text: 'Hi, how can I help you?', fromUid: seller.uid, createdAt: new Date(now - 4 * 60 * 1000), status: 'sent' },
      { id: `${rid}-m3`, text: `I need info about ${itemName}`, fromUid: uid, createdAt: new Date(now - 3 * 60 * 1000), status: 'sent' },
    ];
    const msgsDesc = msgsAsc.sort((a, b) => b.createdAt - a.createdAt);
    store.messagesByRoom.set(rid, msgsDesc);
    store.convs.push({
      id: rid,
      participants: [uid, seller.uid],
      productId: null,
      createdAt: new Date(now - 10 * 60 * 1000),
      updatedAt: msgsDesc[0].createdAt,
      lastMessage: { text: msgsDesc[0].text, fromUid: msgsDesc[0].fromUid, at: msgsDesc[0].createdAt },
      itemName,
    });
  });

  store.convs.sort((a, b) => b.updatedAt - a.updatedAt);
  store.initialized = true;
}

function notifyConvSubs(uid) {
  const store = ensureUserStore(uid);
  const payload = store.convs.slice().sort((a, b) => b.updatedAt - a.updatedAt);
  store.convSubs.forEach((cb) => cb(payload));
}

function notifyMsgSubs(roomId) {
  for (const [, store] of mockStore.byUser.entries()) {
    const subs = store.msgSubsByRoom.get(roomId);
    if (!subs?.size) continue;
    const rows = store.messagesByRoom.get(roomId) || [];
    subs.forEach((cb) => cb(rows.slice()));
  }
}

function findConversationInAnyStore(roomId) {
  for (const [, store] of mockStore.byUser.entries()) {
    const conv = store.convs.find((c) => c.id === roomId);
    if (conv) return { conv, store };
  }
  return { conv: null, store: null };
}

function autoReplyForText(text, itemName) {
  const lower = (text || '').toLowerCase();
  if (/\b(hi|hello|hey)\b/.test(lower)) return 'Hi, how can I help you?';
  if (/\b(price|cost|how much)\b/.test(lower))
    return `The price is in the listing. Any specific questions about ${itemName || 'the item'}?`;
  if (/\b(info|information|details|spec)\b/.test(lower))
    return `Sure, what information about ${itemName || 'the item'} do you need?`;
  return `Got it. Happy to help with ${itemName || 'your request'}.`;
}

function scheduleSellerAutoReply(roomId, buyerUid, incomingText) {
  const { conv } = findConversationInAnyStore(roomId);
  if (!conv) return;

  const [a, b] = conv.participants || [];
  const sellerUid =
    a?.startsWith('seller_') ? a : b?.startsWith('seller_') ? b : buyerUid === a ? b : a;

  const replyText = autoReplyForText(incomingText, conv.itemName);
  const delay = 600 + Math.floor(Math.random() * 800);

  setTimeout(() => {
    const msg = {
      id: `${roomId}-auto-${Math.random().toString(36).slice(2)}`,
      text: replyText,
      fromUid: sellerUid,
      createdAt: new Date(),
      status: 'sent',
    };

    for (const [uid, store] of mockStore.byUser.entries()) {
      const list = store.messagesByRoom.get(roomId);
      if (!list) continue;
      store.messagesByRoom.set(roomId, [msg, ...list]);

      const c = store.convs.find((x) => x.id === roomId);
      if (c) {
        c.updatedAt = msg.createdAt;
        c.lastMessage = { text: msg.text, fromUid: msg.fromUid, at: msg.createdAt };
      }
      notifyConvSubs(uid);
    }
    notifyMsgSubs(roomId);
  }, delay);
}

// ---------------- Public API ----------------
export async function ensureConversation(currentUid, otherUid, productId = null) {
  if (USE_MOCK_CHATS) {
    seedMockDataFor(currentUid);
    const store = ensureUserStore(currentUid);
    const id = roomIdFor(currentUid, otherUid);

    let found = store.convs.find((c) => c.id === id);
    if (!found) {
      found = {
        id,
        participants: [currentUid, otherUid],
        productId,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessage: null,
        itemName: null,
      };
      store.convs.push(found);
      store.messagesByRoom.set(id, []); // start empty for brand-new chat
      notifyConvSubs(currentUid);
    }
    return { id, ref: null };
  }

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
  if (USE_MOCK_CHATS) {
    seedMockDataFor(uid);
    const store = ensureUserStore(uid);
    cb(store.convs.slice().sort((a, b) => b.updatedAt - a.updatedAt));
    store.convSubs.add(cb);
    return () => store.convSubs.delete(cb);
  }

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
  if (USE_MOCK_CHATS) {
    // attach to any store that has the room
    for (const [, store] of mockStore.byUser.entries()) {
      const msgs = store.messagesByRoom.get(roomId) || [];
      cb(msgs.slice(0, count));
      let set = store.msgSubsByRoom.get(roomId);
      if (!set) {
        set = new Set();
        store.msgSubsByRoom.set(roomId, set);
      }
      set.add(cb);
      return () => {
        const s = store.msgSubsByRoom.get(roomId);
        s?.delete(cb);
      };
    }
    // fallback empty subscription if no store yet owns this room
    const fallback = ensureUserStore('mock_fallback');
    fallback.messagesByRoom.set(roomId, []);
    let set = fallback.msgSubsByRoom.get(roomId);
    if (!set) {
      set = new Set();
      fallback.msgSubsByRoom.set(roomId, set);
    }
    set.add(cb);
    cb([]);
    return () => {
      const s = fallback.msgSubsByRoom.get(roomId);
      s?.delete(cb);
    };
  }

  const q = query(
    collection(db, 'conversations', roomId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(count)
  );
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export async function sendMessage(roomId, fromUid, text) {
  if (USE_MOCK_CHATS) {
    const msg = {
      id: `${roomId}-m-${Math.random().toString(36).slice(2)}`,
      text,
      fromUid,
      createdAt: new Date(),
      status: 'sent',
    };

    // push to all stores that have this room
    for (const [uid, store] of mockStore.byUser.entries()) {
      const list = store.messagesByRoom.get(roomId);
      if (!list) continue;

      store.messagesByRoom.set(roomId, [msg, ...list]);

      const conv = store.convs.find((c) => c.id === roomId);
      if (conv) {
        conv.updatedAt = msg.createdAt;
        conv.lastMessage = { text: msg.text, fromUid: msg.fromUid, at: msg.createdAt };
      }
      notifyConvSubs(uid);
    }

    notifyMsgSubs(roomId);

    // schedule seller auto-reply
    scheduleSellerAutoReply(roomId, fromUid, text);
    return;
  }

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
