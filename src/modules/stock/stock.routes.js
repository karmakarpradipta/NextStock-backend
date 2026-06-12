import { Router } from "express";
import * as stockController from "./stock.controller.js";
import verifyToken from "../../middleware/verifyToken.js";
import requireRole from "../../middleware/requireRole.js";
import validate from "../../utils/validate.js";
import { createMovementSchema } from "./stock.schema.js";

const router = Router();

router.use(verifyToken);

router.post("/", requireRole("ADMIN"), validate(createMovementSchema), stockController.addStockMovement);
router.get("/:productId", stockController.getStockMovementsByProduct);
router.get("/:productId/current", stockController.getCurrentStock);

export default router;