const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");

const {
  getAttendanceForDateSchema,
  saveAttendanceSchema,
  studentIdParamSchema,
  studentAttendanceQuerySchema,
} = require("../validators/attendanceValidator");

const {
  getAttendanceForDate,
  saveAttendance,
  getStudentAttendance,
} = require("../controllers/attendanceController");

router.use(protect);

router.get(
  "/date",
  authorize("Super Admin", "Admin"),
  validate(getAttendanceForDateSchema, "query"),
  getAttendanceForDate
);

router.post(
  "/save",
  authorize("Super Admin", "Admin"),
  validate(saveAttendanceSchema, "body"),
  saveAttendance
);

router.get(
  "/student/:studentId",
  authorize("Super Admin", "Admin"),
  validate(studentIdParamSchema, "params"),
  validate(studentAttendanceQuerySchema, "query"),
  getStudentAttendance
);

module.exports = router;