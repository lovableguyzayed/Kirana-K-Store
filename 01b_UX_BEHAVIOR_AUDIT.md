# 01b — UX & UI Behavioral Deep-Dive Audit
**Kirana Konnect · Phase 1.5**
*Conducted: May 2026 · Scope: All 13 screens, both customer and shopkeeper modes*

---

## Section A — Persona & Journey Findings

### A1. User Personas

---

#### Persona 1 — Ramesh, the Regular Customer
| Attribute | Detail |
|---|---|
| Age / Context | 34 years old, semi-urban locality, daily grocery buyer |
| Device | Android mid-range phone, ~4G, some connectivity drops |
| Tech comfort | Medium — uses WhatsApp, Swiggy; not developer-savvy |
| Primary goal | Order milk, bread, and vegetables quickly from the nearest open kirana |
| Top 5 tasks | 1. Find nearest open kirana · 2. Browse products by category · 3. Add multiple items · 4. Choose delivery and pay COD · 5. Track order |

**Simulated Journey: Ramesh opens app to order milk**

| Step | What user sees | Expected action | Actual behaviour | Friction |
|---|---|---|---|---|
| 1 | Splash screen (2.8 s, green, animated logo) | Wait | Auto-redirects to login | Duration fine; no skip option; re-shown every cold start |
| 2 | Login screen: phone input + "Send OTP" | Type number, tap Send | Spinner for 1 s, transitions to OTP | **No "remember me" / session persistence across app restarts** |
| 3 | OTP screen: 6 boxes, 30 s countdown | Enter OTP | Auto-advances focus box-to-box | Fine — but no visual success feedback after verify |
| 4 | Home (map + bottom sheet) | Identify nearby open shops | Sheet collapsed at 200 px; user must scroll up or tap "More" | **Open/closed badge exists, but sheet is very short** — user may miss shops |
| 5 | Taps shop pin on map | Popup appears, taps "→" arrow | Navigates to Shop Detail | Fine; but pin popup closes on tap of arrow — **no "view from list" alternate** |
| 6 | Shop Detail | Scroll products, add to cart | Category tabs work; Add button shows qty stepper inline | **No sticky cart total visible** while browsing products; CartBar only shown at bottom |
| 7 | Taps cart bar | Goes to Cart screen | Cart shows items, delivery toggle, price breakdown | Fine; free delivery hint is useful |
| 8 | Taps Checkout | Checkout screen | Address cards shown, payment selector, order summary | **No "change delivery mode" option** on checkout — must go back to cart |
| 9 | Taps "Place Order" | Order placed, redirects to tracking | Tracking opens with 5-step timeline; auto-advances every 5 s | **No success animation / toast / confetti** — feels abrupt |
| 10 | Tracking: Delivered | "Back to Home" button | Returns to home tab | Fine |

**Key friction points for Ramesh:** No persistent login, no profile tab, no quantity pre-selection before adding to cart on product detail screen, no visible cart total while browsing, no global toast system.

---

#### Persona 2 — Sunita, the First-Time Customer
| Attribute | Detail |
|---|---|
| Age / Context | 52 years old, first smartphone user, switched from phone calls to apps |
| Device | iOS budget device (iPhone SE), small screen |
| Tech comfort | Low — intimidated by unfamiliar interfaces |
| Primary goal | See what shops are available near her and understand the app |
| Top 5 tasks | 1. Understand what the app is for · 2. Find a shop on map · 3. View product details · 4. Place first order · 5. Get help if confused |

**Simulated Journey: Sunita first opens the app**

| Step | What user sees | Expected action | Actual behaviour | Friction |
|---|---|---|---|---|
| 1 | Splash (green, tagline "Your neighbourhood store, delivered to your door") | Read, wait | 2.8 s auto-redirect | Tagline visible only briefly; **no onboarding flow follows** |
| 2 | Login screen | Understand what to do | Phone input shown clearly | **No value proposition shown** on login; no explanation of what Kirana Konnect is |
| 3 | OTP | Enter OTP | Works | No fallback for "I didn't get OTP" beyond resend button |
| 4 | Home map | Understand the map pins | Map visible, pins colored by open/closed | **No tooltips or coach marks** to explain what the pins are or how to interact |
| 5 | Bottom sheet shops | Understand list | Shop list shows name, rating, distance | **No first-use empty state coaching** ("Tap a pin to see a shop!") |
| 6 | Shop Detail | Browse products | Categories and product cards shown | Product descriptions exist but collapsed — **description only visible via product detail tap** |
| 7 | Product Detail | Understand product | Good detail screen with stock info and reviews | **"Premium quality product for daily use"** is a hardcoded placeholder — not the real description |
| 8 | Add to cart | Knows what cart is | Inline +/- appears | No cart badge in tab bar — **no persistent visual reminder that items are in cart** |

