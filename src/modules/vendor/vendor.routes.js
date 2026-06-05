import { Router } from "express";
import * as vendorController from "./vendor.controller.js";
import verifyToken from "../../middleware/verifyToken.js";
import requireRole from "../../middleware/requireRole.js";
import validate from "../../utils/validate.js";
import { createVendorSchema, updateVendorSchema, mapProductsSchema } from "./vendor.schema.js";

const router = Router();

router.use(verifyToken);

router.get("/", vendorController.getAllVendors);
router.get("/:id", vendorController.getVendorById);
router.post("/", requireRole("ADMIN"), validate(createVendorSchema), vendorController.createVendor);
router.put("/:id", requireRole("ADMIN"), validate(updateVendorSchema), vendorController.updateVendor);
router.delete("/:id", requireRole("ADMIN"), vendorController.deleteVendor);
router.post("/:id/products", requireRole("ADMIN"), validate(mapProductsSchema), vendorController.mapProducts);
router.delete("/:id/products/:productId", requireRole("ADMIN"), vendorController.unmapProduct);

export default router;