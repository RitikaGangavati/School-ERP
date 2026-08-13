const Timetable = require("../models/timetableModel");
const SubjectTeacher = require("../models/subjectTeacherModel");
const SubjectWeeklyPeriod = require("../models/subjectWeeklyPeriodModel");
const TimeSlot = require("../models/timeSlotModel");

// =====================================================
// POPULATE FIELDS
// =====================================================

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
    path: "timeSlot",
    select:
      "periodName startTime endTime type displayOrder",
  },
  {
    path: "subject",
    select: "subjectName",
  },
  {
    path: "teacher",
    select:
      "firstName lastName employeeId",
  },
];

// =====================================================
// VALID DAYS
// =====================================================

const validDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// =====================================================
// CREATE TIMETABLE
// =====================================================

const createTimetable = async (req, res) => {
  try {
    const {
      academicYear,
      class: classId,
      section,
      day,
      timeSlot,
      subject,
      teacher,
      roomNo,
      remarks,
    } = req.body;

    // -------------------------------------------------
    // BASIC VALIDATION
    // -------------------------------------------------

    if (
      !academicYear ||
      !classId ||
      !section ||
      !day ||
      !timeSlot ||
      !subject ||
      !teacher
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Academic year, class, section, day, time slot, subject and teacher are required",
      });
    }

    // -------------------------------------------------
    // DAY VALIDATION
    // -------------------------------------------------

    if (!validDays.includes(day)) {
      return res.status(400).json({
        success: false,
        message: "Invalid timetable day",
      });
    }

    // =================================================
    // 1. TIME SLOT CHECK
    // =================================================

    const selectedTimeSlot =
      await TimeSlot.findOne({
        _id: timeSlot,
        active: true,
      });

    if (!selectedTimeSlot) {
      return res.status(404).json({
        success: false,
        message:
          "Selected time slot not found or inactive",
      });
    }

    // -------------------------------------------------
    // BREAK / LUNCH
    // -------------------------------------------------

    if (
      selectedTimeSlot.type === "Break" ||
      selectedTimeSlot.type === "Lunch"
    ) {
      return res.status(400).json({
        success: false,
        conflict: "INVALID_TIME_SLOT",
        message:
          "A subject cannot be assigned to a break or lunch time slot",
      });
    }

    // =================================================
    // 2. CLASS CONFLICT
    // =================================================

    const classConflict =
      await Timetable.findOne({
        academicYear,
        class: classId,
        section,
        day,
        timeSlot,
        active: true,
      });

    if (classConflict) {
      return res.status(409).json({
        success: false,
        conflict: "CLASS_CONFLICT",
        message:
          "This class already has a subject assigned for the selected day and time slot",
      });
    }

    // =================================================
    // 3. TEACHER CONFLICT
    // =================================================

    const teacherConflict =
      await Timetable.findOne({
        academicYear,
        teacher,
        day,
        timeSlot,
        active: true,
      });

    if (teacherConflict) {
      return res.status(409).json({
        success: false,
        conflict: "TEACHER_CONFLICT",
        message:
          "This teacher is already assigned to another class for the selected day and time slot",
      });
    }

    // =================================================
    // 4. ROOM CONFLICT
    // =================================================

    if (
      roomNo &&
      roomNo.trim() !== ""
    ) {
      const roomConflict =
        await Timetable.findOne({
          academicYear,
          roomNo: roomNo.trim(),
          day,
          timeSlot,
          active: true,
        });

      if (roomConflict) {
        return res.status(409).json({
          success: false,
          conflict: "ROOM_CONFLICT",
          message:
            "This room is already occupied for the selected day and time slot",
        });
      }
    }

    // =================================================
    // 5. SUBJECT TEACHER VALIDATION
    // =================================================

    /*
      SubjectTeacher means:

      Academic Year
      + Class
      + Section
      + Subject
      + Teacher

      This confirms that the teacher is actually
      assigned to teach this subject for this section.
    */

    const subjectTeacher =
      await SubjectTeacher.findOne({
        academicYear,
        class: classId,
        section,
        subject,
        teacher,
      });

    if (!subjectTeacher) {
      return res.status(400).json({
        success: false,
        conflict:
          "INVALID_SUBJECT_TEACHER",
        message:
          "This teacher is not assigned to this subject for the selected class and section",
      });
    }

    // =================================================
    // 6. WEEKLY PERIOD CONFIGURATION
    // =================================================

    const weeklyPeriod =
      await SubjectWeeklyPeriod.findOne({
        academicYear,
        class: classId,
        section,
        subject,
        active: true,
      });

    if (!weeklyPeriod) {
      return res.status(400).json({
        success: false,
        conflict:
          "WEEKLY_PERIOD_NOT_CONFIGURED",
        message:
          "Weekly period setting is not configured for this subject and section",
      });
    }

    // =================================================
    // 7. WEEKLY PERIOD LIMIT
    // =================================================

    const existingPeriodCount =
      await Timetable.countDocuments({
        academicYear,
        class: classId,
        section,
        subject,
        active: true,
      });

    if (
      existingPeriodCount >=
      weeklyPeriod.periodsPerWeek
    ) {
      return res.status(409).json({
        success: false,
        conflict:
          "WEEKLY_PERIOD_LIMIT",
        message:
          `${weeklyPeriod.periodsPerWeek} weekly periods are already assigned for this subject`,
      });
    }

    // =================================================
    // CREATE
    // =================================================

    const timetable =
      await Timetable.create({
        academicYear,
        class: classId,
        section,
        day,
        timeSlot,
        subject,
        teacher,
        roomNo:
          roomNo?.trim() || "",
        remarks:
          remarks?.trim() || "",
      });

    // =================================================
    // POPULATE
    // =================================================

    const populated =
      await timetable.populate(
        populateFields
      );

    return res.status(201).json({
      success: true,
      message:
        "Timetable created successfully",
      timetable: populated,
    });
  } catch (error) {
    // -------------------------------------------------
    // DUPLICATE INDEX
    // -------------------------------------------------

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        conflict:
          "TIMETABLE_CONFLICT",
        message:
          "A timetable entry already exists for this class, teacher or room at the selected time",
      });
    }

    // -------------------------------------------------
    // VALIDATION ERROR
    // -------------------------------------------------

    if (
      error.name ===
      "ValidationError"
    ) {
      const firstError =
        Object.values(
          error.errors
        )[0]?.message;

      return res.status(400).json({
        success: false,
        message:
          firstError ||
          "Invalid timetable data",
      });
    }

    // -------------------------------------------------
    // INVALID OBJECT ID
    // -------------------------------------------------

    if (
      error.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid timetable reference",
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

const getAllTimetable = async (
  req,
  res
) => {
  try {
    const timetables =
      await Timetable.find({
        active: true,
      })
        .populate(populateFields)
        .sort({
          day: 1,
        });

    return res.status(200).json({
      success: true,
      timetables,
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

const getTimetableById = async (
  req,
  res
) => {
  try {
    const timetable =
      await Timetable.findById(
        req.params.id
      ).populate(
        populateFields
      );

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message:
          "Timetable not found",
      });
    }

    return res.status(200).json({
      success: true,
      timetable,
    });
  } catch (error) {
    if (
      error.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid timetable ID",
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

const getTimetableBySection = async (
  req,
  res
) => {
  try {
    const {
      academicYear,
      class: classId,
      section,
    } = req.query;

    if (
      !academicYear ||
      !classId ||
      !section
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Academic year, class and section are required",
      });
    }

    const timetables =
      await Timetable.find({
        academicYear,
        class: classId,
        section,
        active: true,
      })
        .populate(
          populateFields
        )
        .sort({
          day: 1,
          timeSlot: 1,
        });

    return res.status(200).json({
      success: true,
      timetables,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// GET BY TEACHER
// =====================================================

const getTimetableByTeacher = async (req, res) => {
  try {
    const {
      academicYear,
      teacher,
    } = req.query;

    if (!academicYear || !teacher) {
      return res.status(400).json({
        success: false,
        message:
          "Academic year and teacher are required",
      });
    }

    const timetables = await Timetable.find({
      academicYear,
      teacher,
      active: true,
    })
      .populate(populateFields)
      .sort({
        day: 1,
        timeSlot: 1,
      });

    return res.status(200).json({
      success: true,
      timetables,
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

const updateTimetable = async (
  req,
  res
) => {
  try {
    const {
      academicYear,
      class: classId,
      section,
      day,
      timeSlot,
      subject,
      teacher,
      roomNo,
      remarks,
      active,
    } = req.body;

    const timetable =
      await Timetable.findById(
        req.params.id
      );

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message:
          "Timetable not found",
      });
    }

    // -------------------------------------------------
    // NEW VALUES
    // -------------------------------------------------

    const newYear =
      academicYear ??
      timetable.academicYear;

    const newClass =
      classId ??
      timetable.class;

    const newSection =
      section ??
      timetable.section;

    const newDay =
      day ?? timetable.day;

    const newTimeSlot =
      timeSlot ??
      timetable.timeSlot;

    const newSubject =
      subject ??
      timetable.subject;

    const newTeacher =
      teacher ??
      timetable.teacher;

    const newRoom =
      roomNo !== undefined
        ? roomNo.trim()
        : timetable.roomNo;

    // =================================================
    // DAY VALIDATION
    // =================================================

    if (
      !validDays.includes(
        newDay
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid timetable day",
      });
    }

    // =================================================
    // TIME SLOT
    // =================================================

    const selectedTimeSlot =
      await TimeSlot.findOne({
        _id: newTimeSlot,
        active: true,
      });

    if (!selectedTimeSlot) {
      return res.status(404).json({
        success: false,
        message:
          "Selected time slot not found or inactive",
      });
    }

    if (
      selectedTimeSlot.type ===
        "Break" ||
      selectedTimeSlot.type ===
        "Lunch"
    ) {
      return res.status(400).json({
        success: false,
        conflict:
          "INVALID_TIME_SLOT",
        message:
          "A subject cannot be assigned to a break or lunch time slot",
      });
    }

    // =================================================
    // CLASS CONFLICT
    // =================================================

    const classConflict =
      await Timetable.findOne({
        _id: {
          $ne: timetable._id,
        },
        academicYear: newYear,
        class: newClass,
        section: newSection,
        day: newDay,
        timeSlot: newTimeSlot,
        active: true,
      });

    if (classConflict) {
      return res.status(409).json({
        success: false,
        conflict:
          "CLASS_CONFLICT",
        message:
          "This class already has a subject assigned for the selected day and time slot",
      });
    }

    // =================================================
    // TEACHER CONFLICT
    // =================================================

    const teacherConflict =
      await Timetable.findOne({
        _id: {
          $ne: timetable._id,
        },
        academicYear: newYear,
        teacher: newTeacher,
        day: newDay,
        timeSlot: newTimeSlot,
        active: true,
      });

    if (teacherConflict) {
      return res.status(409).json({
        success: false,
        conflict:
          "TEACHER_CONFLICT",
        message:
          "This teacher is already assigned to another class for the selected day and time slot",
      });
    }

    // =================================================
    // ROOM CONFLICT
    // =================================================

    if (newRoom) {
      const roomConflict =
        await Timetable.findOne({
          _id: {
            $ne: timetable._id,
          },
          academicYear: newYear,
          roomNo: newRoom,
          day: newDay,
          timeSlot: newTimeSlot,
          active: true,
        });

      if (roomConflict) {
        return res.status(409).json({
          success: false,
          conflict:
            "ROOM_CONFLICT",
          message:
            "This room is already occupied for the selected day and time slot",
        });
      }
    }

    // =================================================
    // SUBJECT TEACHER
    // =================================================

    const subjectTeacher =
      await SubjectTeacher.findOne({
        academicYear: newYear,
        class: newClass,
        section: newSection,
        subject: newSubject,
        teacher: newTeacher,
      });

    if (!subjectTeacher) {
      return res.status(400).json({
        success: false,
        conflict:
          "INVALID_SUBJECT_TEACHER",
        message:
          "This teacher is not assigned to this subject for the selected class and section",
      });
    }

    // =================================================
    // WEEKLY PERIOD
    // =================================================

    const weeklyPeriod =
      await SubjectWeeklyPeriod.findOne({
        academicYear: newYear,
        class: newClass,
        section: newSection,
        subject: newSubject,
        active: true,
      });

    if (!weeklyPeriod) {
      return res.status(400).json({
        success: false,
        conflict:
          "WEEKLY_PERIOD_NOT_CONFIGURED",
        message:
          "Weekly period setting is not configured for this subject and section",
      });
    }

    // -------------------------------------------------
    // COUNT OTHER ENTRIES
    // -------------------------------------------------

    const existingPeriodCount =
      await Timetable.countDocuments({
        _id: {
          $ne: timetable._id,
        },
        academicYear: newYear,
        class: newClass,
        section: newSection,
        subject: newSubject,
        active: true,
      });

    if (
      existingPeriodCount >=
      weeklyPeriod.periodsPerWeek
    ) {
      return res.status(409).json({
        success: false,
        conflict:
          "WEEKLY_PERIOD_LIMIT",
        message:
          `${weeklyPeriod.periodsPerWeek} weekly periods are already assigned for this subject`,
      });
    }

    // =================================================
    // UPDATE
    // =================================================

    timetable.academicYear =
      newYear;

    timetable.class =
      newClass;

    timetable.section =
      newSection;

    timetable.day =
      newDay;

    timetable.timeSlot =
      newTimeSlot;

    timetable.subject =
      newSubject;

    timetable.teacher =
      newTeacher;

    timetable.roomNo =
      newRoom;

    if (
      remarks !== undefined
    ) {
      timetable.remarks =
        remarks.trim();
    }

    if (
      active !== undefined
    ) {
      timetable.active =
        active;
    }

    await timetable.save();

    const populated =
      await timetable.populate(
        populateFields
      );

    return res.status(200).json({
      success: true,
      message:
        "Timetable updated successfully",
      timetable: populated,
    });
  } catch (error) {
    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        conflict:
          "TIMETABLE_CONFLICT",
        message:
          "A timetable entry already exists for this class or teacher at the selected time",
      });
    }

    if (
      error.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid timetable reference",
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

const deleteTimetable = async (
  req,
  res
) => {
  try {
    const timetable =
      await Timetable.findById(
        req.params.id
      );

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message:
          "Timetable not found",
      });
    }

    await Timetable.findByIdAndDelete(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message:
        "Timetable removed successfully",
    });
  } catch (error) {
    if (
      error.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid timetable ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createTimetable,
  getAllTimetable,
  getTimetableById,
  getTimetableBySection,
  getTimetableByTeacher,
  updateTimetable,
  deleteTimetable,
};