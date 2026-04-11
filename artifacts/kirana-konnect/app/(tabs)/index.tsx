import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MapViewComponent from "@/components/MapView";
import ShopCard from "@/components/ShopCard";
import { Shop, SHOPS, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const FILTERS = ["All", "Open Now", "Nearest", "Best Rated"];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setSelectedShop, selectedShop, cartCount } = useApp();
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedPin, setSelectedPin] = useState<Shop | null>(null);
  const sheetHeight = useRef(new Animated.Value(0)).current;

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const filteredShops = SHOPS.filter((s) => {
    if (search) return s.name.toLowerCase().includes(search.toLowerCase());
    if (activeFilter === "Open Now") return s.isOpen;
    return true;
  }).sort((a, b) => {
    if (activeFilter === "Best Rated") return b.rating - a.rating;
    if (activeFilter === "Nearest") return parseFloat(a.distance) - parseFloat(b.distance);
    return 0;
  });

  const handleShopPress = (shop: Shop) => {
    setSelectedPin(shop);
  };

  const handleViewShop = (shop: Shop) => {
    setSelectedShop(shop);
    router.push("/shop/" + shop.id);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search shops or products..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            onFocus={() => router.push("/search")}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 0 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                {
                  backgroundColor: activeFilter === f ? colors.primary : colors.background,
                  borderColor: activeFilter === f ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setActiveFilter(f)}
            >
              <Text
                style={[styles.filterText, { color: activeFilter === f ? "#fff" : colors.foreground }]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {viewMode === "map" ? (
        <View style={styles.mapContainer}>
          <MapViewComponent onShopPress={handleShopPress} selectedShop={selectedPin} />

          <TouchableOpacity
            style={[styles.recenterBtn, { backgroundColor: colors.background, borderColor: colors.border, bottom: selectedPin ? 220 : 170 }]}
            onPress={() => setSelectedPin(null)}
          >
            <Feather name="navigation" size={18} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, { backgroundColor: colors.primary, bottom: selectedPin ? 220 : 170 }]}
            onPress={() => setViewMode("list")}
          >
            <Feather name="list" size={18} color="#fff" />
          </TouchableOpacity>

          {selectedPin ? (
            <View style={[styles.shopPopup, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.popupHandle} />
              <View style={styles.popupContent}>
                <View style={[styles.popupIcon, { backgroundColor: colors.muted }]}>
                  <Feather name="shopping-bag" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.popupName, { color: colors.foreground }]}>{selectedPin.name}</Text>
                  <View style={styles.popupMeta}>
                    <Feather name="star" size={12} color={colors.rating} />
                    <Text style={[styles.popupRating, { color: colors.foreground }]}>{selectedPin.rating}</Text>
                    <Text style={[styles.popupDot, { color: colors.mutedForeground }]}>·</Text>
                    <Text style={[styles.popupDist, { color: colors.mutedForeground }]}>{selectedPin.distance}</Text>
                    <View style={[styles.statusDot, { backgroundColor: selectedPin.isOpen ? colors.success : colors.destructive }]} />
                    <Text style={[styles.statusText, { color: selectedPin.isOpen ? colors.success : colors.destructive }]}>
                      {selectedPin.isOpen ? "Open" : "Closed"}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.viewShopBtn, { backgroundColor: colors.primary }]}
                onPress={() => handleViewShop(selectedPin)}
                activeOpacity={0.85}
              >
                <Text style={styles.viewShopText}>View Shop</Text>
                <Feather name="arrow-right" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.nearbySheet, { backgroundColor: colors.background }]}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Nearby Shops</Text>
                <Text style={[styles.sheetCount, { color: colors.mutedForeground }]}>{filteredShops.length} found</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.nearbyList} contentContainerStyle={{ gap: 10, paddingRight: 16 }}>
                {filteredShops.map((shop) => (
                  <TouchableOpacity
                    key={shop.id}
                    style={[styles.nearbyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => handleViewShop(shop)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.nearbyIcon, { backgroundColor: colors.primary + "18" }]}>
                      <Feather name="shopping-bag" size={20} color={colors.primary} />
                    </View>
                    <Text style={[styles.nearbyName, { color: colors.foreground }]} numberOfLines={1}>
                      {shop.name}
                    </Text>
                    <View style={styles.nearbyMeta}>
                      <Feather name="star" size={10} color={colors.rating} />
                      <Text style={[styles.nearbyRating, { color: colors.foreground }]}>{shop.rating}</Text>
                      <Text style={[styles.nearbyDist, { color: colors.mutedForeground }]}>{shop.distance}</Text>
                    </View>
                    <View style={[styles.shopNowBtn, { backgroundColor: colors.primary }]}>
                      <Text style={styles.shopNowText}>Shop</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.listContainer}>
          <View style={[styles.listHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.listTitle, { color: colors.foreground }]}>
              {filteredShops.length} Shops Nearby
            </Text>
            <TouchableOpacity
              style={[styles.mapToggleBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}
              onPress={() => setViewMode("map")}
            >
              <Feather name="map" size={14} color={colors.primary} />
              <Text style={[styles.mapToggleText, { color: colors.primary }]}>Map</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
            {filteredShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} onPress={handleViewShop} />
            ))}
          </ScrollView>
        </View>
      )}

      {cartCount > 0 && (
        <TouchableOpacity
          style={[styles.cartFAB, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/cart")}
        >
          <Feather name="shopping-cart" size={20} color="#fff" />
          <View style={[styles.cartFABBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.cartFABBadgeText}>{cartCount}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  filtersRow: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  mapContainer: { flex: 1 },
  recenterBtn: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleBtn: {
    position: "absolute",
    right: 68,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  shopPopup: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
    gap: 14,
  },
  popupHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 4,
  },
  popupContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  popupIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  popupName: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  popupMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  popupRating: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  popupDot: { fontSize: 13 },
  popupDist: { fontSize: 13, fontFamily: "Inter_400Regular" },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 4 },
  statusText: { fontSize: 12, fontFamily: "Inter_500Medium", fontWeight: "500" },
  viewShopBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  viewShopText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  nearbySheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  sheetCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  nearbyList: {
    paddingLeft: 16,
  },
  nearbyCard: {
    width: 130,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  nearbyIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  nearbyName: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  nearbyMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  nearbyRating: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  nearbyDist: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginLeft: 2,
  },
  shopNowBtn: {
    marginTop: 4,
    borderRadius: 8,
    paddingVertical: 5,
    alignItems: "center",
  },
  shopNowText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  listContainer: { flex: 1, marginTop: Platform.OS === "web" ? 180 : 140 },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  mapToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  mapToggleText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  cartFAB: {
    position: "absolute",
    bottom: Platform.OS === "web" ? 50 : 30,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  cartFABBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cartFABBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
