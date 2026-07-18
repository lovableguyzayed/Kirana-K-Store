import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import {
  getOrder as apiGetOrder,
  listOrders as apiListOrders,
  listShopOrders as apiListShopOrders,
  listShopProducts as apiListShopProducts,
  listShops as apiListShops,
  placeOrder as apiPlaceOrder,
  updateOrderStatus as apiUpdateOrderStatus,
  type Order as ApiOrder,
  type Product as ApiProduct,
  type Shop as ApiShop,
} from "@workspace/api-client-react";

export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  image?: string;
  shopId: string;
  shopName: string;
  category: string;
  stock: number;
  description?: string;
  isWeightBased?: boolean;
  isActive?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  selectedWeight?: string;
}

export interface Shop {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  distance: string;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
  categories: string[];
  image?: string;
}

export interface Order {
  id: string;
  shopId: string;
  shopName: string;
  items: CartItem[];
  total: number;
  deliveryFee: number;
  status: "pending" | "accepted" | "packed" | "out_for_delivery" | "delivered" | "rejected";
  mode: "pickup" | "delivery";
  address?: string;
  paymentMethod: "cod" | "upi";
  placedAt: string;
}

export interface AppUser {
  phone: string;
  role: "customer" | "shopkeeper";
  shopId?: string;
  shopName?: string;
  ownerName?: string;
}

