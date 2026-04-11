import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function CartBar() {
  const colors = useColors();
  const { cartCount, cartTotal } = useApp();

  if (cartCount === 0) return null;

  const handlePress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/cart");
  };

  return (
    <TouchableOpacity
      style={[styles.bar, { backgroundColor: colors.primary }]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={[styles.badge, { backgroundColor: colors.accent }]}>
        <Text style={styles.badgeText}>{cartCount}</Text>
      </View>
      <Text style={styles.label}>{cartCount} item{cartCount > 1 ? "s" : ""} added</Text>
      <View style={styles.right}>
        <Text style={styles.total}>₹{cartTotal}</Text>
        <Feather name="chevron-right" size={18} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  total: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
