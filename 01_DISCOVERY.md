# Phase 1 — Application Discovery & Design Research

> Generated: 2026-05-20 | Auditor: Senior Product Designer / UI-UX Specialist / Full-Stack Engineer  
> Codebase: `artifacts/kirana-konnect/` | Framework: Expo 54 / React Native 0.81.5

---

## 1.1 Project & Tech Stack Map

### Folder Tree (depth 4)

```
artifacts/kirana-konnect/
├── app/
│   ├── _layout.tsx                   ← Root layout (fonts, providers, Stack nav)
│   ├── index.tsx                     ← Entry redirect → /splash
│   ├── splash.tsx                    ← Animated splash → auto-login or /login
│   ├── login.tsx                     ← Phone + OTP login, shopkeeper toggle
│   ├── search.tsx                    ← Global search (products + shops)
│   ├── cart.tsx                      ← Cart review, pickup/delivery toggle
│   ├── checkout.tsx                  ← Address, payment, place order
│   ├── +not-found.tsx                ← 404 screen
│   ├── (tabs)/
│   │   ├── _layout.tsx               ← Customer bottom tab bar
│   │   ├── index.tsx                 ← Map/Discover home screen
│   │   ├── orders.tsx                ← Customer order history
│   │   └── profile.tsx               ← Customer profile & settings
│   ├── (shopkeeper)/
│   │   ├── _layout.tsx               ← Shopkeeper bottom tab bar + route guard
│   │   ├── dashboard.tsx             ← SK business dashboard
│   │   ├── orders.tsx                ← SK order management
│   │   └── inventory.tsx             ← SK product CRUD
│   ├── shop/
│   │   └── [id].tsx                  ← Shop detail + category tabs + products
│   ├── product/
│   │   └── [id].tsx                  ← Product detail + reviews + add-to-cart
│   └── tracking/
│       └── [id].tsx                  ← Live order tracking + status timeline
├── components/
│   ├── AddToCartModal.tsx            ← Qty/weight selector bottom sheet
│   ├── CartBar.tsx                   ← Floating cart snackbar
│   ├── ProductCard.tsx               ← List product card with inline qty controls
│   ├── ShopCard.tsx                  ← Shop list/grid card
│   ├── MapView.tsx                   ← Native map (react-native-maps)
│   ├── MapView.web.tsx               ← Web grid mock (no real map on web)
│   ├── ErrorBoundary.tsx             ← Global crash boundary
│   ├── ErrorFallback.tsx             ← Crash UI with restart button
│   └── KeyboardAwareScrollViewCompat.tsx  ← Cross-platform keyboard scroll
├── context/
│   ├── AppContext.tsx                ← Central state: cart, orders, user, products
│   └── ToastContext.tsx              ← Animated top-toast notifications
├── constants/
│   └── colors.ts                    ← Design token palette + radius
├── hooks/
│   └── useColors.ts                 ← Dark/light mode token resolver
├── utils/
│   └── shopUtils.ts                 ← Shop hours, haversine distance util
├── assets/images/
│   ├── icon.png
│   ├── amul_milk.png, atta.png, kirana_store.png, veggies.png
├── scripts/build.js
├── server/serve.js
├── app.json
├── package.json
└── tsconfig.json
```

### Tech Stack