**Key friction for Sunita:** Needs onboarding, no coach marks, placeholder copy in product detail ("Premium quality product for daily use"), no help/FAQ, intimidating for first use.

---

#### Persona 3 — Arvind, the Returning Power User
| Attribute | Detail |
|---|---|
| Age / Context | 28 years old, urban, orders daily, uses Swiggy/Zepto |
| Device | Flagship Android, fast 5G |
| Tech comfort | High — expects fluid, responsive interactions |
| Primary goal | Re-order usual items in < 30 seconds |
| Top 5 tasks | 1. Reorder last order · 2. Check order status · 3. Add a new item quickly · 4. Switch between pickup and delivery · 5. Check order history |

**Key friction for Arvind:** No persistent login (logs in fresh every session), no "quick reorder" shortcut from home, no deep-link to a specific shop or product, no ability to save favorite shops, no dark mode toggle (respects system but no manual override), no swipe-to-delete on cart items.

---

#### Persona 4 — Ramesh Gupta, the Shopkeeper
| Attribute | Detail |
|---|---|
| Age / Context | 52 years old, runs Gupta Kirana Store, uses phone for WhatsApp |
| Device | Android mid-range, always-on |
| Tech comfort | Medium-low — familiar with simple UI, not complex dashboards |
| Primary goal | Accept/reject orders quickly; manage stock level |
| Top 5 tasks | 1. See new orders immediately · 2. Accept order with one tap · 3. Mark order as packed/ready · 4. Add new product to inventory · 5. Toggle a product as out-of-stock |

**Simulated Journey: Shopkeeper gets a new order**

| Step | What user sees | Expected action | Actual behaviour | Friction |
|---|---|---|---|---|
| 1 | Dashboard (default tab) | Check for new orders | Stats shown; Recent Orders card shown | **No push notification / badge count on Orders tab** when new order arrives |
| 2 | Taps Orders tab | See new orders | "New Orders" section shows pending orders with Accept/Reject | Good layout; but **no sound/vibration alert** for urgent orders |
| 3 | Taps Accept | Order accepted | Status updates, order moves to Active | Fine; haptic feedback present |
| 4 | Later: Mark as Packed | Tap "Mark as Packed" | Status advances to packed | Fine |
| 5 | Inventory: Adds new product | Fill form, tap "Add Product" | Product added to context, visible in shop | Good; **but no success toast confirming save** |
| 6 | Logout | Tap logout icon | Confirms, returns to login | Fine; **no confirmation dialog** before logout |

---

### A2. Complete Screen-by-Screen UI Element Inventory

