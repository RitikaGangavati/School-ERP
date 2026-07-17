const AcademicYear = require("../models/academicYearModel");

// Create Academic Year
const createAcademicYear = async (req, res) => {
  try {
    const { name, startDate, endDate, isCurrent, active } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Name, start date, and end date are required",
      });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Start date must be before end date",
      });
    }

    const existing = await AcademicYear.findOne({ name: name.trim() });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Academic year already exists",
      });
    }

    // If this one is marked current, unset any other current year first
    if (isCurrent) {
      await AcademicYear.updateMany({}, { isCurrent: false });
    }

    const academicYear = await AcademicYear.create({
      name: name.trim(),
      startDate,
      endDate,
      isCurrent: !!isCurrent,
      active 
    });

    return res.status(201).json({
      success: true,
      message: "Academic year created successfully",
      academicYear,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Academic Years
const getAllAcademicYears = async (req, res) => {
  try {
    const academicYears = await AcademicYear.find().sort({ startDate: -1 });

    return res.status(200).json({
      success: true,
      academicYears,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single Academic Year
const getAcademicYearById = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findById(req.params.id);

    if (!academicYear) {
      return res.status(404).json({
        success: false,
        message: "Academic year not found",
      });
    }

    return res.status(200).json({
      success: true,
      academicYear,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid academic year ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Academic Year
const updateAcademicYear = async (req, res) => {
  try {
    const { name, startDate, endDate, isCurrent, active } = req.body;

    const academicYear = await AcademicYear.findById(req.params.id);

    if (!academicYear) {
      return res.status(404).json({
        success: false,
        message: "Academic year not found",
      });
    }

    if (name && name.trim() !== academicYear.name) {
      const existing = await AcademicYear.findOne({ name: name.trim() });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Academic year name already in use",
        });
      }

      academicYear.name = name.trim();
    }

    const newStart = startDate ? new Date(startDate) : academicYear.startDate;
    const newEnd = endDate ? new Date(endDate) : academicYear.endDate;

    if (newStart >= newEnd) {
      return res.status(400).json({
        success: false,
        message: "Start date must be before end date",
      });
    }

    if (startDate !== undefined) academicYear.startDate = startDate;
    if (endDate !== undefined) academicYear.endDate = endDate;
    if (active !== undefined) academicYear.active = active;

    // If marking this one current, unset all others first
    if (isCurrent) {
      await AcademicYear.updateMany(
        { _id: { $ne: academicYear._id } },
        { isCurrent: false }
      );
      academicYear.isCurrent = true;
    } else if (isCurrent === false) {
      academicYear.isCurrent = false;
    }

    await academicYear.save();

    return res.status(200).json({
      success: true,
      message: "Academic year updated successfully",
      academicYear,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid academic year ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Academic Year
const deleteAcademicYear = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findByIdAndDelete(req.params.id);

    if (!academicYear) {
      return res.status(404).json({
        success: false,
        message: "Academic year not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Academic year deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid academic year ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createAcademicYear,
  getAllAcademicYears,
  getAcademicYearById,
  updateAcademicYear,
  deleteAcademicYear,
};