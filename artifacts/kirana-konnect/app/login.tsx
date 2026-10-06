import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
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

import { getAppConfig } from "@workspace/api-client-react";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/utils/supabase";

// Steps: enter phone → enter the SMS OTP ("otp"), or — while real SMS login
// isn't available — continue without one ("demo").
//
// Whether the no-OTP path may be offered is decided by the API's
// REQUIRE_AUTH setting (GET /api/config), not by the app: once real login is
// enforced the server rejects unverified users anyway, so the app goes
// strict too and never offers it.
type Step = "phone" | "otp" | "demo";

const toE164 = (phone: string) => `+91${phone}`;

// Supabase errors that mean "SMS login isn't set up / can't send", as opposed
// to a problem with this attempt.
const SMS_UNAVAILABLE_CODES = new Set([
  "phone_provider_disabled",
  "sms_send_failed",
  "otp_disabled",
  "signup_disabled",
]);

const OTP_SEND_TIMEOUT_MS = 15000;

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setCurrentUser, lookupMyShop } = useApp();

  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<Step>("phone");
  // null = unknown (older server without /config, or unreachable).
  const [requireAuth, setRequireAuth] = useState<boolean | null>(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [isShopkeeperMode, setIsShopkeeperMode] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  // Bumped on every successful send so a resend restarts the countdown.
  const [otpSentAt, setOtpSentAt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    getAppConfig()
      .then((config) => setRequireAuth(config.requireAuth))
      .catch(() => setRequireAuth(null));
  }, []);

  useEffect(() => {
    if (step !== "otp") return;
    setResendCountdown(30);
    setCanResend(false);
    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, otpSentAt]);

  const handleSendOtp = async () => {
    if (phone.length < 10) return;
    setLoading(true);
    setError(null);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let otpError: { code?: string; status?: number } | null;
    try {
      const result = await Promise.race([
        supabase.auth.signInWithOtp({ phone: toE164(phone) }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), OTP_SEND_TIMEOUT_MS)),
      ]);
      otpError = result.error;
    } catch {
      otpError = { status: 0 }; // timed out or couldn't reach Supabase
    }
    setLoading(false);

    if (!otpError) {
      setOtp(["", "", "", "", "", ""]);
      setOtpSentAt(Date.now());
      setStep("otp");
      return;
    }

    const rateLimited = otpError.code === "over_sms_send_rate_limit" || otpError.status === 429;
    const networkFailure = otpError.status === undefined || otpError.status === 0;
    // Offer the no-OTP path only while the server doesn't require login:
    // explicitly off → whenever SMS can't be used; unknown (older server) →
    // only when Supabase says SMS isn't set up.
    const allowDemo =
      !rateLimited &&
      (requireAuth === false ||
        (requireAuth === null && !networkFailure &&
          (SMS_UNAVAILABLE_CODES.has(otpError.code ?? "") || (otpError.status ?? 0) >= 400)));
    if (allowDemo) {
      setStep("demo");
      return;
    }

    setError(
      rateLimited
        ? "Too many attempts. Please wait a minute and try again."
        : networkFailure
          ? "Couldn't reach the server. Check your internet connection."
          : otpError.code === "sms_send_failed"
            ? "We couldn't send the SMS right now. Please try again shortly."
            : "Couldn't send the OTP. Please check the number and try again.",
    );
  };

  const handleOtpChange = (val: string, idx: number) => {
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    if (val && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) return;
    setLoading(true);
    setError(null);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: toE164(phone),
      token: code,
      type: "sms",
    });
    if (verifyError) {
      setLoading(false);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(
        verifyError.code === "otp_expired"
          ? "This OTP has expired. Tap Resend to get a new one."
          : "Incorrect OTP. Please try again.",
      );
      return;
    }
    await completeLogin();
  };

  // Continue without an OTP (only offered while the server doesn't
  // require real login).
  const handleContinueDemo = async () => {
    setLoading(true);
    setError(null);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await completeLogin();
  };

  const completeLogin = async () => {
    if (isShopkeeperMode) {
      // Send the shopkeeper to their own shop, or to registration if they
      // don't have one yet.
      try {
        const shop = await lookupMyShop(phone);
        setLoading(false);
        if (shop) {
          setCurrentUser({
            phone,
            role: "shopkeeper",
            shopId: shop.id,
            shopName: shop.name,
            ownerName: shop.ownerName,
          });
          router.replace("/(shopkeeper)/dashboard");
        } else {
          setCurrentUser({ phone, role: "shopkeeper" });
          router.replace("/register-shop");
        }
      } catch {
        setLoading(false);
        setError("Couldn't reach the server to find your shop. Please try again.");
      }
      return;
    }

    setLoading(false);
    setCurrentUser({ phone, role: "customer" });
    router.replace("/(tabs)");
  };

  const handleResend = () => {
    handleSendOtp();
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
            {step === "phone"
              ? "Enter your mobile number to get started"
              : step === "otp"
                ? "Enter the OTP sent to +91 " + phone
                : "Signing in as +91 " + phone}
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
                  accessibilityLabel="Mobile number"
                  accessibilityHint="Enter your 10-digit mobile number"
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
                accessibilityLabel="Send OTP"
                accessibilityRole="button"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.btnText, { color: phone.length >= 10 ? "#fff" : colors.mutedForeground }]}>
                    Send OTP
                  </Text>
                )}
              </TouchableOpacity>
              {error && <ErrorMessage message={error} color={colors.destructive} />}
            </>
          ) : step === "demo" ? (
            <>
              <View
                style={[styles.demoCard, { backgroundColor: colors.accent + "14", borderColor: colors.accent + "55" }]}
                accessibilityRole="alert"
              >
                <View style={[styles.demoIcon, { backgroundColor: colors.accent + "26" }]}>
                  <Feather name="message-square" size={18} color={colors.accent} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.demoTitle, { color: colors.foreground }]}>
                    SMS login abhi chalu nahi hai
                  </Text>
                  <Text style={[styles.demoText, { color: colors.mutedForeground }]}>
                    Aap bina OTP ke aage badh sakte hain.{"\n"}SMS isn't set up yet — continue without an OTP.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={handleContinueDemo}
                disabled={loading}
                activeOpacity={0.85}
                accessibilityLabel="Continue without OTP"
                accessibilityRole="button"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.btnRow}>
                    <Text style={[styles.btnText, { color: "#fff" }]}>Continue</Text>
                    <Feather name="arrow-right" size={18} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
              {error && <ErrorMessage message={error} color={colors.destructive} />}
              <TouchableOpacity
                onPress={() => {
                  setError(null);
                  setStep("phone");
                }}
                style={styles.backBtn}
              >
                <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
                <Text style={[styles.backText, { color: colors.mutedForeground }]}>Change number</Text>
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
                    accessibilityLabel={`OTP digit ${idx + 1}`}
                  />
                ))}
              </View>

              {canResend ? (
                <TouchableOpacity onPress={handleResend} accessibilityRole="button" accessibilityLabel="Resend OTP">
                  <Text style={[styles.resend, { color: colors.primary }]}>Resend OTP</Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.resend, { color: colors.mutedForeground }]}>
                  Resend OTP in {resendCountdown}s
                </Text>
              )}

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  { backgroundColor: otp.join("").length >= 6 ? colors.primary : colors.muted },
                ]}
                onPress={handleVerify}
                disabled={otp.join("").length < 6 || loading}
                activeOpacity={0.85}
                accessibilityLabel="Verify and login"
                accessibilityRole="button"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.btnText, { color: otp.join("").length >= 6 ? "#fff" : colors.mutedForeground }]}>
                    Verify & Login
                  </Text>
                )}
              </TouchableOpacity>
              {error && <ErrorMessage message={error} color={colors.destructive} />}
              <TouchableOpacity
                onPress={() => {
                  setError(null);
                  setStep("phone");
                }}
                style={styles.backBtn}
              >
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
          accessibilityLabel={isShopkeeperMode ? "Switch to customer mode" : "Login as shopkeeper"}
          accessibilityRole="button"
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

function ErrorMessage({ message, color }: { message: string; color: string }) {
  return (
    <View style={styles.errorRow} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Feather name="alert-circle" size={14} color={color} />
      <Text style={[styles.errorText, { color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", flexShrink: 1, textAlign: "center" },
  demoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  demoIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  demoTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  demoText: { fontSize: 12, fontFamily: "Inter_400Regular", flexShrink: 1, lineHeight: 17 },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 24,
  },
  header: { alignItems: "center", gap: 8 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  logoImg: {
    width: 72,
    height: 72,
    borderRadius: 18,
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
