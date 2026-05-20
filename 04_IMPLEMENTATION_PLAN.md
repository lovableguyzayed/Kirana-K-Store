# Phase 4 — Implementation Plan & Task Breakdown
## Kirana Konnect · Professional Application Audit

*Completed: May 2026 · Auditor: AI Architect Agent*

---

## Execution Overview

Phase 5 implements exactly the changes specified in Phase 3. This document translates those designs into a numbered, ordered task list with precise file targets, line references, and a verification checklist per task. Each task is atomic — the app must compile and render correctly after every individual task.

**Total tasks**: 34  
**Estimated implementation time**: 6–8 hours  
**Breaking changes**: None — all changes are backward-compatible within the app  
**New files**: 1 (`utils/shopUtils.ts`)  
**Deleted files**: 0

---

## Sprint 1 — AppContext Foundation
*Must be completed first — all other sprints depend on this.*

---

### T01 · Add `AppUser` interface and `currentUser` state

**File**: `context/AppContext.tsx`  
**After line 50** (after the `Order` interface)

**Add**:
```typescript
export interface AppUser {
  phone: string;
  role: "customer" | "shopkeeper";
  shopId?: string;
  shopName?: string;
  ownerName?: string;
}
```

**In `AppContextType` interface** — replace:
```typescript
// Remove:
isShopkeeper: boolean;
setIsShopkeeper: (val: boolean) => void;

// Add:
currentUser: AppUser | null;
setCurrentUser: (user: AppUser | null) => void;
isShopkeeper: boolean;  // keep as computed convenience getter
```

**In `AppProvider` function** — replace:
```typescript
// Remove:
const [isShopkeeper, setIsShopkeeper] = useState(false);

// Add:
const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
const isShopkeeper = currentUser?.role === "shopkeeper";
```

**AsyncStorage persistence** — add to mount `useEffect`:
```typescript
AsyncStorage.getItem("kk_user").then((val) => {
  if (val) setCurrentUser(JSON.parse(val));
});
```

**Add separate `useEffect`** for currentUser persistence:
```typescript
useEffect(() => {
  if (currentUser) {
    AsyncStorage.setItem("kk_user", JSON.stringify(currentUser));
  } else {
    AsyncStorage.removeItem("kk_user");
  }
}, [currentUser]);
```

**In `AppContext.Provider` value** — add `currentUser`, `setCurrentUser` alongside existing `isShopkeeper`.

**Verification**: `pnpm --filter @workspace/kirana-konnect run typecheck` passes. App launches and shopkeeper mode persists across reload.

---

### T02 · Add `shopProducts` state and CRUD actions

**File**: `context/AppContext.tsx`

**Add `isActive` to `Product` interface** (optional field, line ~16):
```typescript
export interface Product {
  // ... existing fields
  isActive?: boolean;   // undefined = true (active by default)
}
```

**In `AppProvider`** — add state after existing state declarations:
```typescript
const [shopProducts, setShopProducts] = useState<Record<string, Product[]>>(MOCK_PRODUCTS);
```

**Add four action callbacks** inside provider (after `updateOrderStatus`):
```typescript
const addProduct = useCallback(
  (shopId: string, product: Omit<Product, "id" | "shopId" | "shopName">) => {
    const shop = MOCK_SHOPS.find((s) => s.id === shopId);
    const newProduct: Product = {
      ...product,
      id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`,
      shopId,
      shopName: shop?.name ?? "",
      isActive: true,
    };
    setShopProducts((prev) => ({
      ...prev,
      [shopId]: [...(prev[shopId] ?? []), newProduct],
    }));
  },
  []
);

const updateProduct = useCallback(
  (shopId: string, productId: string, updates: Partial<Product>) => {
    setShopProducts((prev) => ({
      ...prev,
      [shopId]: (prev[shopId] ?? []).map((p) =>
        p.id === productId ? { ...p, ...updates } : p
      ),
    }));
  },
  []
);

