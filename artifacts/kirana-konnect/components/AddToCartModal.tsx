import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
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

function getUnitOptions(product: Product): WeightUnit[] {
  const u = product.unit.toLowerCase();
  if (u === "litre" || u === "liter" || u === "ml") return ["litre", "ml"];
  return ["kg", "gram"];
}

function computePrice(product: Product, value: number, unit: WeightUnit): number {
  const pricePerKg = product.price;
  let grams = 0;
  if (unit === "kg") grams = value * 1000;
  else if (unit === "gram") grams = value;
  else if (unit === "litre") grams = value * 1000;
  else if (unit === "ml") grams = value;
  return Math.round((pricePerKg * grams) / 1000);
}

function computeWeight(product: Product, price: number, unit: WeightUnit): number {
  const pricePerKg = product.price;
  if (pricePerKg === 0) return 0;
  const grams = (price / pricePerKg) * 1000;
  if (unit === "kg") return parseFloat((grams / 1000).toFixed(3));
  else if (unit === "gram") return Math.round(grams);
  else if (unit === "litre") return parseFloat((grams / 1000).toFixed(3));
  else return Math.round(grams);
}

function formatWeightLabel(value: number, unit: WeightUnit): string {
  if (unit === "kg" || unit === "litre") {
    return `${parseFloat(value.toFixed(3))} ${unit === "litre" ? "L" : "kg"}`;
  }
  return `${value} ${unit === "ml" ? "ml" : "g"}`;
}

