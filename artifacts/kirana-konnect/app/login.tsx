import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setIsShopkeeper } = useApp();

  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [isShopkeeperMode, setIsShopkeeperMode] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleSendOtp = () => {
    if (phone.length < 10) return;
    setLoading(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
    }, 1000);
  };

  const handleOtpChange = (val: string, idx: number) => {
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    if (val && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleVerify = () => {
    if (otp.join("").length < 6) return;
    setLoading(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      setLoading(false);
      setIsShopkeeper(isShopkeeperMode);
      if (isShopkeeperMode) {
        router.replace("/(shopkeeper)/dashboard");
      } else {
        router.replace("/(tabs)");
      }
    }, 800);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.inner,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20), paddingBottom: insets.bottom + 20 },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.logo}>
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Kirana Konnect</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {step === "phone" ? "Enter your mobile number to get started" : "Enter the OTP sent to +91 " + phone}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {step === "phone" ? (
            <>
              <Text style={[styles.label, { color: colors.foreground }]}>Mobile Number</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Text style={[styles.prefix, { color: colors.foreground }]}>+91</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="9876543210"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                  returnKeyType="done"
                  onSubmitEditing={handleSendOtp}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  { backgroundColor: phone.length >= 10 ? colors.primary : colors.muted },
                ]}
                onPress={handleSendOtp}
                disabled={phone.length < 10 || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.btnText, { color: phone.length >= 10 ? "#fff" : colors.mutedForeground }]}>
                    Send OTP
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.label, { color: colors.foreground }]}>Enter OTP</Text>
              <View style={styles.otpRow}>
                {otp.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={(r) => { otpRefs.current[idx] = r; }}
                    style={[
                      styles.otpInput,
                      {
                        borderColor: digit ? colors.primary : colors.border,
                        backgroundColor: colors.background,
                        color: colors.foreground,
                      },
                    ]}
                    maxLength={1}
                    keyboardType="numeric"
                    value={digit}
                    onChangeText={(v) => handleOtpChange(v, idx)}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === "Backspace" && !otp[idx] && idx > 0) {
                        otpRefs.current[idx - 1]?.focus();
                      }
                    }}
                  />
                ))}
              </View>
              <Text style={[styles.resend, { color: colors.primary }]}>Resend OTP in 30s</Text>
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  { backgroundColor: otp.join("").length >= 6 ? colors.primary : colors.muted },
                ]}
                onPress={handleVerify}
                disabled={otp.join("").length < 6 || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.btnText, { color: otp.join("").length >= 6 ? "#fff" : colors.mutedForeground }]}>
                    Verify & Login
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep("phone")} style={styles.backBtn}>
                <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
                <Text style={[styles.backText, { color: colors.mutedForeground }]}>Change number</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.toggleMode,
            { backgroundColor: isShopkeeperMode ? colors.accent + "22" : colors.muted, borderColor: isShopkeeperMode ? colors.accent : colors.border },
          ]}
          onPress={() => setIsShopkeeperMode(!isShopkeeperMode)}
        >
          <Feather name="briefcase" size={15} color={isShopkeeperMode ? colors.accent : colors.mutedForeground} />
          <Text style={[styles.toggleText, { color: isShopkeeperMode ? colors.accent : colors.mutedForeground }]}>
            {isShopkeeperMode ? "Shopkeeper mode active" : "Login as Shopkeeper"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 24,
  },
  header: { alignItems: "center", gap: 8 },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  prefix: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  otpRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  otpInput: {
    width: 44,
    height: 48,
    borderRadius: 10,
    borderWidth: 2,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  resend: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    justifyContent: "center",
  },
  backText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  toggleMode: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
});
