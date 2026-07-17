import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, productsTable, shopsTable } from "@workspace/db";
import { GetProductResponse } from "@workspace/api-zod";

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

export default router;
