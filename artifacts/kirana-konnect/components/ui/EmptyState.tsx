import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  compact?: boolean;
}

export default function EmptyState({ icon, title, subtitle, ctaLabel, onCta, compact = false }: EmptyStateProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, compact && styles.compact]}>
      <View style={[styles.iconRing, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "25" }]}>
        <Feather name={icon as any} size={compact ? 28 : 38} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.foreground, fontSize: compact ? 15 : 17 }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontSize: compact ? 12 : 13 }]}>
          {subtitle}
        </Text>
      ) : null}
      {ctaLabel && onCta ? (
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: colors.primary }]}
          onPress={onCta}
          activeOpacity={0.85}
          accessibilityLabel={ctaLabel}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
    paddingVertical: 40,
  },
  compact: {
    paddingVertical: 24,
    gap: 8,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  cta: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
