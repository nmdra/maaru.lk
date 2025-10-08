// services/uploadService.js
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebaseConfig';

/**
 * Upload a chat image to Firebase Storage and return its download URL.
 * Works on native + web (ImagePicker returns file/blob URI).
 */
export async function uploadChatImageAsync({ uri, conversationId, uid }) {
  if (!uri || !conversationId || !uid) {
    throw new Error('uploadChatImageAsync: missing uri/conversationId/uid');
  }

  // Fetch file as Blob (works for file:// and blob: on web/native)
  const res = await fetch(uri);
  const blob = await res.blob();

  const ts = Date.now();
  const ext = (blob.type && blob.type.split('/')[1]) || 'jpg';
  const path = `chatImages/${conversationId}/${uid}_${ts}.${ext}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, blob);
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}
