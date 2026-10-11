const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const ACCESS_EXPIRES = "15m";
const REFRESH_DAYS = 7;
const COOKIE_NAME = "refreshToken";
const isProd = process.env.NODE_ENV === "production";

const signAccessToken = (user) =>
  jwt.sign(
    { id: user._id, roleId: user.role._id || user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );

// jti makes every refresh token unique, even if issued in the same second
const signRefreshToken = (user) =>
  jwt.sign(
    { id: user._id, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: `${REFRESH_DAYS}d` }
  );

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const baseCookie = {
  httpOnly: true,
  secure: isProd,
  // Different domains in production (e.g. Vercel + Render) need "none" + secure.
  // Locally, localhost:5173 -> localhost:5000 is same-site, so "lax" works.
  sameSite: isProd ? "none" : "lax",
  path: "/api/auth",
};

const refreshCookieOptions = {
  ...baseCookie,
  maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
};

const newRefreshEntry = (token) => ({
  tokenHash: hashToken(token),
  expiresAt: new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000),
});

module.exports = {
  COOKIE_NAME,
  baseCookie,
  refreshCookieOptions,
  signAccessToken,
  signRefreshToken,
  hashToken,
  newRefreshEntry,
};