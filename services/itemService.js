import { addDoc, collection, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from './firebaseConfig';

// Upload image and get its download URL
export const uploadImage = async (uri, fileName) => {
  if (!uri) return null;

  // Convert image URI to blob (React Native requirement)
  const response = await fetch(uri);
  const blob = await response.blob();

  // Upload to Firebase Storage
  const storageRef = ref(storage, `product-images/${fileName}`);
  await uploadBytes(storageRef, blob);

  // Get download URL
  return await getDownloadURL(storageRef);
};

// Add product to Firestore
export const addItemToFirestore = async (product) => {
  const docRef = await addDoc(collection(db, 'products'), {
    ...product,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

// Update product availability
export const updateProductAvailability = async (productId, availability = false) => {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      availability: availability,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating product availability:', error);
    throw error;
  }
};
