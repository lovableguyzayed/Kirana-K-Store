import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CATEGORY_ICONS, getCategoryColor } from "@/constants/categories";
import { SHOPS, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const CATEGORY_FILTERS = ["All", ...Object.keys(CATEGORY_ICONS)];

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setSelectedShop, shopProducts } = useApp();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const inputRef = useRef<TextInput>(null);
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const allProducts = useMemo(
    () =>
      SHOPS.flatMap((shop) =>
        (shopProducts[shop.id] ?? [])
          .filter((p) => p.isActive !== false)
          .map((p) => ({ ...p, shopData: shop }))
      ),
    [shopProducts]
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allProducts.filter(
      (p) =>
        (p.name.toLowerCase().includes(q) ||
          p.shopName.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)) &&
        (activeCategory === "All" || p.category === activeCategory)
    );
  }, [query, allProducts, activeCategory]);

  const highlightedShops = useMemo(() => {
    if (!query.trim()) return [];
    const shopIds = new Set(results.map((r) => r.shopId));
    return SHOPS.filter((s) => shopIds.has(s.id));
  }, [results, query]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={[styles.searchBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            ref={inputRef}
            autoFocus
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Search products or shops..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            accessibilityLabel="Search products or shops"
          />
          {query ? (
            <TouchableOpacity
              onPress={() => setQuery("")}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
            >
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.categoryRow, { borderBottomColor: colors.border }]}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        {CATEGORY_FILTERS.map((cat) => {
          const active = activeCategory === cat;
          const catColor = cat === "All" ? colors.primary : getCategoryColor(cat);
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: active ? catColor : colors.muted,
                  borderColor: active ? catColor : colors.border,
                },
              ]}
              onPress={() => setActiveCategory(cat)}
              accessibilityLabel={`Filter by ${cat}`}
              accessibilityRole="button"
            >
              {cat !== "All" && (
                <Feather
                  name={CATEGORY_ICONS[cat] as any}
                  size={12}
                  color={active ? "#fff" : colors.mutedForeground}
                />
              )}
              <Text
                style={[
                  styles.categoryChipText,
                  { color: active ? "#fff" : colors.foreground },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {!query.trim() ? (
        <View style={styles.emptySearch}>
          <Feather name="search" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Search Products</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Try "milk", "atta", "bread" or a shop name
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptySearch}>
          <Feather name="frown" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No results found</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {activeCategory !== "All"
              ? `No "${activeCategory}" products match "${query}"`
              : `Try a different search term`}
          </Text>
          {activeCategory !== "All" && (
            <TouchableOpacity
              onPress={() => setActiveCategory("All")}
              style={[styles.clearFilterBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            >
              <Feather name="x" size={13} color={colors.mutedForeground} />
              <Text style={[styles.clearFilterText, { color: colors.foreground }]}>Clear category filter</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.id}-${item.shopId}`}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListHeaderComponent={
            highlightedShops.length > 0 ? (
              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                  Shops with "{query}"
                </Text>
                {highlightedShops.map((shop) => (
                  <TouchableOpacity
                    key={shop.id}
                    style={[styles.shopRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => {
                      setSelectedShop(shop);
                      router.push({ pathname: "/shop/[id]", params: { id: shop.id } });
                    }}
                    accessibilityLabel={`Open ${shop.name}`}
                    accessibilityRole="button"
                  >
                    <View style={[styles.shopIcon, { backgroundColor: colors.primary + "20" }]}>
                      <Feather name="shopping-bag" size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.shopName, { color: colors.foreground }]}>{shop.name}</Text>
                      <Text style={[styles.shopDist, { color: colors.mutedForeground }]}>
                        {shop.distance} · {shop.rating} ★
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>
                  Products ({results.length})
                </Text>
              </View>
            ) : (
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginBottom: 8 }]}>
                {results.length} product{results.length !== 1 ? "s" : ""} found
              </Text>
            )
          }
          renderItem={({ item }) => {
            const catColor = getCategoryColor(item.category);
            const catIcon = CATEGORY_ICONS[item.category] ?? "package";
            return (
              <TouchableOpacity
                style={[styles.productRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  const shop = SHOPS.find((s) => s.id === item.shopId);
                  if (shop) {
                    setSelectedShop(shop);
                    router.push({ pathname: "/shop/[id]", params: { id: item.shopId } });
                  }
                }}
                accessibilityLabel={`${item.name} from ${item.shopName}`}
                accessibilityRole="button"
              >
                <View style={[styles.productIcon, { backgroundColor: catColor + "25" }]}>
                  <Feather name={catIcon as any} size={18} color={catColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.productName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.productShop, { color: colors.mutedForeground }]}>
                    {item.shopName} · {item.shopData.distance}
                  </Text>
                </View>
                <View style={styles.priceCol}>
                  <Text style={[styles.productPrice, { color: colors.foreground }]}>₹{item.price}</Text>
                  <Text style={[styles.productUnit, { color: colors.mutedForeground }]}>/{item.unit}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  categoryRow: { borderBottomWidth: 1 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  emptySearch: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  clearFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  clearFilterText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  shopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  shopIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  shopName: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  shopDist: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  productIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  productName: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  productShop: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  priceCol: { alignItems: "flex-end" },
  productPrice: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  productUnit: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
