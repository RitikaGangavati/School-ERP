const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
  createTimeSlot,
  getAllTimeSlots,
  getTimeSlotById,
  updateTimeSlot,
  deleteTimeSlot,
} = require("../controllers/timeSlotController");

router.use(protect);

router.post("/create", authorize("Super Admin", "Admin"), createTimeSlot);
router.get("/list", authorize("Super Admin", "Admin"), getAllTimeSlots);
router.get("/details/:id", authorize("Super Admin", "Admin"), getTimeSlotById);
router.put("/update/:id", authorize("Super Admin", "Admin"), updateTimeSlot);
router.delete("/delete/:id", authorize("Super Admin", "Admin"), deleteTimeSlot);

module.exports = router;