import { addDoc, collection } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from './firebaseConfig'; // make sure storage is exported

/**
 * Uploads an image to Firebase Storage and returns its URL
 */
export async function uploadImage(fileUri, folder = 'products') {
  if (!fileUri) return null;

  // Convert URI to blob
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const storageRef = ref(storage, filename);

  await uploadBytes(storageRef, blob);

  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * Adds a new product/item to Firestore
 */
export async function addItemToFirestore(item) {
  try {
    const productsRef = collection(db, 'products');
    const docRef = await addDoc(productsRef, item);
    return docRef.id;
  } catch (err) {
    console.error('Error adding item to Firestore:', err);
    throw err;
  }
}
