const Timetable = require("../models/timeTableModel");
const SubjectTeacher = require("../models/subjectTeacherModel");
const SubjectWeeklyPeriod = require("../models/subjectWeeklyPeriodModel");
const TimeSlot = require("../models/timeSlotModel");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const { getPagination, paginateQuery } = require("../utils/paginate");

const populateFields = [
  { path: "academicYear", select: "name" },
  { path: "class", select: "className" },
  { path: "section", select: "sectionName" },
  { path: "timeSlot", select: "periodName startTime endTime type displayOrder" },
  { path: "subject", select: "subjectName" },
  { path: "teacher", select: "firstName lastName employeeId" },
];

// CREATE
const createTimetable = asyncHandler(async (req, res) => {
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

  // 1. TIME SLOT CHECK
  const selectedTimeSlot = await TimeSlot.findOne({ _id: timeSlot, active: true });
  if (!selectedTimeSlot) {
    throw new ApiError(404, "Selected time slot not found or inactive");
  }

  if (selectedTimeSlot.type === "Break" || selectedTimeSlot.type === "Lunch") {
    const err = new ApiError(400, "A subject cannot be assigned to a break or lunch time slot");
    err.conflict = "INVALID_TIME_SLOT";
    throw err;
  }

  // 2. CLASS CONFLICT
  const classConflict = await Timetable.findOne({
    academicYear,
    class: classId,
    section,
    day,
    timeSlot,
    active: true,
  });

  if (classConflict) {
    const err = new ApiError(
      409,
      "This class already has a subject assigned for the selected day and time slot"
    );
    err.conflict = "CLASS_CONFLICT";
    throw err;
  }

  // 3. TEACHER CONFLICT
  const teacherConflict = await Timetable.findOne({
    academicYear,
    teacher,
    day,
    timeSlot,
    active: true,
  });

  if (teacherConflict) {
    const err = new ApiError(
      409,
      "This teacher is already assigned to another class for the selected day and time slot"
    );
    err.conflict = "TEACHER_CONFLICT";
    throw err;
  }

  // 4. ROOM CONFLICT
  if (roomNo) {
    const roomConflict = await Timetable.findOne({
      academicYear,
      roomNo,
      day,
      timeSlot,
      active: true,
    });

    if (roomConflict) {
      const err = new ApiError(409, "This room is already occupied for the selected day and time slot");
      err.conflict = "ROOM_CONFLICT";
      throw err;
    }
  }

  // 5. SUBJECT TEACHER VALIDATION
  const subjectTeacher = await SubjectTeacher.findOne({
    academicYear,
    class: classId,
    section,
    subject,
    teacher,
  });

  if (!subjectTeacher) {
    const err = new ApiError(
      400,
      "This teacher is not assigned to this subject for the selected class and section"
    );
    err.conflict = "INVALID_SUBJECT_TEACHER";
    throw err;
  }

  // 6. WEEKLY PERIOD CONFIGURATION
  const weeklyPeriod = await SubjectWeeklyPeriod.findOne({
    academicYear,
    class: classId,
    section,
    subject,
    active: true,
  });

  if (!weeklyPeriod) {
    const err = new ApiError(400, "Weekly period setting is not configured for this subject and section");
    err.conflict = "WEEKLY_PERIOD_NOT_CONFIGURED";
    throw err;
  }

  // 7. WEEKLY PERIOD LIMIT
  const existingPeriodCount = await Timetable.countDocuments({
    academicYear,
    class: classId,
    section,
    subject,
    active: true,
  });

  if (existingPeriodCount >= weeklyPeriod.periodsPerWeek) {
    const err = new ApiError(409, `${weeklyPeriod.periodsPerWeek} weekly periods are already assigned for this subject`);
    err.conflict = "WEEKLY_PERIOD_LIMIT";
    throw err;
  }

  // CREATE
  const timetable = await Timetable.create({
    academicYear,
    class: classId,
    section,
    day,
    timeSlot,
    subject,
    teacher,
    roomNo: roomNo || "",
    remarks: remarks || "",
  });

  const populated = await timetable.populate(populateFields);

  return sendResponse(res, 201, "Timetable created successfully", { timetable: populated });
});

// GET ALL
const getAllTimetable = asyncHandler(async (req, res) => {
  const { academicYear, class: classId, section, teacher, day } = req.query;

  const filter = { active: true };
  if (academicYear) filter.academicYear = academicYear;
  if (classId) filter.class = classId;
  if (section) filter.section = section;
  if (teacher) filter.teacher = teacher;
  if (day) filter.day = day;

  const pagination = getPagination(req);

  const { data: timetables, pagination: paginationInfo } = await paginateQuery(
    Timetable,
    filter,
    pagination,
    { populate: populateFields, sort: { day: 1 } }
  );

  return sendResponse(res, 200, "Timetables fetched successfully", {
    timetables,
    pagination: paginationInfo,
  });
});

// GET BY ID
const getTimetableById = asyncHandler(async (req, res) => {
  const timetable = await Timetable.findById(req.params.id).populate(populateFields);

  if (!timetable) {
    throw new ApiError(404, "Timetable not found");
  }

  return sendResponse(res, 200, "Timetable fetched successfully", { timetable });
});

// GET BY CLASS + SECTION
const getTimetableBySection = asyncHandler(async (req, res) => {
  const { academicYear, class: classId, section } = req.query;

  const timetables = await Timetable.find({
    academicYear,
    class: classId,
    section,
    active: true,
  })
    .populate(populateFields)
    .sort({ day: 1, timeSlot: 1 });

  return sendResponse(res, 200, "Timetables fetched successfully", { timetables });
});

