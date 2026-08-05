const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  createTimeSlot,
  getAllTimeSlots,
  getTimeSlotById,
  updateTimeSlot,
  deleteTimeSlot,
} = require("../controllers/timeSlotController");

router.use(protect);

router.post("/create", createTimeSlot);
router.get("/list", getAllTimeSlots);
router.get("/details/:id", getTimeSlotById);
router.put("/update/:id", updateTimeSlot);
router.delete("/delete/:id", deleteTimeSlot);

module.exports = router;