| Screen | Elements | Primary CTA | Secondary | Navigation |
|---|---|---|---|---|
| **Splash** | Logo card, app name, tagline, info pill, 3 loading dots, version label | None (auto-redirect) | None | Auto → Login (2.8s) |
| **Login** | Logo, title, subtitle, phone input (+91 prefix), Send OTP button, OTP boxes (×6), resend countdown/button, Verify button, change-number back link, shopkeeper toggle | "Send OTP" / "Verify" | Shopkeeper toggle | → (tabs) or (shopkeeper) |
| **Home / Map** | Search bar, 4 filter chips, map (pins), shop popup (on pin tap), bottom sheet (handle, title, sub, expand btn, shop rows), cart FAB | Shop row tap → Shop Detail | Filter chips, expand sheet, cart FAB | Tab bar (2 tabs: Discover, Orders) |
| **Shop Detail** | Green header (back, shop icon, name, address, rating, distance, open badge, hours), closed banner (conditional), category chips (horizontal scroll), product count label, product cards, CartBar | ProductCard "Add" button | Category filter chips | Back button, CartBar → Cart |
| **Product Detail** | Fixed header (back, title, sub, cart icon + dot), product icon, name, placeholder desc, category/type badges, price grid, stock card, quantity stepper (unit-based only), reviews (3 static), fixed bottom bar (price + add/qty controls) | "Add to Cart" / qty stepper | Cart icon in header | Back button, cart icon |
| **Search** | Back button, search input (auto-focus), shops section (when results), products list | Product/shop row tap → navigate | Back button | Back button |
| **Cart** | Back button, item count badge, pickup/delivery toggle, item cards (icon, name, unit, price, qty stepper, delete, subtotal), price breakdown card, "free delivery" hint, fixed checkout bar | "Proceed to Checkout" | Delivery mode toggle, remove items | Back button |
| **Checkout** | Back button, delivery address cards (×2 + custom input), payment method cards (COD, UPI), order summary (items, subtotal, delivery fee, total), place order bar | "Place Order · ₹X" | Address selection, payment method selection | Back button |
| **Order Tracking** | Back button, order header card, rider live map (conditional: out_for_delivery/delivery mode), rider info (name, vehicle, call/msg buttons, rating), status timeline (5 steps), items ordered card, delivery info card, "Back to Home" (post-delivery) | "Back to Home" (delivered state) | Call/msg rider buttons | Back button (→ orders tab) |
| **Orders (customer)** | Title, order cards (shop, ID, status badge, items, total, mode, reorder btn), Track Order button (for active orders), empty state + "Browse Shops" CTA | "Reorder" / "Track Order" | Status badge | Tab bar |
| **Shopkeeper Dashboard** | Green banner (logo, shop name, owner, open badge, logout), 3 stat cards, map placeholder card, recent orders card | "See all" → SK orders tab | Logout | Tab bar (3 tabs) |
| **Shopkeeper Orders** | Header + "X New" badge, new orders section (accept/reject), active orders section (pack/ready/OFD badge), empty state | "Accept" | "Reject", "Mark as Packed", "Out for Delivery" | Tab bar |
| **Shopkeeper Inventory** | Header (title + "Add Product"), 3 stat chips (total/active/OOS), search bar, category chips, product FlatList, Add/Edit modal (full) | "Add Product" | Edit/toggle/delete per item | Tab bar |

---

## Section B — Missing States & Feedback

### B1. Missing UI States — Screen Audit

| Screen | Loading | Empty | Error | Success | Offline | Auth-expired |
|---|---|---|---|---|---|---|
| Splash | N/A | N/A | ❌ No error if fonts fail | N/A | ❌ | N/A |
| Login | ✅ Spinner on buttons | N/A | ❌ No error if OTP "fails" | ❌ No success toast after login | ❌ | N/A |
| Home/Map | ❌ No skeleton while shops load | N/A | ❌ No state if map crashes (web) | N/A | ❌ | ❌ Not redirected to login |
| Shop Detail | ❌ No skeleton | ❌ Empty product list shows nothing, no message | ❌ | N/A | ❌ | ❌ |
| Product Detail | ✅ "Not found" state | N/A | N/A | ❌ No "Added!" confirmation | ❌ | ❌ |
| Search | ✅ "No results" state | ✅ "Search Products" prompt | ❌ | N/A | ❌ | ❌ |
| Cart | ✅ Empty cart state | ✅ Empty with CTA | ❌ | N/A | ❌ | ❌ |
| Checkout | ❌ No address loading skeleton | N/A | ❌ Catches placeOrder throw but no retry UI | ✅ Spinner on button | ❌ | ❌ |
| Tracking | ❌ Null guard only (returns null silently) | N/A | ❌ | ❌ No "🎉 Delivered!" celebration | ❌ | ❌ |
| Orders (customer) | ❌ No skeleton | ✅ Empty state + CTA | ❌ | ❌ | ❌ | ❌ |
| SK Dashboard | ❌ | ✅ "No orders yet" text | ❌ | N/A | ❌ | ❌ |
| SK Orders | ❌ | ✅ Empty inbox state | ❌ | ❌ No toast on accept/reject | ❌ | ❌ |
| SK Inventory | ❌ | ✅ "No products found" | ❌ | ❌ No save confirmation | ❌ | ❌ |

**Summary of critical missing states:**

