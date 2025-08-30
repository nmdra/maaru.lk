import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";
import { auth } from "../../services/firebaseConfig";
import { createReview, deleteReview, fetchReviews, updateReview } from "../../services/reviewService";

// Replace with the sellerId you want to show reviews for (e.g., from props or navigation)
const sellerId = "SELLER_USER_ID";

export default function Reviews() {
	const [reviews, setReviews] = useState([]);
	const [loading, setLoading] = useState(true);
	const [modalVisible, setModalVisible] = useState(false);
	const [editingReview, setEditingReview] = useState(null);
	const [rating, setRating] = useState(5);
	const [comment, setComment] = useState("");
	const [submitting, setSubmitting] = useState(false);

	// Fetch reviews on mount
	useEffect(() => {
		loadReviews();
	}, []);

	async function loadReviews() {
		setLoading(true);
		try {
			const data = await fetchReviews(sellerId);
			setReviews(data);
		} catch (e) {
			Alert.alert("Error", e.message);
		} finally {
			setLoading(false);
		}
	}

	function openCreateModal() {
		setEditingReview(null);
		setRating(5);
		setComment("");
		setModalVisible(true);
	}

	function openEditModal(review) {
		setEditingReview(review);
		setRating(review.rating);
		setComment(review.comment);
		setModalVisible(true);
	}

	async function handleSubmit() {
		if (!comment.trim()) {
			Alert.alert("Validation", "Please enter a comment.");
			return;
		}
		const numRating = parseInt(rating, 10);
		if (isNaN(numRating) || numRating < 1 || numRating > 5) {
			Alert.alert("Validation", "Rating must be a number between 1 and 5.");
			return;
		}
		setSubmitting(true);
		try {
			if (editingReview) {
				await updateReview(sellerId, editingReview.id, { rating, comment });
				Alert.alert("Success", "Review updated.");
			} else {
				await createReview({
					sellerId,
					reviewerId: auth.currentUser.uid,
					rating,
					comment,
					reviewerInfo: { reviewerName: auth.currentUser.displayName || "", reviewerPhoto: auth.currentUser.photoURL || "" }
				});
				Alert.alert("Success", "Review added.");
			}
			setModalVisible(false);
			loadReviews();
		} catch (e) {
			Alert.alert("Error", e.message);
		} finally {
			setSubmitting(false);
		}
	}

	async function handleDelete(review) {
		Alert.alert("Delete Review", "Are you sure?", [
			{ text: "Cancel", style: "cancel" },
			{ text: "Delete", style: "destructive", onPress: async () => {
				try {
					await deleteReview(sellerId, review.id);
					loadReviews();
				} catch (e) {
					Alert.alert("Error", e.message);
				}
			}}
		]);
	}

	// UI for each review
	function renderReview({ item }) {
		const isMine = item.reviewerId === auth.currentUser?.uid;
		return (
			<View className="bg-white rounded-lg shadow p-4 mb-3">
				<Text className="font-bold text-lg mb-1">{item.reviewerName || "Anonymous"}</Text>
				<Text className="text-yellow-500 mb-1">Rating: {item.rating}</Text>
				<Text className="mb-2">{item.comment}</Text>
				<Text className="text-xs text-gray-400 mb-1">{item.timestamp?.toDate?.().toLocaleString?.() || ""}</Text>
				{isMine && (
					<View className="flex-row space-x-2 mt-2">
						<Pressable onPress={() => openEditModal(item)} className="bg-blue-500 px-3 py-1 rounded">
							<Text className="text-white">Edit</Text>
						</Pressable>
						<Pressable onPress={() => handleDelete(item)} className="bg-red-500 px-3 py-1 rounded">
							<Text className="text-white">Delete</Text>
						</Pressable>
					</View>
				)}
			</View>
		);
	}

	return (
		<View className="flex-1 bg-gray-100 p-4">
			<Text className="text-2xl font-bold mb-4">Seller Reviews</Text>
			<Pressable onPress={openCreateModal} className="bg-blue-600 py-3 rounded mb-4">
				<Text className="text-white text-center font-semibold">Add Review</Text>
			</Pressable>
			{loading ? (
				<ActivityIndicator size="large" color="#1a73e8" />
			) : (
				<FlatList
					data={reviews}
					keyExtractor={item => item.id}
					renderItem={renderReview}
					ListEmptyComponent={<Text className="text-center text-gray-400 mt-10">No reviews yet.</Text>}
				/>
			)}

			{/* Modal for create/edit */}
			<Modal visible={modalVisible} animationType="slide" transparent>
				<View className="flex-1 justify-center items-center bg-black bg-opacity-40">
					<View className="bg-white w-11/12 rounded-xl p-6">
						<Text className="text-xl font-bold mb-4">{editingReview ? "Edit Review" : "Add Review"}</Text>
						<Text className="mb-2">Rating (1-5):</Text>
						<TextInput
							value={String(rating)}
							onChangeText={t => {
								// Allow empty string for typing
								if (t === "" || /^[1-5]$/.test(t)) setRating(t);
							}}
							keyboardType="numeric"
							className="border border-gray-300 rounded px-3 py-2 mb-3"
						/>
						<Text className="mb-2">Comment:</Text>
						<TextInput
							value={comment}
							onChangeText={setComment}
							placeholder="Write your review..."
							multiline
							className="border border-gray-300 rounded px-3 py-2 mb-3 min-h-[60px]"
						/>
						<View className="flex-row justify-end space-x-2">
							<Pressable onPress={() => setModalVisible(false)} className="px-4 py-2 bg-gray-300 rounded">
								<Text>Cancel</Text>
							</Pressable>
							<Pressable onPress={handleSubmit} className="px-4 py-2 bg-blue-600 rounded" disabled={submitting}>
								<Text className="text-white">{submitting ? "Saving..." : editingReview ? "Update" : "Submit"}</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
}
