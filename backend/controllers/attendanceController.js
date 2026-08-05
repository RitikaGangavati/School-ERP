const Attendance = require("../models/attendanceModel");
const Student = require("../models/studentModel");

const populateFields = [
  { path: "student", select: "personal.firstName personal.lastName academic.rollNo academic.admissionNumber" },
];

// Get the class roster + any existing attendance for a given date (loads the grid)
const getAttendanceForDate = async (req, res) => {
  try {
    const { academicYear, class: classId, section, date } = req.query;

    if (!academicYear || !classId || !section || !date) {
      return res.status(400).json({
        success: false,
        message: "Academic year, class, section, and date are required",
      });
    }

    const students = await Student.find({
      "academic.academicYear": academicYear,
      "academic.class": classId,
      "academic.section": section,
      "academic.status": "Active",
    })
      .select("personal.firstName personal.lastName academic.rollNo academic.admissionNumber")
      .sort({ "academic.rollNo": 1 });

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const existingRecords = await Attendance.find({
      student: { $in: students.map((s) => s._id) },
      date: { $gte: dayStart, $lte: dayEnd },
    });

    const attendanceMap = {};
    existingRecords.forEach((rec) => {
      attendanceMap[rec.student.toString()] = { status: rec.status, remarks: rec.remarks };
    });

    return res.status(200).json({
      success: true,
      students,
      attendance: attendanceMap,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk save the whole day's attendance in one go
const saveAttendance = async (req, res) => {
  try {
    const { academicYear, class: classId, section, date, records } = req.body;

    if (!academicYear || !classId || !section || !date || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: "Academic year, class, section, date, and records are required",
      });
    }

    const validRecords = records.filter((r) => r.student && r.status);

    if (validRecords.length === 0) {
      return res.status(400).json({ success: false, message: "No attendance records to save" });
    }

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const savedRecords = [];
    for (const item of validRecords) {
      const saved = await Attendance.findOneAndUpdate(
        { student: item.student, date: dayStart },
        {
          academicYear,
          class: classId,
          section,
          status: item.status,
          remarks: item.remarks || "",
          markedBy: req.user?._id || null,
        },
        { new: true, upsert: true, runValidators: true }
      );
      savedRecords.push(saved);
    }

    return res.status(200).json({
      success: true,
      message: `Attendance saved for ${savedRecords.length} student(s)`,
      count: savedRecords.length,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0]?.message;
      return res.status(400).json({ success: false, message: firstError || "Invalid attendance data" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get one student's attendance history (for their profile view)
const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;

    const filter = { student: studentId };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(filter).sort({ date: -1 });

    const summary = {
      Present: records.filter((r) => r.status === "Present").length,
      Absent: records.filter((r) => r.status === "Absent").length,
      Late: records.filter((r) => r.status === "Late").length,
      "Half Day": records.filter((r) => r.status === "Half Day").length,
      Leave: records.filter((r) => r.status === "Leave").length,
    };

    return res.status(200).json({ success: true, records, summary });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAttendanceForDate, saveAttendance, getStudentAttendance };