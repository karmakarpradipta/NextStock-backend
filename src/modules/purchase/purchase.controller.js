import * as purchaseService from "./purchase.service.js";
import { purchaseQuerySchema } from "./purchase.schema.js";

export const getAllPurchases = async (req, res, next) => {
  try {
    const query = purchaseQuerySchema.parse(req.query);
    const result = await purchaseService.getAllPurchases(query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await purchaseService.getPurchaseById(req.params.id);
    res.json({ success: true, purchase });
  } catch (err) { next(err); }
};

export const createPurchase = async (req, res, next) => {
  try {
    const purchase = await purchaseService.createPurchase(req.body, req.user.id);
    res.status(201).json({ success: true, purchase });
  } catch (err) { next(err); }
};

export const updatePurchase = async (req, res, next) => {
  try {
    const purchase = await purchaseService.updatePurchase(req.params.id, req.body, req.user.id);
    res.json({ success: true, purchase });
  } catch (err) { next(err); }
};

export const confirmPurchase = async (req, res, next) => {
  try {
    const purchase = await purchaseService.confirmPurchase(req.params.id, req.user.id);
    res.json({ success: true, purchase });
  } catch (err) { next(err); }
};

export const cancelPurchase = async (req, res, next) => {
  try {
    const purchase = await purchaseService.cancelPurchase(req.params.id, req.user.id);
    res.json({ success: true, purchase });
  } catch (err) { next(err); }
};

export const updatePayment = async (req, res, next) => {
  try {
    const purchase = await purchaseService.updatePayment(req.params.id, req.body.paidAmount, req.user.id);
    res.json({ success: true, purchase });
  } catch (err) { next(err); }
};