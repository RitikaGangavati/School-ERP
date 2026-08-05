const TimeSlot = require("../models/timeSlotModel");

// Create Time Slot
const createTimeSlot = async (req, res) => {
  try {
    const { periodName, startTime, endTime, type, displayOrder, active } =
      req.body;

    if (!periodName || !startTime || !endTime || displayOrder === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    const existingName = await TimeSlot.findOne({
      periodName: periodName.trim(),
    });

    if (existingName) {
      return res.status(409).json({
        success: false,
        message: "Period name already exists",
      });
    }

    const existingOrder = await TimeSlot.findOne({ displayOrder });

    if (existingOrder) {
      return res.status(409).json({
        success: false,
        message: "Display order already exists",
      });
    }

    const timeSlot = await TimeSlot.create({
      periodName: periodName.trim(),
      startTime,
      endTime,
      type,
      displayOrder,
      active,
    });

    return res.status(201).json({
      success: true,
      message: "Time slot created successfully",
      timeSlot,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate record found",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Time Slots
const getAllTimeSlots = async (req, res) => {
  try {
    const timeSlots = await TimeSlot.find().sort({ displayOrder: 1 });

    return res.status(200).json({
      success: true,
      timeSlots,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single Time Slot
const getTimeSlotById = async (req, res) => {
  try {
    const timeSlot = await TimeSlot.findById(req.params.id);

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found",
      });
    }

    return res.status(200).json({
      success: true,
      timeSlot,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid time slot ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Time Slot
const updateTimeSlot = async (req, res) => {
  try {
    const { periodName, startTime, endTime, type, displayOrder, active } =
      req.body;

    const timeSlot = await TimeSlot.findById(req.params.id);

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found",
      });
    }

    if (
      periodName &&
      periodName.trim() !== timeSlot.periodName
    ) {
      const existing = await TimeSlot.findOne({
        periodName: periodName.trim(),
        _id: { $ne: timeSlot._id },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Period name already exists",
        });
      }
    }

    if (
      displayOrder !== undefined &&
      displayOrder !== timeSlot.displayOrder
    ) {
      const existingOrder = await TimeSlot.findOne({
        displayOrder,
        _id: { $ne: timeSlot._id },
      });

      if (existingOrder) {
        return res.status(409).json({
          success: false,
          message: "Display order already exists",
        });
      }
    }

    if (periodName !== undefined)
      timeSlot.periodName = periodName.trim();

    if (startTime !== undefined)
      timeSlot.startTime = startTime;

    if (endTime !== undefined)
      timeSlot.endTime = endTime;

    if (type !== undefined)
      timeSlot.type = type;

    if (displayOrder !== undefined)
      timeSlot.displayOrder = displayOrder;

    if (active !== undefined)
      timeSlot.active = active;

    await timeSlot.save();

    return res.status(200).json({
      success: true,
      message: "Time slot updated successfully",
      timeSlot,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid time slot ID",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate record found",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Time Slot
const deleteTimeSlot = async (req, res) => {
  try {
    const timeSlot = await TimeSlot.findByIdAndDelete(req.params.id);

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Time slot deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid time slot ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createTimeSlot,
  getAllTimeSlots,
  getTimeSlotById,
  updateTimeSlot,
  deleteTimeSlot,
};