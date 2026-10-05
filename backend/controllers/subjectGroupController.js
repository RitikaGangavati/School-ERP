const SubjectGroup = require("../models/subjectGroupModel");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const checkDuplicate = require("../utils/checkDuplicate");
const buildSearchFilter = require("../utils/buildSearchFilter");
const { getPagination, paginateQuery } = require("../utils/paginate");

const populateFields = [
  { path: "class", select: "className" },
  { path: "sections", select: "sectionName" },
  { path: "subjects", select: "subjectName code type status" },
  { path: "academicYear", select: "name" },
];

const DUPLICATE_MESSAGE =
  "A subject group with this name already exists for the selected class and academic year.";

// Create Subject Group
const createSubjectGroup = asyncHandler(async (req, res) => {
  const {
    academicYear,
    groupName,
    class: classId,
    sections,
    subjects,
    description,
    active,
  } = req.body;

  await checkDuplicate(
    SubjectGroup,
    { academicYear, groupName, class: classId },
    DUPLICATE_MESSAGE
  );

  const uniqueSubjects = [...new Set(subjects.map(String))];

  const group = await SubjectGroup.create({
    academicYear,
    groupName,
    class: classId,
    sections: sections || [],
    subjects: uniqueSubjects,
    description: description || "",
    active,
  });

  const populated = await group.populate(populateFields);

  return sendResponse(res, 201, "Subject group created successfully", {
    subjectGroup: populated,
  });
});

// Get All Subject Groups
const getAllSubjectGroups = asyncHandler(async (req, res) => {
  const { search, class: classId, academicYear, active } = req.query;

  const filter = {};
  if (classId) filter.class = classId;
  if (academicYear) filter.academicYear = academicYear;
  if (active !== undefined) filter.active = active === "true";

  const searchFilter = buildSearchFilter(search, ["groupName", "description"]);
  if (searchFilter) Object.assign(filter, searchFilter);

  const pagination = getPagination(req);

  const { data: subjectGroups, pagination: paginationInfo } = await paginateQuery(
    SubjectGroup,
    filter,
    pagination,
    { populate: populateFields, sort: { groupName: 1 } }
  );

  return sendResponse(res, 200, "Subject groups fetched successfully", {
    subjectGroups,
    pagination: paginationInfo,
  });
});

// Get Single Subject Group
const getSubjectGroupById = asyncHandler(async (req, res) => {
  const group = await SubjectGroup.findById(req.params.id).populate(populateFields);

  if (!group) {
    throw new ApiError(404, "Subject group not found");
  }

  return sendResponse(res, 200, "Subject group fetched successfully", { subjectGroup: group });
});

// Update Subject Group
const updateSubjectGroup = asyncHandler(async (req, res) => {
  const {
    academicYear,
    groupName,
    class: classId,
    sections,
    subjects,
    description,
    active,
  } = req.body;

  const group = await SubjectGroup.findById(req.params.id);
  if (!group) {
    throw new ApiError(404, "Subject group not found");
  }

  const newName = groupName ?? group.groupName;
  const newClass = classId ?? group.class;
  const newAcademicYear = academicYear ?? group.academicYear;

  const isChanging =
    newName !== group.groupName ||
    String(newClass) !== String(group.class) ||
    String(newAcademicYear) !== String(group.academicYear);

  if (isChanging) {
    await checkDuplicate(
      SubjectGroup,
      { academicYear: newAcademicYear, groupName: newName, class: newClass },
      DUPLICATE_MESSAGE,
      group._id
    );
  }

  group.groupName = newName;
  group.class = newClass;
  group.academicYear = newAcademicYear;

  if (sections !== undefined) {
    group.sections = sections;
  }

  if (subjects !== undefined) {
    group.subjects = [...new Set(subjects.map(String))];
  }

  if (description !== undefined) group.description = description;
  if (active !== undefined) group.active = active;

  await group.save();

  const populated = await group.populate(populateFields);

  return sendResponse(res, 200, "Subject group updated successfully", {
    subjectGroup: populated,
  });
});

// Delete Subject Group
const deleteSubjectGroup = asyncHandler(async (req, res) => {
  const group = await SubjectGroup.findByIdAndDelete(req.params.id);

  if (!group) {
    throw new ApiError(404, "Subject group not found");
  }

  return sendResponse(res, 200, "Subject group deleted successfully");
});

module.exports = {
  createSubjectGroup,
  getAllSubjectGroups,
  getSubjectGroupById,
  updateSubjectGroup,
  deleteSubjectGroup,
};