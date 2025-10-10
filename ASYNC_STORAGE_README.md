# AsyncStorage User Data Implementation

## Overview
This implementation adds persistent user data storage using AsyncStorage. User information is now saved locally when users log in or sign up, and cleared when they log out.

## What's Stored
The following user information is stored in AsyncStorage:
- **userId** - Firebase user ID
- **email** - User email address
- **name** - User display name
- **photoURL** - Profile picture URL
- **role** - User role (e.g., 'buyer', 'seller')
- **firstName** - User's first name
- **lastName** - User's last name
- **phone** - User's phone number
- **createdAt** - Account creation timestamp
- **updatedAt** - Last update timestamp

## Files Modified

### 1. **utils/storage.js** (New File)
Contains all AsyncStorage utility functions:
- `saveUserData(userData)` - Save complete user data
- `getUserData()` - Get complete user data
- `getUserId()` - Get user ID only
- `getUserEmail()` - Get user email only
- `getUserName()` - Get user name only
- `updateUserData(updates)` - Update specific fields
- `clearUserData()` - Clear all user data (logout)
- `isUserLoggedIn()` - Check if user data exists

### 2. **app/(auth)/Login.jsx**
- Added import for `saveUserData` and Firestore functions
- Updated `handleLogin()` to fetch user data from Firestore and save to AsyncStorage
- Updated `handleGoogleLogin()` to save user data after Google sign-in

### 3. **app/(auth)/SignUp.jsx**
- Added import for `saveUserData`
- Updated `handleRegister()` to save user data to AsyncStorage after registration

### 4. **app/(auth)/Profile.jsx**
- Added import for `clearUserData`
- Updated `handleSignOut()` to clear AsyncStorage when user logs out

### 5. **context/AuthContext.jsx**
- Added import for `clearUserData`
- Updated `logout()` function to clear AsyncStorage

## Usage Examples

### Get User Data in a Component
```javascript
import { useEffect, useState } from 'react';
import { getUserData } from '../utils/storage';

function MyComponent() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      const data = await getUserData();
      setUserData(data);
    };
    loadUserData();
  }, []);

  return (
    <View>
      <Text>Welcome, {userData?.name}!</Text>
      <Text>Email: {userData?.email}</Text>
    </View>
  );
}
```

### Get Specific Field
```javascript
import { getUserId, getUserName } from '../utils/storage';

async function someFunction() {
  const userId = await getUserId();
  const userName = await getUserName();
  console.log(`User ${userName} (${userId})`);
}
```

### Check Login Status
```javascript
import { isUserLoggedIn } from '../utils/storage';

async function checkAuth() {
  const loggedIn = await isUserLoggedIn();
  if (!loggedIn) {
    // Redirect to login
  }
}
```

### Update User Data
```javascript
import { updateUserData } from '../utils/storage';

async function updateProfile() {
  await updateUserData({
    name: 'New Name',
    phone: '+1234567890'
  });
}
```

## Benefits
1. **Offline Access** - User data is available even without internet
2. **Faster Load Times** - No need to fetch from Firebase every time
3. **Reduced Firebase Reads** - Saves on Firebase quotas
4. **Better UX** - Instant access to user info
5. **Session Persistence** - User stays logged in across app restarts

## Important Notes
- Data is stored locally on the device only
- Data is automatically cleared on logout
- Always validate data before using (check for null/undefined)
- Use the provided utility functions instead of accessing AsyncStorage directly
- Data persists across app restarts until the user logs out

## Testing
To test the implementation:
1. Log in with email/password or Google
2. Check console for "✅ User data saved to AsyncStorage" message
3. Close and reopen the app - data should persist
4. Log out - data should be cleared
5. Check console for "✅ User data cleared from AsyncStorage" message

## Security Considerations
- AsyncStorage is NOT encrypted by default
- Don't store sensitive data like passwords or credit card info
- Data is only accessible by your app
- Consider using SecureStore for highly sensitive data (requires additional setup)
