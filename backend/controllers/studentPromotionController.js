const Student = require("../models/studentModel");
const StudentPromotion = require("../models/studentPromotionModel");

// Get students matching the current class/section/year — used to populate the promotion list
const getStudentsForPromotion = async (req, res) => {
  try {
    const { academicYear, class: classId, section } = req.query;

    if (!academicYear || !classId || !section) {
      return res.status(400).json({
        success: false,
        message: "Academic year, class, and section are required",
      });
    }

    const students = await Student.find({
      "academic.academicYear": academicYear,
      "academic.class": classId,
      "academic.section": section,
      "academic.status": "Active",
    })
      .select(
        "personal.firstName personal.lastName academic.admissionNumber academic.rollNo",
      )
      .sort({ "academic.rollNo": 1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk-promote selected students, logging a history entry for each one
const promoteStudents = async (req, res) => {
  try {
    const {
      studentIds,
      fromAcademicYear,
      fromClass,
      fromSection,
      promoteToAcademicYear,
      promoteToClass,
      promoteToSection,
    } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No students selected" });
    }

    if (!promoteToAcademicYear || !promoteToClass || !promoteToSection) {
      return res.status(400).json({
        success: false,
        message: "Promote-to academic year, class, and section are required",
      });
    }

    const historyEntries = studentIds.map((studentId) => ({
      student: studentId,
      fromAcademicYear,
      fromClass,
      fromSection,
      toAcademicYear: promoteToAcademicYear,
      toClass: promoteToClass,
      toSection: promoteToSection,
      promotedBy: req.user?._id || null,
    }));

    await StudentPromotion.insertMany(historyEntries);

    const result = await Student.updateMany(
      { _id: { $in: studentIds } },
      {
        $set: {
          "academic.academicYear": promoteToAcademicYear,
          "academic.class": promoteToClass,
          "academic.section": promoteToSection,
          "academic.status": "Active",
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: `${result.modifiedCount} student(s) promoted successfully`,
      promotedCount: result.modifiedCount,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get one student's full promotion history
const getStudentPromotionHistory = async (req, res) => {
  try {
    const history = await StudentPromotion.find({
      student: req.params.studentId,
    })
      .populate("fromAcademicYear", "name")
      .populate("fromClass", "className")
      .populate("fromSection", "sectionName")
      .populate("toAcademicYear", "name")
      .populate("toClass", "className")
      .populate("toSection", "sectionName")
      .sort({ promotedOn: -1 });

    return res.status(200).json({ success: true, history });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
const getAllPromotions = async (req, res) => {
  try {
    const promotions = await StudentPromotion.find()
      .populate(
        "student",
        "personal.firstName personal.lastName academic.admissionNumber",
      )
      .populate("fromAcademicYear", "name")
      .populate("fromClass", "className")
      .populate("fromSection", "sectionName")
      .populate("toAcademicYear", "name")
      .populate("toClass", "className")
      .populate("toSection", "sectionName")
      .sort({ promotedOn: -1 });

    return res.status(200).json({
      success: true,
      count: promotions.length,
      promotions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getStudentsForPromotion,
  promoteStudents,
  getStudentPromotionHistory,
  getAllPromotions,
};
