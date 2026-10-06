import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, productsTable, shopsTable } from "@workspace/db";
import {
  CreateProductBody,
  GetProductResponse,
  UpdateProductBody,
} from "@workspace/api-zod";
import { canManageShop, requireAuthIfEnabled } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/products/:productId", async (req, res) => {
  const [row] = await db
    .select({ product: productsTable, shopName: shopsTable.name })
    .from(productsTable)
    .innerJoin(shopsTable, eq(productsTable.shopId, shopsTable.id))
    .where(eq(productsTable.id, req.params.productId))
    .limit(1);

  if (!row) {
    res.status(404).json({ message: "Product not found" });
    return;
  }

  res.json(
    GetProductResponse.parse({ ...row.product, shopName: row.shopName }),
  );
});

router.post<{ shopId: string }>("/shops/:shopId/products", requireAuthIfEnabled, async (req, res) => {
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
    res.status(403).json({ message: "Only the shop's owner can add products" });
    return;
  }

  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({ ...parsed.data, name: parsed.data.name.trim(), shopId: shop.id })
    .returning();

  res.status(201).json(GetProductResponse.parse({ ...product, shopName: shop.name }));
});

/** Loads a product with its shop and checks the caller may manage it. */
async function loadManagedProduct(
  productId: string,
  req: Parameters<typeof canManageShop>[1],
) {
  const [row] = await db
    .select({ product: productsTable, shop: shopsTable })
    .from(productsTable)
    .innerJoin(shopsTable, eq(productsTable.shopId, shopsTable.id))
    .where(eq(productsTable.id, productId))
    .limit(1);
  if (!row) return { status: 404 as const };
  if (!canManageShop(row.shop, req)) return { status: 403 as const };
  return { status: 200 as const, ...row };
}

router.patch<{ productId: string }>("/products/:productId", requireAuthIfEnabled, async (req, res) => {
  const found = await loadManagedProduct(req.params.productId, req);
  if (found.status === 404) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  if (found.status === 403) {
    res.status(403).json({ message: "Only the shop's owner can edit products" });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }
  if (Object.keys(parsed.data).length === 0) {
    res.status(400).json({ message: "No fields to update" });
    return;
  }

  const [updated] = await db
    .update(productsTable)
    .set(parsed.data)
    .where(eq(productsTable.id, found.product.id))
    .returning();

  res.json(GetProductResponse.parse({ ...updated, shopName: found.shop.name }));
});

router.delete<{ productId: string }>("/products/:productId", requireAuthIfEnabled, async (req, res) => {
  const found = await loadManagedProduct(req.params.productId, req);
  if (found.status === 404) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  if (found.status === 403) {
    res.status(403).json({ message: "Only the shop's owner can delete products" });
    return;
  }

  // Past orders keep their own item snapshots, so deleting is safe.
  await db.delete(productsTable).where(eq(productsTable.id, found.product.id));
  res.status(204).end();
});

export default router;
