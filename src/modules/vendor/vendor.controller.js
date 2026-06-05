import * as vendorService from "./vendor.service.js";
import { vendorQuerySchema } from "./vendor.schema.js";

export const getAllVendors = async (req, res, next) => {
  try {
    const query = vendorQuerySchema.parse(req.query);
    const result = await vendorService.getAllVendors(query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const getVendorById = async (req, res, next) => {
  try {
    const vendor = await vendorService.getVendorById(req.params.id);
    res.json({ success: true, vendor });
  } catch (err) { next(err); }
};

export const createVendor = async (req, res, next) => {
  try {
    const vendor = await vendorService.createVendor(req.body);
    res.status(201).json({ success: true, vendor });
  } catch (err) { next(err); }
};

export const updateVendor = async (req, res, next) => {
  try {
    const vendor = await vendorService.updateVendor(req.params.id, req.body);
    res.json({ success: true, vendor });
  } catch (err) { next(err); }
};

export const deleteVendor = async (req, res, next) => {
  try {
    await vendorService.deleteVendor(req.params.id);
    res.json({ success: true, message: "Vendor deleted" });
  } catch (err) { next(err); }
};

export const mapProducts = async (req, res, next) => {
  try {
    const products = await vendorService.mapProductsToVendor(req.params.id, req.body.productIds);
    res.json({ success: true, products });
  } catch (err) { next(err); }
};

export const unmapProduct = async (req, res, next) => {
  try {
    await vendorService.unmapProductFromVendor(req.params.id, req.params.productId);
    res.json({ success: true, message: "Product removed from vendor" });
  } catch (err) { next(err); }
};