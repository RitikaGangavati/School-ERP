const Class = require("../models/classModel");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const checkDuplicate = require("../utils/checkDuplicate");
const buildSearchFilter = require("../utils/buildSearchFilter");
const { getPagination, paginateQuery } = require("../utils/paginate");

// Create Class
const createClass = asyncHandler(async (req, res) => {
  const { className, sections, active } = req.body;

  await checkDuplicate(Class, { className }, "Class already exists");

  const newClass = await Class.create({
    className,
    sections: sections || [],
    active,
  });

  const populated = await newClass.populate("sections", "sectionName");

  return sendResponse(res, 201, "Class created successfully", { class: populated });
});

// Get All Classes
const getAllClasses = asyncHandler(async (req, res) => {
  const { search, active } = req.query;

  const filter = {};
  if (active !== undefined) filter.active = active === "true";

  const searchFilter = buildSearchFilter(search, ["className"]);
  if (searchFilter) Object.assign(filter, searchFilter);

  const pagination = getPagination(req);

  const { data: classes, pagination: paginationInfo } = await paginateQuery(
    Class,
    filter,
    pagination,
    { populate: { path: "sections", select: "sectionName" }, sort: { className: 1 } }
  );

  return sendResponse(res, 200, "Classes fetched successfully", { classes, pagination: paginationInfo });
});

// Get Single Class
const getClassById = asyncHandler(async (req, res) => {
  const classData = await Class.findById(req.params.id).populate("sections", "sectionName");

  if (!classData) {
    throw new ApiError(404, "Class not found");
  }

  return sendResponse(res, 200, "Class fetched successfully", { class: classData });
});

// Update Class
const updateClass = asyncHandler(async (req, res) => {
  const { className, sections, active } = req.body;

  const classData = await Class.findById(req.params.id);
  if (!classData) {
    throw new ApiError(404, "Class not found");
  }

  if (className && className !== classData.className) {
    await checkDuplicate(Class, { className }, "Class name already in use", classData._id);
    classData.className = className;
  }

  if (sections !== undefined) classData.sections = sections;
  if (active !== undefined) classData.active = active;

  await classData.save();

  const populated = await classData.populate("sections", "sectionName");

  return sendResponse(res, 200, "Class updated successfully", { class: populated });
});

// Delete Class
const deleteClass = asyncHandler(async (req, res) => {
  const classData = await Class.findByIdAndDelete(req.params.id);

  if (!classData) {
    throw new ApiError(404, "Class not found");
  }

  return sendResponse(res, 200, "Class deleted successfully");
});

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
};