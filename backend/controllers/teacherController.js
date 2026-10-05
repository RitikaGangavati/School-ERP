const Teacher = require("../models/teacherModel");
const User = require("../models/userModel");
const Role = require("../models/roleModel");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const checkDuplicate = require("../utils/checkDuplicate");
const buildSearchFilter = require("../utils/buildSearchFilter");
const { getPagination, paginateQuery } = require("../utils/paginate");

const populateFields = [
  {
    path: "userId",
    select: "email active role",
    populate: { path: "role", select: "roleName" },
  },
  { path: "subjects", select: "subjectName" },
];

// Create Teacher (creates both User and Teacher together)
const createTeacher = asyncHandler(async (req, res) => {
  const {
    firstName, lastName, email, password, dob, gender, mobile, photo,
    employeeId, joiningDate, designation, department, subjects,
    qualification, experience, status, active,
  } = req.body;

  await checkDuplicate(User, { email }, "Email already exists");
  await checkDuplicate(Teacher, { employeeId }, "Employee ID already exists");

  const teacherRole = await Role.findOne({ roleName: "Teacher" });
  if (!teacherRole) {
    throw new ApiError(404, "Teacher role not found. Please create it in Role Master first.");
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    mobile,
    role: teacherRole._id,
    active,
  });

  let teacher;
  try {
    teacher = await Teacher.create({
      userId: user._id,
      firstName,
      lastName,
      dob,
      gender,
      mobile,
      photo,
      employeeId,
      joiningDate,
      designation,
      department,
      subjects,
      qualification,
      experience,
      status,
      active,
    });
  } catch (teacherError) {
    await User.findByIdAndDelete(user._id);
    throw teacherError;
  }

  const populated = await teacher.populate(populateFields);

  return sendResponse(res, 201, "Teacher created successfully", { teacher: populated });
});

// Get All Teachers
const getAllTeachers = asyncHandler(async (req, res) => {
  const { search, status, active } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (active !== undefined) filter.active = active === "true";

  const searchFilter = buildSearchFilter(search, ["firstName", "lastName", "employeeId", "department"]);
  if (searchFilter) Object.assign(filter, searchFilter);

  const pagination = getPagination(req);

  const { data: teachers, pagination: paginationInfo } = await paginateQuery(
    Teacher,
    filter,
    pagination,
    { populate: populateFields, sort: { createdAt: -1 } }
  );

  return sendResponse(res, 200, "Teachers fetched successfully", {
    teachers,
    pagination: paginationInfo,
  });
});

// Get Single Teacher
const getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id).populate(populateFields);

  if (!teacher) {
    throw new ApiError(404, "Teacher not found");
  }

  return sendResponse(res, 200, "Teacher fetched successfully", { teacher });
});

// Update Teacher
const updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    throw new ApiError(404, "Teacher not found");
  }

  const {
    firstName, lastName, email, dob, gender, mobile, photo,
    employeeId, joiningDate, designation, department, subjects,
    qualification, experience, status, active,
  } = req.body;

  if (employeeId !== undefined && employeeId !== teacher.employeeId) {
    await checkDuplicate(Teacher, { employeeId }, "Employee ID already exists", teacher._id);
  }

  if (email !== undefined) {
    await checkDuplicate(User, { email }, "Email already exists", teacher.userId);
  }

  const userUpdates = {};
  if (firstName !== undefined) userUpdates.firstName = firstName;
  if (lastName !== undefined) userUpdates.lastName = lastName;
  if (email !== undefined) userUpdates.email = email;
  if (mobile !== undefined) userUpdates.mobile = mobile;

  if (Object.keys(userUpdates).length > 0) {
    await User.findByIdAndUpdate(teacher.userId, userUpdates);
  }

  if (firstName !== undefined) teacher.firstName = firstName;
  if (lastName !== undefined) teacher.lastName = lastName;
  if (dob !== undefined) teacher.dob = dob;
  if (gender !== undefined) teacher.gender = gender;
  if (mobile !== undefined) teacher.mobile = mobile;
  if (photo !== undefined) teacher.photo = photo;
  if (employeeId !== undefined) teacher.employeeId = employeeId;
  if (joiningDate !== undefined) teacher.joiningDate = joiningDate;
  if (designation !== undefined) teacher.designation = designation;
  if (department !== undefined) teacher.department = department;
  if (subjects !== undefined) teacher.subjects = subjects;
  if (qualification !== undefined) teacher.qualification = qualification;
  if (experience !== undefined) teacher.experience = experience;
  if (status !== undefined) teacher.status = status;
  if (active !== undefined) teacher.active = active;

  await teacher.save();

  const populated = await teacher.populate(populateFields);

  return sendResponse(res, 200, "Teacher updated successfully", { teacher: populated });
});

// Deactivate Teacher (soft delete — both Teacher and linked User marked inactive)
const deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    throw new ApiError(404, "Teacher not found");
  }

  teacher.status = "Inactive";
  teacher.active = false;
  await teacher.save();

  await User.findByIdAndUpdate(teacher.userId, { active: false });

  return sendResponse(res, 200, "Teacher deactivated successfully");
});

module.exports = {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
};