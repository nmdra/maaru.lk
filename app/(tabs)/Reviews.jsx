import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, SafeAreaView, Text, TextInput, View } from "react-native";
import Header from "../../components/Header";
import Colors from "../../constants/Colors";
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
			<View className="rounded-lg shadow p-4 mb-3" style={{ backgroundColor: Colors.card.background }}>
				<Text className="font-bold text-lg mb-1" style={{ color: Colors.text.primary }}>{item.reviewerName || t('reviews.anonymous')}</Text>
				<Text className="mb-1" style={{ color: Colors.warning }}>{t('reviews.rating')}: {item.rating}</Text>
				<Text className="mb-2" style={{ color: Colors.text.secondary }}>{item.comment}</Text>
				<Text className="text-xs mb-1" style={{ color: Colors.text.tertiary }}>{item.timestamp?.toDate?.().toLocaleString?.() || ""}</Text>
				{isMine && (
					<View className="flex-row space-x-2 mt-2">
						<Pressable onPress={() => openEditModal(item)} className="px-3 py-1 rounded" style={{ backgroundColor: Colors.accent }}>
							<Text className="text-white">{t('reviews.edit')}</Text>
						</Pressable>
						<Pressable onPress={() => handleDelete(item)} className="px-3 py-1 rounded" style={{ backgroundColor: Colors.error }}>
							<Text className="text-white">{t('reviews.delete')}</Text>
						</Pressable>
					</View>
				)}
			</View>
		);
	}

	return (
		<SafeAreaView className="flex-1" style={{ backgroundColor: Colors.background.primary }}>
			<Header />
			
			<View className="flex-1 p-4" style={{ backgroundColor: Colors.background.primary }}>
				<Text className="text-2xl font-bold mb-4" style={{ color: Colors.text.primary }}>{t('reviews.sellerReviews')}</Text>
				<Pressable onPress={openCreateModal} className="py-3 rounded mb-4" style={{ backgroundColor: Colors.button.primary }}>
					<Text className="text-white text-center font-semibold">{t('reviews.addReview')}</Text>
				</Pressable>
			{loading ? (
				<ActivityIndicator size="large" color={Colors.accent} />
			) : (
				<FlatList
					data={reviews}
					keyExtractor={item => item.id}
					renderItem={renderReview}
					ListEmptyComponent={<Text className="text-center mt-10" style={{ color: Colors.text.tertiary }}>{t('reviews.noReviewsYet')}</Text>}
				/>
			)}

			{/* Modal for create/edit */}
			<Modal visible={modalVisible} animationType="slide" transparent>
				<View className="flex-1 justify-center items-center" style={{ backgroundColor: Colors.background.overlay }}>
					<View className="w-11/12 rounded-xl p-6" style={{ backgroundColor: Colors.white }}>
						<Text className="text-xl font-bold mb-4" style={{ color: Colors.text.primary }}>{editingReview ? t('reviews.editReview') : t('reviews.addReview')}</Text>
						<Text className="mb-2" style={{ color: Colors.text.primary }}>{t('reviews.ratingLabel')}</Text>
						<TextInput
							value={String(rating)}
							onChangeText={t => {
								// Allow empty string for typing
								if (t === "" || /^[1-5]$/.test(t)) setRating(t);
							}}
							keyboardType="numeric"
							className="border rounded px-3 py-2 mb-3"
							style={{ borderColor: Colors.input.border, backgroundColor: Colors.input.background, color: Colors.input.text }}
						/>
						<Text className="mb-2" style={{ color: Colors.text.primary }}>{t('reviews.commentLabel')}</Text>
						<TextInput
							value={comment}
							onChangeText={setComment}
							placeholder={t('reviews.commentPlaceholder')}
							placeholderTextColor={Colors.input.placeholder}
							multiline
							className="border rounded px-3 py-2 mb-3 min-h-[60px]"
							style={{ borderColor: Colors.input.border, backgroundColor: Colors.input.background, color: Colors.input.text }}
						/>
						<View className="flex-row justify-end space-x-2">
							<Pressable onPress={() => setModalVisible(false)} className="px-4 py-2 rounded" style={{ backgroundColor: Colors.button.disabled }}>
								<Text style={{ color: Colors.text.primary }}>{t('reviews.cancel')}</Text>
							</Pressable>
							<Pressable onPress={handleSubmit} className="px-4 py-2 rounded" style={{ backgroundColor: Colors.button.primary }} disabled={submitting}>
								<Text className="text-white">{submitting ? t('reviews.saving') : editingReview ? t('reviews.update') : t('reviews.submit')}</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>
			</View>
		</SafeAreaView>
	);
}
