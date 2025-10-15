import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import Colors from "../constants/Colors";
import { auth } from "../services/firebaseConfig";
import { useAppI18n } from "../utils/i18n";

export default function SplashScreen() {
  const router = useRouter();
  const { common } = useAppI18n();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let userToRoute = null;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      userToRoute = user ? "/" : "/";
    });

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        router.replace(userToRoute || "/");
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Decorative Background Elements */}
      <View style={styles.backgroundDecor}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
      </View>
      
      <View style={styles.content}>
        <View >
          <Image
            source={require("../assets/images/adaptive-icon.png")}
            style={styles.logo}
          />
        </View>
        
        {/* <Text style={styles.title}>Maaru.LK</Text>
        <Text style={styles.tagline}>Swap, Trade, Thrive</Text> */}
        <Text style={styles.subtitle}>{common('loading')}</Text>
        
        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBar} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary, // 60% - Primary color background
  },
  backgroundDecor: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.secondary, // 30% - Secondary color
    opacity: 0.3,
  },
  circle2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: Colors.accent, // 10% - Accent color
    opacity: 0.3,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.secondary, // 30% - Secondary color for text
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: Colors.secondaryDark,
    marginBottom: 20,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.secondary,
    textAlign: "center",
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  loadingContainer: {
    width: 200,
    height: 4,
    backgroundColor: Colors.secondaryLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingBar: {
    width: '60%',
    height: '100%',
    backgroundColor: Colors.accent, // 10% - Accent color
    borderRadius: 2,
  },
});