const deleteProduct = useCallback(
  (shopId: string, productId: string) => {
    setShopProducts((prev) => ({
      ...prev,
      [shopId]: (prev[shopId] ?? []).filter((p) => p.id !== productId),
    }));
  },
  []
);

const toggleProductActive = useCallback(
  (shopId: string, productId: string) => {
    setShopProducts((prev) => ({
      ...prev,
      [shopId]: (prev[shopId] ?? []).map((p) =>
        p.id === productId ? { ...p, isActive: p.isActive === false ? true : false } : p
      ),
    }));
  },
  []
);
```

**Update `AppContextType` interface** — add:
```typescript
shopProducts: Record<string, Product[]>;
addProduct: (shopId: string, product: Omit<Product, "id" | "shopId" | "shopName">) => void;
updateProduct: (shopId: string, productId: string, updates: Partial<Product>) => void;
deleteProduct: (shopId: string, productId: string) => void;
toggleProductActive: (shopId: string, productId: string) => void;
```

**Add to Provider value**.

**Verification**: TypeScript compiles. `useApp().shopProducts` returns the 4-shop product dictionary.

---

### T03 · Add `cartShopId` and `replaceCart` action

**File**: `context/AppContext.tsx`

**Add computed value** inside provider (after `cartCount`):
```typescript
const cartShopId = cart.length > 0 ? cart[0].shopId : null;
```

**Add `replaceCart` callback**:
```typescript
const replaceCart = useCallback(
  (product: Product, opts?: { selectedWeight?: string; priceOverride?: number }) => {
    setCart([
      {
        ...product,
        price: opts?.priceOverride ?? product.price,
        quantity: 1,
        selectedWeight: opts?.selectedWeight,
      },
    ]);
  },
  []
);
```

**Add cross-shop guard to `addToCart`** — at the very start of the `setCart` updater function:
```typescript
setCart((prev) => {
  if (prev.length > 0 && prev[0].shopId !== product.shopId) {
    // UI layer must show confirmation before calling — return unchanged as safety net
    return prev;
  }
  // ... rest of existing logic unchanged
});
```

**Update `AppContextType`** — add:
```typescript
cartShopId: string | null;
replaceCart: (product: Product, opts?: { selectedWeight?: string; priceOverride?: number }) => void;
```

**Add to Provider value**.

**Verification**: TypeScript compiles. `useApp().cartShopId` is `null` on empty cart and `"s1"` after adding a Gupta Kirana product.

---

### T04 · Fix `placeOrder` — remove null-shop fallback and fix order ID

**File**: `context/AppContext.tsx` — inside `placeOrder` callback

**Change order ID** (line ~409):
```typescript
// Before:
id: `o${Date.now()}`,
// After:
id: `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
```

**Add null guard** at top of `placeOrder`:
```typescript
const placeOrder = useCallback(
  (address: string, paymentMethod: "cod" | "upi"): Order => {
    if (!selectedShop) {
      throw new Error("placeOrder: selectedShop is null");
    }
    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const deliveryFee = deliveryMode === "delivery" ? (total < 200 ? 30 : 0) : 0;
    const newOrder: Order = {
      id: `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      shopId: selectedShop.id,
      shopName: selectedShop.name,
      // ... rest unchanged
    };
    // ...
  },
  [cart, deliveryMode, selectedShop]
);
```

**Verification**: TypeScript compiles. No `|| ""` fallbacks remain.

---

## Sprint 2 — Utility Module

### T05 · Create `utils/shopUtils.ts`

**New file**: `artifacts/kirana-konnect/utils/shopUtils.ts`

Full content as specified in Phase 3, Block 2:
- `parseTime(timeStr: string): number`
- `isShopCurrentlyOpen(shop: Shop): boolean`
- `formatShopHours(shop: Shop): string`
- `haversineKm(lat1, lng1, lat2, lng2): number`

**Verification**: File has no TypeScript errors. `isShopCurrentlyOpen({ openTime: "07:00", closeTime: "22:00", isOpen: true })` returns `true` during business hours.

---

## Sprint 3 — Login Screen

### T06 · Update login to use `setCurrentUser`

**File**: `app/login.tsx`

**Remove**: `setIsShopkeeper` from destructuring  
**Add**: `setCurrentUser` from `useApp()`

**Replace `handleVerify`** submission logic:
```typescript
// Before:
setIsShopkeeper(isShopkeeperMode);
if (isShopkeeperMode) {
  router.replace("/(shopkeeper)/dashboard");
} else {
  router.replace("/(tabs)");
}

