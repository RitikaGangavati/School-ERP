const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema(
  {
    periodName: {
      type: String,
      required: true,
      trim: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["Period", "Break", "Lunch"],
      default: "Period",
    },

    displayOrder: {
      type: Number,
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate period names
timeSlotSchema.index({ periodName: 1 }, { unique: true });

// Prevent duplicate display order
timeSlotSchema.index({ displayOrder: 1 }, { unique: true });

module.exports = mongoose.model("TimeSlot", timeSlotSchema);