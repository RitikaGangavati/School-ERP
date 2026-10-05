const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

  const token = jwt.sign(
    { id: user._id, roleId: user.role._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  const userData = user.toObject();
  delete userData.password;

  return sendResponse(res, 200, "Login successful", { token, user: userData });
});

module.exports = { register, login };