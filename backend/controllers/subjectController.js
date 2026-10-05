const Subject = require("../models/subjectModel");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const checkDuplicate = require("../utils/checkDuplicate");
const buildSearchFilter = require("../utils/buildSearchFilter");
const { getPagination, paginateQuery } = require("../utils/paginate");

// Create Subject
const createSubject = asyncHandler(async (req, res) => {
  const { subjectName, subjectCode, subjectType, active } = req.body;

  await checkDuplicate(Subject, { subjectName }, "Subject already exists");

  const subject = await Subject.create({
    subjectName,
    subjectCode,
    subjectType,
    active,
  });

  return sendResponse(res, 201, "Subject created successfully", { subject });
});

// Get All Subjects
const getAllSubjects = asyncHandler(async (req, res) => {
  const { search, active } = req.query;

  const filter = {};
  if (active !== undefined) filter.active = active === "true";

  const searchFilter = buildSearchFilter(search, ["subjectName", "subjectCode", "subjectType"]);
  if (searchFilter) Object.assign(filter, searchFilter);

  const pagination = getPagination(req);

  const { data: subjects, pagination: paginationInfo } = await paginateQuery(
    Subject,
    filter,
    pagination,
    { sort: { subjectName: 1 } }
  );

  return sendResponse(res, 200, "Subjects fetched successfully", { subjects, pagination: paginationInfo });
});

// Get Single Subject
const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);

  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  return sendResponse(res, 200, "Subject fetched successfully", { subject });
});

// Update Subject
const updateSubject = asyncHandler(async (req, res) => {
  const { subjectName, subjectCode, subjectType, active } = req.body;

  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  if (subjectName && subjectName !== subject.subjectName) {
    await checkDuplicate(Subject, { subjectName }, "Subject name already in use", subject._id);
    subject.subjectName = subjectName;
  }

  if (subjectCode !== undefined) subject.subjectCode = subjectCode;
  if (subjectType !== undefined) subject.subjectType = subjectType;
  if (active !== undefined) subject.active = active;

  await subject.save();

  return sendResponse(res, 200, "Subject updated successfully", { subject });
});

// Delete Subject
const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findByIdAndDelete(req.params.id);

  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  return sendResponse(res, 200, "Subject deleted successfully");
});

module.exports = {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
};