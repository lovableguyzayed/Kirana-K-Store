import { Router, type IRouter } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  ORDER_STATUS_TRANSITIONS,
  db,
  ordersTable,
  productsTable,
  shopsTable,
  type OrderItemSnapshot,
  type OrderStatus,
} from "@workspace/db";
import {
  GetOrderResponse,
  ListOrdersQueryParams,
  ListOrdersResponse,
  ListShopOrdersResponse,
  PlaceOrderBody,
  UpdateOrderStatusBody,
} from "@workspace/api-zod";
import {
  callerPhone,
  canManageShop,
  normalizePhone,
  requireAuthIfEnabled,
} from "../middlewares/auth";

const router: IRouter = Router();

const FREE_DELIVERY_THRESHOLD = 200;
const DELIVERY_FEE = 30;

/** Parses weight labels like "500 g" / "1.5 kg" into kilograms. */
function parseWeightKg(label: string): number | null {
  const match = /^([\d.]+)\s*(g|kg)$/i.exec(label.trim());
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  return match[2].toLowerCase() === "g" ? value / 1000 : value;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

router.post("/orders", requireAuthIfEnabled, async (req, res) => {
  const parsed = PlaceOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }
  const body = parsed.data;

  if (body.mode === "delivery" && !body.address?.trim()) {
    res.status(400).json({ message: "Delivery orders require an address" });
    return;
  }

  const [shop] = await db
    .select({ id: shopsTable.id, name: shopsTable.name })
    .from(shopsTable)
    .where(eq(shopsTable.id, body.shopId))
    .limit(1);
  if (!shop) {
    res.status(404).json({ message: "Shop not found" });
    return;
  }

  const productIds = [...new Set(body.items.map((i) => i.productId))];
  const products = await db
    .select()
    .from(productsTable)
    .where(
      and(
        inArray(productsTable.id, productIds),
        eq(productsTable.shopId, shop.id),
        eq(productsTable.isActive, true),
      ),
    );
  const productById = new Map(products.map((p) => [p.id, p]));

  const items: OrderItemSnapshot[] = [];
  for (const item of body.items) {
    const product = productById.get(item.productId);
    if (!product) {
      res.status(404).json({ message: `Product not available: ${item.productId}` });
      return;
    }

    // Prices are always computed server-side from the catalog. Weight-based
    // items derive the line price from the requested weight (e.g. "500 g"
    // at a per-kg catalog price).
    let price = product.price;
    if (product.isWeightBased) {
      const kg = item.selectedWeight ? parseWeightKg(item.selectedWeight) : null;
      if (kg === null) {
        res.status(400).json({
          message: `Weight-based item needs a weight like "500 g": ${product.name}`,
        });
        return;
      }
      price = round2(product.price * kg);
    }

    items.push({
      productId: product.id,
      name: product.name,
      price,
      unit: product.unit,
      quantity: item.quantity,
      ...(item.selectedWeight ? { selectedWeight: item.selectedWeight } : {}),
    });
  }

  const subtotal = round2(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const deliveryFee =
    body.mode === "delivery" && subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0;

  const [order] = await db
    .insert(ordersTable)
    .values({
      shopId: shop.id,
      shopName: shop.name,
      // A verified login token is the source of truth for identity; the
      // body value is only trusted for anonymous (pre-auth rollout) callers.
      customerPhone: normalizePhone(req.auth?.phone ?? body.customerPhone),
      items,
      total: round2(subtotal + deliveryFee),
      deliveryFee,
      mode: body.mode,
      address: body.address ?? null,
      paymentMethod: body.paymentMethod,
    })
    .returning();

  res.status(201).json(GetOrderResponse.parse(order));
});

router.get("/orders", requireAuthIfEnabled, async (req, res) => {
  const parsed = ListOrdersQueryParams.safeParse(req.query);
  const phone = req.auth?.phone ?? (parsed.success ? parsed.data.phone : "");
  if (!phone.trim()) {
    res.status(400).json({ message: "phone query parameter is required" });
    return;
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.customerPhone, normalizePhone(phone)))
    .orderBy(desc(ordersTable.placedAt));

  res.json(ListOrdersResponse.parse(orders));
});

router.get("/orders/:orderId", async (req, res) => {
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, req.params.orderId))
    .limit(1);

  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }

  res.json(GetOrderResponse.parse(order));
});

router.patch<{ orderId: string }>("/orders/:orderId/status", requireAuthIfEnabled, async (req, res) => {
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid status" });
    return;
  }
  const nextStatus = parsed.data.status as OrderStatus;

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, req.params.orderId))
    .limit(1);
  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }

  if (!ORDER_STATUS_TRANSITIONS[order.status].includes(nextStatus)) {
    res.status(400).json({
      message: `Cannot change status from "${order.status}" to "${nextStatus}"`,
    });
    return;
  }

  // The shop's owner drives the lifecycle; the order's own customer may
  // only cancel while it is still pending.
  const [shop] = await db
    .select({ ownerPhone: shopsTable.ownerPhone })
    .from(shopsTable)
    .where(eq(shopsTable.id, order.shopId))
    .limit(1);
  const isOwner = !!shop && canManageShop(shop, req);
  const isCustomerCancel =
    order.status === "pending" &&
    nextStatus === "rejected" &&
    callerPhone(req) === order.customerPhone;
  if (!isOwner && !isCustomerCancel) {
    res.status(403).json({ message: "Not allowed to update this order" });
    return;
  }

  const [updated] = await db
    .update(ordersTable)
    .set({ status: nextStatus })
    .where(eq(ordersTable.id, order.id))
    .returning();

  res.json(GetOrderResponse.parse(updated));
});

router.get<{ shopId: string }>("/shops/:shopId/orders", requireAuthIfEnabled, async (req, res) => {
  const [shop] = await db
    .select({ id: shopsTable.id, ownerPhone: shopsTable.ownerPhone })
    .from(shopsTable)
    .where(eq(shopsTable.id, req.params.shopId))
    .limit(1);
  if (!shop) {
    res.status(404).json({ message: "Shop not found" });
    return;
  }
  // Orders carry customers' phones and addresses — owner only.
  if (!canManageShop(shop, req)) {
    res.status(403).json({ message: "Not allowed to view this shop's orders" });
    return;
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.shopId, shop.id))
    .orderBy(desc(ordersTable.placedAt));

  res.json(ListShopOrdersResponse.parse(orders));
});

export default router;
