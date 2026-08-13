const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
  createSubjectWeeklyPeriod,
  getAllSubjectWeeklyPeriods,
  getSubjectWeeklyPeriodById,
  getSubjectWeeklyPeriodsBySection,
  updateSubjectWeeklyPeriod,
  deleteSubjectWeeklyPeriod,
} = require("../controllers/subjectWeeklyPeriodController");

router.use(protect);

router.post("/create", authorize("Super Admin", "Admin"), createSubjectWeeklyPeriod);
router.get("/list", authorize("Super Admin", "Admin"), getAllSubjectWeeklyPeriods);
router.get("/by-section", authorize("Super Admin", "Admin"), getSubjectWeeklyPeriodsBySection);
router.get("/details/:id", authorize("Super Admin", "Admin"), getSubjectWeeklyPeriodById);
router.put("/update/:id", authorize("Super Admin", "Admin"), updateSubjectWeeklyPeriod);
router.delete("/delete/:id", authorize("Super Admin", "Admin"), deleteSubjectWeeklyPeriod);

module.exports = router;