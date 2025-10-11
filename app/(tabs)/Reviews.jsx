import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { createReview, deleteReview, fetchReviews, updateReview } from "../../services/reviewService";
import { useAppI18n } from "../../utils/i18n";

// Replace with the sellerId you want to show reviews for (e.g., from props or navigation)
const sellerId = "SELLER_USER_ID";

export default function Reviews() {
	const { t } = useAppI18n();
	const { user } = useAuth();
	const router = useRouter();
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
			Alert.alert(t('reviews.alerts.error'), e.message);
		} finally {
			setLoading(false);
		}
	}

	function openCreateModal() {
		if (!user) {
			Alert.alert(
				t('common.loginRequired', 'Login Required'),
				t('common.loginToReview', 'Please login to write reviews'),
				[
					{ text: t('common.cancel', 'Cancel'), style: 'cancel' },
					{ 
						text: t('common.login', 'Login'), 
						onPress: () => router.push('/(auth)/Login')
					}
				]
			);
			return;
		}
		setEditingReview(null);
		setRating(5);
		setComment("");
		setModalVisible(true);
	}

	function openEditModal(review) {
		if (!user) {
			Alert.alert(
				t('common.loginRequired', 'Login Required'),
				t('common.loginToReview', 'Please login to edit reviews'),
				[
					{ text: t('common.cancel', 'Cancel'), style: 'cancel' },
					{ 
						text: t('common.login', 'Login'), 
						onPress: () => router.push('/(auth)/Login')
					}
				]
			);
			return;
		}
		setEditingReview(review);
		setRating(review.rating);
		setComment(review.comment);
		setModalVisible(true);
	}

	async function handleSubmit() {
		if (!comment.trim()) {
			Alert.alert(t('common.error'), t('reviews.validation.enterComment'));
			return;
		}
		const numRating = parseInt(rating, 10);
		if (isNaN(numRating) || numRating < 1 || numRating > 5) {
			Alert.alert(t('common.error'), t('reviews.validation.ratingRange'));
			return;
		}
		setSubmitting(true);
		try {
			if (editingReview) {
				await updateReview(sellerId, editingReview.id, { rating, comment });
				Alert.alert(t('common.success'), t('reviews.alerts.updated'));
			} else {
				await createReview({
					sellerId,
					reviewerId: user.uid,
					rating,
					comment,
					reviewerInfo: { reviewerName: user.displayName || "", reviewerPhoto: user.photoURL || "" }
				});
				Alert.alert(t('common.success'), t('reviews.alerts.added'));
			}
			setModalVisible(false);
			loadReviews();
		} catch (e) {
			Alert.alert(t('reviews.alerts.error'), e.message);
		} finally {
			setSubmitting(false);
		}
	}

	async function handleDelete(review) {
		Alert.alert(t('reviews.deleteConfirm'), t('reviews.deleteMessage'), [
			{ text: t('reviews.cancel'), style: "cancel" },
			{ text: t('reviews.delete'), style: "destructive", onPress: async () => {
				try {
					await deleteReview(sellerId, review.id);
					loadReviews();
				} catch (e) {
					Alert.alert(t('reviews.alerts.error'), e.message);
				}
			}}
		]);
	}

	// UI for each review
	function renderReview({ item }) {
		const isMine = item.reviewerId === user?.uid;
		return (
			<View className="bg-white rounded-lg shadow p-4 mb-3">
				<Text className="font-bold text-lg mb-1">{item.reviewerName || t('reviews.anonymous')}</Text>
				<Text className="text-yellow-500 mb-1">{t('reviews.rating')}: {item.rating}</Text>
				<Text className="mb-2">{item.comment}</Text>
				<Text className="text-xs text-gray-400 mb-1">{item.timestamp?.toDate?.().toLocaleString?.() || ""}</Text>
				{isMine && (
					<View className="flex-row space-x-2 mt-2">
						<Pressable onPress={() => openEditModal(item)} className="bg-blue-500 px-3 py-1 rounded">
							<Text className="text-white">{t('reviews.edit')}</Text>
						</Pressable>
						<Pressable onPress={() => handleDelete(item)} className="bg-red-500 px-3 py-1 rounded">
							<Text className="text-white">{t('reviews.delete')}</Text>
						</Pressable>
					</View>
				)}
			</View>
		);
	}

	return (
		<View className="flex-1 bg-gray-100 p-4">
			<Text className="text-2xl font-bold mb-4">{t('reviews.sellerReviews')}</Text>
			<Pressable onPress={openCreateModal} className="bg-blue-600 py-3 rounded mb-4">
				<Text className="text-white text-center font-semibold">{t('reviews.addReview')}</Text>
			</Pressable>
			{loading ? (
				<ActivityIndicator size="large" color="#1a73e8" />
			) : (
				<FlatList
					data={reviews}
					keyExtractor={item => item.id}
					renderItem={renderReview}
					ListEmptyComponent={<Text className="text-center text-gray-400 mt-10">{t('reviews.noReviewsYet')}</Text>}
				/>
			)}

			{/* Modal for create/edit */}
			<Modal visible={modalVisible} animationType="slide" transparent>
				<View className="flex-1 justify-center items-center bg-black bg-opacity-40">
					<View className="bg-white w-11/12 rounded-xl p-6">
						<Text className="text-xl font-bold mb-4">{editingReview ? t('reviews.editReview') : t('reviews.addReview')}</Text>
						<Text className="mb-2">{t('reviews.ratingLabel')}</Text>
						<TextInput
							value={String(rating)}
							onChangeText={t => {
								// Allow empty string for typing
								if (t === "" || /^[1-5]$/.test(t)) setRating(t);
							}}
							keyboardType="numeric"
							className="border border-gray-300 rounded px-3 py-2 mb-3"
						/>
						<Text className="mb-2">{t('reviews.commentLabel')}</Text>
						<TextInput
							value={comment}
							onChangeText={setComment}
							placeholder={t('reviews.commentPlaceholder')}
							multiline
							className="border border-gray-300 rounded px-3 py-2 mb-3 min-h-[60px]"
						/>
						<View className="flex-row justify-end space-x-2">
							<Pressable onPress={() => setModalVisible(false)} className="px-4 py-2 bg-gray-300 rounded">
								<Text>{t('reviews.cancel')}</Text>
							</Pressable>
							<Pressable onPress={handleSubmit} className="px-4 py-2 bg-blue-600 rounded" disabled={submitting}>
								<Text className="text-white">{submitting ? t('reviews.saving') : editingReview ? t('reviews.update') : t('reviews.submit')}</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
}