| Category | Technology | Version |
|---|---|---|
| Framework | Expo | ~54.0.27 |
| Runtime | React Native | 0.81.5 |
| Language | TypeScript | ~5.9.2 |
| Navigation | Expo Router — file-based Stack + Tabs | ~6.0.17 |
| Styling | React Native `StyleSheet` + inline `useColors()` tokens | — |
| Component library | Custom — **zero** third-party UI library | — |
| Icon library | `@expo/vector-icons` Feather exclusively | ^15.0.3 |
| Fonts | Inter (400/500/600/700) via `@expo-google-fonts/inter` | ^0.4.0 |
| Animation | `react-native-reanimated` + core `Animated` API | ~4.1.1 |
| Gestures | `react-native-gesture-handler` | ~2.28.0 |
| Maps | `react-native-maps` (native) / custom grid mock (web) | 1.18.0 |
| State | React Context (AppContext) + `@tanstack/react-query` | — |
| Persistence | `@react-native-async-storage/async-storage` | 2.2.0 |
| Haptics | `expo-haptics` | ~15.0.8 |
| Blur | `expo-blur` — iOS tab bar | ~15.0.8 |
| Keyboard | `react-native-keyboard-controller` | 1.18.5 |
| Safe area | `react-native-safe-area-context` | ~5.6.0 |
| Location | `expo-location` — **installed, not wired** | ~19.0.8 |
| Image Picker | `expo-image-picker` — **installed, not wired** | ~17.0.9 |
| Linear Gradient | `expo-linear-gradient` — **installed, not used** | ~15.0.8 |
| SVG | `react-native-svg` — **installed, not used** | 15.12.1 |
| HTTP client | `@workspace/api-client-react` (workspace package) | — |
| Validation | `zod` (catalog version) | — |

---

## 1.2 Application Purpose & User Identification

### What This App Does

Kirana Konnect is a **hyperlocal grocery discovery and ordering platform** built for the Indian market. It connects customers with nearby neighbourhood kirana (corner grocery) stores, letting them browse store catalogues, add items to a cart, and place orders for either home delivery or in-store pickup. Customers can track their delivery in real time with an animated rider map and status timeline. On the other side, shop owners operate in a dedicated **Shopkeeper mode** — they manage live inventory, accept or reject incoming orders, advance each order through a fulfilment pipeline (accepted → packed → dispatched → delivered), and monitor daily earnings on a business dashboard. The app is entirely OTP-based (no passwords), and sessions persist across app restarts via AsyncStorage. All data is currently mock/in-memory; there is no live backend.

### User Personas

| Persona | Goal | Core jobs-to-be-done |
|---|---|---|
| **Customer** | Quickly find and order groceries from a nearby store | Discover open stores on map; browse catalogue; add to cart; checkout; track delivery; reorder from history |
| **Shopkeeper / Store Owner** | Manage daily orders and keep catalogue current | View + action incoming orders; advance order status; add/edit/delete products; monitor earnings |
| **Guest (unauthenticated)** | Currently blocked — no guest browsing | *(Not implemented — auth is mandatory before any content is accessible)* |

### Core Value Proposition

Hyperlocal grocery ordering with real-time tracking, purpose-built for the Indian kirana store ecosystem — giving neighbourhood shop owners a digital storefront and customers a faster way to shop local.

---

## 1.3 Existing Screen Inventory

### Customer Screens

| Screen | Route | Purpose | Entry | Exit | Status |
|---|---|---|---|---|---|
| **Splash** | `/splash` | Animated logo; AsyncStorage check; auto-routes to home or login | App cold start | `/login`, `/(tabs)`, `/(shopkeeper)/dashboard` | ✅ Complete |
| **Login** | `/login` | Phone entry → 6-digit OTP → session; shopkeeper toggle | Splash (new user), Logout | `/(tabs)`, `/(shopkeeper)/dashboard` | ✅ Complete |
| **Map / Discover** | `/(tabs)/` | Full-screen map + draggable bottom sheet; shop pins; filter chips; search bar entry point | Tab bar, Deep link | `/shop/[id]`, `/search`, `/cart` | ✅ Complete |
| **Search** | `/search` | Auto-focus search; simultaneous product + shop results; grouped output | Search icon on Discover / Shop header | `/shop/[id]`, `/product/[id]` | ✅ Complete |
| **Shop Detail** | `/shop/[id]` | Shop header (hours, rating, distance, open/closed); category tabs; product grid; CartBar | Map pin, Shop card, Search result | `/product/[id]`, `/cart`, Back | ✅ Complete |
| **Product Detail** | `/product/[id]` | Category icon, stock status, qty/weight selector, mock reviews; bottom CTA bar | Product card tap | `/cart`, Back | ✅ Complete |
| **Cart** | `/cart` | Items list with inline qty; pickup/delivery toggle; price breakdown; cross-shop conflict handling | CartBar, Cart icon | `/checkout`, Back | ✅ Complete |
| **Checkout** | `/checkout` | Saved address selector + custom entry; COD/UPI toggle; shop-closed guard; place order | Cart → Proceed | `/tracking/[id]` | ✅ Complete |
| **Order Tracking** | `/tracking/[id]` | Animated rider map; 5-step status timeline; items summary; rider call/SMS; celebration banner | Checkout success, Order history | `/(tabs)` (on delivery) | ✅ Complete |
| **Order History** | `/(tabs)/orders` | All orders with status badges; reorder; pull-to-refresh | Tab bar | `/tracking/[id]` | ✅ Complete |
| **Profile** | `/(tabs)/profile` | Phone, role badge, saved addresses (static), settings stubs, logout with confirmation | Tab bar | `/login` (logout) | ✅ Complete |
| **Not Found** | `+not-found` | 404 fallback | Invalid route | Back | ✅ Complete |

