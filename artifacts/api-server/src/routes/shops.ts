import { Router, type IRouter } from "express";
import { asc, and, eq } from "drizzle-orm";
import { db, productsTable, shopsTable } from "@workspace/db";
import {
  GetShopResponse,
  ListShopProductsResponse,
  ListShopsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/shops", async (_req, res) => {
  const shops = await db
    .select()
    .from(shopsTable)
    .orderBy(asc(shopsTable.name));
  res.json(ListShopsResponse.parse(shops));
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
