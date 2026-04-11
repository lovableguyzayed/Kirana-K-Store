import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CartBar from "@/components/CartBar";
import ProductCard from "@/components/ProductCard";
import { SHOPS, getProductsByShop, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function ShopDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cart } = useApp();

  const shop = useMemo(() => SHOPS.find((s) => s.id === id), [id]);
  const products = useMemo(() => getProductsByShop(id || ""), [id]);
  const categories = useMemo(() => ["All", ...new Set(products.map((p) => p.category))], [products]);
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredProducts = useMemo(
    () => activeCategory === "All" ? products : products.filter((p) => p.category === activeCategory),
    [products, activeCategory]
  );

  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  if (!shop) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.shopHeader, { backgroundColor: colors.primary, paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.shopInfo}>
          <View style={[styles.shopIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Feather name="shopping-bag" size={28} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shopName}>{shop.name}</Text>
            <Text style={styles.shopAddress} numberOfLines={1}>{shop.address}</Text>
            <View style={styles.shopMeta}>
              <Feather name="star" size={13} color="#FFD54F" />
              <Text style={styles.shopRating}>{shop.rating}</Text>
              <Text style={styles.shopDot}>·</Text>
              <Feather name="map-pin" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.shopDist}>{shop.distance}</Text>
              <View style={[styles.openBadge, { backgroundColor: shop.isOpen ? "#43A047" : "#ef4444" }]}>
                <Text style={styles.openText}>{shop.isOpen ? "Open" : "Closed"}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.catRow, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.catChip,
                {
                  backgroundColor: activeCategory === cat ? colors.primary : colors.muted,
                  borderColor: activeCategory === cat ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.catText, { color: activeCategory === cat ? "#fff" : colors.foreground }]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 80 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.productsLabel, { color: colors.mutedForeground }]}>
          {filteredProducts.length} products
        </Text>
        {filteredProducts.map((product) => {
          const cartItem = cart.find((i) => i.id === product.id);
          return <ProductCard key={product.id} product={product} cartItem={cartItem} />;
        })}
      </ScrollView>

      <View style={{ paddingBottom: bottomPad }}>
        <CartBar />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  shopHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  shopInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  shopIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  shopName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  shopAddress: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  shopMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  shopRating: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  shopDot: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
  shopDist: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  openBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  openText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  catRow: {
    borderBottomWidth: 1,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  catText: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  productsLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 10,
  },
});
