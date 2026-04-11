import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

type OrderStatus = Order["status"];

const STATUS_STEPS: { status: OrderStatus; label: string; icon: string; desc: string }[] = [
  { status: "pending", label: "Order Placed", icon: "check", desc: "Your order has been placed" },
  { status: "accepted", label: "Accepted", icon: "thumbs-up", desc: "Shopkeeper accepted your order" },
  { status: "packed", label: "Packed", icon: "package", desc: "Your order has been packed" },
  { status: "out_for_delivery", label: "Out for Delivery", icon: "truck", desc: "Delivery partner is on the way" },
  { status: "delivered", label: "Delivered", icon: "check-circle", desc: "Order delivered successfully!" },
];

const STATUS_ORDER: OrderStatus[] = ["pending", "accepted", "packed", "out_for_delivery", "delivered"];

export default function TrackingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders, updateOrderStatus } = useApp();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const order = useMemo(() => orders.find((o) => o.id === id), [orders, id]);

  useEffect(() => {
    if (!order || order.status === "delivered" || order.status === "rejected") return;
    const currentIdx = STATUS_ORDER.indexOf(order.status);
    if (currentIdx < STATUS_ORDER.length - 1) {
      const t = setTimeout(() => {
        updateOrderStatus(order.id, STATUS_ORDER[currentIdx + 1]);
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [order?.status]);

  if (!order) return null;

  const currentStepIdx = STATUS_ORDER.indexOf(order.status);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/orders")} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Order Tracking</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: bottomPad + 20 }}>
        <View style={[styles.orderHeader, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Feather name="shopping-bag" size={24} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.shopName, { color: colors.foreground }]}>{order.shopName}</Text>
            <Text style={[styles.orderId, { color: colors.mutedForeground }]}>Order #{order.id.toUpperCase()}</Text>
          </View>
          <Text style={[styles.orderTotal, { color: colors.primary }]}>₹{order.total + order.deliveryFee}</Text>
        </View>

        <View style={[styles.timeline, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.timelineTitle, { color: colors.foreground }]}>Order Status</Text>
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            const isLast = idx === STATUS_STEPS.length - 1;
            return (
              <View key={step.status} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View
                    style={[
                      styles.stepIcon,
                      {
                        backgroundColor: isCompleted ? colors.primary : colors.muted,
                        borderColor: isCurrent ? colors.primary : "transparent",
                        borderWidth: isCurrent ? 2 : 0,
                      },
                    ]}
                  >
                    <Feather name={step.icon as any} size={14} color={isCompleted ? "#fff" : colors.mutedForeground} />
                  </View>
                  {!isLast && (
                    <View style={[styles.stepLine, { backgroundColor: idx < currentStepIdx ? colors.primary : colors.border }]} />
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepLabel, { color: isCompleted ? colors.foreground : colors.mutedForeground, fontWeight: isCurrent ? "700" : "500" }]}>
                    {step.label}
                  </Text>
                  {isCurrent && (
                    <Text style={[styles.stepDesc, { color: colors.primary }]}>{step.desc}</Text>
                  )}
                </View>
                {isCurrent && order.status !== "delivered" && (
                  <View style={[styles.activeBadge, { backgroundColor: colors.accent }]}>
                    <Text style={styles.activeBadgeText}>Now</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={[styles.orderItems, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.timelineTitle, { color: colors.foreground }]}>Items Ordered</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={[styles.orderItemQty, { color: colors.mutedForeground }]}>{item.quantity}×</Text>
              <Text style={[styles.orderItemName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.orderItemPrice, { color: colors.foreground }]}>₹{item.price * item.quantity}</Text>
            </View>
          ))}
          <View style={[styles.orderDivider, { backgroundColor: colors.border }]} />
          <View style={styles.orderItem}>
            <Text style={[styles.orderItemQty, { color: colors.mutedForeground }]}></Text>
            <Text style={[styles.orderItemName, { color: colors.mutedForeground }]}>Delivery Fee</Text>
            <Text style={[styles.orderItemPrice, { color: colors.foreground }]}>
              {order.deliveryFee === 0 ? "FREE" : `₹${order.deliveryFee}`}
            </Text>
          </View>
          <View style={[styles.orderItem, styles.totalRow]}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
            <Text style={[styles.totalVal, { color: colors.primary }]}>₹{order.total + order.deliveryFee}</Text>
          </View>
        </View>

        <View style={[styles.deliveryInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.deliveryRow}>
            <Feather name="map-pin" size={16} color={colors.primary} />
            <Text style={[styles.deliveryText, { color: colors.foreground }]}>
              {order.mode === "delivery" ? order.address || "Delivery Address" : "Pickup from Store"}
            </Text>
          </View>
          <View style={styles.deliveryRow}>
            <Feather name="credit-card" size={16} color={colors.primary} />
            <Text style={[styles.deliveryText, { color: colors.foreground }]}>
              {order.paymentMethod === "cod" ? "Cash on Delivery" : "UPI Payment"}
            </Text>
          </View>
        </View>

        {order.status === "delivered" && (
          <TouchableOpacity
            style={[styles.backToHome, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/(tabs)")}
          >
            <Feather name="home" size={16} color="#fff" />
            <Text style={styles.backToHomeText}>Back to Home</Text>
          </TouchableOpacity>
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
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
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
  orderTotal: {
    fontSize: 17,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  timeline: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 0,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    minHeight: 52,
  },
  stepLeft: {
    alignItems: "center",
    width: 36,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 16,
    marginTop: 4,
    borderRadius: 1,
  },
  stepContent: {
    flex: 1,
    paddingTop: 6,
    paddingBottom: 8,
  },
  stepLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  stepDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
  },
  activeBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  orderItems: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  orderItemQty: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    width: 24,
  },
  orderItemName: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  orderItemPrice: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  orderDivider: {
    height: 1,
  },
  totalRow: {
    marginTop: 4,
  },
  totalLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  totalVal: {
    fontSize: 17,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  deliveryInfo: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deliveryText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  backToHome: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  backToHomeText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
