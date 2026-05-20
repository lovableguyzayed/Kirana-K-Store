# Phase 2 — Problem Analysis & Prioritization
## Kirana Konnect · Professional Application Audit

*Completed: May 2026 · Auditor: AI Architect Agent*

---

## 1. Scoring Methodology

Each issue from Phase 1 is scored on three axes:

| Axis | Scale | Meaning |
|---|---|---|
| **Severity** | 1–5 | How bad the consequence is when triggered |
| **Frequency** | 1–5 | How often a typical user would encounter it |
| **Effort** | 1–5 | Engineering effort to fix (1 = trivial, 5 = major) |

**Priority Score** = `(Severity × Frequency) / Effort` — higher score = fix sooner.

MoSCoW label is assigned after scoring:
- **Must** → score ≥ 6 or Severity = 5
- **Should** → score 3–5.9
- **Could** → score 1–2.9
- **Won't (now)** → infrastructure gap requiring architectural work first

---

## 2. Bug Analysis Table

### 2.1 Critical — Data Integrity

#### B1 · Cross-Shop Cart

| | |
|---|---|
| **Root Cause** | `addToCart()` in `AppContext` has no `shopId` guard. Any product from any shop is appended to the same cart array. `placeOrder()` stamps the *current* `selectedShop` (set by the last shop the user visited) as the order's shop, regardless of what items are actually in the cart. |
| **Consequence** | An order for Gupta Kirana (s1) Maggi + Sharma Store (s2) Lay's gets assigned to whichever shop was last visited. Shopkeeper for s1 sees s2 items; shopkeeper for s2 sees nothing. |
| **Affected Files** | `AppContext.tsx:362–388` (`addToCart`), `AppContext.tsx:404–426` (`placeOrder`), `cart.tsx` |
| **Severity** | 5 |
| **Frequency** | 4 (user naturally browses multiple shops) |
| **Effort** | 2 |
| **Score** | 10.0 |
| **MoSCoW** | **Must** |

**Fix Design**: On `addToCart`, if the incoming `product.shopId` differs from the first item already in the cart, either (a) clear cart and add fresh (with a user-facing confirmation prompt) or (b) block the add and show "Your cart has items from [ShopX]. Start a new cart?" modal. Approach (b) is the industry standard (Swiggy/Zomato pattern).

---

#### B2 · Ordering from Closed Shops

| | |
|---|---|
| **Root Cause** | `isOpen` is a hardcoded boolean on the `Shop` interface. There is no check in `addToCart`, `shop/[id].tsx`, or `cart.tsx` / `checkout.tsx` that validates shop open status before allowing cart actions or order placement. |
| **Consequence** | Users can place orders at closed stores. The shopkeeper won't be at the store to process them. |
| **Affected Files** | `AppContext.tsx:73–130` (shop data), `shop/[id].tsx`, `cart.tsx`, `checkout.tsx` |
| **Severity** | 4 |
| **Frequency** | 3 (s3 Mohan Kirana is visibly closed but still accessible) |
| **Effort** | 2 |
| **Score** | 6.0 |
| **MoSCoW** | **Must** |

**Fix Design**: (1) Compute `isOpen` dynamically from `openTime`/`closeTime` + current system time (fixes B8 simultaneously). (2) In shop detail screen, show a full-width "Currently Closed" banner and disable "Add" buttons. (3) Guard `checkout.tsx` with a final `isOpen` check before calling `placeOrder()`.

---

#### B3 · Inventory Completely Disconnected from Customer Catalogue

| | |
|---|---|
| **Root Cause** | `(shopkeeper)/inventory.tsx` declares its own `INITIAL_PRODUCTS` const and manages a local `useState<InventoryProduct[]>` that is never read by anything else. `AppContext.MOCK_PRODUCTS` is a separate module-level constant. No shared state, no API, no callback. |
| **Consequence** | The entire inventory management feature is decorative — no action the shopkeeper takes in inventory has any real effect. |
| **Affected Files** | `(shopkeeper)/inventory.tsx:25–53`, `AppContext.tsx:134–240` |
| **Severity** | 5 |
| **Frequency** | 5 (every shopkeeper action) |
| **Effort** | 3 |
| **Score** | 8.3 |
| **MoSCoW** | **Must** |