| ID | State | Screens affected | Severity |
|---|---|---|---|
| MS-01 | Global offline banner | All screens | High |
| MS-02 | Skeleton loaders | Shop Detail, Orders, Dashboard | Medium |
| MS-03 | Success toasts (add to cart, place order, product saved) | Product Detail, Checkout, SK Inventory | High |
| MS-04 | Session expiry → redirect to login | All authenticated screens | Critical |
| MS-05 | Empty product list message in Shop Detail | Shop Detail | Medium |
| MS-06 | Order delivery celebration ("🎉 Delivered!") | Tracking | Medium |
| MS-07 | Error state with retry in Checkout | Checkout | High |

---

### B2. Missing Feedback Mechanisms

| ID | Mechanism | Where Missing | Severity |
|---|---|---|---|
| FB-01 | **Toast / snackbar** after "Add to Cart" | ProductCard, Product Detail, AddToCartModal | High |
| FB-02 | **Toast** after order placed | Checkout → Tracking transition | High |
| FB-03 | **Toast** after shopkeeper saves product | SK Inventory modal "Save Changes" | Medium |
| FB-04 | **Toast** after accept/reject order | SK Orders accept/reject buttons | Medium |
| FB-05 | **Confirmation dialog** before logout | SK Dashboard logout button | Medium |
| FB-06 | **Confirmation dialog** before deleting product | SK Inventory delete button | High |
| FB-07 | **Confirmation dialog** before clearing cart (cross-shop) | Already implemented via Alert ✅ | — |
| FB-08 | **Inline quantity animation** when +/- tapped | ProductCard qty stepper, Cart items | Low |
| FB-09 | **Swipe-to-delete** gesture on cart items | Cart screen item list | Medium |
| FB-10 | **Pull-to-refresh** on Orders, SK Dashboard, SK Orders | All list screens | Medium |
| FB-11 | **"Added to cart" checkmark pulse** on ProductCard Add button | ProductCard | Low |
| FB-12 | **Loading spinner on "Place Order"** | Checkout — ✅ Already implemented | — |
| FB-13 | **Haptic on OTP verify success** | Login — partially implemented | Low |

---

### B3. Missing Navigation Aids

| ID | Issue | Screen | Severity |
|---|---|---|---|
| NA-01 | **No Profile tab** in customer tab bar | `(tabs)/_layout.tsx` — only 2 tabs | High |
| NA-02 | **No way to view/edit saved addresses from profile** | No profile screen exists | High |
| NA-03 | **No persistent cart icon** in customer navigation (only FAB on home, header dot on product detail) | Shop Detail, Checkout | Medium |
| NA-04 | **Back from Tracking goes to Orders tab** (router.replace) — correct, but **no breadcrumb** showing journey | Tracking | Low |
| NA-05 | **Search is only accessible from home screen focus** — no search icon in tab bar | Tab bar | Medium |
| NA-06 | **No "Continue Shopping" CTA** from cart | Cart empty state → Browse Shops ✅; non-empty cart has no back-to-shop shortcut | Medium |
| NA-07 | **No deep-link support** — sharing a shop link would open app root | All | Medium |
| NA-08 | **Filter/sort** missing on Order History (customer) | Orders tab | Low |
| NA-09 | **No "scroll to top" affordance** on long product lists | Shop Detail, SK Inventory | Low |
| NA-10 | **No notification center / bell icon** | All | Medium |

---

## Section C — Visual & Consistency Issues

### C1. Spacing & Layout Inconsistencies

