import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError } from "@workspace/api-client-react";

import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/constants/categories";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = Object.keys(CATEGORY_ICONS);
const STEP_MINUTES = 30;

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const fromMinutes = (mins: number) => {
  const wrapped = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
const to12h = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${suffix}`;
};

type LocationState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "set"; lat: number; lng: number }
  | { status: "denied" }
  | { status: "error" };

export default function RegisterShopScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, setCurrentUser, registerShop, lookupMyShop } = useApp();
  const { showToast } = useToast();

  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("21:00");
  const [categories, setCategories] = useState<string[]>(["Grocery"]);
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const problems = useMemo(() => {
    const p: Record<string, string> = {};
    if (shopName.trim().length < 2) p.shopName = "Enter your shop's name";
    if (ownerName.trim().length < 2) p.ownerName = "Enter the owner's name";
    if (location.status !== "set") p.location = "Set your shop's location so customers can find it";
    if (address.trim().length < 5) p.address = "Enter the shop's address";
    if (toMinutes(closeTime) === toMinutes(openTime)) p.hours = "Opening and closing times can't be the same";
    if (categories.length === 0) p.categories = "Pick at least one thing you sell";
    return p;
  }, [shopName, ownerName, location, address, openTime, closeTime, categories]);
  const isValid = Object.keys(problems).length === 0;

  const useCurrentLocation = async () => {
    setLocation({ status: "locating" });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocation({ status: "denied" });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lng } = pos.coords;
      setLocation({ status: "set", lat, lng });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Pre-fill the address from the phone's geocoder; keep anything the
      // shopkeeper already typed.
      if (!address.trim()) {
        try {
          const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (place) {
            const parts = [place.name, place.street, place.district, place.city, place.postalCode]
              .filter((x): x is string => !!x && x.trim().length > 0);
            const line = [...new Set(parts)].join(", ");
            if (line) setAddress(line);
          }
        } catch {
          // Reverse geocoding is a nicety; the shopkeeper can type it.
        }
      }
    } catch {
      setLocation({ status: "error" });
    }
  };

  const toggleCategory = (cat: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const goToShop = (shop: { id: string; name: string; ownerName?: string }, phone: string) => {
    setCurrentUser({
      phone,
      role: "shopkeeper",
      shopId: shop.id,
      shopName: shop.name,
      ownerName: shop.ownerName,
    });
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    if (!isValid || location.status !== "set") {
      setShowErrors(true);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setSubmitting(true);
    try {
      const shop = await registerShop({
        name: shopName.trim(),
        ownerName: ownerName.trim(),
        address: address.trim(),
        lat: location.lat,
        lng: location.lng,
        openTime,
        closeTime,
        categories,
      });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      goToShop(shop, currentUser.phone);
      showToast(`${shop.name} is live! Add your first products.`);
      router.replace("/(shopkeeper)/inventory");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // This number already owns a shop (e.g. registered on another
        // device) — take them to it.
        const existing = await lookupMyShop(currentUser.phone).catch(() => null);
        if (existing) {
          goToShop(existing, currentUser.phone);
          showToast(`Welcome back to ${existing.name}`, "info");
          router.replace("/(shopkeeper)/dashboard");
          return;
        }
      }
      showToast("Couldn't register your shop. Check your connection and try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const exploreDemoShop = () => {
    if (!currentUser) return;
    setCurrentUser({
      phone: currentUser.phone,
      role: "shopkeeper",
      shopId: "s1",
      shopName: "Gupta Kirana",
      ownerName: "Ramesh Gupta",
    });
    router.replace("/(shopkeeper)/dashboard");
  };

  const signOut = () => {
    setCurrentUser(null);
    router.replace("/login");
  };

  const fieldError = (key: string) =>
    showErrors && problems[key] ? (
      <View style={styles.errorRow}>
        <Feather name="alert-circle" size={12} color={colors.destructive} />
        <Text style={[styles.errorText, { color: colors.destructive }]}>{problems[key]}</Text>
      </View>
    ) : null;

  const inputStyle = (key: string) => [
    styles.input,
    {
      color: colors.foreground,
      backgroundColor: colors.background,
      borderColor: showErrors && problems[key] ? colors.destructive : colors.border,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          paddingBottom: insets.bottom + 140,
          paddingHorizontal: 20,
          gap: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <View />
          <TouchableOpacity onPress={signOut} accessibilityRole="button" accessibilityLabel="Sign out">
            <Text style={[styles.topLink, { color: colors.mutedForeground }]}>Sign out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary + "18" }]}>
            <Feather name="shopping-bag" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Register your shop</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Customers nearby will find you on the map. It takes about a minute.
          </Text>
        </View>

        {/* Shop details */}
        <Section title="Shop details" icon="info" colors={colors}>
          <Text style={[styles.label, { color: colors.foreground }]}>Shop name</Text>
          <TextInput
            style={inputStyle("shopName")}
            placeholder="e.g. Sharma General Store"
            placeholderTextColor={colors.mutedForeground}
            value={shopName}
            onChangeText={setShopName}
            maxLength={80}
            accessibilityLabel="Shop name"
          />
          {fieldError("shopName")}

          <Text style={[styles.label, { color: colors.foreground }]}>Owner's name</Text>
          <TextInput
            style={inputStyle("ownerName")}
            placeholder="Your full name"
            placeholderTextColor={colors.mutedForeground}
            value={ownerName}
            onChangeText={setOwnerName}
            maxLength={80}
            autoCapitalize="words"
            accessibilityLabel="Owner's name"
          />
          {fieldError("ownerName")}
        </Section>

        {/* Location */}
        <Section title="Location" icon="map-pin" colors={colors}>
          <TouchableOpacity
            style={[
              styles.locationBtn,
              location.status === "set"
                ? { backgroundColor: colors.primary + "12", borderColor: colors.primary }
                : {
                    backgroundColor: colors.background,
                    borderColor: showErrors && problems.location ? colors.destructive : colors.border,
                  },
            ]}
            onPress={useCurrentLocation}
            disabled={location.status === "locating"}
            accessibilityRole="button"
            accessibilityLabel="Use my current location"
          >
            {location.status === "locating" ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Feather
                name={location.status === "set" ? "check-circle" : "crosshair"}
                size={20}
                color={colors.primary}
              />
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.locationTitle, { color: colors.foreground }]}>
                {location.status === "set"
                  ? "Shop location set"
                  : location.status === "locating"
                    ? "Finding your location…"
                    : "Use my current location"}
              </Text>
              <Text style={[styles.locationHint, { color: colors.mutedForeground }]}>
                {location.status === "set"
                  ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)} · tap to refresh`
                  : location.status === "denied"
                    ? "Location permission was denied. Allow it in Settings, then try again."
                    : location.status === "error"
                      ? "Couldn't get your location. Make sure GPS is on and try again."
                      : "Stand inside your shop for the most accurate pin"}
              </Text>
            </View>
          </TouchableOpacity>
          {fieldError("location")}

          <Text style={[styles.label, { color: colors.foreground }]}>Address</Text>
          <TextInput
            style={[inputStyle("address"), styles.multiline]}
            placeholder="Shop number, street, area, city"
            placeholderTextColor={colors.mutedForeground}
            value={address}
            onChangeText={setAddress}
            multiline
            maxLength={200}
            accessibilityLabel="Shop address"
          />
          {fieldError("address")}
        </Section>

        {/* Hours */}
        <Section title="Opening hours" icon="clock" colors={colors}>
          <View style={styles.hoursRow}>
            <TimeStepper label="Opens" value={openTime} onChange={setOpenTime} colors={colors} />
            <TimeStepper label="Closes" value={closeTime} onChange={setCloseTime} colors={colors} />
          </View>
          {fieldError("hours")}
        </Section>

        {/* Categories */}
        <Section title="What do you sell?" icon="grid" colors={colors}>
          <View style={styles.chips}>
            {CATEGORIES.map((cat) => {
              const selected = categories.includes(cat);
              const tint = CATEGORY_COLORS[cat] ?? colors.primary;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    selected
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                  onPress={() => toggleCategory(cat)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={cat}
                >
                  <View style={[styles.chipIcon, { backgroundColor: selected ? "#ffffff30" : tint + "40" }]}>
                    <Feather
                      name={(CATEGORY_ICONS[cat] ?? "tag") as keyof typeof Feather.glyphMap}
                      size={12}
                      color={selected ? "#fff" : colors.foreground}
                    />
                  </View>
                  <Text style={[styles.chipText, { color: selected ? "#fff" : colors.foreground }]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {fieldError("categories")}
        </Section>
      </ScrollView>

      {/* Sticky actions */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 12),
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: isValid ? 1 : 0.55 }]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Register shop"
          accessibilityState={{ busy: submitting }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="check" size={18} color="#fff" />
              <Text style={styles.primaryText}>Register shop</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={exploreDemoShop} accessibilityRole="button" style={styles.demoLink}>
          <Text style={[styles.demoText, { color: colors.mutedForeground }]}>
            Just looking? <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Explore the demo shop</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function Section({
  title,
  icon,
  colors,
  children,
}: {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  colors: ReturnType<typeof useColors>;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <Feather name={icon} size={15} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function TimeStepper({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const step = (delta: number) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    onChange(fromMinutes(toMinutes(value) + delta));
  };
  return (
    <View style={[styles.stepper, { borderColor: colors.border, backgroundColor: colors.background }]}>
      <Text style={[styles.stepperLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {/* Time on its own line so long values ("12:30 PM") never collide
          with the buttons on narrow phones. */}
      <Text
        style={[styles.stepperValue, { color: colors.foreground }]}
        accessibilityLabel={`${label} at ${to12h(value)}`}
        numberOfLines={1}
      >
        {to12h(value)}
      </Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={[styles.stepBtn, { backgroundColor: colors.muted }]}
          onPress={() => step(-STEP_MINUTES)}
          accessibilityRole="button"
          accessibilityLabel={`${label} 30 minutes earlier`}
        >
          <Feather name="minus" size={16} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.stepBtn, { backgroundColor: colors.muted }]}
          onPress={() => step(STEP_MINUTES)}
          accessibilityRole="button"
          accessibilityLabel={`${label} 30 minutes later`}
        >
          <Feather name="plus" size={16} color={colors.foreground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  topLink: { fontSize: 14, fontFamily: "Inter_500Medium" },
  hero: { alignItems: "center", gap: 8, paddingVertical: 4 },
  heroIcon: { width: 64, height: 64, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, maxWidth: 300 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  multiline: { minHeight: 76, textAlignVertical: "top" },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  errorText: { fontSize: 12, fontFamily: "Inter_500Medium", flexShrink: 1 },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
  },
  locationTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  locationHint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 16 },
  hoursRow: { flexDirection: "row", gap: 10 },
  stepper: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, gap: 6, alignItems: "center" },
  stepperLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  stepperRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 2 },
  stepBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  stepperValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
  },
  chipIcon: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 6,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
  },
  primaryText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  demoLink: { alignItems: "center", paddingVertical: 6 },
  demoText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
