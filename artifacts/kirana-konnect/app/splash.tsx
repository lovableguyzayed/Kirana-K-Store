import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade + scale in the logo
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: false }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: false }),
    ]).start();

    // Bounce dots
    const bounceDot = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: -10, duration: 350, useNativeDriver: false }),
          Animated.timing(anim, { toValue: 0, duration: 350, useNativeDriver: false }),
          Animated.delay(400),
        ])
      );

    const b1 = bounceDot(dot1, 0);
    const b2 = bounceDot(dot2, 150);
    const b3 = bounceDot(dot3, 300);
    b1.start(); b2.start(); b3.start();

    const t = setTimeout(async () => {
      try {
        const raw = await AsyncStorage.getItem("kk_user");
        if (raw) {
          const user = JSON.parse(raw);
          if (user?.role === "shopkeeper") {
            router.replace("/(shopkeeper)/dashboard");
          } else {
            router.replace("/(tabs)");
          }
        } else {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      }
    }, 2800);
    return () => {
      clearTimeout(t);
      b1.stop(); b2.stop(); b3.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo card */}
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoCard}>
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.appName}>Kirana Konnect</Text>
        <Text style={styles.tagline}>Your neighbourhood store,{"\n"}delivered to your door</Text>

        {/* Store info pill */}
        <View style={styles.infoPill}>
          <Text style={styles.infoText}>🛒  Made for Indian Kirana Stores</Text>
        </View>
      </Animated.View>

      {/* Loading dots */}
      <View style={styles.dotsRow}>
        {[dot1, dot2, dot3].map((d, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, { transform: [{ translateY: d }] }]}
          />
        ))}
      </View>

      <Text style={styles.version}>Version 1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  content: {
    alignItems: "center",
    gap: 16,
  },
  logoCard: {
    width: 130,
    height: 130,
    backgroundColor: "#fff",
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
    marginBottom: 8,
  },
  logoImage: {
    width: 110,
    height: 110,
    borderRadius: 20,
  },
  appName: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  tagline: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  infoPill: {
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  infoText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
    height: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  version: {
    position: "absolute",
    bottom: 40,
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
