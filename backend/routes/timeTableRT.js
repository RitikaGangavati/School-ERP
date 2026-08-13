const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  createTimetable,
  getAllTimetable,
  getTimetableById,
  getTimetableBySection,
  getTimetableByTeacher,
  updateTimetable,
  deleteTimetable,
} = require("../controllers/timetableController");

router.use(protect);

router.post("/create", authorize("Super Admin", "Admin"), createTimetable);
router.get("/list", authorize("Super Admin", "Admin"), getAllTimetable);
router.get("/details/:id", authorize("Super Admin", "Admin"), getTimetableById );
router.get("/by-section", authorize("Super Admin", "Admin"), getTimetableBySection);
router.get("/by-teacher", authorize("Super Admin", "Admin"), getTimetableByTeacher);
router.put("/update/:id", authorize("Super Admin", "Admin"), updateTimetable);
router.delete("/delete/:id", authorize("Super Admin", "Admin"), deleteTimetable);

module.exports = router;