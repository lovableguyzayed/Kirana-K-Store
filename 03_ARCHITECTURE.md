# Phase 3 — Solution Architecture
## Kirana Konnect · Professional Application Audit

*Completed: May 2026 · Auditor: AI Architect Agent*

---

## Overview

This document specifies the exact implementation design for all Tier 1 and Tier 2 fixes identified in Phase 2. It is organised into **Implementation Blocks** — each block is a cohesive set of changes that can be implemented together without breaking intermediate states.

Implementation order is designed so each block is independently deployable and leaves the app in a working state.

---

## Implementation Block 1 — AppContext Expansion
### Fixes: B1 (cross-shop cart), B3 (inventory isolation), B15 (hardcoded shop), B24 (isShopkeeper not persisted)
### Theme 1: Missing AppContext Scope

This is the highest-leverage block. All changes are in `AppContext.tsx` and establish the shared state that later blocks depend on.

---

### 1A — Add `currentUser` to Context

**Purpose**: Replaces the anonymous `isShopkeeper` boolean with a typed user record that carries role, shopId, and display name. Enables shopkeeper dashboard to show real data (B15).

**New interface** (add to `AppContext.tsx`):
```typescript
export interface AppUser {
  phone: string;
  role: "customer" | "shopkeeper";
  shopId?: string;         // only set when role === "shopkeeper"
  shopName?: string;       // display name for the shopkeeper's store
  ownerName?: string;      // shopkeeper's name
}
```

**Context changes**:
```typescript
// Replace:
isShopkeeper: boolean;
setIsShopkeeper: (val: boolean) => void;

// With:
currentUser: AppUser | null;
setCurrentUser: (user: AppUser | null) => void;
```

**Derived getter** (backward-compat for any remaining consumers):
```typescript
// Computed inside provider, exposed on context:
isShopkeeper: currentUser?.role === "shopkeeper"
```

**Persistence** (fixes B24): Persist `currentUser` to AsyncStorage key `"kk_user"`:
```typescript
// On mount:
AsyncStorage.getItem("kk_user").then(val => {
  if (val) setCurrentUser(JSON.parse(val));
});

// On change:
useEffect(() => {
  if (currentUser) AsyncStorage.setItem("kk_user", JSON.stringify(currentUser));
  else AsyncStorage.removeItem("kk_user");
}, [currentUser]);
```

**Login screen update** (`login.tsx`):
```typescript
// Customer login:
setCurrentUser({ phone, role: "customer" });

// Shopkeeper login (demo — hardcoded to s1 Gupta Kirana):
setCurrentUser({
  phone,
  role: "shopkeeper",
  shopId: "s1",
  shopName: "Gupta Kirana Store",
  ownerName: "Ramesh Gupta",
});
```

**Dashboard update** (`(shopkeeper)/dashboard.tsx`):
```typescript
// Remove: const SHOP = { ... }  (module-level constant)

// Replace with:
const { currentUser } = useApp();
const shopName = currentUser?.shopName ?? "My Store";
const ownerName = currentUser?.ownerName ?? "";
```

---

### 1B — Add `shopProducts` to Context (fixes B3)

**Purpose**: Lifts product catalogue into shared state so shopkeeper inventory edits are visible to customers.

**New state** (add inside `AppProvider`):
```typescript
const [shopProducts, setShopProducts] =
  useState<Record<string, Product[]>>(MOCK_PRODUCTS);
```

**New context actions**:
```typescript
interface AppContextType {
  // ... existing
  shopProducts: Record<string, Product[]>;
  addProduct: (shopId: string, product: Omit<Product, "shopId" | "shopName">) => void;
  updateProduct: (shopId: string, productId: string, updates: Partial<Product>) => void;
  deleteProduct: (shopId: string, productId: string) => void;
  toggleProductActive: (shopId: string, productId: string) => void;
}
```

