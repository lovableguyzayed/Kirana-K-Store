import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useMemo, useState } from "react";
import {
  Animated,
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

const RIDER = {
  name: "Ravi Kumar",
  phone: "+91 98765 43210",
  vehicle: "Blue Honda Activa · MH12 AB1234",
  rating: "4.9",
};

// Shop pin grid position (percentage)
const SHOP_POS = { x: 20, y: 65 };
// Customer pin grid position (percentage)
const CUST_POS = { x: 75, y: 30 };

function RiderLiveMap({ isDelivered }: { isDelivered: boolean }) {
  const colors = useColors();
  const riderProgress = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate rider from shop to customer over 30 seconds
    Animated.timing(riderProgress, {
      toValue: isDelivered ? 1 : 0.85,
      duration: isDelivered ? 0 : 30000,
      useNativeDriver: false,
    }).start();

    // Pulse animation for rider dot (useNativeDriver: false for web compat)
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 700, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: false }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isDelivered]);

  const riderLeft = riderProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [`${SHOP_POS.x}%`, `${CUST_POS.x}%`],
  });
  const riderTop = riderProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [`${SHOP_POS.y}%`, `${CUST_POS.y}%`],
  });

  return (
    <View style={[styles.liveMap, { backgroundColor: "#E8F5E9" }]}>
      {/* Grid */}
      <View style={StyleSheet.absoluteFill}>
        {Array.from({ length: 5 }).map((_, row) =>
          Array.from({ length: 7 }).map((_, col) => (
            <View
              key={`${row}-${col}`}
              style={[
                styles.gridCell,
                {
                  left: `${(col / 7) * 100}%` as any,
                  top: `${(row / 5) * 100}%` as any,
                  width: "14.28%",
                  height: "20%",
                  borderColor: "#C8E6C9",
                  backgroundColor: (row + col) % 3 === 0 ? "#F1F8E9" : "#E8F5E9",
                },
              ]}
            />
          ))
        )}
      </View>

      {/* Road lines */}
      <View style={[styles.roadH, { top: "50%", backgroundColor: "#C8E6C9" }]} />
      <View style={[styles.roadV, { left: "45%", backgroundColor: "#C8E6C9" }]} />

      {/* Dashed path line (static approximation) */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={[
            styles.dashDot,
            {
              left: `${SHOP_POS.x + ((CUST_POS.x - SHOP_POS.x) / 6) * i + 3}%` as any,
              top: `${SHOP_POS.y + ((CUST_POS.y - SHOP_POS.y) / 6) * i + 2}%` as any,
              backgroundColor: "#4CAF50",
              opacity: 0.5,
            },
          ]}
        />
      ))}

      {/* Shop Pin */}
      <View style={[styles.shopPin, { left: `${SHOP_POS.x - 3}%` as any, top: `${SHOP_POS.y - 8}%` as any, backgroundColor: "#2E7D32" }]}>
        <Feather name="shopping-bag" size={11} color="#fff" />
      </View>
      <View style={[styles.pinLabel, { left: `${SHOP_POS.x - 4}%` as any, top: `${SHOP_POS.y + 6}%` as any, backgroundColor: "#2E7D32" }]}>
        <Text style={styles.pinLabelText}>Shop</Text>
      </View>

      {/* Customer Pin */}
      <View style={[styles.shopPin, { left: `${CUST_POS.x - 3}%` as any, top: `${CUST_POS.y - 8}%` as any, backgroundColor: "#D32F2F" }]}>
        <Feather name="home" size={11} color="#fff" />
      </View>
      <View style={[styles.pinLabel, { left: `${CUST_POS.x - 4}%` as any, top: `${CUST_POS.y + 6}%` as any, backgroundColor: "#D32F2F" }]}>
        <Text style={styles.pinLabelText}>You</Text>
      </View>

      {/* Animated Rider Marker */}
      <Animated.View style={[styles.riderMarkerWrap, { left: riderLeft, top: riderTop }]}>
        <Animated.View style={[styles.riderPulse, { transform: [{ scale: pulseAnim }], borderColor: "#FF9800" }]} />
        <View style={[styles.riderDot, { backgroundColor: "#FF9800", borderColor: "#fff" }]}>
          <Feather name="truck" size={11} color="#fff" />
        </View>
      </Animated.View>

      {/* Live badge */}
      <View style={[styles.liveBadge, { backgroundColor: "#D32F2F" }]}>
        <View style={styles.liveDot} />
        <Text style={styles.liveBadgeText}>LIVE</Text>
      </View>
    </View>
  );
}

