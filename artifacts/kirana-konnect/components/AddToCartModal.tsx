import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
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

import { CartItem, Product, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  product: Product | null;
  cartItem?: CartItem;
  visible: boolean;
  onClose: () => void;
}

type WeightUnit = "kg" | "gram" | "litre" | "ml";

function isLiquidProduct(unit: string): boolean {
  const u = unit.toLowerCase();
  return u === "litre" || u === "liter" || u === "ml";
}

function getBigSmall(unit: string): [WeightUnit, WeightUnit] {
  return isLiquidProduct(unit) ? ["litre", "ml"] : ["kg", "gram"];
}

function toGrams(value: number, unit: WeightUnit): number {
  if (unit === "kg" || unit === "litre") return value * 1000;
  return value;
}

function fromGrams(grams: number, unit: WeightUnit): number {
  if (unit === "kg" || unit === "litre") return parseFloat((grams / 1000).toFixed(3));
  return Math.round(grams);
}

function fmtWeight(value: number, unit: WeightUnit): string {
  const u = unit === "litre" ? "L" : unit === "gram" ? "g" : unit;
  return `${value} ${u}`;
}

const WEIGHT_CHIPS = [
  { label: "250 g", grams: 250 },
  { label: "500 g", grams: 500 },
  { label: "1 kg", grams: 1000 },
  { label: "2 kg", grams: 2000 },
];

const VOLUME_CHIPS = [
  { label: "250 ml", grams: 250 },
  { label: "500 ml", grams: 500 },
  { label: "1 L", grams: 1000 },
  { label: "2 L", grams: 2000 },
];

const PRICE_CHIPS = [10, 20, 50, 100, 200];

