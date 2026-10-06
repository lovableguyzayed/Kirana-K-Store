import { Router, type IRouter } from "express";
import { asc, and, eq } from "drizzle-orm";
import { db, productsTable, shopsTable } from "@workspace/db";
import {
  GetMyShopResponse,
  GetShopResponse,
  ListShopInventoryResponse,
  ListShopProductsResponse,
  ListShopsResponse,
  RegisterShopBody,
} from "@workspace/api-zod";
import { callerPhone, canManageShop, requireAuthIfEnabled } from "../middlewares/auth";

const router: IRouter = Router();

// Response schemas strip unknown keys, so owner phones never leave the API.

router.get("/shops", async (_req, res) => {
  const shops = await db
    .select()
    .from(shopsTable)
    .orderBy(asc(shopsTable.name));
  res.json(ListShopsResponse.parse(shops));
});

router.post("/shops", requireAuthIfEnabled, async (req, res) => {
  const owner = callerPhone(req);
  if (!owner) {
    res.status(401).json({ message: "Sign in to register a shop" });
    return;
  }

  const parsed = RegisterShopBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }
  const body = parsed.data;

  const [existing] = await db
    .select({ id: shopsTable.id })
    .from(shopsTable)
    .where(eq(shopsTable.ownerPhone, owner))
    .limit(1);
  if (existing) {
    res.status(409).json({ message: "You already have a registered shop" });
    return;
  }

  const [shop] = await db
    .insert(shopsTable)
    .values({
      name: body.name.trim(),
      ownerName: body.ownerName.trim(),
      ownerPhone: owner,
      address: body.address.trim(),
      lat: body.lat,
      lng: body.lng,
      openTime: body.openTime,
      closeTime: body.closeTime,
      categories: [...new Set(body.categories.map((c) => c.trim()).filter(Boolean))],
    })
    .returning();

  res.status(201).json(GetShopResponse.parse(shop));
});

router.get("/me/shop", requireAuthIfEnabled, async (req, res) => {
  const owner = callerPhone(req);
  const [shop] = owner
    ? await db.select().from(shopsTable).where(eq(shopsTable.ownerPhone, owner)).limit(1)
    : [];
  if (!shop) {
    res.status(404).json({ message: "No shop registered for this account" });
    return;
  }
  res.json(GetMyShopResponse.parse(shop));
});

router.get<{ shopId: string }>("/shops/:shopId/inventory", requireAuthIfEnabled, async (req, res) => {
  const [shop] = await db
    .select({ id: shopsTable.id, name: shopsTable.name, ownerPhone: shopsTable.ownerPhone })
    .from(shopsTable)
    .where(eq(shopsTable.id, req.params.shopId))
    .limit(1);
  if (!shop) {
    res.status(404).json({ message: "Shop not found" });
    return;
  }
  if (!canManageShop(shop, req)) {
    res.status(403).json({ message: "Not allowed to view this shop's inventory" });
    return;
  }

  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.shopId, shop.id))
    .orderBy(asc(productsTable.name));

  res.json(
    ListShopInventoryResponse.parse(products.map((p) => ({ ...p, shopName: shop.name }))),
  );
});

router.get("/shops/:shopId", async (req, res) => {
  const [shop] = await db
    .select()
    .from(shopsTable)
    .where(eq(shopsTable.id, req.params.shopId))
    .limit(1);

  if (!shop) {
    res.status(404).json({ message: "Shop not found" });
    return;
  }

  res.json(GetShopResponse.parse(shop));
});

router.get("/shops/:shopId/products", async (req, res) => {
  const [shop] = await db
    .select({ id: shopsTable.id, name: shopsTable.name })
    .from(shopsTable)
    .where(eq(shopsTable.id, req.params.shopId))
    .limit(1);

  if (!shop) {
    res.status(404).json({ message: "Shop not found" });
    return;
  }

  const products = await db
    .select()
    .from(productsTable)
    .where(
      and(
        eq(productsTable.shopId, shop.id),
        eq(productsTable.isActive, true),
      ),
    )
    .orderBy(asc(productsTable.name));

  res.json(
    ListShopProductsResponse.parse(
      products.map((product) => ({ ...product, shopName: shop.name })),
    ),
  );
});

export default router;
