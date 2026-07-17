const Role = require("../models/roleModel");

// Add Role
const createRole = async (req, res) => {
  try {

    const { roleName, description, active } = req.body;

    if (!roleName) {
      return res.status(400).json({
        success: false,
        message: "Role Name is required",
      });
    }

    const existingRole = await Role.findOne({ roleName });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: "Role already exists",
      });
    }

    const role = await Role.create({
      roleName,
      description,
      active,
    });

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      role,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// Get All Roles
const getAllRoles = async (req, res) => {

  try {

    const roles = await Role.find().sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      roles,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// Get Single Role
const getRoleById = async (req, res) => {

  try {

    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      role,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// Update Role
const updateRole = async (req, res) => {

  try {

    const { roleName, description, active } = req.body;

    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Check duplicate
    const duplicateRole = await Role.findOne({
      roleName,
      _id: { $ne: req.params.id },
    });

    if (duplicateRole) {
      return res.status(400).json({
        success: false,
        message: "Role already exists",
      });
    }

    role.roleName = roleName;
    role.description = description;
    role.active = active;

    await role.save();

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      role,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// Delete Role
const deleteRole = async (req, res) => {

  try {

    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    await role.deleteOne();

    res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
};