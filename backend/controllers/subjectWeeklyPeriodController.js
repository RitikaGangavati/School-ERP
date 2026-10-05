const SubjectWeeklyPeriod = require("../models/subjectWeeklyPeriodModel");
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
];

const DUPLICATE_MESSAGE = "Weekly period setting already exists for this subject and section";

// CREATE
const createSubjectWeeklyPeriod = asyncHandler(async (req, res) => {
  const { academicYear, class: classId, section, subject, periodsPerWeek } = req.body;

  await checkDuplicate(
    SubjectWeeklyPeriod,
    { academicYear, class: classId, section, subject },
    DUPLICATE_MESSAGE
  );

  const weeklyPeriod = await SubjectWeeklyPeriod.create({
    academicYear,
    class: classId,
    section,
    subject,
    periodsPerWeek,
  });

  const populated = await weeklyPeriod.populate(populateFields);

  return sendResponse(res, 201, "Subject weekly period created successfully", {
    subjectWeeklyPeriod: populated,
  });
});

// GET ALL
const getAllSubjectWeeklyPeriods = asyncHandler(async (req, res) => {
  const { class: classId, academicYear, section, subject, active } = req.query;

  const filter = {};
  if (classId) filter.class = classId;
  if (academicYear) filter.academicYear = academicYear;
  if (section) filter.section = section;
  if (subject) filter.subject = subject;
  if (active !== undefined) filter.active = active === "true";

  const pagination = getPagination(req);

  const { data: subjectWeeklyPeriods, pagination: paginationInfo } = await paginateQuery(
    SubjectWeeklyPeriod,
    filter,
    pagination,
    { populate: populateFields, sort: { createdAt: -1 } }
  );

  return sendResponse(res, 200, "Subject weekly periods fetched successfully", {
    subjectWeeklyPeriods,
    pagination: paginationInfo,
  });
});

// GET BY ID
const getSubjectWeeklyPeriodById = asyncHandler(async (req, res) => {
  const subjectWeeklyPeriod = await SubjectWeeklyPeriod.findById(req.params.id).populate(
    populateFields
  );

  if (!subjectWeeklyPeriod) {
    throw new ApiError(404, "Subject weekly period not found");
  }

  return sendResponse(res, 200, "Subject weekly period fetched successfully", {
    subjectWeeklyPeriod,
  });
});

// GET BY CLASS + SECTION
const getSubjectWeeklyPeriodsBySection = asyncHandler(async (req, res) => {
  const { academicYear, class: classId, section } = req.query;

  const subjectWeeklyPeriods = await SubjectWeeklyPeriod.find({
    academicYear,
    class: classId,
    section,
    active: true,
  })
    .populate(populateFields)
    .sort({ subject: 1 });

  return sendResponse(res, 200, "Subject weekly periods fetched successfully", {
    subjectWeeklyPeriods,
  });
});

// UPDATE
const updateSubjectWeeklyPeriod = asyncHandler(async (req, res) => {
  const { academicYear, class: classId, section, subject, periodsPerWeek, active } = req.body;

  const weeklyPeriod = await SubjectWeeklyPeriod.findById(req.params.id);
  if (!weeklyPeriod) {
    throw new ApiError(404, "Subject weekly period not found");
  }

  const newYear = academicYear ?? weeklyPeriod.academicYear;
  const newClass = classId ?? weeklyPeriod.class;
  const newSection = section ?? weeklyPeriod.section;
  const newSubject = subject ?? weeklyPeriod.subject;

  const isChangingUniqueFields =
    String(newYear) !== String(weeklyPeriod.academicYear) ||
    String(newClass) !== String(weeklyPeriod.class) ||
    String(newSection) !== String(weeklyPeriod.section) ||
    String(newSubject) !== String(weeklyPeriod.subject);

  if (isChangingUniqueFields) {
    await checkDuplicate(
      SubjectWeeklyPeriod,
      { academicYear: newYear, class: newClass, section: newSection, subject: newSubject },
      DUPLICATE_MESSAGE,
      weeklyPeriod._id
    );
  }

  if (academicYear !== undefined) weeklyPeriod.academicYear = academicYear;
  if (classId !== undefined) weeklyPeriod.class = classId;
  if (section !== undefined) weeklyPeriod.section = section;
  if (subject !== undefined) weeklyPeriod.subject = subject;
  if (periodsPerWeek !== undefined) weeklyPeriod.periodsPerWeek = periodsPerWeek;
  if (active !== undefined) weeklyPeriod.active = active;

  await weeklyPeriod.save();

  const populated = await weeklyPeriod.populate(populateFields);

  return sendResponse(res, 200, "Subject weekly period updated successfully", {
    subjectWeeklyPeriod: populated,
  });
});

// DELETE
const deleteSubjectWeeklyPeriod = asyncHandler(async (req, res) => {
  const deleted = await SubjectWeeklyPeriod.findByIdAndDelete(req.params.id);

  if (!deleted) {
    throw new ApiError(404, "Subject weekly period not found");
  }

  return sendResponse(res, 200, "Subject weekly period removed successfully");
});

module.exports = {
  createSubjectWeeklyPeriod,
  getAllSubjectWeeklyPeriods,
  getSubjectWeeklyPeriodById,
  getSubjectWeeklyPeriodsBySection,
  updateSubjectWeeklyPeriod,
  deleteSubjectWeeklyPeriod,
};