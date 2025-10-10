import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_DATA: '@maaru_user_data',
  USER_ID: '@maaru_user_id',
  USER_EMAIL: '@maaru_user_email',
  USER_NAME: '@maaru_user_name',
};

/**
 * Save user data to AsyncStorage
 * @param {Object} userData - User data object containing userId, email, name, etc.
 */
export const saveUserData = async (userData) => {
  try {
    const userDataToStore = {
      userId: userData.userId || userData.uid,
      email: userData.email,
      name: userData.name || userData.displayName,
      // photoURL removed - not using Firebase Storage
      role: userData.role,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      address: userData.address,
      createdAt: userData.createdAt,
      updatedAt: new Date().toISOString(),
    };

    // Store the complete user data as JSON
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userDataToStore));
    
    // Also store individual fields for quick access
    if (userDataToStore.userId) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userDataToStore.userId);
    }
    if (userDataToStore.email) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_EMAIL, userDataToStore.email);
    }
    if (userDataToStore.name) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, userDataToStore.name);
    }

    console.log('✅ User data saved to AsyncStorage:', userDataToStore.userId);
    return true;
  } catch (error) {
    console.error('❌ Error saving user data to AsyncStorage:', error);
    return false;
  }
};

/**
 * Get complete user data from AsyncStorage
 * @returns {Object|null} User data object or null
 */
export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (userData) {
      const parsedData = JSON.parse(userData);
      console.log('✅ User data retrieved from AsyncStorage:', parsedData.userId);
      return parsedData;
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting user data from AsyncStorage:', error);
    return null;
  }
};

/**
 * Get user ID from AsyncStorage
 * @returns {string|null} User ID or null
 */
export const getUserId = async () => {
  try {
    const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
    return userId;
  } catch (error) {
    console.error('❌ Error getting user ID from AsyncStorage:', error);
    return null;
  }
};

/**
 * Get user email from AsyncStorage
 * @returns {string|null} User email or null
 */
export const getUserEmail = async () => {
  try {
    const email = await AsyncStorage.getItem(STORAGE_KEYS.USER_EMAIL);
    return email;
  } catch (error) {
    console.error('❌ Error getting user email from AsyncStorage:', error);
    return null;
  }
};

/**
 * Get user name from AsyncStorage
 * @returns {string|null} User name or null
 */
export const getUserName = async () => {
  try {
    const name = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
    return name;
  } catch (error) {
    console.error('❌ Error getting user name from AsyncStorage:', error);
    return null;
  }
};

/**
 * Update specific user data fields
 * @param {Object} updates - Object containing fields to update
 */
export const updateUserData = async (updates) => {
  try {
    const currentData = await getUserData();
    if (!currentData) {
      console.warn('⚠️ No user data found to update');
      return false;
    }

    const updatedData = {
      ...currentData,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await saveUserData(updatedData);
    console.log('✅ User data updated in AsyncStorage');
    return true;
  } catch (error) {
    console.error('❌ Error updating user data in AsyncStorage:', error);
    return false;
  }
};

/**
 * Clear user data from AsyncStorage (logout)
 */
export const clearUserData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.USER_ID,
      STORAGE_KEYS.USER_EMAIL,
      STORAGE_KEYS.USER_NAME,
    ]);
    console.log('✅ User data cleared from AsyncStorage');
    return true;
  } catch (error) {
    console.error('❌ Error clearing user data from AsyncStorage:', error);
    return false;
  }
};

/**
 * Check if user is logged in (has data in storage)
 * @returns {boolean} True if user data exists
 */
export const isUserLoggedIn = async () => {
  try {
    const userId = await getUserId();
    return userId !== null;
  } catch (error) {
    console.error('❌ Error checking login status:', error);
    return false;
  }
};

export default {
  saveUserData,
  getUserData,
  getUserId,
  getUserEmail,
  getUserName,
  updateUserData,
  clearUserData,
  isUserLoggedIn,
};
