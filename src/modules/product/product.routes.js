import { Router } from "express";
import * as productController from "./product.controller.js";
import verifyToken from "../../middleware/verifyToken.js";
import requireRole from "../../middleware/requireRole.js";
import validate from "../../utils/validate.js";
import { createProductSchema, updateProductSchema } from "./product.schema.js";

const router = Router();

router.use(verifyToken);

router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.post("/", requireRole("ADMIN"), validate(createProductSchema), productController.createProduct);
router.put("/:id", requireRole("ADMIN"), validate(updateProductSchema), productController.updateProduct);
router.delete("/:id", requireRole("ADMIN"), productController.deleteProduct);

export default router;