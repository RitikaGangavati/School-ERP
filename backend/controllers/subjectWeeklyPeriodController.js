const SubjectWeeklyPeriod = require("../models/subjectWeeklyPeriodModel");

const populateFields = [
  {
    path: "academicYear",
    select: "name",
  },
  {
    path: "class",
    select: "className",
  },
  {
    path: "section",
    select: "sectionName",
  },
  {
    path: "subject",
    select: "subjectName",
  },
];

// =====================================================
// CREATE
// =====================================================

const createSubjectWeeklyPeriod = async (req, res) => {
  try {
    const {
      academicYear,
      class: classId,
      section,
      subject,
      periodsPerWeek,
    } = req.body;

    if (
      !academicYear ||
      !classId ||
      !section ||
      !subject ||
      periodsPerWeek === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Academic year, class, section, subject and periods per week are required",
      });
    }

    if (
      !Number.isInteger(Number(periodsPerWeek)) ||
      Number(periodsPerWeek) < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Periods per week must be a whole number greater than 0",
      });
    }

    const existing = await SubjectWeeklyPeriod.findOne({
      academicYear,
      class: classId,
      section,
      subject,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "Weekly period setting already exists for this subject and section",
      });
    }

    const weeklyPeriod = await SubjectWeeklyPeriod.create({
      academicYear,
      class: classId,
      section,
      subject,
      periodsPerWeek: Number(periodsPerWeek),
    });

    const populated = await weeklyPeriod.populate(populateFields);

    return res.status(201).json({
      success: true,
      message: "Subject weekly period created successfully",
      subjectWeeklyPeriod: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Weekly period setting already exists for this subject and section",
      });
    }

    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0]?.message;

      return res.status(400).json({
        success: false,
        message: firstError || "Invalid subject weekly period data",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// GET ALL
// =====================================================

const getAllSubjectWeeklyPeriods = async (req, res) => {
  try {
    const subjectWeeklyPeriods =
      await SubjectWeeklyPeriod.find()
        .populate(populateFields)
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      subjectWeeklyPeriods,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// GET BY ID
// =====================================================

const getSubjectWeeklyPeriodById = async (req, res) => {
  try {
    const subjectWeeklyPeriod =
      await SubjectWeeklyPeriod.findById(
        req.params.id
      ).populate(populateFields);

    if (!subjectWeeklyPeriod) {
      return res.status(404).json({
        success: false,
        message: "Subject weekly period not found",
      });
    }

    return res.status(200).json({
      success: true,
      subjectWeeklyPeriod,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid subject weekly period ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// GET BY CLASS + SECTION
// =====================================================

const getSubjectWeeklyPeriodsBySection = async (req, res) => {
  try {
    const {
      academicYear,
      class: classId,
      section,
    } = req.query;

    if (!academicYear || !classId || !section) {
      return res.status(400).json({
        success: false,
        message:
          "Academic year, class and section are required",
      });
    }

    const subjectWeeklyPeriods =
      await SubjectWeeklyPeriod.find({
        academicYear,
        class: classId,
        section,
        active: true,
      })
        .populate(populateFields)
        .sort({
          subject: 1,
        });

    return res.status(200).json({
      success: true,
      subjectWeeklyPeriods,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// UPDATE
// =====================================================

const updateSubjectWeeklyPeriod = async (req, res) => {
  try {
    const {
      academicYear,
      class: classId,
      section,
      subject,
      periodsPerWeek,
      active,
    } = req.body;

    const weeklyPeriod =
      await SubjectWeeklyPeriod.findById(
        req.params.id
      );

    if (!weeklyPeriod) {
      return res.status(404).json({
        success: false,
        message: "Subject weekly period not found",
      });
    }

    if (
      periodsPerWeek !== undefined &&
      (!Number.isInteger(Number(periodsPerWeek)) ||
        Number(periodsPerWeek) < 1)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Periods per week must be a whole number greater than 0",
      });
    }

    const newYear =
      academicYear ?? weeklyPeriod.academicYear;

    const newClass =
      classId ?? weeklyPeriod.class;

    const newSection =
      section ?? weeklyPeriod.section;

    const newSubject =
      subject ?? weeklyPeriod.subject;

    const isChangingUniqueFields =
      String(newYear) !==
        String(weeklyPeriod.academicYear) ||
      String(newClass) !==
        String(weeklyPeriod.class) ||
      String(newSection) !==
        String(weeklyPeriod.section) ||
      String(newSubject) !==
        String(weeklyPeriod.subject);

    if (isChangingUniqueFields) {
      const existing =
        await SubjectWeeklyPeriod.findOne({
          _id: {
            $ne: weeklyPeriod._id,
          },
          academicYear: newYear,
          class: newClass,
          section: newSection,
          subject: newSubject,
        });

      if (existing) {
        return res.status(409).json({
          success: false,
          message:
            "Weekly period setting already exists for this subject and section",
        });
      }
    }

    if (academicYear !== undefined) {
      weeklyPeriod.academicYear =
        academicYear;
    }

    if (classId !== undefined) {
      weeklyPeriod.class = classId;
    }

    if (section !== undefined) {
      weeklyPeriod.section = section;
    }

    if (subject !== undefined) {
      weeklyPeriod.subject = subject;
    }

    if (periodsPerWeek !== undefined) {
      weeklyPeriod.periodsPerWeek =
        Number(periodsPerWeek);
    }

    if (active !== undefined) {
      weeklyPeriod.active = active;
    }

    await weeklyPeriod.save();

    const populated =
      await weeklyPeriod.populate(
        populateFields
      );

    return res.status(200).json({
      success: true,
      message:
        "Subject weekly period updated successfully",
      subjectWeeklyPeriod: populated,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid subject weekly period ID",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Weekly period setting already exists for this subject and section",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// DELETE
// =====================================================

const deleteSubjectWeeklyPeriod = async (req, res) => {
  try {
    const deleted =
      await SubjectWeeklyPeriod.findByIdAndDelete(
        req.params.id
      );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message:
          "Subject weekly period not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Subject weekly period removed successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid subject weekly period ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createSubjectWeeklyPeriod,
  getAllSubjectWeeklyPeriods,
  getSubjectWeeklyPeriodById,
  getSubjectWeeklyPeriodsBySection,
  updateSubjectWeeklyPeriod,
  deleteSubjectWeeklyPeriod,
};