**Fix Design**: Lift shop product state into `AppContext`: add `shopProducts: Product[]` state and `addProduct`, `updateProduct`, `deleteProduct`, `toggleProductActive` actions. `MOCK_PRODUCTS` becomes the initialiser. `inventory.tsx` reads from and writes to context. Customer-facing screens (`shop/[id].tsx`, `search.tsx`) continue to use `getProductsByShop()` which now reads from context.

---

#### B4 · `placeOrder()` with Null `selectedShop`

| | |
|---|---|
| **Root Cause** | `placeOrder()` uses `selectedShop?.id \|\| ""` and `selectedShop?.name \|\| ""`. `selectedShop` is not persisted to `AsyncStorage`, so after app restart + reorder (which re-adds items but never calls `setSelectedShop`), `selectedShop` is `null`. |
| **Consequence** | An order record is created with `shopId: ""` and `shopName: ""`. This order cannot be associated with any shop and will appear orphaned in order history. |
| **Affected Files** | `AppContext.tsx:404–426`, `(tabs)/orders.tsx:35–42` |
| **Severity** | 4 |
| **Frequency** | 2 (requires reorder after restart, or direct cart navigation) |
| **Effort** | 2 |
| **Score** | 4.0 |
| **MoSCoW** | **Should** |

**Fix Design**: (1) In `placeOrder()` add guard: if `!selectedShop` throw or return early with error. (2) `handleReorder()` should call `setSelectedShop(shop)` using the shop from the original order before adding items. (3) Consider persisting `selectedShop` to `AsyncStorage`.

---

### 2.2 High — Logic / UX Errors

#### B5 · Reorder Corrupts Cart and Loses Shop Context

| | |
|---|---|
| **Root Cause** | `handleReorder()` iterates `order.items`, calling `addToCart(item)` for each quantity unit, with no cart-clear first and no `setSelectedShop` call. This means the reorder is additive (merges with whatever is already in the cart) and shopless (B4 dependency). |
| **Consequence** | Reordering stacks items on top of an existing cross-shop cart. The `shopId` on the new order will be wrong or null. |
| **Affected Files** | `(tabs)/orders.tsx:35–42` |
| **Severity** | 4 |
| **Frequency** | 3 |
| **Effort** | 1 |
| **Score** | 12.0 |
| **MoSCoW** | **Must** |

**Fix Design**: `handleReorder()` should: (1) call `clearCart()`, (2) call `setSelectedShop(shopFromOrder)`, (3) then add items. Add a confirmation if cart is non-empty: "This will replace your current cart with items from [ShopName]. Continue?"

---

#### B6 · Order ID Collision Risk

| | |
|---|---|
| **Root Cause** | IDs generated as `` `o${Date.now()}` `` (millisecond epoch). Two orders placed within the same millisecond (easy in test/automation) share an ID. The `AsyncStorage` merge in `AppProvider` uses `savedIds = new Set(saved.map(o => o.id))` — a collision means one order is silently dropped. |
| **Consequence** | Silent data loss of orders under high-frequency placement. Low probability in normal use but guaranteed in testing. |
| **Affected Files** | `AppContext.tsx:409` |
| **Severity** | 3 |
| **Frequency** | 1 (normal use) / 4 (testing) |
| **Effort** | 1 |
| **Score** | 3.0 |
| **MoSCoW** | **Should** |

**Fix Design**: Replace with `Math.random().toString(36).slice(2, 9)` for a 7-char alphanumeric ID, or use a simple counter persisted to `AsyncStorage`. No external library needed.

---

#### B7 · Shopkeeper Earnings Include Rejected Orders

| | |
|---|---|
| **Root Cause** | `earnings = todaysOrders.reduce((sum, o) => sum + o.total + o.deliveryFee, 0)` where `todaysOrders` is `orders.filter(o => new Date(o.placedAt).toDateString() === today)` with no status filter. Rejected orders are included. |
| **Consequence** | Shopkeeper sees inflated earnings. For a shop with 3 orders (2 delivered, 1 rejected), all 3 contribute to the earnings figure. |
| **Affected Files** | `(shopkeeper)/dashboard.tsx:40` |
| **Severity** | 3 |
| **Frequency** | 3 (any rejected order) |
| **Effort** | 1 |
| **Score** | 9.0 |
| **MoSCoW** | **Must** |

**Fix Design**: Filter earnings to `["delivered"]` status only: `todaysOrders.filter(o => o.status === "delivered").reduce(...)`. Could also include "out_for_delivery" as expected revenue.

---

#### B8 · `isOpen` Is Hardcoded, Not Time-Based

