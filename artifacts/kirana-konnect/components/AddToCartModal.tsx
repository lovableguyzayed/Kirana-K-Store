import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { CartItem, Product, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  product: Product | null;
  cartItem?: CartItem;
  visible: boolean;
  onClose: () => void;
}

type InputMethod = "quantity" | "price";
type WeightUnit = "kg" | "gm" | "L" | "ml";

function isLiquid(unit: string) {
  const u = unit.toLowerCase();
  return u === "litre" || u === "liter" || u === "l" || u === "ml";
}

function getUnits(unit: string): [WeightUnit, WeightUnit] {
  return isLiquid(unit) ? ["L", "ml"] : ["kg", "gm"];
}

function toBaseKg(value: number, unit: WeightUnit): number {
  if (unit === "gm") return value / 1000;
  if (unit === "ml") return value / 1000;
  return value;
}

function fmtQty(value: number, unit: WeightUnit): string {
  return `${value % 1 === 0 ? value : parseFloat(value.toFixed(3))} ${unit}`;
}

export default function AddToCartModal({ product, cartItem, visible, onClose }: Props) {
  const colors = useColors();
  const { addToCart, replaceCart, cartShopId, updateQuantity } = useApp();
  const isEditing = !!cartItem;

  const [method, setMethod] = useState<InputMethod>("quantity");
  const [qtyInput, setQtyInput] = useState("1");
  const [unitSel, setUnitSel] = useState<WeightUnit>("kg");
  const [priceInput, setPriceInput] = useState("");

  useEffect(() => {
    if (visible && product) {
      const [big] = getUnits(product.unit);
      setMethod("quantity");
      setQtyInput("1");
      setUnitSel(big);
      setPriceInput(String(product.price));
    }
  }, [visible, product?.id]);

  if (!product) return null;

  const liquid = isLiquid(product.unit);
  const [bigUnit, smallUnit] = getUnits(product.unit);
  const pPerKg = product.price;

  const rawQty = parseFloat(qtyInput) || 0;
  const baseQty = toBaseKg(rawQty, unitSel);
  const calcPrice = Math.round(baseQty * pPerKg * 100) / 100;

  const rawPrice = parseFloat(priceInput) || 0;
  const calcBaseQty = rawPrice > 0 ? rawPrice / pPerKg : 0;
  const calcQtyDisplay = calcBaseQty >= 1
    ? fmtQty(parseFloat(calcBaseQty.toFixed(3)), bigUnit)
    : fmtQty(Math.round(calcBaseQty * 1000), smallUnit);

  const summaryQty = method === "quantity"
    ? (rawQty > 0 ? fmtQty(rawQty, unitSel) : "—")
    : (rawPrice > 0 ? calcQtyDisplay : "—");

  const summaryPrice = method === "quantity"
    ? (rawQty > 0 ? `₹${calcPrice}` : "—")
    : (rawPrice > 0 ? `₹${rawPrice}` : "—");

  const canAdd = method === "quantity" ? rawQty > 0 : rawPrice > 0;

  const selectedWeight = method === "quantity" ? fmtQty(rawQty, unitSel) : calcQtyDisplay;
  const priceOverride = method === "quantity" ? calcPrice : rawPrice;

  function handleAdd() {
    if (!canAdd || !product) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const isCrossShop = !isEditing && cartShopId && cartShopId !== product.shopId;

    if (isCrossShop) {
      replaceCart(product as Product, { selectedWeight, priceOverride });
    } else if (isEditing) {
      updateQuantity(product.id, cartItem!.quantity);
      addToCart(product as Product, { selectedWeight, priceOverride });
    } else {
      addToCart(product as Product, { selectedWeight, priceOverride });
    }
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose} />

      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={styles.handle} />

        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {isEditing ? "Update Cart" : "Add to Cart"}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.muted }]}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <Feather name="x" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={[styles.productRow, { backgroundColor: colors.muted, borderRadius: 10 }]}>
            <View style={[styles.productIcon, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="package" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={[styles.productPrice, { color: colors.mutedForeground }]}>
                ₹{product.price}/{product.unit}
              </Text>
              <Text style={[styles.productStock, { color: "#10b981" }]}>
                {product.stock} {product.unit}s in stock
              </Text>
            </View>
          </View>

          <View>
            <Text style={[styles.label, { color: colors.foreground }]}>Select Input Method</Text>
            <View style={styles.methodList}>
              {(["quantity", "price"] as InputMethod[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.methodRow,
                    {
                      backgroundColor: colors.muted,
                      borderColor: method === m ? colors.primary : "transparent",
                      borderWidth: 1.5,
                    },
                  ]}
                  onPress={() => {
                    setMethod(m);
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                  }}
                  accessibilityLabel={m === "quantity" ? "Enter quantity" : "Enter price"}
                  accessibilityRole="radio"
                >
                  <View style={[styles.radioOuter, { borderColor: method === m ? colors.primary : colors.mutedForeground }]}>
                    {method === m && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                  </View>
                  <Text style={[styles.methodLabel, { color: colors.foreground }]}>
                    {m === "quantity" ? "Enter Quantity" : "Enter Price"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {method === "quantity" ? (
            <View>
              <Text style={[styles.label, { color: colors.foreground }]}>Quantity</Text>
              <View style={styles.inputRow}>
                <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                  <TextInput
                    style={[styles.inputField, { color: colors.foreground }]}
                    value={qtyInput}
                    onChangeText={setQtyInput}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.mutedForeground}
                    selectTextOnFocus
                    accessibilityLabel="Quantity"
                  />
                </View>
                <View style={[styles.unitPicker, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                  {([bigUnit, smallUnit] as WeightUnit[]).map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[styles.unitOption, { backgroundColor: unitSel === u ? colors.primary : "transparent" }]}
                      onPress={() => setUnitSel(u)}
                      accessibilityLabel={u}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.unitText, { color: unitSel === u ? "#fff" : colors.mutedForeground }]}>
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <View>
              <Text style={[styles.label, { color: colors.foreground }]}>Price</Text>
              <View style={[styles.priceInputRow, { borderColor: colors.primary, backgroundColor: colors.muted }]}>
                <Text style={[styles.rupeeSign, { color: colors.mutedForeground }]}>₹</Text>
                <TextInput
                  style={[styles.priceField, { color: colors.foreground }]}
                  value={priceInput}
                  onChangeText={setPriceInput}
                  keyboardType="decimal-pad"
                  placeholder="Enter amount"
                  placeholderTextColor={colors.mutedForeground}
                  selectTextOnFocus
                  accessibilityLabel="Price amount"
                />
              </View>
            </View>
          )}

          <View style={[styles.summaryBox, { backgroundColor: "#eff6ff" }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryKey, { color: "#64748b" }]}>Quantity:</Text>
              <Text style={[styles.summaryVal, { color: "#1e293b" }]}>{summaryQty}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryKey, { color: "#64748b" }]}>Total Price:</Text>
              <Text style={[styles.summaryPrice, { color: "#10b981" }]}>{summaryPrice}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: colors.muted }]}
              onPress={onClose}
              accessibilityLabel="Cancel"
              accessibilityRole="button"
            >
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: canAdd ? colors.primary : colors.mutedForeground + "60" }]}
              onPress={handleAdd}
              disabled={!canAdd}
              accessibilityLabel={isEditing ? "Update cart" : "Add to cart"}
              accessibilityRole="button"
            >
              <Feather name="shopping-cart" size={15} color={canAdd ? "#fff" : colors.mutedForeground} />
              <Text style={[styles.addText, { color: canAdd ? "#fff" : colors.mutedForeground }]}>
                {isEditing ? "Update Cart" : "Add to Cart"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#D0D0D0", alignSelf: "center", marginTop: 12, marginBottom: 4 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  closeBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  productRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  productIcon: { width: 48, height: 48, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  productName: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  productPrice: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  productStock: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 1 },
  label: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  methodList: { gap: 8 },
  methodRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10 },
  radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioInner: { width: 9, height: 9, borderRadius: 4.5 },
  methodLabel: { fontSize: 13, fontWeight: "500", fontFamily: "Inter_500Medium" },
  inputRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  inputBox: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  inputField: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", padding: 0 },
  unitPicker: { borderRadius: 10, borderWidth: 1.5, overflow: "hidden", flexDirection: "column" },
  unitOption: { paddingHorizontal: 14, paddingVertical: 8, alignItems: "center" },
  unitText: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },
  priceInputRow: { flexDirection: "row", alignItems: "center", borderWidth: 2, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
  rupeeSign: { fontSize: 18, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  priceField: { flex: 1, fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", padding: 0 },
  summaryBox: { borderRadius: 12, padding: 14, gap: 8 },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  summaryKey: { fontSize: 13, fontFamily: "Inter_400Regular" },
  summaryVal: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  summaryPrice: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  actions: { flexDirection: "row", gap: 12, paddingBottom: 4 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  addBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  addText: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