interface AppContextType {
  cart: CartItem[];
  orders: Order[];
  shops: Shop[];
  isLive: boolean;
  refreshOrders: () => Promise<void>;
  refreshOrder: (orderId: string) => Promise<void>;
  getProductsByShop: (shopId: string) => Product[];
  getProductById: (productId: string) => Product | undefined;
  selectedShop: Shop | null;
  deliveryMode: "pickup" | "delivery";
  isShopkeeper: boolean;
  currentUser: AppUser | null;
  setCurrentUser: (user: AppUser | null) => void;
  shopProducts: Record<string, Product[]>;
  addProduct: (shopId: string, product: Omit<Product, "id" | "shopId" | "shopName">) => void;
  updateProduct: (shopId: string, productId: string, updates: Partial<Product>) => void;
  deleteProduct: (shopId: string, productId: string) => void;
  toggleProductActive: (shopId: string, productId: string) => void;
  cartShopId: string | null;
  addToCart: (product: Product, opts?: { selectedWeight?: string; priceOverride?: number }) => void;
  replaceCart: (product: Product, opts?: { selectedWeight?: string; priceOverride?: number }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setSelectedShop: (shop: Shop | null) => void;
  setDeliveryMode: (mode: "pickup" | "delivery") => void;
  placeOrder: (address: string, paymentMethod: "cod" | "upi") => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<void>;
  cartTotal: number;
  cartCount: number;
}

const AppContext = createContext<AppContextType | null>(null);

const MOCK_SHOPS: Shop[] = [
  {
    id: "s1",
    name: "Gupta Kirana",
    address: "12, MG Road, Near Bus Stand",
    lat: 28.6139,
    lng: 77.209,
    rating: 4.5,
    distance: "0.5 km",
    openTime: "07:00",
    closeTime: "22:00",
    isOpen: true,
    categories: ["Dairy", "Grocery", "Snacks", "Beverages"],
    image: undefined,
  },
  {
    id: "s2",
    name: "Sharma Store",
    address: "45, Lajpat Nagar",
    lat: 28.6169,
    lng: 77.212,
    rating: 4.2,
    distance: "1.2 km",
    openTime: "08:00",
    closeTime: "21:00",
    isOpen: true,
    categories: ["Grocery", "Snacks", "Bakery"],
    image: undefined,
  },
  {
    id: "s3",
    name: "Mohan Kirana",
    address: "7, Defence Colony Market",
    lat: 28.611,
    lng: 77.222,
    rating: 4.0,
    distance: "1.8 km",
    openTime: "06:30",
    closeTime: "23:00",
    isOpen: false,
    categories: ["Dairy", "Grocery", "Vegetables"],
    image: undefined,
  },
  {
    id: "s4",
    name: "Patel General",
    address: "23, Sector 14",
    lat: 28.6098,
    lng: 77.2035,
    rating: 4.7,
    distance: "2.3 km",
    openTime: "07:30",
    closeTime: "22:30",
    isOpen: true,
    categories: ["Grocery", "Dairy", "Snacks", "Stationery"],
    image: undefined,
  },
];

export const SHOPS = MOCK_SHOPS;

const MOCK_PRODUCTS: Record<string, Product[]> = {
  s1: [
    {
      id: "p1", name: "Amul Milk 500ml", price: 25, unit: "packet",
      shopId: "s1", shopName: "Gupta Kirana", category: "Dairy", stock: 50,
      description: "Fresh pasteurized toned milk by Amul. Rich in calcium and protein. Ideal for tea, coffee, and daily consumption. Keep refrigerated after opening.",
    },
    {
      id: "p2", name: "Fortune Basmati Rice 5kg", price: 350, unit: "bag",
      shopId: "s1", shopName: "Gupta Kirana", category: "Grocery", stock: 20,
      description: "Premium aged basmati rice with extra-long grains and a distinctive aroma. Perfect for biryanis, pulaos, and everyday cooking. Each grain cooks to a light and fluffy texture.",
    },
    {
      id: "p3", name: "Aashirvaad Atta 5kg", price: 260, unit: "bag",
      shopId: "s1", shopName: "Gupta Kirana", category: "Grocery", stock: 15,
      description: "Made from whole wheat grain, Aashirvaad Atta gives you soft, delicious rotis every time. Contains natural wheat bran and germ for better nutrition.",
    },
    {
      id: "p4", name: "Britannia Bread", price: 40, unit: "pack",
      shopId: "s1", shopName: "Gupta Kirana", category: "Bakery", stock: 10,
      description: "Soft and fresh white bread loaf by Britannia. Made with enriched wheat flour, ideal for sandwiches and toast. No artificial preservatives.",
    },
    {
      id: "p5", name: "Parle-G Biscuits", price: 10, unit: "pack",
      shopId: "s1", shopName: "Gupta Kirana", category: "Snacks", stock: 100,
      description: "India's most loved glucose biscuit. Crispy, light, and mildly sweet. Great with chai or as a quick snack for kids and adults alike.",
    },
    {
      id: "p6", name: "Tata Tea Gold 250g", price: 120, unit: "box",
      shopId: "s1", shopName: "Gupta Kirana", category: "Beverages", stock: 30,
      description: "Tata Tea Gold is a blend of whole leaf tea from the finest gardens. Brews a strong, flavourful cup every morning. 250g pack — 100+ cups.",
    },
    {
      id: "p7", name: "Maggi Noodles 2-min", price: 14, unit: "pack",
      shopId: "s1", shopName: "Gupta Kirana", category: "Snacks", stock: 80,
      description: "Quick, easy, and delicious — Maggi 2-Minute Noodles have been a beloved snack in Indian homes for decades. Ready in just 2 minutes.",
    },
    {
      id: "p8", name: "Surf Excel Matic 2kg", price: 310, unit: "box",
      shopId: "s1", shopName: "Gupta Kirana", category: "Grocery", stock: 8,
      description: "Surf Excel Matic is specially designed for fully automatic washing machines. Gives brilliant clean in cold water with tough stain removal.",
    },
  ],
  s2: [
    {
      id: "p9", name: "Mother Dairy Curd 400g", price: 40, unit: "cup",
      shopId: "s2", shopName: "Sharma Store", category: "Dairy", stock: 25,
      description: "Thick, creamy and fresh set curd by Mother Dairy. Made from pasteurized milk, it is naturally probiotic and great for digestion. Perfect with meals.",
    },
    {
      id: "p10", name: "Lay's Classic Chips", price: 20, unit: "pack",
      shopId: "s2", shopName: "Sharma Store", category: "Snacks", stock: 60,
      description: "Light and crispy potato chips with just the right amount of salt. Lay's Classic is the go-to snack for parties, evenings, or anytime cravings.",
    },
    {
      id: "p11", name: "Hide & Seek Biscuits", price: 30, unit: "pack",
      shopId: "s2", shopName: "Sharma Store", category: "Snacks", stock: 40,
      description: "Hide & Seek chocolate chip cookies by Parle — a premium cookie loaded with real chocolate chips. Crispy on the outside, soft on the inside.",
    },
    {
      id: "p12", name: "Bread (Whole Wheat)", price: 45, unit: "loaf",
      shopId: "s2", shopName: "Sharma Store", category: "Bakery", stock: 12,
      description: "Freshly baked whole wheat bread loaf with natural grain goodness. Higher in fibre, great for sandwiches, toast, or healthy snacking.",
    },
  ],
  s3: [
    {
      id: "p13", name: "Tomatoes", price: 30, unit: "kg",
      shopId: "s3", shopName: "Mohan Kirana", category: "Vegetables", stock: 30,
      isWeightBased: true,
      description: "Fresh, ripe tomatoes sourced daily from local farms. Rich in vitamins C and K, great for curries, salads, and cooking. Buy by weight.",
    },
    {
      id: "p14", name: "Onions", price: 25, unit: "kg",
      shopId: "s3", shopName: "Mohan Kirana", category: "Vegetables", stock: 40,
      isWeightBased: true,
      description: "Farm-fresh onions, a staple in every Indian kitchen. Used in curries, biryanis, and chutneys. Bought fresh daily. Price per kg.",
    },
    {
      id: "p15", name: "Amul Butter 100g", price: 52, unit: "pack",
      shopId: "s3", shopName: "Mohan Kirana", category: "Dairy", stock: 20,
      description: "Amul pasteurized butter in a 100g pack. Made from fresh cream, rich in taste. Perfect for spreading on toast, cooking, and baking.",
    },
  ],
  s4: [
    {
      id: "p16", name: "Nestle Munch", price: 10, unit: "bar",
      shopId: "s4", shopName: "Patel General", category: "Snacks", stock: 50,
      description: "Nestle Munch — a crispy wafer chocolate bar coated with delicious milk chocolate. Light, crunchy, and irresistibly tasty. Great for a quick treat.",
    },
    {
      id: "p17", name: "Amul Cheese Slices", price: 85, unit: "pack",
      shopId: "s4", shopName: "Patel General", category: "Dairy", stock: 15,
      description: "Amul processed cheese slices — smooth, creamy, and easy to use. Perfect for sandwiches, burgers, and omelettes. Pack of 10 slices.",
    },
    {
      id: "p18", name: "Cadbury Dairy Milk", price: 40, unit: "bar",
      shopId: "s4", shopName: "Patel General", category: "Snacks", stock: 30,
      description: "India's favourite chocolate — Cadbury Dairy Milk. Made with the finest cocoa and milk, it melts in your mouth. Perfect for gifting or indulging.",
    },
    {
      id: "p19", name: "Colgate MaxFresh 150g", price: 65, unit: "tube",
      shopId: "s4", shopName: "Patel General", category: "Grocery", stock: 20,
      description: "Colgate MaxFresh toothpaste with cooling crystals and spearmint gel. Fights cavities, whitens teeth, and leaves a long-lasting fresh breath all day.",
    },
  ],
};

export const getProductsByShop = (shopId: string) => MOCK_PRODUCTS[shopId] || [];

export const getProductById = (productId: string): Product | undefined => {
  for (const products of Object.values(MOCK_PRODUCTS)) {
    const found = products.find((p) => p.id === productId);
    if (found) return found;
  }
  return undefined;
};

export const isWeightBased = (product: Product): boolean =>
  product.isWeightBased === true || ["kg", "g", "gram", "litre", "liter", "ml"].includes(product.unit.toLowerCase());

export interface WeightOption {
  label: string;
  multiplier: number;
}

export const getWeightOptions = (unit: string): WeightOption[] => {
  const u = unit.toLowerCase();
  if (u === "kg" || u === "g" || u === "gram") {
    return [
      { label: "250 g", multiplier: 0.25 },
      { label: "500 g", multiplier: 0.5 },
      { label: "1 kg", multiplier: 1 },
      { label: "2 kg", multiplier: 2 },
    ];
  }
  if (u === "litre" || u === "liter" || u === "ml") {
    return [
      { label: "250 ml", multiplier: 0.25 },
      { label: "500 ml", multiplier: 0.5 },
      { label: "1 L", multiplier: 1 },
      { label: "2 L", multiplier: 2 },
    ];
  }
  return [];
};

const MOCK_ORDERS: Order[] = [
  {
    id: "o003",
    shopId: "s3",
    shopName: "Mohan Kirana",
    items: [
      { id: "p3", name: "Britannia Bread", price: 40, unit: "loaf", shopId: "s3", shopName: "Mohan Kirana", category: "Bakery", stock: 20, quantity: 1 },
      { id: "p4", name: "Tata Salt 1kg", price: 22, unit: "kg", shopId: "s3", shopName: "Mohan Kirana", category: "Staples", stock: 80, quantity: 2 },
    ],
    total: 84,
    deliveryFee: 15,
    status: "out_for_delivery",
    mode: "delivery",
    address: "Home - Block A, Sector 5",
    paymentMethod: "cod",
    placedAt: "2026-04-11T13:10:00Z",
  },
  {
    id: "o001",
    shopId: "s1",
    shopName: "Gupta Kirana",
    items: [
      { id: "p1", name: "Amul Milk 500ml", price: 25, unit: "packet", shopId: "s1", shopName: "Gupta Kirana", category: "Dairy", stock: 50, quantity: 2 },
      { id: "p5", name: "Parle-G Biscuits", price: 10, unit: "pack", shopId: "s1", shopName: "Gupta Kirana", category: "Snacks", stock: 100, quantity: 3 },
    ],
    total: 80,
    deliveryFee: 20,
    status: "delivered",
    mode: "delivery",
    address: "Home - Block A, Sector 5",
    paymentMethod: "cod",
    placedAt: "2026-04-10T14:32:00Z",
  },
  {
    id: "o002",
    shopId: "s2",
    shopName: "Sharma Store",
    items: [
      { id: "p10", name: "Lay's Classic Chips", price: 20, unit: "pack", shopId: "s2", shopName: "Sharma Store", category: "Snacks", stock: 60, quantity: 2 },
    ],
    total: 40,
    deliveryFee: 0,
    status: "delivered",
    mode: "pickup",
    paymentMethod: "upi",
    placedAt: "2026-04-09T10:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// API → app-model mapping. The bundled mock catalog above stays as the
// offline/demo fallback; when the backend is reachable it replaces it.
// ---------------------------------------------------------------------------

const MAP_CENTER = { lat: 28.6139, lng: 77.209 };

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function apiShopToApp(s: ApiShop): Shop {
  return {
    id: s.id,
    name: s.name,
    address: s.address,
    lat: s.lat,
    lng: s.lng,
    rating: s.rating,
    distance: `${distanceKm(MAP_CENTER.lat, MAP_CENTER.lng, s.lat, s.lng).toFixed(1)} km`,
    openTime: s.openTime,
    closeTime: s.closeTime,
    isOpen: s.isOpen,
    categories: s.categories,
    image: s.image ?? undefined,
  };
}

function apiProductToApp(p: ApiProduct): Product {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    unit: p.unit,
    image: p.image ?? undefined,
    shopId: p.shopId,
    shopName: p.shopName,
    category: p.category,
    stock: p.stock,
    description: p.description ?? undefined,
    isWeightBased: p.isWeightBased,
    isActive: p.isActive,
  };
}

function apiOrderToApp(o: ApiOrder): Order {
  return {
    id: o.id,
    shopId: o.shopId,
    shopName: o.shopName,
    items: o.items.map((it) => ({
      id: it.productId,
      name: it.name,
      price: it.price,
      unit: it.unit,
      quantity: it.quantity,
      selectedWeight: it.selectedWeight,
      shopId: o.shopId,
      shopName: o.shopName,
      category: "",
      stock: 0,
    })),
    total: o.total,
    deliveryFee: o.deliveryFee,
    status: o.status,
    mode: o.mode,
    address: o.address ?? undefined,
    paymentMethod: o.paymentMethod,
    placedAt: typeof o.placedAt === "string" ? o.placedAt : new Date(o.placedAt).toISOString(),
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [shops, setShops] = useState<Shop[]>(MOCK_SHOPS);
  const [isLive, setIsLive] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<"pickup" | "delivery">("delivery");
  const [currentUser, setCurrentUserState] = useState<AppUser | null>(null);
  const [shopProducts, setShopProducts] = useState<Record<string, Product[]>>(MOCK_PRODUCTS);

  const isShopkeeper = currentUser?.role === "shopkeeper";

  // Load the live catalog from the backend; on failure keep the bundled demo
  // catalog so the app still works offline.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiShops = await apiListShops();
        const productEntries = await Promise.all(
          apiShops.map(
            async (s) =>
              [s.id, (await apiListShopProducts(s.id)).map(apiProductToApp)] as const,
          ),
        );
        if (cancelled) return;
        setShops(apiShops.map(apiShopToApp));
        setShopProducts(Object.fromEntries(productEntries));
        setIsLive(true);
      } catch {
        // Offline / backend unreachable — bundled catalog stays in place.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.getItem("kk_cart").then((val) => {
      if (val) setCart(JSON.parse(val));
    });
    AsyncStorage.getItem("kk_orders").then((val) => {
      if (val) {
        const saved: Order[] = JSON.parse(val);
        const savedIds = new Set(saved.map((o) => o.id));
        const merged = [
          ...MOCK_ORDERS.filter((m) => !savedIds.has(m.id)),
          ...saved,
        ];
        setOrders(merged);
      }
    });
    AsyncStorage.getItem("kk_user").then((val) => {
      if (val) setCurrentUserState(JSON.parse(val));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("kk_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    AsyncStorage.setItem("kk_orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    if (currentUser) {
      AsyncStorage.setItem("kk_user", JSON.stringify(currentUser));
    } else {
      AsyncStorage.removeItem("kk_user");
    }
  }, [currentUser]);

  const setCurrentUser = useCallback((user: AppUser | null) => {
    setCurrentUserState(user);
  }, []);

  // Pull the signed-in user's orders from the backend (customer: their
  // history; shopkeeper: the shop's incoming orders).
  const refreshOrders = useCallback(async () => {
    if (!currentUser) return;
    try {
      const apiOrders =
        currentUser.role === "shopkeeper" && currentUser.shopId
          ? await apiListShopOrders(currentUser.shopId)
          : await apiListOrders({ phone: currentUser.phone });
      setOrders(apiOrders.map(apiOrderToApp));
    } catch {
      // Offline — keep whatever we have locally.
    }
  }, [currentUser]);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  // Re-fetch a single order (used by the tracking screen to poll status).
  const refreshOrder = useCallback(async (orderId: string) => {
    try {
      const apiOrder = await apiGetOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === apiOrder.id ? apiOrderToApp(apiOrder) : o)),
      );
    } catch {
      // Offline or locally-created order — nothing to refresh.
    }
  }, []);

  const addProduct = useCallback(
    (shopId: string, product: Omit<Product, "id" | "shopId" | "shopName">) => {
      const shop = shops.find((s) => s.id === shopId);
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
    [shops]
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

  const addToCart = useCallback(
    (product: Product, opts?: { selectedWeight?: string; priceOverride?: number }) => {
      setCart((prev) => {
        if (prev.length > 0 && prev[0].shopId !== product.shopId) {
          return prev;
        }
        const existing = prev.find((i) => i.id === product.id);
        if (existing) {
          if (opts?.selectedWeight && opts.selectedWeight !== existing.selectedWeight) {
            return prev.map((i) =>
              i.id === product.id
                ? { ...i, selectedWeight: opts.selectedWeight, price: opts.priceOverride ?? product.price, quantity: 1 }
                : i
            );
          }
          return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
        }
        return [
          ...prev,
          {
            ...product,
            price: opts?.priceOverride ?? product.price,
            quantity: 1,
            selectedWeight: opts?.selectedWeight,
          },
        ];
      });
    },
    []
  );

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

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== productId));
    } else {
      setCart((prev) => prev.map((i) => (i.id === productId ? { ...i, quantity } : i)));
    }
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const placeOrder = useCallback(
    async (address: string, paymentMethod: "cod" | "upi"): Promise<Order> => {
      if (!selectedShop) {
        throw new Error("placeOrder: selectedShop is null");
      }

      // Live path: the backend computes prices and owns the order lifecycle.
      if (isLive && currentUser) {
        const apiOrder = await apiPlaceOrder({
          shopId: selectedShop.id,
          customerPhone: currentUser.phone,
          mode: deliveryMode,
          ...(deliveryMode === "delivery" ? { address } : {}),
          paymentMethod,
          items: cart.map((i) => ({
            productId: i.id,
            quantity: i.quantity,
            ...(i.selectedWeight ? { selectedWeight: i.selectedWeight } : {}),
          })),
        });
        const newOrder = apiOrderToApp(apiOrder);
        setOrders((prev) => [newOrder, ...prev]);
        setCart([]);
        return newOrder;
      }

      // Offline/demo fallback: create the order locally.
      const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const deliveryFee = deliveryMode === "delivery" ? (total < 200 ? 30 : 0) : 0;
      const newOrder: Order = {
        id: `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
        shopId: selectedShop.id,
        shopName: selectedShop.name,
        items: [...cart],
        total,
        deliveryFee,
        status: "pending",
        mode: deliveryMode,
        address: deliveryMode === "delivery" ? address : undefined,
        paymentMethod,
        placedAt: new Date().toISOString(),
      };
      setOrders((prev) => [newOrder, ...prev]);
      setCart([]);
      return newOrder;
    },
    [cart, deliveryMode, selectedShop, isLive, currentUser]
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: Order["status"]) => {
      // Optimistic local update, then confirm with the backend.
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      if (isLive) {
        try {
          const updated = await apiUpdateOrderStatus(orderId, { status });
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? apiOrderToApp(updated) : o)),
          );
        } catch {
          // Transition rejected or offline — restore server truth.
          refreshOrders();
        }
      }
    },
    [isLive, refreshOrders]
  );

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartShopId = cart.length > 0 ? cart[0].shopId : null;

  const getProductsByShopCtx = useCallback(
    (shopId: string) => shopProducts[shopId] ?? [],
    [shopProducts],
  );

  const getProductByIdCtx = useCallback(
    (productId: string) => {
      for (const products of Object.values(shopProducts)) {
        const found = products.find((p) => p.id === productId);
        if (found) return found;
      }
      return undefined;
    },
    [shopProducts],
  );

  return (
    <AppContext.Provider
      value={{
        cart,
        orders,
        shops,
        isLive,
        refreshOrders,
        refreshOrder,
        getProductsByShop: getProductsByShopCtx,
        getProductById: getProductByIdCtx,
        selectedShop,
        deliveryMode,
        isShopkeeper,
        currentUser,
        setCurrentUser,
        shopProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductActive,
        cartShopId,
        addToCart,
        replaceCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        setSelectedShop,
        setDeliveryMode,
        placeOrder,
        updateOrderStatus,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
