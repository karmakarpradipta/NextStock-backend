import * as productService from "./product.service.js";
import { productQuerySchema } from "./product.schema.js";

export const getAllProducts = async (req, res, next) => {
  try {
    const query = productQuerySchema.parse(req.query);
    const result = await productService.getAllProducts(query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body, req.user.id);
    res.status(201).json({ success: true, product });
  } catch (err) { next(err); }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body, req.user.id);
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

export const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id, req.user.id);
    res.json({ success: true, message: "Product deleted" });
  } catch (err) { next(err); }
};