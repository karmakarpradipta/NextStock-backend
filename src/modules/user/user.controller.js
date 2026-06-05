import * as userService from "./user.service.js";

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers(req.user.id);
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};
export const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await userService.toggleUserStatus(req.params.id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

export const resetUserPassword = async (req, res, next) => {
  try {
    await userService.resetUserPassword(req.params.id, req.body.newPassword);
    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    next(err);
  }
};