**Action implementations**:
```typescript
const addProduct = useCallback((shopId: string, product: Omit<Product, "shopId" | "shopName">) => {
  const shop = SHOPS.find(s => s.id === shopId);
  const newProduct: Product = {
    ...product,
    id: `p${Date.now().toString(36)}`,
    shopId,
    shopName: shop?.name ?? "",
  };
  setShopProducts(prev => ({
    ...prev,
    [shopId]: [...(prev[shopId] ?? []), newProduct],
  }));
}, []);

const updateProduct = useCallback((shopId: string, productId: string, updates: Partial<Product>) => {
  setShopProducts(prev => ({
    ...prev,
    [shopId]: prev[shopId]?.map(p => p.id === productId ? { ...p, ...updates } : p) ?? [],
  }));
}, []);

const deleteProduct = useCallback((shopId: string, productId: string) => {
  setShopProducts(prev => ({
    ...prev,
    [shopId]: prev[shopId]?.filter(p => p.id !== productId) ?? [],
  }));
}, []);
```

**Update existing helpers** to read from state instead of the module-level constant:
```typescript
// Old: export const getProductsByShop = (shopId: string) => MOCK_PRODUCTS[shopId] || [];
// These static exports stay for search.tsx pre-render (will be fixed in Block 5)
// Inside components, consume via context:
const { shopProducts } = useApp();
const products = shopProducts[shopId] ?? [];
```

**Inventory screen update** (`(shopkeeper)/inventory.tsx`):
```typescript
// Remove: const [products, setProducts] = useState<InventoryProduct[]>(INITIAL_PRODUCTS);
// Remove: all local CRUD handlers

// Replace with context:
const { shopProducts, addProduct, updateProduct, deleteProduct, currentUser } = useApp();
const shopId = currentUser?.shopId ?? "s1";
const products = (shopProducts[shopId] ?? []) as InventoryProduct[];

// Map context actions to existing modal submit handlers
```

**Active/inactive toggle**: Add `isActive?: boolean` to `Product` interface (optional, defaults to `true`). Customer shop screen filters: `products.filter(p => p.isActive !== false)`.

---

### 1C — Cross-Shop Cart Guard (fixes B1)

**Purpose**: Prevent mixing products from different shops in a single cart.

**Add helper** inside `AppProvider`:
```typescript
const cartShopId = cart.length > 0 ? cart[0].shopId : null;
```

**Expose on context**:
```typescript
cartShopId: string | null;
```

**Modify `addToCart`**:
```typescript
const addToCart = useCallback(
  (product: Product, opts?: { selectedWeight?: string; priceOverride?: number }) => {
    setCart(prev => {
      // Enforce single-shop cart
      if (prev.length > 0 && prev[0].shopId !== product.shopId) {
        // Caller must confirm before calling — if they reach here it's a logic error
        // The UI layer is responsible for the confirmation dialog (see Block 2)
        // As a hard safety net, return prev unchanged (no silent corruption)
        return prev;
      }
      // ... rest of existing logic unchanged
    });
  },
  []
);
```

**Add `replaceCart` action** for the "start new cart" confirmation flow:
```typescript
const replaceCart = useCallback(
  (product: Product, opts?: { selectedWeight?: string; priceOverride?: number }) => {
    setCart([{
      ...product,
      price: opts?.priceOverride ?? product.price,
      quantity: 1,
      selectedWeight: opts?.selectedWeight,
    }]);
  },
  []
);
```

**UI layer** (in `ProductCard.tsx`, `shop/[id].tsx`, `product/[id].tsx`):
```typescript
const { cartShopId, addToCart, replaceCart } = useApp();

const handleAdd = (product: Product) => {
  if (cartShopId && cartShopId !== product.shopId) {
    // Show Alert
    Alert.alert(
      "Start new cart?",
      `Your cart has items from another store. Add "${product.name}" to start a fresh cart?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Start New Cart", style: "destructive", onPress: () => replaceCart(product) },
      ]
    );
    return;
  }
  addToCart(product);
};
```

---

## Implementation Block 2 — Shop Availability Utilities
### Fixes: B2 (ordering from closed shop), B8 (isOpen is hardcoded)

**New file**: `artifacts/kirana-konnect/utils/shopUtils.ts`

```typescript
import { Shop } from "@/context/AppContext";

