import { Router } from "express";
import * as reportsController from "./reports.controller.js";
import verifyToken from "../../middleware/verifyToken.js";

const router = Router();

router.use(verifyToken);

router.get("/dashboard", reportsController.getDashboardSummary);
router.get("/low-stock", reportsController.getLowStockReport);
router.get("/stock-summary", reportsController.getStockSummary);
router.get("/stock-daily", reportsController.getDailyStockReport);
router.get("/stock-monthly", reportsController.getMonthlyStockReport);
router.get("/purchases", reportsController.getPurchaseReport);
router.get("/sales", reportsController.getSalesReport);
router.get("/purchase-vs-sales", reportsController.getPurchaseVsSalesReport);
router.get("/vendor-purchases", reportsController.getVendorPurchaseReport);
router.get("/profit", reportsController.getProfitReport);
router.get("/ledger", reportsController.getLedgerReport);
router.get("/top-selling", reportsController.getTopSellingProducts);

export default router;