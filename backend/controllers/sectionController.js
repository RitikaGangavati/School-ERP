const Section = require("../models/sectionModel");
const Student = require("../models/studentModel");
const Class = require("../models/classModel");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const checkDuplicate = require("../utils/checkDuplicate");
const buildSearchFilter = require("../utils/buildSearchFilter");
const { getPagination, paginateQuery } = require("../utils/paginate");

// Create Section
const createSection = asyncHandler(async (req, res) => {
  const { sectionName, active } = req.body;

  await checkDuplicate(
    Section,
    { sectionName: sectionName.toUpperCase() },
    "Section already exists"
  );

  const section = await Section.create({ sectionName, active });

  return sendResponse(res, 201, "Section created successfully", { section });
});

// Get All Sections
const getAllSections = asyncHandler(async (req, res) => {
  const { search, active } = req.query;

  const filter = {};
  if (active !== undefined) filter.active = active === "true";

  const searchFilter = buildSearchFilter(search, ["sectionName"]);
  if (searchFilter) Object.assign(filter, searchFilter);

  const pagination = getPagination(req);

  const { data: sections, pagination: paginationInfo } = await paginateQuery(
    Section,
    filter,
    pagination,
    { sort: { sectionName: 1 } }
  );

  return sendResponse(res, 200, "Sections fetched successfully", { sections, pagination: paginationInfo });
});

// Get Single Section
const getSectionById = asyncHandler(async (req, res) => {
  const section = await Section.findById(req.params.id);

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  return sendResponse(res, 200, "Section fetched successfully", { section });
});

// Update Section
const updateSection = asyncHandler(async (req, res) => {
  const { sectionName, active } = req.body;

  const section = await Section.findById(req.params.id);
  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  if (sectionName && sectionName.toUpperCase() !== section.sectionName) {
    await checkDuplicate(
      Section,
      { sectionName: sectionName.toUpperCase() },
      "Section name already in use",
      section._id
    );
    section.sectionName = sectionName;
  }

  if (active !== undefined) section.active = active;

  await section.save();

  return sendResponse(res, 200, "Section updated successfully", { section });
});

// Delete Section
const deleteSection = asyncHandler(async (req, res) => {
  const section = await Section.findById(req.params.id);

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  const studentsWithSection = await Student.countDocuments({
    "academic.section": section._id,
  });

  if (studentsWithSection > 0) {
    throw new ApiError(400, `Cannot delete section — ${studentsWithSection} student(s) are currently assigned to it`);
  }

  const classesWithSection = await Class.countDocuments({
    sections: section._id,
  });

  if (classesWithSection > 0) {
    throw new ApiError(400, `Cannot delete section — ${classesWithSection} class(es) are currently using it`);
  }

  await section.deleteOne();

  return sendResponse(res, 200, "Section deleted successfully");
});

module.exports = {
  createSection,
  getAllSections,
  getSectionById,
  updateSection,
  deleteSection,
};