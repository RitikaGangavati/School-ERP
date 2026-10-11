const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Invalid token",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("role", "roleName active");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    // isDeleted check — new
    if (user.isDeleted) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    if (!user.role) {
      return res.status(403).json({
        success: false,
        message: "No role assigned to this user",
      });
    }

    if (!user.role.active) {
      return res.status(403).json({
        success: false,
        message: "Your assigned role is inactive",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        code: "TOKEN_EXPIRED",
        message: "Session expired. Please log in again",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    if (error.name === "CastError") {
      return res.status(401).json({ success: false, message: "Invalid user" });
    }

    console.error("Authentication error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Authentication failed" });
  }
};

module.exports = { protect };
