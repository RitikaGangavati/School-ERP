const ClassTeacher = require("../models/classTeacherModel");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const checkDuplicate = require("../utils/checkDuplicate");
const { getPagination, paginateQuery } = require("../utils/paginate");

const populateFields = [
  { path: "academicYear", select: "name" },
  { path: "class", select: "className" },
  { path: "section", select: "sectionName" },
  { path: "teacher", select: "firstName lastName employeeId" },
];

const DUPLICATE_MESSAGE = "A class teacher is already assigned for this class and section.";

// Create Class Teacher
const createClassTeacher = asyncHandler(async (req, res) => {
  const { academicYear, class: classId, section, teacher, active } = req.body;

  await checkDuplicate(
    ClassTeacher,
    { academicYear, class: classId, section },
    DUPLICATE_MESSAGE
  );

  const classTeacher = await ClassTeacher.create({
    academicYear,
    class: classId,
    section,
    teacher,
    active,
  });

  const populated = await classTeacher.populate(populateFields);

  return sendResponse(res, 201, "Class teacher assigned successfully", {
    classTeacher: populated,
  });
});

// Get All Class Teachers
const getAllClassTeachers = asyncHandler(async (req, res) => {
  const { class: classId, academicYear, section } = req.query;

  const filter = {};
  if (classId) filter.class = classId;
  if (academicYear) filter.academicYear = academicYear;
  if (section) filter.section = section;

  const pagination = getPagination(req);

  const { data: classTeachers, pagination: paginationInfo } = await paginateQuery(
    ClassTeacher,
    filter,
    pagination,
    { populate: populateFields, sort: { academicYear: -1 } }
  );

  return sendResponse(res, 200, "Class teachers fetched successfully", {
    classTeachers,
    pagination: paginationInfo,
  });
});

// Get Single Class Teacher
const getClassTeacherById = asyncHandler(async (req, res) => {
  const classTeacher = await ClassTeacher.findById(req.params.id).populate(populateFields);

  if (!classTeacher) {
    throw new ApiError(404, "Class teacher not found");
  }

  return sendResponse(res, 200, "Class teacher fetched successfully", { classTeacher });
});

// Update Class Teacher
const updateClassTeacher = asyncHandler(async (req, res) => {
  const { academicYear, class: classId, section, teacher, active } = req.body;

  const classTeacher = await ClassTeacher.findById(req.params.id);
  if (!classTeacher) {
    throw new ApiError(404, "Class teacher not found");
  }

  const newAcademicYear = academicYear ?? classTeacher.academicYear;
  const newClass = classId ?? classTeacher.class;
  const newSection = section ?? classTeacher.section;

  const isChanging =
    String(newAcademicYear) !== String(classTeacher.academicYear) ||
    String(newClass) !== String(classTeacher.class) ||
    String(newSection) !== String(classTeacher.section);

  if (isChanging) {
    await checkDuplicate(
      ClassTeacher,
      { academicYear: newAcademicYear, class: newClass, section: newSection },
      DUPLICATE_MESSAGE,
      classTeacher._id
    );
  }

  if (academicYear !== undefined) classTeacher.academicYear = academicYear;
  if (classId !== undefined) classTeacher.class = classId;
  if (section !== undefined) classTeacher.section = section;
  if (teacher !== undefined) classTeacher.teacher = teacher;
  if (active !== undefined) classTeacher.active = active;

  await classTeacher.save();

  const populated = await classTeacher.populate(populateFields);

  return sendResponse(res, 200, "Class teacher updated successfully", {
    classTeacher: populated,
  });
});

// Delete Class Teacher
const deleteClassTeacher = asyncHandler(async (req, res) => {
  const classTeacher = await ClassTeacher.findByIdAndDelete(req.params.id);

  if (!classTeacher) {
    throw new ApiError(404, "Class teacher not found");
  }

  return sendResponse(res, 200, "Class teacher deleted successfully");
});

module.exports = {
  createClassTeacher,
  getAllClassTeachers,
  getClassTeacherById,
  updateClassTeacher,
  deleteClassTeacher,
};