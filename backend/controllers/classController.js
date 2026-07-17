const Class = require("../models/classModel");

// Create Class
const createClass = async (req, res) => {
  try {
    const { className, sections, active } = req.body;

    if (!className || !className.trim()) {
      return res.status(400).json({
        success: false,
        message: "Class name is required",
      });
    }

    const existing = await Class.findOne({ className: className.trim() });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Class already exists",
      });
    }

    const newClass = await Class.create({
      className: className.trim(),
      sections: sections || [],
      active,
    });

    const populated = await newClass.populate("sections", "sectionName");

    return res.status(201).json({
      success: true,
      message: "Class created successfully",
      class: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Class already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Classes
const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("sections", "sectionName")
      .sort({ className: 1 });

    return res.status(200).json({
      success: true,
      classes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single Class
const getClassById = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id).populate(
      "sections",
      "sectionName"
    );

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    return res.status(200).json({
      success: true,
      class: classData,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Class
const updateClass = async (req, res) => {
  try {
    const { className, sections, active } = req.body;

    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    if (className && className.trim() !== classData.className) {
      const existing = await Class.findOne({
        className: className.trim(),
        _id: { $ne: classData._id },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Class name already in use",
        });
      }

      classData.className = className.trim();
    }

    if (sections !== undefined) classData.sections = sections;
    if (active !== undefined) classData.active = active;

    await classData.save();

    const populated = await classData.populate("sections", "sectionName");

    return res.status(200).json({
      success: true,
      message: "Class updated successfully",
      class: populated,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Class already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Class
const deleteClass = async (req, res) => {
  try {
    const classData = await Class.findByIdAndDelete(req.params.id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
};