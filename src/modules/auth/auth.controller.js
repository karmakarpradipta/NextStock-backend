import * as authService from "./auth.service.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.loginUser(
      req.body,
    );
    res.cookie("refreshToken", refreshToken, cookieOptions);
    res.json({ success: true, accessToken, user });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    const { accessToken } = await authService.refreshAccessToken(token);
    res.json({ success: true, accessToken });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    await authService.logoutUser(token);
    res.clearCookie("refreshToken");
    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    next(err);
  }
};
