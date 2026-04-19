import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Product } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface InventoryProduct extends Product {
  isActive: boolean;
}

const INITIAL_PRODUCTS: InventoryProduct[] = [
  { id: "i1", name: "Amul Milk 500ml", price: 25, unit: "packet", stock: 50, shopId: "s1", shopName: "Gupta Kirana", category: "Dairy", isActive: true, description: "Fresh pasteurized toned milk.", isWeightBased: false },
  { id: "i2", name: "Fortune Basmati Rice 5kg", price: 350, unit: "bag", stock: 20, shopId: "s1", shopName: "Gupta Kirana", category: "Grocery", isActive: true, description: "Premium aged basmati rice.", isWeightBased: false },
  { id: "i3", name: "Aashirvaad Atta 5kg", price: 260, unit: "bag", stock: 15, shopId: "s1", shopName: "Gupta Kirana", category: "Grocery", isActive: true, description: "Whole wheat flour for soft rotis.", isWeightBased: false },
  { id: "i4", name: "Parle-G Biscuits", price: 10, unit: "pack", stock: 100, shopId: "s1", shopName: "Gupta Kirana", category: "Snacks", isActive: true, description: "India's most loved glucose biscuit.", isWeightBased: false },
  { id: "i5", name: "Tata Tea Gold 250g", price: 120, unit: "box", stock: 0, shopId: "s1", shopName: "Gupta Kirana", category: "Beverages", isActive: false, description: "Strong, flavourful whole leaf tea.", isWeightBased: false },
  { id: "i6", name: "Tomatoes", price: 30, unit: "kg", stock: 25, shopId: "s1", shopName: "Gupta Kirana", category: "Vegetables", isActive: true, description: "Fresh farm tomatoes, sold by weight.", isWeightBased: true },
];

const UNIT_OPTIONS = ["piece", "packet", "kg", "g", "bag", "litre", "ml", "box", "bar", "pack", "loaf", "tube"];
const CATEGORIES = ["Dairy", "Grocery", "Snacks", "Beverages", "Bakery", "Vegetables", "Stationery"];

const CATEGORY_ICONS: Record<string, string> = {
  Dairy: "droplet",
  Grocery: "package",
  Snacks: "star",
  Bakery: "coffee",
  Beverages: "coffee",
  Vegetables: "feather",
  Stationery: "edit",
};

