import * as auditService from "./audit.service.js";

export const getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, action, entity, userId, from, to } = req.query;
    const result = await auditService.getAuditLogs({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      action,
      entity,
      userId,
      from,
      to,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const getAuditLogsByUser = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await auditService.getAuditLogsByUser(req.params.userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};