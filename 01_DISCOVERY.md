# Phase 1 — Deep Discovery & Research
## Kirana Konnect · Professional Application Audit

*Completed: May 2026 · Auditor: AI Architect Agent*

---

## 1. Project Overview

**Kirana Konnect** is a hyperlocal grocery-finder mobile application targeting Indian neighbourhood ("kirana") stores. It operates in two distinct modes:

| Mode | Entry | Primary User |
|---|---|---|
| Customer | Login → `/(tabs)` | Buyer browsing, ordering from nearby stores |
| Shopkeeper | Login (toggle) → `/(shopkeeper)` | Store owner managing orders and inventory |

The application is built with **Expo 54 / React Native 0.81.5** and runs as a managed Expo app targeting iOS, Android, and Web (via Expo Web).

---

## 2. Repository & Monorepo Structure

```
artifacts-monorepo/
├── artifacts/
│   ├── kirana-konnect/        # Expo RN mobile app  (@workspace/kirana-konnect)
│   ├── api-server/            # Express 5 API server (@workspace/api-server)
│   └── mockup-sandbox/        # Canvas design preview server
├── lib/
│   ├── api-spec/              # OpenAPI spec + codegen (Orval)
│   └── db/                    # Drizzle ORM + PostgreSQL schema
├── scripts/                   # Shared utility scripts
├── pnpm-workspace.yaml        # Workspace catalog + overrides
├── tsconfig.base.json
└── tsconfig.json              # Solution file (composite libs only)
```

**Package management**: pnpm workspaces, Node 24, TypeScript 5.9.

---

## 3. Tech Stack Inventory

### Mobile App (`artifacts/kirana-konnect`)

| Concern | Library / Version |
|---|---|
| Framework | Expo 54, React Native 0.81.5 |
| Navigation | Expo Router (file-based, v4) |
| State | React Context (`AppContext`) + `useState`/`useCallback` |
| Persistence | `@react-native-async-storage/async-storage` |
| Map (native) | `react-native-maps` 1.18.0 (`MapView.tsx`) |
| Map (web) | Custom grid mock (`MapView.web.tsx`) |
| Icons | `@expo/vector-icons` (Feather set) |
| Fonts | Inter (400/500/600/700) via `expo-font` |
| Haptics | `expo-haptics` |
| Safe area | `react-native-safe-area-context` |
| Design tokens | `constants/colors.ts` + `hooks/useColors.ts` |
| Colors | Primary `#2E7D32`, Accent `#FF9800` |

### API Server (`artifacts/api-server`)

| Concern | Library |
|---|---|
| Framework | Express 5 |
| Logging | `pino` + `pino-http` |
| CORS | `cors` |
| Build | `esbuild` (CJS bundle) |
| ORM | Drizzle ORM + PostgreSQL |
| Validation | Zod v4 + `drizzle-zod` |

> **Critical finding**: The API server has only one operational endpoint (`GET /api/healthz`). The mobile app makes **zero API calls** — it is entirely self-contained with hardcoded mock data.

---

## 4. Application Architecture

### 4.1 Data Flow

```
AppContext (React Context)
  ├── MOCK_SHOPS     [4 shops, hardcoded]
  ├── MOCK_PRODUCTS  [19 products across 4 shops, hardcoded]
  ├── MOCK_ORDERS    [3 seed orders, hardcoded]
  ├── cart[]         → AsyncStorage ("kk_cart")
  └── orders[]       → AsyncStorage ("kk_orders") [merged with seeds on load]
```

All business logic — cart management, order placement, order status updates — lives entirely inside `AppContext.tsx` (466 lines). There is no network layer.

### 4.2 Route Map

```
/ (index.tsx)
└── /splash              Animated logo → auto-navigates to /login after 2.8s

/login                   Phone number + simulated OTP (6-digit), shopkeeper toggle

/(tabs)                  Customer tab navigator (bottom tabs)
  ├── index.tsx          Map home: full-screen map + draggable bottom sheet + filter chips
  └── orders.tsx         Order history list with reorder + track buttons

/shop/[id]               Shop detail: category tab bar + product list + CartBar
/product/[id]            Product detail: description + weight controls or qty controls
/search                  Full-text search across all products + shops (module-level precompute)
/cart                    Cart review: item list, delivery toggle, coupon field (UI only), totals
/checkout                Address input + payment method selection (COD/UPI) → place order
/tracking/[id]           Order status timeline + animated mock rider map (delivery only)

/(shopkeeper)/dashboard  Stats (today's orders, earnings, pending) + recent order feed
/(shopkeeper)/orders     Accept/reject new orders, pack, mark ready/dispatched
/(shopkeeper)/inventory  Local CRUD for products (completely separate from AppContext data)
```

