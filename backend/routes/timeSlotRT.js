const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");

const {
  createTimeSlotSchema,
  updateTimeSlotSchema,
  idParamSchema,
} = require("../validators/timeSlotValidator");

const {
  createTimeSlot,
  getAllTimeSlots,
  getTimeSlotById,
  updateTimeSlot,
  deleteTimeSlot,
} = require("../controllers/timeSlotController");

router.use(protect);

router.post(
  "/create",
  authorize("Super Admin", "Admin"),
  validate(createTimeSlotSchema, "body"),
  createTimeSlot,
);

router.get("/list", authorize("Super Admin", "Admin"), getAllTimeSlots);

router.get(
  "/details/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  getTimeSlotById,
);

router.put(
  "/update/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  validate(updateTimeSlotSchema, "body"),
  updateTimeSlot,
);

router.delete(
  "/delete/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  deleteTimeSlot,
);

module.exports = router;