### Shopkeeper Screens

| Screen | Route | Purpose | Entry | Exit | Status |
|---|---|---|---|---|---|
| **SK Dashboard** | `/(shopkeeper)/dashboard` | Today's orders, earnings, pending count; recent orders; pull-to-refresh; logout confirmation | Login (SK), Auto-login | `/(shopkeeper)/orders`, Logout | ✅ Complete |
| **SK Orders** | `/(shopkeeper)/orders` | Active orders pipeline; Accept/Reject/Pack/Ready/Mark Delivered; tab badge for pending; pull-to-refresh | Tab bar | — | ✅ Complete |
| **SK Inventory** | `/(shopkeeper)/inventory` | Product list; active/inactive toggle; add/edit modal (backdrop dismiss); delete with confirmation | Tab bar | — | ✅ Complete |

---

## 1.4 Existing Feature Inventory

| Feature | Status | Notes |
|---|---|---|
| OTP phone login | ✅ Done | Frontend mock — any 6 digits accepted, no real SMS |
| Auto-login on launch | ✅ Done | AsyncStorage check in `splash.tsx` |
| Shopkeeper route guard | ✅ Done | `useEffect` redirect in `(shopkeeper)/_layout.tsx` |
| Map shop discovery | ✅ Done | Native maps (iOS/Android); web uses styled grid mock |
| Draggable bottom sheet on map | ✅ Done | PanResponder + spring snap |
| Filter chips — Open Now | ✅ Done | Correctly filters by `isShopCurrentlyOpen()` |
| Filter chips — Nearest, Best Rated | ⚠️ Half-built | Chips render but do not sort/filter — **no-ops** |
| Search (products + shops) | ✅ Done | Live text search across `shopProducts` state |
| Search filters / sort | ❌ Not built | No category filter, price range, or distance sort |
| Shop detail with category tabs | ✅ Done | Tabs, product grid, hours, distance |
| Product detail | ✅ Done | Stock, weight/unit select, mock reviews |
| Add to cart | ✅ Done | Cross-shop conflict alert, weight modal, AsyncStorage |
| Cart management | ✅ Done | Qty +/−, remove, pickup/delivery toggle |
| Checkout | ✅ Done | Address, COD/UPI, shop-closed guard, validation |
| Order placement | ✅ Done | Creates order in context + AsyncStorage |
| Order tracking (customer) | ✅ Done | Auto-advance via `setTimeout`; animated map; call/SMS Linking |
| Order history + reorder | ✅ Done | Full list; reorder repopulates cart |
| Customer profile | ✅ Done | Static addresses, settings stubs, logout |
| SK dashboard stats | ✅ Done | Computed from mock data (orders, earnings, pending count) |
| SK order management (full pipeline) | ✅ Done | pending→accepted→packed→out_for_delivery→delivered |
| SK inventory CRUD | ✅ Done | Add/edit/delete with confirmation; active/inactive toggle |
| SK inventory search | ✅ Done | Live filter in inventory list |
| Global toast notifications | ✅ Done | `ToastProvider` wired in root; `useToast()` hook available |
| Dark mode | ❌ Not built | Hook is dark-ready; dark palette not defined |
| Onboarding / first-run flow | ❌ Not built | New users land directly at login with no context |
| Push notifications | ❌ Not built | `expo-linking` installed; no setup |
| Real location services | ❌ Not built | `expo-location` installed but never called; distances are static strings |
| Real-time order updates | ❌ Not built | Status advances via `setTimeout` — no WebSocket / polling |
| Payment gateway | ❌ Not built | COD/UPI are labels only; no actual integration |
| Product image upload | ❌ Not built | `expo-image-picker` installed; products use category icon fallbacks |
| Ratings & review submission | ❌ Not built | Mock reviews shown; no write path |
| Order cancellation (customer) | ❌ Not built | No cancel action post-placement |
| Notifications screen | ❌ Not built | No notification list or history |
| About / Help / FAQ / Terms / Privacy | ❌ Not built | Profile settings rows are non-functional stubs |
| Offline / no-internet state | ❌ Not built | App silently fails with no error or retry UI |