export default function InventoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 84 : 0);

  const [products, setProducts] = useState<InventoryProduct[]>(INITIAL_PRODUCTS);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<InventoryProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [form, setForm] = useState({
    name: "", price: "", stock: "", unit: "piece",
    category: "Grocery", description: "", isWeightBased: false,
  });

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((p) => p.isActive).length,
    outOfStock: products.filter((p) => p.stock === 0).length,
  }), [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = filterCategory === "All" || p.category === filterCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, filterCategory]);

  const openAdd = () => {
    setEditProduct(null);
    setForm({ name: "", price: "", stock: "", unit: "piece", category: "Grocery", description: "", isWeightBased: false });
    setShowModal(true);
  };

  const openEdit = (product: InventoryProduct) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      unit: product.unit,
      category: product.category,
      description: product.description || "",
      isWeightBased: product.isWeightBased || false,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.price) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (editProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editProduct.id
            ? {
                ...p,
                name: form.name,
                price: Number(form.price),
                stock: Number(form.stock),
                unit: form.unit,
                category: form.category,
                description: form.description,
                isWeightBased: form.isWeightBased,
              }
            : p
        )
      );
    } else {
      setProducts((prev) => [
        ...prev,
        {
          id: `i${Date.now()}`,
          name: form.name,
          price: Number(form.price),
          stock: Number(form.stock),
          unit: form.unit,
          category: form.category,
          description: form.description,
          isWeightBased: form.isWeightBased,
          shopId: "s1",
          shopName: "Gupta Kirana",
          isActive: true,
        },
      ]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleActive = (id: string) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)));
  };

  const allCats = ["All", ...CATEGORIES];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.foreground }]}>Inventory</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={openAdd}
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add Product</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: "Total", value: stats.total, color: colors.primary, icon: "package" },
            { label: "Active", value: stats.active, color: colors.success, icon: "check-circle" },
            { label: "Out of Stock", value: stats.outOfStock, color: colors.destructive, icon: "alert-circle" },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: s.color + "15", borderColor: s.color + "30" }]}>
              <Feather name={s.icon as any} size={16} color={s.color} />
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search products..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
          {allCats.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.catChip,
                { backgroundColor: filterCategory === cat ? colors.primary : colors.muted, borderColor: filterCategory === cat ? colors.primary : colors.border },
              ]}
              onPress={() => setFilterCategory(cat)}
            >
              <Text style={[styles.catChipText, { color: filterCategory === cat ? "#fff" : colors.foreground }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: bottomPad + 16 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="package" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No products found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.productCard,
              {
                backgroundColor: colors.card,
                borderColor: item.stock === 0 ? colors.destructive + "40" : colors.border,
                opacity: item.isActive ? 1 : 0.6,
              },
            ]}
          >
            <View style={[styles.productIcon, { backgroundColor: colors.muted }]}>
              <Feather name={(CATEGORY_ICONS[item.category] || "package") as any} size={22} color={colors.primary} />
              {item.stock === 0 && (
                <View style={[styles.outOfStockBadge, { backgroundColor: colors.destructive }]}>
                  <Text style={styles.outOfStockText}>Out</Text>
                </View>
              )}
              {item.isWeightBased && (
                <View style={[styles.weightBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.weightBadgeText}>kg</Text>
                </View>
              )}
            </View>
            <View style={styles.productInfo}>
              <View style={styles.productNameRow}>
                <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                {!item.isActive && (
                  <View style={[styles.inactivePill, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.inactivePillText, { color: colors.mutedForeground }]}>Hidden</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.productMeta, { color: colors.mutedForeground }]}>
                {item.category} · {item.unit}{item.isWeightBased ? " (weight)": ""}
              </Text>
              {item.description ? (
                <Text style={[styles.productDesc, { color: colors.mutedForeground }]} numberOfLines={1}>{item.description}</Text>
              ) : null}
              <View style={styles.priceRow}>
                <Text style={[styles.productPrice, { color: colors.primary }]}>₹{item.price}</Text>
                <View style={[styles.stockPill, { backgroundColor: item.stock > 5 ? colors.success + "20" : item.stock > 0 ? "#FFA000" + "20" : colors.destructive + "20" }]}>
                  <Text style={[styles.productStock, { color: item.stock > 5 ? colors.success : item.stock > 0 ? "#FFA000" : colors.destructive }]}>
                    {item.stock} in stock
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.productActions}>
              <TouchableOpacity
                onPress={() => toggleActive(item.id)}
                style={[styles.actionIcon, { backgroundColor: item.isActive ? colors.success + "20" : colors.muted }]}
              >
                <Feather name={item.isActive ? "eye" : "eye-off"} size={15} color={item.isActive ? colors.success : colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => openEdit(item)}
                style={[styles.actionIcon, { backgroundColor: colors.primary + "15" }]}
              >
                <Feather name="edit-2" size={15} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                style={[styles.actionIcon, { backgroundColor: colors.destructive + "15" }]}
              >
                <Feather name="trash-2" size={15} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: "100%" }}>
            <ScrollView style={[styles.modalContent, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  {editProduct ? "Edit Product" : "Add New Product"}
                </Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Feather name="x" size={22} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              {/* Product Type Toggle */}
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Sold By</Text>
                <View style={[styles.typeToggle, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={[styles.typeBtn, { backgroundColor: !form.isWeightBased ? colors.primary : "transparent" }]}
                    onPress={() => setForm((f) => ({ ...f, isWeightBased: false, unit: "piece" }))}
                  >
                    <Feather name="package" size={14} color={!form.isWeightBased ? "#fff" : colors.mutedForeground} />
                    <Text style={[styles.typeBtnText, { color: !form.isWeightBased ? "#fff" : colors.mutedForeground }]}>Unit / Pack</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeBtn, { backgroundColor: form.isWeightBased ? colors.primary : "transparent" }]}
                    onPress={() => setForm((f) => ({ ...f, isWeightBased: true, unit: "kg" }))}
                  >
                    <Feather name="sliders" size={14} color={form.isWeightBased ? "#fff" : colors.mutedForeground} />
                    <Text style={[styles.typeBtnText, { color: form.isWeightBased ? "#fff" : colors.mutedForeground }]}>Weight (kg/L)</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Product Name *</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                  placeholder="e.g. Amul Milk 500ml"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                />
              </View>

              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Description</Text>
                <TextInput
                  style={[styles.fieldInput, styles.descInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                  placeholder="Brief description for customers..."
                  placeholderTextColor={colors.mutedForeground}
                  value={form.description}
                  onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Price (₹) *</Text>
                  <TextInput
                    style={[styles.fieldInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                    placeholder="0"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="numeric"
                    value={form.price}
                    onChangeText={(v) => setForm((f) => ({ ...f, price: v }))}
                  />
                </View>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Stock Qty</Text>
                  <TextInput
                    style={[styles.fieldInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                    placeholder="0"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="numeric"
                    value={form.stock}
                    onChangeText={(v) => setForm((f) => ({ ...f, stock: v }))}
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Unit {form.isWeightBased ? "(weight unit)" : "(per item unit)"}
                </Text>
                <View style={styles.chipsRow}>
                  {(form.isWeightBased
                    ? ["kg", "g", "litre", "ml"]
                    : ["piece", "packet", "pack", "bag", "box", "bar", "loaf", "tube"]
                  ).map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[
                        styles.chip,
                        { backgroundColor: form.unit === u ? colors.primary : colors.muted, borderColor: form.unit === u ? colors.primary : colors.border },
                      ]}
                      onPress={() => setForm((f) => ({ ...f, unit: u }))}
                    >
                      <Text style={[styles.chipText, { color: form.unit === u ? "#fff" : colors.foreground }]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Category</Text>
                <View style={styles.chipsRow}>
                  {CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.chip,
                        { backgroundColor: form.category === c ? colors.primary : colors.muted, borderColor: form.category === c ? colors.primary : colors.border },
                      ]}
                      onPress={() => setForm((f) => ({ ...f, category: c }))}
                    >
                      <Text style={[styles.chipText, { color: form.category === c ? "#fff" : colors.foreground }]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: form.name && form.price ? colors.primary : colors.muted, marginBottom: 32 }]}
                onPress={handleSave}
                disabled={!form.name || !form.price}
              >
                <Feather name={editProduct ? "check" : "plus"} size={18} color={form.name && form.price ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.saveBtnText, { color: form.name && form.price ? "#fff" : colors.mutedForeground }]}>
                  {editProduct ? "Save Changes" : "Add Product"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    textAlign: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  catScroll: {
    marginBottom: 4,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  productCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  productIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  outOfStockBadge: {
    position: "absolute",
    bottom: -4,
    left: -4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  outOfStockText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  weightBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  weightBadgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  productInfo: { flex: 1, gap: 2 },
  productNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  inactivePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inactivePillText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  productMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  productDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  stockPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  productStock: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  productActions: {
    flexDirection: "column",
    gap: 6,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  typeToggle: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  formField: { gap: 6, marginBottom: 14 },
  formRow: { flexDirection: "row", gap: 10 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  fieldInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  descInput: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 11,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
