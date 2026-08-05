const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  createTimetable,
  updateTimetable,
  deleteTimetable,
  getTimetable,
  getTimetableById,
  generateTimetable,
} = require("../controllers/timeTableController");

router.use(protect);

router.post("/create", createTimetable);
router.post("/generate", generateTimetable);
router.get("/filter", getTimetable);
router.get("/details/:id", getTimetableById);
router.put("/update/:id", updateTimetable);
router.delete("/delete/:id", deleteTimetable);

module.exports = router;