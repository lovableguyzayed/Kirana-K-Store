import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export default function SplashScreen() {
  const colors = useColors();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/login"), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={styles.logoWrap}>
        <View style={[styles.iconCircle, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <Feather name="shopping-bag" size={52} color="#fff" />
        </View>
        <Text style={styles.logoText}>Kirana{"\n"}Konnect</Text>
      </View>
      <Text style={styles.tagline}>Find nearby kirana stores instantly</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  logoWrap: {
    alignItems: "center",
    gap: 16,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  tagline: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