| | |
|---|---|
| **Root Cause** | Each `Shop` object has a static `isOpen: boolean` field. The `openTime`/`closeTime` string fields exist but are never compared to the current time anywhere in the application. |
| **Consequence** | Shops show incorrect open/closed status 24 hours a day. A shop listed as `isOpen: true` appears open at 3 AM. |
| **Affected Files** | `AppContext.tsx:73–130` |
| **Severity** | 3 |
| **Frequency** | 5 (always displayed) |
| **Effort** | 2 |
| **Score** | 7.5 |
| **MoSCoW** | **Must** (fixes B2 dependency) |

**Fix Design**: Add utility `isShopCurrentlyOpen(shop: Shop): boolean` that parses `openTime`/`closeTime` as "HH:MM" and compares to `new Date()`. Replace all `shop.isOpen` references with this computed value. Keep the static field as a manual override for holidays/closures.

---

#### B9 · OTP Resend Is Static Text

| | |
|---|---|
| **Root Cause** | `login.tsx:156` renders `<Text>Resend OTP in 30s</Text>` unconditionally. No `useEffect` timer, no countdown state, no resend handler. |
| **Consequence** | Users who don't receive an OTP (in a real deployment) cannot request another one. The countdown is a lie. |
| **Affected Files** | `login.tsx:156` |
| **Severity** | 2 |
| **Frequency** | 3 (any user who taps the button or needs a resend) |
| **Effort** | 1 |
| **Score** | 6.0 |
| **MoSCoW** | **Should** |

**Fix Design**: Add `resendCountdown` state (30, counting down via `useEffect` interval). When 0, show an active "Resend OTP" button. When tapped, restart the countdown and call `handleSendOtp()` again.

---

#### B10 · No Address Validation at Checkout

| | |
|---|---|
| **Root Cause** | `checkout.tsx` calls `placeOrder(address, paymentMethod)` without checking `address.trim().length > 0` when `deliveryMode === "delivery"`. |
| **Consequence** | Orders placed with empty delivery address; undeliverable. |
| **Affected Files** | `checkout.tsx` |
| **Severity** | 3 |
| **Frequency** | 2 (only when user clears the field) |
| **Effort** | 1 |
| **Score** | 6.0 |
| **MoSCoW** | **Should** |

**Fix Design**: Before `placeOrder()`, validate: if `deliveryMode === "delivery" && !address.trim()` → show inline error "Please enter a delivery address".

---

### 2.3 Medium — TypeScript & Code Quality

#### B11 · Router Push Type Errors

| | |
|---|---|
| **Root Cause** | Expo Router v4 enforces typed routes. `router.push("/shop/" + shop.id)` uses string concatenation, losing the literal type. Typed route would be `router.push({ pathname: "/shop/[id]", params: { id: shop.id } })`. |
| **Affected Files** | `(tabs)/index.tsx:96`, `(tabs)/orders.tsx:117` |
| **Severity** | 2 |
| **Frequency** | 5 (every shop navigation, every track navigation) |
| **Effort** | 1 |
| **Score** | 10.0 |
| **MoSCoW** | **Should** |

**Fix Design**: Replace both occurrences with the typed object form: `router.push({ pathname: "/shop/[id]", params: { id: shop.id } })` and `router.push({ pathname: "/tracking/[id]", params: { id: order.id } })`.

---

#### B12 · Search Precompute Is Not Reactive

| | |
|---|---|
| **Root Cause** | `const ALL_PRODUCTS = SHOPS.flatMap(...)` at module level in `search.tsx` evaluates once when the JS module is first loaded. In the current all-mock setup this is harmless but any future dynamic product data (from B3 fix or real API) will not be reflected. |
| **Affected Files** | `search.tsx:18–20` |
| **Severity** | 2 |
| **Frequency** | 5 (always stale relative to future dynamic data) |
| **Effort** | 1 |
| **Score** | 10.0 |
| **MoSCoW** | **Should** (becomes **Must** after B3 fix) |

**Fix Design**: Move `ALL_PRODUCTS` computation inside the component using `useMemo` that depends on the product state from context: `const allProducts = useMemo(() => SHOPS.flatMap(...), [shopProducts])`.

---

#### B13 · Weight Product Price Shows Base Price in Card

