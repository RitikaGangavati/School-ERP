const AcademicYear = require("../models/academicYearModel");
const Student = require("../models/studentModel");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const checkDuplicate = require("../utils/checkDuplicate");
const buildSearchFilter = require("../utils/buildSearchFilter");
const { getPagination, paginateQuery } = require("../utils/paginate");

// Create Academic Year
const createAcademicYear = asyncHandler(async (req, res) => {
  const { name, startDate, endDate, isCurrent, active } = req.body;

  await checkDuplicate(AcademicYear, { name }, "Academic year already exists");

  if (isCurrent) {
    await AcademicYear.updateMany({}, { isCurrent: false });
  }

  const academicYear = await AcademicYear.create({
    name,
    startDate,
    endDate,
    isCurrent: !!isCurrent,
    active,
  });

  return sendResponse(res, 201, "Academic year created successfully", { academicYear });
});

// Get Current Academic Year
const getCurrentAcademicYear = asyncHandler(async (req, res) => {
  const current = await AcademicYear.findOne({ isCurrent: true, active: true });

  if (!current) {
    throw new ApiError(404, "No academic year is marked as current");
  }

  return sendResponse(res, 200, "Current academic year fetched successfully", {
    academicYear: current,
  });
});

// Get All Academic Years
const getAllAcademicYears = asyncHandler(async (req, res) => {
  const { search, active } = req.query;

  const filter = {};
  if (active !== undefined) filter.active = active === "true";

  const searchFilter = buildSearchFilter(search, ["name"]);
  if (searchFilter) Object.assign(filter, searchFilter);

  const pagination = getPagination(req);

  const { data: academicYears, pagination: paginationInfo } = await paginateQuery(
    AcademicYear,
    filter,
    pagination,
    { sort: { startDate: -1 } }
  );

  return sendResponse(res, 200, "Academic years fetched successfully", {
    academicYears,
    pagination: paginationInfo,
  });
});

// Get Single Academic Year
const getAcademicYearById = asyncHandler(async (req, res) => {
  const academicYear = await AcademicYear.findById(req.params.id);

  if (!academicYear) {
    throw new ApiError(404, "Academic year not found");
  }

  return sendResponse(res, 200, "Academic year fetched successfully", { academicYear });
});

// Update Academic Year
const updateAcademicYear = asyncHandler(async (req, res) => {
  const { name, startDate, endDate, isCurrent, active } = req.body;

  const academicYear = await AcademicYear.findById(req.params.id);
  if (!academicYear) {
    throw new ApiError(404, "Academic year not found");
  }

  if (name && name !== academicYear.name) {
    await checkDuplicate(AcademicYear, { name }, "Academic year name already in use", academicYear._id);
    academicYear.name = name;
  }

  const newStart = startDate ? new Date(startDate) : academicYear.startDate;
  const newEnd = endDate ? new Date(endDate) : academicYear.endDate;

  if (newStart >= newEnd) {
    throw new ApiError(400, "Start date must be before end date");
  }

  if (startDate !== undefined) academicYear.startDate = startDate;
  if (endDate !== undefined) academicYear.endDate = endDate;
  if (active !== undefined) academicYear.active = active;

  if (isCurrent === true) {
    await AcademicYear.updateMany(
      { _id: { $ne: academicYear._id } },
      { isCurrent: false }
    );
    academicYear.isCurrent = true;
  } else if (isCurrent === false) {
    academicYear.isCurrent = false;
  }

  await academicYear.save();

  return sendResponse(res, 200, "Academic year updated successfully", { academicYear });
});

// Delete Academic Year
const deleteAcademicYear = asyncHandler(async (req, res) => {
  const academicYear = await AcademicYear.findById(req.params.id);

  if (!academicYear) {
    throw new ApiError(404, "Academic year not found");
  }

  const studentsWithYear = await Student.countDocuments({
    "academic.academicYear": academicYear._id,
  });

  if (studentsWithYear > 0) {
    throw new ApiError(400, `Cannot delete academic year — ${studentsWithYear} student(s) are currently assigned to it`);
  }

  await academicYear.deleteOne();

  return sendResponse(res, 200, "Academic year deleted successfully");
});

module.exports = {
  createAcademicYear,
  getCurrentAcademicYear,
  getAllAcademicYears,
  getAcademicYearById,
  updateAcademicYear,
  deleteAcademicYear,
};