export default function AddToCartModal({ product, cartItem, visible, onClose }: Props) {
  const colors = useColors();
  const { addToCart, updateQuantity } = useApp();

  const [tab, setTab] = useState<"weight" | "price">("weight");
  const [unit, setUnit] = useState<WeightUnit>("kg");
  const [weightInput, setWeightInput] = useState("500");
  const [priceInput, setPriceInput] = useState("");
  const [quickGrams, setQuickGrams] = useState<number | null>(500);
  const [quickPrice, setQuickPrice] = useState<number | null>(null);
  const [qty, setQty] = useState(1);

  const isEditing = !!cartItem;

  useEffect(() => {
    if (visible && product) {
      const [big] = getBigSmall(product.unit);
      setTab("weight");
      setUnit(big);
      setQty(cartItem?.quantity || 1);
      setQuickGrams(500);
      setWeightInput(big === "kg" || big === "litre" ? "0.5" : "500");
      setQuickPrice(null);
      setPriceInput("");
    }
  }, [visible, product?.id]);

  if (!product) return null;

  const liquid = isLiquidProduct(product.unit);
  const [bigUnit, smallUnit] = getBigSmall(product.unit);
  const quickChips = liquid ? VOLUME_CHIPS : WEIGHT_CHIPS;
  const pPerKg = product.price;

  /* Derived — By Weight */
  const activeGrams = quickGrams !== null
    ? quickGrams
    : toGrams(parseFloat(weightInput) || 0, unit);
  const priceForWeight = Math.round((pPerKg * activeGrams) / 1000);
  const canWeight = activeGrams > 0 && priceForWeight > 0;

  /* Derived — By Price */
  const activePrice = quickPrice !== null ? quickPrice : (parseFloat(priceInput) || 0);
  const gramsForPrice = activePrice > 0 ? (activePrice / pPerKg) * 1000 : 0;
  const weightForPrice = fromGrams(gramsForPrice, unit);
  const canPrice = activePrice > 0;

  const totalAmt = tab === "weight" ? priceForWeight * qty : activePrice * qty;
  const canAdd = tab === "weight" ? canWeight : canPrice;

  function handleAdd() {
    if (!canAdd) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (tab === "weight") {
      const dispVal = unit === bigUnit ? fromGrams(activeGrams, unit) : activeGrams;
      const label = fmtWeight(dispVal, unit);
      addToCart(product as Product, { selectedWeight: label, priceOverride: priceForWeight });
      if (qty > 1) updateQuantity((product as Product).id, qty);
    } else {
      const label = fmtWeight(weightForPrice, unit);
      addToCart(product as Product, { selectedWeight: label, priceOverride: activePrice });
      if (qty > 1) updateQuantity((product as Product).id, qty);
    }
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      {/* backdrop */}
      <Pressable style={styles.overlay} onPress={onClose} />

      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={1}>
              {product.name}
            </Text>
            <Text style={[styles.productMeta, { color: colors.mutedForeground }]}>
              ₹{product.price} per {product.unit} · {product.shopName}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabRow, { backgroundColor: colors.muted }]}>
          <TouchableOpacity
            style={[styles.tabBtn, { backgroundColor: tab === "weight" ? colors.primary : "transparent" }]}
            onPress={() => setTab("weight")}
          >
            <Feather name="sliders" size={13} color={tab === "weight" ? "#fff" : colors.mutedForeground} />
            <Text style={[styles.tabLabel, { color: tab === "weight" ? "#fff" : colors.mutedForeground }]}>
              By {liquid ? "Volume" : "Weight"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, { backgroundColor: tab === "price" ? colors.primary : "transparent" }]}
            onPress={() => setTab("price")}
          >
            <Feather name="tag" size={13} color={tab === "price" ? "#fff" : colors.mutedForeground} />
            <Text style={[styles.tabLabel, { color: tab === "price" ? "#fff" : colors.mutedForeground }]}>
              By Price
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.body}>

            {tab === "weight" ? (
              <>
                {/* Quick chips */}
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Quick select</Text>
                <View style={styles.chipsGrid}>
                  {quickChips.map((c) => {
                    const p = Math.round((pPerKg * c.grams) / 1000);
                    const active = quickGrams === c.grams;
                    return (
                      <TouchableOpacity
                        key={c.label}
                        style={[
                          styles.chip,
                          { backgroundColor: active ? colors.primary : colors.muted, borderColor: active ? colors.primary : colors.border },
                        ]}
                        onPress={() => {
                          setQuickGrams(c.grams);
                          if (Platform.OS !== "web") Haptics.selectionAsync();
                        }}
                      >
                        {active && <Feather name="check" size={11} color="#fff" style={styles.chipCheck} />}
                        <Text style={[styles.chipMain, { color: active ? "#fff" : colors.foreground }]}>{c.label}</Text>
                        <Text style={[styles.chipSub, { color: active ? "rgba(255,255,255,0.75)" : colors.mutedForeground }]}>₹{p}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Divider */}
                <View style={styles.orRow}>
                  <View style={[styles.orLine, { backgroundColor: colors.border }]} />
                  <Text style={[styles.orText, { color: colors.mutedForeground }]}>or enter custom</Text>
                  <View style={[styles.orLine, { backgroundColor: colors.border }]} />
                </View>

                {/* Custom weight input + unit toggle */}
                <View style={styles.inputRow}>
                  <View style={[styles.inputWrap, { borderColor: quickGrams === null ? colors.primary : colors.border, backgroundColor: colors.muted }]}>
                    <TextInput
                      style={[styles.inputField, { color: colors.foreground }]}
                      value={weightInput}
                      onChangeText={(v) => { setWeightInput(v); setQuickGrams(null); }}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 750"
                      placeholderTextColor={colors.mutedForeground}
                      selectTextOnFocus
                    />
                  </View>
                  <View style={[styles.unitToggle, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                    {([bigUnit, smallUnit] as WeightUnit[]).map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[styles.unitBtn, { backgroundColor: unit === u ? colors.primary : "transparent" }]}
                        onPress={() => { setUnit(u); setQuickGrams(null); }}
                      >
                        <Text style={[styles.unitLabel, { color: unit === u ? "#fff" : colors.mutedForeground }]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Calculated price */}
                {canWeight && (
                  <View style={[styles.resultCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                    <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>
                      Price for {fmtWeight(activeGrams >= 1000 ? activeGrams / 1000 : activeGrams, activeGrams >= 1000 ? bigUnit : smallUnit)}
                    </Text>
                    <Text style={[styles.resultValue, { color: colors.primary }]}>₹{priceForWeight}</Text>
                  </View>
                )}
              </>
            ) : (
              <>
                {/* Quick price chips */}
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Quick amounts</Text>
                <View style={styles.chipsGrid}>
                  {PRICE_CHIPS.map((p) => {
                    const grams = (p / pPerKg) * 1000;
                    const wLabel = grams >= 1000
                      ? `${parseFloat((grams / 1000).toFixed(2))} ${liquid ? "L" : "kg"}`
                      : `${Math.round(grams)} ${liquid ? "ml" : "g"}`;
                    const active = quickPrice === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.chip,
                          { backgroundColor: active ? colors.primary : colors.muted, borderColor: active ? colors.primary : colors.border },
                        ]}
                        onPress={() => {
                          setQuickPrice(p);
                          setPriceInput(String(p));
                          if (Platform.OS !== "web") Haptics.selectionAsync();
                        }}
                      >
                        {active && <Feather name="check" size={11} color="#fff" style={styles.chipCheck} />}
                        <Text style={[styles.chipMain, { color: active ? "#fff" : colors.foreground }]}>₹{p}</Text>
                        <Text style={[styles.chipSub, { color: active ? "rgba(255,255,255,0.75)" : colors.mutedForeground }]}>≈ {wLabel}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Divider */}
                <View style={styles.orRow}>
                  <View style={[styles.orLine, { backgroundColor: colors.border }]} />
                  <Text style={[styles.orText, { color: colors.mutedForeground }]}>or enter amount</Text>
                  <View style={[styles.orLine, { backgroundColor: colors.border }]} />
                </View>

                {/* Custom price input */}
                <View style={styles.inputRow}>
                  <View style={[styles.inputWrap, styles.inputWrapFull, { borderColor: quickPrice === null && priceInput ? colors.primary : colors.border, backgroundColor: colors.muted }]}>
                    <Text style={[styles.rupee, { color: colors.primary }]}>₹</Text>
                    <TextInput
                      style={[styles.inputField, { color: colors.foreground, flex: 1 }]}
                      value={priceInput}
                      onChangeText={(v) => { setPriceInput(v); setQuickPrice(null); }}
                      keyboardType="decimal-pad"
                      placeholder="Enter amount"
                      placeholderTextColor={colors.mutedForeground}
                      selectTextOnFocus
                    />
                  </View>
                  <View style={[styles.unitToggle, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                    {([bigUnit, smallUnit] as WeightUnit[]).map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[styles.unitBtn, { backgroundColor: unit === u ? colors.primary : "transparent" }]}
                        onPress={() => setUnit(u)}
                      >
                        <Text style={[styles.unitLabel, { color: unit === u ? "#fff" : colors.mutedForeground }]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Calculated weight */}
                {canPrice && (
                  <View style={[styles.resultCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                    <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>
                      You get for ₹{activePrice}
                    </Text>
                    <Text style={[styles.resultValue, { color: colors.primary }]}>
                      ≈ {fmtWeight(weightForPrice, unit)}
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Quantity row */}
            <View style={styles.qtyRow}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Quantity</Text>
              <View style={styles.qtyCtrl}>
                <TouchableOpacity
                  style={[styles.qtyBtn, { borderColor: colors.border, backgroundColor: colors.muted }]}
                  onPress={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Feather name="minus" size={15} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.qtyNum, { color: colors.foreground }]}>{qty}</Text>
                <TouchableOpacity
                  style={[styles.qtyBtn, { borderColor: colors.border, backgroundColor: colors.muted }]}
                  onPress={() => setQty((q) => q + 1)}
                >
                  <Feather name="plus" size={15} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <View>
                <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>
                  {tab === "weight"
                    ? (canWeight ? `${activeGrams >= 1000 ? activeGrams / 1000 : activeGrams} ${activeGrams >= 1000 ? bigUnit : smallUnit} × ${qty}` : "—")
                    : (canPrice ? `₹${activePrice} × ${qty}` : "—")}
                </Text>
                <Text style={[styles.totalAmt, { color: colors.foreground }]}>
                  {canAdd ? `₹${totalAmt}` : "—"}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: canAdd ? colors.primary : colors.muted }]}
                onPress={handleAdd}
                disabled={!canAdd}
              >
                <Feather name="shopping-cart" size={16} color={canAdd ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.addBtnText, { color: canAdd ? "#fff" : colors.mutedForeground }]}>
                  {isEditing ? "Update Cart" : "Add to Cart"}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 24,
    maxHeight: "88%",
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: "#D0D0D0",
    alignSelf: "center", marginTop: 12, marginBottom: 14,
  },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 12, gap: 12,
  },
  productName: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  productMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
  },
  tabRow: {
    flexDirection: "row", marginHorizontal: 20,
    borderRadius: 14, padding: 4, gap: 4, marginBottom: 18,
  },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6,
    paddingVertical: 10, borderRadius: 11,
  },
  tabLabel: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  body: { paddingHorizontal: 20, gap: 14, paddingBottom: 10 },
  fieldLabel: {
    fontSize: 11, fontFamily: "Inter_500Medium",
    fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.5,
  },
  chipsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    width: "47%", paddingVertical: 13, paddingHorizontal: 12,
    borderRadius: 14, borderWidth: 1.5, alignItems: "center", gap: 4,
    position: "relative",
  },
  chipCheck: { position: "absolute", top: 6, right: 8 },
  chipMain: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  chipSub: { fontSize: 11, fontFamily: "Inter_500Medium", fontWeight: "500" },
  orRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  orLine: { flex: 1, height: 1 },
  orText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  inputRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  inputWrap: {
    flex: 1, borderWidth: 2, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: "row", alignItems: "center",
  },
  inputWrapFull: { flex: 1 },
  rupee: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", marginRight: 4 },
  inputField: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold", padding: 0, margin: 0 },
  unitToggle: {
    flexDirection: "column", borderRadius: 12, borderWidth: 1, overflow: "hidden",
  },
  unitBtn: {
    paddingHorizontal: 13, paddingVertical: 10,
    alignItems: "center", justifyContent: "center",
  },
  unitLabel: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },
  resultCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 12,
  },
  resultLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  resultValue: { fontSize: 22, fontWeight: "800", fontFamily: "Inter_700Bold" },
  qtyRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingTop: 4,
  },
  qtyCtrl: { flexDirection: "row", alignItems: "center", gap: 14 },
  qtyBtn: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },
  qtyNum: {
    fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold",
    minWidth: 28, textAlign: "center",
  },
  footer: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", borderTopWidth: 1, paddingTop: 16, marginTop: 6,
  },
  totalLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  totalAmt: { fontSize: 24, fontWeight: "800", fontFamily: "Inter_700Bold" },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 22, paddingVertical: 14, borderRadius: 14,
  },
  addBtnText: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
