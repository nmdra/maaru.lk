import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNavigation from "../../components/BottomNavigation";
import Header from "../../components/Header";
import Colors from "../../constants/Colors";
import { auth, db } from "../../services/firebaseConfig";

export default function UpdateProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoURL, setPhotoURL] = useState('');

  // Profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          Alert.alert("Error", "No user logged in.");
          router.replace("/(auth)/Login");
          return;
        }
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setAddress(data.address || "");
          setAge(data.born || "");
          setPhone(data.phone || "");
          setEmail(data.email || user.email || "");
          setPhotoURL(data.photoURL || user.photoURL || "");
        } else {
          Alert.alert("Error", "Profile not found.");
        }
      } catch (error) {
        Alert.alert("Error", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Pick photo from camera or gallery
  const handlePickPhoto = async (fromCamera = false) => {
    let permissionResult;
    if (fromCamera) {
      permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission required', 'Camera permissions are required!');
        return;
      }
    } else {
      permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Camera roll permissions are required!');
        return;
      }
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets?.length > 0) {
      setPhoto(result.assets[0]);
    }
  };

 const handleUpdate = async () => {
  if (!firstName || !lastName || !address || !age || !phone) {
    Alert.alert("Error", "Please fill all fields.");
    return;
  }
    setIsSubmitting(true);
    let uploadedPhotoURL = photoURL;
    try {
      const user = auth.currentUser;
      if (photo) {
        const response = await fetch(photo.uri);
        const blob = await response.blob();
        const storage = getStorage();
        const storageRef = ref(storage, `profilePictures/${user.uid}.jpg`);
        await uploadBytes(storageRef, blob);
        uploadedPhotoURL = await getDownloadURL(storageRef);
        await updateProfile(user, { photoURL: uploadedPhotoURL });
      }
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, {
        firstName,
        lastName,
        address,
        born: age,
        phone,
        photoURL: uploadedPhotoURL,
      });
    
    Alert.alert("Success", "Profile updated!");
    router.push("/(auth)/Profile"); // Make sure this matches your route

  } catch (error) {
    Alert.alert("Error", error.message);
    console.log("Update error:", error);
  } finally {
    setIsSubmitting(false);
  }
};

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.background.primary }}>
        <Header />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
        <BottomNavigation currentRoute="/updateProfile" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.background.primary }}>
      <Header />
      
      <ScrollView className="flex-1">
        {/* Header Section - Removed back button since Header already has navigation */}
        <View className="px-6 pt-6 pb-12" style={{ backgroundColor: Colors.accent }}>
          <View className="items-center">
            <Text className="text-white text-2xl font-bold mb-3">Update your profile</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View className="mx-6 -mt-8 rounded-2xl shadow-lg p-6" style={{ backgroundColor: Colors.card.background }}>
          {/* Icon Section */}
          <View className="items-center -mt-10 mb-6">
            <Pressable onPress={() => handlePickPhoto(false)}>
              <View className="w-24 h-24 rounded-full p-1 shadow-lg" style={{ backgroundColor: Colors.white }}>
                {photo ? (
                  <Image source={{ uri: photo.uri }} className="w-full h-full rounded-full" />
                ) : photoURL ? (
                  <Image source={{ uri: photoURL }} className="w-full h-full rounded-full" />
                ) : (
                  <View className="w-full h-full rounded-full items-center justify-center" style={{ backgroundColor: Colors.accent }}>
                    <Text className="text-white text-2xl font-bold">✎</Text>
                  </View>
                )}
              </View>
            </Pressable>
            <View className="flex-row justify-center mt-2 space-x-3">
              <TouchableOpacity 
                onPress={() => handlePickPhoto(false)} 
                className="flex-row items-center px-3 py-1 rounded-full"
                style={{ backgroundColor: Colors.background.accent }}
              >
                <Ionicons name="image-outline" size={16} color={Colors.accent} />
                <Text className="ml-1 text-sm" style={{ color: Colors.accent }}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handlePickPhoto(true)} 
                className="flex-row items-center px-3 py-1 rounded-full"
                style={{ backgroundColor: Colors.background.accent }}
              >
                <Ionicons name="camera-outline" size={16} color={Colors.accent} />
                <Text className="ml-1 text-sm" style={{ color: Colors.accent }}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>


          {/* Form Section */}
          <View className="space-y-4">
            {/* Name Fields */}
            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Text className="font-medium mb-2" style={{ color: Colors.text.primary }}>First Name</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor={Colors.text.tertiary}
                  autoCapitalize="words"
                  className="w-full rounded-xl px-4 py-3 text-base"
                  style={{ 
                    backgroundColor: Colors.background.secondary,
                    borderWidth: 1,
                    borderColor: Colors.border.default,
                    color: Colors.text.primary
                  }}
                />
              </View>
              <View className="flex-1">
                <Text className="font-medium mb-2" style={{ color: Colors.text.primary }}>Last Name</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor={Colors.text.tertiary}
                  autoCapitalize="words"
                  className="w-full rounded-xl px-4 py-3 text-base"
                  style={{ 
                    backgroundColor: Colors.background.secondary,
                    borderWidth: 1,
                    borderColor: Colors.border.default,
                    color: Colors.text.primary
                  }}
                />
              </View>
            </View>

            {/* Email (read-only) */}
            <View>
              <Text className="font-medium mb-2" style={{ color: Colors.text.primary }}>Email Address</Text>
              <TextInput
                value={email}
                editable={false}
                className="w-full rounded-xl px-4 py-3 text-base"
                style={{ 
                  backgroundColor: Colors.background.tertiary,
                  borderWidth: 1,
                  borderColor: Colors.border.default,
                  color: Colors.text.secondary
                }}
              />
            </View>

            {/* Phone and Age */}
            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Text className="font-medium mb-2" style={{ color: Colors.text.primary }}>Phone</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone number"
                  placeholderTextColor={Colors.text.tertiary}
                  keyboardType="phone-pad"
                  className="w-full rounded-xl px-4 py-3 text-base"
                  style={{ 
                    backgroundColor: Colors.background.secondary,
                    borderWidth: 1,
                    borderColor: Colors.border.default,
                    color: Colors.text.primary
                  }}
                />
              </View>
              <View className="flex-1">
                <Text className="font-medium mb-2" style={{ color: Colors.text.primary }}>Age</Text>
                <TextInput
                  value={age}
                  onChangeText={setAge}
                  placeholder="Age"
                  placeholderTextColor={Colors.text.tertiary}
                  keyboardType="numeric"
                  className="w-full rounded-xl px-4 py-3 text-base"
                  style={{ 
                    backgroundColor: Colors.background.secondary,
                    borderWidth: 1,
                    borderColor: Colors.border.default,
                    color: Colors.text.primary
                  }}
                />
              </View>
            </View>

            {/* Address */}
            <View>
              <Text className="font-medium mb-2" style={{ color: Colors.text.primary }}>Address</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Your address"
                placeholderTextColor={Colors.text.tertiary}
                className="w-full rounded-xl px-4 py-3 text-base"
                style={{ 
                  backgroundColor: Colors.background.secondary,
                  borderWidth: 1,
                  borderColor: Colors.border.default,
                  color: Colors.text.primary
                }}
              />
            </View>

            {/* Update Button */}
            <Pressable
              onPress={handleUpdate}
              className="py-4 rounded-xl mt-5"
              style={{ backgroundColor: Colors.accent }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-center text-base">Update Profile</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
      
      <BottomNavigation currentRoute="/updateProfile" />
    </SafeAreaView>
  );
}