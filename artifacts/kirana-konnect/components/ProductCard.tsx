import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { CartItem, Product, isWeightBased } from "@/context/AppContext";
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

const CATEGORY_COLORS: Record<string, string> = {
  Dairy: "#4FC3F7",
  Grocery: "#A5D6A7",
  Snacks: "#FFCC80",
  Bakery: "#FFAB91",
  Beverages: "#CE93D8",
  Vegetables: "#81C784",
  Stationery: "#B0BEC5",
};

interface ProductCardProps {
  product: Product;
  cartItem?: CartItem;
}

export default function ProductCard({ product, cartItem }: ProductCardProps) {
  const colors = useColors();
  const { addToCart, updateQuantity, removeFromCart } = useApp();
  const weightProduct = isWeightBased(product);

  const handleAdd = () => {
    if (weightProduct) {
      router.push(`/product/${product.id}`);
      return;
    }
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
  const iconBgColor = CATEGORY_COLORS[product.category] || "#A5D6A7";

  const displayUnit = cartItem?.selectedWeight ? cartItem.selectedWeight : product.unit;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}
      onPress={() => router.push(`/product/${product.id}`)}
      activeOpacity={0.85}
    >
      <View style={[styles.imgBox, { backgroundColor: iconBgColor + "30" }]}>
        <Feather name={iconName} size={24} color={iconBgColor} />
        {weightProduct && (
          <View style={[styles.weightTag, { backgroundColor: iconBgColor }]}>
            <Text style={styles.weightTagText}>kg</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={[styles.unit, { color: colors.mutedForeground }]}>
          {displayUnit}
          {weightProduct && !cartItem && " · Select weight"}
        </Text>
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
            {weightProduct ? (
              <Feather name="sliders" size={14} color="#fff" />
            ) : (
              <Feather name="plus" size={16} color="#fff" />
            )}
            <Text style={styles.addText}>{weightProduct ? "Select" : "Add"}</Text>
          </TouchableOpacity>
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
    position: "relative",
  },
  weightTag: {
    position: "absolute",
    bottom: -2,
    right: -2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 5,
  },
  weightTagText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
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