---

## 1.5 Design System Audit

### Token Palette (`constants/colors.ts` — light only)

| Token | Hex | Role |
|---|---|---|
| `primary` | `#2E7D32` | Buttons, active states, headers, shop banner, badges |
| `secondary` | `#66BB6A` | Defined; **effectively unused** (replaced by `primary + opacity` tints) |
| `accent` | `#FF9800` | Shopkeeper toggle, pending badges, "Mark Ready" button |
| `background` | `#FFFFFF` | Screen backgrounds |
| `card` | `#F5F5F5` | Card surfaces |
| `muted` | `#F5F5F5` | Input bg, chip bg — **same value as `card`; redundant** |
| `foreground` | `#212121` | Primary text |
| `mutedForeground` | `#757575` | Secondary text, placeholders, inactive icons |
| `border` | `#E0E0E0` | Card borders, dividers, input borders |
| `destructive` | `#ef4444` | Delete actions, "Closed" badge, reject button |
| `success` | `#43A047` | Delivered status, positive indicators |
| `rating` | `#FFB300` | Star icons |
| `info` | `#1976D2` | Informational badges (defined; rarely used) |
| `radius` | `12` | Global border radius constant |

**Dark mode:** ❌ `colors.dark` is not defined. `useColors()` always returns the light palette regardless of device appearance setting.

### Typography (in use — no formal scale)

| Semantic role | Family | Size | Weight |
|---|---|---|---|
| Hero / Splash title | Inter | 24px | 800 |
| Screen title | Inter | 22–24px | 700–800 |
| Section header | Inter | 18–20px | 700 |
| Card title | Inter | 15–17px | 700 |
| Body | Inter | 13–14px | 400 |
| Label / Caption | Inter | 11–12px | 400–600 |
| Primary button | Inter | 14–15px | 700 |

⚠️ No formal type scale or named type tokens. Font sizes are ad-hoc per screen. The same semantic level (e.g. "card title") differs between screens (15px in ShopCard, 17px in tracking). No `Display` variant exists. Line heights are set ad-hoc.

### Spacing

Informal 4px grid. Common values: 8, 12, 16, 20, 24. No spacing token file. All padding/margin values are magic numbers inside StyleSheet objects. Inner card gaps vary 8–14px with no pattern.

### Border Radius

`colors.radius = 12` is the declared standard. Actual values used across the codebase:

| Value | Used for |
|---|---|
| 8px | Small chips, input corners, small badges |
| 10px | Review cards, minor UI elements |
| **12px** | Most cards — the stated standard |
| 14px | Some buttons, CartBar |
| 16px | Rider card, delivery banner |
| 18px | Login card |
| 20px+ | Avatar circles, full-round buttons |

⚠️ Six+ distinct radius values with no named scale (sm / md / lg / xl). `colors.radius` is defined but not universally consumed.

### Shadows

No named shadow scale. Values are magic numbers set independently per component:

| Component | iOS shadow | Android elevation |
|---|---|---|
| Login card | `opacity: 0.08, radius: 8` | 3 |
| CartBar | `opacity: 0.15, radius: 12` | 8 |
| Rider bubble | `opacity: 0.5, radius: 8` | 10 |
| Inventory modal | None | — |
| Shop detail header | None | — |

