/**
 * The page rendered inside the home screen's map WebView.
 *
 * Map data: OpenFreeMap (https://openfreemap.org) vector tiles rendered with
 * MapLibre GL — free, no API key, no usage limits, commercial use allowed.
 * (The public OpenStreetMap tile server blocks requests from in-app
 * WebViews, which left the old map grey.)
 *
 * Messages to the app: "map:ready", "shop:<id>" when a pin is tapped, and
 * "map:error" if the map can't be shown (native: WebView bridge; web:
 * parent.postMessage({ kkMap })). The app calls window.setSelected(id) and
 * window.setUserLocation(lat, lng).
 */

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  name: string;
  open: boolean;
}

export interface MapHtmlOptions {
  pins: MapPin[];
  colors: { open: string; closed: string; selected: string };
  /** Overridable for tests; defaults to OpenFreeMap's "liberty" style. */
  styleUrl?: string;
  maplibreJs?: string;
  maplibreCss?: string;
}

const MAPLIBRE_VERSION = "5.6.0";

// Feather "shopping-bag" icon for the pins.
const BAG_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';

export function buildMapHtml({
  pins,
  colors,
  styleUrl = "https://tiles.openfreemap.org/styles/liberty",
  maplibreJs = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.js`,
  maplibreCss = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.css`,
}: MapHtmlOptions): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="${maplibreCss}" />
<script src="${maplibreJs}"></script>
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #f2efe9; overflow: hidden; }
  body { font-family: -apple-system, Roboto, "Segoe UI", sans-serif; -webkit-tap-highlight-color: transparent; }
  .pin { display: flex; flex-direction: column; align-items: center; cursor: pointer; }
  .pin-dot {
    width: 34px; height: 34px; border-radius: 17px; border: 2.5px solid #fff; box-sizing: border-box;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 3px 8px rgba(0,0,0,0.28); transition: transform .15s ease;
  }
  .pin-tip { width: 0; height: 0; margin-top: -2px; border-left: 6px solid transparent; border-right: 6px solid transparent; }
  .pin-label {
    margin-top: 2px; max-width: 120px; padding: 2px 7px; border-radius: 9px;
    background: rgba(255,255,255,0.95); color: #1f2937; font-size: 11px; font-weight: 600;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 1px 3px rgba(0,0,0,0.18);
  }
  .pin.selected .pin-dot { transform: scale(1.18); }
  .pin.selected .pin-label { background: #1f2937; color: #fff; }
  .pin.selected { z-index: 3; }
  .user-dot {
    width: 18px; height: 18px; border-radius: 50%; box-sizing: border-box; background: #1E88E5; border: 3px solid #fff;
    box-shadow: 0 0 0 6px rgba(30,136,229,0.22), 0 1px 4px rgba(0,0,0,0.3);
  }
  #fallback {
    display: none; position: absolute; inset: 0; align-items: center; justify-content: center;
    flex-direction: column; gap: 6px; padding: 24px; text-align: center; color: #4b5563; background: #f3f4f6;
  }
  #fallback b { color: #111827; font-size: 15px; }
  #fallback span { font-size: 13px; }
  .maplibregl-ctrl-attrib { font-size: 9px; }
</style>
</head>
<body>
<div id="map"></div>
<div id="fallback">
  <b>Map couldn't load</b>
  <span>Check your internet connection. You can still browse shops from the list below.</span>
