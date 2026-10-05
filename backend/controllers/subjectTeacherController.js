const SubjectTeacher = require("../models/subjectTeacherModel");
const SubjectGroup = require("../models/subjectGroupModel");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const checkDuplicate = require("../utils/checkDuplicate");
const { getPagination, paginateQuery } = require("../utils/paginate");

const populateFields = [
  { path: "academicYear", select: "name" },
  { path: "class", select: "className" },
  { path: "section", select: "sectionName" },
  { path: "subject", select: "subjectName" },
  { path: "teacher", select: "firstName lastName employeeId" },
];

const DUPLICATE_MESSAGE =
  "A teacher is already assigned for this section and subject. Edit that entry instead.";

// Create
const createSubjectTeacher = asyncHandler(async (req, res) => {
  const { academicYear, class: classId, section, subject, teacher } = req.body;

  const validGroup = await SubjectGroup.findOne({
    academicYear,
    class: classId,
    subjects: subject,
    active: true,
  });

  if (!validGroup) {
    throw new ApiError(
      400,
      "This subject is not part of any active subject group for the selected class and academic year"
    );
  }

  await checkDuplicate(
    SubjectTeacher,
    { academicYear, class: classId, section, subject },
    DUPLICATE_MESSAGE
  );

  const assignment = await SubjectTeacher.create({
    academicYear,
    class: classId,
    section,
    subject,
    teacher,
  });

  const populated = await assignment.populate(populateFields);

  return sendResponse(res, 201, "Teacher assigned successfully", {
    subjectTeacher: populated,
  });
});

// Get All
const getAllSubjectTeachers = asyncHandler(async (req, res) => {
  const { class: classId, academicYear, section, subject, teacher } = req.query;

  const filter = {};
  if (classId) filter.class = classId;
  if (academicYear) filter.academicYear = academicYear;
  if (section) filter.section = section;
  if (subject) filter.subject = subject;
  if (teacher) filter.teacher = teacher;

  const pagination = getPagination(req);

  const { data: subjectTeachers, pagination: paginationInfo } = await paginateQuery(
    SubjectTeacher,
    filter,
    pagination,
    { populate: populateFields, sort: { createdAt: -1 } }
  );

  return sendResponse(res, 200, "Subject teachers fetched successfully", {
    subjectTeachers,
    pagination: paginationInfo,
  });
});

// Get Single
const getSubjectTeacherById = asyncHandler(async (req, res) => {
  const assignment = await SubjectTeacher.findById(req.params.id).populate(populateFields);

  if (!assignment) {
    throw new ApiError(404, "Assignment not found");
  }

  return sendResponse(res, 200, "Assignment fetched successfully", { subjectTeacher: assignment });
});

// Update
const updateSubjectTeacher = asyncHandler(async (req, res) => {
  const { academicYear, class: classId, section, subject, teacher } = req.body;

  const assignment = await SubjectTeacher.findById(req.params.id);
  if (!assignment) {
    throw new ApiError(404, "Assignment not found");
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
    const validGroup = await SubjectGroup.findOne({
      academicYear: newYear,
      class: newClass,
      subjects: newSubject,
      active: true,
    });

    if (!validGroup) {
      throw new ApiError(
        400,
        "This subject is not part of any active subject group for the selected class and academic year"
      );
    }

    await checkDuplicate(
      SubjectTeacher,
      { academicYear: newYear, class: newClass, section: newSection, subject: newSubject },
      DUPLICATE_MESSAGE,
      assignment._id
    );
  }

  if (academicYear !== undefined) assignment.academicYear = academicYear;
  if (classId !== undefined) assignment.class = classId;
  if (section !== undefined) assignment.section = section;
  if (subject !== undefined) assignment.subject = subject;
  if (teacher !== undefined) assignment.teacher = teacher;

  await assignment.save();

  const populated = await assignment.populate(populateFields);

  return sendResponse(res, 200, "Assignment updated successfully", {
    subjectTeacher: populated,
  });
});

// Delete
const deleteSubjectTeacher = asyncHandler(async (req, res) => {
  const assignment = await SubjectTeacher.findByIdAndDelete(req.params.id);

  if (!assignment) {
    throw new ApiError(404, "Assignment not found");
  }

  return sendResponse(res, 200, "Assignment removed successfully");
});

module.exports = {
  createSubjectTeacher,
  getAllSubjectTeachers,
  getSubjectTeacherById,
  updateSubjectTeacher,
  deleteSubjectTeacher,
};