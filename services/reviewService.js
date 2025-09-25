/**
 * Update a review for a seller.
 * @param {string} sellerId - The userId of the seller.
 * @param {string} reviewId - The id of the review to update.
 * @param {object} updateData - The fields to update (e.g., rating, comment).
 * @returns {Promise<void>}
 */
export async function updateReview(sellerId, reviewId, updateData) {
	if (!sellerId || !reviewId) throw new Error("Missing sellerId or reviewId");
	const reviewDoc = doc(db, "users", sellerId, "reviews", reviewId);
	await updateDoc(reviewDoc, updateData);
}

/**
 * Delete a review for a seller.
 * @param {string} sellerId - The userId of the seller.
 * @param {string} reviewId - The id of the review to delete.
 * @returns {Promise<void>}
 */
export async function deleteReview(sellerId, reviewId) {
	if (!sellerId || !reviewId) throw new Error("Missing sellerId or reviewId");
	const reviewDoc = doc(db, "users", sellerId, "reviews", reviewId);
	await deleteDoc(reviewDoc);
}
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { Alert, Pressable, Text } from 'react-native';
import { db } from "./firebaseConfig";
/**
 * Fetch all reviews for a seller.
 * @param {string} sellerId - The userId of the seller.
 * @returns {Promise<Array>} Array of review objects with id and data.
 */
export async function fetchReviews(sellerId) {
	if (!sellerId) throw new Error("Missing sellerId");
	const reviewsCol = collection(db, "users", sellerId, "reviews");
	const q = query(reviewsCol, orderBy("timestamp", "desc"));
	const snapshot = await getDocs(q);
	return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Create a review for a seller.
 * @param {string} sellerId - The userId of the seller being reviewed.
 * @param {string} reviewerId - The userId of the reviewer.
 * @param {number} rating - The rating given (e.g., 1-5).
 * @param {string} comment - The review text.
 * @param {object} [reviewerInfo] - Optional: { reviewerName, reviewerPhoto }
 * @returns {Promise<string>} The new review's id.
 */
export async function createReview({ sellerId, reviewerId, rating, comment, reviewerInfo = {} }) {
	if (!sellerId || !reviewerId || !rating || !comment) throw new Error("Missing required review fields");
	const reviewData = {
		reviewerId,
		rating,
		comment,
		...reviewerInfo,
		timestamp: serverTimestamp(),
	};
	const reviewsCol = collection(db, "users", sellerId, "reviews");
	const docRef = await addDoc(reviewsCol, reviewData);
	return docRef.id;
}

async function handleDelete(review) {
  Alert.alert("Delete Review", "Are you sure?", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: async () => {
      try {
        await deleteReview(sellerId, review.id);
        console.log("Deleted review", review.id);
        loadReviews();
      } catch (e) {
        Alert.alert("Error", e.message);
        console.log("Delete error", e);
      }
    }}
  ]);
}

<Pressable onPress={() => { console.log("Delete pressed", item.id); handleDelete(item); }}>
  <Text className="text-white">Delete</Text>
</Pressable>
