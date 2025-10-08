// services/userService.js
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Make sure /users/{uid} has the *minimal* fields chat needs.
 * We MERGE so your existing fields stay untouched.
 */
export const ensureMinimalUserFields = async (uid, { displayName, avatarUrl, role = 'buyer' } = {}) => {
  if (!uid) return;
  await setDoc(
    doc(db, 'users', uid),
    {
      displayName: displayName ?? 'User',
      avatarUrl: avatarUrl ?? null,
      role,
      updatedAt: serverTimestamp(),
      // Step 6 can add push tokens safely later
    },
    { merge: true }
  );
};
