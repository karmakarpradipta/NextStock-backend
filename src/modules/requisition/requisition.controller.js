import * as requisitionService from "./requisition.service.js";
import { requisitionQuerySchema } from "./requisition.schema.js";

export const getAllRequisitions = async (req, res, next) => {
  try {
    const query = requisitionQuerySchema.parse(req.query);
    const result = await requisitionService.getAllRequisitions(query, req.user);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const getRequisitionById = async (req, res, next) => {
  try {
    const requisition = await requisitionService.getRequisitionById(req.params.id, req.user);
    res.json({ success: true, requisition });
  } catch (err) { next(err); }
};

export const createRequisition = async (req, res, next) => {
  try {
    const requisition = await requisitionService.createRequisition(req.body, req.user.id);
    res.status(201).json({ success: true, requisition });
  } catch (err) { next(err); }
};

export const reviewRequisition = async (req, res, next) => {
  try {
    const requisition = await requisitionService.reviewRequisition(
      req.params.id,
      req.body,
      req.user.id
    );
    res.json({ success: true, requisition });
  } catch (err) { next(err); }
};

export const cancelRequisition = async (req, res, next) => {
  try {
    await requisitionService.cancelRequisition(req.params.id, req.user.id, req.user.role);
    res.json({ success: true, message: "Requisition cancelled" });
  } catch (err) { next(err); }
};

export const getApprovedRequisitions = async (req, res, next) => {
  try {
    const requisitions = await requisitionService.getApprovedRequisitions();
    res.json({ success: true, requisitions });
  } catch (err) { next(err); }
};