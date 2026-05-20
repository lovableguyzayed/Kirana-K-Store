import { Feather } from "@expo/vector-icons";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

function Toast({ item }: { item: ToastItem }) {
  const anim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(2300),
      Animated.timing(anim, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, []);

  const bg =
    item.type === "success" ? "#2E7D32" :
    item.type === "error"   ? "#C62828" : "#1565C0";
  const icon =
    item.type === "success" ? "check-circle" :
    item.type === "error"   ? "alert-circle" : "info";

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] });

  return (
    <Animated.View style={[styles.toast, { backgroundColor: bg, opacity: anim, transform: [{ translateY }] }]}>
      <Feather name={icon as any} size={16} color="#fff" />
      <Text style={styles.toastText} numberOfLines={2}>{item.message}</Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const topOffset = insets.top + (Platform.OS === "web" ? 67 : 0) + 12;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={[styles.container, { top: topOffset, pointerEvents: "none" }]}>
        {toasts.map((t) => <Toast key={t.id} item={t} />)}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
    flex: 1,
    lineHeight: 20,
  },
});
