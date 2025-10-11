// services/cloudinaryService.js
/**
 * Cloudinary image upload service for chat images
 * Uses Cloudinary's unsigned upload preset for React Native compatibility
 * Supports both web and native platforms
 */

import { Platform } from 'react-native';

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'duf2mrqdc';
const CLOUDINARY_API_KEY = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || '987477279395763';
const CLOUDINARY_UPLOAD_PRESET = 'chat_images'; // You'll need to create this in Cloudinary dashboard

/**
 * Upload an image to Cloudinary for chat messages
 * @param {Object} params - Upload parameters
 * @param {string} params.uri - Local file URI from ImagePicker
 * @param {string} params.conversationId - Chat room/conversation ID
 * @param {string} params.uid - User ID of the sender
 * @returns {Promise<string>} - Cloudinary secure URL of uploaded image
 */
export async function uploadChatImageToCloudinary({ uri, conversationId, uid }) {
  if (!uri || !conversationId || !uid) {
    throw new Error('uploadChatImageToCloudinary: missing uri/conversationId/uid');
  }

  try {
    // Create form data for Cloudinary upload
    const formData = new FormData();
    
    // Handle differently for web vs native
    if (Platform.OS === 'web') {
      // For web: fetch the blob and append it
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('file', blob, `chat_${Date.now()}.jpg`);
    } else {
      // For native: use the URI with file info
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('file', {
        uri,
        type,
        name: filename || `chat_${Date.now()}.jpg`,
      });
    }

    // Cloudinary upload preset (unsigned upload)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    // Add folder organization
    formData.append('folder', `maaru_chat/${conversationId}`);
    
    // Add context metadata
    formData.append('context', `conversationId=${conversationId}|userId=${uid}`);
    
    // Add tags for easier management
    formData.append('tags', `chat,user_${uid},room_${conversationId}`);

    // Upload to Cloudinary
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
      
      // Provide helpful error message for missing preset
      try {
        const errorData = JSON.parse(errorText);
        if (errorData?.error?.message === 'Upload preset not found') {
          console.error(
            '\n❌ CLOUDINARY SETUP REQUIRED ❌\n\n' +
            'Upload preset "chat_images" not found!\n\n' +
            'To fix this:\n' +
            '1. Go to https://cloudinary.com/console\n' +
            '2. Settings → Upload tab\n' +
            '3. Scroll to "Upload presets"\n' +
            '4. Click "Add upload preset"\n' +
            '5. Set: name="chat_images", mode="Unsigned"\n' +
            '6. Save\n\n' +
            'See CLOUDINARY_SETUP.md for detailed instructions.\n'
          );
          throw new Error('Upload preset "chat_images" not found. Please create it in Cloudinary Dashboard.');
        }
      } catch (parseError) {
        // If not JSON or different error, continue with original error
      }
      
      throw new Error(`Cloudinary upload failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Return the secure URL
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Upload an image to Cloudinary with signed upload (more secure, requires backend)
 * Note: This requires a backend endpoint to generate signatures
 * Use this if you want more control and security
 */
export async function uploadChatImageToCloudinarySigned({ uri, conversationId, uid, signature, timestamp }) {
  if (!uri || !conversationId || !uid || !signature || !timestamp) {
    throw new Error('uploadChatImageToCloudinarySigned: missing required parameters');
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

    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', `maaru_chat/${conversationId}`);
    formData.append('context', `conversationId=${conversationId}|userId=${uid}`);
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
    console.error('Error uploading to Cloudinary (signed):', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Delete an image from Cloudinary
 * Note: Requires backend implementation for security
 * @param {string} publicId - Cloudinary public ID of the image
 */
export async function deleteChatImageFromCloudinary(publicId) {
  // This should be implemented on your backend for security
  // as it requires API secret
  console.warn('Delete operation should be implemented on backend');
  throw new Error('Delete operation not implemented - use backend API');
}

/**
 * Get optimized/transformed Cloudinary URL
 * @param {string} cloudinaryUrl - Original Cloudinary URL
 * @param {Object} options - Transformation options
 * @param {number} options.width - Target width
 * @param {number} options.height - Target height
 * @param {string} options.crop - Crop mode (fill, fit, scale, etc.)
 * @param {number} options.quality - Quality (1-100) or 'auto'
 * @param {string} options.format - Format (jpg, png, webp) or 'auto'
 * @returns {string} - Transformed Cloudinary URL
 */
export function getOptimizedCloudinaryUrl(cloudinaryUrl, options = {}) {
  if (!cloudinaryUrl || !cloudinaryUrl.includes('cloudinary.com')) {
    return cloudinaryUrl;
  }

  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = options;

  // Split URL at /upload/
  const parts = cloudinaryUrl.split('/upload/');
  if (parts.length !== 2) return cloudinaryUrl;

  // Build transformation string
  const transformations = [];
  
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (width || height) transformations.push(`c_${crop}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);

  const transformString = transformations.join(',');
  
  // Reconstruct URL with transformations
  return `${parts[0]}/upload/${transformString}/${parts[1]}`;
}

/**
 * Get thumbnail URL for chat image preview
 * @param {string} cloudinaryUrl - Original Cloudinary URL
 * @param {number} size - Thumbnail size (default: 200)
 * @returns {string} - Thumbnail URL
 */
export function getChatImageThumbnail(cloudinaryUrl, size = 200) {
  return getOptimizedCloudinaryUrl(cloudinaryUrl, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
}

/**
 * Get mobile-optimized URL for chat images
 * @param {string} cloudinaryUrl - Original Cloudinary URL
 * @returns {string} - Mobile-optimized URL
 */
export function getChatImageMobileOptimized(cloudinaryUrl) {
  return getOptimizedCloudinaryUrl(cloudinaryUrl, {
    width: 800,
    quality: 'auto',
    format: 'auto',
  });
}

/**
 * Upload image to Cloudinary in a specific folder
 * @param {string} uri - Local image URI
 * @param {string} folder - Cloudinary folder name (e.g., 'products', 'user_uploads')
 * @returns {Promise<string>} - Uploaded image URL
 */
export async function uploadImageToCloudinary(uri, folder = '') {
  if (!uri) throw new Error('No URI provided for upload');

  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    formData.append('file', blob, `image_${Date.now()}.jpg`);
  } else {
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri,
      type,
      name: filename || `image_${Date.now()}.jpg`,
    });
  }

  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  // Add folder if specified
  if (folder) {
    formData.append('folder', folder);
  }

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const response = await fetch(cloudinaryUrl, {
    method: 'POST',
    body: formData,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.secure_url;
}