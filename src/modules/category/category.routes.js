import { Router } from "express";
import * as categoryController from "./category.controller.js";
import verifyToken from "../../middleware/verifyToken.js";
import requireRole from "../../middleware/requireRole.js";
import validate from "../../utils/validate.js";
import { createCategorySchema, updateCategorySchema } from "./category.schema.js";

const router = Router();

router.use(verifyToken);

router.get("/", categoryController.getAllCategories);                                                      // ADMIN + STAFF
router.post("/", requireRole("ADMIN"), validate(createCategorySchema), categoryController.createCategory);
router.put("/:id", requireRole("ADMIN"), validate(updateCategorySchema), categoryController.updateCategory);
router.delete("/:id", requireRole("ADMIN"), categoryController.deleteCategory);

export default router;