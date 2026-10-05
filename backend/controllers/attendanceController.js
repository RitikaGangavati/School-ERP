const Attendance = require("../models/attendanceModel");
const Student = require("../models/studentModel");
const AcademicYear = require("../models/academicYearModel");
const Class = require("../models/classModel");
const Section = require("../models/sectionModel");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const { getPagination, paginateQuery } = require("../utils/paginate");
const { toDayStart, todayIST } = require("../utils/dateHelpers");

// Validates academicYear/class/section actually exist (exists() fetches only the _id)
const validateContext = async (academicYear, classId, section) => {
  const [yearExists, classExists, sectionExists] = await Promise.all([
    AcademicYear.exists({ _id: academicYear }),
    Class.exists({ _id: classId }),
    Section.exists({ _id: section }),
  ]);

  if (!yearExists) throw new ApiError(404, "Academic year not found");
  if (!classExists) throw new ApiError(404, "Class not found");
  if (!sectionExists) throw new ApiError(404, "Section not found");
};

// Get the class roster + any existing attendance for a given date (loads the grid)
const getAttendanceForDate = asyncHandler(async (req, res) => {
  const { academicYear, class: classId, section, date } = req.query;

  await validateContext(academicYear, classId, section);

  // Block future dates (compared as YYYY-MM-DD strings, in India time)
  if (date > todayIST()) {
    throw new ApiError(400, "Cannot view or mark attendance for a future date");
  }

  const students = await Student.find({
    "academic.academicYear": academicYear,
    "academic.class": classId,
    "academic.section": section,
    "academic.status": "Active",
  })
    .select("personal.firstName personal.lastName academic.rollNo academic.admissionNumber")
    .sort({ "academic.rollNo": 1 })
    .lean();

  const existingRecords = await Attendance.find({
    student: { $in: students.map((s) => s._id) },
    date: toDayStart(date),
  })
    .select("student status remarks")
    .lean();

  const attendanceMap = {};
  existingRecords.forEach((rec) => {
    attendanceMap[rec.student.toString()] = { status: rec.status, remarks: rec.remarks };
  });

  return sendResponse(res, 200, "Attendance data fetched successfully", {
    students,
    attendance: attendanceMap,
  });
});

// Save attendance for the students sent (can be all of them, or just some)
const saveAttendance = asyncHandler(async (req, res) => {
  const { academicYear, class: classId, section, date, records } = req.body;

  await validateContext(academicYear, classId, section);

  if (date > todayIST()) {
    throw new ApiError(400, "Cannot mark attendance for a future date");
  }

  // If the same student appears twice, the last entry wins
  const recordByStudent = new Map();
  records.forEach((r) => recordByStudent.set(r.student, r));
  const uniqueRecords = [...recordByStudent.values()];
  const studentIds = uniqueRecords.map((r) => r.student);

  // Every student must exist, be Active, AND belong to the stated class/section/year
  const validStudents = await Student.find({
    _id: { $in: studentIds },
    "academic.academicYear": academicYear,
    "academic.class": classId,
    "academic.section": section,
    "academic.status": "Active",
  })
    .select("_id")
    .lean();

  const validStudentIds = new Set(validStudents.map((s) => s._id.toString()));
  const invalidIds = studentIds.filter((id) => !validStudentIds.has(id));

  if (invalidIds.length > 0) {
    throw new ApiError(
      400,
      `${invalidIds.length} student(s) are not active members of the selected class/section/year — attendance was not saved`
    );
  }

  const dayStart = toDayStart(date);

  // One round trip for all students, instead of one per student
  const ops = uniqueRecords.map((item) => ({
    updateOne: {
      filter: { student: item.student, date: dayStart },
      update: {
        $set: {
          academicYear,
          class: classId,
          section,
          status: item.status,
          remarks: item.remarks || "",
          markedBy: req.user?._id || null,
        },
      },
      upsert: true,
    },
  }));

  const result = await Attendance.bulkWrite(ops, { ordered: false });

  return sendResponse(res, 200, `Attendance saved for ${uniqueRecords.length} student(s)`, {
    saved: uniqueRecords.length,
    created: result.upsertedCount,
    updated: result.modifiedCount,
  });
});

// Get one student's attendance history (for their profile view)
const getStudentAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { month, year } = req.query;

  const student = await Student.findById(studentId).select("_id").lean();
  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const filter = { student: student._id };

  if (month && year) {
    // UTC month boundaries, matching how attendance days are stored
    filter.date = {
      $gte: new Date(Date.UTC(year, month - 1, 1)),
      $lt: new Date(Date.UTC(year, month, 1)),
    };
  }

  const pagination = getPagination(req);

  // Page of records + summary over ALL matching records, in parallel
  const [{ data: records, pagination: paginationInfo }, statusCounts] = await Promise.all([
    paginateQuery(Attendance, filter, pagination, { sort: { date: -1 } }),
    Attendance.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const summary = { Present: 0, Absent: 0, Late: 0, "Half Day": 0, Leave: 0 };
  statusCounts.forEach(({ _id, count }) => {
    summary[_id] = count;
  });

  return sendResponse(res, 200, "Attendance history fetched successfully", {
    records,
    summary,
    pagination: paginationInfo,
  });
});

module.exports = { getAttendanceForDate, saveAttendance, getStudentAttendance };