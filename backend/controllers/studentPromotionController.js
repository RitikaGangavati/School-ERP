const Student = require("../models/studentModel");
const StudentPromotion = require("../models/studentPromotionModel");
const AcademicYear = require("../models/academicYearModel");
const Class = require("../models/classModel");
const Section = require("../models/sectionModel");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const { getPagination, paginateQuery } = require("../utils/paginate");

// Get students matching the current class/section/year — used to populate the promotion list
const getStudentsForPromotion = asyncHandler(async (req, res) => {
  const { academicYear, class: classId, section } = req.query;

  const students = await Student.find({
    "academic.academicYear": academicYear,
    "academic.class": classId,
    "academic.section": section,
    "academic.status": "Active",
  })
    .select("personal.firstName personal.lastName academic.admissionNumber academic.rollNo")
    .sort({ "academic.rollNo": 1 });

  return sendResponse(res, 200, "Students fetched successfully", {
    count: students.length,
    students,
  });
});

// Bulk-promote selected students, logging a history entry for each one
const promoteStudents = asyncHandler(async (req, res) => {
  const {
    studentIds,
    fromAcademicYear,
    fromClass,
    fromSection,
    promoteToAcademicYear,
    promoteToClass,
    promoteToSection,
  } = req.body;

  if (
    fromAcademicYear === promoteToAcademicYear &&
    fromClass === promoteToClass &&
    fromSection === promoteToSection
  ) {
    throw new ApiError(400, "Promote-to must be different from the current class/section/year");
  }

  const [yearExists, classExists, sectionExists] = await Promise.all([
    AcademicYear.exists({ _id: promoteToAcademicYear }),
    Class.exists({ _id: promoteToClass }),
    Section.exists({ _id: promoteToSection }),
  ]);

  if (!yearExists) throw new ApiError(404, "Promote-to academic year not found");
  if (!classExists) throw new ApiError(404, "Promote-to class not found");
  if (!sectionExists) throw new ApiError(404, "Promote-to section not found");

  const uniqueIds = [...new Set(studentIds)];

  // Students must REALLY be Active in the stated "from" year/class/section
  const fromFilter = {
    "academic.academicYear": fromAcademicYear,
    "academic.class": fromClass,
    "academic.section": fromSection,
    "academic.status": "Active",
  };

  const eligible = await Student.find({ _id: { $in: uniqueIds }, ...fromFilter })
    .select("_id")
    .lean();

  if (eligible.length !== uniqueIds.length) {
    throw new ApiError(
      400,
      `${uniqueIds.length - eligible.length} selected student(s) are not active in the selected class/section/year (already promoted?) — nothing was promoted`
    );
  }

  // One timestamp for the whole batch, so a failed batch can be undone precisely
  const batchTime = new Date();

  const historyEntries = uniqueIds.map((studentId) => ({
    student: studentId,
    fromAcademicYear,
    fromClass,
    fromSection,
    toAcademicYear: promoteToAcademicYear,
    toClass: promoteToClass,
    toSection: promoteToSection,
    promotedOn: batchTime,
    promotedBy: req.user?._id || null,
  }));

  try {
    await StudentPromotion.insertMany(historyEntries);

    // The same "from" filter again: a student who changed in the meantime is skipped
    await Student.updateMany(
      { _id: { $in: uniqueIds }, ...fromFilter },
      {
        $set: {
          "academic.academicYear": promoteToAcademicYear,
          "academic.class": promoteToClass,
          "academic.section": promoteToSection,
        },
      }
    );
  } catch (err) {
    // Undo: remove this batch's history, and move back any student already moved
    try {
      await StudentPromotion.deleteMany({ student: { $in: uniqueIds }, promotedOn: batchTime });
      await Student.updateMany(
        {
          _id: { $in: uniqueIds },
          "academic.academicYear": promoteToAcademicYear,
          "academic.class": promoteToClass,
          "academic.section": promoteToSection,
        },
        {
          $set: {
            "academic.academicYear": fromAcademicYear,
            "academic.class": fromClass,
            "academic.section": fromSection,
          },
        }
      );
    } catch (undoErr) {
      console.error("Promotion rollback failed:", undoErr.message);
    }
    throw err;
  }

  return sendResponse(res, 200, `${uniqueIds.length} student(s) promoted successfully`, {
    promotedCount: uniqueIds.length,
  });
});

// Get one student's full promotion history
const getStudentPromotionHistory = asyncHandler(async (req, res) => {
  const pagination = getPagination(req);

  const { data: history, pagination: paginationInfo } = await paginateQuery(
    StudentPromotion,
    { student: req.params.studentId },
    pagination,
    {
      populate: [
        { path: "fromAcademicYear", select: "name" },
        { path: "fromClass", select: "className" },
        { path: "fromSection", select: "sectionName" },
        { path: "toAcademicYear", select: "name" },
        { path: "toClass", select: "className" },
        { path: "toSection", select: "sectionName" },
      ],
      sort: { promotedOn: -1 },
    }
  );

  return sendResponse(res, 200, "Promotion history fetched successfully", {
    history,
    pagination: paginationInfo,
  });
});

// Get all promotions across all students
const getAllPromotions = asyncHandler(async (req, res) => {
  const { academicYear, class: classId } = req.query;

  const filter = {};
  if (academicYear) filter.toAcademicYear = academicYear;
  if (classId) filter.toClass = classId;

  const pagination = getPagination(req);

  const { data: promotions, pagination: paginationInfo } = await paginateQuery(
    StudentPromotion,
    filter,
    pagination,
    {
      populate: [
        { path: "student", select: "personal.firstName personal.lastName academic.admissionNumber" },
        { path: "fromAcademicYear", select: "name" },
        { path: "fromClass", select: "className" },
        { path: "fromSection", select: "sectionName" },
        { path: "toAcademicYear", select: "name" },
        { path: "toClass", select: "className" },
        { path: "toSection", select: "sectionName" },
      ],
      sort: { promotedOn: -1 },
    }
  );

  return sendResponse(res, 200, "Promotions fetched successfully", {
    promotions,
    pagination: paginationInfo,
  });
});

module.exports = {
  getStudentsForPromotion,
  promoteStudents,
  getStudentPromotionHistory,
  getAllPromotions,
};