| ID | Issue | Location | Severity |
|---|---|---|---|
| VI-01 | `product/[id].tsx` uses **hardcoded hex colors** (`#1e293b`, `#64748b`, `#f1f5f9`) instead of `useColors()` — breaks dark mode support | `product/[id].tsx` | High |
| VI-02 | `product/[id].tsx` displays **"Premium quality product for daily use"** as the product description, ignoring `product.description` field which has rich content | `product/[id].tsx` line 138 | Critical |
| VI-03 | `cart.tsx` — qty button touch targets are 6 px horizontal padding + 4 px vertical — **below 44×44 px minimum** | `cart.tsx` `qtyBtn` style | High |
| VI-04 | `product/[id].tsx` back button border-radius is `8` vs `18` (circle) on all other screens — **inconsistent shape** | `product/[id].tsx` `backBtn` | Low |
| VI-05 | `tracking/[id].tsx` call/message rider buttons have **no accessibility label and no action handler** — purely decorative | `tracking/[id].tsx` lines 312-316 | High |
| VI-06 | **Two different tab bar heights**: customer = implicit native height; shopkeeper = `height: 84` on web. Visually consistent but could differ on some devices | `_layout.tsx` both | Low |
| VI-07 | **Shop Detail header** uses a hardcoded `../../assets/images/icon.png` as the shop image for every shop — no per-shop image differentiation | `shop/[id].tsx` | Medium |
| VI-08 | `getProductById` in `product/[id].tsx` and `cart.tsx` still uses the **static `MOCK_PRODUCTS`** export rather than reactive `shopProducts` from context — shopkeeper edits won't appear in product detail | `product/[id].tsx`, `cart.tsx` | High |
| VI-09 | **Star rating icons** use `Feather name="star"` (outline) in some places and filled appearance via color in others — no filled star icon in Feather, inconsistent with common patterns | Home, Shop Detail, Order card | Low |
| VI-10 | `product/[id].tsx` uses `marginTop: topPad + 60` as a hardcoded scroll offset — **fragile**: if the fixed header height changes, scroll content overlaps the header | `product/[id].tsx` line 124 | Medium |
| VI-11 | **Shop Detail product count** label says "X products" but counts all products including weight-based ones — unit not specified | `shop/[id].tsx` | Low |
| VI-12 | **Cart item quantity buttons** (`qtyBtn` in `cart.tsx`) use `paddingHorizontal: 6, paddingVertical: 4` — too small for reliable tapping, especially for Persona 2 (Sunita) | `cart.tsx` | High |
| VI-13 | **Inventory modal** on Android uses `animationType="slide"` but no `backdropPressBehavior` — tapping the backdrop doesn't dismiss | `inventory.tsx` — fixed with `Pressable` overlay ✅ in AddToCartModal, but not in Inventory modal | Medium |
| VI-14 | **No placeholder image** for shops — emoji 🛒 used throughout. Functional but visually uniform — all shops look identical | ShopCard, Home, Shop Detail | Low |

### C2. Typography Drift

| ID | Issue | Severity |
|---|---|---|
| TY-01 | `product/[id].tsx` `sectionTitle` uses hardcoded `color: "#1e293b"` instead of `colors.foreground` | High |
| TY-02 | `product/[id].tsx` header title `fontSize: 16, fontWeight: "600"` — elsewhere headers are 17–18 px `fontWeight: 700` | Low |
| TY-03 | Order ID shown as `#O003TOUPPERCASE` — inconsistent uppercase logic across screens (some `.toUpperCase()`, some not) | Low |
| TY-04 | `splash.tsx` app name `fontSize: 34` — different from all other title uses (18–24); intentional but worth flagging | Low |

### C3. Color Issues

| ID | Issue | Severity |
|---|---|---|
| CO-01 | `product/[id].tsx` uses raw hex `#2563eb` (blue), `#16a34a` (green), `#f59e0b` (amber) — outside the design system | High |
| CO-02 | Closed-store banner uses hardcoded `#FFEBEE` / `#C62828` — not from `useColors()`. Will break in dark mode | Medium |
| CO-03 | Tracking "LIVE" badge uses hardcoded `#C62828` — same issue | Low |
| CO-04 | `colors.success` and `colors.rating` used in places but not consistently defined in `useColors` — need to verify hook has all tokens | Medium |
| CO-05 | Map grid cells in web MapView use hardcoded `#E8F5E9`, `#F1F8E9`, `#C8E6C9` — no dark mode adaptation | Low |

---

## Section D — Prioritized List of UI Elements to Add or Fix

Severity: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low

### D1. Critical Issues (must fix before any production release)

