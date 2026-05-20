import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Product, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

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

  const { shopProducts, addProduct, updateProduct, deleteProduct, toggleProductActive, currentUser } = useApp();
  const shopId = currentUser?.shopId ?? "s1";
  const products = (shopProducts[shopId] ?? []) as Product[];

  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [form, setForm] = useState({
    name: "", price: "", stock: "", unit: "piece",
    category: "Grocery", description: "", isWeightBased: false,
  });

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((p) => p.isActive !== false).length,
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

  const openEdit = (product: Product) => {
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
      updateProduct(shopId, editProduct.id, {
        name: form.name,
        price: Number(form.price),
        stock: Number(form.stock),
        unit: form.unit,
        category: form.category,
        description: form.description,
        isWeightBased: form.isWeightBased,
      });
    } else {
      addProduct(shopId, {
        name: form.name,
        price: Number(form.price),
        stock: Number(form.stock),
        unit: form.unit,
        category: form.category,
        description: form.description,
        isWeightBased: form.isWeightBased,
        isActive: true,
      });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            deleteProduct(shopId, id);
          },
        },
      ]
    );
  };

  const handleToggleActive = (id: string) => {
    toggleProductActive(shopId, id);
  };

  const allCats = ["All", ...CATEGORIES];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.foreground }]}>Inventory</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={openAdd}
            accessibilityLabel="Add new product"
            accessibilityRole="button"
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add Product</Text>
          </TouchableOpacity>
        </View>

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

        <View style={[styles.searchBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search products..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search products"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} accessibilityLabel="Clear search" accessibilityRole="button">
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

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
              accessibilityLabel={`Filter by ${cat}`}
              accessibilityRole="button"
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
        renderItem={({ item }) => {
          const isActive = item.isActive !== false;
          return (
            <View
              style={[
                styles.productCard,
                {
                  backgroundColor: colors.card,
                  borderColor: item.stock === 0 ? colors.destructive + "40" : colors.border,
                  opacity: isActive ? 1 : 0.6,
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
                  {!isActive && (
                    <View style={[styles.inactivePill, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.inactivePillText, { color: colors.mutedForeground }]}>Hidden</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.productMeta, { color: colors.mutedForeground }]}>
                  {item.category} · {item.unit}{item.isWeightBased ? " (weight)" : ""}
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
                  onPress={() => handleToggleActive(item.id)}
                  style={[styles.actionIcon, { backgroundColor: isActive ? colors.success + "20" : colors.muted }]}
                  accessibilityLabel={isActive ? "Hide product" : "Show product"}
                  accessibilityRole="button"
                >
                  <Feather name={isActive ? "eye" : "eye-off"} size={15} color={isActive ? colors.success : colors.mutedForeground} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openEdit(item)}
                  style={[styles.actionIcon, { backgroundColor: colors.primary + "15" }]}
                  accessibilityLabel={`Edit ${item.name}`}
                  accessibilityRole="button"
                >
                  <Feather name="edit-2" size={15} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id, item.name)}
                  style={[styles.actionIcon, { backgroundColor: colors.destructive + "15" }]}
                  accessibilityLabel={`Delete ${item.name}`}
                  accessibilityRole="button"
                >
                  <Feather name="trash-2" size={15} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <Modal visible={showModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <View style={{ width: "100%" }} onStartShouldSetResponder={() => true}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: "100%" }}>
            <ScrollView style={[styles.modalContent, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  {editProduct ? "Edit Product" : "Add New Product"}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  accessibilityLabel="Close"
                  accessibilityRole="button"
                >
                  <Feather name="x" size={22} color={colors.foreground} />
                </TouchableOpacity>
              </View>

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
                  accessibilityLabel="Product name"
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
                  accessibilityLabel="Product description"
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
                    accessibilityLabel="Product price"
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
                    accessibilityLabel="Stock quantity"
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
                accessibilityLabel={editProduct ? "Save changes" : "Add product"}
                accessibilityRole="button"
              >
                <Feather name={editProduct ? "check" : "plus"} size={18} color={form.name && form.price ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.saveBtnText, { color: form.name && form.price ? "#fff" : colors.mutedForeground }]}>
                  {editProduct ? "Save Changes" : "Add Product"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 8, gap: 12 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 22, fontWeight: "800", fontFamily: "Inter_700Bold" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: "center", gap: 4 },
  statValue: { fontSize: 20, fontWeight: "800", fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_500Medium", fontWeight: "500", textAlign: "center" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", padding: 0 },
  catScroll: { marginBottom: 4 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  catChipText: { fontSize: 12, fontFamily: "Inter_500Medium", fontWeight: "500" },
  emptyState: { alignItems: "center", gap: 12, paddingVertical: 48 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
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
  productIcon: { width: 50, height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", position: "relative" },
  outOfStockBadge: { position: "absolute", bottom: -4, left: -4, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  outOfStockText: { color: "#fff", fontSize: 8, fontWeight: "700" },
  weightBadge: { position: "absolute", bottom: -4, right: -4, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  weightBadgeText: { color: "#fff", fontSize: 8, fontWeight: "700" },
  productInfo: { flex: 1, gap: 3 },
  productNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  productName: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold", flex: 1 },
  inactivePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  inactivePillText: { fontSize: 10, fontFamily: "Inter_500Medium", fontWeight: "500" },
  productMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  productDesc: { fontSize: 11, fontFamily: "Inter_400Regular" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  productPrice: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  stockPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  productStock: { fontSize: 11, fontFamily: "Inter_500Medium", fontWeight: "500" },
  productActions: { flexDirection: "column", gap: 6 },
  actionIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, maxHeight: "92%" },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#D0D0D0", alignSelf: "center", marginTop: 12, marginBottom: 8 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, marginTop: 4 },
  modalTitle: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  formField: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  fieldInput: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  descInput: { minHeight: 80, textAlignVertical: "top" },
  formRow: { flexDirection: "row", gap: 12 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: "Inter_500Medium", fontWeight: "500" },
  typeToggle: { flexDirection: "row", borderRadius: 12, borderWidth: 1, overflow: "hidden", padding: 4, gap: 4 },
  typeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 8 },
  typeBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", fontWeight: "500" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14 },
  saveBtnText: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
