import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonProps) {
  const colors = useColors();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const bg = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.muted, colors.border],
  });

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: bg },
        style,
      ]}
    />
  );
}

export function ShopCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.shopCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Skeleton width={52} height={52} borderRadius={12} />
      <View style={styles.shopCardInfo}>
        <Skeleton width="60%" height={15} borderRadius={6} />
        <Skeleton width="40%" height={12} borderRadius={5} style={{ marginTop: 6 }} />
        <Skeleton width="75%" height={11} borderRadius={5} style={{ marginTop: 5 }} />
      </View>
    </View>
  );
}

export function ProductCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Skeleton width="100%" height={80} borderRadius={10} />
      <View style={styles.productCardInfo}>
        <Skeleton width="70%" height={14} borderRadius={5} />
        <Skeleton width="40%" height={12} borderRadius={5} style={{ marginTop: 6 }} />
        <Skeleton width="55%" height={12} borderRadius={5} style={{ marginTop: 5 }} />
      </View>
    </View>
  );
}

export function OrderCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.orderCardHeader}>
        <Skeleton width={40} height={40} borderRadius={10} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Skeleton width="55%" height={14} borderRadius={5} />
          <Skeleton width="35%" height={11} borderRadius={5} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={60} height={22} borderRadius={11} />
      </View>
      <Skeleton width="100%" height={1} borderRadius={0} style={{ marginVertical: 10 }} />
      <Skeleton width="80%" height={12} borderRadius={5} />
      <View style={styles.orderCardFooter}>
        <Skeleton width={80} height={32} borderRadius={8} />
        <Skeleton width={100} height={32} borderRadius={8} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shopCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  shopCardInfo: { flex: 1 },
  productCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  productCardInfo: { padding: 10, gap: 4 },
  orderCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  orderCardHeader: { flexDirection: "row", alignItems: "center" },
  orderCardFooter: { flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 12 },
});