| | |
|---|---|
| **Root Cause** | `ProductCard.tsx:90` renders `<Text>₹{product.price}</Text>` using the original `product` prop (the catalogue product), not the `cartItem.price` which holds the weight-adjusted price override. |
| **Consequence** | After selecting "500 g" for tomatoes (₹30/kg → ₹15 for 500g), the product card still shows "₹30" while the cart shows "₹15". Confusing mismatch. |
| **Affected Files** | `components/ProductCard.tsx:90` |
| **Severity** | 3 |
| **Frequency** | 4 (every weight-based product in cart) |
| **Effort** | 1 |
| **Score** | 12.0 |
| **MoSCoW** | **Must** |

**Fix Design**: Change price display to: `cartItem ? cartItem.price : product.price`. Add a secondary label "per kg" for weight-based items when showing base price.

---

#### B14 · JS-Thread Animations (`useNativeDriver: false`)

| | |
|---|---|
| **Root Cause** | Positional `Animated.Value` props (`left`, `top`, layout dimensions) cannot use the native driver. The tracking screen's rider animation and bob effect run entirely on the JS thread updating layout every 60ms. |
| **Consequence** | Frame drops on mid-range Android during heavy JS work. On the tracking screen (849 lines with multiple concurrent animations) this is the most exposed area. |
| **Affected Files** | `tracking/[id].tsx`, `splash.tsx` |
| **Severity** | 2 |
| **Frequency** | 3 |
| **Effort** | 4 |
| **Score** | 1.5 |
| **MoSCoW** | **Could** |

**Fix Design (long-term)**: Migrate positional animations in the tracking screen to `react-native-reanimated` v3 with worklets, which supports `transform` on the native thread. Short-term: acceptable as-is.

---

#### B15 · Shopkeeper Dashboard Hardcoded Shop Info

| | |
|---|---|
| **Root Cause** | `const SHOP = { name: "Gupta Kirana Store", owner: "Ramesh Gupta", ... }` is a module-level constant in `dashboard.tsx` with no connection to any authenticated user or AppContext shop data. |
| **Consequence** | Every shopkeeper who logs in sees "Ramesh Gupta / Gupta Kirana Store". |
| **Affected Files** | `(shopkeeper)/dashboard.tsx:17–25` |
| **Severity** | 3 |
| **Frequency** | 5 (every shopkeeper session) |
| **Effort** | 2 |
| **Score** | 7.5 |
| **MoSCoW** | **Should** |

**Fix Design**: Add `currentShopkeeper: { shopId: string; name: string; owner: string }` to `AppContext` (populated at login). `dashboard.tsx` reads from context. Shopkeeper inventory data also uses `currentShopkeeper.shopId` to filter products.

---

### 2.4 Low — Polish & Missing Features

| ID | Issue | Severity | Frequency | Effort | Score | MoSCoW |
|---|---|---|---|---|---|---|
| B16 | Dark mode palette not implemented | 2 | 5 | 3 | 3.3 | Could |
| B17 | No product/shop images | 2 | 5 | 3 | 3.3 | Could |
| B18 | No accessibility labels | 3 | 5 | 3 | 5.0 | Should |
| B19 | No offline/error handling infrastructure | 3 | 1 | 4 | 0.75 | Won't (now) |
| B20 | Coupon field is UI-only | 2 | 3 | 2 | 3.0 | Could |
| B21 | No customer profile/account screen | 2 | 4 | 3 | 2.7 | Could |
| B22 | Payment is selection-only (no real flow) | 4 | 5 | 5 | 4.0 | Won't (now) |
| B23 | Tracking status doesn't auto-advance | 2 | 3 | 2 | 3.0 | Could |
| B24 | `isShopkeeper` not persisted across restarts | 3 | 4 | 1 | 12.0 | Must |

---

## 3. Architecture Gap Analysis

### Gap A — No Real Backend / API Layer

**Root Cause**: The API server was scaffolded but never extended beyond the health route. The mobile app has no `fetch`/Axios wrapper, no environment variable for the API base URL, and no error handling for network failures.

**Impact**: The app cannot scale beyond a single device. Orders placed by a customer are invisible to a shopkeeper on a different device. Shopkeeper inventory changes are invisible to customers.

**Effort**: Very High (5)
**Priority**: Phase 3–4 architectural work
**MoSCoW**: Won't (in this audit phase — design only)

