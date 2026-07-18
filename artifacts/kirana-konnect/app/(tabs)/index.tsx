import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
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
import { Shop, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { isShopCurrentlyOpen } from "@/utils/shopUtils";

const FILTERS = ["All", "Open Now", "Nearest", "Best Rated"];
const { height: SCREEN_H } = Dimensions.get("window");
const SHEET_COLLAPSED = 200;
const SHEET_EXPANDED = SCREEN_H * 0.65;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setSelectedShop, cartCount, shops } = useApp();
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedPin, setSelectedPin] = useState<Shop | null>(null);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const sheetAnim = useRef(new Animated.Value(SHEET_COLLAPSED)).current;
  const sheetHeightRef = useRef(SHEET_COLLAPSED);
  const [isExpanded, setIsExpanded] = useState(false);

  const snapTo = (height: number) => {
    const expanded = height >= SHEET_COLLAPSED + 60;
    setIsExpanded(expanded);
    sheetHeightRef.current = expanded ? SHEET_EXPANDED : SHEET_COLLAPSED;
    Animated.spring(sheetAnim, {
      toValue: sheetHeightRef.current,
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        const next = sheetHeightRef.current - g.dy;
        if (next > 60 && next < SCREEN_H * 0.88) {
          sheetAnim.setValue(next);
        }
      },
      onPanResponderRelease: (_, g) => {
        const velocity = g.vy;
        const current = sheetHeightRef.current - g.dy;
        if (velocity < -0.5 || current > SHEET_COLLAPSED + 80) {
          snapTo(SHEET_EXPANDED);
        } else {
          snapTo(SHEET_COLLAPSED);
        }
      },
    })
  ).current;

  const filteredShops = shops.filter((s) => {
    if (search) return s.name.toLowerCase().includes(search.toLowerCase());
    if (activeFilter === "Open Now") return isShopCurrentlyOpen(s);
    return true;
  }).sort((a, b) => {
    if (activeFilter === "Best Rated") return b.rating - a.rating;
    if (activeFilter === "Nearest") return parseFloat(a.distance) - parseFloat(b.distance);
    return 0;
  });

  const handleShopPress = (shop: Shop) => {
    setSelectedPin(shop);
    snapTo(SHEET_COLLAPSED);
  };

  const handleViewShop = (shop: Shop) => {
    setSelectedShop(shop);
    router.push({ pathname: "/shop/[id]", params: { id: shop.id } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={StyleSheet.absoluteFill}>
        <MapViewComponent onShopPress={handleShopPress} selectedShop={selectedPin} />
      </View>

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
            accessibilityLabel="Search shops or products"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")} accessibilityLabel="Clear search" accessibilityRole="button">
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={{ gap: 8 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                { backgroundColor: activeFilter === f ? colors.primary : colors.background, borderColor: activeFilter === f ? colors.primary : colors.border },
              ]}
              onPress={() => setActiveFilter(f)}
              accessibilityLabel={`Filter: ${f}`}
              accessibilityRole="button"
            >
              <Text style={[styles.filterText, { color: activeFilter === f ? "#fff" : colors.foreground }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedPin && (
        <TouchableOpacity
          style={[styles.pinPopup, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={() => handleViewShop(selectedPin)}
          activeOpacity={0.92}
          accessibilityLabel={`View ${selectedPin.name}`}
          accessibilityRole="button"
        >
          <View style={[styles.pinPopupIcon, { backgroundColor: colors.primary + "18" }]}>
            <Text style={{ fontSize: 22 }}>🛒</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pinPopupName, { color: colors.foreground }]}>{selectedPin.name}</Text>
            <View style={styles.pinPopupMeta}>
              <Feather name="star" size={12} color={colors.rating} />
              <Text style={[styles.pinPopupRating, { color: colors.foreground }]}>{selectedPin.rating}</Text>
              <Text style={[styles.pinPopupDot, { color: colors.mutedForeground }]}>·</Text>
              <Text style={[styles.pinPopupDist, { color: colors.mutedForeground }]}>{selectedPin.distance}</Text>
              {(() => {
                const open = isShopCurrentlyOpen(selectedPin);
                return (
                  <>
                    <View style={[styles.statusDot, { backgroundColor: open ? "#43A047" : "#ef4444" }]} />
                    <Text style={[styles.statusText, { color: open ? "#43A047" : "#ef4444" }]}>
                      {open ? "Open" : "Closed"}
                    </Text>
                  </>
                );
              })()}
            </View>
          </View>
          <View style={[styles.pinPopupArrow, { backgroundColor: colors.primary }]}>
            <Feather name="arrow-right" size={16} color="#fff" />
          </View>
          <TouchableOpacity
            style={styles.pinPopupClose}
            onPress={() => setSelectedPin(null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Close shop popup"
            accessibilityRole="button"
          >
            <Feather name="x" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      <Animated.View
        style={[styles.sheet, { height: sheetAnim, backgroundColor: colors.background }]}
      >
        <View style={styles.dragArea} {...panResponder.panHandlers}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Nearby Shops</Text>
              <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
                {filteredShops.length} shops · tap to see products
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.expandBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}
              onPress={() => snapTo(isExpanded ? SHEET_COLLAPSED : SHEET_EXPANDED)}
              accessibilityLabel={isExpanded ? "Collapse shop list" : "Expand shop list"}
              accessibilityRole="button"
            >
              <Feather name={isExpanded ? "chevron-down" : "chevron-up"} size={16} color={colors.primary} />
              <Text style={[styles.expandText, { color: colors.primary }]}>{isExpanded ? "Less" : "More"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad + 20, gap: 10 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={isExpanded}
        >
          {filteredShops.map((shop) => {
            const shopOpen = isShopCurrentlyOpen(shop);
            return (
              <TouchableOpacity
                key={shop.id}
                style={[styles.shopRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleViewShop(shop)}
                activeOpacity={0.82}
                accessibilityLabel={`${shop.name} — ${shopOpen ? "Open" : "Closed"}, ${shop.distance}`}
                accessibilityRole="button"
              >
                <View style={[styles.shopRowIcon, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={styles.shopRowEmoji}>🛒</Text>
                </View>

                <View style={styles.shopRowInfo}>
                  <View style={styles.shopRowTop}>
                    <Text style={[styles.shopRowName, { color: colors.foreground }]} numberOfLines={1}>
                      {shop.name}
                    </Text>
                    <View style={[styles.openBadge, { backgroundColor: shopOpen ? "#E8F5E9" : "#FFEBEE" }]}>
                      <View style={[styles.openDot, { backgroundColor: shopOpen ? "#43A047" : "#ef4444" }]} />
                      <Text style={[styles.openText, { color: shopOpen ? "#2E7D32" : "#C62828" }]}>
                        {shopOpen ? "Open" : "Closed"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.shopRowMeta}>
                    <Feather name="star" size={12} color="#FFA000" />
                    <Text style={[styles.shopRowRating, { color: colors.foreground }]}>{shop.rating}</Text>
                    <Text style={[styles.shopRowDot, { color: colors.mutedForeground }]}>·</Text>
                    <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                    <Text style={[styles.shopRowDist, { color: colors.mutedForeground }]}>{shop.distance}</Text>
                    <Text style={[styles.shopRowDot, { color: colors.mutedForeground }]}>·</Text>
                    <Text style={[styles.shopRowCat, { color: colors.mutedForeground }]}>Groceries</Text>
                  </View>
                </View>

                <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {cartCount > 0 && (
        <TouchableOpacity
          style={[styles.cartFAB, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/cart")}
          accessibilityLabel={`View cart — ${cartCount} items`}
          accessibilityRole="button"
        >
          <Feather name="shopping-cart" size={20} color="#fff" />
          <View style={[styles.cartFABBadge, { backgroundColor: "#FF9800" }]}>
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
    zIndex: 20,
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
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  filtersRow: { flexGrow: 0 },
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
  pinPopup: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: SHEET_COLLAPSED + 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    zIndex: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  pinPopupIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pinPopupName: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  pinPopupMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  pinPopupRating: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  pinPopupDot: { fontSize: 12 },
  pinPopupDist: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 2 },
  statusText: { fontSize: 11, fontFamily: "Inter_500Medium", fontWeight: "500" },
  pinPopupArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pinPopupClose: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    overflow: "hidden",
  },
  dragArea: {
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  sheetSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  expandBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  expandText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  shopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  shopRowIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  shopRowEmoji: { fontSize: 26 },
  shopRowInfo: { flex: 1, gap: 5 },
  shopRowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  shopRowName: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    flex: 1,
  },
  openBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  openDot: { width: 6, height: 6, borderRadius: 3 },
  openText: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  shopRowMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  shopRowRating: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  shopRowDot: { fontSize: 12 },
  shopRowDist: { fontSize: 12, fontFamily: "Inter_400Regular" },
  shopRowCat: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cartFAB: {
    position: "absolute",
    bottom: SHEET_COLLAPSED + 16,
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
    zIndex: 10,
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
