const Student = require("../models/studentModel");

const populateFields = [
  { path: "academic.class", select: "className" },
  { path: "academic.section", select: "sectionName" },
  { path: "academic.academicYear", select: "name" },
   { path: "academic.house", select: "houseName" },
  { path: "personal.category", select: "categoryName categoryCode" },
];

// Create Student
const createStudent = async (req, res) => {
  try {
    const { personal, academic, health, parent, address, active } = req.body;

    if (
      !personal?.firstName ||
      !personal?.lastName ||
      !personal?.dob ||
      !personal?.gender ||
      !academic?.admissionNumber ||
      !academic?.academicYear ||
      !academic?.class ||
      !academic?.section
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    const existing = await Student.findOne({
      "academic.admissionNumber": academic.admissionNumber.trim(),
    });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Admission number already exists" });
    }

    const student = await Student.create({
      personal,
      academic: {
        ...academic,
        admissionNumber: academic.admissionNumber.trim(),
      },
      health,
      parent,
      address,
      active,
    });

    const populated = await student.populate(populateFields);

    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      student: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Admission number already exists" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Students
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate(populateFields)
      .sort({ "personal.firstName": 1 });

    return res.status(200).json({ success: true, students });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Student
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate(
      populateFields,
    );
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }
    return res.status(200).json({ success: true, student });
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid student ID" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Student
const updateStudent = async (req, res) => {
  try {
    const { personal, academic, health, parent, address, active } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    if (
      academic?.admissionNumber &&
      academic.admissionNumber.trim() !== student.academic.admissionNumber
    ) {
      const existing = await Student.findOne({
        "academic.admissionNumber": academic.admissionNumber.trim(),
        _id: { $ne: student._id },
      });
      if (existing) {
        return res
          .status(409)
          .json({ success: false, message: "Admission number already in use" });
      }
    }

    if (personal !== undefined) {
      student.personal = { ...student.personal.toObject(), ...personal };
    }
    if (academic !== undefined) {
      student.academic = {
        ...student.academic.toObject(),
        ...academic,
        admissionNumber:
          academic.admissionNumber?.trim() || student.academic.admissionNumber,
      };
    }
    if (health !== undefined) {
      student.health = { ...(student.health?.toObject?.() || {}), ...health };
    }
    if (parent !== undefined) {
      student.parent = { ...(student.parent?.toObject?.() || {}), ...parent };
    }
    if (address !== undefined) {
      student.address = {
        ...(student.address?.toObject?.() || {}),
        ...address,
      };
    }

    if (active !== undefined) student.active = active;

    await student.save();
    const populated = await student.populate(populateFields);

    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student: populated,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid student ID" });
    }
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Admission number already in use" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Student
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid student ID" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};
