const express = require("express");
const { rateLimit } = require("express-rate-limit");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const { validate } = require("../middleware/validationMiddleware");
const { loginSchema, registerSchema } = require("../validators/authValidator");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8", // RateLimit-* headers so the frontend can read them
  legacyHeaders: false, // no X-RateLimit-* headers
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many login attempts. Please try again after 15 minutes.",
    });
  },
});

router.post("/register", validate(registerSchema, "body"), register);
router.post("/login", loginLimiter, validate(loginSchema, "body"), login);

module.exports = router;
