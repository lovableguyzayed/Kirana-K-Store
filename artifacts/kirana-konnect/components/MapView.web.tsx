import * as Location from "expo-location";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { Shop, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { buildMapHtml } from "@/utils/mapHtml";
import { isShopCurrentlyOpen } from "@/utils/shopUtils";

interface MapViewComponentProps {
  onShopPress: (shop: Shop) => void;
  selectedShop: Shop | null;
}

type MapWindow = Window & {
  setSelected?: (id: string | null) => void;
  setUserLocation?: (lat: number, lng: number) => void;
};

/**
 * Web build of the home map: the same OpenFreeMap page as the native app,
 * hosted in an iframe instead of a WebView.
 */
export default function MapViewComponent({ onShopPress, selectedShop }: MapViewComponentProps) {
  const colors = useColors();
  const { shops, userLocation, setUserLocation } = useApp();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

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

  useEffect(() => setReady(false), [html]);

  const mapWindow = () => frameRef.current?.contentWindow as MapWindow | null | undefined;

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      const msg = (event.data as { kkMap?: string } | null)?.kkMap;
      if (!msg) return;
      if (msg === "map:ready") setReady(true);
      else if (msg.startsWith("shop:")) {
        const shop = shops.find((s) => s.id === msg.slice("shop:".length));
        if (shop) onShopPress(shop);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [shops, onShopPress]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted" || cancelled) return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled) setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        // No location — the map simply frames the shops.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setUserLocation]);

  useEffect(() => {
    if (ready && userLocation) mapWindow()?.setUserLocation?.(userLocation.lat, userLocation.lng);
  }, [ready, userLocation]);

  useEffect(() => {
    if (ready) mapWindow()?.setSelected?.(selectedShop?.id ?? null);
  }, [ready, selectedShop?.id]);

  return (
    <iframe
      ref={frameRef}
      title="Map of nearby shops"
      srcDoc={html}
      allow="geolocation"
      style={{ border: 0, width: "100%", height: "100%", display: "block" }}
    />
  );
}
