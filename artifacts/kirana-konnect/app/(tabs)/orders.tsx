import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import EmptyState from "@/components/ui/EmptyState";
import { Order, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const STATUS_COLORS: Record<Order["status"], string> = {
  pending: "#FF9800",
  accepted: "#1976D2",
  packed: "#7B1FA2",
  out_for_delivery: "#0097A7",
  delivered: "#43A047",
  rejected: "#ef4444",
};

const STATUS_LABELS: Record<Order["status"], string> = {
  pending: "Pending",
  accepted: "Accepted",
  packed: "Packed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  rejected: "Rejected",
};

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, cart, addToCart, clearCart, setSelectedShop, shops } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); };

  const handleReorder = (order: Order) => {
    const shop = shops.find((s) => s.id === order.shopId);

    const doReorder = () => {
      clearCart();
      if (shop) setSelectedShop(shop);
      order.items.forEach((item) => addToCart(item, { priceOverride: item.price }));
      router.push("/cart");
    };

    if (cart.length > 0) {
      Alert.alert(
        "Replace cart?",
        `This will clear your current cart and add items from ${order.shopName}.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Replace Cart", style: "destructive", onPress: doReorder },
        ]
      );
    } else {
      doReorder();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>My Orders</Text>
      </View>

      {orders.length === 0 ? (
        <EmptyState
          icon="package"
          title="No orders yet"
          subtitle="Your order history will appear here once you place your first order"
          ctaLabel="Browse Shops"
          onCta={() => router.push("/(tabs)")}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        >
          {orders.map((order) => (
            <View key={order.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.shopName, { color: colors.foreground }]}>{order.shopName}</Text>
                  <Text style={[styles.orderId, { color: colors.mutedForeground }]}>#{order.id.toUpperCase()}</Text>
                </View>
                <View
                  style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status] + "20" }]}
                  accessibilityLabel={`Order status: ${STATUS_LABELS[order.status]}`}
                >
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[order.status] }]} />
                  <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] }]}>
                    {STATUS_LABELS[order.status]}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.items}>
                {order.items.slice(0, 3).map((item) => (
                  <Text key={item.id} style={[styles.itemText, { color: colors.mutedForeground }]}>
                    {item.quantity}× {item.name}
                  </Text>
                ))}
                {order.items.length > 3 && (
                  <Text style={[styles.itemText, { color: colors.mutedForeground }]}>
                    +{order.items.length - 3} more items
                  </Text>
                )}
              </View>

              <View style={styles.cardFooter}>
                <View>
                  <Text style={[styles.total, { color: colors.foreground }]}>
                    ₹{order.total + order.deliveryFee}
                  </Text>
                  <Text style={[styles.mode, { color: colors.mutedForeground }]}>
                    {order.mode === "delivery" ? "Home Delivery" : "Pickup"} · {order.paymentMethod.toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.reorderBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}
                  onPress={() => handleReorder(order)}
                  accessibilityLabel={`Reorder from ${order.shopName}`}
                  accessibilityRole="button"
                >
                  <Feather name="refresh-cw" size={13} color={colors.primary} />
                  <Text style={[styles.reorderText, { color: colors.primary }]}>Reorder</Text>
                </TouchableOpacity>
              </View>

              {(order.status === "pending" || order.status === "accepted" || order.status === "packed" || order.status === "out_for_delivery") && (
                <TouchableOpacity
                  style={[styles.trackBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push({ pathname: "/tracking/[id]", params: { id: order.id } })}
                  accessibilityLabel="Track order"
                  accessibilityRole="button"
                >
                  <Feather name="map-pin" size={14} color="#fff" />
                  <Text style={styles.trackText}>Track Order</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  empty: {
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
  shopBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  shopBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  shopName: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  orderId: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  divider: { height: 1 },
  items: { gap: 3 },
  itemText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  total: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  mode: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  reorderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  reorderText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  trackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  trackText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
