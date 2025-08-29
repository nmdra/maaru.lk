import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
// Removed file
export default function Loader() {
  return (
    <View style={styles.center}>
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