### 4.3 Authentication Model

Authentication is fully simulated:
- Phone number field accepts any 10-digit number
- OTP field accepts any 6 digits
- `isShopkeeper` is a boolean in `AppContext` toggled via the login screen toggle
- No session token, no user ID, no backend call
- "Resend OTP in 30s" is static text — no countdown timer or actual resend logic
- No customer logout — only shopkeeper has a logout button

### 4.4 Persistence Model

| Key | Stored | Loaded |
|---|---|---|
| `kk_cart` | `cart[]` on every change | On app mount |
| `kk_orders` | `orders[]` on every change | On app mount (merged with seeds) |

Not persisted: `selectedShop`, `deliveryMode`, `isShopkeeper` — all reset to defaults on app restart.

---

## 5. Data Models

### 5.1 Product
```typescript
interface Product {
  id: string;           // "p1" – "p19"
  name: string;
  price: number;        // base price per unit
  unit: string;         // "packet", "kg", "bag", "pack", etc.
  image?: string;       // always undefined (no image assets for products)
  shopId: string;
  shopName: string;
  category: string;     // "Dairy" | "Grocery" | "Snacks" | "Bakery" | "Beverages" | "Vegetables"
  stock: number;
  description?: string;
  isWeightBased?: boolean;
}
```

### 5.2 CartItem
```typescript
interface CartItem extends Product {
  quantity: number;
  selectedWeight?: string;  // e.g. "500 g", "1 kg"
  // price field (inherited) is OVERRIDDEN at add-time for weight-based items
  // priceOverride is stored as `price`, not a separate field
}
```

### 5.3 Shop
```typescript
interface Shop {
  id: string;           // "s1" – "s4"
  name: string;
  address: string;
  lat: number; lng: number;  // hardcoded Delhi coordinates
  rating: number;
  distance: string;     // "0.5 km" – static string, not computed from GPS
  openTime: string; closeTime: string;  // strings only, not enforced
  isOpen: boolean;      // hardcoded boolean, not computed from openTime/closeTime
  categories: string[];
  image?: string;       // always undefined
}
```

### 5.4 Order
```typescript
interface Order {
  id: string;            // `o${Date.now()}` — collision-prone at high frequency
  shopId: string;        // from selectedShop at checkout time
  shopName: string;
  items: CartItem[];
  total: number;         // sum of item.price * item.quantity
  deliveryFee: number;   // 30 if delivery && total < 200, else 0
  status: "pending" | "accepted" | "packed" | "out_for_delivery" | "delivered" | "rejected";
  mode: "pickup" | "delivery";
  address?: string;
  paymentMethod: "cod" | "upi";
  placedAt: string;      // ISO timestamp string
}
```

---

## 6. Component Inventory

| Component | File | Purpose |
|---|---|---|
| `ProductCard` | `components/ProductCard.tsx` | Product list item: tap-to-navigate left side, add/qty buttons right side. Handles weight-based vs unit-based branching. |
| `CartBar` | `components/CartBar.tsx` | Sticky bottom bar shown on shop screen when cart has items. Shows count + total. |
| `AddToCartModal` | `components/AddToCartModal.tsx` | Modal for weight-based products: radio (Enter Quantity / Enter Price), unit picker (kg/gm), price summary. `animationType="slide"` for web compat. |
| `MapView` (native) | `components/MapView.tsx` | `react-native-maps` MapView with custom shop pins. |
| `MapView` (web) | `components/MapView.web.tsx` | Grid of shop cards as map substitute on web. |
| `ShopCard` | `components/ShopCard.tsx` | Shop card used in search results / list views. |
| `ErrorBoundary` | `components/ErrorBoundary.tsx` | React class error boundary. |
| `ErrorFallback` | `components/ErrorFallback.tsx` | Error UI shown by ErrorBoundary. |
| `KeyboardAwareScrollViewCompat` | `components/KeyboardAwareScrollViewCompat.tsx` | Platform-aware keyboard scroll wrapper. |

