import { Router } from "express";
import * as saleController from "./sale.controller.js";
import verifyToken from "../../middleware/verifyToken.js";
import requireRole from "../../middleware/requireRole.js";
import validate from "../../utils/validate.js";
import { createSaleSchema, updateSaleSchema, updateSalePaymentSchema } from "./sale.schema.js";

const router = Router();

router.use(verifyToken);

router.get("/", saleController.getAllSales);
router.get("/:id", saleController.getSaleById);
router.post("/", requireRole("ADMIN"), validate(createSaleSchema), saleController.createSale);
router.put("/:id", requireRole("ADMIN"), validate(updateSaleSchema), saleController.updateSale);
router.patch("/:id/confirm", requireRole("ADMIN"), saleController.confirmSale);
router.patch("/:id/cancel", requireRole("ADMIN"), saleController.cancelSale);
router.patch("/:id/payment", requireRole("ADMIN"), validate(updateSalePaymentSchema), saleController.updateSalePayment);

export default router;