// After:
if (isShopkeeperMode) {
  setCurrentUser({
    phone,
    role: "shopkeeper",
    shopId: "s1",
    shopName: "Gupta Kirana Store",
    ownerName: "Ramesh Gupta",
  });
  router.replace("/(shopkeeper)/dashboard");
} else {
  setCurrentUser({ phone, role: "customer" });
  router.replace("/(tabs)");
}
```

**Verification**: Customer login navigates to `/(tabs)`. Shopkeeper login navigates to dashboard. After closing and reopening the app, shopkeeper mode is preserved (no mode reset).

---

### T07 · Add OTP resend countdown

**File**: `app/login.tsx`

**Add state**:
```typescript
const [resendCountdown, setResendCountdown] = useState(30);
const [canResend, setCanResend] = useState(false);
```

**Add `useEffect`** triggered when `step` becomes `"otp"`:
```typescript
useEffect(() => {
  if (step !== "otp") return;
  setResendCountdown(30);
  setCanResend(false);
  const interval = setInterval(() => {
    setResendCountdown((prev) => {
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
```

**Replace static resend text** with the conditional component as specified in Phase 3, Block 5A.

**Verification**: After entering phone number and tapping "Send OTP", countdown from 30 is visible. At 0, "Resend OTP" becomes tappable. Tapping it resets countdown.

---

## Sprint 4 — Shop Availability

### T08 · Apply `isShopCurrentlyOpen` to home screen

**File**: `app/(tabs)/index.tsx`

**Add import**: `import { isShopCurrentlyOpen } from "@/utils/shopUtils";`

**Update `filteredShops`** filter:
```typescript
// Before: if (activeFilter === "Open Now") return s.isOpen;
// After:
if (activeFilter === "Open Now") return isShopCurrentlyOpen(s);
```

**Update shop row badge** (the `openBadge` and `openText`):
```typescript
// Replace shop.isOpen with isShopCurrentlyOpen(shop) in the badge display
const shopOpen = isShopCurrentlyOpen(shop);
// use shopOpen for backgroundColor, dot color, text
```

**Update pin popup** status dot and text similarly.

**Verification**: "Open Now" filter correctly hides shops outside business hours. Status badges update if tested at different times.

---

### T09 · Apply `isShopCurrentlyOpen` to MapView (native)

**File**: `components/MapView.tsx`

**Add import**: `import { isShopCurrentlyOpen } from "@/utils/shopUtils";`

**Replace** `shop.isOpen` with `isShopCurrentlyOpen(shop)` for pin color/marker tint.

**Verification**: Closed shops show a different pin colour on the native map.

---

### T10 · Apply `isShopCurrentlyOpen` to MapView (web)

**File**: `components/MapView.web.tsx`

Same change as T09.

**Verification**: Web grid shows correct open/closed state.

---

### T11 · Apply `isShopCurrentlyOpen` to ShopCard

**File**: `components/ShopCard.tsx`

**Add import** and replace `shop.isOpen` → `isShopCurrentlyOpen(shop)`.

**Verification**: Shop cards in search results show correct status.

---

### T12 · Add "Currently Closed" banner to shop detail + disable add buttons

**File**: `app/shop/[id].tsx`

**Add import**: `import { isShopCurrentlyOpen, formatShopHours } from "@/utils/shopUtils";`

**Compute once** at component top:
```typescript
const shopOpen = isShopCurrentlyOpen(shop);
```

**Add closed banner** below the shop header and above the category tabs:
```tsx
{!shopOpen && (
  <View style={[styles.closedBanner, { backgroundColor: "#FFEBEE" }]}>
    <Feather name="moon" size={15} color="#C62828" />
    <Text style={[styles.closedText, { color: "#C62828" }]}>
      Currently Closed · Opens {formatShopHours(shop).split("–")[0].trim()}
    </Text>
  </View>
)}
```

**Pass `shopOpen` down to `ProductCard`** (or via a context/prop) to disable the "Add" button:
```tsx
<ProductCard
  product={p}
  cartItem={...}
  shopOpen={shopOpen}   // new prop
/>
```

**Add `shopOpen` prop to `ProductCard`** (T13 handles the ProductCard side).

**Verification**: `s3` (Mohan Kirana, `isOpen: false`) shows the closed banner. Add buttons are visually disabled.

---

### T13 · Disable ProductCard add button when shop is closed + price fix

**File**: `components/ProductCard.tsx`

**Add prop**:
```typescript
interface ProductCardProps {
  product: Product;
  cartItem?: CartItem;
  shopOpen?: boolean;  // defaults to true
}
```

**Update `handleAdd`**:
```typescript
const handleAdd = () => {
  if (shopOpen === false) return;  // guard
  // ... existing logic
};
```

**Style the add button as disabled** when `shopOpen === false`:
```tsx
<TouchableOpacity
  style={[styles.addBtn, { backgroundColor: shopOpen === false ? colors.muted : colors.primary }]}
  onPress={handleAdd}
  activeOpacity={shopOpen === false ? 1 : 0.85}
  disabled={shopOpen === false}
  accessibilityLabel={shopOpen === false ? "Store is closed" : "Add to cart"}
  accessibilityRole="button"
>
```

**Fix price display** (B13):
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

**Add `priceRow` and `perUnit` styles**.

**Verification**: Closed shop's product cards show greyed "Add" button. Tomatoes in cart shows ₹15 (for 500g selection) instead of ₹30.

---

### T14 · Guard checkout against closed shop + empty address

**File**: `app/checkout.tsx`

**Add imports**:
```typescript
import { isShopCurrentlyOpen } from "@/utils/shopUtils";
```

**Add `addressError` state**:
```typescript
const [addressError, setAddressError] = useState<string | null>(null);
```

**Add `addressInputRef`**:
```typescript
const addressInputRef = useRef<TextInput>(null);
```

**Update submit handler** with validations as specified in Phase 3, Block 3C.

**Add inline error display** below address input:
```tsx
{addressError && (
  <Text style={[styles.errorText, { color: "#ef4444" }]}>{addressError}</Text>
)}
```

**Add `errorText` style**.

**Verification**: Submitting with empty address shows error. Submitting when shop is closed shows Alert. Both block order placement.

---

## Sprint 5 — Cart & Reorder

### T15 · Cross-shop cart confirmation in ProductCard

**File**: `components/ProductCard.tsx`

**Add `replaceCart` and `cartShopId` to destructuring**:
```typescript
const { addToCart, updateQuantity, removeFromCart, replaceCart, cartShopId } = useApp();
```

**Update `handleAdd` in ProductCard**:
```typescript
const handleAdd = () => {
  if (shopOpen === false) return;
  if (cartShopId && cartShopId !== product.shopId) {
    if (Platform.OS === "web") {
      if (window.confirm(`Your cart has items from another store. Start a new cart with "${product.name}"?`)) {
        replaceCart(product);
      }
    } else {
      Alert.alert(
        "Start new cart?",
        `Your cart has items from another store. Add "${product.name}" to start a fresh cart?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Start New Cart",
            style: "destructive",
            onPress: () => {
              if (weightProduct) {
                setModalVisible(true); // let user pick weight first
              } else {
                replaceCart(product);
              }
            },
          },
        ]
      );
    }
    return;
  }
  if (weightProduct) {
    setModalVisible(true);
  } else {
    addToCart(product);
    haptic();
  }
};
```

**Verification**: Adding Sharma Store product when Gupta Kirana items are in cart shows confirmation dialog. Confirming clears cart and adds new item.

---

### T16 · Cross-shop guard in `AddToCartModal`

**File**: `components/AddToCartModal.tsx`

**Add `replaceCart` and `cartShopId` to destructuring from `useApp()`**.

**In the modal's confirm handler** (where `addToCart` is called after weight/price selection):
```typescript
const handleConfirm = () => {
  if (cartShopId && cartShopId !== product.shopId) {
    replaceCart(product, { selectedWeight, priceOverride: computedPrice });
  } else {
    addToCart(product, { selectedWeight, priceOverride: computedPrice });
  }
  onClose();
};
```

**Verification**: Weight-based cross-shop add also goes through replacement logic.

---

### T17 · Fix reorder flow

**File**: `app/(tabs)/orders.tsx`

**Add imports**:
```typescript
import { Alert, Platform } from "react-native";
import { SHOPS } from "@/context/AppContext";
```

**Add `clearCart`, `setSelectedShop`, `cart` to context destructuring**.

**Replace `handleReorder`** with full implementation from Phase 3, Block 4.

**Verification**: Reordering with empty cart immediately navigates to cart with correct items and shop set. Reordering with existing cart shows Alert; confirming replaces; cancelling leaves cart unchanged. Order from `s1` sets `selectedShop` to Gupta Kirana.

---

## Sprint 6 — Shopkeeper Screens

### T18 · Fix shopkeeper earnings (B7)

**File**: `app/(shopkeeper)/dashboard.tsx`

**Update `earnings` useMemo**:
```typescript
const earnings = useMemo(
  () =>
    todaysOrders
      .filter((o) => o.status === "delivered" || o.status === "out_for_delivery")
      .reduce((sum, o) => sum + o.total + o.deliveryFee, 0),
  [todaysOrders]
);
```

**Verification**: Rejected orders do not contribute to today's earnings figure.

---

### T19 · Connect shopkeeper dashboard to `currentUser`

**File**: `app/(shopkeeper)/dashboard.tsx`

**Remove**: `const SHOP = { ... }` module-level constant.

**Add to context destructuring**: `currentUser`.

**Derive shop info**:
```typescript
const shopId = currentUser?.shopId ?? "s1";
const shopDisplayName = currentUser?.shopName ?? "My Store";
const ownerDisplayName = currentUser?.ownerName ?? "";
```

**Filter orders to this shop**:
```typescript
const myOrders = useMemo(
  () => orders.filter((o) => o.shopId === shopId),
  [orders, shopId]
);
const todaysOrders = useMemo(() => {
  const today = new Date().toDateString();
  return myOrders.filter((o) => new Date(o.placedAt).toDateString() === today);
}, [myOrders]);
const pendingOrders = useMemo(
  () => myOrders.filter((o) => o.status === "pending" || o.status === "accepted"),
  [myOrders]
);
```

**Replace all references** to `SHOP.name`, `SHOP.owner` with `shopDisplayName`, `ownerDisplayName`.

**Update logout handler** to use `setCurrentUser(null)` instead of `setIsShopkeeper(false)`.

**Verification**: Dashboard header shows "Gupta Kirana Store / Ramesh Gupta". Only orders from `s1` are counted in stats.

---

### T20 · Filter shopkeeper orders screen to current shop

**File**: `app/(shopkeeper)/orders.tsx`

**Add `currentUser` to context destructuring**.

**Add shop filter**:
```typescript
const shopId = currentUser?.shopId ?? "s1";
const myOrders = useMemo(
  () => orders.filter((o) => o.shopId === shopId),
  [orders, shopId]
);
const newOrders = useMemo(
  () => myOrders.filter((o) => o.status === "pending"),
  [myOrders]
);
const activeOrders = useMemo(
  () => myOrders.filter((o) => ["accepted", "packed", "out_for_delivery"].includes(o.status)),
  [myOrders]
);
```

**Verification**: Orders screen shows only `s1` orders. A `s2` order placed by customer does not appear in Gupta Kirana shopkeeper dashboard.

---

### T21 · Connect inventory to `shopProducts` context

**File**: `app/(shopkeeper)/inventory.tsx`

**Remove**:
- `INITIAL_PRODUCTS` constant (lines 25–32)
- `const [products, setProducts] = useState<InventoryProduct[]>(INITIAL_PRODUCTS);`
- All local CRUD handler functions (`handleSave`, `handleDelete`, `handleToggleActive`)

**Add to context destructuring**:
```typescript
const {
  shopProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive,
  currentUser,
} = useApp();

const shopId = currentUser?.shopId ?? "s1";
const products = (shopProducts[shopId] ?? []) as InventoryProduct[];
```

**`InventoryProduct` interface** — keep as local type but remove `isActive` from it (now on `Product`):
```typescript
// Remove InventoryProduct interface; use Product directly
// Or keep as alias: type InventoryProduct = Product;
```

**Map modal form submit** to context actions:
```typescript
// On save (add):
addProduct(shopId, {
  name: form.name,
  price: parseFloat(form.price),
  stock: parseInt(form.stock),
  unit: form.unit,
  category: form.category,
  description: form.description,
  isWeightBased: form.isWeightBased,
  isActive: true,
});

// On save (edit):
updateProduct(shopId, editProduct.id, {
  name: form.name,
  price: parseFloat(form.price),
  stock: parseInt(form.stock),
  unit: form.unit,
  category: form.category,
  description: form.description,
  isWeightBased: form.isWeightBased,
});

// On delete:
deleteProduct(shopId, product.id);

// On toggle active:
toggleProductActive(shopId, product.id);
```

**Verification**: Adding a product in the inventory screen immediately makes it visible in the customer shop view for `s1`. Deleting a product removes it from the customer view.

---

## Sprint 7 — Customer Shop View

### T22 · Filter inactive products in customer shop view

**File**: `app/shop/[id].tsx`

**Replace `getProductsByShop` call** with context:
```typescript
const { shopProducts } = useApp();
const products = (shopProducts[shop.id] ?? []).filter((p) => p.isActive !== false);
```

**Verification**: Products marked `isActive: false` in inventory are hidden from customers.

---

## Sprint 8 — Search Reactivity

### T23 · Make search reactive to `shopProducts` context (B12)

**File**: `app/search.tsx`

**Remove** module-level `ALL_PRODUCTS` constant.

**Add context import** and reactive computation inside component:
```typescript
const { shopProducts } = useApp();

const allProducts = useMemo(
  () =>
    SHOPS.flatMap((shop) =>
      (shopProducts[shop.id] ?? [])
        .filter((p) => p.isActive !== false)
        .map((p) => ({ ...p, shopData: shop }))
    ),
  [shopProducts]
);
```

**Replace all `ALL_PRODUCTS`** references with `allProducts`.

**Verification**: After adding a new product in inventory, searching for its name in the search screen returns it immediately (no restart needed).

---

## Sprint 9 — TypeScript & Router Fixes

### T24 · Fix `router.push` type errors — home screen (B11)

**File**: `app/(tabs)/index.tsx` line ~96

```typescript
// Before:
router.push("/shop/" + shop.id);

// After:
router.push({ pathname: "/shop/[id]", params: { id: shop.id } });
```

**Verification**: TypeScript reports no type error on this line.

---

### T25 · Fix `router.push` type errors — orders screen (B11)

**File**: `app/(tabs)/orders.tsx` line ~117

```typescript
// Before:
router.push("/tracking/" + order.id);

// After:
router.push({ pathname: "/tracking/[id]", params: { id: order.id } });
```

**Verification**: TypeScript reports no type error on this line.

---

## Sprint 10 — Accessibility

### T26 · Add accessibility labels to ProductCard

**File**: `components/ProductCard.tsx`

Add `accessibilityLabel` and `accessibilityRole` to:
- Left tappable card area: `accessibilityLabel={`View ${product.name} details`} accessibilityRole="button"`
- "Add" button: `accessibilityLabel={`Add ${product.name} to cart`} accessibilityRole="button"`
- Minus button: `accessibilityLabel="Decrease quantity" accessibilityRole="button"`
- Plus button: `accessibilityLabel="Increase quantity" accessibilityRole="button"`
- Weight edit button: `accessibilityLabel="Edit weight selection" accessibilityRole="button"`

---

### T27 · Add accessibility labels to CartBar

**File**: `components/CartBar.tsx`

```tsx
<TouchableOpacity
  accessibilityLabel={`View cart — ${cartCount} items, total ₹${cartTotal}`}
  accessibilityRole="button"
  // ...
>
```

---

### T28 · Add accessibility labels to checkout

**File**: `app/checkout.tsx`

- Delivery/Pickup toggle buttons: `accessibilityLabel="Select delivery" accessibilityRole="radio"`
- COD/UPI payment buttons: `accessibilityLabel="Pay with Cash on Delivery" accessibilityRole="radio"`
- Place order button: `accessibilityLabel="Place order" accessibilityRole="button"`
- Address text input: `accessibilityLabel="Delivery address" accessibilityHint="Enter your full delivery address"`

---

### T29 · Add accessibility labels to shopkeeper order actions

**File**: `app/(shopkeeper)/orders.tsx`

- Accept button: `accessibilityLabel="Accept order" accessibilityRole="button"`
- Reject button: `accessibilityLabel="Reject order" accessibilityRole="button"`
- Pack button: `accessibilityLabel="Mark as packed" accessibilityRole="button"`
- Ready/Dispatch button: `accessibilityLabel="Mark as ready for pickup" accessibilityRole="button"`

---

## Sprint 11 — Final Polish

### T30 · Fix `formatShopHours` display in shop detail

**File**: `app/shop/[id].tsx`

Display hours in the shop header/info section:
```tsx
import { isShopCurrentlyOpen, formatShopHours } from "@/utils/shopUtils";

// In the shop meta row:
<Text style={styles.hours}>{formatShopHours(shop)}</Text>
```

**Verification**: Shop detail shows "7:00 AM – 10:00 PM" style hours.

---

### T31 · Fix `router.push` for product navigation in `shop/[id].tsx`

**File**: `app/shop/[id].tsx`

Check for any `router.push("/product/" + ...)` patterns and convert to typed form:
```typescript
router.push({ pathname: "/product/[id]", params: { id: product.id } });
```

**Verification**: No string-concatenated `router.push` calls remain in the file.

---

### T32 · `isShopkeeper` guard on `_layout.tsx` for shopkeeper routes

**File**: `app/(shopkeeper)/_layout.tsx` (if present) or `app/_layout.tsx`

Ensure the `(shopkeeper)` route group redirects unauthenticated or customer users:
```typescript
const { isShopkeeper } = useApp();

useEffect(() => {
  if (!isShopkeeper) {
    router.replace("/login");
  }
}, [isShopkeeper]);
```

**Verification**: Navigating directly to `/(shopkeeper)/dashboard` without shopkeeper login redirects to login.

---

### T33 · Full typecheck pass

**Command**: `pnpm run typecheck`

After all implementation tasks are done, run the full workspace typecheck. Expected result: zero errors related to our changes. Pre-existing unrelated errors (if any) are documented.

---

### T34 · End-to-end smoke test

Manual test walkthrough:

| Scenario | Steps | Expected |
|---|---|---|
| Customer login | Enter phone, any 6-digit OTP, Customer mode | Lands on home map screen |
| Shopkeeper persistence | Login as shopkeeper, close app, reopen | Shopkeeper mode active (no re-login needed) |
| Cross-shop cart | Add from Gupta Kirana, then add from Sharma Store | Alert shown; confirming clears cart |
| Closed shop order | Navigate to Mohan Kirana (closed) | Closed banner shown, Add buttons disabled |
| Checkout validation | Delivery mode, clear address field, tap Place Order | Inline error shown, order not placed |
| Reorder with cart | Place order, add something new to cart, tap Reorder | Alert shown; confirming replaces cart |
| Inventory→catalogue | Shopkeeper: add "Jaggery 500g" product | Customer: Gupta Kirana shop shows Jaggery |
| Price display | Add 500g tomatoes (₹15) to cart | ProductCard shows ₹15, not ₹30 |
| OTP countdown | Enter phone, Send OTP | Countdown from 30 visible; Resend active at 0 |
| Search reactivity | Add new inventory item, search for it | Item appears in search results |
| Earnings accuracy | Reject an order, check dashboard earnings | Rejected order not included in earnings |
| Router types | Run typecheck | No router.push type errors |

---

## Risk Register for Implementation

| Risk | Trigger | Mitigation |
|---|---|---|
| `setIsShopkeeper` call sites missed | Any file still calling the removed function | Grep for `setIsShopkeeper` after T01 and update all hits |
| `getProductsByShop` used in files not yet updated | Search screen or other consumers still using module export | Grep for `getProductsByShop` and audit all call sites |
| `isActive` filter breaks existing products | MOCK_PRODUCTS don't have `isActive` field | Default `undefined` treated as `true` — no breakage |
| `window.confirm` unavailable in SSR | Not applicable — Expo Web runs client-side only | Safe to use |
| `currentUser` null check needed everywhere | Any consumer accessing `currentUser.shopId` without guard | Use `currentUser?.shopId ?? "s1"` pattern throughout |
| Inventory local `INITIAL_PRODUCTS` removal breaks UI | Component was reading local state that no longer exists | T21 replaces entirely — verify no dangling local state |

---

## Grep Reference (use before each sprint to confirm targets)

```bash
# Find all setIsShopkeeper usages:
grep -r "setIsShopkeeper" artifacts/kirana-konnect/

# Find all getProductsByShop usages:
grep -r "getProductsByShop" artifacts/kirana-konnect/

# Find all shop.isOpen direct accesses:
grep -r "shop\.isOpen" artifacts/kirana-konnect/

# Find all router.push with string concat:
grep -r 'router\.push("/' artifacts/kirana-konnect/

# Find all console.log (should be zero in final):
grep -r "console\.log" artifacts/kirana-konnect/src/
```

---

## Summary Table

| Sprint | Tasks | Fixes | Risk |
|---|---|---|---|
| 1 — AppContext | T01–T04 | B1, B3, B6, B15, B24 | Medium (foundation) |
| 2 — Utilities | T05 | B2, B8 (utility) | Low |
| 3 — Login | T06–T07 | B9, B24 (persistence) | Low |
| 4 — Shop Availability | T08–T14 | B2, B8, B10, B13 | Low |
| 5 — Cart & Reorder | T15–T17 | B1, B5 | Low |
| 6 — Shopkeeper | T18–T21 | B3, B7, B15 | Medium |
| 7 — Customer Shop | T22 | B3 (customer side) | Low |
| 8 — Search | T23 | B12 | Low |
| 9 — TypeScript | T24–T25 | B11 | Trivial |
| 10 — Accessibility | T26–T29 | B18 | Low |
| 11 — Polish | T30–T34 | B31, smoke test | Low |

**All 24 bugs from Phase 1/2 Tier 1 & Tier 2 are addressed across these 34 tasks.**

---

*End of Phase 4. The implementation plan is complete. Awaiting approval to begin Phase 5 (Implementation).*
