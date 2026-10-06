import * as Location from "expo-location";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { WebView } from "react-native-webview";

import { Shop, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { buildMapHtml } from "@/utils/mapHtml";
import { isShopCurrentlyOpen } from "@/utils/shopUtils";

interface MapViewComponentProps {
  onShopPress: (shop: Shop) => void;
  selectedShop: Shop | null;
}

/**
 * Home-screen map: OpenFreeMap vector tiles (MapLibre GL) in a WebView —
 * free, no API key. Tapping a shop pin reports the shop to the screen,
 * which shows its card and opens the shop.
 */
export default function MapViewComponent({ onShopPress, selectedShop }: MapViewComponentProps) {
  const colors = useColors();
  const { shops } = useApp();
  const webViewRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const html = useMemo(
    () =>
      buildMapHtml({
        pins: shops.map((shop) => ({
          id: shop.id,
          lat: shop.lat,
          lng: shop.lng,
          name: shop.name,
          open: isShopCurrentlyOpen(shop),
        })),
        colors: { open: colors.primary, closed: "#9E9E9E", selected: colors.accent },
      }),
    [shops, colors.primary, colors.accent],
  );

  // The page is rebuilt when shops change; it must announce readiness again.
  useEffect(() => setReady(false), [html]);

  // Use the app's own location permission (more reliable on Android than
  // geolocation inside the WebView). The map works without it.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted" || cancelled) return;
        const last = await Location.getLastKnownPositionAsync();
        const pos = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (!cancelled) setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        // No location — the map simply frames the shops.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !userCoords) return;
    webViewRef.current?.injectJavaScript(
      `window.setUserLocation && window.setUserLocation(${userCoords.lat}, ${userCoords.lng}); true;`,
    );
  }, [ready, userCoords]);

  useEffect(() => {
    if (!ready) return;
    webViewRef.current?.injectJavaScript(
      `window.setSelected && window.setSelected(${JSON.stringify(selectedShop?.id ?? null)}); true;`,
    );
  }, [ready, selectedShop?.id]);

  return (
    <WebView
      ref={webViewRef}
      style={{ flex: 1 }}
      originWhitelist={["*"]}
      // An https origin makes tile/CDN requests carry a normal Referer.
      source={{ html, baseUrl: "https://kirana-k-store.onrender.com" }}
      javaScriptEnabled
      domStorageEnabled
      setSupportMultipleWindows={false}
      onMessage={(event) => {
        const msg = event.nativeEvent.data;
        if (msg === "map:ready") {
          setReady(true);
        } else if (msg.startsWith("shop:")) {
          const shop = shops.find((s) => s.id === msg.slice("shop:".length));
          if (shop) onShopPress(shop);
        }
      }}
    />
  );
}
