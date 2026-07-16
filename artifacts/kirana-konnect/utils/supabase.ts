import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

// The URL and publishable (anon) key are public values — safe to ship in the
// bundle. Row Level Security on the Supabase side is what protects data.
// EXPO_PUBLIC_ env vars (set at build time) override the defaults below.
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://oxekfjyvboccekwjafcq.supabase.co";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable__MTgIhGcPX5QmLFlYFWv-g_X7BsYFq2";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Only relevant for OAuth redirect flows on web; this app uses phone OTP.
    detectSessionInUrl: false,
  },
});

// Supabase recommends pausing token auto-refresh while the app is backgrounded
// so refresh calls don't fire from a suspended process.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
