const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const { getPagination, paginateQuery } = require("../utils/paginate");
const checkDuplicate = require("../utils/checkDuplicate");
const buildSearchFilter = require("../utils/buildSearchFilter");
const Student = require("../models/studentModel");
const Class = require("../models/classModel");
const Section = require("../models/sectionModel");
const AcademicYear = require("../models/academicYearModel");
const House = require("../models/houseModel");
const Category = require("../models/categoryModel");
const deleteFromCloudinary = require("../utils/deleteFromCloudinary");

// Every uploaded-file URL a student record holds
const collectFileUrls = (s) =>
  [
    s.personal?.photo,
    s.parent?.fatherPhoto,
    s.parent?.motherPhoto,
    s.parent?.guardianPhoto,
    ...(s.documents || []).map((d) => d.file),
  ].filter(Boolean);

const populateFields = [
  { path: "academic.class", select: "className" },
  { path: "academic.section", select: "sectionName" },
  { path: "academic.academicYear", select: "name" },
  { path: "academic.house", select: "houseName" },
  { path: "personal.category", select: "categoryName categoryCode" },
];

// Validates that referenced IDs actually exist in their collections.
// Only checks fields that are present in the given objects (so partial
// updates only validate what's actually being changed).
const validateReferences = async (academic = {}, personal = {}) => {
  if (academic.class !== undefined) {
    const exists = await Class.findById(academic.class);
    if (!exists) throw new ApiError(404, "Class not found");
  }

  if (academic.section !== undefined) {
    const exists = await Section.findById(academic.section);
    if (!exists) throw new ApiError(404, "Section not found");
  }

  if (academic.academicYear !== undefined) {
    const exists = await AcademicYear.findById(academic.academicYear);
    if (!exists) throw new ApiError(404, "Academic year not found");
  }

  if (academic.house) {
    const exists = await House.findById(academic.house);
    if (!exists) throw new ApiError(404, "House not found");
  }

  if (personal.category) {
    const exists = await Category.findById(personal.category);
    if (!exists) throw new ApiError(404, "Category not found");
  }
};

// Create Student
const createStudent = asyncHandler(async (req, res) => {
  const { personal, academic, health, parent, address, documents, active } =
    req.body;

  await validateReferences(academic, personal);

  await checkDuplicate(
    Student,
    { "academic.admissionNumber": academic.admissionNumber },
    "Admission number already exists",
  );

  const student = await Student.create({
    personal,
    academic,
    health,
    parent,
    address,
    documents,
    active,
  });

  const populated = await student.populate(populateFields);

  return sendResponse(res, 201, "Student created successfully", {
    student: populated,
  });
});

// Get All Students
const getAllStudents = asyncHandler(async (req, res) => {
  const { search, class: classId, section, academicYear } = req.query;

  const filter = {};
  if (classId) filter["academic.class"] = classId;
  if (section) filter["academic.section"] = section;
  if (academicYear) filter["academic.academicYear"] = academicYear;

  const searchFilter = buildSearchFilter(search, [
    "personal.firstName",
    "personal.lastName",
    "academic.admissionNumber",
  ]);
  if (searchFilter) Object.assign(filter, searchFilter);

  const pagination = getPagination(req);

  const { data: students, pagination: paginationInfo } = await paginateQuery(
    Student,
    filter,
    pagination,
    { populate: populateFields, sort: { "personal.firstName": 1 } },
  );

  return sendResponse(res, 200, "Students fetched successfully", {
    students,
    pagination: paginationInfo,
  });
});

// Get Single Student
const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).populate(
    populateFields,
  );

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  return sendResponse(res, 200, "Student fetched successfully", { student });
});

// Update Student
const updateStudent = asyncHandler(async (req, res) => {
  const { personal, academic, health, parent, address, documents, active } =
    req.body;

  const student = await Student.findById(req.params.id);
  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const oldUrls = collectFileUrls(student);

  await validateReferences(academic || {}, personal || {});

  if (
    academic?.admissionNumber &&
    academic.admissionNumber !== student.academic.admissionNumber
  ) {
    await checkDuplicate(
      Student,
      { "academic.admissionNumber": academic.admissionNumber },
      "Admission number already in use",
      student._id,
    );
  }

  if (personal !== undefined) {
    student.personal = { ...student.personal.toObject(), ...personal };
  }
  if (academic !== undefined) {
    student.academic = { ...student.academic.toObject(), ...academic };
  }
  if (health !== undefined) {
    student.health = { ...(student.health?.toObject?.() || {}), ...health };
  }
  if (parent !== undefined) {
    student.parent = { ...(student.parent?.toObject?.() || {}), ...parent };
  }
  if (address !== undefined) {
    student.address = { ...(student.address?.toObject?.() || {}), ...address };
  }
  if (documents !== undefined) {
    student.documents = documents;
  }
  if (active !== undefined) student.active = active;

  await student.save();

  // Delete files that were replaced or removed
  const newUrls = new Set(collectFileUrls(student));
  await Promise.all(
    oldUrls.filter((url) => !newUrls.has(url)).map(deleteFromCloudinary),
  );

  const populated = await student.populate(populateFields);

  return sendResponse(res, 200, "Student updated successfully", {
    student: populated,
  });
});

// Delete Student
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  await Promise.all(collectFileUrls(student).map(deleteFromCloudinary));

  return sendResponse(res, 200, "Student deleted successfully");
});

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};