**Recommended API Routes to Design**:
```
POST   /api/auth/send-otp
POST   /api/auth/verify-otp
GET    /api/shops                  ?lat=&lng=&radius=
GET    /api/shops/:id
GET    /api/shops/:id/products
POST   /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id/status
GET    /api/shopkeeper/orders      ?shopId=&status=
GET    /api/shopkeeper/products    ?shopId=
POST   /api/shopkeeper/products
PATCH  /api/shopkeeper/products/:id
DELETE /api/shopkeeper/products/:id
```

---

### Gap B — No Real Authentication

**Root Cause**: `isShopkeeper` is a client-side boolean. No user identity, no session, no JWT. Any user can toggle shopkeeper mode and access any shop's dashboard.

**Impact**: Zero security boundary between customer and shopkeeper. In a real deployment, any customer could manage any shop's orders.

**Effort**: High (4)
**MoSCoW**: Won't (now — design in Phase 3)

**Recommended Auth Design**:
- Firebase Authentication (Phone number → SMS OTP) or Twilio Verify
- JWT returned by API server after OTP verification
- Role stored server-side per user (`customer` | `shopkeeper`)
- Shopkeeper linked to a specific `shopId`
- Expo SecureStore for token persistence (replaces `isShopkeeper` in AsyncStorage)

---

### Gap C — No Real Map / GPS

**Root Cause**: Shop coordinates are hardcoded Delhi lat/lng. User location is never requested. Distance strings are hardcoded. Web falls back to a grid.

**Impact**: The "hyperlocal" premise of the app cannot function — all users see the same shops at the same distances regardless of their actual location.

**Effort**: Medium (3)
**MoSCoW**: Won't (now — design in Phase 3)

**Recommended Design**:
- `expo-location` for user GPS permission and coordinates
- `react-native-maps` region centred on user position
- Distance computed as Haversine formula from user lat/lng to shop lat/lng
- Shops sorted by real computed distance
- Web: replace grid fallback with Leaflet.js map (no API key required)

---

### Gap D — No Push Notifications

**Root Cause**: Order status updates are local `useState` mutations visible only on the device that made the update. No mechanism to notify the customer's device when a shopkeeper advances an order.

**Effort**: High (4)
**MoSCoW**: Won't (now — design in Phase 3)

**Recommended Design**:
- Expo Push Notifications (`expo-notifications`)
- Push token registered at login, stored server-side against user record
- API server sends push when `PATCH /api/orders/:id/status` is called

---

## 4. Prioritised Backlog

### Tier 1 — Fix Now (Must / High Score)

| ID | Issue | Score | Effort | Expected Outcome |
|---|---|---|---|---|
| B5 | Reorder clears cart + sets shop | 12.0 | 1 | Cart integrity restored |
| B13 | Weight product shows correct price in card | 12.0 | 1 | Price consistency |
| B1 | Cross-shop cart guard | 10.0 | 2 | Data integrity |
| B11 | Router push type errors | 10.0 | 1 | Clean TypeScript |
| B12 | Search uses reactive product list | 10.0 | 1 | Search accuracy after B3 fix |
| B7 | Earnings exclude rejected orders | 9.0 | 1 | Correct shopkeeper metrics |
| B8 | Compute `isOpen` from open/close times | 7.5 | 2 | Accurate shop availability |
| B2 | Block ordering from closed shops | 6.0 | 2 | Valid orders only |
| B9 | OTP resend countdown timer | 6.0 | 1 | Correct UX |
| B10 | Checkout address validation | 6.0 | 1 | Valid delivery orders |
| B3 | Inventory ↔ catalogue connection | 8.3 | 3 | Functional inventory management |
| B24 | Persist `isShopkeeper` to AsyncStorage | 12.0 | 1 | No mode reset on restart |

### Tier 2 — Fix Soon (Should)

| ID | Issue | Score | Effort |
|---|---|---|---|
| B15 | Shopkeeper identity from context | 7.5 | 2 |
| B4 | Guard `placeOrder()` against null shop | 4.0 | 2 |
| B6 | Better order ID generation | 3.0 | 1 |
| B18 | Accessibility labels | 5.0 | 3 |

### Tier 3 — Nice to Have (Could)

| ID | Issue | Effort |
|---|---|---|
| B16 | Dark mode palette | 3 |
| B17 | Product/shop images | 3 |
| B20 | Coupon code logic | 2 |
| B21 | Customer profile screen | 3 |
| B23 | Auto-advancing tracking demo | 2 |
| B14 | Reanimated migration (performance) | 4 |

### Tier 4 — Architectural (Won't Now)