/**
 * Parses "HH:MM" string into minutes-since-midnight.
 */
function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Determines if a shop is currently open based on its openTime and closeTime.
 * The static `shop.isOpen` field acts as a manual override (false = forced closed).
 */
export function isShopCurrentlyOpen(shop: Shop): boolean {
  if (!shop.isOpen) return false; // Manual override (holidays, closures)
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const open = parseTime(shop.openTime);
  const close = parseTime(shop.closeTime);

  // Handle overnight shops (e.g., closeTime < openTime)
  if (close < open) {
    return currentMinutes >= open || currentMinutes < close;
  }
  return currentMinutes >= open && currentMinutes < close;
}

/**
 * Returns a human-readable hours string, e.g., "7:00 AM – 10:00 PM"
 */
export function formatShopHours(shop: Shop): string {
  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
  };
  return `${fmt(shop.openTime)} – ${fmt(shop.closeTime)}`;
}

/**
 * Computes Haversine distance in km between two lat/lng points.
 * Used for dynamic distance computation when real GPS is available.
 */
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

**Apply `isShopCurrentlyOpen` across the app**:

| File | Change |
|---|---|
| `(tabs)/index.tsx` | Replace `shop.isOpen` → `isShopCurrentlyOpen(shop)` in filter + badge display |
| `components/MapView.tsx` | Replace `shop.isOpen` → `isShopCurrentlyOpen(shop)` for pin colour |
| `components/MapView.web.tsx` | Same |
| `components/ShopCard.tsx` | Same |
| `app/shop/[id].tsx` | Add "Currently Closed" banner when `!isShopCurrentlyOpen(shop)`. Disable "Add" button on ProductCard when shop is closed. |
| `app/checkout.tsx` | Guard `handlePlaceOrder()`: if `selectedShop && !isShopCurrentlyOpen(selectedShop)` → show Alert "This store is now closed. Your order cannot be placed." |

**Shop detail banner design** (`shop/[id].tsx`):
```tsx
{!isShopCurrentlyOpen(shop) && (
  <View style={styles.closedBanner}>
    <Feather name="moon" size={16} color="#C62828" />
    <Text style={styles.closedText}>
      Currently Closed · Opens at {formatShopHours(shop).split("–")[0].trim()}
    </Text>
  </View>
)}
```

---

## Implementation Block 3 — Data Validation & Business Logic
### Fixes: B7 (earnings), B6 (order ID), B10 (checkout validation), B4 (null shop guard)

### 3A — Earnings Fix (B7)

**File**: `(shopkeeper)/dashboard.tsx:40`

```typescript
// Before:
const earnings = useMemo(
  () => todaysOrders.reduce((sum, o) => sum + o.total + o.deliveryFee, 0),
  [todaysOrders]
);

// After:
const earnings = useMemo(
  () => todaysOrders
    .filter(o => o.status === "delivered" || o.status === "out_for_delivery")
    .reduce((sum, o) => sum + o.total + o.deliveryFee, 0),
  [todaysOrders]
);
```

---

### 3B — Order ID (B6)

**File**: `AppContext.tsx:409`

