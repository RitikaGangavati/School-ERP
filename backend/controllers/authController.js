const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  COOKIE_NAME, baseCookie, refreshCookieOptions,
  signAccessToken, signRefreshToken, hashToken, newRefreshEntry,
} = require("../utils/tokens");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");

// Register User
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, mobile, profile, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "Email already exists");
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    mobile,
    profile,
    role,
  });

  const userData = user.toObject();
  delete userData.password;

  return sendResponse(res, 201, "User registered successfully", { user: userData });
});

// Saves a new refresh token for the user (drops expired ones, keeps the latest 5)
const storeRefreshToken = async (userId, token) => {
  await User.updateOne(
    { _id: userId },
    { $pull: { refreshTokens: { expiresAt: { $lt: new Date() } } } }
  );
  await User.updateOne(
    { _id: userId },
    { $push: { refreshTokens: { $each: [newRefreshEntry(token)], $slice: -5 } } }
  );
};

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).populate("role", "roleName active");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  // isDeleted check — new
  if (user.isDeleted) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.active) {
    throw new ApiError(403, "Your account is inactive. Please contact administrator.");
  }

  if (!user.role || !user.role.active) {
    throw new ApiError(403, "Your assigned role is inactive. Please contact administrator.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

    const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await storeRefreshToken(user._id, refreshToken);

  res.cookie(COOKIE_NAME, refreshToken, refreshCookieOptions);

  const userData = user.toObject();
  delete userData.password;

  return sendResponse(res, 200, "Login successful", { token: accessToken, user: userData });
});

const clearRefreshCookie = (res) => res.clearCookie(COOKIE_NAME, baseCookie);

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw new ApiError(401, "Not authenticated");

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    clearRefreshCookie(res);
    throw new ApiError(401, "Session expired. Please log in again");
  }

  const user = await User.findById(decoded.id).populate("role", "roleName active");
  if (!user || user.isDeleted || !user.active || !user.role || !user.role.active) {
    clearRefreshCookie(res);
    throw new ApiError(401, "Session expired. Please log in again");
  }

  // Atomically remove the used token. If it wasn't there, it was already used
  // (rotated or logged out): treat it as theft and revoke every session.
  const tokenHash = hashToken(token);
  const result = await User.updateOne(
    { _id: user._id, "refreshTokens.tokenHash": tokenHash },
    { $pull: { refreshTokens: { tokenHash } } }
  );
  if (result.modifiedCount === 0) {
    await User.updateOne({ _id: user._id }, { $set: { refreshTokens: [] } });
    clearRefreshCookie(res);
    throw new ApiError(401, "Session expired. Please log in again");
  }

  const accessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);
  await storeRefreshToken(user._id, newRefreshToken);
  res.cookie(COOKIE_NAME, newRefreshToken, refreshCookieOptions);

  const userData = user.toObject();
  delete userData.password;

  return sendResponse(res, 200, "Token refreshed", { token: accessToken, user: userData });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    const decoded = jwt.decode(token); // no verify: logout should work even if expired
    if (decoded?.id) {
      const tokenHash = hashToken(token);
      await User.updateOne({ _id: decoded.id }, { $pull: { refreshTokens: { tokenHash } } });
    }
  }
  clearRefreshCookie(res);
  return sendResponse(res, 200, "Logged out");
});

module.exports = { register, login, refresh, logout };