---

## 7. Bugs & Issues Found

### CRITICAL — Data Integrity

| # | Bug | Location | Impact |
|---|---|---|---|
| B1 | **Cross-shop cart**: No validation prevents adding products from multiple shops simultaneously. `placeOrder()` attaches `selectedShop` at checkout time, so a mixed cart produces an order with an incorrect/misleading `shopId`. | `AppContext.tsx:362–388`, `cart.tsx` | Orders with mixed shop items are malformed; shopkeeper sees items not from their store. |
| B2 | **Closed shops are fully orderable**: `s3 (Mohan Kirana)` has `isOpen: false` but products are freely added to cart and ordered. No guard anywhere in the purchase flow. | `AppContext.tsx:104`, shop `[id].tsx`, `cart.tsx` | User can place orders at closed stores. |
| B3 | **Inventory completely disconnected from product catalogue**: `(shopkeeper)/inventory.tsx` maintains its own local `INITIAL_PRODUCTS` state (not in `AppContext`). Shopkeeper edits/deletes/adds products have zero effect on the customer-facing product list. | `inventory.tsx:25–32`, `AppContext.tsx:134` | Inventory management is non-functional in terms of real app behaviour. |
| B4 | **`placeOrder()` ignores `selectedShop` being null**: If cart is populated via reorder (which doesn't set `selectedShop`) and user navigates to checkout, the order gets `shopId: ""` and `shopName: ""`. | `AppContext.tsx:404–426`, `orders.tsx:36–42` | Orders can be created with no shop identity. |

### HIGH — Logic / UX Errors

| # | Bug | Location | Impact |
|---|---|---|---|
| B5 | **Reorder adds items without clearing existing cart and without setting `selectedShop`**: Each reorder item is individually `addToCart`-ed, which can merge into an existing cross-shop cart. | `(tabs)/orders.tsx:35–42` | Cart corruption, wrong shopId on resulting order. |
| B6 | **Order ID collision**: IDs use `` `o${Date.now()}` `` (millisecond timestamp). Rapid successive orders (e.g. automation, tests) produce duplicate IDs. | `AppContext.tsx:409` | Duplicate IDs cause `setOrders` map to corrupt orders, and `AsyncStorage` merge logic breaks. |
| B7 | **Earnings include rejected orders**: `ShopkeeperDashboard` computes earnings as `todaysOrders.reduce(sum + o.total + o.deliveryFee)` without filtering out rejected orders. | `(shopkeeper)/dashboard.tsx:40` | Shopkeeper sees inflated earnings. |
| B8 | **`isOpen` is hardcoded, not computed from `openTime`/`closeTime`**: Shops don't automatically go offline outside their trading hours. | `AppContext.tsx:73–130` | Store availability is always stale/wrong. |
| B9 | **"Resend OTP" countdown is static text**: Shows "Resend OTP in 30s" permanently; no timer, no actual resend capability. | `login.tsx:156` | Misleading UI; users cannot actually resend an OTP. |
| B10 | **Checkout accepts empty address for delivery**: No validation that `address` is non-empty when `deliveryMode === "delivery"`. | `checkout.tsx` | Orders placed with blank delivery address. |

### MEDIUM — TypeScript / Code Quality

| # | Bug | Location | Impact |
|---|---|---|---|
| B11 | **Known TS type errors**: `router.push("/shop/" + shop.id)` and `router.push("/tracking/" + order.id)` produce type errors because Expo Router expects literal typed paths. | `(tabs)/index.tsx:96`, `(tabs)/orders.tsx:117` | Build-time warnings; safe at runtime but hides real type errors. |
| B12 | **`ALL_PRODUCTS` in search computed at module level**: `const ALL_PRODUCTS = SHOPS.flatMap(...)` runs once when the module loads. If mock data changes (or real data is introduced), search won't reflect it. | `search.tsx:18–20` | Search becomes stale on any dynamic product data. |
| B13 | **Weight-based price display in `ProductCard`**: Shows `product.price` (base per-kg price) in the card even after a weight selection, rather than the computed price the user confirmed in the modal. | `ProductCard.tsx:90` | Price shown in list doesn't match cart price for weight-based items. |
| B14 | **`useNativeDriver: false` used for all animations**: The tracking screen and splash use `useNativeDriver: false` for positional animations. On complex animated scenes this forces JS-thread animation (drops frames under load). | `tracking/[id].tsx`, `splash.tsx` | Performance degradation on mid-range Android. |
| B15 | **Shopkeeper dashboard `SHOP` constant is hardcoded**: The dashboard always shows "Gupta Kirana Store / Ramesh Gupta" regardless of which account is logged in. | `(shopkeeper)/dashboard.tsx:17–25` | Every shopkeeper sees the same store name. |

### LOW — Polish / Missing Features

| # | Issue | Notes |
|---|---|---|
| B16 | **No dark mode implementation**: `useColors` hook supports dark via `colors.dark` key, but `constants/colors.ts` ships only a `light` palette. | Dark mode hook is wired but inert. |
| B17 | **No product images**: Both `Product.image` and `Shop.image` are typed as `string | undefined` but are always `undefined`. All product visuals use category-colored Feather icons. | Significant visual limitation. |
| B18 | **No accessibility labels**: No `accessibilityLabel`, `accessibilityRole`, or `accessibilityHint` on any interactive elements. | Fails basic a11y audit. |
| B19 | **No offline/network error handling**: App doesn't need it now (no network calls) but no infrastructure exists for when the API is connected. | Technical debt. |
| B20 | **Coupon/promo code field in cart is UI-only**: Input exists and accepts text but nothing processes it. | User expectation mismatch. |
| B21 | **No customer profile/account screen**: No way to view or edit phone number, saved addresses, or preferences after login. | Incomplete user journey. |
| B22 | **Payment is selection-only**: UPI and COD are selectable but neither triggers any real payment flow. | Expected by users to do something. |
| B23 | **Tracking auto-advance**: Tracking screen shows current order status correctly but doesn't auto-advance status over time. User must manually go to shopkeeper mode to advance. | Demo-mode limitation. |
| B24 | **`isShopkeeper` not persisted**: App resets to customer mode on every restart. Shopkeeper must toggle and re-login. | UX friction for shopkeeper users. |

---

## 8. Architecture Gaps

### 8.1 No Real Backend Integration
The API server (`artifacts/api-server`) exists with:
- Express 5 boilerplate
- Pino logging
- CORS, JSON body parsing
- Drizzle ORM + PostgreSQL wired in lib packages
- **Only route**: `GET /api/healthz`

The mobile app never calls any API. Every data source is a hardcoded constant or in-memory state.

### 8.2 No Authentication Infrastructure
- No JWT / session token
- No user record
- No phone number verification (Twilio, Firebase Auth, etc.)
- `isShopkeeper` is a client-side boolean with no server-side validation

### 8.3 No Push Notifications
Order status changes happen locally via `updateOrderStatus()`. In a real deployment, customer devices need to receive push notifications when the shopkeeper advances an order.

### 8.4 No Real Map / GPS
- Native map (`MapView.tsx`) uses `react-native-maps` but shop coordinates are hardcoded Delhi lat/lng
- No user location permission requested
- Distance strings are hardcoded ("0.5 km") — not computed from actual GPS
- Web fallback is a card grid, not a real map

### 8.5 Shopkeeper ↔ Customer Data Isolation
The shopkeeper inventory screen operates on its own local state (`INITIAL_PRODUCTS` in `inventory.tsx`). It has no connection to `AppContext.MOCK_PRODUCTS`. This means:
- Adding a product in inventory doesn't make it appear in the customer app
- Marking a product inactive doesn't hide it for customers
- Stock changes have no effect on what customers see

---

## 9. Positive Findings (What Works Well)

| Strength | Detail |
|---|---|
| Clean component separation | ProductCard, CartBar, AddToCartModal are well-isolated and reusable |
| Weight-based product flow | `isWeightBased` detection, `getWeightOptions()`, modal with quantity/price modes, and price override mechanism are correctly implemented end-to-end |
| Animated tracking screen | Rider animation with waypoint interpolation, bob effect, distance countdown, and pulse animation is impressive for a demo |
| Design system | Consistent color tokens via `useColors`, Inter fonts, and `#2E7D32`/`#FF9800` brand palette applied uniformly |
| Draggable bottom sheet | Custom `PanResponder` snap-to-position sheet on home screen is smooth and platform-aware |
| Expo Router structure | File-based routing with `(tabs)` and `(shopkeeper)` route groups is clean and conventional |
| Haptic feedback | `expo-haptics` used appropriately on add-to-cart, accept/reject order, and key CTAs |
| Error boundary | `ErrorBoundary` + `ErrorFallback` present at app root |
| AsyncStorage merge strategy | Cart and orders are persisted; orders merge with seeds on load to avoid duplicate mock IDs |
| Platform guards | `Platform.OS !== "web"` guards on haptics, `useNativeDriver`, and layout padding are consistently applied |

---

## 10. File-Level Summary

| File | Lines | Status | Notes |
|---|---|---|---|
| `context/AppContext.tsx` | 466 | Functional | Central data hub; needs real API integration |
| `app/(tabs)/index.tsx` | 543 | Functional | Home map + sheet; TS push type error |
| `app/(tabs)/orders.tsx` | 267 | Functional | Reorder bug (B5); TS push type error |
| `app/shop/[id].tsx` | ~350 | Functional | Allows ordering from closed shops (B2) |
| `app/product/[id].tsx` | ~300 | Functional | Bug B13 fixed (priceOverride→price) |
| `app/cart.tsx` | ~350 | Functional | Coupon UI-only (B20), no cross-shop guard (B1) |
| `app/checkout.tsx` | ~300 | Functional | No address validation (B10), no real payment (B22) |
| `app/tracking/[id].tsx` | 849 | Functional | Largest file; mock rider animation works well |
| `app/search.tsx` | 261 | Functional | Module-level precompute (B12) |
| `app/login.tsx` | 328 | Functional | Simulated auth; static resend text (B9) |
| `app/splash.tsx` | ~100 | Functional | Animated logo, auto-navigates |
| `app/(shopkeeper)/dashboard.tsx` | 393 | Functional | Hardcoded SHOP (B15), earnings bug (B7) |
| `app/(shopkeeper)/orders.tsx` | 320 | Functional | Order status management works correctly |
| `app/(shopkeeper)/inventory.tsx` | 745 | Non-functional | Largest screen; completely isolated from catalogue (B3) |
| `components/ProductCard.tsx` | 300 | Functional | Price display bug (B13) |
| `components/AddToCartModal.tsx` | ~300 | Functional | Correct weight/price logic |
| `components/CartBar.tsx` | 87 | Functional | Clean and correct |
| `components/MapView.tsx` | ~100 | Functional | Native map with shop pins |
| `components/MapView.web.tsx` | ~100 | Functional | Web grid fallback |
| `hooks/useColors.ts` | 25 | Functional | Dark mode hook wired but inert (B16) |
| `artifacts/api-server/src/app.ts` | 34 | Stub | Only health endpoint; not used by app |

---

## 11. Risk Register

| Risk | Severity | Likelihood | Mitigation Needed |
|---|---|---|---|
| Cart corruption from cross-shop orders | High | Certain (no guard) | Shop-lock enforcement at cart add |
| Orders placed at closed shops | High | High | `isOpen` check at add-to-cart or checkout |
| Inventory/catalogue disconnect | High | Certain | Merge into shared AppContext or real API |
| No real auth = no user data security | High | Certain | Firebase/Twilio OTP + JWT session |
| Order ID collision | Medium | Low in demo | `nanoid` or UUID |
| Null `selectedShop` at checkout | Medium | Reproducible via reorder | Guard in `placeOrder` + reorder flow fix |
| Earnings inflation from rejected orders | Medium | Reproducible | Filter by non-rejected status |
| Static `isOpen` fields | Medium | Certain | Compute from `openTime`/`closeTime` + system time |

---

## 12. Discovery Summary

Kirana Konnect is a **high-fidelity prototype** with an impressive visual polish and a complete customer + shopkeeper UI walkthrough. However, it operates entirely in mock mode with no real backend integration, no authentication, and several data integrity bugs that would surface immediately in production use.

**The three most impactful issues to address before any real release are:**
1. Cross-shop cart enforcement (B1)
2. Closed-shop ordering prevention (B2)
3. Shopkeeper inventory ↔ customer catalogue synchronisation (B3)

**The foundational infrastructure gaps (real auth, real API, real payments, real map) are the Phase 2–4 planning items.**

---

*End of Phase 1 Discovery. Ready for Phase 2 when approved.*
