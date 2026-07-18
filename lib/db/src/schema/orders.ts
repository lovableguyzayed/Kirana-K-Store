import {
  doublePrecision,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { shopsTable } from "./shops";

export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "packed",
  "out_for_delivery",
  "delivered",
  "rejected",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Statuses a shopkeeper may move an order to, from each current status.
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "rejected"],
  accepted: ["packed"],
  packed: ["out_for_delivery", "delivered"],
  out_for_delivery: ["delivered"],
  delivered: [],
  rejected: [],
};

/** Immutable snapshot of a product at order time (price may change later). */
export interface OrderItemSnapshot {
  productId: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  selectedWeight?: string;
}

export const ordersTable = pgTable("orders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  shopId: text("shop_id")
    .notNull()
    .references(() => shopsTable.id),
  shopName: text("shop_name").notNull(),
  // Interim identity until Supabase Auth lands: the phone the user logged in with.
  customerPhone: text("customer_phone").notNull(),
  items: jsonb("items").$type<OrderItemSnapshot[]>().notNull(),
  total: doublePrecision("total").notNull(),
  deliveryFee: doublePrecision("delivery_fee").notNull().default(0),
  status: text("status", { enum: ORDER_STATUSES }).notNull().default("pending"),
  mode: text("mode", { enum: ["pickup", "delivery"] }).notNull(),
  address: text("address"),
  paymentMethod: text("payment_method", { enum: ["cod", "upi"] }).notNull(),
  placedAt: timestamp("placed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type OrderRow = typeof ordersTable.$inferSelect;