export default function TrackingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders, updateOrderStatus } = useApp();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const order = useMemo(() => orders.find((o) => o.id === id), [orders, id]);

  // ETA countdown (starts at 12 min when out_for_delivery)
  const [etaMins, setEtaMins] = useState(12);
  useEffect(() => {
    if (order?.status !== "out_for_delivery") return;
    const t = setInterval(() => setEtaMins((m) => Math.max(1, m - 1)), 60000);
    return () => clearInterval(t);
  }, [order?.status]);

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
  const isOutForDelivery = order.status === "out_for_delivery";
  const isDelivered = order.status === "delivered";
  const showRiderMap = (isOutForDelivery || isDelivered) && order.mode === "delivery";

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
        {/* Order Header */}
        <View style={[styles.orderHeader, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Feather name="shopping-bag" size={24} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.shopName, { color: colors.foreground }]}>{order.shopName}</Text>
            <Text style={[styles.orderId, { color: colors.mutedForeground }]}>Order #{order.id.toUpperCase()}</Text>
          </View>
          <Text style={[styles.orderTotal, { color: colors.primary }]}>₹{order.total + order.deliveryFee}</Text>
        </View>

        {/* Live Rider Map */}
        {showRiderMap && (
          <View style={[styles.riderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.riderCardHeader}>
              <View>
                <Text style={[styles.riderCardTitle, { color: colors.foreground }]}>Rider is on the way!</Text>
                <Text style={[styles.riderCardSub, { color: colors.mutedForeground }]}>
                  {isDelivered ? "Order delivered" : `Arriving in ~${etaMins} min`}
                </Text>
              </View>
              <View style={[styles.etaBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
                <Feather name="clock" size={13} color={colors.primary} />
                <Text style={[styles.etaText, { color: colors.primary }]}>
                  {isDelivered ? "Done" : `${etaMins}m`}
                </Text>
              </View>
            </View>

            {/* The live map */}
            <RiderLiveMap isDelivered={isDelivered} />

            {/* Rider info */}
            <View style={[styles.riderInfo, { borderTopColor: colors.border }]}>
              <View style={[styles.riderAvatar, { backgroundColor: colors.primary }]}>
                <Feather name="user" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.riderName, { color: colors.foreground }]}>{RIDER.name}</Text>
                <Text style={[styles.riderVehicle, { color: colors.mutedForeground }]}>{RIDER.vehicle}</Text>
              </View>
              <View style={styles.riderActions}>
                <TouchableOpacity style={[styles.riderActionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                  <Feather name="phone" size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.riderActionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                  <Feather name="message-circle" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Rider rating */}
            <View style={[styles.riderRatingRow, { borderTopColor: colors.border }]}>
              <Feather name="star" size={13} color="#FFA000" />
              <Text style={[styles.riderRatingText, { color: colors.mutedForeground }]}>
                {RIDER.rating} rated · 1,240 deliveries
              </Text>
            </View>
          </View>
        )}

        {/* Timeline */}
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

        {/* Items */}
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

        {/* Delivery info */}
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

  // Rider card
  riderCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  riderCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  riderCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  riderCardSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  etaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  etaText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },

  // Live map
  liveMap: {
    height: 180,
    position: "relative",
    overflow: "hidden",
  },
  gridCell: {
    position: "absolute",
    borderWidth: 0.5,
  },
  roadH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 7,
    opacity: 0.8,
  },
  roadV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 7,
    opacity: 0.8,
  },
  dashDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  shopPin: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  pinLabel: {
    position: "absolute",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pinLabelText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  riderMarkerWrap: {
    position: "absolute",
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -18,
    marginTop: -18,
  },
  riderPulse: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    opacity: 0.4,
  },
  riderDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  liveBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  liveBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Rider info
  riderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderTopWidth: 1,
  },
  riderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  riderName: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  riderVehicle: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  riderActions: {
    flexDirection: "row",
    gap: 8,
  },
  riderActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  riderRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  riderRatingText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  // Timeline
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

  // Order items
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
