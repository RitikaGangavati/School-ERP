const ClassTeacher = require("../models/classTeacherModel");

const populateFields = [
  { path: "academicYear", select: "name" },
  { path: "class", select: "className" },
  { path: "section", select: "sectionName" },
  { path: "teacher", select: "firstName lastName employeeId" },
];

// Create Class Teacher
const createClassTeacher = async (req, res) => {
  try {
    const {
      academicYear,
      class: classId,
      section,
      teacher,
      active,
    } = req.body;

    if (!academicYear) {
      return res.status(400).json({
        success: false,
        message: "Academic year is required",
      });
    }

    if (!classId) {
      return res.status(400).json({
        success: false,
        message: "Class is required",
      });
    }

    if (!section) {
      return res.status(400).json({
        success: false,
        message: "Section is required",
      });
    }

    if (!teacher) {
      return res.status(400).json({
        success: false,
        message: "Teacher is required",
      });
    }

    const existing = await ClassTeacher.findOne({
      academicYear,
      class: classId,
      section,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "A class teacher is already assigned for this class and section.",
      });
    }

    const classTeacher = await ClassTeacher.create({
      academicYear,
      class: classId,
      section,
      teacher,
      active,
    });

    const populated = await classTeacher.populate(populateFields);

    return res.status(201).json({
      success: true,
      message: "Class teacher assigned successfully",
      classTeacher: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A class teacher is already assigned for this class and section.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Class Teachers
const getAllClassTeachers = async (req, res) => {
  try {
    const classTeachers = await ClassTeacher.find()
      .populate(populateFields)
      .sort({
        academicYear: -1,
      });

    return res.status(200).json({
      success: true,
      classTeachers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single Class Teacher
const getClassTeacherById = async (req, res) => {
  try {
    const classTeacher = await ClassTeacher.findById(
      req.params.id
    ).populate(populateFields);

    if (!classTeacher) {
      return res.status(404).json({
        success: false,
        message: "Class teacher not found",
      });
    }

    return res.status(200).json({
      success: true,
      classTeacher,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid class teacher ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Class Teacher
const updateClassTeacher = async (req, res) => {
  try {
    const {
      academicYear,
      class: classId,
      section,
      teacher,
      active,
    } = req.body;

    const classTeacher = await ClassTeacher.findById(req.params.id);

    if (!classTeacher) {
      return res.status(404).json({
        success: false,
        message: "Class teacher not found",
      });
    }

    const newAcademicYear = academicYear ?? classTeacher.academicYear;
    const newClass = classId ?? classTeacher.class;
    const newSection = section ?? classTeacher.section;

    const isChanging =
      String(newAcademicYear) !== String(classTeacher.academicYear) ||
      String(newClass) !== String(classTeacher.class) ||
      String(newSection) !== String(classTeacher.section);

    if (isChanging) {
      const existing = await ClassTeacher.findOne({
        _id: { $ne: classTeacher._id },
        academicYear: newAcademicYear,
        class: newClass,
        section: newSection,
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message:
            "A class teacher is already assigned for this class and section.",
        });
      }
    }

    if (academicYear !== undefined)
      classTeacher.academicYear = academicYear;

    if (classId !== undefined)
      classTeacher.class = classId;

    if (section !== undefined)
      classTeacher.section = section;

    if (teacher !== undefined)
      classTeacher.teacher = teacher;

    if (active !== undefined)
      classTeacher.active = active;

    await classTeacher.save();

    const populated = await classTeacher.populate(populateFields);

    return res.status(200).json({
      success: true,
      message: "Class teacher updated successfully",
      classTeacher: populated,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid class teacher ID",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A class teacher is already assigned for this class and section.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Class Teacher
const deleteClassTeacher = async (req, res) => {
  try {
    const classTeacher = await ClassTeacher.findByIdAndDelete(req.params.id);

    if (!classTeacher) {
      return res.status(404).json({
        success: false,
        message: "Class teacher not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Class teacher deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid class teacher ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createClassTeacher,
  getAllClassTeachers,
  getClassTeacherById,
  updateClassTeacher,
  deleteClassTeacher,
};