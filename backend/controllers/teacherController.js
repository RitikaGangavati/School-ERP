const Teacher = require("../models/teacherModel");
const User = require("../models/userModel");
const Role = require("../models/roleModel");

// Reused across every function that returns a teacher, so userId.role always resolves to a role name
const populateFields = [
  {
    path: "userId",
    select: "email active role",
    populate: { path: "role", select: "roleName" },
  },
  { path: "subjects", select: "subjectName" },
];

// Create Teacher (creates both User and Teacher together)
const createTeacher = async (req, res) => {
  try {
    const {
      firstName, lastName, email, password, dob, gender, mobile, photo,
      employeeId, joiningDate, designation, department, subjects,
      qualification, experience, status, active,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }

    const existingTeacher = await Teacher.findOne({ employeeId: employeeId.trim() });
    if (existingTeacher) {
      return res.status(409).json({ success: false, message: "Employee ID already exists" });
    }

    const teacherRole = await Role.findOne({ roleName: "Teacher" });
    if (!teacherRole) {
      return res.status(404).json({
        success: false,
        message: "Teacher role not found. Please create it in Role Master first.",
      });
    }

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
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
        employeeId: employeeId.trim(),
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

    return res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      teacher: populated,
    });
 } catch (error) {
  if (error.code === 11000) {
    return res.status(409).json({ success: false, message: "Email or Employee ID already exists" });
  }
  return res.status(500).json({ success: false, message: error.message });
}
};

// Get All Teachers 
const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate(populateFields)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: teachers.length,
      teachers,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Teacher
const getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate(populateFields);

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    return res.status(200).json({ success: true, teacher });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid teacher ID" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Teacher
const updateTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });    }

    const {
      firstName, lastName, email, dob, gender, mobile, photo,
      employeeId, joiningDate, designation, department, subjects,
      qualification, experience, status, active,
    } = req.body;

    if (employeeId !== undefined && employeeId.trim() !== teacher.employeeId) {
      const existingTeacher = await Teacher.findOne({
        employeeId: employeeId.trim(),
        _id: { $ne: teacher._id },
      });
      if (existingTeacher) {
        return res.status(409).json({ success: false, message: "Employee ID already exists" });
      }
    }

    if (email !== undefined) {
      const existingUser = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: teacher.userId },
      });
      if (existingUser) {
        return res.status(409).json({ success: false, message: "Email already exists" });
      }
    }

    // Only update User fields that were actually sent
    const userUpdates = {};
    if (firstName !== undefined) userUpdates.firstName = firstName;
    if (lastName !== undefined) userUpdates.lastName = lastName;
    if (email !== undefined) userUpdates.email = email.toLowerCase().trim();
    if (mobile !== undefined) userUpdates.mobile = mobile;

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(teacher.userId, userUpdates);
    }

    // Only update Teacher fields that were actually sent
    if (firstName !== undefined) teacher.firstName = firstName;
    if (lastName !== undefined) teacher.lastName = lastName;
    if (dob !== undefined) teacher.dob = dob;
    if (gender !== undefined) teacher.gender = gender;
    if (mobile !== undefined) teacher.mobile = mobile;
    if (photo !== undefined) teacher.photo = photo;
    if (employeeId !== undefined) teacher.employeeId = employeeId.trim();
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

    return res.status(200).json({
      success: true,
      message: "Teacher updated successfully",
      teacher: populated,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid teacher ID" });
    }
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Email or Employee ID already exists" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Deactivate Teacher (soft delete — both Teacher and linked User marked inactive)
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    teacher.status = "Inactive";
    teacher.active = false;
    await teacher.save();

    await User.findByIdAndUpdate(teacher.userId, { active: false });

    return res.status(200).json({
      success: true,
      message: "Teacher deactivated successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid teacher ID" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
};