/**
 * Example usage of AsyncStorage utilities
 * 
 * This file demonstrates how to use the storage utility functions
 * in your components.
 */

import { getUserData, getUserId, getUserEmail, getUserName, isUserLoggedIn } from './storage';

// Example 1: Get complete user data
export const exampleGetUserData = async () => {
  const userData = await getUserData();
  if (userData) {
    console.log('User ID:', userData.userId);
    console.log('User Email:', userData.email);
    console.log('User Name:', userData.name);
    console.log('User Phone:', userData.phone);
    console.log('User Role:', userData.role);
  } else {
    console.log('No user data found');
  }
};

// Example 2: Get specific fields
export const exampleGetSpecificFields = async () => {
  const userId = await getUserId();
  const email = await getUserEmail();
  const name = await getUserName();
  
  console.log('Quick access - User ID:', userId);
  console.log('Quick access - Email:', email);
  console.log('Quick access - Name:', name);
};

// Example 3: Check if user is logged in
export const exampleCheckLogin = async () => {
  const loggedIn = await isUserLoggedIn();
  if (loggedIn) {
    console.log('User is logged in');
  } else {
    console.log('User is not logged in');
  }
};

// Example 4: Usage in a React component
/**
 * import { useEffect, useState } from 'react';
 * import { getUserData } from '../utils/storage';
 * 
 * function MyComponent() {
 *   const [userData, setUserData] = useState(null);
 * 
 *   useEffect(() => {
 *     const loadUserData = async () => {
 *       const data = await getUserData();
 *       setUserData(data);
 *     };
 *     loadUserData();
 *   }, []);
 * 
 *   if (!userData) {
 *     return <Text>Loading...</Text>;
 *   }
 * 
 *   return (
 *     <View>
 *       <Text>Welcome, {userData.name}!</Text>
 *       <Text>Email: {userData.email}</Text>
 *       <Text>User ID: {userData.userId}</Text>
 *     </View>
 *   );
 * }
 */
