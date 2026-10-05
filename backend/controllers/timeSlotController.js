const TimeSlot = require("../models/timeSlotModel");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const checkDuplicate = require("../utils/checkDuplicate");

// Create Time Slot
const createTimeSlot = asyncHandler(async (req, res) => {
  const { periodName, startTime, endTime, type, displayOrder, active } = req.body;

  await checkDuplicate(TimeSlot, { periodName }, "Period name already exists");
  await checkDuplicate(TimeSlot, { displayOrder }, "Display order already exists");

  const timeSlot = await TimeSlot.create({
    periodName,
    startTime,
    endTime,
    type,
    displayOrder,
    active,
  });

  return sendResponse(res, 201, "Time slot created successfully", { timeSlot });
});

// Get All Time Slots
const getAllTimeSlots = asyncHandler(async (req, res) => {
  const timeSlots = await TimeSlot.find().sort({ displayOrder: 1 });

  return sendResponse(res, 200, "Time slots fetched successfully", { timeSlots });
});

// Get Single Time Slot
const getTimeSlotById = asyncHandler(async (req, res) => {
  const timeSlot = await TimeSlot.findById(req.params.id);

  if (!timeSlot) {
    throw new ApiError(404, "Time slot not found");
  }

  return sendResponse(res, 200, "Time slot fetched successfully", { timeSlot });
});

// Update Time Slot
const updateTimeSlot = asyncHandler(async (req, res) => {
  const { periodName, startTime, endTime, type, displayOrder, active } = req.body;

  const timeSlot = await TimeSlot.findById(req.params.id);
  if (!timeSlot) {
    throw new ApiError(404, "Time slot not found");
  }

  if (periodName && periodName !== timeSlot.periodName) {
    await checkDuplicate(TimeSlot, { periodName }, "Period name already exists", timeSlot._id);
  }

  if (displayOrder !== undefined && displayOrder !== timeSlot.displayOrder) {
    await checkDuplicate(TimeSlot, { displayOrder }, "Display order already exists", timeSlot._id);
  }

  if (periodName !== undefined) timeSlot.periodName = periodName;
  if (startTime !== undefined) timeSlot.startTime = startTime;
  if (endTime !== undefined) timeSlot.endTime = endTime;
  if (type !== undefined) timeSlot.type = type;
  if (displayOrder !== undefined) timeSlot.displayOrder = displayOrder;
  if (active !== undefined) timeSlot.active = active;

  await timeSlot.save();

  return sendResponse(res, 200, "Time slot updated successfully", { timeSlot });
});

// Delete Time Slot
const deleteTimeSlot = asyncHandler(async (req, res) => {
  const timeSlot = await TimeSlot.findByIdAndDelete(req.params.id);

  if (!timeSlot) {
    throw new ApiError(404, "Time slot not found");
  }

  return sendResponse(res, 200, "Time slot deleted successfully");
});

module.exports = {
  createTimeSlot,
  getAllTimeSlots,
  getTimeSlotById,
  updateTimeSlot,
  deleteTimeSlot,
};