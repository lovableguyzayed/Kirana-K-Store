import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
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

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const SHOP = {
  name: "Gupta Kirana Store",
  owner: "Ramesh Gupta",
  address: "12, Gandhi Market, Sector 4",
  rating: 4.7,
  reviews: 238,
  since: "Est. 2009",
  category: "General Kirana",
};

export default function ShopkeeperDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, setIsShopkeeper } = useApp();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 84 : 0);

  const todaysOrders = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter((o) => new Date(o.placedAt).toDateString() === today);
  }, [orders]);

  const pendingOrders = useMemo(() => orders.filter((o) => o.status === "pending" || o.status === "accepted"), [orders]);
  const earnings = useMemo(() => todaysOrders.reduce((sum, o) => sum + o.total + o.deliveryFee, 0), [todaysOrders]);

  const handleLogout = () => {
    setIsShopkeeper(false);
    router.replace("/login");
  };

  const STAT_CARDS = [
    { label: "Today's Orders", value: todaysOrders.length.toString(), icon: "shopping-bag" as const, color: colors.primary },
    { label: "Earnings Today", value: `₹${earnings}`, icon: "trending-up" as const, color: colors.success },
    { label: "Pending", value: pendingOrders.length.toString(), icon: "clock" as const, color: colors.accent },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Shop Banner */}
      <View style={[styles.banner, { paddingTop: topPad + 10 }]}>
        <View style={styles.bannerOverlay} />
        {/* Header row */}
        <View style={styles.bannerHeader}>
          <View style={styles.bannerLogoWrap}>
            <View style={styles.bannerLogoInner}>
              <Feather name="shopping-bag" size={24} color="#2E7D32" />
            </View>
          </View>
          <View style={styles.bannerInfo}>
            <View style={styles.shopBadgeRow}>
              <View style={styles.onlineBadge}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Open · Accepting orders</Text>
              </View>
              <Text style={styles.since}>{SHOP.since}</Text>
            </View>
            <Text style={styles.shopName}>{SHOP.name}</Text>
            <Text style={styles.ownerText}>{SHOP.owner}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Feather name="log-out" size={17} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {/* Address + rating row */}
        <View style={styles.bannerDetails}>
          <View style={styles.detailRow}>
            <Feather name="map-pin" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.detailText}>{SHOP.address}</Text>
          </View>
          <View style={styles.detailRow}>
            <Feather name="star" size={12} color="#FFD54F" />
            <Text style={styles.ratingText}>{SHOP.rating}</Text>
            <Text style={styles.detailText}>({SHOP.reviews} reviews)</Text>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>{SHOP.category}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: bottomPad + 16 }}>
        <View style={styles.statsRow}>
          {STAT_CARDS.map((stat) => (
            <View
              key={stat.label}
              style={[styles.statCard, { backgroundColor: stat.color + "12", borderColor: stat.color + "30" }]}
            >
              <View style={[styles.statIcon, { backgroundColor: stat.color + "25" }]}>
                <Feather name={stat.icon} size={18} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.mapCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.mapPlaceholder}>
            <Feather name="map" size={32} color={colors.primary} />
            <Text style={[styles.mapText, { color: colors.mutedForeground }]}>Your shop on the map</Text>
            <View style={[styles.onlineTag, { backgroundColor: colors.success + "20" }]}>
              <View style={[styles.tagDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.onlineTagText, { color: colors.success }]}>Online · Accepting Orders</Text>
            </View>
          </View>
        </View>

        <View style={[styles.recentOrders, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.recentHeader}>
            <Text style={[styles.recentTitle, { color: colors.foreground }]}>Recent Orders</Text>
            <TouchableOpacity onPress={() => router.push("/(shopkeeper)/orders")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {orders.slice(0, 3).map((order) => (
            <View key={order.id} style={[styles.orderRow, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.orderId, { color: colors.foreground }]}>#{order.id.toUpperCase()}</Text>
                <Text style={[styles.orderItems, { color: colors.mutedForeground }]}>
                  {order.items.length} item{order.items.length > 1 ? "s" : ""} · {order.paymentMethod.toUpperCase()}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.orderTotal, { color: colors.foreground }]}>₹{order.total + order.deliveryFee}</Text>
                <Text style={[styles.orderStatus, { color: order.status === "pending" ? colors.accent : colors.success }]}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: {
    backgroundColor: "#1B5E20",
    paddingHorizontal: 16,
    paddingBottom: 18,
    overflow: "hidden",
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#2E7D32",
    opacity: 0.6,
  },
  bannerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  bannerLogoWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerLogoInner: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerInfo: {
    flex: 1,
    gap: 3,
  },
  shopBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#69F0AE",
  },
  onlineText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  since: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  shopName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  ownerText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  bannerDetails: {
    gap: 6,
    marginTop: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  detailText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  ratingText: {
    color: "#FFD54F",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  categoryPill: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  categoryText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  mapCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  mapPlaceholder: {
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E8F5E9",
  },
  mapText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  onlineTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  onlineTagText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  recentOrders: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  seeAll: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  orderId: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  orderItems: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  orderStatus: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    marginTop: 2,
  },
});
