import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useMemo } from "react";
import { Animated, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function OrderSuccessScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders } = useApp();

  const order = useMemo(() => orders.find((o) => o.id === id), [orders, id]);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const confettiAnims = useRef(
    Array.from({ length: 6 }, () => ({
      y: new Animated.Value(0),
      x: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: false }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: false }),
      ])
    );
    pulse.start();

    confettiAnims.forEach((c, i) => {
      const delay = i * 80;
      Animated.parallel([
        Animated.timing(c.y, { toValue: -80 - Math.random() * 60, duration: 700, delay, useNativeDriver: false }),
        Animated.timing(c.x, {
          toValue: (i % 2 === 0 ? 1 : -1) * (20 + Math.random() * 40),
          duration: 700,
          delay,
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.delay(delay + 400),
          Animated.timing(c.opacity, { toValue: 0, duration: 300, useNativeDriver: false }),
        ]),
      ]).start();
    });

    return () => pulse.stop();
  }, []);

  if (!order) return null;

  const confettiColors = ["#FF9800", "#2E7D32", "#1976D2", "#E91E63", "#9C27B0", "#FF5722"];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: topPad + 24, paddingBottom: bottomPad + 24, gap: 20 }}>
        <Animated.View style={[styles.heroSection, { opacity: fadeAnim }]}>
          <View style={styles.confettiContainer}>
            {confettiAnims.map((c, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.confettiDot,
                  {
                    backgroundColor: confettiColors[i],
                    opacity: c.opacity,
                    transform: [{ translateY: c.y }, { translateX: c.x }],
                  },
                ]}
              />
            ))}
            <Animated.View
              style={[
                styles.successRing,
                { borderColor: colors.primary + "40", transform: [{ scale: pulseAnim }] },
              ]}
            />
            <Animated.View
              style={[
                styles.successCircle,
                { backgroundColor: colors.primary, transform: [{ scale: scaleAnim }] },
              ]}
            >
              <Feather name="check" size={40} color="#fff" />
            </Animated.View>
          </View>

          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Order Placed!</Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            Your order has been sent to {order.shopName}. You'll get an update shortly.
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.orderCard,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: fadeAnim },
          ]}
        >
          <View style={styles.orderCardHeader}>
            <View style={[styles.shopIcon, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="shopping-bag" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.shopName, { color: colors.foreground }]}>{order.shopName}</Text>
              <Text style={[styles.orderId, { color: colors.mutedForeground }]}>
                Order #{order.id.toUpperCase()}
              </Text>
            </View>
            <View style={[styles.modeBadge, { backgroundColor: colors.primary + "15" }]}>
              <Feather
                name={order.mode === "delivery" ? "truck" : "shopping-bag"}
                size={13}
                color={colors.primary}
              />
              <Text style={[styles.modeText, { color: colors.primary }]}>
                {order.mode === "delivery" ? "Delivery" : "Pickup"}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={[styles.itemQty, { color: colors.mutedForeground }]}>{item.quantity}×</Text>
              <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.itemPrice, { color: colors.foreground }]}>
                ₹{item.price * item.quantity}
              </Text>
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total Payable</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              ₹{order.total + order.deliveryFee}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="credit-card" size={13} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {order.paymentMethod === "cod" ? "Cash on Delivery" : "UPI"}
              </Text>
            </View>
            {order.mode === "delivery" && order.address ? (
              <View style={styles.metaItem}>
                <Feather name="map-pin" size={13} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {order.address}
                </Text>
              </View>
            ) : null}
          </View>
        </Animated.View>

        <Animated.View style={[styles.etaCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30", opacity: fadeAnim }]}>
          <Feather name="clock" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.etaTitle, { color: colors.foreground }]}>Estimated Time</Text>
            <Text style={[styles.etaSub, { color: colors.mutedForeground }]}>
              {order.mode === "delivery" ? "20–35 minutes" : "Ready in 15–20 minutes for pickup"}
            </Text>
          </View>
        </Animated.View>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.replace({ pathname: "/tracking/[id]", params: { id: order.id } })}
          activeOpacity={0.85}
          accessibilityLabel="Track your order"
          accessibilityRole="button"
        >
          <Feather name="map-pin" size={16} color="#fff" />
          <Text style={styles.primaryBtnText}>Track Order</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => router.replace("/(tabs)")}
          activeOpacity={0.85}
          accessibilityLabel="Continue shopping"
          accessibilityRole="button"
        >
          <Feather name="shopping-bag" size={16} color={colors.foreground} />
          <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>Continue Shopping</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroSection: { alignItems: "center", gap: 16, paddingVertical: 8 },
  confettiContainer: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  confettiDot: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  successRing: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
  },
  successCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  heroSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  orderCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  orderCardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  shopIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  shopName: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  orderId: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  modeText: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  divider: { height: 1 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemQty: { fontSize: 13, fontFamily: "Inter_400Regular", width: 26 },
  itemName: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  itemPrice: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  totalValue: { fontSize: 20, fontWeight: "800", fontFamily: "Inter_700Bold" },
  metaRow: { gap: 6 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  etaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  etaTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  etaSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
