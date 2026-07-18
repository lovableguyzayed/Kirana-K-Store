import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Shop, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { isShopCurrentlyOpen } from "@/utils/shopUtils";

interface MapViewComponentProps {
  onShopPress: (shop: Shop) => void;
  selectedShop: Shop | null;
}

const PINS = [
  { id: "s1", xPct: 40, yPct: 45 },
  { id: "s2", xPct: 60, yPct: 38 },
  { id: "s3", xPct: 72, yPct: 62 },
  { id: "s4", xPct: 25, yPct: 58 },
];

export default function MapViewComponent({ onShopPress, selectedShop }: MapViewComponentProps) {
  const colors = useColors();
  const { shops } = useApp();

  return (
    <View style={[styles.webMap, { backgroundColor: "#E8F5E9" }]}>
      <View style={styles.webMapGrid}>
        {Array.from({ length: 6 }).map((_, row) =>
          Array.from({ length: 8 }).map((_, col) => (
            <View
              key={`${row}-${col}`}
              style={[
                styles.gridCell,
                { borderColor: "#C8E6C9", backgroundColor: (row + col) % 3 === 0 ? "#F1F8E9" : "#E8F5E9" },
              ]}
            />
          ))
        )}
      </View>
      <View style={[styles.roads, { backgroundColor: "#C8E6C9" }]} />
      <View style={[styles.roadsH, { backgroundColor: "#C8E6C9" }]} />
      <View style={[styles.roads2, { backgroundColor: "#C8E6C9" }]} />
      <View style={[styles.userDot, { backgroundColor: "#1976D2", borderColor: "#fff" }]}>
        <View style={[styles.userDotInner, { backgroundColor: "#fff" }]} />
      </View>
      {PINS.map((pin) => {
        const shop = shops.find((s) => s.id === pin.id);
        if (!shop) return null;
        const isSelected = selectedShop?.id === shop.id;
        const shopOpen = isShopCurrentlyOpen(shop);
        return (
          <View
            key={shop.id}
            style={[
              styles.mapPin,
              {
                left: `${pin.xPct}%` as any,
                top: `${pin.yPct}%` as any,
                backgroundColor: isSelected
                  ? colors.accent
                  : shopOpen ? colors.primary : "#9E9E9E",
                borderColor: "#fff",
                transform: [{ scale: isSelected ? 1.2 : 1 }],
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => onShopPress(shop)}
              style={styles.pinTouchable}
              accessibilityLabel={`${shop.name} — ${shopOpen ? "Open" : "Closed"}`}
              accessibilityRole="button"
            >
              <Feather name="shopping-bag" size={12} color="#fff" />
            </TouchableOpacity>
            {isSelected && (
              <View style={[styles.pinLabel, { backgroundColor: colors.primary }]}>
                <Text style={styles.pinLabelText}>{shop.name}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  webMap: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  webMapGrid: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridCell: {
    width: "12.5%",
    height: "16.66%",
    borderWidth: 0.5,
  },
  roads: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "40%",
    height: 8,
    opacity: 0.8,
  },
  roadsH: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "65%",
    height: 8,
    opacity: 0.8,
  },
  roads2: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: 8,
    opacity: 0.8,
  },
  userDot: {
    position: "absolute",
    left: "48%",
    top: "48%",
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  userDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mapPin: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pinTouchable: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  pinLabel: {
    position: "absolute",
    bottom: 36,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 80,
    alignItems: "center",
  },
  pinLabelText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
});
