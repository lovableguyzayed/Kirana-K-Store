import { db } from "./index";
import { productsTable, shopsTable } from "./schema";
import type { Product, Shop } from "./schema";

// Initial catalog, carried over from the app's original mock data. IDs are
// stable ("s1", "p1", …) so devices that cached mock IDs keep working.

type ShopSeed = Omit<Shop, "createdAt">;
type ProductSeed = Omit<Product, "createdAt" | "description" | "image"> & {
  description?: string;
};

const SEED_SHOPS: ShopSeed[] = [
  {
    id: "s1",
    name: "Gupta Kirana",
    address: "12, MG Road, Near Bus Stand",
    lat: 28.6139,
    lng: 77.209,
    rating: 4.5,
    openTime: "07:00",
    closeTime: "22:00",
    isOpen: true,
    categories: ["Dairy", "Grocery", "Snacks", "Beverages"],
    image: null,
  },
  {
    id: "s2",
    name: "Sharma Store",
    address: "45, Lajpat Nagar",
    lat: 28.6169,
    lng: 77.212,
    rating: 4.2,
    openTime: "08:00",
    closeTime: "21:00",
    isOpen: true,
    categories: ["Grocery", "Snacks", "Bakery"],
    image: null,
  },
  {
    id: "s3",
    name: "Mohan Kirana",
    address: "7, Defence Colony Market",
    lat: 28.611,
    lng: 77.222,
    rating: 4.0,
    openTime: "06:30",
    closeTime: "23:00",
    isOpen: false,
    categories: ["Dairy", "Grocery", "Vegetables"],
    image: null,
  },
  {
    id: "s4",
    name: "Patel General",
    address: "23, Sector 14",
    lat: 28.6098,
    lng: 77.2035,
    rating: 4.7,
    openTime: "07:30",
    closeTime: "22:30",
    isOpen: true,
    categories: ["Grocery", "Dairy", "Snacks", "Stationery"],
    image: null,
  },
];

const p = (
  seed: Omit<ProductSeed, "isWeightBased" | "isActive"> & {
    isWeightBased?: boolean;
  },
): ProductSeed => ({ isWeightBased: false, isActive: true, ...seed });

