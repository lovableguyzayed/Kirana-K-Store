import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

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
}

export interface CartItem extends Product {
  quantity: number;
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

interface AppContextType {
  cart: CartItem[];
  orders: Order[];
  selectedShop: Shop | null;
  deliveryMode: "pickup" | "delivery";
  isShopkeeper: boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setSelectedShop: (shop: Shop | null) => void;
  setDeliveryMode: (mode: "pickup" | "delivery") => void;
  placeOrder: (address: string, paymentMethod: "cod" | "upi") => Order;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
  setIsShopkeeper: (val: boolean) => void;
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
    { id: "p1", name: "Amul Milk 500ml", price: 25, unit: "packet", shopId: "s1", shopName: "Gupta Kirana", category: "Dairy", stock: 50 },
    { id: "p2", name: "Fortune Basmati Rice 5kg", price: 350, unit: "bag", shopId: "s1", shopName: "Gupta Kirana", category: "Grocery", stock: 20 },
    { id: "p3", name: "Aashirvaad Atta 5kg", price: 260, unit: "bag", shopId: "s1", shopName: "Gupta Kirana", category: "Grocery", stock: 15 },
    { id: "p4", name: "Britannia Bread", price: 40, unit: "pack", shopId: "s1", shopName: "Gupta Kirana", category: "Bakery", stock: 10 },
    { id: "p5", name: "Parle-G Biscuits", price: 10, unit: "pack", shopId: "s1", shopName: "Gupta Kirana", category: "Snacks", stock: 100 },
    { id: "p6", name: "Tata Tea Gold 250g", price: 120, unit: "box", shopId: "s1", shopName: "Gupta Kirana", category: "Beverages", stock: 30 },
    { id: "p7", name: "Maggi Noodles 2-min", price: 14, unit: "pack", shopId: "s1", shopName: "Gupta Kirana", category: "Snacks", stock: 80 },
    { id: "p8", name: "Surf Excel Matic 2kg", price: 310, unit: "box", shopId: "s1", shopName: "Gupta Kirana", category: "Grocery", stock: 8 },
  ],
  s2: [
    { id: "p9", name: "Mother Dairy Curd 400g", price: 40, unit: "cup", shopId: "s2", shopName: "Sharma Store", category: "Dairy", stock: 25 },
    { id: "p10", name: "Lay's Classic Chips", price: 20, unit: "pack", shopId: "s2", shopName: "Sharma Store", category: "Snacks", stock: 60 },
    { id: "p11", name: "Hide & Seek Biscuits", price: 30, unit: "pack", shopId: "s2", shopName: "Sharma Store", category: "Snacks", stock: 40 },
    { id: "p12", name: "Bread (Whole Wheat)", price: 45, unit: "loaf", shopId: "s2", shopName: "Sharma Store", category: "Bakery", stock: 12 },
  ],
  s3: [
    { id: "p13", name: "Tomatoes (1 kg)", price: 30, unit: "kg", shopId: "s3", shopName: "Mohan Kirana", category: "Vegetables", stock: 30 },
    { id: "p14", name: "Onions (1 kg)", price: 25, unit: "kg", shopId: "s3", shopName: "Mohan Kirana", category: "Vegetables", stock: 40 },
    { id: "p15", name: "Amul Butter 100g", price: 52, unit: "pack", shopId: "s3", shopName: "Mohan Kirana", category: "Dairy", stock: 20 },
  ],
  s4: [
    { id: "p16", name: "Nestle Munch", price: 10, unit: "bar", shopId: "s4", shopName: "Patel General", category: "Snacks", stock: 50 },
    { id: "p17", name: "Amul Cheese Slices", price: 85, unit: "pack", shopId: "s4", shopName: "Patel General", category: "Dairy", stock: 15 },
    { id: "p18", name: "Cadbury Dairy Milk", price: 40, unit: "bar", shopId: "s4", shopName: "Patel General", category: "Snacks", stock: 30 },
    { id: "p19", name: "Colgate MaxFresh 150g", price: 65, unit: "tube", shopId: "s4", shopName: "Patel General", category: "Grocery", stock: 20 },
  ],
};

export const getProductsByShop = (shopId: string) => MOCK_PRODUCTS[shopId] || [];

const MOCK_ORDERS: Order[] = [
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<"pickup" | "delivery">("delivery");
  const [isShopkeeper, setIsShopkeeper] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("kk_cart").then((val) => {
      if (val) setCart(JSON.parse(val));
    });
    AsyncStorage.getItem("kk_orders").then((val) => {
      if (val) setOrders(JSON.parse(val));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("kk_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    AsyncStorage.setItem("kk_orders", JSON.stringify(orders));
  }, [orders]);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

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
    (address: string, paymentMethod: "cod" | "upi"): Order => {
      const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const deliveryFee = deliveryMode === "delivery" ? (total < 200 ? 30 : 0) : 0;
      const newOrder: Order = {
        id: `o${Date.now()}`,
        shopId: selectedShop?.id || "",
        shopName: selectedShop?.name || "",
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
    [cart, deliveryMode, selectedShop]
  );

  const updateOrderStatus = useCallback((orderId: string, status: Order["status"]) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  }, []);

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        cart,
        orders,
        selectedShop,
        deliveryMode,
        isShopkeeper,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        setSelectedShop,
        setDeliveryMode,
        placeOrder,
        updateOrderStatus,
        setIsShopkeeper,
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
