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
          router.replace("/login");
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

    const handlePickPhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Camera roll permissions are required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.cancelled && result.assets?.length > 0) {
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
    router.push("/profile"); // Make sure this matches your route

  } catch (error) {
    Alert.alert("Error", error.message);
    console.log("Update error:", error);
  } finally {
    setIsSubmitting(false);
  }
};

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header Section */}
        <View className="bg-blue-600 px-6 pt-8 pb-20">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity 
              onPress={() => router.push('/profile')} 
              className="p-2 -ml-2"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View className="items-center">
            <Text className="text-white text-3xl font-bold mb-6">Update your details</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View className="mx-6 -mt-12 bg-white rounded-2xl shadow-lg p-6">
          {/* Icon Section */}
          <View className="items-center -mt-16 mb-8">
            <Pressable onPress={handlePickPhoto}>
              <View className="w-32 h-32 rounded-full bg-white p-1 shadow-lg">
                {photo ? (
                  <Image source={{ uri: photo.uri }} className="w-full h-full rounded-full" />
                ) : photoURL ? (
                  <Image source={{ uri: photoURL }} className="w-full h-full rounded-full" />
                ) : (
                  <View className="w-full h-full rounded-full bg-blue-500 items-center justify-center">
                    <Text className="text-white text-4xl font-bold">✎</Text>
                  </View>
                )}
              </View>
              <View className="items-center mt-2">
                <Text className="text-blue-600">Change Photo</Text>
              </View>
            </Pressable>
          </View>


          {/* Form Section */}
          <View className="space-y-4">
            {/* Name Fields */}
            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-2">First Name</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  autoCapitalize="words"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-2">Last Name</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  autoCapitalize="words"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                />
              </View>
            </View>

            {/* Email (read-only) */}
            <View>
              <Text className="text-gray-700 font-medium mb-2">Email Address</Text>
              <TextInput
                value={email}
                editable={false}
                className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-400"
              />
            </View>

            {/* Phone and Age */}
            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-2">Phone</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-2">Age</Text>
                <TextInput
                  value={age}
                  onChangeText={setAge}
                  placeholder="Age"
                  keyboardType="numeric"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                />
              </View>
            </View>

            {/* Address */}
            <View>
              <Text className="text-gray-700 font-medium mb-2">Address</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Your address"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
              />
            </View>

            {/* Update Button */}
            <Pressable
              onPress={handleUpdate}
              className="bg-blue-600 py-4 rounded-xl mt-6"
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
    </SafeAreaView>
  );
}