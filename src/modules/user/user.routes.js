import { Router } from "express";
import * as userController from "./user.controller.js";
import verifyToken from "../../middleware/verifyToken.js";
import requireRole from "../../middleware/requireRole.js";
import validate from "../../utils/validate.js";
import { createUserSchema, updateUserSchema, resetPasswordSchema } from "./user.schema.js";

const router = Router();

// All routes — authenticated + ADMIN only
router.use(verifyToken, requireRole("ADMIN"));

router.get("/", userController.getAllUsers);
router.post("/", validate(createUserSchema), userController.createUser);
router.put("/:id", validate(updateUserSchema), userController.updateUser);
router.patch("/:id/toggle-status", userController.toggleUserStatus);
router.patch("/:id/reset-password", validate(resetPasswordSchema), userController.resetUserPassword);

export default router;