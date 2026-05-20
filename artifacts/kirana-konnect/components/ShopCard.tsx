import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Shop } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { isShopCurrentlyOpen } from "@/utils/shopUtils";

interface ShopCardProps {
  shop: Shop;
  onPress: (shop: Shop) => void;
  compact?: boolean;
}

export default function ShopCard({ shop, onPress, compact = false }: ShopCardProps) {
  const colors = useColors();
  const shopOpen = isShopCurrentlyOpen(shop);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          width: compact ? 160 : undefined,
        },
      ]}
      onPress={() => onPress(shop)}
      activeOpacity={0.85}
      accessibilityLabel={`${shop.name} — ${shopOpen ? "Open" : "Closed"}, ${shop.distance}`}
      accessibilityRole="button"
    >
      <View style={[styles.iconBox, { backgroundColor: colors.muted }]}>
        <Feather name="shopping-bag" size={compact ? 20 : 28} color={colors.primary} />
        {!shopOpen && (
          <View style={[styles.closedBadge, { backgroundColor: colors.destructive }]}>
            <Text style={styles.closedText}>Closed</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text
          style={[styles.shopName, { color: colors.foreground, fontSize: compact ? 13 : 15 }]}
          numberOfLines={1}
        >
          {shop.name}
        </Text>
        <View style={styles.meta}>
          <Feather name="star" size={11} color={colors.rating} />
          <Text style={[styles.rating, { color: colors.foreground }]}>{shop.rating}</Text>
          <Text style={[styles.dot, { color: colors.mutedForeground }]}>·</Text>
          <Feather name="map-pin" size={11} color={colors.mutedForeground} />
          <Text style={[styles.distance, { color: colors.mutedForeground }]}>{shop.distance}</Text>
        </View>
        {!compact && (
          <Text style={[styles.address, { color: colors.mutedForeground }]} numberOfLines={1}>
            {shop.address}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 10,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  closedBadge: {
    position: "absolute",
    bottom: -4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  closedText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "700",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  shopName: {
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  rating: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  dot: {
    fontSize: 12,
  },
  distance: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  address: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
