const Role = require("../models/roleModel");
const User = require("../models/userModel");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const checkDuplicate = require("../utils/checkDuplicate");
const buildSearchFilter = require("../utils/buildSearchFilter");
const { getPagination, paginateQuery } = require("../utils/paginate");

const PROTECTED_ROLES = ["Super Admin"]; // roles that can NEVER be deleted/renamed/deactivated

// Create Role
const createRole = asyncHandler(async (req, res) => {
  const { roleName, description, active } = req.body;

  await checkDuplicate(Role, { roleName }, "Role already exists");

  const role = await Role.create({ roleName, description, active });

  return sendResponse(res, 201, "Role created successfully", { role });
});

// Get All Roles
const getAllRoles = asyncHandler(async (req, res) => {
  const { search, active } = req.query;

  const filter = {};
  if (active !== undefined) filter.active = active === "true";

  const searchFilter = buildSearchFilter(search, ["roleName", "description"]);
  if (searchFilter) Object.assign(filter, searchFilter);

  const pagination = getPagination(req);

  const { data: roles, pagination: paginationInfo } = await paginateQuery(
    Role,
    filter,
    pagination,
    { sort: { createdAt: -1 } }
  );

  return sendResponse(res, 200, "Roles fetched successfully", { roles, pagination: paginationInfo });
});

// Get Single Role
const getRoleById = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  return sendResponse(res, 200, "Role fetched successfully", { role });
});

// Update Role
const updateRole = asyncHandler(async (req, res) => {
  const { roleName, description, active } = req.body;

  const role = await Role.findById(req.params.id);
  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  if (PROTECTED_ROLES.includes(role.roleName)) {
    if (roleName && roleName !== role.roleName) {
      throw new ApiError(403, `Cannot rename protected role "${role.roleName}"`);
    }
    if (active === false) {
      throw new ApiError(403, `Cannot deactivate protected role "${role.roleName}"`);
    }
  }

  if (roleName && roleName !== role.roleName) {
    await checkDuplicate(Role, { roleName }, "Role already exists", role._id);
    role.roleName = roleName;
  }

  if (description !== undefined) role.description = description;
  if (active !== undefined) role.active = active;

  await role.save();

  return sendResponse(res, 200, "Role updated successfully", { role });
});

// Delete Role
const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  if (PROTECTED_ROLES.includes(role.roleName)) {
    throw new ApiError(403, `"${role.roleName}" is a protected system role and cannot be deleted`);
  }

  const usersWithRole = await User.countDocuments({ role: role._id, isDeleted: false });
  if (usersWithRole > 0) {
    throw new ApiError(400, `Cannot delete role — ${usersWithRole} user(s) are currently assigned to it`);
  }

  await role.deleteOne();

  return sendResponse(res, 200, "Role deleted successfully");
});

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
};