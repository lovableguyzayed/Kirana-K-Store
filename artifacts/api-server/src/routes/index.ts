import { Router, type IRouter } from "express";
import healthRouter from "./health";
import shopsRouter from "./shops";
import productsRouter from "./products";

const router: IRouter = Router();

router.use(healthRouter);
router.use(shopsRouter);
router.use(productsRouter);

export default router;
