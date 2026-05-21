import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const SAVED_ADDRESSES = [
  { id: "a1", label: "Home", address: "Block A, Sector 5, Near Park", icon: "home" },
  { id: "a2", label: "Work", address: "Plot 14, Industrial Area, Phase 2", icon: "briefcase" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, setCurrentUser } = useApp();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => {
            setCurrentUser(null);
            router.replace("/login");
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: bottomPad + 20 }}>
        <View style={[styles.avatarCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Feather name="user" size={32} color="#fff" />
          </View>
          <View style={styles.avatarInfo}>
            <Text style={[styles.phone, { color: colors.foreground }]}>
              +91 {currentUser?.phone || "—"}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="shield" size={11} color={colors.primary} />
              <Text style={[styles.roleText, { color: colors.primary }]}>
                {currentUser?.role === "shopkeeper" ? "Shopkeeper" : "Customer"}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Saved Addresses</Text>
          {SAVED_ADDRESSES.map((addr, idx) => (
            <View key={addr.id}>
              {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <View style={styles.addressRow}>
                <View style={[styles.addressIcon, { backgroundColor: colors.muted }]}>
                  <Feather name={addr.icon as any} size={16} color={colors.primary} />
                </View>
                <View style={styles.addressInfo}>
                  <Text style={[styles.addressLabel, { color: colors.foreground }]}>{addr.label}</Text>
                  <Text style={[styles.addressText, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {addr.address}
                  </Text>
                </View>
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={`Edit ${addr.label} address`}
                  accessibilityRole="button"
                >
                  <Feather name="edit-2" size={15} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={[styles.addAddressBtn, { borderColor: colors.primary, borderStyle: "dashed" }]}
            accessibilityLabel="Add new address"
            accessibilityRole="button"
          >
            <Feather name="plus" size={15} color={colors.primary} />
            <Text style={[styles.addAddressText, { color: colors.primary }]}>Add New Address</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>App Settings</Text>
          {[
            { icon: "bell", label: "Notifications", value: "On" },
            { icon: "map-pin", label: "Location", value: "Always" },
            { icon: "globe", label: "Language", value: "English" },
          ].map((item, idx, arr) => (
            <View key={item.label}>
              {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <TouchableOpacity
                style={styles.settingRow}
                accessibilityLabel={item.label}
                accessibilityRole="button"
              >
                <Feather name={item.icon as any} size={17} color={colors.mutedForeground} />
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{item.value}</Text>
                <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.settingRow]}
            onPress={() => router.push("/help")}
            accessibilityLabel="Help and Support"
            accessibilityRole="button"
          >
            <Feather name="help-circle" size={17} color={colors.mutedForeground} />
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Help & Support</Text>
            <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push("/about")}
            accessibilityLabel="Privacy Policy"
            accessibilityRole="button"
          >
            <Feather name="shield" size={17} color={colors.mutedForeground} />
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Privacy & About</Text>
            <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: "#C62828" + "15", borderColor: "#C62828" + "40" }]}
          onPress={handleLogout}
          accessibilityLabel="Log out"
          accessibilityRole="button"
        >
          <Feather name="log-out" size={17} color="#C62828" />
          <Text style={[styles.logoutText, { color: "#C62828" }]}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          Kirana Konnect v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  avatarCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInfo: { flex: 1, gap: 6 },
  phone: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  divider: { height: 1, marginVertical: 10 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  addressIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  addressInfo: { flex: 1 },
  addressLabel: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  addressText: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  addAddressBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  addAddressText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 2,
  },
  settingLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  settingValue: { fontSize: 13, fontFamily: "Inter_400Regular" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
  },
  logoutText: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  version: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingBottom: 8,
  },
});
