import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount, deliveryMode, setDeliveryMode } = useApp();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);
  const deliveryFee = deliveryMode === "delivery" ? (cartTotal < 200 ? 30 : 0) : 0;
  const grandTotal = cartTotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>My Cart</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="shopping-cart" size={60} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your cart is empty</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Add products from a nearby kirana store
          </Text>
          <TouchableOpacity
            style={[styles.browseBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)")}
          >
            <Text style={styles.browseBtnText}>Browse Shops</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>My Cart</Text>
        <View style={[styles.cartBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.cartBadgeText}>{cartCount}</Text>
        </View>
      </View>

      <View style={[styles.modeToggle, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.modeBtn, { backgroundColor: deliveryMode === "pickup" ? colors.primary : "transparent" }]}
          onPress={() => { setDeliveryMode("pickup"); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
        >
          <Feather name="shopping-bag" size={15} color={deliveryMode === "pickup" ? "#fff" : colors.mutedForeground} />
          <Text style={[styles.modeBtnText, { color: deliveryMode === "pickup" ? "#fff" : colors.mutedForeground }]}>
            Pickup
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, { backgroundColor: deliveryMode === "delivery" ? colors.primary : "transparent" }]}
          onPress={() => { setDeliveryMode("delivery"); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
        >
          <Feather name="truck" size={15} color={deliveryMode === "delivery" ? "#fff" : colors.mutedForeground} />
          <Text style={[styles.modeBtnText, { color: deliveryMode === "delivery" ? "#fff" : colors.mutedForeground }]}>
            Delivery
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 200 }}>
        {cart.map((item) => (
          <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.itemIcon, { backgroundColor: colors.muted }]}>
              <Feather name="package" size={20} color={colors.primary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>{item.name}</Text>
              <Text style={[styles.itemUnit, { color: colors.mutedForeground }]}>{item.unit}</Text>
              <Text style={[styles.itemPrice, { color: colors.foreground }]}>₹{item.price}</Text>
            </View>
            <View style={styles.itemActions}>
              <View style={[styles.qtyControl, { borderColor: colors.primary }]}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => { updateQuantity(item.id, item.quantity - 1); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Feather name="minus" size={14} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.qty, { color: colors.primary }]}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => { updateQuantity(item.id, item.quantity + 1); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Feather name="plus" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.itemTotal, { color: colors.foreground }]}>₹{item.price * item.quantity}</Text>
              <TouchableOpacity
                onPress={() => { removeFromCart(item.id); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
              >
                <Feather name="trash-2" size={16} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Price Breakdown</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Subtotal ({cartCount} items)</Text>
            <Text style={[styles.summaryVal, { color: colors.foreground }]}>₹{cartTotal}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Delivery Fee</Text>
            <Text style={[styles.summaryVal, { color: deliveryFee === 0 ? colors.success : colors.foreground }]}>
              {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
            </Text>
          </View>
          {deliveryMode === "delivery" && cartTotal < 200 && (
            <Text style={[styles.freeDeliveryHint, { color: colors.primary }]}>
              Add ₹{200 - cartTotal} more for free delivery
            </Text>
          )}
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
            <Text style={[styles.totalVal, { color: colors.primary }]}>₹{grandTotal}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.checkoutBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 12 }]}>
        <View>
          <Text style={[styles.totalLabel2, { color: colors.mutedForeground }]}>Total Amount</Text>
          <Text style={[styles.totalVal2, { color: colors.foreground }]}>₹{grandTotal}</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/checkout")}
          activeOpacity={0.85}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  cartBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  modeToggle: {
    flexDirection: "row",
    margin: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  browseBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  browseBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  itemCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    lineHeight: 17,
  },
  itemUnit: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  itemActions: {
    alignItems: "flex-end",
    gap: 6,
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 8,
    overflow: "hidden",
  },
  qtyBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  qty: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    minWidth: 18,
    textAlign: "center",
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  summary: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  freeDeliveryHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  totalVal: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  checkoutBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  totalLabel2: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  totalVal2: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
  checkoutBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
