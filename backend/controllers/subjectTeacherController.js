const SubjectTeacher = require("../models/subjectTeacherModel");

const populateFields = [
  { path: "academicYear", select: "name" },
  { path: "class", select: "className" },
  { path: "section", select: "sectionName" },
  { path: "subject", select: "subjectName" },
  { path: "teacher", select: "firstName lastName employeeId" },
];

// Create
const createSubjectTeacher = async (req, res) => {
  try {
    const { academicYear, class: classId, section, subject, teacher } = req.body;

    if (!academicYear || !classId || !section || !subject || !teacher) {
      return res.status(400).json({
        success: false,
        message: "Academic year, class, section, subject and teacher are all required",
      });
    }

    const existing = await SubjectTeacher.findOne({
      academicYear,
      class: classId,
      section,
      subject,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A teacher is already assigned for this section and subject. Edit that entry instead.",
      });
    }

    const assignment = await SubjectTeacher.create({
      academicYear,
      class: classId,
      section,
      subject,
      teacher,
    });

    const populated = await assignment.populate(populateFields);

    return res.status(201).json({
      success: true,
      message: "Teacher assigned successfully",
      subjectTeacher: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A teacher is already assigned for this section and subject.",
      });
    }

    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0]?.message;
      return res.status(400).json({
        success: false,
        message: firstError || "Invalid assignment data",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All
const getAllSubjectTeachers = async (req, res) => {
  try {
    const subjectTeachers = await SubjectTeacher.find()
      .populate(populateFields)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      subjectTeachers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single
const getSubjectTeacherById = async (req, res) => {
  try {
    const assignment = await SubjectTeacher.findById(req.params.id).populate(populateFields);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    return res.status(200).json({
      success: true,
      subjectTeacher: assignment,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update
const updateSubjectTeacher = async (req, res) => {
  try {
    const { academicYear, class: classId, section, subject, teacher } = req.body;

    const assignment = await SubjectTeacher.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const newYear = academicYear ?? assignment.academicYear;
    const newClass = classId ?? assignment.class;
    const newSection = section ?? assignment.section;
    const newSubject = subject ?? assignment.subject;

    const isChangingKey =
      String(newYear) !== String(assignment.academicYear) ||
      String(newClass) !== String(assignment.class) ||
      String(newSection) !== String(assignment.section) ||
      String(newSubject) !== String(assignment.subject);

    if (isChangingKey) {
      const existing = await SubjectTeacher.findOne({
        _id: { $ne: assignment._id },
        academicYear: newYear,
        class: newClass,
        section: newSection,
        subject: newSubject,
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "A teacher is already assigned for this section and subject.",
        });
      }
    }

    if (academicYear !== undefined) assignment.academicYear = academicYear;
    if (classId !== undefined) assignment.class = classId;
    if (section !== undefined) assignment.section = section;
    if (subject !== undefined) assignment.subject = subject;
    if (teacher !== undefined) assignment.teacher = teacher;

    await assignment.save();

    const populated = await assignment.populate(populateFields);

    return res.status(200).json({
      success: true,
      message: "Assignment updated successfully",
      subjectTeacher: populated,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A teacher is already assigned for this section and subject.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete
const deleteSubjectTeacher = async (req, res) => {
  try {
    const assignment = await SubjectTeacher.findByIdAndDelete(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assignment removed successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createSubjectTeacher,
  getAllSubjectTeachers,
  getSubjectTeacherById,
  updateSubjectTeacher,
  deleteSubjectTeacher,
};