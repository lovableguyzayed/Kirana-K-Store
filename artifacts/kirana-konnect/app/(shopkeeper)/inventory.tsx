import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  { id: "i1", name: "Amul Milk 500ml", price: 25, unit: "packet", stock: 50, shopId: "s1", shopName: "Gupta Kirana", category: "Dairy", isActive: true },
  { id: "i2", name: "Fortune Basmati Rice 5kg", price: 350, unit: "bag", stock: 20, shopId: "s1", shopName: "Gupta Kirana", category: "Grocery", isActive: true },
  { id: "i3", name: "Aashirvaad Atta 5kg", price: 260, unit: "bag", stock: 15, shopId: "s1", shopName: "Gupta Kirana", category: "Grocery", isActive: true },
  { id: "i4", name: "Parle-G Biscuits", price: 10, unit: "pack", stock: 100, shopId: "s1", shopName: "Gupta Kirana", category: "Snacks", isActive: true },
  { id: "i5", name: "Tata Tea Gold 250g", price: 120, unit: "box", stock: 0, shopId: "s1", shopName: "Gupta Kirana", category: "Beverages", isActive: false },
];

const UNITS = ["piece", "packet", "kg", "bag", "litre", "box", "bar"];
const CATEGORIES = ["Dairy", "Grocery", "Snacks", "Beverages", "Bakery", "Vegetables"];

export default function InventoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 84 : 0);

  const [products, setProducts] = useState<InventoryProduct[]>(INITIAL_PRODUCTS);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<InventoryProduct | null>(null);
  const [form, setForm] = useState({ name: "", price: "", stock: "", unit: "piece", category: "Grocery" });

  const openAdd = () => {
    setEditProduct(null);
    setForm({ name: "", price: "", stock: "", unit: "piece", category: "Grocery" });
    setShowModal(true);
  };

  const openEdit = (product: InventoryProduct) => {
    setEditProduct(product);
    setForm({ name: product.name, price: product.price.toString(), stock: product.stock.toString(), unit: product.unit, category: product.category });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.price) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (editProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editProduct.id
            ? { ...p, name: form.name, price: Number(form.price), stock: Number(form.stock), unit: form.unit, category: form.category }
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Inventory</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={openAdd}
        >
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: bottomPad + 16 }}
        renderItem={({ item }) => (
          <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: item.stock === 0 ? colors.destructive + "40" : colors.border, opacity: item.isActive ? 1 : 0.6 }]}>
            <View style={[styles.productIcon, { backgroundColor: colors.muted }]}>
              <Feather name="package" size={22} color={colors.primary} />
              {item.stock === 0 && (
                <View style={[styles.outOfStock, { backgroundColor: colors.destructive }]}>
                  <Text style={styles.outOfStockText}>Out</Text>
                </View>
              )}
            </View>
            <View style={styles.productInfo}>
              <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.productMeta, { color: colors.mutedForeground }]}>
                {item.category} · {item.unit}
              </Text>
              <View style={styles.priceRow}>
                <Text style={[styles.productPrice, { color: colors.primary }]}>₹{item.price}</Text>
                <Text style={[styles.productStock, { color: item.stock > 5 ? colors.success : colors.destructive }]}>
                  {item.stock} in stock
                </Text>
              </View>
            </View>
            <View style={styles.productActions}>
              <TouchableOpacity onPress={() => toggleActive(item.id)} style={[styles.actionIcon, { backgroundColor: item.isActive ? colors.success + "20" : colors.muted }]}>
                <Feather name={item.isActive ? "eye" : "eye-off"} size={15} color={item.isActive ? colors.success : colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openEdit(item)} style={[styles.actionIcon, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="edit-2" size={15} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionIcon, { backgroundColor: colors.destructive + "15" }]}>
                <Feather name="trash-2" size={15} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  {editProduct ? "Edit Product" : "Add Product"}
                </Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Feather name="x" size={22} color={colors.foreground} />
                </TouchableOpacity>
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
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Stock</Text>
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
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Unit</Text>
                <View style={styles.chipsRow}>
                  {UNITS.map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[styles.chip, { backgroundColor: form.unit === u ? colors.primary : colors.muted, borderColor: form.unit === u ? colors.primary : colors.border }]}
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
                      style={[styles.chip, { backgroundColor: form.category === c ? colors.primary : colors.muted, borderColor: form.category === c ? colors.primary : colors.border }]}
                      onPress={() => setForm((f) => ({ ...f, category: c }))}
                    >
                      <Text style={[styles.chipText, { color: form.category === c ? "#fff" : colors.foreground }]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: form.name && form.price ? colors.primary : colors.muted }]}
                onPress={handleSave}
                disabled={!form.name || !form.price}
              >
                <Text style={[styles.saveBtnText, { color: form.name && form.price ? "#fff" : colors.mutedForeground }]}>
                  {editProduct ? "Save Changes" : "Add Product"}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
    paddingBottom: 16,
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
  outOfStock: {
    position: "absolute",
    bottom: -4,
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
  productInfo: { flex: 1, gap: 2 },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  productMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
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
  productStock: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  productActions: {
    flexDirection: "row",
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
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
    paddingBottom: 36,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  formField: { gap: 6 },
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
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
