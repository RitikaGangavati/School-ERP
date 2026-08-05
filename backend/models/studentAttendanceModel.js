const mongoose = require("mongoose");

const studentAttendanceSchema = new mongoose.Schema(
  {
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Present", "Absent", "Half Day", "Leave"],
      required: true,
      default: "Present",
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// One attendance record per student per day — hard stop against double-marking
studentAttendanceSchema.index({ student: 1, date: 1 }, { unique: true });

// Fast lookup when a teacher opens "today's register for Class 5 - A"
studentAttendanceSchema.index({ class: 1, section: 1, date: 1 });

module.exports = mongoose.model("StudentAttendance", studentAttendanceSchema);