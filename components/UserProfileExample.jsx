/**
 * Example Component - Using AsyncStorage with Custom Hooks
 * 
 * This demonstrates how to use the useUserData hook in your components
 */

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useUserData } from '../hooks/useUserData';
import { updateUserData } from '../utils/storage';

export default function UserProfileExample() {
  const { userData, loading, refreshUserData } = useUserData();

  const handleUpdatePhone = async () => {
    await updateUserData({ phone: '+1234567890' });
    refreshUserData(); // Refresh to show updated data
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading user data...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text>No user data found. Please log in.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>User ID:</Text>
        <Text style={styles.value}>{userData.userId}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{userData.name || 'N/A'}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{userData.email || 'N/A'}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Phone:</Text>
        <Text style={styles.value}>{userData.phone || 'N/A'}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Role:</Text>
        <Text style={styles.value}>{userData.role || 'N/A'}</Text>
      </View>

      <Pressable style={styles.button} onPress={handleUpdatePhone}>
        <Text style={styles.buttonText}>Update Phone (Demo)</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={refreshUserData}>
        <Text style={styles.buttonText}>Refresh Data</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    width: 100,
    color: '#666',
  },
  value: {
    fontSize: 16,
    flex: 1,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
