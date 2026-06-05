import { Router } from "express";
import * as purchaseController from "./purchase.controller.js";
import verifyToken from "../../middleware/verifyToken.js";
import requireRole from "../../middleware/requireRole.js";
import validate from "../../utils/validate.js";
import { createPurchaseSchema, updatePurchaseSchema, updatePaymentSchema } from "./purchase.schema.js";

const router = Router();

router.use(verifyToken);

router.get("/", purchaseController.getAllPurchases);
router.get("/:id", purchaseController.getPurchaseById);
router.post("/", requireRole("ADMIN"), validate(createPurchaseSchema), purchaseController.createPurchase);
router.put("/:id", requireRole("ADMIN"), validate(updatePurchaseSchema), purchaseController.updatePurchase);
router.patch("/:id/confirm", requireRole("ADMIN"), purchaseController.confirmPurchase);
router.patch("/:id/cancel", requireRole("ADMIN"), purchaseController.cancelPurchase);
router.patch("/:id/payment", requireRole("ADMIN"), validate(updatePaymentSchema), purchaseController.updatePayment);

export default router;