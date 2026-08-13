const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check Authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. No token provided",
      });
    }

    // Get token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Invalid token",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Load current user + current role
    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("role", "roleName active");

    // User no longer exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    // User account inactive
    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    // Role not assigned
    if (!user.role) {
      return res.status(403).json({
        success: false,
        message: "No role assigned to this user",
      });
    }

    // Role inactive
    if (!user.role.active) {
      return res.status(403).json({
        success: false,
        message: "Your assigned role is inactive",
      });
    }

    // Attach user to request
    req.user = user;

    next();

  } catch (error) {

    // Token expired
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again",
      });
    }

    // Invalid JWT
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Invalid MongoDB ID
    if (error.name === "CastError") {
      return res.status(401).json({
        success: false,
        message: "Invalid user",
      });
    }

    console.error("Authentication error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

module.exports = {
  protect,
};