// TEMPORARY WORKAROUND: Direct upload without preset
// This bypasses the upload preset requirement but is less organized
// REPLACE THIS WITH PROPER UNSIGNED UPLOAD PRESET ASAP!

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'duf2mrqdc';

/**
 * TEMPORARY: Upload without preset (uses default settings)
 * WARNING: This won't organize files properly and bypasses Cloudinary best practices
 */
export async function uploadChatImageToCloudinary({ uri, conversationId, uid }) {
  if (!uri || !conversationId || !uid) {
    throw new Error('uploadChatImageToCloudinary: missing uri/conversationId/uid');
  }

  try {
    const formData = new FormData();
    
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri,
      type,
      name: filename || `chat_${Date.now()}.jpg`,
    });

    // Use default preset instead of 'chat_images'
    formData.append('upload_preset', 'ml_default');
    
    // Still try to add metadata (may not work without custom preset)
    formData.append('folder', `maaru_chat/${conversationId}`);
    formData.append('tags', `chat,user_${uid},room_${conversationId}`);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudinary upload failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

// Export other helper functions from main service
export {
    getChatImageMobileOptimized, getChatImageThumbnail, getOptimizedCloudinaryUrl
} from './cloudinaryService';

