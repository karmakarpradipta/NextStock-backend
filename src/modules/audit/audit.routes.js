import { Router } from "express";
import * as auditController from "./audit.controller.js";
import verifyToken from "../../middleware/verifyToken.js";
import requireRole from "../../middleware/requireRole.js";

const router = Router();

router.use(verifyToken, requireRole("ADMIN"));

router.get("/", auditController.getAuditLogs);
router.get("/user/:userId", auditController.getAuditLogsByUser);

export default router;