// GET BY TEACHER
const getTimetableByTeacher = asyncHandler(async (req, res) => {
  const { academicYear, teacher } = req.query;

  const timetables = await Timetable.find({
    academicYear,
    teacher,
    active: true,
  })
    .populate(populateFields)
    .sort({ day: 1, timeSlot: 1 });

  return sendResponse(res, 200, "Timetables fetched successfully", { timetables });
});

// UPDATE
const updateTimetable = asyncHandler(async (req, res) => {
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

  const timetable = await Timetable.findById(req.params.id);
  if (!timetable) {
    throw new ApiError(404, "Timetable not found");
  }

  const newYear = academicYear ?? timetable.academicYear;
  const newClass = classId ?? timetable.class;
  const newSection = section ?? timetable.section;
  const newDay = day ?? timetable.day;
  const newTimeSlot = timeSlot ?? timetable.timeSlot;
  const newSubject = subject ?? timetable.subject;
  const newTeacher = teacher ?? timetable.teacher;
  const newRoom = roomNo !== undefined ? roomNo : timetable.roomNo;

  // TIME SLOT
  const selectedTimeSlot = await TimeSlot.findOne({ _id: newTimeSlot, active: true });
  if (!selectedTimeSlot) {
    throw new ApiError(404, "Selected time slot not found or inactive");
  }

  if (selectedTimeSlot.type === "Break" || selectedTimeSlot.type === "Lunch") {
    const err = new ApiError(400, "A subject cannot be assigned to a break or lunch time slot");
    err.conflict = "INVALID_TIME_SLOT";
    throw err;
  }

  // CLASS CONFLICT
  const classConflict = await Timetable.findOne({
    _id: { $ne: timetable._id },
    academicYear: newYear,
    class: newClass,
    section: newSection,
    day: newDay,
    timeSlot: newTimeSlot,
    active: true,
  });

  if (classConflict) {
    const err = new ApiError(
      409,
      "This class already has a subject assigned for the selected day and time slot"
    );
    err.conflict = "CLASS_CONFLICT";
    throw err;
  }

  // TEACHER CONFLICT
  const teacherConflict = await Timetable.findOne({
    _id: { $ne: timetable._id },
    academicYear: newYear,
    teacher: newTeacher,
    day: newDay,
    timeSlot: newTimeSlot,
    active: true,
  });

  if (teacherConflict) {
    const err = new ApiError(
      409,
      "This teacher is already assigned to another class for the selected day and time slot"
    );
    err.conflict = "TEACHER_CONFLICT";
    throw err;
  }

  // ROOM CONFLICT
  if (newRoom) {
    const roomConflict = await Timetable.findOne({
      _id: { $ne: timetable._id },
      academicYear: newYear,
      roomNo: newRoom,
      day: newDay,
      timeSlot: newTimeSlot,
      active: true,
    });

    if (roomConflict) {
      const err = new ApiError(409, "This room is already occupied for the selected day and time slot");
      err.conflict = "ROOM_CONFLICT";
      throw err;
    }
  }

  // SUBJECT TEACHER
  const subjectTeacher = await SubjectTeacher.findOne({
    academicYear: newYear,
    class: newClass,
    section: newSection,
    subject: newSubject,
    teacher: newTeacher,
  });

  if (!subjectTeacher) {
    const err = new ApiError(
      400,
      "This teacher is not assigned to this subject for the selected class and section"
    );
    err.conflict = "INVALID_SUBJECT_TEACHER";
    throw err;
  }

  // WEEKLY PERIOD
  const weeklyPeriod = await SubjectWeeklyPeriod.findOne({
    academicYear: newYear,
    class: newClass,
    section: newSection,
    subject: newSubject,
    active: true,
  });

  if (!weeklyPeriod) {
    const err = new ApiError(400, "Weekly period setting is not configured for this subject and section");
    err.conflict = "WEEKLY_PERIOD_NOT_CONFIGURED";
    throw err;
  }

  const existingPeriodCount = await Timetable.countDocuments({
    _id: { $ne: timetable._id },
    academicYear: newYear,
    class: newClass,
    section: newSection,
    subject: newSubject,
    active: true,
  });

  if (existingPeriodCount >= weeklyPeriod.periodsPerWeek) {
    const err = new ApiError(409, `${weeklyPeriod.periodsPerWeek} weekly periods are already assigned for this subject`);
    err.conflict = "WEEKLY_PERIOD_LIMIT";
    throw err;
  }

  // UPDATE
  timetable.academicYear = newYear;
  timetable.class = newClass;
  timetable.section = newSection;
  timetable.day = newDay;
  timetable.timeSlot = newTimeSlot;
  timetable.subject = newSubject;
  timetable.teacher = newTeacher;
  timetable.roomNo = newRoom;

  if (remarks !== undefined) timetable.remarks = remarks;
  if (active !== undefined) timetable.active = active;

  await timetable.save();

  const populated = await timetable.populate(populateFields);

  return sendResponse(res, 200, "Timetable updated successfully", { timetable: populated });
});

// DELETE
const deleteTimetable = asyncHandler(async (req, res) => {
  const timetable = await Timetable.findByIdAndDelete(req.params.id);

  if (!timetable) {
    throw new ApiError(404, "Timetable not found");
  }

  return sendResponse(res, 200, "Timetable removed successfully");
});

module.exports = {
  createTimetable,
  getAllTimetable,
  getTimetableById,
  getTimetableBySection,
  getTimetableByTeacher,
  updateTimetable,
  deleteTimetable,
};