| # | Issue | Screen / File | Fix |
|---|---|---|---|
| D-01 🔴 | **Product description hardcoded as placeholder** — "Premium quality product for daily use" | `product/[id].tsx` line 138 | Replace with `product.description || "No description available."` |
| D-02 🔴 | **`getProductById` uses static data** — shopkeeper inventory edits not reflected in Product Detail or Cart | `product/[id].tsx`, `cart.tsx` | Replace `getProductById()` with a lookup in `shopProducts` from context |
| D-03 🔴 | **No session persistence** — user must log in on every cold start | `_layout.tsx`, `AppContext` | On app load, read `kk_user` from AsyncStorage (already stored) and route accordingly; don't always go to splash→login |
| D-04 🔴 | **Rider call/message buttons are non-functional** | `tracking/[id].tsx` | Link to `Linking.openURL("tel:...")` / `Linking.openURL("sms:...")` using `RIDER.phone` |
| D-05 🔴 | **No route guard** — customer can navigate to `/(shopkeeper)/` by URL if they know it | `(shopkeeper)/_layout.tsx` | Add `useEffect` that checks `currentUser?.role !== "shopkeeper"` and `router.replace("/login")` |

### D2. High Priority — Core UX improvements

| # | Issue | Screen / File | Fix |
|---|---|---|---|
| D-06 🟠 | **No global toast system** | All screens | Add `ToastProvider` + `useToast()` hook; trigger toasts for add-to-cart, order placed, product saved, accept/reject order |
| D-07 🟠 | **Logout without confirmation** | SK Dashboard | Add `Alert.alert("Log out?", "...", [Cancel, Logout])` before `setCurrentUser(null)` |
| D-08 🟠 | **Delete product without confirmation** | SK Inventory | Add `Alert.alert("Delete product?", ...)` before `deleteProduct()` |
| D-09 🟠 | **Cart qty touch targets too small** (6/4 px padding) | `cart.tsx` `qtyBtn` | Increase to `paddingHorizontal: 12, paddingVertical: 10` minimum |
| D-10 🟠 | **`product/[id].tsx` ignores `useColors()`** — broken dark mode | `product/[id].tsx` | Fully migrate all hardcoded colors to `useColors()` tokens |
| D-11 🟠 | **No Profile tab** — no way to view phone, saved addresses, switch mode | Customer tab bar | Add a third "Profile" tab with: phone number, saved addresses, order preferences, app version, logout |
| D-12 🟠 | **No success state after order placed** | `checkout.tsx` → `tracking/[id].tsx` | Add a "Order Placed! 🎉" animated banner at top of Tracking screen for 3 s on first mount |
| D-13 🟠 | **No "OFD → Delivered" button** for shopkeeper (out_for_delivery stays indefinitely) | SK Orders | Add "Mark Delivered" button for `out_for_delivery` orders |
| D-14 🟠 | **Inventory modal backdrop doesn't dismiss on outside tap** | SK Inventory modal | Wrap the overlay in a `Pressable` with `onPress={() => setShowModal(false)}` |
| D-15 🟠 | **No new-order alert for shopkeeper** | SK app-wide | Add a badge count on Orders tab icon driven by `pendingOrders.length` |
| D-16 🟠 | **Pull-to-refresh** absent on all list screens | Orders, SK Dashboard, SK Orders | Add `RefreshControl` on all `ScrollView` / `FlatList` components |

### D3. Medium Priority — Polish & completeness

| # | Issue | Screen / File | Fix |
|---|---|---|---|
| D-17 🟡 | **No "Open Now" time-aware state on orders history** — old orders show as "Open" if shop flags are true | Orders tab `getShopById` lookup | Use timestamp-based display rather than live open/closed on past orders |
| D-18 🟡 | **Search accessible only from Home** | Tab bar | Add search icon to Tab bar or header area |
| D-19 🟡 | **No free-delivery progress bar** in shop detail while browsing | Shop Detail | Show a subtle "₹X away from free delivery" progress strip in CartBar |
| D-20 🟡 | **Swipe-to-delete** missing on cart items | Cart | Add `react-native-gesture-handler` `Swipeable` on each cart item row |
| D-21 🟡 | **Closed-banner and product colors hardcoded** | `shop/[id].tsx`, multiple | Move to `useColors()` tokens |
| D-22 🟡 | **No "Favorite shops" feature** | Home, Shop Detail | Add heart icon on ShopCard / shop detail header; persist favorites in AsyncStorage |
| D-23 🟡 | **No "add notes to order"** field in Checkout | `checkout.tsx` | Add a multiline TextInput for delivery instructions (e.g., "Leave at door") |
| D-24 🟡 | **Static reviews on product detail** — always same 3 names/comments | `product/[id].tsx` | Either mark clearly as "Sample reviews" or seed reviews per product |
| D-25 🟡 | **Tracking screen returns `null` silently** if order not found | `tracking/[id].tsx` | Replace with a proper "Order not found" error state with back button |
| D-26 🟡 | **No shopkeeper "Mark Delivered"** for pickup orders | SK Orders | For pickup mode + packed status, show "Handed Over" button → `delivered` |
| D-27 🟡 | **No ETA countdown for pickup mode** | Tracking | Hide rider map for pickup but show "Ready in ~5 min" timer when packed |
| D-28 🟡 | **Weight-based "kg" badge on cart icon** is hardcoded "kg"** | `cart.tsx` line 102 | Derive unit from product (litres → "L") |
| D-29 🟡 | **product/[id].tsx `marginTop: topPad + 60`** | `product/[id].tsx` | Replace fixed offset with a proper header-measuring approach or ref-based layout |
| D-30 🟡 | **No "continue shopping" shortcut from Cart** | `cart.tsx` | Add a "← Continue Shopping" text link in cart header or below items |