</div>
<script>
  var PINS = ${JSON.stringify(pins)};
  var COLORS = ${JSON.stringify(colors)};
  var BAG = ${JSON.stringify(BAG_SVG)};

  // Native: react-native-webview bridge. Web: the page runs in an iframe.
  function post(msg) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
    else if (window.parent !== window) window.parent.postMessage({ kkMap: msg }, "*");
  }
  var failed = false;
  function showFallback() {
    if (failed) return;
    failed = true;
    document.getElementById("fallback").style.display = "flex";
    post("map:error");
  }

  var selectedId = null;
  var markers = {};
  var map = null;
  var userMarker = null;

  function pinColor(pin) {
    if (pin.id === selectedId) return COLORS.selected;
    return pin.open ? COLORS.open : COLORS.closed;
  }

  function styleMarker(pin) {
    var el = markers[pin.id].el;
    var color = pinColor(pin);
    // Toggle only our class: MapLibre adds its own positioning classes to
    // the marker element, and overwriting className would drop them.
    el.classList.toggle("selected", pin.id === selectedId);
    el.querySelector(".pin-dot").style.background = color;
    el.querySelector(".pin-tip").style.borderTop = "7px solid " + color;
  }

  function buildMarkerEl(pin) {
    var el = document.createElement("div");
    el.className = "pin";
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", pin.name);
    el.innerHTML =
      '<div class="pin-dot">' + BAG + '</div><div class="pin-tip"></div>' +
      '<div class="pin-label"></div>';
    el.querySelector(".pin-label").textContent = pin.name;
    el.addEventListener("click", function (e) {
      e.stopPropagation();
      post("shop:" + pin.id);
    });
    return el;
  }

  function overlaps(a, b) {
    return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  }

  // Like real map apps: pins always show, but a name that would cover
  // another pin or name is hidden until the user zooms in. The selected
  // shop wins, then open shops.
  function declutter() {
    var order = PINS.filter(function (p) { return markers[p.id]; }).sort(function (a, b) {
      return (b.id === selectedId) - (a.id === selectedId) || (b.open - a.open);
    });
    var dots = order.map(function (p) {
      return { id: p.id, rect: markers[p.id].el.querySelector(".pin-dot").getBoundingClientRect() };
    });
    var placed = [];
    order.forEach(function (p) {
      var label = markers[p.id].el.querySelector(".pin-label");
      var r = label.getBoundingClientRect();
      // The selected shop's name is always shown (it's drawn on top).
      var clash =
        p.id !== selectedId &&
        (placed.some(function (q) { return overlaps(r, q); }) ||
          dots.some(function (d) { return d.id !== p.id && overlaps(r, d.rect); }));
      label.style.visibility = clash ? "hidden" : "visible";
      if (!clash) placed.push(r);
    });
  }

  window.setSelected = function (id) {
    selectedId = id;
    PINS.forEach(function (pin) { if (markers[pin.id]) styleMarker(pin); });
    declutter();
  };

  function distanceKm(a, b) {
    var R = 6371, toRad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * toRad, dLng = (b.lng - a.lng) * toRad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  // Frame the given points (single point → fixed street-level zoom).
  function frame(points) {
    if (!map || points.length === 0) return;
    if (points.length === 1) {
      map.jumpTo({ center: [points[0].lng, points[0].lat], zoom: 15 });
      return;
    }
    var b = new maplibregl.LngLatBounds();
    points.forEach(function (p) { b.extend([p.lng, p.lat]); });
    // Pins sit above their point and labels below it, ~65px either side.
    // Bottom padding also leaves room for the shop list sheet.
    map.fitBounds(b, { padding: { top: 110, bottom: 240, left: 70, right: 70 }, maxZoom: 16, duration: 0 });
  }

  // Customer location: show the blue dot and frame them with their
  // nearest shops.
  window.setUserLocation = function (lat, lng) {
    if (!map) return;
    var here = { lat: lat, lng: lng };
    if (!userMarker) {
      var dot = document.createElement("div");
      dot.className = "user-dot";
      userMarker = new maplibregl.Marker({ element: dot }).setLngLat([lng, lat]).addTo(map);
    } else {
      userMarker.setLngLat([lng, lat]);
    }
    var nearest = PINS.slice()
      .sort(function (a, b) { return distanceKm(here, a) - distanceKm(here, b); })
      .slice(0, 5);
    frame([here].concat(nearest));
  };

  try {
    if (typeof maplibregl === "undefined") throw new Error("maplibre not loaded");
    map = new maplibregl.Map({
      container: "map",
      style: ${JSON.stringify(styleUrl)},
      center: PINS.length ? [PINS[0].lng, PINS[0].lat] : [77.209, 28.6139],
      zoom: 13,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.touchZoomRotate.disableRotation();

    PINS.forEach(function (pin) {
      var el = buildMarkerEl(pin);
      markers[pin.id] = {
        el: el,
        marker: new maplibregl.Marker({ element: el, anchor: "top", offset: [0, -40] })
          .setLngLat([pin.lng, pin.lat])
          .addTo(map),
      };
      styleMarker(pin);
    });
    frame(PINS);
    map.on("moveend", declutter);
    map.on("load", declutter);

    // A style that never loads (offline, blocked) → friendly fallback.
    var loadTimer = setTimeout(function () { if (!map.isStyleLoaded()) showFallback(); }, 12000);
    map.on("load", function () { clearTimeout(loadTimer); post("map:ready"); });
    map.on("error", function (e) {
      if (!map.isStyleLoaded() && e && e.error && /style|fetch|network/i.test(String(e.error.message))) {
        showFallback();
      }
    });
  } catch (err) {
    showFallback();
  }
</script>
<script>
  // MapLibre failed to download (offline / CDN blocked).
  if (typeof maplibregl === "undefined") showFallback();
</script>
</body>
</html>`;
}