```typescript
// Before:
id: `o${Date.now()}`,

// After:
id: `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
// e.g., "olbskz3gf2" — timestamp base36 + 3 random chars = collision-proof
```

---

### 3C — Checkout Address Validation (B10)

**File**: `checkout.tsx` — in the submit handler:

```typescript
const handlePlaceOrder = () => {
  // Validate delivery address
  if (deliveryMode === "delivery" && !address.trim()) {
    setAddressError("Please enter a delivery address");
    addressInputRef.current?.focus();
    return;
  }
  setAddressError(null);

  // Validate shop is still open
  if (selectedShop && !isShopCurrentlyOpen(selectedShop)) {
    Alert.alert("Store Closed", "This store is now closed and cannot accept orders.");
    return;
  }

  // Validate cart has a shop
  if (!selectedShop) {
    Alert.alert("No Store Selected", "Please go back and select a store.");
    return;
  }

  const order = placeOrder(address.trim(), paymentMethod);
  router.replace({ pathname: "/tracking/[id]", params: { id: order.id } });
};
```

**Add error state** to checkout:
```typescript
const [addressError, setAddressError] = useState<string | null>(null);
```

**Display error** below address input:
```tsx
{addressError && (
  <Text style={[styles.errorText, { color: colors.destructive }]}>
    {addressError}
  </Text>
)}
```

---

### 3D — Null Shop Guard in `placeOrder` (B4)

**File**: `AppContext.tsx:404`

```typescript
const placeOrder = useCallback(
  (address: string, paymentMethod: "cod" | "upi"): Order => {
    if (!selectedShop) {
      throw new Error("placeOrder called with no selectedShop");
    }
    // ... rest unchanged, but selectedShop is now guaranteed non-null
    const newOrder: Order = {
      id: `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      shopId: selectedShop.id,      // no more || ""
      shopName: selectedShop.name,  // no more || ""
      // ...
    };
  },
  [cart, deliveryMode, selectedShop]
);
```

---

## Implementation Block 4 — Reorder Fix
### Fix: B5 (reorder corrupts cart)

**File**: `(tabs)/orders.tsx`

**New `handleReorder` design**:
```typescript
const handleReorder = (order: Order) => {
  // Find the shop this order was from
  const shop = SHOPS.find(s => s.id === order.shopId);

  const doReorder = () => {
    clearCart();
    if (shop) setSelectedShop(shop);
    order.items.forEach(item => addToCart(item, { priceOverride: item.price }));
    router.push("/cart");
  };

  if (cart.length > 0) {
    Alert.alert(
      "Replace cart?",
      `This will clear your current cart and add items from ${order.shopName}.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Replace Cart", style: "destructive", onPress: doReorder },
      ]
    );
  } else {
    doReorder();
  }
};
```

**Required context additions** (already available):
- `clearCart` ✓
- `setSelectedShop` ✓
- `addToCart` ✓

---

## Implementation Block 5 — UI Correctness
### Fixes: B9 (OTP resend), B11 (router types), B12 (search reactivity), B13 (price display), B24 (isShopkeeper persistence — handled in Block 1)

### 5A — OTP Resend Countdown (B9)

**File**: `login.tsx`

```typescript
const [resendCountdown, setResendCountdown] = useState(30);
const [canResend, setCanResend] = useState(false);