const SEED_PRODUCTS: ProductSeed[] = [
  p({ id: "p1", shopId: "s1", name: "Amul Milk 500ml", price: 25, unit: "packet", category: "Dairy", stock: 50, description: "Fresh pasteurized toned milk by Amul. Rich in calcium and protein. Ideal for tea, coffee, and daily consumption. Keep refrigerated after opening." }),
  p({ id: "p2", shopId: "s1", name: "Fortune Basmati Rice 5kg", price: 350, unit: "bag", category: "Grocery", stock: 20, description: "Premium aged basmati rice with extra-long grains and a distinctive aroma. Perfect for biryanis, pulaos, and everyday cooking. Each grain cooks to a light and fluffy texture." }),
  p({ id: "p3", shopId: "s1", name: "Aashirvaad Atta 5kg", price: 260, unit: "bag", category: "Grocery", stock: 15, description: "Made from whole wheat grain, Aashirvaad Atta gives you soft, delicious rotis every time. Contains natural wheat bran and germ for better nutrition." }),
  p({ id: "p4", shopId: "s1", name: "Britannia Bread", price: 40, unit: "pack", category: "Bakery", stock: 10, description: "Soft and fresh white bread loaf by Britannia. Made with enriched wheat flour, ideal for sandwiches and toast. No artificial preservatives." }),
  p({ id: "p5", shopId: "s1", name: "Parle-G Biscuits", price: 10, unit: "pack", category: "Snacks", stock: 100, description: "India's most loved glucose biscuit. Crispy, light, and mildly sweet. Great with chai or as a quick snack for kids and adults alike." }),
  p({ id: "p6", shopId: "s1", name: "Tata Tea Gold 250g", price: 120, unit: "box", category: "Beverages", stock: 30, description: "Tata Tea Gold is a blend of whole leaf tea from the finest gardens. Brews a strong, flavourful cup every morning. 250g pack — 100+ cups." }),
  p({ id: "p7", shopId: "s1", name: "Maggi Noodles 2-min", price: 14, unit: "pack", category: "Snacks", stock: 80, description: "Quick, easy, and delicious — Maggi 2-Minute Noodles have been a beloved snack in Indian homes for decades. Ready in just 2 minutes." }),
  p({ id: "p8", shopId: "s1", name: "Surf Excel Matic 2kg", price: 310, unit: "box", category: "Grocery", stock: 8, description: "Surf Excel Matic is specially designed for fully automatic washing machines. Gives brilliant clean in cold water with tough stain removal." }),
  p({ id: "p9", shopId: "s2", name: "Mother Dairy Curd 400g", price: 40, unit: "cup", category: "Dairy", stock: 25, description: "Thick, creamy and fresh set curd by Mother Dairy. Made from pasteurized milk, it is naturally probiotic and great for digestion. Perfect with meals." }),
  p({ id: "p10", shopId: "s2", name: "Lay's Classic Chips", price: 20, unit: "pack", category: "Snacks", stock: 60, description: "Light and crispy potato chips with just the right amount of salt. Lay's Classic is the go-to snack for parties, evenings, or anytime cravings." }),
  p({ id: "p11", shopId: "s2", name: "Hide & Seek Biscuits", price: 30, unit: "pack", category: "Snacks", stock: 40, description: "Hide & Seek chocolate chip cookies by Parle — a premium cookie loaded with real chocolate chips. Crispy on the outside, soft on the inside." }),
  p({ id: "p12", shopId: "s2", name: "Bread (Whole Wheat)", price: 45, unit: "loaf", category: "Bakery", stock: 12, description: "Freshly baked whole wheat bread loaf with natural grain goodness. Higher in fibre, great for sandwiches, toast, or healthy snacking." }),
  p({ id: "p13", shopId: "s3", name: "Tomatoes", price: 30, unit: "kg", category: "Vegetables", stock: 30, isWeightBased: true, description: "Fresh, ripe tomatoes sourced daily from local farms. Rich in vitamins C and K, great for curries, salads, and cooking. Buy by weight." }),
  p({ id: "p14", shopId: "s3", name: "Onions", price: 25, unit: "kg", category: "Vegetables", stock: 40, isWeightBased: true, description: "Farm-fresh onions, a staple in every Indian kitchen. Used in curries, biryanis, and chutneys. Bought fresh daily. Price per kg." }),
  p({ id: "p15", shopId: "s3", name: "Amul Butter 100g", price: 52, unit: "pack", category: "Dairy", stock: 20, description: "Amul pasteurized butter in a 100g pack. Made from fresh cream, rich in taste. Perfect for spreading on toast, cooking, and baking." }),
  p({ id: "p16", shopId: "s4", name: "Nestle Munch", price: 10, unit: "bar", category: "Snacks", stock: 50, description: "Nestle Munch — a crispy wafer chocolate bar coated with delicious milk chocolate. Light, crunchy, and irresistibly tasty. Great for a quick treat." }),
  p({ id: "p17", shopId: "s4", name: "Amul Cheese Slices", price: 85, unit: "pack", category: "Dairy", stock: 15, description: "Amul processed cheese slices — smooth, creamy, and easy to use. Perfect for sandwiches, burgers, and omelettes. Pack of 10 slices." }),
  p({ id: "p18", shopId: "s4", name: "Cadbury Dairy Milk", price: 40, unit: "bar", category: "Snacks", stock: 30, description: "India's favourite chocolate — Cadbury Dairy Milk. Made with the finest cocoa and milk, it melts in your mouth. Perfect for gifting or indulging." }),
  p({ id: "p19", shopId: "s4", name: "Colgate MaxFresh 150g", price: 65, unit: "tube", category: "Grocery", stock: 20, description: "Colgate MaxFresh toothpaste with cooling crystals and spearmint gel. Fights cavities, whitens teeth, and leaves a long-lasting fresh breath all day." }),
];

/**
 * Inserts the starter catalog when the shops table is empty. Idempotent:
 * safe to call on every server boot. Returns true when seeding happened.
 */
export async function seedIfEmpty(): Promise<boolean> {
  const existing = await db
    .select({ id: shopsTable.id })
    .from(shopsTable)
    .limit(1);
  if (existing.length > 0) return false;

  await db.insert(shopsTable).values(SEED_SHOPS);
  await db.insert(productsTable).values(SEED_PRODUCTS);
  return true;
}
