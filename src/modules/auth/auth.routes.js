import { Router } from "express";
import { register, login, refresh, logout } from "./auth.controller.js";
import validate from "../../utils/validate.js";
import { registerSchema, loginSchema } from "./auth.schema.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;