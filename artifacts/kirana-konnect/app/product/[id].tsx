import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getProductById,
  getWeightOptions,
  isWeightBased,
  useApp,
} from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const CATEGORY_COLORS: Record<string, string> = {
  Dairy: "#4FC3F7",
  Grocery: "#A5D6A7",
  Snacks: "#FFCC80",
  Bakery: "#FFAB91",
  Beverages: "#CE93D8",
  Vegetables: "#81C784",
  Stationery: "#B0BEC5",
};

const CATEGORY_ICONS: Record<string, string> = {
  Dairy: "droplet",
  Grocery: "package",
  Snacks: "star",
  Bakery: "coffee",
  Beverages: "coffee",
  Vegetables: "feather",
  Stationery: "edit",
};

const MOCK_REVIEWS = [
  { name: "Priya S.", rating: 5, comment: "Fresh and good quality! Always available and delivered quickly." },
  { name: "Rahul M.", rating: 4, comment: "Great product at a fair price. Will order again." },
  { name: "Anjali K.", rating: 5, comment: "Best quality in the area. Highly recommend." },
];

export default function ProductDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cart, addToCart, updateQuantity, removeFromCart } = useApp();

  const product = useMemo(() => getProductById(id || ""), [id]);
  const cartItem = useMemo(() => cart.find((i) => i.id === id), [cart, id]);
  const weightBased = product ? isWeightBased(product) : false;
  const weightOptions = product ? getWeightOptions(product.unit) : [];

  const [selectedWeight, setSelectedWeight] = useState(
    weightOptions.length > 0 ? weightOptions[1] : null
  );
  const [unitQty, setUnitQty] = useState(1);

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Feather name="package" size={48} color={colors.mutedForeground} />
          <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Product not found</Text>
        </View>
      </View>
    );
  }

  const catColor = CATEGORY_COLORS[product.category] || "#A5D6A7";
  const catIcon = (CATEGORY_ICONS[product.category] || "package") as any;
  const isInCart = !!cartItem;

  const effectivePrice = weightBased && selectedWeight
    ? Math.round(product.price * selectedWeight.multiplier)
    : product.price;

  const totalPrice = weightBased
    ? effectivePrice * (cartItem?.quantity || unitQty)
    : effectivePrice * (cartItem?.quantity || unitQty);

  const handleAddToCart = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (weightBased && selectedWeight) {
      addToCart(product, {
        selectedWeight: selectedWeight.label,
        priceOverride: effectivePrice,
      });
    } else {
      for (let i = 0; i < unitQty; i++) {
        addToCart(product);
      }
    }
  };

  const handleIncrease = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isInCart) {
      updateQuantity(product.id, (cartItem?.quantity || 0) + 1);
    } else {
      setUnitQty((q) => q + 1);
    }
  };

  const handleDecrease = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isInCart) {
      if ((cartItem?.quantity || 0) <= 1) removeFromCart(product.id);
      else updateQuantity(product.id, (cartItem?.quantity || 0) - 1);
    } else {
      setUnitQty((q) => Math.max(1, q - 1));
    }
  };

  const displayQty = isInCart ? (cartItem?.quantity || 0) : unitQty;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: catColor, paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push("/cart")}>
            <Feather name="shopping-cart" size={20} color="#fff" />
            {cart.length > 0 && (
              <View style={styles.cartDot} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.heroIcon}>
          <Feather name={catIcon} size={48} color="#fff" />
        </View>

        <View style={[styles.categoryBadge, { backgroundColor: "rgba(0,0,0,0.2)" }]}>
          <Text style={styles.categoryBadgeText}>{product.category}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 120) }}
      >
        {/* Product Info */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>
            {product.stock > 0 ? (
              <View style={[styles.stockBadge, { backgroundColor: colors.success + "20" }]}>
                <Text style={[styles.stockText, { color: colors.success }]}>In Stock</Text>
              </View>
            ) : (
              <View style={[styles.stockBadge, { backgroundColor: colors.destructive + "20" }]}>
                <Text style={[styles.stockText, { color: colors.destructive }]}>Out of Stock</Text>
              </View>
            )}
          </View>

          <Text style={[styles.shopName, { color: colors.mutedForeground }]}>
            📍 {product.shopName}
          </Text>

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.foreground }]}>
              ₹{effectivePrice}
            </Text>
            <Text style={[styles.priceUnit, { color: colors.mutedForeground }]}>
              {weightBased && selectedWeight ? `per ${selectedWeight.label}` : `per ${product.unit}`}
            </Text>
            {weightBased && (
              <View style={[styles.weightBasedBadge, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="sliders" size={11} color={colors.primary} />
                <Text style={[styles.weightBasedText, { color: colors.primary }]}>Weight Based</Text>
              </View>
            )}
          </View>

          <View style={[styles.stockInfo, { backgroundColor: colors.muted }]}>
            <Feather name="package" size={14} color={colors.mutedForeground} />
            <Text style={[styles.stockCount, { color: colors.mutedForeground }]}>
              {product.stock} units available in stock
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Description */}
        {product.description && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About this product</Text>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>{product.description}</Text>
          </View>
        )}

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Quantity / Weight Selector */}
        <View style={styles.section}>
          {weightBased ? (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Select Weight</Text>
              <View style={styles.weightGrid}>
                {weightOptions.map((opt) => {
                  const isSelected = selectedWeight?.label === opt.label;
                  const optPrice = Math.round(product.price * opt.multiplier);
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      style={[
                        styles.weightChip,
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
                      <Text style={[styles.weightLabel, { color: isSelected ? "#fff" : colors.foreground }]}>
                        {opt.label}
                      </Text>
                      <Text style={[styles.weightPrice, { color: isSelected ? "rgba(255,255,255,0.85)" : colors.mutedForeground }]}>
                        ₹{optPrice}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Quantity for weight items */}
              <View style={styles.qtyRow}>
                <Text style={[styles.qtyLabel, { color: colors.foreground }]}>Quantity</Text>
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                    onPress={handleDecrease}
                  >
                    <Feather name="minus" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyNum, { color: colors.foreground }]}>{displayQty}</Text>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                    onPress={handleIncrease}
                  >
                    <Feather name="plus" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Select Quantity</Text>
              <View style={styles.qtyRow}>
                <Text style={[styles.qtySubtitle, { color: colors.mutedForeground }]}>
                  Per {product.unit} · ₹{product.price} each
                </Text>
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                    onPress={handleDecrease}
                  >
                    <Feather name="minus" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyNum, { color: colors.foreground }]}>{displayQty}</Text>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                    onPress={handleIncrease}
                  >
                    <Feather name="plus" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Reviews */}
        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Customer Reviews</Text>
            <View style={styles.ratingBadge}>
              <Feather name="star" size={13} color="#FFA000" />
              <Text style={[styles.ratingText, { color: colors.foreground }]}>4.5</Text>
            </View>
          </View>
          {MOCK_REVIEWS.map((r, i) => (
            <View key={i} style={[styles.reviewCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <View style={styles.reviewTop}>
                <View style={[styles.reviewAvatar, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.reviewAvatarText, { color: colors.primary }]}>
                    {r.name[0]}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reviewName, { color: colors.foreground }]}>{r.name}</Text>
                  <View style={styles.starsRow}>
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Feather
                        key={si}
                        name="star"
                        size={11}
                        color={si < r.rating ? "#FFA000" : colors.border}
                      />
                    ))}
                  </View>
                </View>
              </View>
              <Text style={[styles.reviewComment, { color: colors.mutedForeground }]}>{r.comment}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 20 : 12),
          },
        ]}
      >
        <View>
          <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total Price</Text>
          <Text style={[styles.totalPrice, { color: colors.foreground }]}>₹{totalPrice}</Text>
        </View>
        {isInCart ? (
          <View style={[styles.inCartControls, { borderColor: colors.primary }]}>
            <TouchableOpacity onPress={handleDecrease} style={styles.inCartBtn}>
              <Feather name="minus" size={18} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.inCartQty, { color: colors.primary }]}>{cartItem?.quantity}</Text>
            <TouchableOpacity onPress={handleIncrease} style={styles.inCartBtn}>
              <Feather name="plus" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addToCartBtn, { backgroundColor: product.stock > 0 ? colors.primary : colors.mutedForeground }]}
            onPress={handleAddToCart}
            disabled={product.stock === 0}
            activeOpacity={0.85}
          >
            <Feather name="shopping-cart" size={18} color="#fff" />
            <Text style={styles.addToCartText}>
              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  cartBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  cartDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF5252",
  },
  heroIcon: {
    alignSelf: "center",
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  categoryBadge: {
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  infoSection: {
    padding: 16,
    gap: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  productName: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    lineHeight: 26,
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 2,
  },
  stockText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  shopName: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  price: {
    fontSize: 26,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  priceUnit: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  weightBasedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  weightBasedText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  stockInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  stockCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    height: 8,
  },
  section: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  description: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  weightGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  weightChip: {
    width: "47%",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    gap: 4,
  },
  weightLabel: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  weightPrice: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  qtyLabel: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  qtySubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
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
  reviewsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  reviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  reviewTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAvatarText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  reviewName: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  addToCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  addToCartText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  inCartControls: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 16,
    overflow: "hidden",
  },
  inCartBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inCartQty: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    minWidth: 32,
    textAlign: "center",
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
});
