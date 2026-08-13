const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { getAttendanceForDate, saveAttendance, getStudentAttendance } = require("../controllers/attendanceController");

router.use(protect);

router.get("/date", authorize("Super Admin", "Admin"), getAttendanceForDate); // ?academicYear=&class=&section=&date=
router.post("/save", authorize("Super Admin", "Admin"), saveAttendance);
router.get("/student/:studentId", authorize("Super Admin", "Admin"), getStudentAttendance); // ?month=&year=

module.exports = router;