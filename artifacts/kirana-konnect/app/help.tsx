import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const FAQS = [
  {
    q: "How do I find stores near me?",
    a: "Open the Discover tab to see a map of nearby kirana stores. Tap any pin or card to view a store's catalogue and place an order.",
  },
  {
    q: "Can I cancel an order?",
    a: "You can cancel an order while it is in 'Pending' status. Open the tracking screen and tap 'Cancel Order'. Once the shopkeeper accepts, cancellation is no longer available.",
  },
  {
    q: "How does delivery work?",
    a: "After placing an order, the shopkeeper packs your items and dispatches a delivery partner. You can track their location live on the Order Tracking screen.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We currently accept Cash on Delivery (COD) and UPI (GPay, PhonePe, Paytm). Select your preferred method at checkout.",
  },
  {
    q: "Can I reorder from a previous order?",
    a: "Yes! Go to the Orders tab, find a previous order, and tap 'Reorder'. Your cart will be filled with the same items from that store.",
  },
  {
    q: "How do I list my store on Kirana Konnect?",
    a: "On the login screen, toggle to 'Login as Shopkeeper'. Create your account, and you can immediately add your inventory and start receiving orders.",
  },
  {
    q: "The app is not loading — what should I do?",
    a: "Check your internet connection. If the problem persists, close and reopen the app. You can also try logging out and logging back in.",
  },
];

export default function HelpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState<number | null>(null);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Help & Support</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: bottomPad + 24 }}>
        <View style={[styles.contactCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
          <Feather name="message-circle" size={28} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.contactTitle, { color: colors.foreground }]}>Contact Us</Text>
            <Text style={[styles.contactSub, { color: colors.mutedForeground }]}>
              We typically reply within 2 hours
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.chatBtn, { backgroundColor: colors.primary }]}
            accessibilityLabel="Start chat"
            accessibilityRole="button"
          >
            <Text style={styles.chatBtnText}>Chat</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.faqTitle, { color: colors.foreground }]}>Frequently Asked Questions</Text>

        {FAQS.map((faq, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.faqCard, { backgroundColor: colors.card, borderColor: expanded === i ? colors.primary + "60" : colors.border }]}
            onPress={() => setExpanded(expanded === i ? null : i)}
            activeOpacity={0.8}
            accessibilityLabel={faq.q}
            accessibilityRole="button"
          >
            <View style={styles.faqHeader}>
              <Text style={[styles.faqQ, { color: colors.foreground, flex: 1 }]}>{faq.q}</Text>
              <Feather
                name={expanded === i ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.mutedForeground}
              />
            </View>
            {expanded === i && (
              <Text style={[styles.faqA, { color: colors.mutedForeground }]}>{faq.a}</Text>
            )}
          </TouchableOpacity>
        ))}

        <View style={[styles.supportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.supportTitle, { color: colors.foreground }]}>Other ways to reach us</Text>
          {[
            { icon: "mail", label: "support@kiranakonnect.in" },
            { icon: "phone", label: "+91 1800-XXX-XXXX (Toll-free)" },
          ].map((item, i) => (
            <View key={i} style={styles.supportRow}>
              <View style={[styles.supportIcon, { backgroundColor: colors.muted }]}>
                <Feather name={item.icon as any} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.supportText, { color: colors.foreground }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  contactTitle: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  contactSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  chatBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  chatBtnText: { color: "#fff", fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },
  faqTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  faqCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  faqHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  faqQ: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  faqA: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  supportCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  supportTitle: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  supportRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  supportIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  supportText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
