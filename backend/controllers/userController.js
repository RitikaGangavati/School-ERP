const User = require("../models/userModel");
const Role = require("../models/roleModel");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const checkDuplicate = require("../utils/checkDuplicate");
const buildSearchFilter = require("../utils/buildSearchFilter");
const { getPagination, paginateQuery } = require("../utils/paginate");

// Create User
const createUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, mobile, role, active } =
    req.body;

  await checkDuplicate(User, { email }, "Email already exists");

  const roleData = await Role.findById(role);
  if (!roleData) {
    throw new ApiError(404, "Role not found");
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    mobile,
    role: roleData._id,
    active,
  });

  const userData = user.toObject();
  delete userData.password;

  return sendResponse(res, 201, "User created successfully", {
    user: userData,
  });
});

// Get All Users
const getAllUsers = asyncHandler(async (req, res) => {
  const { search, role } = req.query;

  const filter = { isDeleted: false };
  if (role) filter.role = role;

  const searchFilter = buildSearchFilter(search, [
    "firstName",
    "lastName",
    "email",
  ]);
  if (searchFilter) Object.assign(filter, searchFilter);

  const pagination = getPagination(req);

  const { data: users, pagination: paginationInfo } = await paginateQuery(
    User,
    filter,
    pagination,
    {
      populate: { path: "role", select: "roleName" },
      sort: { createdAt: -1 },
      select: "-password",
    },
  );

  return sendResponse(res, 200, "Users fetched successfully", {
    users,
    pagination: paginationInfo,
  });
});

// Get Single User
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, isDeleted: false })
    .populate("role", "roleName")
    .select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return sendResponse(res, 200, "User fetched successfully", { user });
});

// Update User
const updateUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, mobile, role, active } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (email && email !== user.email) {
    await checkDuplicate(User, { email }, "Email already in use", user._id);
    user.email = email;
  }

  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (mobile !== undefined) user.mobile = mobile;

  if (role !== undefined) {
    const roleData = await Role.findById(role);
    if (!roleData) {
      throw new ApiError(404, "Role not found");
    }
    user.role = roleData._id;
  }

  if (active !== undefined) user.active = active;

  await user.save();

  const userData = user.toObject();
  delete userData.password;

  return sendResponse(res, 200, "User updated successfully", {
    user: userData,
  });
});

// Soft Delete User (default — recoverable)
const softDeleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isDeleted) {
    throw new ApiError(400, "User is already deleted");
  }

  user.isDeleted = true;
  user.deletedAt = new Date();
  user.active = false;
  await user.save();

  return sendResponse(res, 200, "User deleted successfully");
});

// Restore a soft-deleted user
const restoreUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.isDeleted) {
    throw new ApiError(400, "User is not deleted");
  }

  user.isDeleted = false;
  user.deletedAt = null;
  user.active = true;
  await user.save();

  const userData = user.toObject();
  delete userData.password;

  return sendResponse(res, 200, "User restored successfully", {
    user: userData,
  });
});

// Permanent Delete (Super Admin only — irreversible)
const permanentDeleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.isDeleted) {
    throw new ApiError(
      400,
      "User must be soft-deleted before permanent deletion",
    );
  }

  await User.findByIdAndDelete(req.params.id);

  return sendResponse(res, 200, "User permanently deleted");
});

// Get Soft Deleted Users
const getDeletedUsers = asyncHandler(async (req, res) => {
  const pagination = getPagination(req);

  const { data: users, pagination: paginationInfo } = await paginateQuery(
    User,
    { isDeleted: true },
    pagination,
    {
      populate: { path: "role", select: "roleName" },
      sort: { deletedAt: -1 },
      select: "-password",
    },
  );

  return sendResponse(res, 200, "Deleted users fetched successfully", {
    users,
    pagination: paginationInfo,
  });
});

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  softDeleteUser,
  restoreUser,
  permanentDeleteUser,
  getDeletedUsers,
};