### Shared Component Audit

| Component | Shared? | Notes |
|---|---|---|
| Button (primary) | ❌ Not shared | Duplicated as `StyleSheet` per screen |
| Card container | ❌ Not shared | Border + bg + radius duplicated 10+ times |
| Input field | ❌ Not shared | Duplicated in login, checkout, inventory, search |
| Bottom sheet | ❌ Not shared | Custom PanResponder implementation only on Discover |
| Badge / chip | ❌ Not shared | Category chips, filter chips, status badges all ad-hoc |
| Skeleton loader | ❌ Does not exist | No loading states on any list screen |
| Empty state | ⚠️ Partial | Cart has an empty state; other lists (orders, search pre-query) do not show helpful empty states |

### Inconsistencies Flagged

| ID | Issue | Severity |
|---|---|---|
| I-01 | `CATEGORY_COLORS` and `CATEGORY_ICONS` duplicated in `ProductCard.tsx` and `product/[id].tsx` | Medium |
| I-02 | `colors.card` and `colors.muted` are the same hex value — tokens with identical meaning | Low |
| I-03 | Dark mode palette not defined — always renders in light | Critical |
| I-04 | No shared `Card` component — bg/border/radius duplicated per screen | Medium |
| I-05 | No shared `Button` component — CTA styles duplicated per screen | Medium |
| I-06 | Border radius has 6+ values with no named scale | Medium |
| I-07 | Shadow values are magic numbers, inconsistent across components | Low |
| I-08 | "Nearest" and "Best Rated" filter chips on Discover are non-functional | High |
| I-09 | Profile settings rows (Notifications, Language, Help, Privacy) are stubs | High |
| I-10 | `colors.secondary` defined but effectively unused throughout the app | Low |
| I-11 | No skeleton/shimmer loading states on any screen | High |
| I-12 | No offline / no-internet error handling anywhere | High |

---

## 1.6 Reference Apps

Kirana Konnect operates in the **hyperlocal grocery / q-commerce** segment. The best-in-class Indian references:

### 1. Blinkit — Primary Reference (Category-first hyperlocal)
- **Category-first home**: Horizontal scrolling category shortcuts above product rows — faster than map browsing for returning users
- **Search with recent + trending**: Pre-populated state before first keystroke
- **MRP vs selling price + savings badge**: Visible value communication on every product card
- **Distinct order confirmation screen**: Celebration moment before tracking begins (Kirana Konnect skips this — goes straight from checkout to tracking)
- **Substitution suggestions**: Out-of-stock fallback offers in cart

### 2. Zepto — Secondary Reference (Speed + trust)
- **ETA as a headline feature**: Prominent delivery promise displayed on the home screen
- **Compact 2×4 category grid**: Faster than a horizontal scroll for new users
- **Slot-based delivery time selection**: Lets users schedule delivery windows on checkout
- **Cart drawer**: Slide-out panel keeps shop context while browsing

### 3. Swiggy Instamart — Tracking + Discovery Reference
- **Live ETA countdown on tracking**: Large, real-time countdown (not just a static label)
- **Rider photo + name + rating**: Builds trust during the delivery window
- **Map with shop coverage radius**: Visual hyperlocal boundary on discovery screen
- **"Add more items" on tracking screen**: Upsell opportunity during fulfilment window

### 4. JioMart (Kirana Focus)
- **Shopkeeper guided onboarding**: Multi-step registration (shop photo, GSTIN, address verification)
- **Payout + bank account setup** for shopkeeper earnings withdrawal
- **Bulk inventory import**: CSV upload for large catalogues

### 5. Meesho / Dukan — Small Business Reference (Inventory UX)
- **Catalogue photography tips**: In-app guidance for product image quality
- **Price suggestion engine**: "Similar products sell for ₹X" nudges
- **Share product / shop link**: Social sharing for organic discovery

---

*End of Phase 1 — Discovery*
*Output file: `01_DISCOVERY.md`*
