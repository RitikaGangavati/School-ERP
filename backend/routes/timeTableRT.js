const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");

const {
  createTimetableSchema,
  updateTimetableSchema,
  bySectionQuerySchema,
  byTeacherQuerySchema,
  idParamSchema,
} = require("../validators/timetableValidator");

const {
  createTimetable,
  getAllTimetable,
  getTimetableById,
  getTimetableBySection,
  getTimetableByTeacher,
  updateTimetable,
  deleteTimetable,
} = require("../controllers/timeTableController");

router.use(protect);

router.post(
  "/create",
  authorize("Super Admin", "Admin"),
  validate(createTimetableSchema, "body"),
  createTimetable
);

router.get("/list", authorize("Super Admin", "Admin"), getAllTimetable);

// IMPORTANT: fixed-path routes (/by-section, /by-teacher) must come BEFORE /details/:id
router.get(
  "/by-section",
  authorize("Super Admin", "Admin"),
  validate(bySectionQuerySchema, "query"),
  getTimetableBySection
);

router.get(
  "/by-teacher",
  authorize("Super Admin", "Admin"),
  validate(byTeacherQuerySchema, "query"),
  getTimetableByTeacher
);

router.get(
  "/details/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  getTimetableById
);

router.put(
  "/update/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  validate(updateTimetableSchema, "body"),
  updateTimetable
);

router.delete(
  "/delete/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  deleteTimetable
);

module.exports = router;