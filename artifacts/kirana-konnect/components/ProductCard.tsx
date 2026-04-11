import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { CartItem, Product } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const CATEGORY_ICONS: Record<string, string> = {
  Dairy: "droplet",
  Grocery: "package",
  Snacks: "star",
  Bakery: "coffee",
  Beverages: "coffee",
  Vegetables: "feather",
  Stationery: "edit",
};

interface ProductCardProps {
  product: Product;
  cartItem?: CartItem;
}

export default function ProductCard({ product, cartItem }: ProductCardProps) {
  const colors = useColors();
  const { addToCart, updateQuantity, removeFromCart } = useApp();

  const handleAdd = () => {
    addToCart(product);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleIncrease = () => {
    updateQuantity(product.id, (cartItem?.quantity || 0) + 1);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDecrease = () => {
    if ((cartItem?.quantity || 0) <= 1) {
      removeFromCart(product.id);
    } else {
      updateQuantity(product.id, (cartItem?.quantity || 0) - 1);
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const iconName = (CATEGORY_ICONS[product.category] || "package") as any;

  return (
    <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={[styles.imgBox, { backgroundColor: colors.muted }]}>
        <Feather name={iconName} size={24} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={[styles.unit, { color: colors.mutedForeground }]}>{product.unit}</Text>
        <Text style={[styles.price, { color: colors.foreground }]}>₹{product.price}</Text>
      </View>
      <View style={styles.actions}>
        {cartItem ? (
          <View style={[styles.qtyControl, { borderColor: colors.primary }]}>
            <TouchableOpacity onPress={handleDecrease} style={styles.qtyBtn}>
              <Feather name="minus" size={14} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.qty, { color: colors.primary }]}>{cartItem.quantity}</Text>
            <TouchableOpacity onPress={handleIncrease} style={styles.qtyBtn}>
              <Feather name="plus" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={handleAdd}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
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
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  imgBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    lineHeight: 18,
  },
  unit: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  actions: {
    alignItems: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 10,
    overflow: "hidden",
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  qty: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    minWidth: 22,
    textAlign: "center",
  },
});
