import React, { useEffect, useMemo, useRef } from "react";
import { WebView } from "react-native-webview";

import { Shop, SHOPS } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { isShopCurrentlyOpen } from "@/utils/shopUtils";

interface MapViewComponentProps {
  onShopPress: (shop: Shop) => void;
  selectedShop: Shop | null;
}

// Feather "shopping-bag" icon as inline SVG for the map pins.
const BAG_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';

/**
 * Native map screen backed by OpenStreetMap (Leaflet in a WebView).
 * No API key or billing account required, unlike Google Maps.
 */
export default function MapViewComponent({ onShopPress, selectedShop }: MapViewComponentProps) {
  const colors = useColors();
  const webViewRef = useRef<WebView>(null);

  const html = useMemo(() => {
    const pins = SHOPS.map((shop) => ({
      id: shop.id,
      lat: shop.lat,
      lng: shop.lng,
      name: shop.name,
      open: isShopCurrentlyOpen(shop),
    }));

    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #e8e4dc; }
  .shop-pin {
    width: 32px; height: 32px; border-radius: 16px;
    border: 2px solid #fff; box-sizing: border-box;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  }
  .leaflet-control-attribution { font-size: 9px; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var PINS = ${JSON.stringify(pins)};
  var COLOR_OPEN = ${JSON.stringify(colors.primary)};
  var COLOR_CLOSED = "#9E9E9E";
  var COLOR_SELECTED = ${JSON.stringify(colors.accent)};
  var BAG = ${JSON.stringify(BAG_SVG)};

  var map = L.map("map", { zoomControl: false, attributionControl: true })
    .setView([28.6139, 77.209], 14);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  var selectedId = null;
  var markers = {};

  function pinColor(pin) {
    if (pin.id === selectedId) return COLOR_SELECTED;
    return pin.open ? COLOR_OPEN : COLOR_CLOSED;
  }

  function pinIcon(pin) {
    return L.divIcon({
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      html: '<div class="shop-pin" style="background:' + pinColor(pin) + '">' + BAG + "</div>",
    });
  }

  PINS.forEach(function (pin) {
    var marker = L.marker([pin.lat, pin.lng], { icon: pinIcon(pin) }).addTo(map);
    marker.on("click", function () {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(pin.id);
    });
    markers[pin.id] = { marker: marker, pin: pin };
  });

  // Called from React Native when the selected shop changes.
  function setSelected(id) {
    selectedId = id;
    Object.keys(markers).forEach(function (key) {
      markers[key].marker.setIcon(pinIcon(markers[key].pin));
    });
  }

  // Best-effort user location dot; the map works fine without permission.
  map.locate({ watch: false, enableHighAccuracy: false });
  map.on("locationfound", function (e) {
    L.circleMarker(e.latlng, {
      radius: 7, color: "#fff", weight: 2, fillColor: "#1E88E5", fillOpacity: 1,
    }).addTo(map);
  });
</script>
</body>
</html>`;
  }, [colors.primary, colors.accent]);

  useEffect(() => {
    webViewRef.current?.injectJavaScript(
      `typeof setSelected === "function" && setSelected(${JSON.stringify(selectedShop?.id ?? null)}); true;`,
    );
  }, [selectedShop?.id]);

  return (
    <WebView
      ref={webViewRef}
      style={{ flex: 1 }}
      originWhitelist={["*"]}
      source={{ html }}
      javaScriptEnabled
      domStorageEnabled
      geolocationEnabled
      setSupportMultipleWindows={false}
      onMessage={(event) => {
        const shop = SHOPS.find((s) => s.id === event.nativeEvent.data);
        if (shop) onShopPress(shop);
      }}
    />
  );
}
