import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/error.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import categoryRoutes from "./modules/category/category.routes.js";
import productRoutes from "./modules/product/product.routes.js";
import vendorRoutes from "./modules/vendor/vendor.routes.js";
import purchaseRoutes from "./modules/purchase/purchase.routes.js";
import saleRoutes from "./modules/sale/sale.routes.js";
import reportsRoutes from "./modules/reports/reports.routes.js";
import stockRoutes from "./modules/stock/stock.routes.js";
import auditRoutes from "./modules/audit/audit.routes.js";
import requisitionRoutes from "./modules/requisition/requisition.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/requisitions", requisitionRoutes);

// Global error handler
app.use(errorHandler);

export default app;
