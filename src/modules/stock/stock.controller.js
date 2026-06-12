import * as stockService from "./stock.service.js";
import { stockQuerySchema } from "./stock.schema.js";

export const addStockMovement = async (req, res, next) => {
  try {
    const movement = await stockService.addStockMovement(req.body, req.user.id);
    res.status(201).json({ success: true, movement });
  } catch (err) { next(err); }
};

export const getStockMovementsByProduct = async (req, res, next) => {
  try {
    const query = stockQuerySchema.parse(req.query);
    const result = await stockService.getStockMovementsByProduct(req.params.productId, query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const getCurrentStock = async (req, res, next) => {
  try {
    const stock = await stockService.getCurrentStock(req.params.productId);
    res.json({ success: true, stock });
  } catch (err) { next(err); }
};