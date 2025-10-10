import { useEffect, useState } from 'react';
import { getUserData, isUserLoggedIn } from '../utils/storage';

/**
 * Custom hook to get user data from AsyncStorage
 * @returns {Object} { userData, loading, refreshUserData }
 */
export const useUserData = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const data = await getUserData();
      setUserData(data);
    } catch (error) {
      console.error('Error loading user data:', error);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  return {
    userData,
    loading,
    refreshUserData: loadUserData,
  };
};

/**
 * Custom hook to check if user is logged in
 * @returns {Object} { isLoggedIn, loading }
 */
export const useIsLoggedIn = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      setLoading(true);
      try {
        const loggedIn = await isUserLoggedIn();
        setIsLoggedIn(loggedIn);
      } catch (error) {
        console.error('Error checking login status:', error);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

  return { isLoggedIn, loading };
};