export default function AddToCartModal({ product, cartItem, visible, onClose }: Props) {
  const colors = useColors();
  const { addToCart, updateQuantity } = useApp();
  const slideAnim = useRef(new Animated.Value(400)).current;

  const [tab, setTab] = useState<"weight" | "price">("weight");
  const [weightInput, setWeightInput] = useState("500");
  const [priceInput, setPriceInput] = useState("30");
  const [selectedUnit, setSelectedUnit] = useState<WeightUnit>("kg");
  const [qty, setQty] = useState(1);

  const isEditing = !!cartItem;
  const unitOptions = product ? getUnitOptions(product) : (["kg", "gram"] as WeightUnit[]);
  const isLiquid = unitOptions[0] === "litre";

  useEffect(() => {
    if (visible && product) {
      const opts = getUnitOptions(product);
      setSelectedUnit(opts[0]);
      setTab("weight");
      setQty(cartItem?.quantity || 1);
      setWeightInput("500");
      setPriceInput(product.price.toString());
    }
  }, [visible, product?.id]);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: false,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [visible]);

  if (!product) return null;

  const weightValue = parseFloat(weightInput) || 0;
  const priceValue = parseFloat(priceInput) || 0;

  const calculatedPriceFromWeight = computePrice(product, weightValue, selectedUnit);
  const calculatedWeightFromPrice = computeWeight(product, priceValue, selectedUnit);

  const isWeightValid = weightValue > 0 && calculatedPriceFromWeight > 0;
  const isPriceValid = priceValue > 0;

  const handleAddByWeight = () => {
    if (!isWeightValid) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const label = formatWeightLabel(weightValue, selectedUnit);
    addToCart(product, { selectedWeight: label, priceOverride: calculatedPriceFromWeight });
    if (qty > 1) updateQuantity(product.id, qty);
    onClose();
  };

  const handleAddByPrice = () => {
    if (!isPriceValid) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const label = formatWeightLabel(calculatedWeightFromPrice, selectedUnit);
    addToCart(product, { selectedWeight: label, priceOverride: priceValue });
    if (qty > 1) updateQuantity(product.id, qty);
    onClose();
  };

  const totalAmount = tab === "weight"
    ? calculatedPriceFromWeight * qty
    : priceValue * qty;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); onClose(); }}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[styles.sheet, { backgroundColor: colors.background, transform: [{ translateY: slideAnim }] }]}
        >
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
                By {isLiquid ? "Volume" : "Weight"}
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

          <View style={styles.body}>
            {tab === "weight" ? (
              <>
                {/* Weight entry */}
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                  Enter {isLiquid ? "volume" : "weight"}
                </Text>
                <View style={styles.inputRow}>
                  <View style={[styles.inputBox, { borderColor: colors.primary, backgroundColor: colors.muted }]}>
                    <TextInput
                      style={[styles.input, { color: colors.foreground }]}
                      value={weightInput}
                      onChangeText={setWeightInput}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 500"
                      placeholderTextColor={colors.mutedForeground}
                      selectTextOnFocus
                    />
                  </View>
                  {/* Unit selector */}
                  <View style={styles.unitRow}>
                    {unitOptions.map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[
                          styles.unitBtn,
                          {
                            backgroundColor: selectedUnit === u ? colors.primary : colors.muted,
                            borderColor: selectedUnit === u ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => {
                          setSelectedUnit(u);
                          if (Platform.OS !== "web") Haptics.selectionAsync();
                        }}
                      >
                        <Text style={[styles.unitLabel, { color: selectedUnit === u ? "#fff" : colors.foreground }]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Auto price result */}
                <View style={[styles.resultCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>
                      Price for {weightValue > 0 ? `${weightInput} ${selectedUnit}` : "—"}
                    </Text>
                    <Text style={[styles.resultValue, { color: colors.primary }]}>
                      {isWeightValid ? `₹${calculatedPriceFromWeight}` : "—"}
                    </Text>
                  </View>
                  <Feather name="arrow-right" size={18} color={colors.primary} style={{ opacity: 0.5 }} />
                </View>
              </>
            ) : (
              <>
                {/* Price entry */}
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                  Enter amount to spend
                </Text>
                <View style={styles.inputRow}>
                  <View style={[styles.inputBoxWide, { borderColor: colors.primary, backgroundColor: colors.muted }]}>
                    <Text style={[styles.rupeeSymbol, { color: colors.primary }]}>₹</Text>
                    <TextInput
                      style={[styles.input, { color: colors.foreground, flex: 1 }]}
                      value={priceInput}
                      onChangeText={setPriceInput}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 50"
                      placeholderTextColor={colors.mutedForeground}
                      selectTextOnFocus
                    />
                  </View>
                  {/* Unit selector for display */}
                  <View style={styles.unitRow}>
                    {unitOptions.map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[
                          styles.unitBtn,
                          {
                            backgroundColor: selectedUnit === u ? colors.primary : colors.muted,
                            borderColor: selectedUnit === u ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => {
                          setSelectedUnit(u);
                          if (Platform.OS !== "web") Haptics.selectionAsync();
                        }}
                      >
                        <Text style={[styles.unitLabel, { color: selectedUnit === u ? "#fff" : colors.foreground }]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Auto weight result */}
                <View style={[styles.resultCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>
                      You will get for ₹{priceValue > 0 ? priceValue : "—"}
                    </Text>
                    <Text style={[styles.resultValue, { color: colors.primary }]}>
                      {isPriceValid ? formatWeightLabel(calculatedWeightFromPrice, selectedUnit) : "—"}
                    </Text>
                  </View>
                  <Feather name="arrow-right" size={18} color={colors.primary} style={{ opacity: 0.5 }} />
                </View>
              </>
            )}

            {/* Quantity */}
            <View style={styles.qtyRow}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginBottom: 0 }]}>Qty</Text>
              <View style={styles.qtyCtrl}>
                <TouchableOpacity
                  style={[styles.qtyBtn, { borderColor: colors.border, backgroundColor: colors.muted }]}
                  onPress={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Feather name="minus" size={16} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.qtyNum, { color: colors.foreground }]}>{qty}</Text>
                <TouchableOpacity
                  style={[styles.qtyBtn, { borderColor: colors.border, backgroundColor: colors.muted }]}
                  onPress={() => setQty((q) => q + 1)}
                >
                  <Feather name="plus" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom total + button */}
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <View>
                <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>
                  {tab === "weight"
                    ? (isWeightValid ? `${weightInput} ${selectedUnit} × ${qty}` : "—")
                    : (isPriceValid ? `₹${priceValue} × ${qty}` : "—")}
                </Text>
                <Text style={[styles.totalPrice, { color: colors.foreground }]}>
                  {totalAmount > 0 ? `₹${totalAmount}` : "—"}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.addBtn,
                  {
                    backgroundColor: (tab === "weight" ? isWeightValid : isPriceValid) ? colors.primary : colors.muted,
                  },
                ]}
                onPress={tab === "weight" ? handleAddByWeight : handleAddByPrice}
                disabled={tab === "weight" ? !isWeightValid : !isPriceValid}
              >
                <Feather name="shopping-cart" size={16} color="#fff" />
                <Text style={styles.addBtnText}>{isEditing ? "Update Cart" : "Add to Cart"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D0D0D0",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  productMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  body: {
    paddingHorizontal: 20,
    gap: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  inputBox: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputBoxWide: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rupeeSymbol: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  input: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    padding: 0,
    margin: 0,
  },
  unitRow: {
    flexDirection: "column",
    gap: 6,
  },
  unitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    minWidth: 60,
  },
  unitLabel: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  resultLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  resultValue: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  qtyCtrl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  qtyBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyNum: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    minWidth: 28,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