| Gap | Description |
|---|---|
| Gap A | Real API / backend integration |
| Gap B | Real authentication (Firebase/Twilio) |
| Gap C | Real GPS + dynamic shop discovery |
| Gap D | Push notifications |
| B22 | Real payment gateway (UPI, Razorpay) |
| B19 | Offline mode / network error handling |

---

## 5. Root Cause Themes

Grouping bugs by their underlying structural cause:

### Theme 1 — Missing AppContext Scope
**Bugs**: B1, B3, B4, B5, B15, B24
**Pattern**: State that should be shared globally lives either in local component state (inventory), is not included in context (shopkeeper identity, `isShopkeeper` persistence), or context actions lack defensive guards.
**Resolution**: Extend `AppContext` with: `shopProducts`, `currentUser` (shopId, role, name), and persist `isShopkeeper` to `AsyncStorage`. Add guards to `addToCart` and `placeOrder`.

### Theme 2 — Missing Data Validation
**Bugs**: B2, B7, B8, B10, B6
**Pattern**: Business rules that should validate or compute values are either absent or expressed as inert static data.
**Resolution**: Add a `shopUtils.ts` utility module with `isShopOpen()`, `computeDistance()`, `generateOrderId()`. Add input validation to checkout. Filter earnings by non-rejected status.

### Theme 3 — Stale / Non-Reactive Derivations
**Bugs**: B12, B13, B8
**Pattern**: Values that should be computed fresh from current state are precomputed at module load or use the wrong source (product prop vs cartItem).
**Resolution**: Move module-level computations into `useMemo`, use cartItem values where available.

### Theme 4 — UI State Not Persisted
**Bugs**: B9, B24, B4 (partial)
**Pattern**: UI state that users expect to survive an app restart (login mode, OTP countdown) is not persisted.
**Resolution**: Persist `isShopkeeper` and `selectedShop` to `AsyncStorage`. Real fix for B9 is backend OTP integration.

### Theme 5 — TypeScript Type Safety Gaps
**Bugs**: B11, B13 (implicit), B14 (implicit)
**Pattern**: String concatenation for typed routes, no null checks, component receives both `product` and `cartItem` but uses only one.
**Resolution**: Typed route objects for `router.push`, null guards at call sites, explicit display logic choosing between `cartItem.price` and `product.price`.

---

## 6. Enhancement Opportunities (Beyond Bug Fixes)

These are features not currently present that would significantly improve the product:

| Enhancement | Value | Effort | Phase |
|---|---|---|---|
| **Shop open/close schedule UI** | Show exact hours on shop card | Low | 3 |
| **Cart item summary on shop page** | Show "X items in cart from this shop" | Medium | 3 |
| **Order search / filter** | Filter orders by date, status, shop | Medium | 3 |
| **Inventory low-stock alerts** | Highlight products with stock < 5 | Medium | 3 |
| **Shopkeeper earnings chart** | 7-day earnings trend on dashboard | High | 3 |
| **Product image upload** | Allow shopkeeper to upload product photos | High | 4 |
| **Multi-address book** | Save home/work/other addresses | Medium | 4 |
| **Rating & review system** | Post-delivery customer ratings | High | 4 |
| **Real-time order updates** | WebSocket or SSE for order status | Very High | 4 |
| **Nearby shop radius control** | Slider to adjust discovery radius | Medium | 4 |

---

## 7. Phase 2 Summary

**Total issues identified**: 24 bugs + 4 architecture gaps + 10 enhancement opportunities

**Tier 1 fixes (do now)**: 12 bugs — all low-to-medium effort, high impact, can be batched into a single improvement sprint

**Tier 2 fixes (do next)**: 4 bugs — slightly more design consideration needed

**Architecture gaps**: 4 items requiring full backend integration design (Phase 3–4 scope)

**Dominant root cause**: Missing state scope in `AppContext` (Theme 1) — fixing this unblocks B1, B3, B4, B5, B15, B24 simultaneously and is the highest-leverage single change.

**Recommended implementation order for Tier 1**:
1. AppContext extensions (B3, B1, B15, B24) — highest leverage, unblocks multiple fixes
2. Data validation utilities (B8, B2, B7, B10) — utility functions, testable
3. UI correctness (B13, B5, B9, B11, B12) — one-liner or small changes
4. Review and QA

---

*End of Phase 2 Analysis. Ready for Phase 3 (Solution Architecture) when approved.*
