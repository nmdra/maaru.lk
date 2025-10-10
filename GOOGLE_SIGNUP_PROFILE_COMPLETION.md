# Google Sign-In Profile Completion Implementation

## Overview
Updated the Google Sign-In flow to collect additional user information (first name, last name, phone number, address) and save it to Firestore without using Firebase Storage for profile photos.

## Changes Made

### 1. **Created CompleteProfile Screen** (`app/(auth)/CompleteProfile.jsx`)
- New screen for collecting additional user information after Google Sign-In
- Collects: First Name, Last Name, Phone Number, Address (optional)
- Validates phone number format (10-15 digits)
- Saves complete profile to Firestore and AsyncStorage
- **No profile photo upload** - removed Firebase Storage dependency

**Fields Collected:**
- ✅ Email (pre-filled from Google, read-only)
- ✅ First Name (required)
- ✅ Last Name (required)
- ✅ Phone Number (required, validated)
- ✅ Address (optional)

### 2. **Updated Login.jsx**

#### Email/Password Login
- Removed profile photo storage (`photoURL`)
- Set `avatarUrl` to `undefined` instead of Google photo URL
- Added `address` field to AsyncStorage

#### Google Login  
- Checks if user profile exists and is complete in Firestore
- If profile is incomplete (missing firstName, lastName, or phone):
  - Redirects to `CompleteProfile` screen with user data
- If profile is complete:
  - Saves user data to AsyncStorage (without profile photo)
  - Redirects to Home

### 3. **Updated SignUp.jsx**
- **Removed** all photo upload functionality:
  - Removed `ImagePicker` import
  - Removed `storage` import
  - Removed `photo` and `photoURL` state
  - Removed `handlePickPhoto` function
  - Removed photo UI from form
- Updated form to show static "M" logo instead of photo upload
- Saves user data without `photoURL` field
- Added `address` field to user document

### 4. **Updated _layout.jsx**
- Added `CompleteProfile` screen to auth stack routes

### 5. **Updated storage.js**
- Removed `photoURL` field from stored user data
- Added `address` field to stored user data

## User Flow

### Google Sign-In (New User)
1. User clicks "Continue with Google"
2. Google authentication completes
3. System checks Firestore for existing profile
4. **Profile incomplete** → Redirects to `CompleteProfile` screen
5. User fills in: First Name, Last Name, Phone, Address
6. System saves to Firestore + AsyncStorage
7. Redirects to Home

### Google Sign-In (Returning User)
1. User clicks "Continue with Google"
2. Google authentication completes
3. System checks Firestore for existing profile
4. **Profile complete** → Loads data from Firestore
5. Saves to AsyncStorage
6. Redirects to Home

### Email/Password Registration
1. User fills registration form (no photo upload)
2. System creates Firebase Auth account
3. Saves profile to Firestore
4. Saves to AsyncStorage
5. Redirects to Home

## Firestore User Document Structure

```javascript
{
  uid: "firebase-user-id",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  displayName: "John Doe",
  phone: "+1234567890",
  address: "123 Main St", // optional
  role: "buyer",
  born: "25", // age (for email signups)
  createdAt: "2025-10-11T...",
  updatedAt: "2025-10-11T...",
  // NO photoURL field
}
```

## AsyncStorage Structure

```javascript
{
  userId: "firebase-user-id",
  email: "user@example.com",
  name: "John Doe",
  firstName: "John",
  lastName: "Doe",
  phone: "+1234567890",
  address: "123 Main St",
  role: "buyer",
  createdAt: "2025-10-11T...",
  updatedAt: "2025-10-11T...",
  // NO photoURL field
}
```

## Removed Dependencies
- ❌ Firebase Storage for profile photos
- ❌ `expo-image-picker` usage
- ❌ Photo upload/download logic
- ❌ Profile photo state management

## Benefits
✅ No Firebase Storage costs for profile photos  
✅ Simplified user registration flow  
✅ Consistent data collection for all sign-up methods  
✅ Complete user profiles in Firestore  
✅ Phone number validation  
✅ Address collection for future features  

## Testing Checklist
- [ ] Google Sign-In (first time) → CompleteProfile screen appears
- [ ] Complete profile form → Data saved to Firestore
- [ ] Google Sign-In (returning) → Directly to Home
- [ ] Email/Password Sign-Up → No photo upload option
- [ ] All user data saved without photoURL
- [ ] AsyncStorage contains correct fields
- [ ] Phone number validation works
- [ ] Required fields enforced

## Files Modified
1. ✅ `app/(auth)/CompleteProfile.jsx` - Created
2. ✅ `app/(auth)/Login.jsx` - Updated
3. ✅ `app/(auth)/SignUp.jsx` - Updated
4. ✅ `app/(auth)/_layout.jsx` - Updated
5. ✅ `utils/storage.js` - Updated

## Notes
- Profile photos are NOT stored or used
- Google profile photos are ignored
- All authentication methods collect the same core data
- Phone number format: +1234567890 (10-15 digits)
- Address field is optional
