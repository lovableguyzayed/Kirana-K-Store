import { Router, type IRouter } from "express";
import healthRouter from "./health";
import shopsRouter from "./shops";
import productsRouter from "./products";
import ordersRouter from "./orders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(shopsRouter);
router.use(productsRouter);
router.use(ordersRouter);

export default router;