### D4. Low Priority — Microinteraction & polish

| # | Issue | Screen / File | Fix |
|---|---|---|---|
| D-31 🟢 | No **"🎉 Delivered" celebration** (confetti / animation) | `tracking/[id].tsx` | Trigger `Animated` confetti particles or `expo-av` sound on `status === "delivered"` first mount |
| D-32 🟢 | Star rating uses outline `Feather` star (no filled variant) | All | Use `@expo/vector-icons` FontAwesome `"star"` (filled) for completed stars |
| D-33 🟢 | **Splash shown every cold start** even for logged-in users | `app/index.tsx` | Skip splash and go directly to `/(tabs)` if `kk_user` exists in AsyncStorage |
| D-34 🟢 | Shop Detail header image is same app icon for all shops | `shop/[id].tsx` | Generate colored initials avatar per shop (e.g., "G" for Gupta Kirana, green background) |
| D-35 🟢 | **No dark mode toggle** in Profile (when it exists) | Future profile screen | Respect system setting (already done), add manual override in settings |
| D-36 🟢 | Cart item delete button has **no hit-slop** | `cart.tsx` trash icon | Add `hitSlop={{ top:10, bottom:10, left:10, right:10 }}` |
| D-37 🟢 | **Inventory stats** ("Total/Active/OOS") don't animate when numbers change | SK Inventory | Wrap stat value in `Animated.Text` for count-up on mount |
| D-38 🟢 | **Map web view** road lines always visible regardless of theme | `MapView.web.tsx` | Adapt road color to dark mode |
| D-39 🟢 | **"Kirana Konnect" sub-label** on Product Detail header is unnecessary | `product/[id].tsx` line 115 | Remove — redundant branding inside the app |
| D-40 🟢 | **Inventory search bar background** same as overall background on some themes | SK Inventory | Use `colors.muted` consistently (already done for some); verify on dark mode |

---

## Summary Statistics

| Severity | Count |
|---|---|
| 🔴 Critical | 5 |
| 🟠 High | 11 |
| 🟡 Medium | 14 |
| 🟢 Low | 10 |
| **Total issues** | **40** |

---

## Phase 4 Integration Tags (for Action Plan merge)

All items below must be merged into the Phase 4 Implementation Plan as `[UX]`-tagged work packages:

**Sprint A (Critical — block release):**
`[UX-D01]` Fix placeholder description · `[UX-D02]` Fix reactive product lookup · `[UX-D03]` Auto-login from stored session · `[UX-D04]` Functional rider call/SMS buttons · `[UX-D05]` Shopkeeper route guard

**Sprint B (High — must ship):**
`[UX-D06]` Global toast system · `[UX-D07]` Logout confirmation · `[UX-D08]` Delete product confirmation · `[UX-D09]` Cart qty touch targets · `[UX-D10]` Dark mode in product detail · `[UX-D11]` Profile tab · `[UX-D12]` Order success celebration · `[UX-D13]` "Mark Delivered" for shopkeeper · `[UX-D14]` Inventory modal backdrop dismiss · `[UX-D15]` Orders tab badge count · `[UX-D16]` Pull-to-refresh on all lists

**Sprint C (Medium — quality bar):**
`[UX-D17]` through `[UX-D30]` as a polish sprint

**Sprint D (Low — delight):**
`[UX-D31]` through `[UX-D40]` as a stretch sprint
