const Subject = require("../models/subjectModel");

// Create Subject
const createSubject = async (req, res) => {
  try {
    const { subjectName, subjectCode, subjectType, active } = req.body;

    if (!subjectName || !subjectName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject name is required",
      });
    }

    const existing = await Subject.findOne({ subjectName: subjectName.trim() });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Subject already exists",
      });
    }

    const subject = await Subject.create({
      subjectName: subjectName.trim(),
      subjectCode,
      subjectType,
      active,
    });

    return res.status(201).json({
      success: true,
      message: "Subject created successfully",
      subject,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Subject already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Subjects
const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ subjectName: 1 });

    return res.status(200).json({
      success: true,
      subjects,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single Subject
const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    return res.status(200).json({
      success: true,
      subject,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Subject
const updateSubject = async (req, res) => {
  try {
    const { subjectName, subjectCode, subjectType, active } = req.body;

    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    if (subjectName && subjectName.trim() !== subject.subjectName) {
      const existing = await Subject.findOne({
        subjectName: subjectName.trim(),
        _id: { $ne: subject._id },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Subject name already in use",
        });
      }

      subject.subjectName = subjectName.trim();
    }

    if (subjectCode !== undefined) subject.subjectCode = subjectCode;
    if (subjectType !== undefined) subject.subjectType = subjectType;
    if (active !== undefined) subject.active = active;

    await subject.save();

    return res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      subject,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Subject
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
};