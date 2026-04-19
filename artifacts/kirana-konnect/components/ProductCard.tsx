import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import AddToCartModal from "@/components/AddToCartModal";
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
  const [modalVisible, setModalVisible] = useState(false);

  const haptic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAdd = () => {
    if (weightProduct) {
      setModalVisible(true);
    } else {
      addToCart(product);
      haptic();
    }
  };

  const iconName = (CATEGORY_ICONS[product.category] || "package") as any;
  const iconBgColor = CATEGORY_COLORS[product.category] || "#A5D6A7";

  return (
    <>
      {/* Card — product info is tappable (navigate), action buttons are separate */}
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
        {/* Left: icon + info — navigates to product detail */}
        <TouchableOpacity
          style={styles.cardLeft}
          onPress={() => router.push(`/product/${product.id}`)}
          activeOpacity={0.75}
        >
          <View style={[styles.imgBox, { backgroundColor: iconBgColor + "30" }]}>
            <Feather name={iconName} size={24} color={iconBgColor} />
            {weightProduct && (
              <View style={[styles.weightTag, { backgroundColor: iconBgColor }]}>
                <Text style={styles.weightTagText}>
                  {product.unit === "litre" || product.unit === "liter" || product.unit === "ml" ? "L" : "kg"}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>
              {product.name}
            </Text>
            <Text style={[styles.unitText, { color: colors.mutedForeground }]}>
              {cartItem?.selectedWeight
                ? cartItem.selectedWeight
                : weightProduct
                ? `${product.unit} · tap to select`
                : product.unit}
            </Text>
            <Text style={[styles.price, { color: colors.foreground }]}>₹{product.price}</Text>
          </View>
        </TouchableOpacity>

        {/* Right: action buttons — DO NOT navigate */}
        <View style={styles.actions}>
          {cartItem ? (
            weightProduct ? (
              <View style={styles.weightCartControls}>
                <TouchableOpacity
                  style={[styles.editWeightBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}
                  onPress={() => setModalVisible(true)}
                >
                  <Feather name="edit-2" size={12} color={colors.primary} />
                  <Text style={[styles.editWeightText, { color: colors.primary }]}>Edit</Text>
                </TouchableOpacity>
                <View style={[styles.qtyControl, { borderColor: colors.primary }]}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => {
                      if ((cartItem.quantity || 0) <= 1) removeFromCart(product.id);
                      else updateQuantity(product.id, cartItem.quantity - 1);
                      haptic();
                    }}
                  >
                    <Feather name="minus" size={13} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={[styles.qty, { color: colors.primary }]}>{cartItem.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => { updateQuantity(product.id, cartItem.quantity + 1); haptic(); }}
                  >
                    <Feather name="plus" size={13} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={[styles.qtyControl, { borderColor: colors.primary }]}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => {
                    if ((cartItem.quantity || 0) <= 1) removeFromCart(product.id);
                    else updateQuantity(product.id, cartItem.quantity - 1);
                    haptic();
                  }}
                >
                  <Feather name="minus" size={13} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.qty, { color: colors.primary }]}>{cartItem.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => { updateQuantity(product.id, cartItem.quantity + 1); haptic(); }}
                >
                  <Feather name="plus" size={13} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )
          ) : (
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={handleAdd}
              activeOpacity={0.85}
            >
              {weightProduct ? (
                <>
                  <Feather name="sliders" size={13} color="#fff" />
                  <Text style={styles.addText}>Select</Text>
                </>
              ) : (
                <>
                  <Feather name="plus" size={15} color="#fff" />
                  <Text style={styles.addText}>Add</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <AddToCartModal
        product={product}
        cartItem={cartItem}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  cardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  unitText: {
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
    justifyContent: "center",
    marginLeft: 8,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
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
    paddingVertical: 8,
  },
  qty: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    minWidth: 22,
    textAlign: "center",
  },
  weightCartControls: {
    alignItems: "center",
    gap: 5,
  },
  editWeightBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  editWeightText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
