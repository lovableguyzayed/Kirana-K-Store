import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { isShopCurrentlyOpen } from "@/utils/shopUtils";

const ADDRESSES = [
  { id: "a1", label: "Home", address: "Block A-204, Sector 5, Noida, UP 201301" },
  { id: "a2", label: "Work", address: "DLF Cybercity, Gurugram, HR 122002" },
];

export default function CheckoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cart, cartTotal, deliveryMode, selectedShop, placeOrder } = useApp();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const [selectedAddress, setSelectedAddress] = useState(ADDRESSES[0]);
  const [customAddress, setCustomAddress] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi">("cod");
  const [placing, setPlacing] = useState(false);
  const customAddressRef = useRef<TextInput>(null);

  const deliveryFee = deliveryMode === "delivery" ? (cartTotal < 200 ? 30 : 0) : 0;
  const grandTotal = cartTotal + deliveryFee;

  const finalAddress = useCustom ? customAddress : selectedAddress.address;

  const handlePlaceOrder = () => {
    if (deliveryMode === "delivery" && !finalAddress.trim()) {
      setAddressError("Please enter a delivery address");
      if (useCustom) customAddressRef.current?.focus();
      return;
    }
    setAddressError(null);

    if (selectedShop && !isShopCurrentlyOpen(selectedShop)) {
      Alert.alert(
        "Store Closed",
        "This store is currently closed and cannot accept new orders.",
        [{ text: "OK" }]
      );
      return;
    }

    if (!selectedShop) {
      Alert.alert("No Store Selected", "Please go back and select a store.");
      return;
    }

    setPlacing(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      try {
        const order = placeOrder(finalAddress.trim(), paymentMethod);
        setPlacing(false);
        router.replace({ pathname: "/tracking/[id]", params: { id: order.id } });
      } catch {
        setPlacing(false);
        Alert.alert("Error", "Could not place order. Please try again.");
      }
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Checkout</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 160 }}>
        {deliveryMode === "delivery" && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Delivery Address</Text>
            {ADDRESSES.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                style={[
                  styles.addressCard,
                  {
                    backgroundColor: !useCustom && selectedAddress.id === addr.id ? colors.primary + "10" : colors.card,
                    borderColor: !useCustom && selectedAddress.id === addr.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => { setSelectedAddress(addr); setUseCustom(false); setAddressError(null); }}
                accessibilityLabel={`Select ${addr.label} address`}
                accessibilityRole="radio"
              >
                <View style={[styles.addrIcon, { backgroundColor: !useCustom && selectedAddress.id === addr.id ? colors.primary : colors.muted }]}>
                  <Feather name={addr.label === "Home" ? "home" : "briefcase"} size={16} color={!useCustom && selectedAddress.id === addr.id ? "#fff" : colors.mutedForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.addrLabel, { color: colors.foreground }]}>{addr.label}</Text>
                  <Text style={[styles.addrText, { color: colors.mutedForeground }]}>{addr.address}</Text>
                </View>
                {!useCustom && selectedAddress.id === addr.id && (
                  <Feather name="check-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                styles.addressCard,
                {
                  backgroundColor: useCustom ? colors.primary + "10" : colors.card,
                  borderColor: useCustom ? colors.primary : colors.border,
                },
              ]}
              onPress={() => { setUseCustom(true); setTimeout(() => customAddressRef.current?.focus(), 100); }}
              accessibilityLabel="Enter custom address"
              accessibilityRole="radio"
            >
              <View style={[styles.addrIcon, { backgroundColor: useCustom ? colors.primary : colors.muted }]}>
                <Feather name="edit-2" size={16} color={useCustom ? "#fff" : colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.addrLabel, { color: colors.foreground }]}>Enter address</Text>
                {useCustom ? (
                  <TextInput
                    ref={customAddressRef}
                    style={[styles.customAddrInput, { color: colors.foreground }]}
                    placeholder="Type your full address..."
                    placeholderTextColor={colors.mutedForeground}
                    value={customAddress}
                    onChangeText={(v) => { setCustomAddress(v); if (v.trim()) setAddressError(null); }}
                    multiline
                    accessibilityLabel="Delivery address"
                    accessibilityHint="Enter your full delivery address"
                  />
                ) : (
                  <Text style={[styles.addrText, { color: colors.mutedForeground }]}>Type a different address</Text>
                )}
              </View>
              {useCustom && <Feather name="check-circle" size={20} color={colors.primary} />}
            </TouchableOpacity>

            {addressError && (
              <Text style={styles.errorText}>{addressError}</Text>
            )}
          </View>
        )}

        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Payment Method</Text>
          <View style={{ gap: 10 }}>
            {[
              { id: "cod" as const, label: "Cash on Delivery", icon: "dollar-sign" as const, desc: "Pay when you receive" },
              { id: "upi" as const, label: "UPI", icon: "smartphone" as const, desc: "GPay, PhonePe, Paytm" },
            ].map((pm) => (
              <TouchableOpacity
                key={pm.id}
                style={[
                  styles.payCard,
                  {
                    backgroundColor: paymentMethod === pm.id ? colors.primary + "10" : colors.card,
                    borderColor: paymentMethod === pm.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setPaymentMethod(pm.id)}
                accessibilityLabel={`Pay with ${pm.label}`}
                accessibilityRole="radio"
              >
                <View style={[styles.payIcon, { backgroundColor: paymentMethod === pm.id ? colors.primary : colors.muted }]}>
                  <Feather name={pm.icon} size={18} color={paymentMethod === pm.id ? "#fff" : colors.mutedForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.payLabel, { color: colors.foreground }]}>{pm.label}</Text>
                  <Text style={[styles.payDesc, { color: colors.mutedForeground }]}>{pm.desc}</Text>
                </View>
                {paymentMethod === pm.id && (
                  <Feather name="check-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.orderSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Order Summary</Text>
          <Text style={[styles.shopFrom, { color: colors.mutedForeground }]}>From: {selectedShop?.name || "Shop"}</Text>
          {cart.map((item) => (
            <View key={item.id} style={styles.summaryRow}>
              <Text style={[styles.summaryItemName, { color: colors.foreground }]} numberOfLines={1}>
                {item.quantity}× {item.name}
              </Text>
              <Text style={[styles.summaryItemPrice, { color: colors.foreground }]}>₹{item.price * item.quantity}</Text>
            </View>
          ))}
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Subtotal</Text>
            <Text style={[styles.summaryVal, { color: colors.foreground }]}>₹{cartTotal}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Delivery Fee</Text>
            <Text style={[styles.summaryVal, { color: deliveryFee === 0 ? colors.success : colors.foreground }]}>
              {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
            </Text>
          </View>
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
            <Text style={[styles.totalVal, { color: colors.primary }]}>₹{grandTotal}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.placeOrderBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 12 }]}>
        <TouchableOpacity
          style={[styles.placeOrderBtn, { backgroundColor: colors.primary }]}
          onPress={handlePlaceOrder}
          disabled={placing}
          activeOpacity={0.85}
          accessibilityLabel={`Place order — ₹${grandTotal}`}
          accessibilityRole="button"
        >
          {placing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order · ₹{grandTotal}</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  sectionTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 10 },
  addressCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  addrIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addrLabel: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  addrText: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 16 },
  customAddrInput: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    minHeight: 40,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: -4,
    marginBottom: 4,
  },
  payCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  payIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  payLabel: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  payDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  orderSummary: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  shopFrom: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 6 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryItemName: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  summaryItemPrice: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginLeft: 8 },
  summaryDivider: { height: 1, marginVertical: 4 },
  summaryLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  summaryVal: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 2,
  },
  totalLabel: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  totalVal: { fontSize: 18, fontWeight: "800", fontFamily: "Inter_700Bold" },
  placeOrderBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  placeOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    borderRadius: 16,
  },
  placeOrderText: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
