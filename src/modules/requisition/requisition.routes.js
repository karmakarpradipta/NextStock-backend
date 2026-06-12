import { Router } from "express";
import * as requisitionController from "./requisition.controller.js";
import verifyToken from "../../middleware/verifyToken.js";
import requireRole from "../../middleware/requireRole.js";
import validate from "../../utils/validate.js";
import { createRequisitionSchema, reviewRequisitionSchema } from "./requisition.schema.js";

const router = Router();

router.use(verifyToken);

// both ADMIN and STAFF
router.get("/", requisitionController.getAllRequisitions);
router.get("/approved", requireRole("ADMIN"), requisitionController.getApprovedRequisitions);
router.get("/:id", requisitionController.getRequisitionById);
router.post("/", validate(createRequisitionSchema), requisitionController.createRequisition);
router.patch("/:id/cancel", requisitionController.cancelRequisition);

// ADMIN only
router.patch("/:id/review", requireRole("ADMIN"), validate(reviewRequisitionSchema), requisitionController.reviewRequisition);

export default router;