import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text } from "react-native";
import { auth } from "../services/firebaseConfig"; // adjust this path if your firebase config is elsewhere
import { useAppI18n } from "../utils/i18n";

export default function SplashScreen() {
  const router = useRouter();
  const { common } = useAppI18n();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let userToRoute = null;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      userToRoute = user ? "/Home" : "/Login";
    });

    // Always show splash at least 1 second, then fade out
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600, // fade out duration (ms)
        useNativeDriver: true,
      }).start(() => {
        router.replace(userToRoute || "/Login");
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Image
        source={require("../assets/images/maaru_splash.png")}
        style={styles.logo}
      />
      <Text style={styles.title}>Welcome to Maaru.LK</Text>
      <Text style={styles.subtitle}>{common('loading')}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
    borderRadius: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1a73e8",
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    paddingHorizontal: 30,
    marginBottom: 30,
  },
});