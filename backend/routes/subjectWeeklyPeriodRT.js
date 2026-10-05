const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");

const {
  createSubjectWeeklyPeriodSchema,
  updateSubjectWeeklyPeriodSchema,
  bySectionQuerySchema,
  idParamSchema,
} = require("../validators/subjectWeeklyPeriodValidator");

const {
  createSubjectWeeklyPeriod,
  getAllSubjectWeeklyPeriods,
  getSubjectWeeklyPeriodById,
  getSubjectWeeklyPeriodsBySection,
  updateSubjectWeeklyPeriod,
  deleteSubjectWeeklyPeriod,
} = require("../controllers/subjectWeeklyPeriodController");

router.use(protect);

router.post(
  "/create",
  authorize("Super Admin", "Admin"),
  validate(createSubjectWeeklyPeriodSchema, "body"),
  createSubjectWeeklyPeriod,
);

router.get(
  "/list",
  authorize("Super Admin", "Admin"),
  getAllSubjectWeeklyPeriods,
);

router.get(
  "/by-section",
  authorize("Super Admin", "Admin"),
  validate(bySectionQuerySchema, "query"),
  getSubjectWeeklyPeriodsBySection,
);

router.get(
  "/details/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  getSubjectWeeklyPeriodById,
);

router.put(
  "/update/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  validate(updateSubjectWeeklyPeriodSchema, "body"),
  updateSubjectWeeklyPeriod,
);

router.delete(
  "/delete/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  deleteSubjectWeeklyPeriod,
);

module.exports = router;
