import * as saleService from "./sale.service.js";
import { saleQuerySchema } from "./sale.schema.js";

export const getAllSales = async (req, res, next) => {
  try {
    const query = saleQuerySchema.parse(req.query);
    const result = await saleService.getAllSales(query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const getSaleById = async (req, res, next) => {
  try {
    const sale = await saleService.getSaleById(req.params.id);
    res.json({ success: true, sale });
  } catch (err) { next(err); }
};

export const createSale = async (req, res, next) => {
  try {
    const sale = await saleService.createSale(req.body, req.user.id);
    res.status(201).json({ success: true, sale });
  } catch (err) { next(err); }
};

export const updateSale = async (req, res, next) => {
  try {
    const sale = await saleService.updateSale(req.params.id, req.body, req.user.id);
    res.json({ success: true, sale });
  } catch (err) { next(err); }
};

export const confirmSale = async (req, res, next) => {
  try {
    const sale = await saleService.confirmSale(req.params.id, req.user.id);
    res.json({ success: true, sale });
  } catch (err) { next(err); }
};

export const cancelSale = async (req, res, next) => {
  try {
    const sale = await saleService.cancelSale(req.params.id, req.user.id);
    res.json({ success: true, sale });
  } catch (err) { next(err); }
};

export const updateSalePayment = async (req, res, next) => {
  try {
    const sale = await saleService.updateSalePayment(req.params.id, req.body.paidAmount, req.user.id);
    res.json({ success: true, sale });
  } catch (err) { next(err); }
};