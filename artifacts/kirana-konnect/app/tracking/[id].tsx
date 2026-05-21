import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useMemo, useState } from "react";
import {
  Alert,
  Animated,
  Linking,
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

// Route waypoints (percentage of map width/height)
const SHOP_POS  = { x: 12, y: 72 };
const CUST_POS  = { x: 80, y: 22 };
// Intermediate waypoints to make path look like roads
const WAYPOINTS = [
  { x: 12, y: 72 },
  { x: 12, y: 50 },
  { x: 45, y: 50 },
  { x: 45, y: 22 },
  { x: 80, y: 22 },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function getWaypointPos(t: number) {
  const segments = WAYPOINTS.length - 1;
  const segment = Math.min(Math.floor(t * segments), segments - 1);
  const local = (t * segments) - segment;
  const from = WAYPOINTS[segment];
  const to = WAYPOINTS[segment + 1];
  return { x: lerp(from.x, to.x, local), y: lerp(from.y, to.y, local) };
}

function RiderLiveMap({ isDelivered }: { isDelivered: boolean }) {
  const progressRef = useRef(isDelivered ? 0.95 : 0.15);
  const riderX = useRef(new Animated.Value(SHOP_POS.x)).current;
  const riderY = useRef(new Animated.Value(SHOP_POS.y)).current;
  const bobAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [distanceText, setDistanceText] = useState("~1.6 km away");

  useEffect(() => {
    if (isDelivered) {
      riderX.setValue(CUST_POS.x);
      riderY.setValue(CUST_POS.y);
      setDistanceText("Delivered!");
      return;
    }

    // Smoothly move rider along waypoints, looping
    const interval = setInterval(() => {
      progressRef.current += 0.0025; // full path in ~14s
      if (progressRef.current > 0.93) {
        progressRef.current = 0.12; // reset near shop
      }
      const pos = getWaypointPos(progressRef.current);
      riderX.setValue(pos.x);
      riderY.setValue(pos.y);

      // Update distance label
      const remaining = 1 - progressRef.current;
      const km = (remaining * 2.1).toFixed(1);
      setDistanceText(`~${km} km away`);
    }, 60);

    // Bob up/down animation to simulate road bumps
    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, { toValue: -3, duration: 300, useNativeDriver: false }),
        Animated.timing(bobAnim, { toValue: 3, duration: 300, useNativeDriver: false }),
      ])
    );
    bob.start();

    // Pulse ring
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.6, duration: 800, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
      ])
    );
    pulse.start();

    return () => {
      clearInterval(interval);
      bob.stop();
      pulse.stop();
    };
  }, [isDelivered]);

  // Convert percentage to Animated style
  const leftStyle = riderX.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  const topStyle  = riderY.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

  return (
    <View style={[styles.liveMap, { backgroundColor: "#dce8d4" }]}>
      {/* Map base — block tiles */}
      <View style={[styles.mapTile, { left: 0, top: 0, width: "100%", height: "100%", backgroundColor: "#e4f0db" }]} />
      <View style={[styles.mapTile, { left: "10%", top: "10%", width: "35%", height: "30%", backgroundColor: "#d0e8c5" }]} />
      <View style={[styles.mapTile, { left: "55%", top: "55%", width: "38%", height: "35%", backgroundColor: "#d0e8c5" }]} />
      <View style={[styles.mapTile, { left: "15%", top: "62%", width: "22%", height: "28%", backgroundColor: "#c8e0be" }]} />
      <View style={[styles.mapTile, { left: "60%", top: "10%", width: "30%", height: "35%", backgroundColor: "#c8e0be" }]} />

      {/* Roads — horizontal */}
      <View style={[styles.road, { left: 0, right: 0, top: "47%", height: 14, backgroundColor: "#bfcfb8" }]} />
      {/* Roads — vertical */}
      <View style={[styles.road, { top: 0, bottom: 0, left: "43%", width: 14, backgroundColor: "#bfcfb8" }]} />

      {/* Road center dashes — horizontal */}
      {[0,1,2,3,4,5,6].map(i => (
        <View key={`dh${i}`} style={[styles.roadDash, {
          left: `${i * 15}%` as any, top: "49.5%", width: "8%", height: 3, backgroundColor: "#a8b8a0"
        }]} />
      ))}
      {/* Road center dashes — vertical */}
      {[0,1,2,3,4].map(i => (
        <View key={`dv${i}`} style={[styles.roadDash, {
          left: "45.5%", top: `${i * 22}%` as any, width: 3, height: "12%", backgroundColor: "#a8b8a0"
        }]} />
      ))}

      {/* Route path dots */}
      {[0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85].map((t) => {
        const p = getWaypointPos(t);
        return (
          <View
            key={t}
            style={[styles.routeDot, {
              left: `${p.x}%` as any,
              top: `${p.y}%` as any,
              backgroundColor: "#FF9800",
              opacity: 0.4,
            }]}
          />
        );
      })}

      {/* Shop Pin */}
      <View style={[styles.pinWrap, { left: `${SHOP_POS.x - 4}%` as any, top: `${SHOP_POS.y - 14}%` as any }]}>
        <View style={[styles.pinBubble, { backgroundColor: "#2E7D32" }]}>
          <Text style={styles.pinEmoji}>🛒</Text>
        </View>
        <View style={[styles.pinNeedle, { borderTopColor: "#2E7D32" }]} />
        <View style={[styles.pinTag, { backgroundColor: "#2E7D32" }]}>
          <Text style={styles.pinTagText}>Shop</Text>
        </View>
      </View>

      {/* Customer (You) Pin */}
      <View style={[styles.pinWrap, { left: `${CUST_POS.x - 4}%` as any, top: `${CUST_POS.y - 14}%` as any }]}>
        <View style={[styles.pinBubble, { backgroundColor: "#C62828" }]}>
          <Text style={styles.pinEmoji}>🏠</Text>
        </View>
        <View style={[styles.pinNeedle, { borderTopColor: "#C62828" }]} />
        <View style={[styles.pinTag, { backgroundColor: "#C62828" }]}>
          <Text style={styles.pinTagText}>You</Text>
        </View>
      </View>

      {/* Animated Rider Marker */}
      <Animated.View
        style={[
          styles.riderWrap,
          { left: leftStyle, top: topStyle },
          { transform: [{ translateY: bobAnim }] },
        ]}
      >
        {/* Pulsing ring */}
        <Animated.View
          style={[
            styles.riderRing,
            { transform: [{ scale: pulseAnim }], borderColor: "#FF9800", opacity: 0.45 },
          ]}
        />
        {/* Shadow */}
        <View style={styles.riderShadow} />
        {/* Main bubble */}
        <View style={[styles.riderBubble, { backgroundColor: "#FF6F00" }]}>
          <Text style={styles.riderEmoji}>🛵</Text>
        </View>
        {/* Distance callout */}
        <View style={[styles.riderCallout, { backgroundColor: "#FF6F00" }]}>
          <Text style={styles.riderCalloutText}>{distanceText}</Text>
        </View>
      </Animated.View>

      {/* LIVE badge */}
      <View style={[styles.liveBadge, { backgroundColor: "#C62828" }]}>
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

  const handleCancelOrder = () => {
    if (!order) return;
    Alert.alert(
      "Cancel Order?",
      "Are you sure you want to cancel this order? This cannot be undone.",
      [
        { text: "Keep Order", style: "cancel" },
        {
          text: "Cancel Order",
          style: "destructive",
          onPress: () => {
            updateOrderStatus(order.id, "rejected");
            router.replace("/(tabs)/orders");
          },
        },
      ]
    );
  };

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
        {/* Order Delivered Celebration Banner */}
        {isDelivered && (
          <View style={[styles.deliveredBanner, { backgroundColor: colors.primary }]}>
            <Text style={styles.deliveredEmoji}>🎉</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.deliveredTitle}>Order Delivered!</Text>
              <Text style={styles.deliveredSub}>Thank you for shopping with us</Text>
            </View>
            <Feather name="check-circle" size={26} color="#fff" />
          </View>
        )}

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
                <TouchableOpacity
                  style={[styles.riderActionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}
                  onPress={() => Linking.openURL(`tel:${RIDER.phone.replace(/\s+/g, "")}`)}
                  accessibilityLabel={`Call ${RIDER.name}`}
                  accessibilityRole="button"
                >
                  <Feather name="phone" size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.riderActionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}
                  onPress={() => Linking.openURL(`sms:${RIDER.phone.replace(/\s+/g, "")}`)}
                  accessibilityLabel={`Message ${RIDER.name}`}
                  accessibilityRole="button"
                >
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

        {order.status === "pending" && (
          <TouchableOpacity
            style={[styles.cancelBtn, { backgroundColor: "#C62828" + "10", borderColor: "#C62828" + "40" }]}
            onPress={handleCancelOrder}
            accessibilityLabel="Cancel order"
            accessibilityRole="button"
          >
            <Feather name="x-circle" size={16} color="#C62828" />
            <Text style={[styles.cancelBtnText, { color: "#C62828" }]}>Cancel Order</Text>
          </TouchableOpacity>
        )}

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
  deliveredBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
  },
  deliveredEmoji: { fontSize: 28 },
  deliveredTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  deliveredSub: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    opacity: 0.88,
    marginTop: 2,
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
    height: 260,
    position: "relative",
    overflow: "hidden",
  },
  mapTile: {
    position: "absolute",
    borderRadius: 4,
  },
  road: {
    position: "absolute",
  },
  roadDash: {
    position: "absolute",
    borderRadius: 2,
    opacity: 0.6,
  },
  routeDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    marginTop: -4,
  },
  pinWrap: {
    position: "absolute",
    alignItems: "center",
  },
  pinBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  pinEmoji: {
    fontSize: 18,
  },
  pinNeedle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -1,
  },
  pinTag: {
    marginTop: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pinTagText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  riderWrap: {
    position: "absolute",
    alignItems: "center",
    marginLeft: -26,
    marginTop: -26,
  },
  riderRing: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    marginLeft: -9,
    marginTop: -9,
  },
  riderShadow: {
    position: "absolute",
    bottom: -4,
    width: 40,
    height: 10,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  riderBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#FF6F00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  riderEmoji: {
    fontSize: 26,
  },
  riderCallout: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  riderCalloutText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
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
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
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
