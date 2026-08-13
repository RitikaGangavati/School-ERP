const SubjectGroup = require("../models/subjectGroupModel");

const populateFields = [
  { path: "class", select: "className" },
  { path: "sections", select: "sectionName" },
  { path: "subjects", select: "subjectName code type status" },
  { path: "academicYear", select: "name" },
];

// Create Subject Group
const createSubjectGroup = async (req, res) => {
  try {
    const {
      academicYear,
      groupName,
      class: classId,
      sections,
      subjects,
      description,
      active,
    } = req.body;

    if (!groupName || !groupName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Group name is required",
      });
    }

    if (!classId) {
      return res.status(400).json({
        success: false,
        message: "Class is required",
      });
    }

    if (!academicYear) {
      return res.status(400).json({
        success: false,
        message: "Academic year is required",
      });
    }

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Select at least one subject",
      });
    }

    const existing = await SubjectGroup.findOne({
      academicYear,
      groupName: groupName.trim(),
      class: classId,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "A subject group with this name already exists for the selected class and academic year.",
      });
    }

    // Remove duplicate subjects
    const uniqueSubjects = [...new Set(subjects.map(String))];

    const group = await SubjectGroup.create({
      academicYear,
      groupName: groupName.trim(),
      class: classId,
      sections: Array.isArray(sections) ? sections : [],
      subjects: uniqueSubjects,
      description: description || "",
      active: active !== undefined ? active : true,
    });

    const populated = await group.populate(populateFields);

    return res.status(201).json({
      success: true,
      message: "Subject group created successfully",
      subjectGroup: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A subject group with this name already exists for the selected class and academic year.",
      });
    }

    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0]?.message;

      return res.status(400).json({
        success: false,
        message: firstError || "Please check the selected subjects.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Get All Subject Groups
const getAllSubjectGroups = async (req, res) => {
  try {
    const subjectGroups = await SubjectGroup.find()
      .populate(populateFields)
      .sort({ groupName: 1 });

    return res.status(200).json({
      success: true,
      subjectGroups,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Get Single Subject Group
const getSubjectGroupById = async (req, res) => {
  try {
    const group = await SubjectGroup.findById(req.params.id)
      .populate(populateFields);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Subject group not found",
      });
    }

    return res.status(200).json({
      success: true,
      subjectGroup: group,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid subject group ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Update Subject Group
const updateSubjectGroup = async (req, res) => {
  try {
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
      return res.status(404).json({
        success: false,
        message: "Subject group not found",
      });
    }

    const newName =
      groupName?.trim() ?? group.groupName;

    const newClass =
      classId ?? group.class;

    const newAcademicYear =
      academicYear ?? group.academicYear;

    if (!newName) {
      return res.status(400).json({
        success: false,
        message: "Group name is required",
      });
    }

    if (
      subjects !== undefined &&
      (!Array.isArray(subjects) || subjects.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Select at least one subject",
      });
    }

    const isChanging =
      newName !== group.groupName ||
      String(newClass) !== String(group.class) ||
      String(newAcademicYear) !== String(group.academicYear);

    if (isChanging) {
      const existing = await SubjectGroup.findOne({
        _id: { $ne: group._id },
        academicYear: newAcademicYear,
        groupName: newName,
        class: newClass,
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message:
            "A subject group with this name already exists for the selected class and academic year.",
        });
      }
    }

    group.groupName = newName;
    group.class = newClass;
    group.academicYear = newAcademicYear;

    if (sections !== undefined) {
      group.sections = Array.isArray(sections)
        ? sections
        : [];
    }

    if (subjects !== undefined) {
      group.subjects = [
        ...new Set(subjects.map(String)),
      ];
    }

    if (description !== undefined) {
      group.description = description;
    }

    if (active !== undefined) {
      group.active = active;
    }

    await group.save();

    const populated = await group.populate(populateFields);

    return res.status(200).json({
      success: true,
      message: "Subject group updated successfully",
      subjectGroup: populated,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid subject group ID",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A subject group with this name already exists for the selected class and academic year.",
      });
    }

    if (error.name === "ValidationError") {
      const firstError =
        Object.values(error.errors)[0]?.message;

      return res.status(400).json({
        success: false,
        message:
          firstError || "Please check the selected subjects.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Delete Subject Group
const deleteSubjectGroup = async (req, res) => {
  try {
    const group =
      await SubjectGroup.findByIdAndDelete(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Subject group not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subject group deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid subject group ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  createSubjectGroup,
  getAllSubjectGroups,
  getSubjectGroupById,
  updateSubjectGroup,
  deleteSubjectGroup,
};