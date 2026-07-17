const Section = require("../models/sectionModel");

// Create Section
const createSection = async (req, res) => {
  try {
    const { sectionName, active } = req.body;

    if (!sectionName || !sectionName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Section name is required",
      });
    }

    const existing = await Section.findOne({
      sectionName: sectionName.trim().toUpperCase(),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Section already exists",
      });
    }

    const section = await Section.create({
      sectionName: sectionName.trim(),
      active
    });

    return res.status(201).json({
      success: true,
      message: "Section created successfully",
      section,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Section already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Sections
const getAllSections = async (req, res) => {
  try {
    const sections = await Section.find().sort({ sectionName: 1 });

    return res.status(200).json({
      success: true,
      sections,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single Section
const getSectionById = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    return res.status(200).json({
      success: true,
      section,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid section ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Section
const updateSection = async (req, res) => {
  try {
    const { sectionName, active } = req.body;

    const section = await Section.findById(req.params.id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    if (sectionName && sectionName.trim().toUpperCase() !== section.sectionName) {
      const existing = await Section.findOne({
        sectionName: sectionName.trim().toUpperCase(),
        _id: { $ne: section._id },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Section name already in use",
        });
      }

      section.sectionName = sectionName.trim();
    }

    if (active !== undefined) section.active = active;

    await section.save();

    return res.status(200).json({
      success: true,
      message: "Section updated successfully",
      section,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid section ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Section
const deleteSection = async (req, res) => {
  try {
    const section = await Section.findByIdAndDelete(req.params.id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid section ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createSection,
  getAllSections,
  getSectionById,
  updateSection,
  deleteSection,
};