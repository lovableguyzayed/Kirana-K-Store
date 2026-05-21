import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const { width: SCREEN_W } = Dimensions.get("window");

const SLIDES = [
  {
    emoji: "🗺️",
    title: "Find Your Local Store",
    subtitle:
      "Discover nearby kirana stores on an interactive map. See ratings, hours, and distance — all at a glance.",
    bg: "#E8F5E9",
    accent: "#2E7D32",
  },
  {
    emoji: "🛒",
    title: "Browse & Order Easily",
    subtitle:
      "Browse each store's full catalogue, add items to cart, and place orders for pickup or home delivery in seconds.",
    bg: "#FFF3E0",
    accent: "#E65100",
  },
  {
    emoji: "🛵",
    title: "Track in Real Time",
    subtitle:
      "Watch your delivery rider head towards you on a live map. Get notified at every step of your order.",
    bg: "#E3F2FD",
    accent: "#1565C0",
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 16);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 16);

  const goTo = (idx: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: false }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
    ]).start();
    scrollRef.current?.scrollTo({ x: idx * SCREEN_W, animated: true });
    setCurrent(idx);
  };

  const handleNext = () => {
    if (current < SLIDES.length - 1) {
      goTo(current + 1);
    } else {
      finish();
    }
  };

  const finish = async () => {
    try {
      await AsyncStorage.setItem("kk_onboarded", "1");
    } catch {}
    router.replace("/login");
  };

  const slide = SLIDES[current];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad }]}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => goTo(i)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={`Go to slide ${i + 1}`}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === current ? slide.accent : colors.border,
                    width: i === current ? 24 : 8,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
        {current < SLIDES.length - 1 ? (
          <TouchableOpacity onPress={finish} accessibilityLabel="Skip onboarding" accessibilityRole="button">
            <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.slides}
      >
        {SLIDES.map((s, i) => (
          <Animated.View
            key={i}
            style={[styles.slide, { width: SCREEN_W, opacity: i === current ? fadeAnim : 1 }]}
          >
            <View style={[styles.emojiCard, { backgroundColor: s.bg }]}>
              <Text style={styles.emoji}>{s.emoji}</Text>
            </View>
            <Text style={[styles.slideTitle, { color: colors.foreground }]}>{s.title}</Text>
            <Text style={[styles.slideSubtitle, { color: colors.mutedForeground }]}>{s.subtitle}</Text>
          </Animated.View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 8 }]}>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: slide.accent }]}
          onPress={handleNext}
          activeOpacity={0.88}
          accessibilityLabel={current === SLIDES.length - 1 ? "Get Started" : "Next slide"}
          accessibilityRole="button"
        >
          <Text style={styles.nextBtnText}>
            {current === SLIDES.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  dotsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  skipText: { fontSize: 14, fontFamily: "Inter_500Medium", fontWeight: "500" },
  slides: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 24,
  },
  emojiCard: {
    width: 160,
    height: 160,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emoji: { fontSize: 72 },
  slideTitle: {
    fontSize: 26,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 32,
  },
  slideSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 23,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  nextBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  nextBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
