import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const PRIVACY_SECTIONS = [
  {
    title: "Information We Collect",
    body: "We collect your mobile number for authentication, your saved delivery addresses, and your order history to provide the Kirana Konnect service. Location data is used only to show nearby stores and is never stored on our servers.",
  },
  {
    title: "How We Use Your Data",
    body: "Your data is used solely to power the Kirana Konnect experience — showing you relevant stores, processing orders, and providing customer support. We do not sell your personal data to third parties.",
  },
  {
    title: "Data Storage",
    body: "Order history and preferences are stored locally on your device using secure AsyncStorage. Authentication tokens are stored securely and expire after 30 days of inactivity.",
  },
  {
    title: "Your Rights",
    body: "You may request deletion of your account and all associated data at any time by contacting support@kiranakonnect.in. Data deletion is processed within 30 days.",
  },
  {
    title: "Contact",
    body: "Questions about privacy? Reach us at privacy@kiranakonnect.in or call our toll-free number +91 1800-XXX-XXXX.",
  },
];

export default function AboutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

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
        <Text style={[styles.title, { color: colors.foreground }]}>Privacy & About</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: bottomPad + 24 }}>
        <View style={[styles.appCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
          <View style={[styles.appIcon, { backgroundColor: colors.primary }]}>
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.appIconImg}
              resizeMode="contain"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.appName, { color: colors.foreground }]}>Kirana Konnect</Text>
            <Text style={[styles.appVersion, { color: colors.mutedForeground }]}>Version 1.0.0</Text>
            <Text style={[styles.appTagline, { color: colors.mutedForeground }]}>
              Your neighbourhood store, delivered to your door
            </Text>
          </View>
        </View>

        <View style={[styles.missionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Our Mission</Text>
          <Text style={[styles.missionText, { color: colors.mutedForeground }]}>
            Kirana Konnect exists to digitise India's 12 million kirana stores and give every neighbourhood
            grocer a modern digital presence — without complexity or cost. We believe local commerce
            is the backbone of India, and technology should strengthen that, not replace it.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground, paddingHorizontal: 4 }]}>Privacy Policy</Text>

        {PRIVACY_SECTIONS.map((s, i) => (
          <View key={i} style={[styles.privacyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.privacyHeader}>
              <View style={[styles.privacyNumBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.privacyNum}>{i + 1}</Text>
              </View>
              <Text style={[styles.privacySectionTitle, { color: colors.foreground }]}>{s.title}</Text>
            </View>
            <Text style={[styles.privacyBody, { color: colors.mutedForeground }]}>{s.body}</Text>
          </View>
        ))}

        <View style={[styles.linksCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { label: "Terms of Service", icon: "file-text" },
            { label: "Cookie Policy", icon: "shield" },
            { label: "Open Source Licences", icon: "code" },
          ].map((item, i, arr) => (
            <View key={item.label}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <TouchableOpacity
                style={styles.linkRow}
                accessibilityLabel={item.label}
                accessibilityRole="link"
              >
                <Feather name={item.icon as any} size={16} color={colors.mutedForeground} />
                <Text style={[styles.linkText, { color: colors.foreground }]}>{item.label}</Text>
                <Feather name="external-link" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Text style={[styles.copyright, { color: colors.mutedForeground }]}>
          © 2026 Kirana Konnect · Made with ❤️ in India
        </Text>
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
  appCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  appIconImg: { width: 56, height: 56, borderRadius: 14 },
  appName: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  appVersion: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  appTagline: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4, lineHeight: 17 },
  missionCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  missionText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 21 },
  privacyCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  privacyHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  privacyNumBadge: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  privacyNum: { color: "#fff", fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },
  privacySectionTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold", flex: 1 },
  privacyBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  linksCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  divider: { height: 1 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  linkText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  copyright: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", paddingBottom: 8 },
});
