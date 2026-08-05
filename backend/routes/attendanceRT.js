const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getAttendanceForDate, saveAttendance, getStudentAttendance } = require("../controllers/attendanceController");

router.use(protect);

router.get("/date", getAttendanceForDate); // ?academicYear=&class=&section=&date=
router.post("/save", saveAttendance);
router.get("/student/:studentId", getStudentAttendance); // ?month=&year=

module.exports = router;