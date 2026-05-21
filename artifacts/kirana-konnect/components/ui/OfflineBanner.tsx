import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const slideAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const handleOnline = () => goOnline();
      const handleOffline = () => goOffline();
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      if (!window.navigator.onLine) goOffline();
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const goOffline = () => {
    setIsOffline(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: false, tension: 80 }).start();
  };

  const goOnline = () => {
    Animated.timing(slideAnim, { toValue: -60, duration: 300, useNativeDriver: false }).start(() =>
      setIsOffline(false)
    );
  };

  if (!isOffline) return null;

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
      <Feather name="wifi-off" size={14} color="#fff" />
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: "#C62828",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  text: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
