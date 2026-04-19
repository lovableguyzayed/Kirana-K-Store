import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { CartItem, Product, getWeightOptions } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  product: Product | null;
  cartItem?: CartItem;
  visible: boolean;
  onClose: () => void;
}

const PRICE_PRESETS = [10, 20, 30, 50, 100, 200];

function formatWeight(grams: number): string {
  if (grams >= 1000) {
    const kg = grams / 1000;
    return kg % 1 === 0 ? `${kg} kg` : `${kg.toFixed(2)} kg`;
  }
  return `${Math.round(grams)} g`;
}

export default function AddToCartModal({ product, cartItem, visible, onClose }: Props) {
  const colors = useColors();
  const { addToCart, updateQuantity, removeFromCart } = useApp();

  const [tab, setTab] = useState<"weight" | "price">("weight");
  const [selectedWeight, setSelectedWeight] = useState<{ label: string; multiplier: number } | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [qty, setQty] = useState(1);

  const weightOptions = product ? getWeightOptions(product.unit) : [];
  const isEditing = !!cartItem;

  useEffect(() => {
    if (visible && product) {
      setTab("weight");
      setQty(cartItem?.quantity || 1);
      if (cartItem?.selectedWeight) {
        const match = weightOptions.find((w) => w.label === cartItem.selectedWeight);
        setSelectedWeight(match || weightOptions[1] || null);
      } else {
        setSelectedWeight(weightOptions[1] || weightOptions[0] || null);
      }
      setSelectedPrice(PRICE_PRESETS[1]);
    }
  }, [visible, product?.id]);

  if (!product) return null;

  const effectiveWeightPrice = selectedWeight
    ? Math.round(product.price * selectedWeight.multiplier)
    : 0;

  const effectivePriceWeightGrams = selectedPrice
    ? (selectedPrice / product.price) * 1000
    : 0;

  const totalByWeight = effectiveWeightPrice * qty;
  const totalByPrice = (selectedPrice || 0) * qty;

  const handleAddByWeight = () => {
    if (!selectedWeight) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isEditing) {
      addToCart(product, { selectedWeight: selectedWeight.label, priceOverride: effectiveWeightPrice });
      if (qty !== cartItem?.quantity) {
        updateQuantity(product.id, qty);
      }
    } else {
      addToCart(product, { selectedWeight: selectedWeight.label, priceOverride: effectiveWeightPrice });
      if (qty > 1) updateQuantity(product.id, qty);
    }
    onClose();
  };

  const handleAddByPrice = () => {
    if (!selectedPrice) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const weightLabel = formatWeight(effectivePriceWeightGrams);
    if (isEditing) {
      addToCart(product, { selectedWeight: weightLabel, priceOverride: selectedPrice });
      if (qty !== cartItem?.quantity) updateQuantity(product.id, qty);
    } else {
      addToCart(product, { selectedWeight: weightLabel, priceOverride: selectedPrice });
      if (qty > 1) updateQuantity(product.id, qty);
    }
    onClose();
  };

  const unitLabel = product.unit.toLowerCase().includes("litre") ||
    product.unit.toLowerCase().includes("liter") ||
    product.unit.toLowerCase() === "ml"
    ? "volume"
    : "weight";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={styles.handle} />

        {/* Product Info */}
        <View style={styles.productInfo}>
          <View>
            <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={1}>
              {product.name}
            </Text>
            <Text style={[styles.productShop, { color: colors.mutedForeground }]}>
              {product.shopName} · ₹{product.price} per {product.unit}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, { backgroundColor: tab === "weight" ? colors.primary : "transparent" }]}
            onPress={() => setTab("weight")}
          >
            <Feather name="sliders" size={13} color={tab === "weight" ? "#fff" : colors.mutedForeground} />
            <Text style={[styles.tabText, { color: tab === "weight" ? "#fff" : colors.mutedForeground }]}>
              By {unitLabel === "volume" ? "Volume" : "Weight"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, { backgroundColor: tab === "price" ? colors.primary : "transparent" }]}
            onPress={() => setTab("price")}
          >
            <Feather name="tag" size={13} color={tab === "price" ? "#fff" : colors.mutedForeground} />
            <Text style={[styles.tabText, { color: tab === "price" ? "#fff" : colors.mutedForeground }]}>
              By Price
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {tab === "weight" ? (
            <View style={styles.tabContent}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                Select {unitLabel}
              </Text>
              <View style={styles.optionsGrid}>
                {weightOptions.map((opt) => {
                  const isSelected = selectedWeight?.label === opt.label;
                  const optPrice = Math.round(product.price * opt.multiplier);
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      style={[
                        styles.optionChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.muted,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        setSelectedWeight(opt);
                        if (Platform.OS !== "web") Haptics.selectionAsync();
                      }}
                    >
                      <Text style={[styles.optionLabel, { color: isSelected ? "#fff" : colors.foreground }]}>
                        {opt.label}
                      </Text>
                      <Text style={[styles.optionSub, { color: isSelected ? "rgba(255,255,255,0.8)" : colors.mutedForeground }]}>
                        ₹{optPrice}
                      </Text>
                      {isSelected && <Feather name="check" size={12} color="#fff" style={styles.checkIcon} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.qtyRow}>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Quantity</Text>
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                    onPress={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    <Feather name="minus" size={15} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyNum, { color: colors.foreground }]}>{qty}</Text>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                    onPress={() => setQty((q) => q + 1)}
                  >
                    <Feather name="plus" size={15} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.totalRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <View>
                  <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>
                    {selectedWeight?.label} × {qty}
                  </Text>
                  <Text style={[styles.totalPrice, { color: colors.foreground }]}>₹{totalByWeight}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: colors.primary }]}
                  onPress={handleAddByWeight}
                  disabled={!selectedWeight}
                >
                  <Feather name="shopping-cart" size={16} color="#fff" />
                  <Text style={styles.addBtnText}>{isEditing ? "Update Cart" : "Add to Cart"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.tabContent}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                Select amount to spend
              </Text>
              <View style={styles.optionsGrid}>
                {PRICE_PRESETS.map((p) => {
                  const isSelected = selectedPrice === p;
                  const grams = (p / product.price) * 1000;
                  const weightStr = formatWeight(grams);
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.optionChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.muted,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        setSelectedPrice(p);
                        if (Platform.OS !== "web") Haptics.selectionAsync();
                      }}
                    >
                      <Text style={[styles.optionLabel, { color: isSelected ? "#fff" : colors.foreground }]}>
                        ₹{p}
                      </Text>
                      <Text style={[styles.optionSub, { color: isSelected ? "rgba(255,255,255,0.8)" : colors.mutedForeground }]}>
                        ≈ {weightStr}
                      </Text>
                      {isSelected && <Feather name="check" size={12} color="#fff" style={styles.checkIcon} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.qtyRow}>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Quantity</Text>
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                    onPress={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    <Feather name="minus" size={15} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyNum, { color: colors.foreground }]}>{qty}</Text>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                    onPress={() => setQty((q) => q + 1)}
                  >
                    <Feather name="plus" size={15} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.totalRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <View>
                  <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>
                    ≈ {formatWeight(effectivePriceWeightGrams)} × {qty}
                  </Text>
                  <Text style={[styles.totalPrice, { color: colors.foreground }]}>₹{totalByPrice}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: colors.primary }]}
                  onPress={handleAddByPrice}
                  disabled={!selectedPrice}
                >
                  <Feather name="shopping-cart" size={16} color="#fff" />
                  <Text style={styles.addBtnText}>{isEditing ? "Update Cart" : "Add to Cart"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginVertical: 12,
  },
  productInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  productName: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  productShop: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  tabContent: {
    padding: 16,
    gap: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionChip: {
    width: "47%",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    gap: 4,
    position: "relative",
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  optionSub: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  checkIcon: {
    position: "absolute",
    top: 6,
    right: 8,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyNum: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    minWidth: 28,
    textAlign: "center",
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 14,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