useEffect(() => {
  if (step !== "otp") return;
  setResendCountdown(30);
  setCanResend(false);
  const interval = setInterval(() => {
    setResendCountdown(prev => {
      if (prev <= 1) {
        clearInterval(interval);
        setCanResend(true);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
  return () => clearInterval(interval);
}, [step]);

const handleResend = () => {
  handleSendOtp(); // reuses existing function
  setResendCountdown(30);
  setCanResend(false);
};
```

**Replace static text**:
```tsx
// Before:
<Text style={[styles.resend, { color: colors.primary }]}>Resend OTP in 30s</Text>

// After:
{canResend ? (
  <TouchableOpacity onPress={handleResend}>
    <Text style={[styles.resend, { color: colors.primary }]}>Resend OTP</Text>
  </TouchableOpacity>
) : (
  <Text style={[styles.resend, { color: colors.mutedForeground }]}>
    Resend OTP in {resendCountdown}s
  </Text>
)}
```

---

### 5B — Router Push Type Safety (B11)

**File**: `(tabs)/index.tsx:96`
```typescript
// Before:
router.push("/shop/" + shop.id);

// After:
router.push({ pathname: "/shop/[id]", params: { id: shop.id } });
```

**File**: `(tabs)/orders.tsx:117`
```typescript
// Before:
router.push("/tracking/" + order.id);

// After:
router.push({ pathname: "/tracking/[id]", params: { id: order.id } });
```

---

### 5C — Reactive Search (B12)

**File**: `search.tsx`

```typescript
// Before (module-level, non-reactive):
const ALL_PRODUCTS = SHOPS.flatMap((shop) =>
  getProductsByShop(shop.id).map((p) => ({ ...p, shopData: shop }))
);

// After (inside component, reactive):
export default function SearchScreen() {
  const { shopProducts } = useApp();

  const allProducts = useMemo(() =>
    SHOPS.flatMap(shop =>
      (shopProducts[shop.id] ?? [])
        .filter(p => p.isActive !== false)
        .map(p => ({ ...p, shopData: shop }))
    ),
    [shopProducts]
  );

  // Replace ALL_PRODUCTS with allProducts everywhere below
}
```

---

### 5D — Weight Product Price Display Fix (B13)

**File**: `components/ProductCard.tsx:90`

```tsx
// Before:
<Text style={[styles.price, { color: colors.foreground }]}>₹{product.price}</Text>

// After:
<View style={styles.priceRow}>
  <Text style={[styles.price, { color: colors.foreground }]}>
    ₹{cartItem ? cartItem.price : product.price}
  </Text>
  {!cartItem && isWeightBased(product) && (
    <Text style={[styles.perUnit, { color: colors.mutedForeground }]}>
      /{product.unit}
    </Text>
  )}
</View>
```

**Add style**:
```typescript
priceRow: {
  flexDirection: "row",
  alignItems: "baseline",
  gap: 2,
  marginTop: 2,
},
perUnit: {
  fontSize: 11,
  fontFamily: "Inter_400Regular",
},
```

---

## Implementation Block 6 — Shopkeeper Identity
### Fix: B15 (hardcoded dashboard info)

This is handled by Block 1A (`currentUser` in context). Specific dashboard update:

**File**: `(shopkeeper)/dashboard.tsx`

```typescript
// Remove module-level SHOP constant entirely

export default function ShopkeeperDashboard() {
  const { orders, setCurrentUser, currentUser } = useApp();

  const shopId = currentUser?.shopId ?? "s1";
  const shopName = currentUser?.shopName ?? "My Store";
  const ownerName = currentUser?.ownerName ?? "";

  // Filter orders to this shopkeeper's shop only
  const myOrders = useMemo(
    () => orders.filter(o => o.shopId === shopId),
    [orders, shopId]
  );

  const todaysOrders = useMemo(() => {
    const today = new Date().toDateString();
    return myOrders.filter(o => new Date(o.placedAt).toDateString() === today);
  }, [myOrders]);

  // ... rest uses shopName, ownerName, myOrders
}
```

**Shopkeeper orders screen** (`(shopkeeper)/orders.tsx`): same pattern — filter `orders` by `currentUser.shopId`.

---

## Implementation Block 7 — Tier 2 Improvements
### Fixes: B4 (null shop — already in Block 3D), B6 (IDs — already in Block 3B), B18 (accessibility)

### 7A — Accessibility Labels (B18)

**Pattern to apply across all interactive elements**:

```tsx
// TouchableOpacity with no visible text (icon-only buttons):
<TouchableOpacity
  accessibilityLabel="Add to cart"
  accessibilityRole="button"
  onPress={handleAdd}
>

// Icon-only quantity controls:
<TouchableOpacity
  accessibilityLabel="Decrease quantity"
  accessibilityRole="button"
  onPress={() => updateQuantity(product.id, cartItem.quantity - 1)}
>

// Status badges (non-interactive):
<View accessibilityLabel={`Order status: ${STATUS_LABELS[order.status]}`}>

// Navigation items in tab bar:
// These inherit from Expo Router's tab navigator
```

**Priority files for a11y pass**: `ProductCard.tsx`, `CartBar.tsx`, `cart.tsx`, `checkout.tsx`, `(shopkeeper)/orders.tsx`.

---

## Implementation Block 8 — Shopkeeper Orders Filter
### Supplementary fix: Shopkeeper sees only their shop's orders

Currently `(shopkeeper)/orders.tsx` shows ALL orders from AppContext, not just the shop's orders. After Block 6 adds `currentUser.shopId`, this is a one-line filter:

**File**: `(shopkeeper)/orders.tsx`
```typescript
const { orders, updateOrderStatus, currentUser } = useApp();
const shopId = currentUser?.shopId ?? "s1";

// Filter to this shop's orders only:
const myOrders = useMemo(() => orders.filter(o => o.shopId === shopId), [orders, shopId]);

// Replace all `orders` references with `myOrders`:
const newOrders = useMemo(() => myOrders.filter(o => o.status === "pending"), [myOrders]);
const activeOrders = useMemo(() => myOrders.filter(o => ["accepted", "packed", "out_for_delivery"].includes(o.status)), [myOrders]);
```

---

## File Change Summary

| File | Block(s) | Type of Change |
|---|---|---|
| `context/AppContext.tsx` | 1A, 1B, 1C, 3B, 3D | Add `currentUser`, `shopProducts`, `replaceCart`, `addProduct`, `updateProduct`, `deleteProduct`, `cartShopId`; fix `placeOrder`; fix order ID |
| `utils/shopUtils.ts` | 2 | **New file** — `isShopCurrentlyOpen`, `formatShopHours`, `haversineKm` |
| `app/login.tsx` | 1A, 5A | `setCurrentUser` instead of `setIsShopkeeper`; OTP countdown |
| `app/(tabs)/index.tsx` | 2, 5B | `isShopCurrentlyOpen` for filter/badge; typed `router.push` |
| `app/(tabs)/orders.tsx` | 4, 5B | Reorder with clear+confirm; typed `router.push` |
| `app/shop/[id].tsx` | 1C, 2 | Closed banner; add-to-cart cross-shop guard |
| `app/product/[id].tsx` | 1C, 2 | Cross-shop guard on add; disabled when shop closed |
| `app/cart.tsx` | — | No changes needed (shop guard is upstream) |
| `app/checkout.tsx` | 2, 3C | Address validation; shop-open guard before placeOrder |
| `app/search.tsx` | 5C | `useMemo` reactive product list from context |
| `app/(shopkeeper)/dashboard.tsx` | 1A, 6 | `currentUser` for shop info; filter orders by shopId; fix earnings |
| `app/(shopkeeper)/orders.tsx` | 6, 8 | Filter to `currentUser.shopId`; read from context |
| `app/(shopkeeper)/inventory.tsx` | 1B | Use context `shopProducts` + actions instead of local state |
| `components/ProductCard.tsx` | 1C, 5D | Cross-shop alert; price from `cartItem.price` when in cart |
| `components/MapView.tsx` | 2 | `isShopCurrentlyOpen` for pin styling |
| `components/MapView.web.tsx` | 2 | Same |
| `components/ShopCard.tsx` | 2 | Same |
| `components/CartBar.tsx` | 7A | Accessibility label |

**New files created**:
- `utils/shopUtils.ts`

**Files deleted**: None

---

## Data Flow Diagrams

### Cart Add Flow (after Block 1C)

```
User taps "Add" on ProductCard
        │
        ▼
Is cartShopId null OR cartShopId === product.shopId?
   YES → addToCart(product)  ──────────────────────────────► Cart updated ✓
   NO  → Alert.alert("Start new cart?")
              │
         User taps "Start New Cart"
              │
              ▼
         replaceCart(product)  ──────────────────────────────► Cart cleared + product added ✓
         User taps "Cancel"    ──────────────────────────────► Cart unchanged ✓
```

### Reorder Flow (after Block 4)

```
User taps "Reorder" on order card
        │
        ▼
cart.length > 0?
   YES → Alert.alert("Replace cart?")
              │
         User taps "Replace Cart"
              │
              ▼
         clearCart() → setSelectedShop(shop) → addToCart(each item) → router.push("/cart")
   NO  → clearCart() → setSelectedShop(shop) → addToCart(each item) → router.push("/cart")
```

### Shop Open/Close Check Flow (after Block 2)

```
isShopCurrentlyOpen(shop)
        │
        ├─ shop.isOpen === false → return false  (manual override)
        │
        └─ Parse openTime/closeTime as HH:MM
                │
                ▼
          currentMinutes in [open, close)?
            YES → return true
            NO  → return false
```

### Inventory → Customer Catalogue Flow (after Block 1B)

```
AppContext
  shopProducts: Record<string, Product[]>
        │
        ├──► shop/[id].tsx reads shopProducts[shopId]
        │         (filtered: isActive !== false)
        │
        ├──► search.tsx allProducts = useMemo(shopProducts → flatMap)
        │
        └──► (shopkeeper)/inventory.tsx reads + writes shopProducts[currentUser.shopId]
                  via: addProduct, updateProduct, deleteProduct, toggleProductActive
```

---

## Risk Assessment for Implementation

| Block | Risk | Mitigation |
|---|---|---|
| Block 1A (`currentUser`) | Existing `setIsShopkeeper` consumers break | Add `isShopkeeper` as computed getter on context; update all call sites |
| Block 1B (`shopProducts`) | `getProductsByShop` used in `search.tsx` at module level | Fix in Block 5C simultaneously |
| Block 1C (cart guard) | Alert.alert not ideal on web | Wrap in `Platform.OS === "web" ? webConfirm() : Alert.alert()` using `window.confirm` fallback |
| Block 2 (shop hours) | `closeTime < openTime` edge case (overnight shops) | Handled in `isShopCurrentlyOpen` with the overnight branch |
| Block 3D (null shop throw) | `placeOrder` throw crashes app if called without shop | Checkout already validates (Block 3C); throw is final safety net — add ErrorBoundary catch |

---

## Acceptance Criteria

Each fix is considered done when:

| Block | Criterion |
|---|---|
| 1A | Shopkeeper dashboard shows correct shop name/owner; `isShopkeeper` persists across app restart |
| 1B | Adding a product in inventory screen makes it immediately visible in the shop's product list; deleting removes it |
| 1C | Attempting to add a product from ShopB when cart has ShopA items shows confirmation dialog; confirming clears and adds; cancelling leaves cart unchanged |
| 2 | Shop at `isOpen:false` shows "Currently Closed" banner in shop detail; "Add" buttons disabled; checkout prevents order placement |
| 3A | Shopkeeper earnings excludes rejected orders |
| 3B | Order IDs are unique under rapid sequential creation |
| 3C | Attempting checkout with empty address field for delivery shows inline error; submit is blocked |
| 3D | `placeOrder` without a selected shop throws immediately, not silently |
| 4 | Reorder on non-empty cart shows confirmation; confirming clears existing items, sets shop, adds items, navigates to cart |
| 5A | OTP screen shows live countdown; "Resend OTP" button becomes active at 0 |
| 5B | TypeScript reports no type errors for `router.push` calls |
| 5C | Searching after adding a product via inventory immediately shows the new product in search results |
| 5D | Weight-based product in cart shows the cart price (e.g. ₹15 for 500g tomatoes), not the per-kg base price (₹30) |
| 6 | Shopkeeper dashboard and orders screen show only orders belonging to `currentUser.shopId` |
| 7A | All icon-only buttons have `accessibilityLabel`; screen reader can identify all interactive controls |

---

## Implementation Sequence

```
Block 1 (AppContext) ──────────────────────────────────────────────────┐
    │  (foundation — do first, enables all others)                      │
    ▼                                                                   │
Block 2 (shopUtils.ts) ─────────────────────────────────────────────── │
    │  (independent utility file)                                       │
    ▼                                                                   │
Block 3 (validation) ───── depends on Block 2 (isShopCurrentlyOpen)   │
Block 4 (reorder) ───────── depends on Block 1 (clearCart, setShop)   │
Block 5 (UI) ────────────── depends on Block 1 (shopProducts)         │
Block 6 (shopkeeper) ────── depends on Block 1 (currentUser)          │
Block 7 (a11y) ─────────── independent                                │
Block 8 (orders filter) ─── depends on Block 1 (currentUser)          │
    │                                                                   │
    └──────── All blocks can be implemented in one sprint ─────────────┘
```

**Estimated total effort**: 6–8 hours of focused implementation
**Risk level**: Low — all changes are within existing files except one new utility file

---

*End of Phase 3 Architecture. Ready for Phase 4 (Implementation Plan & Task Breakdown) when approved.*
