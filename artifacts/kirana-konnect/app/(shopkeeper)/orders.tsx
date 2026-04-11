import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Order, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function ShopkeeperOrders() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, updateOrderStatus } = useApp();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 84 : 0);

  const newOrders = useMemo(() => orders.filter((o) => o.status === "pending"), [orders]);
  const activeOrders = useMemo(() => orders.filter((o) => ["accepted", "packed", "out_for_delivery"].includes(o.status)), [orders]);

  const handleAccept = (order: Order) => {
    updateOrderStatus(order.id, "accepted");
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  const handleReject = (order: Order) => {
    updateOrderStatus(order.id, "rejected");
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };
  const handlePack = (order: Order) => {
    updateOrderStatus(order.id, "packed");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  const handleReady = (order: Order) => {
    updateOrderStatus(order.id, order.mode === "delivery" ? "out_for_delivery" : "delivered");
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Manage Orders</Text>
        {newOrders.length > 0 && (
          <View style={[styles.newBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.newBadgeText}>{newOrders.length} New</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: bottomPad + 16 }}>
        {newOrders.length > 0 && (
          <View>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>New Orders</Text>
            {newOrders.map((order) => (
              <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.accent + "40" }]}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={[styles.orderId, { color: colors.foreground }]}>Order #{order.id.toUpperCase()}</Text>
                    <Text style={[styles.orderTime, { color: colors.mutedForeground }]}>
                      {new Date(order.placedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                  <Text style={[styles.orderTotal, { color: colors.primary }]}>₹{order.total + order.deliveryFee}</Text>
                </View>
                <View style={styles.itemsList}>
                  {order.items.map((item) => (
                    <Text key={item.id} style={[styles.itemText, { color: colors.mutedForeground }]}>
                      {item.quantity}× {item.name}
                    </Text>
                  ))}
                </View>
                <View style={[styles.modeRow, { backgroundColor: colors.muted, borderRadius: 8 }]}>
                  <Feather name={order.mode === "delivery" ? "truck" : "shopping-bag"} size={14} color={colors.mutedForeground} />
                  <Text style={[styles.modeText, { color: colors.mutedForeground }]}>
                    {order.mode === "delivery" ? `Delivery · ₹${order.deliveryFee}` : "Pickup"} · {order.paymentMethod.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.actionBtns}>
                  <TouchableOpacity
                    style={[styles.rejectBtn, { borderColor: colors.destructive }]}
                    onPress={() => handleReject(order)}
                  >
                    <Feather name="x" size={16} color={colors.destructive} />
                    <Text style={[styles.rejectText, { color: colors.destructive }]}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleAccept(order)}
                  >
                    <Feather name="check" size={16} color="#fff" />
                    <Text style={styles.acceptText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeOrders.length > 0 && (
          <View>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Active Orders</Text>
            {activeOrders.map((order) => (
              <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={[styles.orderId, { color: colors.foreground }]}>#{order.id.toUpperCase()}</Text>
                    <Text style={[styles.orderTime, { color: colors.mutedForeground }]}>
                      {order.items.length} items · {order.mode}
                    </Text>
                  </View>
                  <Text style={[styles.orderTotal, { color: colors.primary }]}>₹{order.total + order.deliveryFee}</Text>
                </View>
                <View style={styles.statusRow}>
                  {order.status === "accepted" && (
                    <TouchableOpacity
                      style={[styles.statusBtn, { backgroundColor: "#7B1FA2" }]}
                      onPress={() => handlePack(order)}
                    >
                      <Feather name="package" size={14} color="#fff" />
                      <Text style={styles.statusBtnText}>Mark as Packed</Text>
                    </TouchableOpacity>
                  )}
                  {order.status === "packed" && (
                    <TouchableOpacity
                      style={[styles.statusBtn, { backgroundColor: colors.success }]}
                      onPress={() => handleReady(order)}
                    >
                      <Feather name={order.mode === "delivery" ? "truck" : "check-circle"} size={14} color="#fff" />
                      <Text style={styles.statusBtnText}>
                        {order.mode === "delivery" ? "Out for Delivery" : "Mark Ready"}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {order.status === "out_for_delivery" && (
                    <View style={[styles.statusBadge, { backgroundColor: "#0097A720" }]}>
                      <Feather name="truck" size={14} color="#0097A7" />
                      <Text style={[styles.statusBadgeText, { color: "#0097A7" }]}>Out for Delivery</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {newOrders.length === 0 && activeOrders.length === 0 && (
          <View style={styles.empty}>
            <Feather name="inbox" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No pending orders</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>New orders will appear here</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  newBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 10,
  },
  orderCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderId: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  orderTime: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  orderTotal: {
    fontSize: 17,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  itemsList: { gap: 3 },
  itemText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
  },
  modeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  actionBtns: {
    flexDirection: "row",
    gap: 10,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  rejectText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  acceptBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  acceptText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  statusRow: { flexDirection: "row" },
  statusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  statusBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
