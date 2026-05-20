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

import AddToCartModal from "@/components/AddToCartModal";
import { isWeightBased, useApp } from "@/context/AppContext";
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
  { name: "Priya S.", rating: 5, comment: "Fresh and good quality! Always delivered quickly." },
  { name: "Rahul M.", rating: 4, comment: "Great product at a fair price. Will order again." },
  { name: "Anjali K.", rating: 5, comment: "Best quality in the area. Highly recommend." },
];

export default function ProductDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cart, addToCart, updateQuantity, removeFromCart, shopProducts } = useApp();

  const product = useMemo(() => {
    if (!id) return undefined;
    for (const products of Object.values(shopProducts)) {
      const found = products.find((p) => p.id === id);
      if (found) return found;
    }
    return undefined;
  }, [id, shopProducts]);

  const cartItem = useMemo(() => cart.find((i) => i.id === id), [cart, id]);
  const weightBased = product ? isWeightBased(product) : false;

  const [unitQty, setUnitQty] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.fixedHeader, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Product Details</Text>
          <View style={{ width: 36 }} />
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

  const stockStatus =
    product.stock === 0 ? "Out of Stock"
    : product.stock <= 5 ? "Low Stock"
    : product.stock <= 15 ? "Medium Stock"
    : "In Stock";

  const stockColor =
    product.stock === 0 ? "#ef4444"
    : product.stock <= 5 ? "#f97316"
    : product.stock <= 15 ? "#eab308"
    : "#10b981";

  const displayQty = isInCart ? (cartItem?.quantity || 0) : unitQty;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fixed header */}
      <View style={[styles.fixedHeader, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Product Details</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Kirana Konnect</Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push("/cart")}>
          <Feather name="shopping-cart" size={20} color={colors.mutedForeground} />
          {cart.length > 0 && <View style={styles.cartDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ marginTop: topPad + 60 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 120 : 140) }}
      >
        {/* Product image card */}
        <View style={[styles.imageCard, { backgroundColor: colors.card }]}>
          <View style={[styles.imageCircle, { backgroundColor: catColor + "25" }]}>
            <Feather name={catIcon} size={64} color={catColor} />
          </View>
        </View>

        {/* Info card */}
        <View style={[styles.card, { marginTop: 8, backgroundColor: colors.card }]}>
          <Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>
          {product.description ? (
            <Text style={[styles.productDesc, { color: colors.mutedForeground }]}>{product.description}</Text>
          ) : null}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: colors.primary + "18" }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{product.category}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.success + "18" }]}>
              <Text style={[styles.badgeText, { color: colors.success }]}>
                {weightBased ? "Weight-Based" : "Unit-Based"}
              </Text>
            </View>
          </View>

          {/* Price row */}
          <View style={styles.priceGrid}>
            <View style={[styles.priceCell, { backgroundColor: colors.muted }]}>
              <Text style={[styles.priceCellLabel, { color: colors.mutedForeground }]}>Selling Price</Text>
              <Text style={[styles.priceCellValue, { color: colors.foreground }]}>₹{product.price}/{product.unit}</Text>
            </View>
            <View style={[styles.priceCell, { backgroundColor: colors.success + "12" }]}>
              <Text style={[styles.priceCellLabel, { color: colors.success }]}>Shop</Text>
              <Text style={[styles.priceCellValue, { color: colors.success }]} numberOfLines={1}>{product.shopName}</Text>
            </View>
          </View>
        </View>

        {/* Stock card */}
        <View style={[styles.card, { backgroundColor: stockColor + "10", marginTop: 8 }]}>
          <View style={styles.stockHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Stock Information</Text>
            <View style={[styles.stockBadge, { backgroundColor: stockColor }]}>
              <Text style={styles.stockBadgeText}>{stockStatus}</Text>
            </View>
          </View>
          <View style={styles.stockGrid}>
            <View style={styles.stockCell}>
              <Text style={[styles.stockCellLabel, { color: colors.mutedForeground }]}>Available</Text>
              <Text style={[styles.stockCellValue, { color: stockColor }]}>
                {product.stock} {product.unit}s
              </Text>
            </View>
            <View style={styles.stockCell}>
              <Text style={[styles.stockCellLabel, { color: colors.mutedForeground }]}>Unit</Text>
              <Text style={[styles.stockCellValue, { color: colors.foreground }]}>{product.unit}</Text>
            </View>
            <View style={styles.stockCell}>
              <Text style={[styles.stockCellLabel, { color: colors.mutedForeground }]}>Type</Text>
              <Text style={[styles.stockCellValue, { color: colors.foreground }]}>{weightBased ? "By Weight" : "By Unit"}</Text>
            </View>
          </View>
        </View>

        {/* Quantity / Cart section */}
        {!weightBased && (
          <View style={[styles.card, { marginTop: 8, backgroundColor: colors.card }]}>
            <View style={styles.qtyRow}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quantity</Text>
                <Text style={[styles.qtyHint, { color: colors.mutedForeground }]}>₹{product.price} per {product.unit}</Text>
              </View>
              <View style={styles.qtyControls}>
                <TouchableOpacity
                  style={[styles.qtyBtn, { borderColor: colors.border, backgroundColor: colors.muted }]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (isInCart) {
                      if ((cartItem?.quantity || 0) <= 1) removeFromCart(product.id);
                      else updateQuantity(product.id, (cartItem?.quantity || 0) - 1);
                    } else {
                      setUnitQty((q) => Math.max(1, q - 1));
                    }
                  }}
                >
                  <Feather name="minus" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
                <Text style={[styles.qtyNum, { color: colors.foreground }]}>{displayQty}</Text>
                <TouchableOpacity
                  style={[styles.qtyBtn, { borderColor: colors.border, backgroundColor: colors.muted }]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (isInCart) {
                      updateQuantity(product.id, (cartItem?.quantity || 0) + 1);
                    } else {
                      setUnitQty((q) => q + 1);
                    }
                  }}
                >
                  <Feather name="plus" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Reviews */}
        <View style={[styles.card, { marginTop: 8, backgroundColor: colors.card }]}>
          <View style={styles.reviewsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Customer Reviews</Text>
            <View style={styles.ratingRow}>
              <Feather name="star" size={13} color="#f59e0b" />
              <Text style={[styles.ratingText, { color: colors.foreground }]}>4.5</Text>
            </View>
          </View>
          {MOCK_REVIEWS.map((r, i) => (
            <View key={i} style={[styles.reviewCard, { backgroundColor: colors.muted }, i > 0 && { marginTop: 10 }]}>
              <View style={styles.reviewTop}>
                <View style={[styles.reviewAvatar, { backgroundColor: colors.primary + "18" }]}>
                  <Text style={[styles.reviewInitial, { color: colors.primary }]}>{r.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reviewName, { color: colors.foreground }]}>{r.name}</Text>
                  <View style={styles.starsRow}>
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Feather key={si} name="star" size={11} color={si < r.rating ? "#f59e0b" : colors.border} />
                    ))}
                  </View>
                </View>
              </View>
              <Text style={[styles.reviewText, { color: colors.mutedForeground }]}>{r.comment}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Fixed bottom bar */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 20 : 12),
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        ]}
      >
        {weightBased ? (
          isInCart ? (
            <>
              <View>
                <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>In Cart</Text>
                <Text style={[styles.cartItemInfo, { color: colors.foreground }]}>
                  {cartItem?.selectedWeight || `${cartItem?.quantity} ${product.unit}`} · ₹{cartItem?.price ?? product.price}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.addCartBtn, { backgroundColor: colors.primary }]}
                onPress={() => setModalVisible(true)}
              >
                <Feather name="edit-2" size={16} color="#fff" />
                <Text style={styles.addCartText}>Edit Selection</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View>
                <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Price</Text>
                <Text style={[styles.totalPrice, { color: colors.foreground }]}>₹{product.price}/{product.unit}</Text>
              </View>
              <TouchableOpacity
                style={[styles.addCartBtn, { backgroundColor: product.stock > 0 ? colors.primary : colors.mutedForeground }]}
                onPress={() => product.stock > 0 && setModalVisible(true)}
                disabled={product.stock === 0}
              >
                <Feather name="shopping-cart" size={16} color="#fff" />
                <Text style={styles.addCartText}>
                  {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                </Text>
              </TouchableOpacity>
            </>
          )
        ) : (
          <>
            <View>
              <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total Price</Text>
              <Text style={[styles.totalPrice, { color: colors.foreground }]}>₹{product.price * displayQty}</Text>
            </View>
            {isInCart ? (
              <View style={[styles.inCartControls, { borderColor: colors.primary }]}>
                <TouchableOpacity
                  style={styles.inCartBtn}
                  onPress={() => {
                    if ((cartItem?.quantity || 0) <= 1) removeFromCart(product.id);
                    else updateQuantity(product.id, (cartItem?.quantity || 0) - 1);
                  }}
                >
                  <Feather name="minus" size={18} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.inCartQty, { color: colors.primary }]}>{cartItem?.quantity}</Text>
                <TouchableOpacity
                  style={styles.inCartBtn}
                  onPress={() => updateQuantity(product.id, (cartItem?.quantity || 0) + 1)}
                >
                  <Feather name="plus" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.addCartBtn, { backgroundColor: product.stock > 0 ? colors.primary : colors.mutedForeground }]}
                onPress={() => {
                  if (product.stock === 0) return;
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  for (let i = 0; i < unitQty; i++) addToCart(product);
                }}
                disabled={product.stock === 0}
              >
                <Feather name="shopping-cart" size={16} color="#fff" />
                <Text style={styles.addCartText}>
                  {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      <AddToCartModal
        product={product}
        cartItem={cartItem}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fixedHeader: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  cartDot: {
    position: "absolute",
    top: 6, right: 6,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: "#ef4444",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  headerSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  imageCard: {
    paddingVertical: 28,
    alignItems: "center",
  },
  imageCircle: {
    width: 140, height: 140, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  card: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  productName: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  productDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  badgeRow: { flexDirection: "row", gap: 8 },
  badge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  badgeText: {
    fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold",
  },
  priceGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  priceCell: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  priceCellLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  priceCellValue: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  stockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stockBadge: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
  },
  stockBadgeText: {
    color: "#fff", fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold",
  },
  stockGrid: {
    flexDirection: "row",
    marginTop: 4,
  },
  stockCell: {
    flex: 1, alignItems: "center",
  },
  stockCellLabel: {
    fontSize: 11, fontFamily: "Inter_400Regular",
  },
  stockCellValue: {
    fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", marginTop: 2,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  qtyHint: {
    fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2,
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  qtyBtn: {
    width: 42, height: 42, borderRadius: 12,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },
  qtyNum: {
    fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold",
    minWidth: 28, textAlign: "center",
  },
  reviewsHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: {
    fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold",
  },
  reviewCard: {
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  reviewTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewAvatar: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
  },
  reviewInitial: {
    fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold",
  },
  reviewName: {
    fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold",
  },
  starsRow: { flexDirection: "row", gap: 2, marginTop: 2 },
  reviewText: {
    fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 11, fontFamily: "Inter_400Regular",
  },
  totalPrice: {
    fontSize: 20, fontWeight: "800", fontFamily: "Inter_700Bold",
  },
  cartItemInfo: {
    fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold",
  },
  addCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 12,
  },
  addCartText: {
    color: "#fff", fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold",
  },
  inCartControls: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 14,
    overflow: "hidden",
  },
  inCartBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  inCartQty: {
    fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold",
    minWidth: 30, textAlign: "center",
  },
  notFound: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 12,
  },
  notFoundText: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
